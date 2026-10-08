from pathlib import Path
import base64
import mimetypes
import re
import shutil
import zipfile

root = Path(__file__).resolve().parent.parent
dist = root / 'src'

def data_uri(relative_path):
    path = dist / relative_path
    mime = mimetypes.guess_type(str(path))[0] or 'application/octet-stream'
    return 'data:' + mime + ';base64,' + base64.b64encode(path.read_bytes()).decode()

source = (dist / 'index.html').read_text()
sheets = ['style.css', 'games.css', 'interactions.css', 'scenes.css', 'letter.css', 'memories.css']
scripts = ['app.js', 'cards.js', 'scratch.js', 'game-rules.js', 'games.js', 'finale.js', 'welcome.js', 'scenes.js', 'memories.js', 'letter.js']
assets = set(re.findall(r'''["'](assets/[^"']+)["']''', source))

def assemble(embed_assets):
    html = source
    for sheet in sheets:
        html = html.replace('<link rel="stylesheet" href="' + sheet + '">', '<style>' + (dist / sheet).read_text() + '</style>')
    for script in scripts:
        js = (dist / script).read_text()
        assets.update(re.findall(r'''["'](assets/[^"']+)["']''', js))
        if embed_assets:
            js = re.sub(r'''(['"])(assets/[^'"]+)\1''', lambda m: m.group(1) + data_uri(m.group(2)) + m.group(1), js)
        else:
            js = js.replace('assets/birthday-bgm.mp3', 'birthday-bgm.mp3')
        html = html.replace('<script src="' + script + '"></script>', '<script>' + js + '</script>')
    if embed_assets:
        html = re.sub(r'(src|href)="(assets/[^"]+)"', lambda m: m.group(1) + '="' + data_uri(m.group(2)) + '"', html)
        assert not re.search(r'(src|href)="assets/', html)
    return html

html = assemble(True)
bundle = root / 'dist/birthday-offline.html'
upload = root / 'dist/netlify/index.html'
bundle.parent.mkdir(parents=True, exist_ok=True)
bundle.write_text(html)
upload.parent.mkdir(parents=True, exist_ok=True)
# Keep the online HTML small so the welcome appears before the images finish
# loading. The downloadable HTML still embeds every asset for offline use.
publish_html = assemble(False)
audio = dist / 'assets/birthday-bgm.mp3'
if audio.exists():
    shutil.copyfile(audio, upload.parent / audio.name)
for relative_path in sorted(assets - {'assets/birthday-bgm.mp3'}):
    destination = upload.parent / relative_path
    destination.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(dist / relative_path, destination)
upload.write_text(publish_html)
with zipfile.ZipFile(root / 'dist/netlify.zip', 'w', zipfile.ZIP_DEFLATED) as archive:
    archive.write(upload, 'birthday-puppy/index.html')
    if audio.exists():
        archive.write(upload.parent / audio.name, 'birthday-puppy/' + audio.name)
    for relative_path in sorted(assets - {'assets/birthday-bgm.mp3'}):
        archive.write(upload.parent / relative_path, 'birthday-puppy/' + relative_path)
print('Birthday sharing HTML and upload package rebuilt.')
