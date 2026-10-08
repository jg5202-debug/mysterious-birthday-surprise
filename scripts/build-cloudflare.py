"""Build the persistent Cloudflare edition without changing the Netlify edition."""
from pathlib import Path
import hashlib
import json
import re
import shutil
import zipfile

root = Path(__file__).resolve().parent.parent
base = root / 'src'
source = root / 'build/cloudflare-source'
publish = root / 'dist/cloudflare'
source.mkdir(parents=True, exist_ok=True)
publish.mkdir(parents=True, exist_ok=True)
scripts = ['app.js', 'cards.js', 'scratch.js', 'game-rules.js', 'games.js', 'finale.js', 'welcome.js', 'scenes.js', 'memories.js', 'letter.js']
sheets = ['style.css', 'games.css', 'interactions.css', 'scenes.css', 'letter.css', 'memories.css']
code = {name: (base / name).read_text() for name in scripts}

def patch(name, old, new):
    assert code[name].count(old) == 1, (name, old)
    code[name] = code[name].replace(old, new)

patch('app.js', 'const dogHeadImage=new Image();', "const savedProgress=window.BirthdayProgress.boot;won=savedProgress.won.slice();remaining=remaining.filter(i=>!won.includes(i));\nconst dogHeadImage=new Image();")
patch('app.js', 'window.BirthdayGames.consume(won.length);spinning=true;', 'window.BirthdayProgress.reservePrize(selected,won.length);window.BirthdayGames.consume(won.length);spinning=true;')
patch('games.js', " const names=['小狗接礼物'", " for(let i=0;i<won.length;i++){gate.grant(i);gate.consume(i);}\n if(window.BirthdayProgress.boot.unlockedRound===won.length)gate.grant(won.length);\n const names=['小狗接礼物'")
patch('games.js', '  stop();renderProgress();', '  window.BirthdayProgress.unlock(round);stop();renderProgress();')
patch('scratch.js', '  if(revealed)return;revealed=true;previous=null;', '  if(revealed)return;revealed=true;previous=null;window.BirthdayProgress.revealBlessing();')
patch('scratch.js', ' new ResizeObserver(resize).observe(card);resize();', ' if(window.BirthdayProgress.boot.scratched)reveal();\n new ResizeObserver(resize).observe(card);resize();')
patch('finale.js', "let shown=false,packingTimer;", "let shown=window.BirthdayProgress.isComplete(),packingTimer;")
patch('welcome.js', " document.getElementById('draw').focus({preventScroll:true});", " document.getElementById('draw').focus({preventScroll:true});\n if(!window.BirthdayProgress.isComplete()&&won.length===birthday.drawLimit)window.BirthdayFinale?.show();")
patch('welcome.js', ' updateMusic();\n}\ntoggle.addEventListener', ' window.BirthdayProgress.setMusicEnabled(musicWanted);updateMusic();\n}\ntoggle.addEventListener')
patch('welcome.js', ' musicWanted=true;\n void playBirthdayMusic();', ' musicWanted=true;window.BirthdayProgress.setMusicEnabled(true);\n void playBirthdayMusic();')
patch('welcome.js', "welcome.hidden=false;\ndocument.body.classList.add('welcome-active');\npageContent.forEach(el=>{el.inert=true;});\nenter.disabled=false;\nupdateMusic();", """if(window.BirthdayProgress.isComplete()){
 entered=true;welcome.hidden=true;document.body.classList.remove('welcome-active');
 pageContent.forEach(el=>{el.inert=false;});dock.hidden=!birthdayMusic.src;
 if(window.BirthdayProgress.boot.musicEnabled){
  void playBirthdayMusic();
  // Browsers may require a new gesture on a fresh visit. Preserve the page view.
  const resumeOnGesture=event=>{
   document.removeEventListener('pointerdown',resumeOnGesture);
   document.removeEventListener('keydown',resumeOnGesture);
   if(event.target.closest?.('#music-toggle,#letter-music-toggle,#memory-music-toggle,video')||!bgm.paused||!musicWanted)return;
   void playBirthdayMusic();
  };
  document.addEventListener('pointerdown',resumeOnGesture);
  document.addEventListener('keydown',resumeOnGesture);
 }
}else{
 welcome.hidden=false;document.body.classList.add('welcome-active');
 pageContent.forEach(el=>{el.inert=true;});enter.disabled=false;
}
updateMusic();""")
patch('letter.js', ' let opened=false,opening=false,', ' let opened=window.BirthdayProgress.boot.letterOpened,opening=false,')
patch('letter.js', '   opening=false;opened=true;arrival.hidden=true;', '   opening=false;opened=true;window.BirthdayProgress.openLetter();arrival.hidden=true;')
patch('letter.js', '     complete(){', '     complete(){\n      window.BirthdayProgress.complete();')
patch('memories.js', " let active=false,phase='idle'", " const replaySkip=$('memory-replay-skip');\n let active=false,phase='idle'")
patch('memories.js', "  phase='gathering';clearTimer();", "  replaySkip.hidden=true;phase='gathering';clearTimer();")
patch('memories.js', "  prepare();active=true;phase='floating';callbacks=options;root.hidden=false;ending.hidden=true;", "  prepare();active=true;phase='floating';callbacks=options;root.hidden=false;ending.hidden=true;\n  replaySkip.hidden=!window.BirthdayProgress.isComplete();")
patch('memories.js', " $('memory-enter-year').addEventListener('click',finish);", " replaySkip.addEventListener('click',()=>{if(window.BirthdayProgress.isComplete())gather();});\n $('memory-enter-year').addEventListener('click',finish);")

