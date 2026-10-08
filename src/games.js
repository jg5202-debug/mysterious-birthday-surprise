'use strict';
window.BirthdayGames=(()=>{
 const rules=BirthdayGameRules,gate=rules.createGate(birthday.drawLimit);
 const names=['小狗接礼物','狗狗翻翻乐','拼好生日合照'];
 const descriptions=['15 秒内接住 10 份礼物，就能获得第一次抽奖机会。','找到 4 对相同的生日卡片，就能获得第二次抽奖机会。','把 12 块小拼图拼成完整的生日合照，解锁最后一份惊喜。'];
 const modal=$('minigame'),body=$('game-body'),status=$('game-status'),action=$('game-action');
 const progress=$('game-progress'),track=$('game-track');
 const portraits=['assets/puppy-head-cutout.png','assets/yellow-head-cutout.png','assets/puppy-cake.jpg','assets/welcome-white-gift.jpg'];
 const portraitNames=['小白','小金毛','生日蛋糕','生日礼盒'];
 const picture='assets/welcome-party-clean.png';
 let activeRound=-1,epoch=0,animation=0,missTimer=0,catchGame=null,memory=null,puzzle=null;
 function element(tag,className,text){const node=document.createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=text;return node;}
 function button(text,handler,className=''){const node=element('button',className,text);node.type='button';node.addEventListener('click',handler);return node;}
 function stop(){epoch++;cancelAnimationFrame(animation);animation=0;clearTimeout(missTimer);catchGame=null;}
 function renderProgress(){
  const passed=gate.passed,round=won.length;
  track.replaceChildren(...names.map((name,index)=>{
   const node=element('span','game-step'+(index<round?' is-complete':index===round?' is-current':''));
   node.textContent=(index<round?'✓':String(index+1))+' '+name;
   if(index===round)node.setAttribute('aria-current','step');return node;
  }));
  progress.textContent=round>=3?'三关都完成啦，生日好运已收好！':gate.canDraw(round)?'这一关通过啦！抽一份小幸运吧。':'先玩第 '+(round+1)+' 关，再拆一份生日惊喜。';
  $('game-rules-note').textContent='每关解锁一次抽奖 · 失败可无限重试';
  if(!spinning&&round<birthday.drawLimit)$('draw').firstChild.textContent=gate.canDraw(round)?'抽一份小幸运 ':'玩第 '+(round+1)+' 关 · 解锁抽奖 ';
  return passed;
 }
 function close(){stop();if(modal.open)modal.close();$('draw').focus({preventScroll:true});}
 function pass(round){
  if(round!==won.length||!gate.grant(round))return;
  stop();renderProgress();
  $('game-status').textContent='通关啦！';
  body.replaceChildren();
  const panel=element('div','game-success');
  const photo=element('img');photo.src=round===2?picture:portraits[round];photo.alt=round===2?'小白和小金毛的生日合照':'小狗送来生日好运';
  const artwork=round===2?photo:element('span','dog-head success-head');if(round!==2)artwork.append(photo);
  panel.append(artwork,element('h3','',round===2?'鸡毛陪白白，把快乐拼完整！':'白白大王，闯关成功！'),element('p','','获得 1 次抽奖机会，去拆开这一份偏爱吧。'));
  body.append(panel);action.hidden=false;action.disabled=false;action.textContent='去抽礼物';action.onclick=close;action.focus({preventScroll:true});
  if(!matchMedia('(prefers-reduced-motion: reduce)').matches)celebrate();
 }
 function stats(left,right){const bar=element('div','game-stats');const a=element('span','',left),b=element('span','',right);bar.append(a,b);body.append(bar);return [a,b];}
 function setupCatch(){
  body.replaceChildren();catchGame=null;
  const [scoreLabel,timeLabel]=stats('礼物 0 / 10','剩余 15 秒');
  const field=element('div','catch-field');field.setAttribute('role','group');field.setAttribute('aria-label','接礼物区域：按住并拖动小狗接住礼物');
  const layers=element('div','falling-gifts');layers.setAttribute('aria-hidden','true');
  const dog=element('div','catch-dog');const head=element('span','dog-head');const image=element('img');image.src=portraits[1];image.alt='';head.append(image);dog.append(head,element('span','','接住小幸运'));field.append(layers,dog);body.append(field);
  body.append(element('p','catch-drag-hint','按住并拖动小狗，接住从天而降的小幸运。'));
  const atPointer=e=>{if(!catchGame)return;const rect=field.getBoundingClientRect();catchGame.move((e.clientX-rect.left)/rect.width);dog.style.left=catchGame.state.x*100+'%';};
  field.addEventListener('pointerdown',e=>{if(!catchGame)return;field.setPointerCapture(e.pointerId);atPointer(e);});
  field.addEventListener('pointermove',e=>{if(field.hasPointerCapture(e.pointerId))atPointer(e);});
  action.hidden=false;action.disabled=false;action.textContent='开始接礼物';status.textContent='准备好啦？小金毛等着接礼物呢。';
  action.onclick=()=>{
   stop();catchGame=rules.createCatch();const run=epoch,round=activeRound;let previous=performance.now();
   action.hidden=true;status.textContent='加油，白白大王！';
   const frame=now=>{
    if(run!==epoch||!modal.open||!catchGame)return;
    const dt=Math.min((now-previous)/1000,.08);previous=now;
    if(!document.hidden){
     catchGame.step(dt);
    }
    const state=catchGame.state;
    dog.style.left=state.x*100+'%';scoreLabel.textContent='礼物 '+Math.min(state.score,10)+' / 10';timeLabel.textContent='剩余 '+Math.ceil(state.time)+' 秒';
    layers.replaceChildren(...state.items.map(item=>{const gift=element('span','falling-gift',['🎁','🎂','🧋'][item.kind]);gift.style.left=item.x*100+'%';gift.style.top=item.y*100+'%';return gift;}));
    if(state.done){
     if(state.passed){pass(round);return;}
     stop();status.textContent='差一点点！好运不会溜走，再试一次吧。';action.hidden=false;action.textContent='再接一次';action.onclick=()=>{setupCatch();action.click();};return;
    }
    animation=requestAnimationFrame(frame);
   };animation=requestAnimationFrame(frame);
  };
 }
 function renderMemory(){
  const grid=$('memory-grid');grid.replaceChildren(...memory.values.map((value,index)=>{
   const revealed=memory.matched[index]||memory.selected.includes(index);
   const card=button('',()=>{
    const outcome=memory.pick(index);renderMemory();
    if(memory.done){pass(activeRound);return;}
    if(outcome==='miss'){
     status.textContent='这两张不一样，记住它们的位置哦。';const run=epoch;
     missTimer=setTimeout(()=>{if(run!==epoch)return;memory.resolveMiss();renderMemory();status.textContent='慢慢找，不限次数。';},800);
    }else if(outcome==='matched')status.textContent='又找到一对小狗啦！';
   },'memory-card'+(revealed?' is-revealed':'')+(memory.matched[index]?' is-matched':''));
   card.disabled=memory.matched[index]||memory.selected.length>=2||memory.selected.includes(index);
   card.setAttribute('aria-label',memory.matched[index]?'已配对的'+portraitNames[value]:revealed?portraitNames[value]:'翻开第 '+(index+1)+' 张生日卡片');
   if(revealed){const portrait=element('span',value<2?'dog-head memory-head':'memory-picture');const image=element('img');image.src=portraits[value];image.alt='';portrait.append(image);card.append(portrait,element('small','',portraitNames[value]));}
   else card.append(element('span','','✦'),element('small','','生日小幸运'));
   return card;
  }));
  $('memory-score').textContent='配对 '+memory.matched.filter(Boolean).length/2+' / 4';$('memory-turns').textContent='翻牌 '+memory.turns+' 次';
 }
 function setupMemory(){
  body.replaceChildren();if(!memory)memory=rules.createMemory();memory.resolveMiss();
  const [score,turns]=stats('','');score.id='memory-score';turns.id='memory-turns';const grid=element('div','memory-grid');grid.id='memory-grid';body.append(grid);
  status.textContent='慢慢找，不限次数。';action.hidden=true;renderMemory();
 }
 function renderPuzzle(){
  $('puzzle-grid').replaceChildren(...puzzle.tiles.map((value,index)=>{
   const tile=button('',()=>{puzzle.pick(index);renderPuzzle();if(puzzle.done)pass(activeRound);},'puzzle-tile'+(puzzle.selected===index?' is-selected':''));
   tile.style.backgroundImage='url("'+picture+'")';tile.style.backgroundPosition=(value%puzzle.columns)*100/(puzzle.columns-1)+'% '+Math.floor(value/puzzle.columns)*100/(puzzle.rows-1)+'%';
   tile.setAttribute('aria-label','第 '+(index+1)+' 格，图块 '+(value+1));tile.setAttribute('aria-pressed',String(puzzle.selected===index));return tile;
  }));
  $('puzzle-moves').textContent='交换 '+puzzle.moves+' 次';
  $('puzzle-placed').textContent='归位 '+puzzle.tiles.filter((value,index)=>value===index).length+' / '+puzzle.tiles.length;
 }
 function setupPuzzle(){
  body.replaceChildren();if(!puzzle)puzzle=rules.createPuzzle();
  const [score,hint]=stats('','');score.id='puzzle-moves';hint.id='puzzle-placed';hint.className='puzzle-caption';
  const grid=element('div','puzzle-grid');grid.id='puzzle-grid';body.append(grid);
  const reference=element('div','puzzle-reference');const image=element('img');image.src=picture;image.alt='完整的生日合照参考';reference.append(image,element('p','','看看小狗、蛋糕和气球的位置，照着合照拼一拼。不限交换次数。'));body.append(reference);
  status.textContent='先点一块，再点另一块交换；再点同一块可以取消。';action.hidden=true;renderPuzzle();
 }
 function open(){
  const round=won.length;if(spinning||round>=3||gate.canDraw(round))return;
  stop();activeRound=round;$('game-title').textContent='第 '+(round+1)+' 关 · '+names[round];$('game-description').textContent=descriptions[round];
  [setupCatch,setupMemory,setupPuzzle][round]();if(!modal.open)modal.showModal();
 }
 $('game-close').addEventListener('click',close);
 modal.addEventListener('cancel',event=>{event.preventDefault();close();});
 modal.addEventListener('close',()=>{stop();if(memory)memory.resolveMiss();});
 window.addEventListener('pagehide',stop);
 renderProgress();
 return {canDraw:round=>gate.canDraw(round),consume:round=>gate.consume(round),render:renderProgress,open,
  summary(){return {completedGames:gate.passed.filter(Boolean).length,unlockedDraw:gate.canDraw(won.length),nextGame:won.length<3?names[won.length]:null};}};
})();
