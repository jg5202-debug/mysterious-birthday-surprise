'use strict';
window.BirthdayCards=(()=>{
 const gallery=$('prize-list'),board=$('result-card-grid'),modal=$('result');
 let flipTimer=0,detailTimer=0;
 const galleryCards=[];
 function node(tag,className,text){const el=document.createElement(tag);el.className=className;if(text!==undefined)el.textContent=text;return el;}
 function card(index,compact=false){
  const prize=prizes[index],el=node(compact?'div':'button','gift-card'+(compact?' compact-card':''));
  if(!compact)el.type='button';
  el.dataset.prize=String(index);
  const inner=node('span','gift-card-inner'),back=node('span','gift-card-back'),front=node('span','gift-card-front');
  back.append(node('small','card-corner','23'),createDogHead(),node('strong','','生日小幸运'),node('small','','TO 小白包'),node('span','card-back-spark','✦'));
  const icon=node('span','gift-card-icon');setPrizeIcon(icon,prize.icon);
  front.append(node('small','card-earned','白白的专属礼券'),icon,node('strong','gift-card-title',prize.name));
  if(!compact)front.append(node('span','gift-card-description',prize.description),node('small','card-front-note','鸡毛负责兑现'));
  inner.append(back,front);el.append(inner);
  el.front=front;el.back=back;
  if(!compact)el.addEventListener('click',()=>{if(won.includes(index)&&!spinning){setDetails(index);reveal(index,false);}});
  return el;
 }
 function visibility(el,index,revealed){
  el.classList.toggle('is-revealed',revealed);
  el.back.setAttribute('aria-hidden',String(revealed));el.front.setAttribute('aria-hidden',String(!revealed));
  const earned=won.includes(index);
  el.classList.toggle('is-earned',earned);el.classList.toggle('is-not-won',revealed&&!earned);
  el.front.querySelector('.card-earned').textContent=earned?'已抽中 · 白白的专属礼券':'本次未抽中';
  const note=el.front.querySelector('.card-front-note');if(note)note.textContent=earned?'鸡毛负责兑现':'本次未获得';
  el.setAttribute('aria-label',revealed?prizes[index].name+(earned?'，已抽中'+(el.tagName==='BUTTON'?'，点击查看礼券':''):'，本次未抽中'):'第 '+(index+1)+' 张生日礼物卡，尚未抽中');
  if(el.tagName==='BUTTON')el.disabled=!revealed||!earned||spinning;
 }
 function setDetails(index){const p=prizes[index];$('result-title').textContent=p.name;setPrizeIcon($('result-icon'),p.icon);$('result-desc').textContent=p.description;}
 function render(){
  if(!galleryCards.length){prizes.forEach((_,i)=>galleryCards.push(card(i)));gallery.replaceChildren(...galleryCards);}
  const completed=won.length===birthday.drawLimit;
  galleryCards.forEach((el,i)=>visibility(el,i,completed||won.includes(i)));
  document.querySelector('.card-gallery-hint').textContent=completed?'八份心意都翻开啦。金色是抽中的三张礼券，灰色是本次未抽中的心意。':'未拆开的心意藏在牌背里，抽中后就会翻开点亮。';
 }
 function clear(){clearTimeout(flipTimer);clearTimeout(detailTimer);$('collect').disabled=false;}
 function reveal(selected,animate=true){
  if(!won.includes(selected))return;
  clear();setDetails(selected);
  modal.classList.remove('card-detail-ready');
  const cards=prizes.map((_,i)=>{const el=card(i,true);visibility(el,i,won.includes(i)&&i!==selected);if(i===selected)el.classList.add('is-winning');return el;});
  board.replaceChildren(...cards);
  $('card-reveal-status').textContent=animate?'小狗找到这次的幸运卡啦…':'这份偏爱已经收好啦。';
  $('collect').disabled=animate;
  if(!modal.open)modal.showModal();
  const turn=()=>{visibility(cards[selected],selected,true);$('card-reveal-status').textContent='点亮啦！'+prizes[selected].name+'属于白白。';};
  const finish=()=>{modal.classList.add('card-detail-ready');$('collect').disabled=false;};
  if(!animate||matchMedia('(prefers-reduced-motion: reduce)').matches){turn();finish();}
  else{flipTimer=setTimeout(turn,550);detailTimer=setTimeout(finish,1500);}
 }
 modal.addEventListener('close',clear);
 window.addEventListener('pagehide',clear);
 render();return {render,reveal};
})();
