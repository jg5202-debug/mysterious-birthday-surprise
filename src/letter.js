'use strict';
window.BirthdayLetter=(()=>{
 const modal=$('birthday-letter-ending'),arrival=$('letter-arrival'),reader=$('letter-reader'),open=$('open-birthday-letter'),music=$('letter-music-toggle');
 const letterMusic={title:'10cm · 봄눈',src:'assets/letter-bgm.mp3',label:'读信背景音乐'};
 let opened=false,opening=false,openingTimer=0,savedMusic=null,savedScroll=0;
 function sync(){$('read-birthday-letter').hidden=won.length!==birthday.drawLimit;}
 function updateMusic(){
  if(!window.BirthdayAudio)return;
  const state=window.BirthdayAudio.snapshot();
  const playing=state.track===letterMusic&&state.playing;
  music.setAttribute('aria-pressed',String(playing));music.setAttribute('aria-label',(playing?'暂停':'播放')+'读信背景音乐');
  $('letter-music-label').textContent=playing?'音乐播放中':'播放音乐';
  music.classList.toggle('is-playing',playing);
  $('letter-audio-status').textContent=$('music-status').textContent;
  const memoryMusic=$('memory-music-toggle');
  memoryMusic.setAttribute('aria-pressed',String(playing));memoryMusic.setAttribute('aria-label',(playing?'暂停':'播放')+'读信背景音乐');
  memoryMusic.classList.toggle('is-playing',playing);$('memory-music-label').textContent=playing?'音乐播放中':'播放音乐';
 }
 function show(){
  if(won.length!==birthday.drawLimit||modal.open||$('result').open||$('birthday-finale').open)return;
  savedScroll=window.scrollY;savedMusic=window.BirthdayAudio?.snapshot()||null;
  document.querySelectorAll('video').forEach(video=>video.pause());
  document.body.classList.add('reading-letter');
  $('memory-montage').hidden=true;modal.classList.remove('showing-memories','is-closing-letter');
  arrival.hidden=opened;reader.hidden=!opened;open.disabled=false;
  modal.classList.remove('is-opening');modal.setAttribute('aria-labelledby',opened?'letter-reader-title':'letter-arrival-title');
  modal.showModal();modal.scrollTop=0;
  if(opened){window.BirthdayAudio?.setTrack(letterMusic,{autoplay:!!(savedMusic?.enabled??savedMusic?.playing)});$('letter-reader-title').focus({preventScroll:true});}
  window.BirthdayMemories?.prepare();
 }
 function unwrap(){
  if(opening||opened)return;
  opening=true;open.disabled=true;modal.classList.add('is-opening');
  window.BirthdayAudio?.setTrack(letterMusic,{autoplay:!!(savedMusic?.enabled??savedMusic?.playing)});
  openingTimer=setTimeout(()=>{
   opening=false;opened=true;arrival.hidden=true;reader.hidden=false;
   modal.setAttribute('aria-labelledby','letter-reader-title');modal.classList.remove('is-opening');modal.scrollTop=0;
   $('letter-reader-title').focus({preventScroll:true});updateMusic();
  },matchMedia('(prefers-reduced-motion: reduce)').matches?0:850);
 }
 function finishClose(){
  modal.close();modal.classList.remove('showing-memories','is-closing-letter');document.body.classList.remove('reading-letter');
  if(savedMusic&&window.BirthdayAudio)window.BirthdayAudio.setTrack(savedMusic.track,{autoplay:savedMusic.enabled??savedMusic.playing,time:savedMusic.time});
  window.scrollTo({top:savedScroll,behavior:'instant'});
  $('read-birthday-letter').focus({preventScroll:true});
 }
 function close(){
  if(!modal.open)return;
  if(window.BirthdayMemories?.isActive()){window.BirthdayMemories.skip();return;}
  if(modal.classList.contains('is-closing-letter'))return;
  clearTimeout(openingTimer);opening=false;
  if(opened&&window.BirthdayMemories){
   modal.classList.add('is-closing-letter');
   openingTimer=setTimeout(()=>{
    modal.classList.remove('is-closing-letter');arrival.hidden=true;reader.hidden=true;
    modal.classList.add('showing-memories');modal.setAttribute('aria-labelledby','memory-title');modal.scrollTop=0;
    window.BirthdayMemories.start({
     handoff(){
      // The new-year curtains fully cover the screen before the page underneath changes.
      modal.close();modal.classList.remove('showing-memories','is-closing-letter');document.body.classList.remove('reading-letter');
      window.scrollTo({top:0,behavior:'instant'});
     },
     complete(){
      // Keep 10cm intact through the entire photo animation and curtain reveal.
      if(savedMusic&&window.BirthdayAudio)window.BirthdayAudio.setTrack(savedMusic.track,{autoplay:savedMusic.enabled??savedMusic.playing,time:savedMusic.time});
      const target=document.querySelector('.draw-card');target.setAttribute('tabindex','-1');target.focus({preventScroll:true});
     }
    });updateMusic();
   },matchMedia('(prefers-reduced-motion: reduce)').matches?0:600);
  }else finishClose();
 }
 open.addEventListener('click',unwrap);
 $('letter-reader-back').addEventListener('click',close);
 $('letter-arrival-back').addEventListener('click',close);
 $('letter-finish').addEventListener('click',close);
 $('read-birthday-letter').addEventListener('click',show);
 music.addEventListener('click',()=>window.BirthdayAudio?.toggle());
 $('memory-music-toggle').addEventListener('click',()=>window.BirthdayAudio?.toggle());
 modal.addEventListener('cancel',event=>{event.preventDefault();close();});
 document.addEventListener('birthdaymusicchange',updateMusic);
 sync();updateMusic();return {show,sync};
})();
