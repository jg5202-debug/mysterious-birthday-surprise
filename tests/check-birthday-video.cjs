const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const nodes=new Map(),listeners={};
function get(id){if(!nodes.has(id)){
 const classes=new Set(),n={hidden:false,disabled:false,textContent:'',currentTime:0,listeners:{},style:{setProperty(){},removeProperty(){}},classList:{add:v=>classes.add(v),remove:v=>classes.delete(v),contains:v=>classes.has(v),toggle(){}},addEventListener(event,fn){this.listeners[event]=fn;},setAttribute(){},querySelectorAll(){return [get('candle1'),get('candle2'),get('candle3')];},closest(){return get('scene');}};nodes.set(id,n);
 }return nodes.get(id);}
const video=get('birthday-greeting-video'),music=get('birthday-bgm');let resumed=0,pauseRequests=0,observerCallback;
const original={},letter={};let track=original;
music.paused=false;music.currentTime=42;video.paused=true;
video.pause=()=>{if(!video.paused){video.paused=true;video.listeners.pause();}};
video.play=()=>{video.paused=false;video.ended=false;video.listeners.play();return Promise.resolve();};
class Observer{constructor(fn){observerCallback=fn;}observe(){}}
const document={body:get('body'),hidden:false,getElementById:get,addEventListener:(e,fn)=>listeners[e]=fn};
const context={IntersectionObserver:Observer,document,window:{IntersectionObserver:Observer,BirthdayAudio:{snapshot:()=>({track,time:music.currentTime,playing:!music.paused}),pause(){pauseRequests++;music.paused=true;},resume(){resumed++;music.paused=false;return Promise.resolve();}},addEventListener(){}},navigator:{},cancelAnimationFrame(){},setTimeout(){},clearTimeout(){}};
vm.createContext(context);vm.runInContext(fs.readFileSync(__dirname+'/../src/scenes.js','utf8'),context);
(async()=>{
 const start=()=>get('greeting-play').listeners.click();
 assert.equal(video.src,'assets/birthday-greeting.mp4');await start();assert.equal(music.paused,true);assert.equal(pauseRequests,1);
 video.pause();assert.equal(music.paused,false,'Pausing with native video controls must resume BGM.');assert.equal(resumed,1);assert.equal(music.currentTime,42,'Resume preserves the song position.');
 await video.play();assert.equal(music.paused,true);observerCallback([{target:video,intersectionRatio:.6}]);assert.equal(video.paused,false);
 observerCallback([{target:video,intersectionRatio:0}]);assert.equal(video.paused,true);assert.equal(music.paused,false);assert.equal(resumed,2);
 observerCallback([{target:video,intersectionRatio:0}]);assert.equal(resumed,2,'Repeated scroll events do not issue duplicate play requests.');
 await video.play();video.ended=true;video.listeners.ended();assert.equal(video.hidden,true);assert.equal(get('greeting-placeholder').hidden,false);assert.equal(get('greeting-play').textContent,'再看一次小狗日常');assert.equal(resumed,3);video.listeners.ended();assert.equal(resumed,3);
 await start();get('greeting-skip').listeners.click();assert.equal(resumed,4);assert.equal(music.paused,false);
 await start();document.hidden=true;listeners.visibilitychange();assert.equal(video.paused,true);assert.equal(music.paused,true);assert.equal(resumed,4);
 document.hidden=false;listeners.visibilitychange();assert.equal(resumed,5);assert.equal(music.paused,false);
 await video.play();document.fullscreenElement=video;listeners.fullscreenchange();document.fullscreenElement=null;listeners.fullscreenchange();assert.equal(video.paused,true);assert.equal(resumed,6);
 await video.play();video.listeners.webkitendfullscreen();assert.equal(video.paused,true);assert.equal(resumed,7);
 // Explicitly quiet entry / manual music pause remains quiet.
 music.paused=true;await start();video.pause();assert.equal(music.paused,true);get('greeting-skip').listeners.click();assert.equal(resumed,7);
 // An old video pause must not restart playback owned by the letter or a new song.
 music.paused=false;await start();document.body.classList.add('reading-letter');video.pause();assert.equal(resumed,7);document.body.classList.remove('reading-letter');
 music.paused=false;await start();track=letter;video.pause();assert.equal(resumed,7);
 assert(!fs.readFileSync(__dirname+'/../src/index.html','utf8').includes('birthday-party-loop'));
 console.log('PASS: native pause, scroll-away, end/exit, background/return, fullscreen exit, no duplicate resumes, song-position preservation, quiet preference and letter track ownership.');
})().catch(e=>{console.error(e);process.exitCode=1;});
