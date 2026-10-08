'use strict';
// Small, independent rules shared by the birthday games and their checks.
globalThis.BirthdayGameRules = {
 createGate(rounds=3){
  const passed=Array(rounds).fill(false);let current=0;
  return {
   get round(){return current;},
   get passed(){return passed.slice();},
   canDraw(round){return round===current&&current<rounds&&passed[round];},
   grant(round){if(round!==current||current>=rounds||passed[round])return false;passed[round]=true;return true;},
   consume(round){if(!this.canDraw(round))throw new Error('请先完成这一关小游戏。');current++;},
  };
 },
 shuffled(values,random=Math.random){
  const result=values.slice();for(let i=result.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[result[i],result[j]]=[result[j],result[i]];}return result;
 },
 createCatch(){
  const state={x:.5,time:15,score:0,items:[],untilSpawn:.15,done:false,passed:false};
  return {
   state,
   move(x){state.x=Math.max(.1,Math.min(.9,x));},
   step(seconds,random=Math.random){
    if(state.done)return;
    const dt=Math.min(seconds,state.time);state.time=Math.max(0,state.time-dt);state.untilSpawn-=dt;
    if(state.untilSpawn<=0){state.items.push({x:.1+random()*.8,y:-.08,kind:Math.floor(random()*3)});state.untilSpawn+=.5;}
    for(const item of state.items){
     item.y+=dt*.4;
     if(item.y>=.78&&item.y<=.97&&Math.abs(item.x-state.x)<=.12){item.caught=true;state.score++;}
    }
    state.items=state.items.filter(item=>!item.caught&&item.y<1.08);
    if(state.score>=10){state.done=true;state.passed=true;}
    else if(state.time<=0)state.done=true;
   }
  };
 },
 createMemory(random=Math.random){
  const values=this.shuffled([0,0,1,1,2,2,3,3],random);
  const matched=Array(8).fill(false);let selected=[],turns=0;
  return {
   values,matched,
   get selected(){return selected.slice();},get turns(){return turns;},get done(){return matched.every(Boolean);},
   pick(index){
    if(!Number.isInteger(index)||index<0||index>=8||matched[index]||selected.includes(index)||selected.length>=2)return 'ignored';
    selected.push(index);if(selected.length===1)return 'flipped';turns++;
    if(values[selected[0]]===values[selected[1]]){selected.forEach(i=>matched[i]=true);selected=[];return 'matched';}
    return 'miss';
   },
   resolveMiss(){selected=[];},
  };
 },
 createPuzzle(random=Math.random){
  const columns=4,rows=3;
  const tiles=this.shuffled(Array.from({length:columns*rows},(_,i)=>i),random);if(tiles.every((v,i)=>v===i))tiles.push(tiles.shift());
  let selected=null,moves=0;
  return {
   tiles,columns,rows,get selected(){return selected;},get moves(){return moves;},get done(){return tiles.every((v,i)=>v===i);},
   pick(index){
    if(!Number.isInteger(index)||index<0||index>=tiles.length||this.done)return;
    if(selected===null){selected=index;return;}
    if(selected!==index){[tiles[selected],tiles[index]]=[tiles[index],tiles[selected]];moves++;}
    selected=null;
   },
  };
 },
};
