'use strict';
window.BirthdayDelivery=(()=>{
 const config=window.BirthdayDeliveryConfig;
 const page=$('delivery-page'),entry=$('gift-delivery-open'),refresh=$('delivery-refresh');
 const svgNS='http://www.w3.org/2000/svg';
 let journeyComplete=false,opener=null,request=null,refreshTimer=0,loaded=null,ownsRoute=false,nationwide=false;
 const text=(id,value)=>{$(id).textContent=value;};
 function eligible(){return config.enabled!==false&&won.length===birthday.drawLimit&&(journeyComplete||document.documentElement?.dataset.birthdayComplete==='true');}
 function sync(){entry.hidden=!eligible();}
 function complete(){journeyComplete=true;sync();}
 function mapPoint(location){
  if(!location||typeof location.longitude!=='number'||typeof location.latitude!=='number'||!Number.isFinite(location.longitude)||!Number.isFinite(location.latitude)||location.longitude<73||location.longitude>136||location.latitude<3||location.latitude>54)return null;
  return {x:(location.longitude-72)/65*840+10,y:(55-location.latitude)/53*640+10};
 }
 function formatTime(value){const date=new Date(value);return Number.isFinite(date.getTime())?new Intl.DateTimeFormat('zh-CN',{timeZone:'Asia/Shanghai',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}).format(date):'';}
 function normalize(data){
  if(!data||typeof data!=='object'||data.waybill!==config.waybill||!['pending','in_transit','out_for_delivery','delivered'].includes(data.status)||!Array.isArray(data.events))throw Error('invalid tracking response');
  const snapshot=data.source==='taobao-screenshot';
  const events=data.events.filter(e=>e&&typeof e.city==='string'&&typeof e.description==='string'&&(Number.isFinite(new Date(e.time).getTime())||(snapshot&&typeof e.timeLabel==='string'))).slice(0,100).sort((a,b)=>a.time&&b.time?new Date(a.time)-new Date(b.time):0);
  if(data.status==='delivered'&&!events.length)throw Error('delivery needs a confirmed carrier event');
  return {status:data.status,events,current:data.current&&typeof data.current.city==='string'?data.current:null,origin:data.origin,nextStop:data.nextStop,destination:data.destination,updatedAt:formatTime(data.updatedAt),snapshot};
 }
 function unique(points){return points.filter((p,i)=>p&&(!points[i-1]||Math.hypot(p.x-points[i-1].x,p.y-points[i-1].y)>.2));}
 function curve(points){return points.map((p,i)=>i?'C'+[points[i-1].x,(points[i-1].y+p.y)/2,p.x,(points[i-1].y+p.y)/2,p.x,p.y].join(','):'M'+p.x+','+p.y).join(' ');}
 function paintMap(data){
  const current=mapPoint(data.current),origin=mapPoint(data.origin),next=mapPoint(data.nextStop),destination=mapPoint(data.destination);
  const points=unique([origin,...data.events.map(e=>mapPoint(e)),current].filter(Boolean));
  const future=data.status==='delivered'?[]:unique([current,next,destination].filter(Boolean));
  const all=[...points,...future];let box=[0,0,860,660];
  if(!nationwide&&all.length){const xs=all.map(p=>p.x),ys=all.map(p=>p.y),cx=(Math.min(...xs)+Math.max(...xs))/2,cy=(Math.min(...ys)+Math.max(...ys))/2,width=Math.max(240,Math.max(...xs)-Math.min(...xs)+135),height=Math.max(230,Math.max(...ys)-Math.min(...ys)+125);box=[Math.max(0,Math.min(860-width,cx-width/2)),Math.max(0,Math.min(660-height,cy-height/2)),Math.min(860,width),Math.min(660,height)];}
  const scene=$('delivery-map-scene');scene.setAttribute('viewBox',box.join(' '));scene.setAttribute('preserveAspectRatio','none');
  scene.parentElement?.style.setProperty('aspect-ratio',String(box[2]/box[3]));
  $('delivery-route').setAttribute('d',curve(points));$('delivery-route-future').setAttribute('d',curve(future));
  const size=box[2]/(scene.getBoundingClientRect?.().width||400)*11;
  $('delivery-route-dots').replaceChildren(...points.map(p=>{const dot=document.createElementNS(svgNS,'circle');dot.setAttribute('cx',p.x);dot.setAttribute('cy',p.y);dot.setAttribute('r',size*.25);return dot;}));
  const sameDestination=next&&destination&&Math.hypot(next.x-destination.x,next.y-destination.y)<.2;
  const atOrigin=current&&origin&&Math.hypot(current.x-origin.x,current.y-origin.y)<.2;
  const labels=[{point:atOrigin?null:origin,label:'出发 · '+(data.origin?.city||''),dy:-12},{point:sameDestination?null:next,label:'下一站 · '+(data.nextStop?.city||''),dy:-12},{point:destination,label:(sameDestination?'下一站，白白在 · ':'白白在 · ')+(data.destination?.city||''),dy:18}].filter(item=>item.point);
  $('delivery-route-labels').replaceChildren(...labels.map(item=>{const g=document.createElementNS(svgNS,'g'),circle=document.createElementNS(svgNS,'circle'),label=document.createElementNS(svgNS,'text');circle.setAttribute('cx',item.point.x);circle.setAttribute('cy',item.point.y);circle.setAttribute('r',size*.3);label.setAttribute('x',item.point.x+size*.7);label.setAttribute('y',item.point.y+item.dy*size/11);label.setAttribute('font-size',size);label.textContent=item.label;g.append(circle,label);return g;}));
  const marker=$('delivery-marker');marker.hidden=!current;
  if(current){marker.style.left=((current.x-box[0])/box[2]*100)+'%';marker.style.top=((current.y-box[1])/box[3]*100)+'%';text('delivery-marker-city',data.current.city);}
  $('delivery-unlocated').hidden=!!current;
  text('delivery-location',data.current?.city||'等待物流位置更新');
 }
 function paint(data){
  const delivered=data.status==='delivered';page.classList.toggle('is-delivered',delivered);
  text('delivery-title',delivered?'白白大王的礼物已经送达':'鸡毛正在派送礼物');
  text('delivery-courier-title',delivered?'鸡毛，使命必达。':'鸡毛，正在赶来。');
  text('delivery-subtitle',delivered?'把一路的惦记，送到最喜欢的你手里。':'有一份藏不住的心意，正在奔向白白。');
  text('delivery-status-chip',delivered?'心意已送达':data.status==='out_for_delivery'?'最后一程啦':'礼物在路上');
  text('delivery-eta',delivered?'白白大王，记得查收这份偏爱。':'再等一小会儿，惊喜就要和你见面啦。');
  paintMap(data);
  const list=$('delivery-events');list.replaceChildren();
  for(const [index,event] of data.events.slice().reverse().entries()){
   const item=document.createElement('li'),stamp=document.createElement('time'),copy=document.createElement('div'),city=document.createElement('strong'),description=document.createElement('p');
   if(index===0)item.className='is-latest';if(event.time)stamp.dateTime=event.time;stamp.textContent=event.time?formatTime(event.time):event.timeLabel;city.textContent=event.city;description.textContent=event.description;copy.append(city,description);item.append(stamp,copy);list.append(item);
  }
  $('delivery-empty').hidden=!!data.events.length;
  text('delivery-updated',data.snapshot?'初始记录来自淘宝截图，等待鸡毛更新':data.updatedAt?'鸡毛更新于 '+data.updatedAt+'（北京时间）':'等待鸡毛确认最新城市');
 }
 async function load(){
  clearTimeout(refreshTimer);
  if(!page.open||document.hidden)return;
  if(!config.endpoint){
   if(config.initial&&!loaded){try{loaded=normalize(config.initial);paint(loaded);}catch{}}
   text('delivery-network',loaded?.snapshot?'当前依据淘宝物流截图展示，尚未连接自动更新。':'物流连接准备中，接通后这里会显示最新位置。');refresh.disabled=true;return;
  }
  request?.abort();const controller=new AbortController();request=controller;refresh.disabled=true;
  text('delivery-network','正在看看鸡毛送到哪啦…');
  const timeout=setTimeout(()=>controller.abort(),12000);
  try{
   const response=await fetch(config.endpoint,{cache:'no-store',signal:controller.signal,headers:{Accept:'application/json'}});
   if(!response.ok)throw Error('carrier unavailable');
   const data=normalize(await response.json());
   if(request!==controller||!page.open)return;
   loaded=data;paint(data);text('delivery-network','鸡毛手动记录 · 页面每 30 秒自动同步');
  }catch(error){
   if(request!==controller||!page.open)return;
   text('delivery-network',loaded?'暂时没连上物流，保留上次的位置，稍后再试。':'暂时没连上物流，点“刷新物流”再试一次。');
  }finally{
   clearTimeout(timeout);
   if(request===controller){request=null;refresh.disabled=false;if(page.open&&!document.hidden)refreshTimer=setTimeout(load,30000);}
  }
 }
 function openPage(){
  if(!eligible()||page.open)return;
  opener=document.activeElement;page.showModal();page.scrollTop=0;document.body.classList.add('viewing-delivery');
  if(location.hash!=='#gift-delivery'){history.pushState({birthdayDelivery:true},'',location.pathname+location.search+'#gift-delivery');ownsRoute=true;}
  else ownsRoute=history.state?.birthdayDelivery===true;
  $('delivery-title').focus({preventScroll:true});void load();
 }
 function hidePage(){
  request?.abort();request=null;clearTimeout(refreshTimer);
  if(page.open)page.close();document.body.classList.remove('viewing-delivery');opener?.focus({preventScroll:true});
 }
 function closePage(){if(ownsRoute&&location.hash==='#gift-delivery'){ownsRoute=false;history.back();}else{if(location.hash==='#gift-delivery')history.replaceState(null,'',location.pathname+location.search);hidePage();}}
 entry.addEventListener('click',openPage);$('delivery-back').addEventListener('click',closePage);refresh.addEventListener('click',load);
 $('delivery-map-toggle').addEventListener('click',()=>{nationwide=!nationwide;$('delivery-map-toggle').textContent=nationwide?'聚焦送礼路线':'查看全国地图';if(loaded)paintMap(loaded);});
 window.addEventListener('resize',()=>{if(loaded&&page.open)paintMap(loaded);});
 page.addEventListener('cancel',event=>{event.preventDefault();closePage();});
 window.addEventListener('popstate',()=>{if(page.open&&location.hash!=='#gift-delivery')hidePage();else if(!page.open&&location.hash==='#gift-delivery'&&eligible())openPage();});
 document.addEventListener('visibilitychange',()=>{if(document.hidden){request?.abort();request=null;clearTimeout(refreshTimer);refresh.disabled=false;}else if(page.open)void load();});
 const official=$('delivery-official');
 try{const url=new URL(config.shareUrl);if(url.protocol==='https:'&&(url.hostname==='sf-express.com'||url.hostname.endsWith('.sf-express.com'))){official.href=url.href;official.hidden=false;}}catch{}
 text('delivery-waybill','快递单号：'+config.waybill);sync();
 if(location.hash==='#gift-delivery'&&eligible())openPage();
 return {sync,complete,open:openPage,normalize,mapPoint};
})();
