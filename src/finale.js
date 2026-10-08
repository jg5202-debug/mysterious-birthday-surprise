'use strict';
window.BirthdayFinale=(()=>{
 const modal=$('birthday-finale');let shown=false,packingTimer;
 function show(){
  if(shown||won.length!==birthday.drawLimit||$('result').open)return;
  shown=true;$('finale-close').disabled=true;
  $('envelope-tickets').replaceChildren(...won.map((prizeIndex,index)=>{
   const ticket=document.createElement('div');ticket.className='envelope-ticket';ticket.style.setProperty('--ticket-x',[-78,0,78][index]+'px');ticket.style.setProperty('--ticket-angle',[-13,0,13][index]+'deg');ticket.style.animationDelay=(.3+index*.45)+'s';
   const icon=document.createElement('span');setPrizeIcon(icon,prizes[prizeIndex].icon);const title=document.createElement('strong');title.textContent=prizes[prizeIndex].name;const label=document.createElement('small');label.textContent='小白包的生日礼券 · 0'+(index+1);ticket.append(icon,title,label);return ticket;
  }));
  modal.showModal();
  const pack=()=>{modal.classList.add('is-packed');$('finale-close').disabled=false;if(!matchMedia('(prefers-reduced-motion: reduce)').matches)celebrate();};
  packingTimer=setTimeout(pack,matchMedia('(prefers-reduced-motion: reduce)').matches?0:2600);
 }
 function close(){clearTimeout(packingTimer);modal.classList.add('is-packed');modal.close();if(window.BirthdayLetter){window.BirthdayLetter.show();return;}$('collection').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});$('collection').focus({preventScroll:true});}
 $('finale-close').addEventListener('click',close);modal.addEventListener('cancel',e=>{e.preventDefault();close();});
 const tickets=$('redemption-envelope');
 let ticketOpener=null;
 function showTickets(){
  if(!won.length||spinning||tickets.open||$('result').open||modal.open)return;
  ticketOpener=document.activeElement;
  $('redemption-subtitle').textContent='这 '+won.length+' 份小幸运，已经属于白白啦。';
  $('redemption-prizes').replaceChildren(...won.map((prizeIndex,index)=>{
   const item=document.createElement('li'),icon=document.createElement('span'),copy=document.createElement('div'),title=document.createElement('h3'),description=document.createElement('p');
   icon.className='redemption-prize-icon';setPrizeIcon(icon,prizes[prizeIndex].icon);
   title.textContent=prizes[prizeIndex].name;description.textContent=prizes[prizeIndex].description;copy.append(title,description);item.append(icon,copy);return item;
  }));
  tickets.showModal();tickets.scrollTop=0;
 }
 function closeTickets(){tickets.close();ticketOpener?.focus({preventScroll:true});}
 $('redemption-close').addEventListener('click',closeTickets);$('redemption-done').addEventListener('click',closeTickets);
 tickets.addEventListener('cancel',event=>{event.preventDefault();closeTickets();});
 return {show,showTickets};
})();
