const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {webcrypto}=require('node:crypto');
const base=__dirname+'/../build/cloudflare-source/';
const key='birthday-paws:23:progress:v1';
const progressCode=fs.readFileSync(base+'progress.js','utf8');
const config=JSON.parse(progressCode.match(/config=(\{[^\n]+\});/)[1]);
class Node{
 constructor(tag='div'){
  this.tagName=tag.toUpperCase();this.children=[];this.dataset={};this.attrs={};this.listeners={};this.open=false;this.hidden=false;this.classes=new Set();
  this.classList={add:(...v)=>v.forEach(x=>this.classes.add(x)),remove:(...v)=>v.forEach(x=>this.classes.delete(x)),toggle:(v,on)=>on?this.classes.add(v):this.classes.delete(v),contains:v=>this.classes.has(v)};
  this.style={setProperty(){}};this.firstChild={textContent:''};this.currentTime=0;this.paused=true;this.ended=false;
 }
 append(...nodes){this.children.push(...nodes);}replaceChildren(...nodes){this.children=nodes;}
 setAttribute(k,v){this.attrs[k]=v;}removeAttribute(k){delete this.attrs[k];}
 addEventListener(event,fn){(this.listeners[event]??=[]).push(fn);}
 click(){if(!this.disabled)(this.listeners.click||[]).forEach(fn=>fn({target:this}));}
 querySelector(selector){for(const child of this.children){if(child.className?.split(' ').includes(selector.slice(1)))return child;const found=child.querySelector?.(selector);if(found)return found;}return this.img??=new Node('img');}
 querySelectorAll(){return this.cards??=[];}
 showModal(){this.open=true;}close(){this.open=false;}focus(){}getBoundingClientRect(){return{width:340,height:300};}
 getContext(){return new Proxy({},{get:()=>()=>{}});}decode(){return Promise.resolve();}
 pause(){this.paused=true;}play(){this.paused=false;return Promise.resolve();}load(){}
 animate(){return{cancel(){},pause(){},play(){}};}
}
function boot(saved,storageThrows=false){
 const nodes=new Map(),events={},pending=new Map(),store=new Map(),next={value:0};
 if(saved!==undefined)store.set(key,typeof saved==='string'?saved:JSON.stringify(saved));
 const get=id=>{if(!nodes.has(id))nodes.set(id,new Node());return nodes.get(id);};
 get('memory-montage').cards=Array.from({length:8},()=>new Node());
 const document={documentElement:get('html'),body:get('body'),hidden:false,activeElement:null,getElementById:get,querySelector:selector=>get(selector),querySelectorAll:()=>[],createElement:tag=>new Node(tag),createTextNode:text=>({textContent:text}),addEventListener:(event,fn)=>(events[event]??=[]).push(fn),removeEventListener(){},dispatchEvent(){}};
 const context={console,crypto:webcrypto,Uint32Array,Event:class{},Image:class{addEventListener(){}},localStorage:{getItem(k){if(storageThrows)throw Error('blocked');return store.get(k)??null;},setItem(k,v){if(storageThrows)throw Error('full');store.set(k,v);}},document,window:{addEventListener(){},scrollY:0,scrollTo(){}},matchMedia:()=>({matches:true}),getComputedStyle:()=>({opacity:'0',transform:'none'}),performance:{now:()=>0},setTimeout(fn,ms){const id=++next.value;pending.set(id,{fn,ms});return id;},clearTimeout:id=>pending.delete(id),cancelAnimationFrame(){},requestAnimationFrame(){return 1;}};
 vm.createContext(context);vm.runInContext(progressCode,context);
 const run=file=>vm.runInContext(fs.readFileSync(base+file,'utf8'),context);
 const tick=()=>{const entry=pending.entries().next().value;assert(entry,'timer expected');pending.delete(entry[0]);entry[1].fn();};
 const record=()=>JSON.parse(store.get(key));
 return{context,nodes,get,pending,store,run,tick,record,progress:context.window.BirthdayProgress};
}
function modules(t){for(const f of ['app.js','cards.js','game-rules.js','games.js','finale.js','welcome.js','memories.js','letter.js'])t.run(f);}
function saved(fields={}){return{version:1,signature:config.signature,won:[],unlockedRound:null,completed:false,letterOpened:false,scratched:false,musicEnabled:true,...fields};}
(async()=>{
 let t=boot();assert.equal(t.progress.isComplete(),false);t.progress.complete();assert.equal(t.progress.isComplete(),false);
 t.progress.unlock(0);assert.equal(t.record().unlockedRound,0);t.progress.reservePrize(1,0);assert.deepEqual(t.record().won,[1]);
 t.progress.unlock(1);t.progress.reservePrize(2,1);t.progress.unlock(2);t.progress.reservePrize(7,2);t.progress.complete();assert.equal(t.progress.isComplete(),false,'Three draws alone do not complete the experience.');
 t.progress.openLetter();assert.equal(t.progress.isComplete(),false);t.progress.complete();assert.equal(t.record().completed,true);assert.equal(t.get('html').dataset.birthdayComplete,'true');
 for(const invalid of ['bad JSON',saved({won:[1,1]}),saved({won:[99]}),saved({won:[7]}),saved({won:[1,2,3]}),saved({won:[1],completed:true}),saved({signature:'old'}),saved({unlockedRound:2}),saved({won:[1],letterOpened:true})]){
  const bad=boot(invalid);assert.equal(bad.progress.isComplete(),false);assert.equal(bad.progress.boot.won.length,0);
 }
 t=boot(undefined,true);modules(t);assert.equal(t.get('welcome').hidden,false,'Blocked storage falls back to normal first visit.');
 // A selected prize is durable before its animation, including a reload mid-spin.
 t=boot();t.run('app.js');t.run('game-rules.js');
 const gate=t.context.BirthdayGameRules.createGate();gate.grant(0);t.progress.unlock(0);
 t.context.window.BirthdayGames={canDraw:i=>gate.canDraw(i),consume:i=>gate.consume(i),render(){}};
 const draw=vm.runInContext('draw()',t.context);assert.equal(t.record().won.length,1);const first=t.record().won[0];
 let resumed=boot(t.record());modules(resumed);assert.equal(vm.runInContext('won[0]',resumed.context),first);assert.equal(resumed.context.window.BirthdayGames.canDraw(1),false);
 while(t.pending.size)t.tick();await draw;assert.equal(vm.runInContext('won[0]',t.context),first);
 resumed=boot(saved({won:[1],unlockedRound:1}));modules(resumed);assert.equal(resumed.context.window.BirthdayGames.canDraw(1),true,'A passed game keeps its unused draw.');assert.equal(resumed.context.window.BirthdayGames.summary().completedGames,2);
 // Finish the actual letter/heart handoff; no early completion at opening/closing.
 t=boot(saved({won:[1,2,7]}));modules(t);assert.equal(t.get('welcome').hidden,false);
 t.get('enter-birthday').click();t.tick();assert.equal(t.get('birthday-finale').open,true);
 t.tick();t.get('finale-close').click();assert.equal(t.get('birthday-letter-ending').open,true);
 t.get('open-birthday-letter').click();t.tick();assert.equal(t.record().letterOpened,true);assert.equal(t.record().completed,false);
 t.get('letter-finish').click();t.tick();assert.equal(t.get('memory-replay-skip').hidden,true,'The first photo sequence never exposes a skip button.');
 t.get('memory-replay-skip').click();assert.equal(t.get('memory-replay-skip').hidden,true);t.tick();assert.equal(t.record().completed,false,'The heart still waits for the final button.');
 t.get('memory-enter-year').click();t.tick();t.tick();assert.equal(t.record().completed,false,'The covered return transition must finish too.');t.tick();assert.equal(t.record().completed,true);
 const finalRecord=t.record();resumed=boot(finalRecord);modules(resumed);
 assert.equal(resumed.get('welcome').hidden,true);assert.equal(resumed.get('header').inert,false);assert.equal(resumed.get('main').inert,false);
 assert.equal(resumed.get('collection').hidden,false);assert.equal(resumed.get('draw').disabled,true);
 assert.equal(resumed.get('prize-list').children.filter(c=>c.classList.contains('is-earned')).length,3);assert.equal(resumed.get('prize-list').children.filter(c=>c.classList.contains('is-not-won')).length,5);
 resumed.context.window.BirthdayFinale.show();assert.equal(resumed.get('birthday-finale').open,false,'Completed visits never auto-replay the packing finale.');
 resumed.context.window.BirthdayFinale.showTickets();assert.equal(resumed.get('redemption-prizes').children.length,3);resumed.get('redemption-done').click();
 resumed.context.window.BirthdayLetter.show();assert.equal(resumed.get('letter-reader').hidden,false,'The saved letter remains available to reread.');
 assert.deepEqual(JSON.parse(JSON.stringify(resumed.progress.boot.won)),[1,2,7]);
 resumed.get('letter-finish').click();resumed.tick();assert.equal(resumed.get('memory-replay-skip').hidden,true,'Reduced motion moves straight to the still heart, so no redundant skip remains.');
 // The normal-motion second reading offers a skip, preserves 10cm, and keeps the final transition.
 resumed=boot(finalRecord);resumed.context.matchMedia=()=>({matches:false});modules(resumed);
 resumed.context.window.BirthdayLetter.show();resumed.get('letter-finish').click();resumed.tick();
 assert.equal(resumed.get('memory-replay-skip').hidden,false);const letterSong=resumed.get('birthday-bgm').src;
 resumed.get('memory-replay-skip').click();assert.equal(resumed.get('memory-replay-skip').hidden,true);resumed.tick();
 assert.equal(resumed.get('memory-heart-ending').hidden,false);assert.equal(resumed.get('birthday-bgm').src,letterSong,'Skipping the photos does not change or restart 10cm.');
 assert.equal(resumed.get('birthday-year-gate').open,false,'The heart waits for the final explicit click.');
 assert.deepEqual(resumed.record().won,[1,2,7]);resumed.get('memory-enter-year').click();resumed.tick();resumed.tick();resumed.tick();
 assert.equal(resumed.get('birthday-bgm').src,'assets/birthday-bgm.mp3');assert.equal(resumed.get('birthday-year-gate').open,false);
 resumed=boot({...finalRecord,musicEnabled:false});modules(resumed);assert.equal(resumed.get('birthday-bgm').paused,true,'Manual mute persists on return.');
 assert(!fs.readFileSync(__dirname+'/../dist/netlify/index.html','utf8').includes('BirthdayProgress'),'Netlify publication has no persistence feature.');
 console.log('PASS: first visit, saved games/prizes, mid-spin reload, invalid/blocked storage, final transition completion, completed return, exact three gifts, rereading, quiet preference and Cloudflare-only isolation.');
})().catch(error=>{console.error(error);process.exitCode=1;});
