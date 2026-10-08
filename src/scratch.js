'use strict';
(()=>{
 const card=$('birthday-letter'),coat=$('scratch-coat'),cover=$('scratch-cover'),message=$('letter-message'),ctx=coat.getContext('2d');
 let revealed=false,ready=false,previous=null,width=0,height=0,ratio=1;
 message.inert=true;message.setAttribute('aria-hidden','true');
 function drawCover(){
  ctx.setTransform(ratio,0,0,ratio,0,0);ctx.globalCompositeOperation='source-over';
  ctx.fillStyle='#eed5df';ctx.fillRect(0,0,width,height);
  ctx.strokeStyle='#fff8ed66';ctx.lineWidth=10;
  for(let x=-height;x<width;x+=32){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x+height,height);ctx.stroke();}
  ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillStyle='#b88291';ctx.font='25px sans-serif';ctx.fillText('✦     ✧     ✦',width/2,height*.25);
  ctx.fillStyle='#795463';ctx.font='bold 22px "PingFang SC",sans-serif';ctx.fillText('鸡毛的悄悄话',width/2,height*.43);
  ctx.font='14px "PingFang SC",sans-serif';ctx.fillText('刮一刮，把藏起来的心意拆开',width/2,height*.59);
  ctx.font='12px sans-serif';ctx.fillStyle='#a37585';ctx.fillText('给全世界最可爱的白白',width/2,height*.71);
  ready=true;
 }
 function resize(){
  if(revealed)return;
  const rect=card.getBoundingClientRect(),newWidth=Math.round(rect.width),newHeight=Math.round(rect.height);
  if(!newWidth||!newHeight||newWidth===width&&newHeight===height)return;
  const saved=ready?document.createElement('canvas'):null;
  if(saved){saved.width=coat.width;saved.height=coat.height;saved.getContext('2d').drawImage(coat,0,0);}
  width=newWidth;height=newHeight;ratio=Math.min(devicePixelRatio||1,2);coat.width=Math.round(width*ratio);coat.height=Math.round(height*ratio);
  if(saved){ctx.setTransform(1,0,0,1,0,0);ctx.drawImage(saved,0,0,coat.width,coat.height);}else drawCover();
  ctx.setTransform(ratio,0,0,ratio,0,0);
 }
 function reveal(){
  if(revealed)return;revealed=true;previous=null;
  message.inert=false;message.removeAttribute('aria-hidden');card.classList.add('is-scratched');
  cover.inert=true;$('scratch-status').textContent='刮开啦！鸡毛的生日祝福送给白白。';
  // Return keyboard focus only when the accessible reveal button was used.
  if(document.activeElement===$('scratch-open')){message.tabIndex=-1;message.focus({preventScroll:true});}
  setTimeout(()=>{cover.hidden=true;},matchMedia('(prefers-reduced-motion: reduce)').matches?0:600);
 }
 function position(event){const rect=coat.getBoundingClientRect();return {x:(event.clientX-rect.left)*width/rect.width,y:(event.clientY-rect.top)*height/rect.height};}
 function erase(point){
  if(!ready||revealed)return;
  ctx.globalCompositeOperation='destination-out';ctx.lineWidth=44;ctx.lineCap='round';ctx.lineJoin='round';
  ctx.beginPath();ctx.moveTo(previous?.x??point.x,previous?.y??point.y);ctx.lineTo(point.x,point.y);ctx.stroke();
  ctx.beginPath();ctx.arc(point.x,point.y,22,0,Math.PI*2);ctx.fill();previous=point;
 }
 function progress(){
  const pixels=ctx.getImageData(0,0,coat.width,coat.height).data;let clear=0,total=0;
  const step=Math.max(1,Math.round(14*ratio));
  for(let y=step;y<coat.height;y+=step)for(let x=step;x<coat.width;x+=step){total++;if(pixels[(y*coat.width+x)*4+3]<60)clear++;}
  if(total&&clear/total>=.32)reveal();
 }
 coat.addEventListener('pointerdown',e=>{if(revealed||e.button>0)return;e.preventDefault();coat.setPointerCapture(e.pointerId);previous=null;erase(position(e));});
 coat.addEventListener('pointermove',e=>{if(coat.hasPointerCapture(e.pointerId))erase(position(e));});
 const finish=e=>{if(coat.hasPointerCapture(e.pointerId))coat.releasePointerCapture(e.pointerId);previous=null;if(!revealed)progress();};
 coat.addEventListener('pointerup',finish);coat.addEventListener('pointercancel',finish);
 $('scratch-open').addEventListener('click',reveal);
 new ResizeObserver(resize).observe(card);resize();
})();
