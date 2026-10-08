const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const nodes=new Map(),plays=[];
function get(id){if(!nodes.has(id))nodes.set(id,{hidden:false,disabled:false,textContent:'',currentTime:0,style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},setAttribute(){},focus(){}});return nodes.get(id);}
const audio=get('birthday-bgm');audio.paused=true;audio.ended=false;
audio.pause=()=>{audio.paused=true;};audio.load=()=>{};
audio.play=()=>{audio.paused=false;return new Promise((resolve,reject)=>plays.push({resolve,reject}));};
const context={Event:class{},setTimeout(){},matchMedia:()=>({matches:true}),document:{getElementById:get,querySelector:get,body:get('body'),dispatchEvent(){}} ,window:{}};
vm.createContext(context);vm.runInContext(fs.readFileSync(__dirname+'/../src/welcome.js','utf8'),context);
(async()=>{
 const old=vm.runInContext('playBirthdayMusic()',context);
 context.window.BirthdayAudio.setTrack({title:'letter',src:'assets/letter-bgm.mp3',label:'读信背景音乐'},{autoplay:true});
 assert.equal(plays.length,2);assert.equal(audio.paused,false);
 plays[0].resolve();await old;
 assert.equal(audio.paused,false,'The obsolete birthday play request must not pause the new letter track.');
 plays[1].resolve();await new Promise(resolve=>setImmediate(resolve));assert.equal(audio.paused,false);
 context.window.BirthdayAudio.toggle();assert.equal(audio.paused,true);
 context.window.BirthdayAudio.toggle();assert.equal(audio.paused,false);plays[2].resolve();await new Promise(resolve=>setImmediate(resolve));
 assert.equal(context.window.BirthdayAudio.snapshot().enabled,true);
 context.window.BirthdayAudio.pause();assert.equal(audio.paused,true);assert.equal(context.window.BirthdayAudio.snapshot().enabled,true,'A video suspension preserves the user’s music preference.');
 context.window.BirthdayAudio.setTrack({title:'letter',src:'assets/letter-bgm.mp3',label:'读信背景音乐'},{autoplay:context.window.BirthdayAudio.snapshot().enabled});assert.equal(audio.paused,false);plays[3].resolve();await new Promise(resolve=>setImmediate(resolve));
 context.window.BirthdayAudio.toggle();assert.equal(context.window.BirthdayAudio.snapshot().enabled,false,'A deliberate music pause remains distinct from video suspension.');
 console.log('PASS: an obsolete play request cannot interrupt the new song; pause and retry remain functional.');
})().catch(error=>{console.error(error.message);process.exitCode=1;});
