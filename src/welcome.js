'use strict';
// A local audio file keeps the birthday song independent of music-service logins.
const birthdayMusic={title:'路上的猫尾草，你的心情',src:'assets/birthday-bgm.mp3',label:'生日背景音乐'};
let activeMusic=birthdayMusic;
const welcome=document.getElementById('welcome');
const enter=document.getElementById('enter-birthday');
const bgm=document.getElementById('birthday-bgm');
const dock=document.getElementById('music-dock');
const toggle=document.getElementById('music-toggle');
const label=document.getElementById('music-label');
const status=document.getElementById('music-status');
const pageContent=[document.querySelector('header'),document.querySelector('main')];
let entered=false,musicAttempt=0,trackVersion=0,musicWanted=false;
bgm.volume=.35;
if(birthdayMusic.src)bgm.src=birthdayMusic.src;
function updateMusic(){
 const playing=!bgm.paused&&!bgm.ended;
 toggle.classList.toggle('is-playing',playing);
 toggle.setAttribute('aria-pressed',String(playing));
 toggle.setAttribute('aria-label',(playing?'暂停':'播放')+activeMusic.label);
 toggle.title=activeMusic.title;
 label.textContent=playing?'音乐播放中':'播放音乐';
 document.dispatchEvent(new Event('birthdaymusicchange'));
}
async function playBirthdayMusic(){
 if(!activeMusic.src){status.textContent='生日音乐正在准备中';return;}
 const attempt=++musicAttempt;musicWanted=true;
 status.textContent='';
 // A pending request for the previous song may settle after a track switch.
 // It must not pause the shared audio element now playing the new song.
 try{await bgm.play();if(attempt!==musicAttempt)return;}
 catch(error){if(attempt!==musicAttempt)return;status.textContent=error.name==='NotAllowedError'?'点一下播放，开启音乐':'音乐暂时没连上，点播放再试一次';}
 updateMusic();
}
function finishWelcome(){
 welcome.hidden=true;
 document.body.classList.remove('welcome-active');
 pageContent.forEach(el=>{el.inert=false;});
 if(birthdayMusic.src)dock.hidden=false;
 document.getElementById('draw').focus({preventScroll:true});
}
function enterBirthday(){
 if(entered)return;
 entered=true;
 enter.disabled=true;
 musicWanted=true;
 void playBirthdayMusic();
 welcome.classList.add('is-opening');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 if(!reduced&&typeof celebrate==='function')celebrate();
 setTimeout(finishWelcome,reduced?0:850);
}
enter.addEventListener('click',enterBirthday);
function toggleMusic(){
 if(!bgm.paused){musicWanted=false;musicAttempt++;bgm.pause();status.textContent='';}
 else void playBirthdayMusic();
 updateMusic();
}
toggle.addEventListener('click',toggleMusic);
window.BirthdayAudio={
 snapshot(){return {track:activeMusic,time:bgm.currentTime,playing:!bgm.paused&&!bgm.ended,enabled:musicWanted};},
 pause(){musicAttempt++;bgm.pause();status.textContent='';updateMusic();},
 resume:playBirthdayMusic,
 setTrack(track,{autoplay=false,time=0}={}){
  const version=++trackVersion;musicAttempt++;musicWanted=autoplay;bgm.pause();activeMusic=track;status.textContent='';
  bgm.src=track.src;bgm.load();
  if(time>0){const restore=()=>{if(version!==trackVersion)return;try{bgm.currentTime=time;}catch{}};bgm.addEventListener('loadedmetadata',restore,{once:true});}
  updateMusic();if(autoplay)void playBirthdayMusic();
 },
 toggle:toggleMusic,
};
for(const event of ['play','pause','ended'])bgm.addEventListener(event,updateMusic);
bgm.addEventListener('error',()=>{if(entered)status.textContent='音乐暂时没连上，点播放再试一次';updateMusic();});
welcome.hidden=false;
document.body.classList.add('welcome-active');
pageContent.forEach(el=>{el.inert=true;});
enter.disabled=false;
updateMusic();
