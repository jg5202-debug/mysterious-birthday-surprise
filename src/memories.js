'use strict';
window.BirthdayMemories=(()=>{
 const $=id=>document.getElementById(id);
 const root=$('memory-montage'),stage=$('memory-stage'),cards=[...root.querySelectorAll('[data-memory-photo]')],copy=$('memory-copy'),ending=$('memory-heart-ending'),gate=$('birthday-year-gate');
 const captions=[
  ['新的一岁，有我陪你走过。','从今天开始，也从往后的每一天开始。'],
  ['每一个普通的日子，都想和你一起。','一起吃饭，一起散步，一起开心。'],
  ['一起笑过的日子，我一直都记得。','那些有你在的时光，我都舍不得忘。'],
  ['想念你的时候，就偷偷再看一遍。','看着我们的合照，好像你就在身边。'],
  ['隔着时差，偏爱也会准时到达。','距离远了一点，惦记你的心没有。'],
  ['等下次见面，再好好抱抱你。','先把想念藏好，见面时都交给你。'],
  ['23 岁生日快乐，白白。','希望新的一岁，你有好多好多开心。'],
  ['未来的路，有我陪你一起走。','爱你的鸡毛，会一直认真地爱你。']
 ];
 // Two lobes, three across the middle, two below, and one at the point.
 const heart=[[-.21,-.24,-9],[.21,-.24,9],[-.30,-.015,-12],[0,-.025,2],[.30,-.015,12],[-.15,.20,-8],[.15,.20,8],[0,.38,-2]];
 let active=false,phase='idle',timer=0,remaining=0,startedAt=0,index=0,callbacks={},animations=[];
 const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
 function clearTimer(){clearTimeout(timer);timer=0;}
 function schedule(fn,ms){
  clearTimer();remaining=ms;startedAt=performance.now();
  if(!document.hidden)timer=setTimeout(()=>{timer=0;fn();},ms);
  pendingStep=fn;
 }
 let pendingStep=null;
 function stopAnimations(){animations.forEach(a=>a.cancel());animations=[];}
 function animate(node,frames,options){const a=node.animate(frames,options);animations.push(a);if(document.hidden)a.pause();return a;}
 function placement(i){const [x,y,r]=heart[i],size=stage.getBoundingClientRect().width;return `translate(-50%,-50%) translate(${x*size}px,${y*size}px) rotate(${r}deg)`;}
 function words(i){
  $('memory-caption').textContent=captions[i][0];$('memory-subcaption').textContent=captions[i][1];
  animate(copy,[{opacity:0,transform:'translateY(8px)'},{opacity:1,transform:'translateY(0)',offset:.18},{opacity:1,offset:.85},{opacity:0,transform:'translateY(-5px)'}],{duration:3300,easing:'ease-in-out',fill:'both'});
 }
 function floatPhoto(i){
  if(!active||phase!=='floating')return;
  index=i;words(i);
  const size=stage.getBoundingClientRect().width,side=i%2?-1:1,tilt=i%2?7:-7;
  const transform=(x,y,r,s)=>`translate(-50%,-50%) translate(${x*size}px,${y*size}px) rotate(${r}deg) scale(${s})`;
  // Overlapping lifetimes make a continuous drifting stream, rather than eight slides.
  animate(cards[i],[
   {opacity:0,transform:transform(-side*.28,.13,tilt-7,1.65)},
   {opacity:1,transform:transform(-side*.10,.035,tilt,2.35),offset:.20},
   {opacity:1,transform:transform(side*.06,-.02,tilt+2,2.35),offset:.56},
   {opacity:.28,transform:transform(side*.32,-.14,tilt+8,1.7),offset:.80},
   {opacity:0,transform:transform(side*.52,-.29,tilt+15,1.15)}
  ],{duration:5400,easing:'cubic-bezier(.24,.05,.21,1)',fill:'both'});
  schedule(()=>i<cards.length-1?floatPhoto(i+1):gather(),3300);
 }
 function gather(){
  if(!active||phase==='leaving'||phase==='ready'||phase==='gathering')return;
  const visible=cards.map(card=>({opacity:getComputedStyle(card).opacity,transform:getComputedStyle(card).transform}));
  phase='gathering';clearTimer();stopAnimations();root.classList.add('is-gathering');
  $('memory-caption').textContent='未来的路，有我陪你一起走。';$('memory-subcaption').textContent='那些一起走过的时光，都是我心里的偏爱。';copy.style.opacity='1';
  const size=stage.getBoundingClientRect().width;
  cards.forEach((card,i)=>{
   const theta=i*Math.PI/4,drift=`translate(-50%,-50%) translate(${Math.cos(theta)*size*.67}px,${Math.sin(theta)*size*.53}px) rotate(${i%2?24:-24}deg) scale(1.2)`;
   const from=Number(visible[i].opacity)>.02?visible[i].transform:drift,startOpacity=Number(visible[i].opacity)>.02?Number(visible[i].opacity):0;
   const target=placement(i);card.style.transform=target;card.style.opacity='1';
   if(!reduced())animate(card,[{opacity:startOpacity,transform:from},{opacity:.85,offset:.25},{opacity:1,transform:target}],{duration:2400,delay:i*130,easing:'cubic-bezier(.16,1,.3,1)',fill:'both'});
  });
  schedule(ready,reduced()?0:3550);
 }
 function ready(){
  if(!active||phase!=='gathering')return;
  phase='ready';root.classList.add('is-heart-ready');ending.hidden=false;
  $('memory-enter-year').disabled=false;$('memory-enter-year').focus({preventScroll:true});
  // Deliberately no auto-return: the completed heart stays until she chooses to enter.
 }
 function prepare(){cards.forEach(card=>{const img=card.querySelector('img');img.loading='eager';if(img.decode)img.decode().catch(()=>{});});const img=gate.querySelector('img');if(img.decode)img.decode().catch(()=>{});}
 function start(options){
  if(active)return;
  prepare();active=true;phase='floating';callbacks=options;root.hidden=false;ending.hidden=true;
  root.classList.remove('is-gathering','is-heart-ready','is-paused');copy.style.opacity='';$('memory-enter-year').disabled=true;
  cards.forEach(card=>{card.style.opacity='0';card.style.transform='';});
  $('memory-title').focus({preventScroll:true});
  if(reduced())gather();else floatPhoto(0);
 }
 function finish(){
  if(!active||phase!=='ready')return;
  phase='leaving';clearTimer();$('memory-enter-year').disabled=true;gate.classList.remove('is-covered','is-opening');gate.showModal();$('year-gate-title').focus({preventScroll:true});
  schedule(()=>{
   gate.classList.add('is-covered');callbacks.handoff?.();
   schedule(()=>{
    gate.classList.add('is-opening');
    schedule(()=>{
     gate.close();gate.classList.remove('is-covered','is-opening');root.hidden=true;active=false;phase='idle';stopAnimations();
     const done=callbacks.complete;callbacks={};done?.();
    },reduced()?0:1400);
   },reduced()?0:1800);
  },reduced()?0:1100);
 }
 $('memory-enter-year').addEventListener('click',finish);
 gate.addEventListener('cancel',event=>event.preventDefault());
 document.addEventListener('visibilitychange',()=>{
  if(!active)return;
  root.classList.toggle('is-paused',document.hidden);gate.classList.toggle('is-paused',document.hidden);
  if(document.hidden){if(timer){remaining=Math.max(0,remaining-(performance.now()-startedAt));clearTimer();}animations.forEach(a=>a.pause());}
  else{animations.forEach(a=>a.play());if(pendingStep&&phase!=='ready')schedule(pendingStep,remaining);}
 });
 window.addEventListener('resize',()=>{if(active&&(phase==='ready'||phase==='gathering')){stopAnimations();cards.forEach((card,i)=>card.style.transform=placement(i));}});
 return {prepare,start,finish,skip:gather,isActive:()=>active};
})();
