// Bundled into the Cloudflare edition only. Secrets stay in Cloudflare bindings.
const CITIES=__DELIVERY_CITIES__;
const INITIAL=__DELIVERY_INITIAL__;
const ADMIN_HTML=__DELIVERY_ADMIN_HTML__;
const PLACES=new Map(CITIES.map(place=>[place.id,place]));
const COOKIE='__Host-jimo_delivery';
const ready=new WeakMap();
const DAY=86400000;
function json(data,status=200,headers={}){return Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer',...headers}});}
function problem(message,status){throw Object.assign(new Error(message),{status});}
async function digest(value){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))),n=>n.toString(16).padStart(2,'0')).join('');}
function equal(a,b){if(a.length!==b.length)return false;let difference=0;for(let i=0;i<a.length;i++)difference|=a.charCodeAt(i)^b.charCodeAt(i);return difference===0;}
async function database(env){
 if(!env.DELIVERY_DB)problem('更新页还未完成启用，请稍后再试。',503);
 const db=env.DELIVERY_DB;
 if(!ready.has(db))ready.set(db,db.batch([
  db.prepare('CREATE TABLE IF NOT EXISTS gift_state (id INTEGER PRIMARY KEY CHECK(id=1),revision INTEGER NOT NULL,data TEXT NOT NULL)'),
  db.prepare('CREATE TABLE IF NOT EXISTS gift_sessions (token TEXT PRIMARY KEY,credential TEXT NOT NULL,expires INTEGER NOT NULL)'),
  db.prepare('CREATE TABLE IF NOT EXISTS gift_login_attempts (id TEXT PRIMARY KEY,count INTEGER NOT NULL,expires INTEGER NOT NULL)'),
  db.prepare('INSERT OR IGNORE INTO gift_state (id,revision,data) VALUES (1,0,?)').bind(JSON.stringify(INITIAL))
 ]).catch(error=>{ready.delete(db);throw error;}));
 await ready.get(db);return db;
}
async function readState(db){const row=await db.prepare('SELECT revision,data FROM gift_state WHERE id=1').first();return {...JSON.parse(row.data),revision:row.revision};}
function cookie(value,age){return COOKIE+'='+value+'; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age='+age;}
async function authorized(request,env,db){
 const value=(request.headers.get('Cookie')||'').split(';').map(s=>s.trim()).find(s=>s.startsWith(COOKIE+'='))?.slice(COOKIE.length+1);
 if(!value||!/^[a-f0-9]{64}$/.test(value)||!env.DELIVERY_ADMIN_PASSWORD||env.DELIVERY_ADMIN_PASSWORD.length<16)return false;
 const row=await db.prepare('SELECT credential,expires FROM gift_sessions WHERE token=?').bind(await digest(value)).first();
 return !!row&&row.expires>Date.now()&&equal(row.credential,await digest(env.DELIVERY_ADMIN_PASSWORD));
}
async function body(request){
 if(!request.headers.get('Content-Type')?.startsWith('application/json'))problem('请重新打开更新页后再试。',415);
 if(Number(request.headers.get('Content-Length')||0)>4096)problem('填写内容过长。',413);
 const reader=request.body?.getReader();if(!reader)problem('填写内容不能为空。',400);
 const chunks=[];let length=0;
 while(true){const {value,done}=await reader.read();if(done)break;length+=value.byteLength;if(length>4096){await reader.cancel();problem('填写内容过长。',413);}chunks.push(value);}
 const buffer=new Uint8Array(length);let offset=0;for(const chunk of chunks){buffer.set(chunk,offset);offset+=chunk.byteLength;}const raw=new TextDecoder().decode(buffer);
 try{return JSON.parse(raw);}catch{problem('没有读懂填写内容，请重试。',400);}
}
function sameOrigin(request){return request.headers.get('Origin')===new URL(request.url).origin;}
function place(id){return PLACES.get(id);}
async function login(request,env,db){
 if(!env.DELIVERY_ADMIN_PASSWORD||env.DELIVERY_ADMIN_PASSWORD.length<16)problem('更新页还未完成管理员设置。',503);
 const input=await body(request),now=Date.now();
 const client=await digest(env.DELIVERY_ADMIN_PASSWORD+':'+(request.headers.get('CF-Connecting-IP')||'local'));
 const attempts=await db.prepare('SELECT count,expires FROM gift_login_attempts WHERE id=?').bind(client).first();
 if(attempts&&attempts.expires>now&&attempts.count>=5)problem('试的次数有点多，请 15 分钟后再试。',429);
 if(typeof input.password!=='string'||input.password.length>256||!equal(await digest(input.password),await digest(env.DELIVERY_ADMIN_PASSWORD))){
  await db.prepare('INSERT INTO gift_login_attempts (id,count,expires) VALUES (?,1,?) ON CONFLICT(id) DO UPDATE SET count=CASE WHEN expires>? THEN count+1 ELSE 1 END,expires=CASE WHEN expires>? THEN expires ELSE excluded.expires END').bind(client,now+900000,now,now).run();
  problem('密码不对，再确认一下。',401);
 }
 const token=Array.from(crypto.getRandomValues(new Uint8Array(32)),n=>n.toString(16).padStart(2,'0')).join('');
 await db.batch([
  db.prepare('DELETE FROM gift_login_attempts WHERE id=? OR expires<?').bind(client,now),
  db.prepare('DELETE FROM gift_sessions WHERE expires<?').bind(now),
  db.prepare('INSERT INTO gift_sessions (token,credential,expires) VALUES (?,?,?)').bind(await digest(token),await digest(env.DELIVERY_ADMIN_PASSWORD),now+7*DAY)
 ]);
 return json({ok:true},200,{'Set-Cookie':cookie(token,7*86400)});
}
async function save(request,env,db){
 const input=await body(request),current=await readState(db);
 if(!input||typeof input.id!=='string'||!/^[a-f0-9-]{36}$/.test(input.id))problem('请重新打开更新页后再试。',400);
 if(current.events.some(event=>event.id===input.id))return json(current);
 if(!Number.isInteger(input.revision)||input.revision!==current.revision)problem('记录已经更新过啦。请刷新后重新确认，避免覆盖上一条记录。',409);
 const selected=place(input.placeId),next=place(input.nextPlaceId),destination=place(input.destinationId);
 if(!selected||!destination||(input.nextPlaceId&&!next))problem('请从列表中选择城市。',400);
 if(next?.id===selected.id&&input.status!=='delivered')problem('下一站请选择其他城市，暂时不确定可以不填。',400);
 if(!['pending','in_transit','out_for_delivery','delivered'].includes(input.status))problem('请选择配送状态。',400);
 if(input.status==='delivered'&&input.confirmDelivered!==true)problem('请先确认白白已经收到礼物。',400);
 if(input.status==='delivered'&&selected.id!==destination.id)problem('标记送达时，请把当前城市设为收货城市。',400);
 if(current.status==='delivered'&&input.status!=='delivered'&&input.confirmReopen!==true)problem('这份礼物已标记送达，请确认是否更正状态。',400);
 const time=typeof input.occurredAt==='string'?Date.parse(input.occurredAt):NaN;
 if(!Number.isFinite(time)||time>Date.now()+300000||time<Date.now()-180*DAY)problem('请确认物流发生时间，按北京时间填写。',400);
 const lastTime=Math.max(0,...current.events.map(event=>Date.parse(event.time)||0));
 if(time<lastTime)problem('这条记录的时间早于上一条，请确认北京时间。',400);
 const note=typeof input.note==='string'?input.note.trim():'';
 if(note.length>120)problem('备注最多填写 120 个字。',400);
 if(/(?:\+?86[ -]?)?1[3-9](?:[ -]?\d){9}/.test(note))problem('备注会显示给访客，请不要填写电话号码。',400);
 const defaults={pending:'鸡毛已经收好这份心意，准备出发。',in_transit:'礼物到'+selected.name+'啦，鸡毛继续向白白赶来。',out_for_delivery:'鸡毛正在走最后一程，礼物很快就到白白身边。',delivered:'白白大王的礼物已经送达，记得拆开这份偏爱。'};
 const event={id:input.id,time:new Date(time).toISOString(),city:selected.name,placeId:selected.id,longitude:selected.longitude,latitude:selected.latitude,description:note||defaults[input.status],status:input.status};
 const data={waybill:INITIAL.waybill,source:'jimo-confirmed',status:input.status,origin:INITIAL.origin,current:{...selected,city:selected.name},nextStop:input.status==='delivered'?null:next?{...next,city:next.name}:null,destination:{...destination,city:destination.name},updatedAt:new Date().toISOString(),events:[...current.events,event].slice(-100)};
 const result=await db.prepare('UPDATE gift_state SET data=?,revision=revision+1 WHERE id=1 AND revision=?').bind(JSON.stringify(data),current.revision).run();
 if(result.meta.changes!==1)problem('另一条记录刚刚保存，请刷新后再试。',409);
 return json({...data,revision:current.revision+1});
}
export default {
 async fetch(request,env){
  const url=new URL(request.url),path=url.pathname;
  if(path==='/api/gift-tracking'||path.startsWith('/api/delivery/')){
   try{
    if(!['GET','POST','PUT'].includes(request.method))return json({error:'不支持这个操作。'},405,{'Allow':'GET, POST, PUT'});
    if(request.method!=='GET'&&!sameOrigin(request))return json({error:'请从更新页内操作。'},403);
    const db=await database(env);
    if(path==='/api/gift-tracking'&&request.method==='GET')return json(await readState(db));
    if(path==='/api/delivery/login'&&request.method==='POST')return await login(request,env,db);
    if(!await authorized(request,env,db))return json({error:'请先登录鸡毛的更新页。'},401);
    if(path==='/api/delivery/admin'&&request.method==='GET')return json({tracking:await readState(db),cities:CITIES});
    if(path==='/api/delivery/update'&&request.method==='PUT')return await save(request,env,db);
    if(path==='/api/delivery/logout'&&request.method==='POST'){
     const token=(request.headers.get('Cookie')||'').split(';').map(s=>s.trim()).find(s=>s.startsWith(COOKIE+'='))?.slice(COOKIE.length+1);
     if(token)await db.prepare('DELETE FROM gift_sessions WHERE token=?').bind(await digest(token)).run();
     return json({ok:true},200,{'Set-Cookie':cookie('',0)});
    }
    return json({error:'没有找到这个入口。'},404);
   }catch(error){return json({error:error.status?error.message:'暂时没有保存成功，请稍后再试。'},error.status||503);}
  }
  if(path==='/gift-admin'||path==='/gift-admin/'||path==='/gift-admin.html'){
   // Serve the bundled page directly, avoiding Pages' .html canonical redirects.
   const response=new Response(ADMIN_HTML,{headers:{'Content-Type':'text/html; charset=utf-8'}});
   const headers=new Headers(response.headers);headers.set('Cache-Control','no-store');headers.set('X-Robots-Tag','noindex, nofollow');headers.set('X-Frame-Options','DENY');headers.set('Referrer-Policy','no-referrer');headers.set('Content-Security-Policy',"default-src 'self'; img-src 'self' data:; script-src 'self'; style-src 'self'; connect-src 'self'; frame-ancestors 'none'; form-action 'self'; base-uri 'none'");
   return new Response(response.body,{status:response.status,headers});
  }
  return env.ASSETS.fetch(request);
 }
};
