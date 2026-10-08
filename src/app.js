'use strict';
// Change the name, note, draw limit and prizes here to personalise the birthday.
const birthday={name:'小白包',age:23,drawLimit:3,note:'愿你的 23 岁，\n有数不完的开心，\n也有一直陪着你的我。',prizes:[
 {name:"奶茶自由券",icon:"🧋",description:"这一个月所有奶茶都由小鸡毛报销！"},
 {name:"专属约会券",icon:"🎡",description:"指定地球上的任何一个地方和鸡毛约会，费用由鸡毛报销！"},
 {name:"抱抱充电券",icon:"🤍",description:"获得鸡毛的狗狗抱和狗狗亲！"},
 {name:"心愿实现券",icon:"✨",description:"获得狗狗之神的眷顾，心愿实现！"},
 {name:"大餐安排券",icon:"🍜",description:"指定一家餐厅，鸡毛买单！"},
 {name:"狗狗电影券",icon:"🎬",description:"和鸡毛一起看十次狗狗电影！"},
 {name:"狗狗按摩券",icon:"🌷",description:"获得鸡毛的狗狗按摩服务一次！"},
 {id:'mystery',name:"神秘礼物券",icon:"🎁",description:"获得神秘狗狗大礼一份！"}
]};
const $=id=>document.getElementById(id);const prizes=birthday.prizes;let remaining=prizes.map((_,i)=>i),won=[],spinning=false,rotation=0;
const dogHeadImage=new Image();dogHeadImage.addEventListener('load',()=>paintWheel());dogHeadImage.src='assets/puppy-head-cutout.png';
function createDogHead(){const head=document.createElement('span');head.className='dog-head';head.setAttribute('aria-hidden','true');const image=document.createElement('img');image.src=dogHeadImage.src;image.alt='';head.append(image);return head;}
function setPrizeIcon(element,value){element.replaceChildren();if(value==='dog-head')element.append(createDogHead());else element.textContent=value;}
$('greeting').replaceChildren(document.createTextNode(birthday.name+'，'),document.createElement('br'),document.createTextNode(birthday.age+' 岁生日快乐'),Object.assign(document.createElement('span'),{textContent:'！'}));
$('love-note').innerText=birthday.note;
function render(){
 const left=Math.min(birthday.drawLimit-won.length,remaining.length);
 $('chances').innerHTML='还有 <strong>'+left+'</strong> 次惊喜';
 $('draw').disabled=spinning||left<=0;
 $('draw').firstChild.textContent=spinning?'小狗正在挑选好运… ':left<=0?'今天的惊喜都收好啦 ':'抽一份小幸运 ';
 if(window.BirthdayCards)window.BirthdayCards.render();
 $('collection').hidden=won.length===0;
 $('collection-summary').textContent=won.length===birthday.drawLimit?'三份礼物都装好啦，快找鸡毛大王兑奖吧！':'已收好 '+won.length+' 张礼券，再去拆开下一份惊喜吧。';
 const packed=document.createElement('div');packed.className='envelope-summary-count';packed.textContent='✉ '+won.length+' / '+birthday.drawLimit+' 张礼券';
 const view=document.createElement('button');view.type='button';view.className='view-gift-cards';view.textContent='查看点亮的礼券';view.addEventListener('click',()=>window.BirthdayFinale?.showTickets());
 $('ticket-list').replaceChildren(packed,view);
 if(window.BirthdayLetter)window.BirthdayLetter.sync();
 if(window.BirthdayGames)window.BirthdayGames.render();
 if(left<=0)$('hint').textContent='礼券已经收好。愿你的每一天，都有好运和我。';
 return left;
}
function paintWheel(){const c=$('wheel'),ctx=c.getContext('2d'),n=prizes.length,step=Math.PI*2/n,colors=['#f9d1d5','#fff1db','#efdabd','#ffe2de'];ctx.clearRect(0,0,600,600);for(let i=0;i<n;i++){const start=-Math.PI/2-step/2+i*step,end=start+step;ctx.beginPath();ctx.moveTo(300,300);ctx.arc(300,300,299,start,end);ctx.closePath();ctx.fillStyle=colors[i%4];ctx.fill();ctx.lineWidth=2;ctx.strokeStyle='#fff8ed';ctx.stroke();ctx.save();const angle=-Math.PI/2+i*step;ctx.translate(300+Math.cos(angle)*198,300+Math.sin(angle)*198);ctx.rotate(angle+Math.PI/2);ctx.textAlign='center';ctx.fillStyle='#63473e';ctx.font='30px sans-serif';if(prizes[i].icon==='dog-head'){if(dogHeadImage.complete&&dogHeadImage.naturalWidth){const w=dogHeadImage.naturalWidth,h=dogHeadImage.naturalHeight;ctx.drawImage(dogHeadImage,0,0,w,h,-22,-51,44,44);}}else ctx.fillText(prizes[i].icon,0,-19);ctx.font='bold 23px "PingFang SC",sans-serif';const title=prizes[i].name;ctx.fillText(title.slice(0,-1),0,20);ctx.font='20px "PingFang SC",sans-serif';ctx.fillText(title.slice(-1),0,49);ctx.restore();}}
function randomIndex(length){const limit=Math.floor(4294967296/length)*length;let value;do{value=crypto.getRandomValues(new Uint32Array(1))[0];}while(value>=limit);return value%length;}
// Keep the mystery gift for the final (third) birthday draw.
function selectPrizeIndex(available,completedDraws){
  const mysteryIndex=prizes.findIndex(prize=>prize.id==='mystery');
  if(completedDraws===birthday.drawLimit-1){
    if(mysteryIndex<0||!available.includes(mysteryIndex))throw new Error('神秘礼物未配置或已抽取。');
    return mysteryIndex;
  }
  const candidates=available.filter(index=>index!==mysteryIndex);
  if(!candidates.length)throw new Error('没有可抽取的普通奖品。');
  return candidates[randomIndex(candidates.length)];
}
function celebrate(){const colors=['#f6b7c0','#dfbd95','#a9435c','#f8d97a'];for(let i=0;i<52;i++){const bit=document.createElement('i');bit.style.left=Math.random()*100+'%';bit.style.background=colors[i%4];bit.style.setProperty('--drift',(Math.random()-.5)*260+'px');bit.style.animationDelay=Math.random()*.4+'s';bit.style.borderRadius=i%3===0?'50%':'2px';$('confetti').append(bit);}setTimeout(()=>$('confetti').replaceChildren(),3500);}
async function draw(){if(spinning||won.length>=birthday.drawLimit||!remaining.length)throw new Error('本轮抽奖已结束或正在抽奖。');if(!window.BirthdayGames?.canDraw(won.length))throw new Error('请先完成这一关小游戏。');const selected=selectPrizeIndex(remaining,won.length);window.BirthdayGames.consume(won.length);spinning=true;render();$('hint').textContent='转一转，今天的幸运属于你。';const finalAngle=(360-selected*360/prizes.length)%360;const normalized=(rotation%360+360)%360;rotation+=360*6+((finalAngle-normalized+360)%360);$('wheel').style.transform='rotate('+rotation+'deg)';await new Promise(resolve=>setTimeout(resolve,matchMedia('(prefers-reduced-motion: reduce)').matches?150:4700));remaining=remaining.filter(i=>i!==selected);won.push(selected);spinning=false;render();const p=prizes[selected];$('result-title').textContent=p.name;setPrizeIcon($('result-icon'),p.icon);$('result-desc').textContent=p.description;if(window.BirthdayCards)window.BirthdayCards.reveal(selected);else $('result').showModal();celebrate();return {prize:p.name,remainingDraws:Math.min(birthday.drawLimit-won.length,remaining.length)};}
$('draw').addEventListener('click',()=>{if(!window.BirthdayGames?.canDraw(won.length)){window.BirthdayGames?.open();return;}draw().catch(()=>{});});function closeResult(){$('result').close();if(won.length===birthday.drawLimit&&window.BirthdayFinale)window.BirthdayFinale.show();else $('draw').focus();}$('collect').addEventListener('click',closeResult);$('close-result').addEventListener('click',closeResult);$('result').addEventListener('cancel',e=>{e.preventDefault();closeResult();});$('result').addEventListener('click',e=>{if(e.target===$('result')){const rect=$('result').getBoundingClientRect();if(e.clientX<rect.left||e.clientX>rect.right||e.clientY<rect.top||e.clientY>rect.bottom)closeResult();}});paintWheel();render();
// Optional browser tools share the exact same actions and state as the page.
if(document.modelContext?.registerTool){const lifecycle=new AbortController();for(const tool of [{name:'read_birthday_draw',title:'查看生日抽奖',description:'Read available prizes, collected prizes and draws remaining.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true,untrustedContentHint:false},execute(input){if(input===null||typeof input!=='object'||Array.isArray(input)||Object.keys(input).length)throw new Error('Expected an empty object.');return {prizes:prizes.map(p=>p.name),collected:won.map(i=>prizes[i].name),remainingDraws:Math.min(birthday.drawLimit-won.length,remaining.length),spinning,games:window.BirthdayGames?.summary()};}},{name:'complete_birthday_draw',title:'抽取生日礼物',description:'Requires passing the current birthday minigame. Uses its unlocked draw credit, spins the wheel and reveals the next gift. Decreases remaining draws.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute(input){if(input===null||typeof input!=='object'||Array.isArray(input)||Object.keys(input).length)throw new Error('Expected an empty object.');if($('result').open)throw new Error('Please close the current gift first.');return draw();}}])try{Promise.resolve(document.modelContext.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{});}catch{}window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});}
