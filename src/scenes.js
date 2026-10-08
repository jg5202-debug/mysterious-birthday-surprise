'use strict';
(()=>{
 const greetingVideo='assets/birthday-greeting.mp4';
 const wishStage=document.getElementById('wish-stage');
 const video=document.getElementById('birthday-greeting-video');
 const placeholder=document.getElementById('greeting-placeholder');
 const videoState=document.getElementById('video-state');
 const playVideo=document.getElementById('greeting-play');
 const skipVideo=document.getElementById('greeting-skip');
 const replayVideo=document.getElementById('greeting-replay');
 const videoActions=document.getElementById('video-actions');
 const music=document.getElementById('birthday-bgm');
 let restoreMusic=false,restoreTrack=null;
 function resumeMusic(){
  if(!restoreMusic||document.hidden)return;
  // A letter/song switch owns playback once it takes over from the theater.
  if(document.body.classList.contains('reading-letter')||(restoreTrack&&window.BirthdayAudio?.snapshot().track!==restoreTrack)){restoreMusic=false;restoreTrack=null;return;}
  restoreMusic=false;restoreTrack=null;
  if(window.BirthdayAudio)void window.BirthdayAudio.resume();else music.play().catch(()=>{});
 }
 function pauseVideo(){if(!video.hidden&&!video.paused)video.pause();resumeMusic();}
 function finishVideo(){
  video.pause();video.hidden=true;placeholder.hidden=false;
  videoActions.hidden=true;replayVideo.hidden=true;skipVideo.hidden=true;
  playVideo.hidden=false;playVideo.textContent='再看一次小狗日常';
  videoState.textContent='小狗的快乐日常，想看的时候随时再看一次。';
  resumeMusic();
 }
 async function startVideo(){
  placeholder.hidden=true;video.hidden=false;videoActions.hidden=false;skipVideo.hidden=false;
  replayVideo.hidden=true;video.currentTime=0;
  try{await video.play();if(!video.hidden)videoState.textContent='小鸡毛和小小白的快乐日常，开场啦。';}
  catch{if(!video.hidden)videoState.textContent='轻点视频里的播放按钮，一起看小狗的快乐日常。';}
 }
 if(greetingVideo){video.src=greetingVideo;playVideo.hidden=false;document.getElementById('video-pending').hidden=true;skipVideo.textContent='结束放映';skipVideo.hidden=true;videoActions.hidden=true;}
 playVideo.addEventListener('click',startVideo);
 replayVideo.addEventListener('click',startVideo);
 skipVideo.addEventListener('click',finishVideo);
 video.addEventListener('play',()=>{
  if(!music.paused){restoreMusic=true;restoreTrack=window.BirthdayAudio?.snapshot().track||null;}
  if(window.BirthdayAudio)window.BirthdayAudio.pause();else music.pause();
 });
 video.addEventListener('pause',()=>{
  resumeMusic();
  if(!video.hidden&&!video.ended)videoState.textContent='放映暂停啦，背景音乐继续陪着白白。';
 });
 // Scrolling away is also leaving the theater, including on mobile browsers.
 if('IntersectionObserver' in window){
  const observer=new IntersectionObserver(entries=>{if(entries.some(entry=>entry.target===video&&entry.intersectionRatio<.15))pauseVideo();},{threshold:[0,.15]});
  observer.observe(video);
 }
 video.addEventListener('webkitendfullscreen',pauseVideo);
 let videoWasFullscreen=false;
 document.addEventListener('fullscreenchange',()=>{
  if(document.fullscreenElement===video)videoWasFullscreen=true;
  else if(videoWasFullscreen){videoWasFullscreen=false;pauseVideo();}
 });
 video.addEventListener('ended',finishVideo);
 video.addEventListener('error',()=>{finishVideo();videoState.textContent='视频暂时没连上，点播放再试一次。';});
 const hold=document.getElementById('blow-hold'),mic=document.getElementById('blow-mic'),reset=document.getElementById('wish-reset');
 const status=document.getElementById('wish-status'),meter=document.getElementById('blow-progress');
 const candles=[...wishStage.querySelectorAll('.birthday-candle')];
 let progress=0,done=false,holding=false,holdStarted=0,lastPointer=0;
 let holdFrame=0,micFrame=0,stream=null,audioContext=null,micRequest=0,breezeTimer=0;
 function stopMicrophone(){
  micRequest++;cancelAnimationFrame(micFrame);micFrame=0;
  stream?.getTracks().forEach(track=>track.stop());stream=null;
  audioContext?.close().catch(()=>{});audioContext=null;
  mic.textContent='用麦克风吹气';mic.setAttribute('aria-pressed','false');
 }
 function stopHolding(){holding=false;cancelAnimationFrame(holdFrame);holdFrame=0;hold.classList.remove('is-blowing');}
 function addBreeze(amount){
  if(done)return;
  progress=Math.min(1,progress+amount);
  wishStage.classList.add('is-breezy');clearTimeout(breezeTimer);
  breezeTimer=setTimeout(()=>wishStage.classList.remove('is-breezy'),500);
  wishStage.style.setProperty('--wish-light',String((1-progress)*.10));
  const out=Math.min(3,Math.floor((progress+.001)*3));
  candles.forEach((c,i)=>c.classList.toggle('is-out',i<out));
  meter.firstElementChild.style.width=progress*100+'%';
  meter.setAttribute('aria-valuenow',Math.round(progress*100));
  wishStage.setAttribute('aria-label',out===3?'两只小狗陪白白许愿，三根蜡烛已经吹灭':'生日蛋糕，还亮着 '+(3-out)+' 根蜡烛');
  status.textContent=out?'吹灭 '+out+' 根啦，再轻轻吹一口气。':'小风吹来啦，继续轻轻吹气。';
  if(progress===1){
   done=true;stopHolding();stopMicrophone();hold.disabled=true;mic.disabled=true;hold.hidden=true;mic.hidden=true;reset.hidden=false;wishStage.closest('.wish-scene').classList.add('wish-complete');
   wishStage.classList.add('is-wished');
   status.textContent='蜡烛吹灭啦！白白的 23 岁愿望，鸡毛陪你慢慢实现。';
   if(typeof celebrate==='function'&&!matchMedia('(prefers-reduced-motion: reduce)').matches)celebrate();
  }
 }
 function startHolding(){
  if(done||holding)return;holding=true;holdStarted=performance.now();hold.classList.add('is-blowing');
  let previous=holdStarted;
  function frame(now){if(!holding)return;addBreeze(Math.min(now-previous,100)/1800);previous=now;if(holding)holdFrame=requestAnimationFrame(frame);}
  holdFrame=requestAnimationFrame(frame);
 }
 hold.addEventListener('pointerdown',e=>{if(e.button>0||done)return;e.preventDefault();hold.setPointerCapture(e.pointerId);startHolding();});
 hold.addEventListener('pointerup',e=>{lastPointer=performance.now();const tapped=holding&&lastPointer-holdStarted<220;stopHolding();if(hold.hasPointerCapture(e.pointerId))hold.releasePointerCapture(e.pointerId);if(tapped)addBreeze(1/3);});
 hold.addEventListener('pointercancel',stopHolding);
 hold.addEventListener('keydown',e=>{if(e.code==='Space'||e.code==='Enter'){e.preventDefault();if(!e.repeat)startHolding();}});
 hold.addEventListener('keyup',e=>{if(e.code==='Space'||e.code==='Enter'){e.preventDefault();const tapped=holding&&performance.now()-holdStarted<220;stopHolding();if(tapped)addBreeze(1/3);}});
 hold.addEventListener('click',e=>{if(e.detail===0&&performance.now()-lastPointer>300&&!holding)addBreeze(1/3);});
 hold.addEventListener('blur',stopHolding);
 reset.addEventListener('click',()=>{
  stopHolding();stopMicrophone();progress=0;done=false;hold.disabled=false;mic.disabled=false;hold.hidden=false;mic.hidden=false;reset.hidden=true;wishStage.closest('.wish-scene').classList.remove('wish-complete');
  candles.forEach(c=>c.classList.remove('is-out'));wishStage.classList.remove('is-wished','is-breezy');clearTimeout(breezeTimer);wishStage.style.removeProperty('--wish-light');
  meter.firstElementChild.style.width='0';meter.setAttribute('aria-valuenow','0');wishStage.setAttribute('aria-label','两只小狗陪白白许愿，生日蛋糕上亮着三根蜡烛');
  status.textContent='再许一个愿，鸡毛也认真听着。';
 });
 mic.addEventListener('click',async()=>{
  if(stream){stopMicrophone();status.textContent='麦克风已关闭，按住按钮也可以吹蜡烛。';return;}
  if(done)return;
  if(!navigator.mediaDevices?.getUserMedia){status.textContent='这个浏览器暂不支持麦克风，按住按钮也能吹灭蜡烛。';return;}
  const request=++micRequest;mic.disabled=true;status.textContent='允许使用麦克风后，先安静一秒，再轻轻吹气。';
  try{
   const input=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:false,noiseSuppression:false,autoGainControl:false},video:false});
   if(request!==micRequest||done||document.hidden){input.getTracks().forEach(t=>t.stop());return;}
   stream=input;audioContext=new (window.AudioContext||window.webkitAudioContext)();await audioContext.resume();
   const analyser=audioContext.createAnalyser();analyser.fftSize=1024;
   audioContext.createMediaStreamSource(stream).connect(analyser);
   const samples=new Float32Array(analyser.fftSize);
   const calibrationEnd=performance.now()+900;let baseline=0,sampleCount=0,previous=performance.now();
   mic.textContent='关闭麦克风';mic.setAttribute('aria-pressed','true');
   function listen(now){
    if(!stream||done)return;
    analyser.getFloatTimeDomainData(samples);const volume=Math.sqrt(samples.reduce((sum,v)=>sum+v*v,0)/samples.length);
    const delta=Math.min(now-previous,100);previous=now;
    if(now<calibrationEnd){baseline+=volume;sampleCount++;}
    else{
     if(sampleCount){baseline/=sampleCount;sampleCount=0;status.textContent='麦克风开好啦，对着手机轻轻吹一口气。';}
     if(volume>Math.max(.018,baseline*2.4+.008))addBreeze(delta/1700);
    }
    if(stream&&!done)micFrame=requestAnimationFrame(listen);
   }
   micFrame=requestAnimationFrame(listen);
  }catch{stopMicrophone();status.textContent='麦克风没有开启，按住按钮或轻点三下也能吹灭蜡烛。';}
  finally{mic.disabled=done;}
 });
 document.addEventListener('visibilitychange',()=>{if(document.hidden){stopHolding();stopMicrophone();if(!video.hidden&&!video.paused)video.pause();}else if(video.paused)resumeMusic();});
 window.addEventListener('pagehide',()=>{stopHolding();stopMicrophone();});
})();