config = {'signature': hashlib.sha256((base / 'app.js').read_text().split('const $=')[0].encode()).hexdigest(), 'prizeCount': 8, 'drawLimit': 3, 'mysteryIndex': 7}
progress = (root / 'scripts/cloudflare-progress.js').read_text().replace('__BIRTHDAY_PROGRESS_CONFIG__', json.dumps(config))
(source / 'progress.js').write_text(progress)
html = (base / 'index.html').read_text()
html = html.replace('<div class="memory-heart-ending"', '<button class="memory-replay-skip" id="memory-replay-skip" type="button" hidden>跳过照片动画 <span aria-hidden="true">→</span></button>\n  <div class="memory-heart-ending"')
html = html.replace('</head>', '<style>.memory-replay-skip{position:absolute;right:max(22px,env(safe-area-inset-right));bottom:calc(20px + env(safe-area-inset-bottom));z-index:12;min-height:44px;padding:10px 16px;border:1px solid #dec1bd;border-radius:24px;background:#fffaf5d9;color:#9a756d;font-size:12px;letter-spacing:.5px;box-shadow:0 4px 16px #80504d0a}.memory-replay-skip[hidden]{display:none}.memory-replay-skip:hover{background:#fffaf5;border-color:#c997a0}</style></head>')
html = html.replace('</head>', '<style>html[data-birthday-complete="true"] #welcome{display:none}html[data-birthday-complete="true"] body.welcome-active{overflow:auto}html[data-birthday-complete="true"] body.welcome-active>header,html[data-birthday-complete="true"] body.welcome-active>main{visibility:visible;pointer-events:auto}</style><script>' + progress + '</script></head>')
assets = set(re.findall(r'''["'](assets/[^"']+)["']''', html))
for sheet in sheets:
    html = html.replace(f'<link rel="stylesheet" href="{sheet}">', '<style>' + (base / sheet).read_text() + '</style>')
for name, js in code.items():
    (source / name).write_text(js)
    assets.update(re.findall(r'''["'](assets/[^"']+)["']''', js))
    html = html.replace(f'<script src="{name}"></script>', '<script>' + js.replace('assets/birthday-bgm.mp3', 'birthday-bgm.mp3') + '</script>')
(publish / 'index.html').write_text(html)
files = ['index.html', 'birthday-bgm.mp3'] + sorted(assets - {'assets/birthday-bgm.mp3'})
shutil.copyfile(base / 'assets/birthday-bgm.mp3', publish / 'birthday-bgm.mp3')
for path in files[2:]:
    dest = publish / path
    dest.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(base / path, dest)
with zipfile.ZipFile(root / 'dist/cloudflare.zip', 'w', zipfile.ZIP_DEFLATED) as archive:
    for path in files:
        archive.write(publish / path, path)
print('Cloudflare-only edition rebuilt:', len(files), 'files. Netlify output unchanged.')
