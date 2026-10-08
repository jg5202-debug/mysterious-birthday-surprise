const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {webcrypto}=require('node:crypto');
const base=__dirname+'/../src/';
const ruleContext={};vm.createContext(ruleContext);vm.runInContext(fs.readFileSync(base+'game-rules.js','utf8'),ruleContext);
const rules=ruleContext.BirthdayGameRules;
const gate=rules.createGate();
assert.equal(gate.canDraw(0),false);assert.throws(()=>gate.consume(0));assert.equal(gate.grant(1),false);
for(let round=0;round<3;round++){
 assert.equal(gate.grant(round),true);assert.equal(gate.grant(round),false);
 assert.equal(gate.canDraw(round),true);gate.consume(round);
 assert.equal(gate.canDraw(round),false);assert.equal(gate.grant(round),false);
}
assert.equal(gate.grant(3),false);assert.equal(gate.round,3);
const winCatch=rules.createCatch();for(let i=0;i<600&&!winCatch.state.done;i++)winCatch.step(.04,()=>.5);
assert.equal(winCatch.state.passed,true);assert.equal(winCatch.state.score,10);
const failCatch=rules.createCatch();failCatch.move(.1);for(let i=0;i<600&&!failCatch.state.done;i++)failCatch.step(.04,()=>1);
assert.equal(failCatch.state.passed,false);assert.equal(failCatch.state.done,true);assert.equal(rules.createCatch().state.time,15);
const memory=rules.createMemory(()=>.99);assert.equal(memory.pick(0),'flipped');assert.equal(memory.pick(0),'ignored');assert.equal(memory.pick(2),'miss');assert.equal(memory.pick(4),'ignored');memory.resolveMiss();
for(let value=0;value<4;value++){
 const pair=memory.values.map((v,i)=>v===value?i:-1).filter(i=>i>=0);
 assert.equal(memory.pick(pair[0]),'flipped');assert.equal(memory.pick(pair[1]),'matched');
}
assert.equal(memory.done,true);assert.equal(memory.pick(0),'ignored');
for(let seed=0;seed<60;seed++){
 const puzzle=rules.createPuzzle(()=>seed/60);assert.equal(puzzle.done,false);
 assert.equal(puzzle.tiles.length,12);assert.equal(puzzle.columns,4);assert.equal(puzzle.rows,3);assert.equal(new Set(puzzle.tiles).size,12);
 puzzle.pick(12);assert.equal(puzzle.selected,null);
 puzzle.pick(11);assert.equal(puzzle.selected,11);puzzle.pick(11);assert.equal(puzzle.selected,null);assert.equal(puzzle.moves,0);
 for(let i=0;i<puzzle.tiles.length;i++)if(puzzle.tiles[i]!==i){const target=puzzle.tiles.indexOf(i);puzzle.pick(i);puzzle.pick(target);}
 assert.equal(puzzle.done,true);
}
// Exercise the actual draw function, including a blocked draw, credit consumption,
// uniqueness, and the guaranteed final mystery gift in an isolated mock document.
function node(){return {style:{setProperty(){}},classList:{add(){},remove(){}},firstChild:{textContent:''},append(){},replaceChildren(){},addEventListener(){},focus(){},getContext(){return new Proxy({},{get:()=>()=>{}})},showModal(){this.open=true;},close(){this.open=false;}};}
const nodes=new Map();
const context={console,crypto:webcrypto,Uint32Array,Image:class{addEventListener(){}},window:{addEventListener(){}},document:{getElementById(id){if(!nodes.has(id))nodes.set(id,node());return nodes.get(id);},createElement:node,createTextNode:text=>({textContent:text})},matchMedia:()=>({matches:true}),setTimeout:(fn)=>{queueMicrotask(fn);return 1;}};
vm.createContext(context);vm.runInContext(fs.readFileSync(base+'app.js','utf8'),context);
context.gate=rules.createGate();context.window.BirthdayGames={canDraw:i=>context.gate.canDraw(i),consume:i=>context.gate.consume(i),render(){}};
(async()=>{
 await assert.rejects(vm.runInContext('draw()',context),/小游戏/);
 for(let i=0;i<3;i++){
  context.gate.grant(i);const result=await vm.runInContext('draw()',context);
  assert.equal(result.remainingDraws,2-i);
  if(i<2)assert.notEqual(result.prize,'神秘礼物券');else assert.equal(result.prize,'神秘礼物券');
  if(i<2)await assert.rejects(vm.runInContext('draw()',context),/小游戏/);
 }
 assert.equal(vm.runInContext('new Set(won).size',context),3);
 await assert.rejects(vm.runInContext('draw()',context),/结束/);
 // The real finale can only open once after all three gifts are collected.
 const listeners=new Map();nodes.set('finale-close',{...node(),addEventListener:()=>{}});
 nodes.get('result').open=false;
 vm.runInContext(fs.readFileSync(base+'finale.js','utf8'),context);
 let opens=0;nodes.get('birthday-finale').showModal=()=>opens++;
 context.window.BirthdayFinale.show();context.window.BirthdayFinale.show();assert.equal(opens,1);
 console.log('PASS: three game rules, retries, one credit per round, blocked bypasses, three unique draws, guaranteed mystery, and one finale.');
})().catch(error=>{console.error(error);process.exitCode=1;});
