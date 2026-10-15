'use strict';
(()=>{
 const $=id=>document.getElementById(id),statusNames={pending:'准备出发',in_transit:'运输途中',out_for_delivery:'正在派送',delivered:'白白已收到'};
 let tracking=null,cities=[],busy=false,pending=null,confirmation=null;
 function message(text,kind=''){$('admin-status').textContent=text;$('admin-status').className='admin-status'+(kind?' is-'+kind:'');}
 function beijingInput(){return new Date(Date.now()+8*3600000).toISOString().slice(0,16);}
 function timeLabel(event){return event.time?new Intl.DateTimeFormat('zh-CN',{timeZone:'Asia/Shanghai',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(event.time)):event.timeLabel||'';}
 async function api(path,options={}){
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);
  try{const response=await fetch('/api/delivery/'+path,{...options,credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/json'},signal:controller.signal});let data;try{data=await response.json();}catch{throw Error('更新页还没连上，请稍后再试。');}if(!response.ok)throw Object.assign(new Error(data.error||'暂时没有保存成功。'),{status:response.status});return data;}
  catch(error){if(error.name==='AbortError')throw Error('连接有点慢，先别着急，点保存可以重试。');throw error;}finally{clearTimeout(timer);}
 }
 function option(place){const el=document.createElement('option');el.value=place.id;el.textContent=place.name;return el;}
 function populate(){
  for(const id of ['place-id','next-place-id','destination-id']){
   const select=$(id);select.replaceChildren(...cities.map(option));
   if(id==='next-place-id'){const none=document.createElement('option');none.value='';none.textContent='暂不填写';select.prepend(none);}
  }
 }
 function selectedCity(){return cities.find(city=>city.id===$('place-id').value);}
 function selectedStatus(){return document.querySelector('input[name="delivery-status"]:checked').value;}
 function preview(){
  const city=selectedCity(),next=cities.find(p=>p.id===$('next-place-id').value),destination=cities.find(p=>p.id===$('destination-id').value),state=selectedStatus();
  $('preview-title').textContent=state==='delivered'?'白白大王的礼物已经送达':'鸡毛正在派送礼物';
  $('preview-route').textContent=(city?.name||'请选择当前城市')+(next&&state!=='delivered'?' → 下一站 '+next.name:'')+(destination?' → 白白在 '+destination.name:'');
  $('preview-note').textContent=$('delivery-note').value.trim()||({pending:'鸡毛收好心意，准备出发。',in_transit:'一路向白白靠近，礼物正在赶来。',out_for_delivery:'就差最后一程，很快就能见面啦。',delivered:'白白大王，记得拆开这份偏爱。'})[state];
  document.querySelectorAll('[data-city]').forEach(button=>button.classList.toggle('is-selected',button.dataset.city===city?.id));
 }
 function render(data,reset=false){
  tracking=data;$('current-city').textContent=data.current?.city||'还没记下第一站';$('current-status').textContent=statusNames[data.status]||'等待更新';
  $('current-updated').textContent=data.updatedAt?'鸡毛更新于 '+timeLabel({time:data.updatedAt})+' · 北京时间':'初始记录来自淘宝物流截图';
  $('admin-events').replaceChildren(...data.events.slice().reverse().map(event=>{const item=document.createElement('li'),time=document.createElement('time'),city=document.createElement('strong'),note=document.createElement('p');time.textContent=timeLabel(event);city.textContent=event.city;note.textContent=event.description;item.append(time,city,note);return item;}));
  if(reset){
   $('city-search').value='';populate();$('place-id').value=data.current?.id||'330100';$('next-place-id').value='nextStop'in data?data.nextStop?.id||'':'440100';$('destination-id').value=data.destination?.id||'440300';
   const radio=document.querySelector('input[name="delivery-status"][value="'+data.status+'"]');if(radio)radio.checked=true;$('occurred-at').value=beijingInput();$('delivery-note').value='';
  }
  preview();
 }
 function showLogin(){$('login-panel').hidden=false;$('editor-panel').hidden=true;$('logout').hidden=true;tracking=null;pending=null;}
 async function boot(reset=true){
  try{const data=await api('admin');cities=data.cities;$('login-panel').hidden=true;$('editor-panel').hidden=false;$('logout').hidden=false;render(data.tracking,reset);message('');return true;}
  catch(error){if(error.status===401){showLogin();message('');}else message(error.message,'error');return false;}
 }
 async function save(payload){
  if(busy)return;busy=true;$('save-update').disabled=true;message('鸡毛正在记下这一步…');
  try{const data=await api('update',{method:'PUT',body:JSON.stringify(payload)});pending=null;render(data,true);message('保存好啦！白白的地图会在约 30 秒内更新。','success');}
  catch(error){
   if(error.status===401){showLogin();message('登录时间到啦，请重新登录。','error');}
   else if(error.status===409){const refreshed=await boot(false);pending=null;if(refreshed)message(error.message+' 请核对上方最新记录，再保存。','error');}
   else message(error.message,'error');
  }finally{busy=false;$('save-update').disabled=false;}
 }
 $('login-form').addEventListener('submit',async event=>{
  event.preventDefault();if(busy)return;busy=true;$('login-submit').disabled=true;message('正在确认鸡毛本人…');
  try{await api('login',{method:'POST',body:JSON.stringify({password:$('admin-password').value})});$('admin-password').value='';await boot();}catch(error){message(error.message,'error');}finally{busy=false;$('login-submit').disabled=false;}
 });
 $('logout').addEventListener('click',async()=>{try{await api('logout',{method:'POST',body:'{}'});showLogin();message('已经退出，下一次再来记下送礼小事。');}catch(error){message(error.message,'error');}});
 $('city-search').addEventListener('input',()=>{const value=$('place-id').value,needle=$('city-search').value.trim();const filtered=cities.filter(city=>city.name.includes(needle)||city.id===value);$('place-id').replaceChildren(...filtered.map(option));$('place-id').value=value;});
 document.querySelectorAll('[data-city]').forEach(button=>button.addEventListener('click',()=>{
  $('city-search').value='';const currentNext=$('next-place-id').value,currentDestination=$('destination-id').value;populate();$('place-id').value=button.dataset.city;$('next-place-id').value=({'330100':'440100','440100':'440300','440300':''})[button.dataset.city]??currentNext;$('destination-id').value=currentDestination||'440300';pending=null;preview();
 }));
 $('delivery-form').addEventListener('input',()=>{pending=null;preview();});$('delivery-form').addEventListener('change',()=>{pending=null;preview();});
 $('delivery-form').addEventListener('submit',event=>{
  event.preventDefault();if(busy||!tracking)return;
  if(!pending)pending={id:crypto.randomUUID(),revision:tracking.revision,placeId:$('place-id').value,nextPlaceId:$('next-place-id').value,destinationId:$('destination-id').value,status:selectedStatus(),occurredAt:$('occurred-at').value+':00+08:00',note:$('delivery-note').value.trim()};
  if(pending.status==='delivered'||tracking.status==='delivered'&&pending.status!=='delivered'){
   const delivered=pending.status==='delivered';confirmation={...pending,confirmDelivered:delivered,confirmReopen:!delivered};$('confirm-title').textContent=delivered?'确认白白已收到礼物了吗？':'要更正已经送达的状态吗？';$('confirm-description').textContent=delivered?'确认后，白白的页面会显示“白白大王的礼物已经送达”。':'这会把页面改回派送中的状态，并保留之前的记录。';$('confirm-save').textContent=delivered?'确认送达并保存':'确认更正并保存';$('confirm-dialog').showModal();
  }else void save(pending);
 });
 $('confirm-dialog').addEventListener('close',()=>{if($('confirm-dialog').returnValue==='yes'&&confirmation){pending=confirmation;void save(pending);}confirmation=null;});
 $('reload-history').addEventListener('click',async()=>{if(busy)return;busy=true;$('reload-history').disabled=true;const ok=await boot(false);if(ok)message('已经刷新最新记录。','success');busy=false;$('reload-history').disabled=false;});
 void boot();
})();
