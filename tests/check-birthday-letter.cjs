const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const nodes=new Map(),motions=[];
function get(id){
 if(!nodes.has(id)){
  const listeners={},classes=new Set();
  nodes.set(id,{hidden:false,open:false,disabled:false,scrollTop:0,textContent:'',loading:'lazy',style:{},attrs:{},listeners,classList:{add(...v){v.forEach(x=>classes.add(x));},remove(...v){v.forEach(x=>classes.delete(x));},toggle(v,on){on?classes.add(v):classes.delete(v);},contains:v=>classes.has(v)},addEventListener:(name,fn)=>listeners[name]=fn,setAttribute(name,value){this.attrs[name]=value;},showModal(){this.open=true;},close(){this.open=false;},focus(){},decode(){return Promise.resolve();},querySelector(){return get(id+'-img');},getBoundingClientRect(){return{width:340};},animate(frames,options){const a={frames,options,node:this,cancel(){},pause(){},play(){}};motions.push(a);return a;}});
 }return nodes.get(id);
}
const cards=Array.from({length:8},(_,i)=>get('photo-'+i));get('memory-montage').querySelectorAll=()=>cards;
const original={title:'original',src:'birthday-bgm.mp3'},calls=[],docEvents={},winEvents={};
let audio={track:original,time:42,playing:true},pending=new Map(),nextTimer=0,now=0,reduced=false,scroll=[];
const document={body:get('body'),hidden:false,getElementById:get,querySelectorAll:()=>[],querySelector:()=>get('draw-card'),addEventListener:(event,fn)=>docEvents[event]=fn};
const context={getComputedStyle:node=>({opacity:node.style.opacity||'0',transform:node.style.transform||'none'}),$:get,won:[],birthday:{drawLimit:3},matchMedia:()=>({matches:reduced}),performance:{now:()=>now},setTimeout(fn,ms){const id=++nextTimer;pending.set(id,{fn,ms});return id;},clearTimeout:id=>pending.delete(id),document,window:{scrollY:123,scrollTo(options){scroll.push(options);},addEventListener:(event,fn)=>winEvents[event]=fn,BirthdayAudio:{snapshot:()=>audio,setTrack(track,options){calls.push({track,options});audio={track,time:options.time||0,playing:options.autoplay};},toggle(){audio.playing=!audio.playing;}}}};
function tick(){const entry=pending.entries().next().value;assert(entry,'Expected a pending timeline event');const[id,task]=entry;pending.delete(id);now+=task.ms;task.fn();}
vm.createContext(context);for(const file of ['memories.js','letter.js'])vm.runInContext(fs.readFileSync(__dirname+'/../src/'+file,'utf8'),context);
const letter=context.window.BirthdayLetter,memories=context.window.BirthdayMemories,modal=get('birthday-letter-ending'),gate=get('birthday-year-gate');
letter.show();assert.equal(modal.open,false);assert.equal(calls.length,0);
context.won.push(0,1,7);letter.sync();get('result').open=true;letter.show();assert.equal(modal.open,false);get('result').open=false;
get('birthday-finale').open=true;letter.show();assert.equal(modal.open,false);get('birthday-finale').open=false;
letter.show();assert.equal(modal.open,true);assert.equal(get('letter-arrival').hidden,false);assert.equal(get('letter-reader').hidden,true);assert.equal(calls.length,0);
assert(cards.every(card=>card.querySelector().loading==='eager'));
get('open-birthday-letter').listeners.click();get('open-birthday-letter').listeners.click();assert.equal(calls.length,1);assert.equal(calls[0].track.src,'assets/letter-bgm.mp3');tick();
const song=audio.track,count=calls.length;get('letter-reader-back').listeners.click();get('letter-reader-back').listeners.click();assert.equal(pending.size,1);tick();
assert.equal(memories.isActive(),true);assert.equal(calls.length,count);assert.equal(get('letter-reader').hidden,true);
get('memory-enter-year').listeners.click();assert.equal(gate.open,false,'Early clicks must not return before the heart is assembled.');
now+=1000;document.hidden=true;docEvents.visibilitychange();assert.equal(pending.size,0);document.hidden=false;docEvents.visibilitychange();assert.equal([...pending.values()][0].ms,2300);
for(let i=0;i<8;i++)tick();tick();
assert.equal(get('memory-heart-ending').hidden,false);assert.equal(pending.size,0,'The assembled heart waits indefinitely for an explicit click.');
assert.equal(new Set(motions.filter(m=>m.options.duration===5400).map(m=>m.node)).size,8,'All eight photos enter the continuous stream.');
assert.equal(motions.filter(m=>m.options.duration===2400).length,8,'The same eight cards gather into the heart.');assert.equal(calls.length,count);assert.equal(audio.track,song);
get('memory-enter-year').listeners.click();get('memory-enter-year').listeners.click();assert.equal(pending.size,1);assert.equal(gate.open,true);tick();
assert.equal(modal.open,false);assert.equal(gate.open,true);assert(gate.classList.contains('is-covered'),'Main page changes only behind the opaque curtains.');assert.equal(audio.track,song);assert.equal(scroll.at(-1).top,0);
tick();assert(gate.classList.contains('is-opening'));assert.equal(audio.track,song);tick();
assert.equal(gate.open,false);assert.equal(memories.isActive(),false);assert.equal(calls.at(-1).track,original);assert.equal(calls.at(-1).options.time,42);
// A temporary video pause must not silence the letter track or the return track.
audio={track:original,time:50,playing:false,enabled:true};letter.show();assert.equal(calls.at(-1).options.autoplay,true);get('letter-finish').listeners.click();tick();memories.skip();tick();get('memory-enter-year').listeners.click();tick();tick();tick();assert.equal(calls.at(-1).options.autoplay,true);assert.equal(calls.at(-1).options.time,50);
// Repeat + skip still requires the final button; quiet preference remains quiet.
audio={track:original,time:55,playing:false};letter.show();assert.equal(calls.at(-1).options.autoplay,false);get('letter-finish').listeners.click();tick();memories.skip();memories.skip();assert.equal(pending.size,1);tick();assert.equal(pending.size,0);assert.equal(modal.open,true);get('memory-enter-year').listeners.click();tick();tick();tick();assert.equal(calls.at(-1).options.autoplay,false);assert.equal(calls.at(-1).options.time,55);
// Reduced motion produces a still heart, but never silently auto-returns.
reduced=true;letter.show();get('letter-finish').listeners.click();tick();tick();assert.equal(pending.size,0);assert.equal(get('memory-heart-ending').hidden,false);get('memory-enter-year').listeners.click();tick();tick();tick();assert.equal(memories.isActive(),false);
assert.deepEqual(context.won,[0,1,7]);
console.log('PASS: eight overlapping photos, eight-photo heart, explicit final click, covered page handoff, song continuous through reveal, background pause, replay/skip/reduced motion, quiet entry, unchanged prizes.');
