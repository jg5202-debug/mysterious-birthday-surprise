import http from 'node:http';
import { readFile,writeFile,mkdir } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { localD1 } from './local-delivery-db.mjs';
import worker from '../build/cloudflare-source/delivery-worker.mjs';
const root=fileURLToPath(new URL('../',import.meta.url)),publish=path.join(root,'dist/cloudflare');
const work=path.join(root,'work');await mkdir(work,{recursive:true});
const passwordFile=path.join(work,'delivery-preview-password.txt');let password;
try{password=(await readFile(passwordFile,'utf8')).trim();}catch{password=randomBytes(24).toString('base64url');await writeFile(passwordFile,password,{mode:0o600});}
const types={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.mp3':'audio/mpeg','.mp4':'video/mp4'};
const env={DELIVERY_DB:localD1(path.join(work,'delivery-preview.sqlite')),DELIVERY_ADMIN_PASSWORD:password,ASSETS:{async fetch(request){let name=decodeURIComponent(new URL(request.url).pathname);if(name==='/gift-admin.html')return Response.redirect(new URL('/gift-admin',request.url),301);if(name==='/gift-admin')name='/gift-admin.html';if(name==='/')name='/index.html';const target=path.resolve(publish,'.'+name);if(!target.startsWith(publish+path.sep))return new Response('Not found',{status:404});try{return new Response(await readFile(target),{headers:{'Content-Type':types[path.extname(target)]||'application/octet-stream'}});}catch{return new Response('Not found',{status:404});}}}};
const server=http.createServer(async(req,res)=>{
 try{
  const origin='http://127.0.0.1:4183',url=new URL(req.url,origin);
  // Local layout fixtures only; these routes are never built or published.
  if(url.pathname==='/__phone'){
   res.setHeader('Content-Type','text/html; charset=utf-8');res.end('<meta charset="utf-8"><title>390px 手机布局预览</title><body style="margin:0;background:#e8e4dd;font-family:sans-serif;display:grid;place-items:center;padding:20px"><p style="font-size:12px;color:#8e806f">手机布局预览 · 390px</p><iframe title="手机更新页" src="/__phone-admin" style="width:390px;height:844px;border:1px solid #d2c8b9;border-radius:22px;background:#f9f3e8"></iframe></body>');return;
  }
  if(url.pathname==='/__phone-admin'){
   res.setHeader('Content-Type','text/html; charset=utf-8');res.end(await readFile(path.join(publish,'gift-admin.html'),'utf8'));return;
  }
  // Test-only progress fixture; it is never placed in the publishing directory.
  if(url.pathname==='/__preview-completed'){
   const html=await readFile(path.join(publish,'index.html'),'utf8'),signature=html.match(/"signature": "([a-f0-9]+)"/)?.[1];
   if(!signature)throw Error('Missing progress signature');
   const state={version:1,signature,won:[0,1,7],unlockedRound:null,completed:true,letterOpened:true,scratched:true,musicEnabled:false};
   res.setHeader('Content-Type','text/html; charset=utf-8');res.end('<meta charset="utf-8"><title>本地完成流程预览</title><button id="seed">打开白白的完成页面</button><script>document.getElementById("seed").onclick=()=>{localStorage.setItem("birthday-paws:23:progress:v1",JSON.stringify('+JSON.stringify(state)+'));location.href="/"}</script>');return;
  }
  const chunks=[];for await(const chunk of req)chunks.push(chunk);const data=Buffer.concat(chunks);if(data.length>8192){res.writeHead(413);res.end();return;}
  const headers=new Headers();for(const [key,value] of Object.entries(req.headers))if(value!==undefined)headers.set(key,Array.isArray(value)?value.join(','):value);
  // Production uses a Secure __Host- cookie; localhost gets a separate dev-only name.
  if(headers.has('cookie'))headers.set('cookie',headers.get('cookie').replaceAll('jimo_delivery_dev=','__Host-jimo_delivery='));
  const request=new Request(url,{method:req.method,headers,body:['GET','HEAD'].includes(req.method)?undefined:data});const response=await worker.fetch(request,env);
  res.statusCode=response.status;for(const [key,value] of response.headers){res.setHeader(key,key==='set-cookie'?value.replace('__Host-jimo_delivery=','jimo_delivery_dev=').replace('; Secure',''):value);}
  res.end(Buffer.from(await response.arrayBuffer()));
 }catch(error){res.writeHead(500,{'Content-Type':'text/plain; charset=utf-8'});res.end('Local preview error: '+error.message);}
});
server.listen(4183,'127.0.0.1',()=>console.log('Delivery preview: http://127.0.0.1:4183/gift-admin (test password stored in work/delivery-preview-password.txt)'));
