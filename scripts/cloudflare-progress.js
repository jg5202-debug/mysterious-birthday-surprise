'use strict';
// This module is included only in the Cloudflare publication.
window.BirthdayProgress = (() => {
 const key='birthday-paws:23:progress:v1',config=__BIRTHDAY_PROGRESS_CONFIG__;
 const empty=()=>({version:1,signature:config.signature,won:[],unlockedRound:null,completed:false,letterOpened:false,scratched:false,musicEnabled:true});
 function valid(value){
  if(!value||value.version!==1||value.signature!==config.signature||!Array.isArray(value.won))return false;
  const won=value.won;
  if(won.length>config.drawLimit||new Set(won).size!==won.length||won.some(i=>!Number.isInteger(i)||i<0||i>=config.prizeCount))return false;
  if(won.some((i,round)=>(i===config.mysteryIndex)!==(round===config.drawLimit-1)))return false;
  if(value.unlockedRound!==null&&value.unlockedRound!==won.length)return false;
  if(value.unlockedRound!==null&&won.length>=config.drawLimit)return false;
  if(typeof value.completed!=='boolean'||typeof value.letterOpened!=='boolean'||typeof value.scratched!=='boolean'||typeof value.musicEnabled!=='boolean')return false;
  if(value.letterOpened&&won.length!==config.drawLimit)return false;
  return !value.completed||(won.length===config.drawLimit&&value.letterOpened);
 }
 let state=empty();
 try{const saved=JSON.parse(localStorage.getItem(key));if(valid(saved))state=saved;}catch{}
 const boot={...state,won:state.won.slice()};
 if(state.completed)document.documentElement.dataset.birthdayComplete='true';
 function save(){try{localStorage.setItem(key,JSON.stringify(state));return true;}catch{return false;}}
 return {
  boot,
  isComplete:()=>state.completed,
  unlock(round){if(round===state.won.length&&round<config.drawLimit){state.unlockedRound=round;save();}},
  reservePrize(prize,round){
   // Save the selected gift before its spin starts, so a reload cannot reroll it.
   if(round!==state.won.length||state.unlockedRound!==round)return;
   const next={...state,won:[...state.won,prize],unlockedRound:null};
   if(valid(next)){state=next;save();}
  },
  openLetter(){if(state.won.length===config.drawLimit){state.letterOpened=true;save();}},
  revealBlessing(){state.scratched=true;save();},
  setMusicEnabled(enabled){state.musicEnabled=!!enabled;save();},
  complete(){
   if(state.won.length!==config.drawLimit||!state.letterOpened)return;
   state.completed=true;document.documentElement.dataset.birthdayComplete='true';save();
  }
 };
})();
