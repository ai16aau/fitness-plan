import json,base64,io,os,html as H
from PIL import Image
D=json.load(open('data3.json'));ids=json.load(open('ids.json'))
svg={}
os.makedirs('site/img',exist_ok=True)
big={};small={}
CUST={i for i in ids if os.path.exists(f'myimg/{i}.jpg')}
for i in ids:
    if i in CUST:
        im=Image.open(f'myimg/{i}.jpg').convert('RGB');a=im.copy();a.thumbnail((520,520));a.save(f'site/img/{i}_0.jpg','JPEG',quality=70)
        b=io.BytesIO();a.save(b,'JPEG',quality=62);big[i]=['data:image/jpeg;base64,'+base64.b64encode(b.getvalue()).decode()]
        c=im.copy();c.thumbnail((150,150));b=io.BytesIO();c.save(b,'JPEG',quality=50);small[i]=['data:image/jpeg;base64,'+base64.b64encode(b.getvalue()).decode()]
        continue
    for j in (0,1):
        im=Image.open(f'/home/claude/fedb/exercises/{i}/{j}.jpg').convert('RGB')
        a=im.copy();a.thumbnail((400,400));a.save(f'site/img/{i}_{j}.jpg','JPEG',quality=62)
        b=io.BytesIO();a.save(b,'JPEG',quality=58);big.setdefault(i,[None,None])[j]='data:image/jpeg;base64,'+base64.b64encode(b.getvalue()).decode()
        c=im.copy();c.thumbnail((150,150));b=io.BytesIO();c.save(b,'JPEG',quality=50);small.setdefault(i,[None,None])[j]='data:image/jpeg;base64,'+base64.b64encode(b.getvalue()).decode()
e=H.escape
def static(thumb):
    out=["<h2>Fitness plan</h2><p><b>Open this in Safari or Chrome</b> (or add it to your home screen) to tick off sets and save your progress.</p>"]
    for d in D['days']:
        s=D['sess'][d]
        for k in (['A','B'] if 'A' in s else ['list']):
            rows=""
            for x in s[k]:
                if x.get('kind')=='walk': continue
                v=x['v'][0]
                im=f"<img src='{thumb(v['img'])}'>" if v['img'] else '📷'
                rows+=f"<tr><td>{im}</td><td><b>{e(v['name'])}</b> ({e(v['equip'])})<br>{x['sets']} sets × {e(v['reps'] or x['reps'])}<br>Start: {e(v['start'])}</td></tr>"
            lab=f" (week {k})" if k!='list' else ""
            out.append(f"<h3>{D['daynames'][d]}{lab}: {e(s['title'])}</h3><table>{rows}</table>")
    return "\n".join(out)
css=open('base.css').read()+open('extra.css').read()
js=open('app.js').read()
def page(head,stat,imgmap):
    return f'''<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="apple-mobile-web-app-capable" content="yes"><meta name="mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-title" content="Fitness"><meta name="theme-color" content="#3f7f80">{head}
<title>Fitness Plan</title><style>{css}</style></head><body><div id="app" style="display:none"></div><div id="static" class="wrap">{stat}</div>
<script>{js.replace('__DATA__',json.dumps(D,ensure_ascii=False)).replace('__IMGMAP__',json.dumps(imgmap)).replace('__SVG__',json.dumps(svg))}</script></body></html>'''
head='<link rel="manifest" href="manifest.json"><link rel="apple-touch-icon" href="icon-192.png"><link rel="icon" href="icon-192.png">'
open('site/index.html','w').write(page(head,static(lambda i:f'img/{i}_{0 if i in CUST else 1}.jpg'),{i:([f'img/{i}_0.jpg'] if i in CUST else [f'img/{i}_0.jpg',f'img/{i}_1.jpg']) for i in ids}))
open('Fitness-Plan-App.html','w').write(page('',static(lambda i:small[i][-1]),big))
import shutil
for f in ('icon-192.png','icon-512.png'): shutil.copy(f'/home/claude/app/site/{f}',f'site/{f}')
json.dump({"name":"Fitness Plan","short_name":"Fitness","start_url":"./","scope":"./","display":"standalone","background_color":"#f3f1ec","theme_color":"#3f7f80",
 "icons":[{"src":"icon-192.png","sizes":"192x192","type":"image/png"},{"src":"icon-512.png","sizes":"512x512","type":"image/png","purpose":"any maskable"}]},open('site/manifest.json','w'),indent=1)
files=['./','index.html','manifest.json','icon-192.png','icon-512.png']+[f'img/{i}_{j}.jpg' for i in ids for j in ((0,) if i in CUST else (0,1))]
open('site/sw.js','w').write(f"""const C='fitness-v37';const F={json.dumps(files)};
self.addEventListener('install',e=>{{e.waitUntil(caches.open(C).then(c=>c.addAll(F)));self.skipWaiting()}});
self.addEventListener('activate',e=>{{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))));self.clients.claim()}});
self.addEventListener('fetch',e=>{{const u=new URL(e.request.url);if(u.origin!==location.origin)return;
 if(e.request.mode==='navigate'){{e.respondWith(fetch(e.request).then(r=>{{const cp=r.clone();caches.open(C).then(c=>c.put('index.html',cp));return r}}).catch(()=>caches.match('index.html')));return}}
 e.respondWith(caches.match(e.request,{{ignoreSearch:true}}).then(r=>r||fetch(e.request)))}});
""")
print(os.path.getsize('site/index.html')//1024,'KB',os.path.getsize('Fitness-Plan-App.html')//1024,'KB')
