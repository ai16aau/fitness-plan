// Regression checks for the fitness plan app. Run before every publish:
//   (serve the site folder on port 8790)  node tests/regression.js
const {chromium}=require('playwright');
const URL=process.env.APP_URL||'http://localhost:8790/';
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++};
(async()=>{const b=await chromium.launch();
 const T="2026-11-28T08:00:00.000Z",S=(n,r,kg)=>({s:Array.from({length:n},()=>({r,kg,done:true})),t:T});
 async function page(seed,time='2026-11-28T10:00:00Z'){const c=await b.newContext({viewport:{width:390,height:844}});await c.clock.install({time:new Date(time)});
  await c.addInitScript(s=>localStorage.setItem('strengthplan-v3',JSON.stringify(s)),seed);const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.goto(URL);await p.waitForTimeout(1200);p.errs=errs;return p}
 const txt=p=>p.evaluate(()=>document.getElementById('app').innerText);

 // 1. Home dumbbell targets never exceed the heaviest home dumbbell, whatever was logged
 {const seed={"0-Thu-loc":{v:"Home",t:T},"1-Sat-loc":{v:"Home",t:T},"0-Thu-lp":S(4,"15","14")};
  const p=await page(seed);const t=await txt(p);
  ok(!/1[0-9](\.\d)? kg each hand/.test(t)&&/7 kg, more reps/.test(t),'home split squat logged as 14 kg never suggests more than 7 kg');
  const targets=await p.evaluate(()=>[...document.querySelectorAll('.prescription .accent b')].map(b=>b.textContent));
  ok(targets.length>3&&targets.every(x=>{const m=x.match(/^(\d+(\.\d+)?) kg/);return!m||+m[1]<=7}),'every home target on Saturday is 7 kg or less: '+targets.join(' | '));
  ok(!p.errs.length,'no page errors');}

 // 2. Typing a both-dumbbells total at home is corrected as you type
 {const p=await page({"1-Sat-loc":{v:"Home",t:T}});
  const inp=p.locator('input[data-chk]').first();await inp.fill('14');await inp.dispatchEvent('change');await p.waitForTimeout(200);
  ok(await inp.inputValue()==='7','typing 14 at home becomes 7');
  ok(/log the weight of one dumbbell/.test(await txt(p)),'and explains why');}

 // 3. At the gym, a suspicious jump is flagged but not changed
 {const p=await page({"0-Tue-incl":{...S(3,"10","8"),t:"2026-11-10T13:00:00.000Z"},"1-Tue-loc":{v:"Gym Group",t:T}},'2026-12-01T10:00:00Z');
  const inp=p.locator('input[data-k$="-incl"][data-chk]').first();await inp.fill('16');await inp.dispatchEvent('change');await p.waitForTimeout(200);
  ok(await inp.inputValue()==='16'&&/That's a lot more than last time/.test(await txt(p)),'gym jump from 8 to 16 kg is flagged, not changed');}

 // 4. Each-side exercises explain what one set is
 {const p=await page({"1-Sat-loc":{v:"Home",t:T}});ok(/Both sides count as one set/.test(await txt(p))&&/Complete .* on each side, then tick it off/.test(await txt(p)),'per-side counting note shows');}

 // 5. A skipped exercise carries to the next day
 {const p=await page({"1-Sat-skipcu":{v:true,t:T},"1-Sun-skipcu":{v:true,t:T},"1-Mon-skipcu":{v:true,t:T},"1-Tue-skipcu":{v:true,t:T},"1-Wed-skipcu":{v:true,t:T},"1-Thu-loc":{v:"Home",t:T},"1-Thu-lp":S(4,"10","7"),"1-Thu-flat":S(4,"10",""),"1-Thu-side":S(3,"20","7"),"1-Thu-ggab2":S(3,"10","4"),"1-Thu-ht":S(4,"12","")},'2026-12-04T10:00:00Z');
  ok(/Band-assisted pull-up/.test(await txt(p)),'Thursday pull-ups not done appear on Friday');}

 // 5b. Carried-over exercises sit in the main workout and count towards the day's progress dial
 {const p=await page({"1-Sat-skipcu":{v:true,t:T},"1-Sun-skipcu":{v:true,t:T},"1-Mon-skipcu":{v:true,t:T},"1-Tue-skipcu":{v:true,t:T},"1-Wed-skipcu":{v:true,t:T},"1-Thu-loc":{v:"Home",t:T},"1-Thu-lp":S(4,"10","7"),"1-Thu-flat":S(4,"10",""),"1-Thu-side":S(3,"20","7"),"1-Thu-ggab2":S(3,"10","4"),"1-Thu-ht":S(4,"12","")},'2026-12-04T10:00:00Z');
  const r=await p.evaluate(()=>{const [c,t]=dayStat(W,DI);return{t,dial:(document.querySelector('.progress-dial span')||{}).textContent||"",inMain:[...document.querySelectorAll('.workout-section .exercise-card .name')].some(x=>/Band-assisted pull-up/.test(x.textContent)),hidden:!!document.querySelector('.catchup-work')}});
  ok(r.inMain&&!r.hidden&&r.dial===`0 of ${r.t} sets`,'catch-up pull-ups are in the main workout and counted in the progress dial ('+r.dial+')');}

 // 6. A cardio extra does not count as doing the session
 {const p=await page({"1-Fri-class":{type:"Treadmill walk",min:"60",done:true,t:T}},'2026-12-04T10:00:00Z');
  const [c,t]=await p.evaluate(()=>dayStat(W,DI));ok(c===0&&t>0,'treadmill walk as an extra leaves the session to do');}

 // 7. Every home target, on every day, is a dumbbell she owns, whatever the history (none, gym weights, totals, odd numbers)
 {const days=["Thu","Fri","Sat","Sun","Mon","Tue","Wed"];const p0=await page({},'2026-12-01T10:00:00Z');
  const ids=await p0.evaluate(()=>{const o={};DAYS.forEach(d=>{o[d]=ownItems(1,d).map(x=>x.e.id)});return o});
  for(const w of [null,["6","10"],["8","12"],["14","15"],["9","8"],["2","5"]]){const s={};days.forEach(d=>{s[`2-${d}-loc`]={v:"Home",t:T};if(w){s[`1-${d}-loc`]={v:"Gym Group",t:T};ids[d].forEach(id=>s[`1-${d}-${id}`]=S(3,w[1],w[0]))}});
   const q=await page(s,'2026-12-01T10:00:00Z');
   const res=await q.evaluate(()=>{const out=[];let n=0;const have=homeDBs();for(let di=0;di<7;di++){DI=di;W=2;render();document.querySelectorAll('.ex').forEach(ex=>{const t=(ex.querySelector('.prescription .accent b')||{}).textContent||"";if(t)n++;
     const label=ex.innerText.split('\n').find(l=>/kg (per dumbbell|\(one dumbbell\))/i.test(l));if(label||/dumbbell/i.test(t))[...t.matchAll(/(\d+(\.\d+)?) kg/g)].map(m=>+m[1]).forEach(k=>{if(!have.includes(k))out.push(DAYS[di]+': '+t)})})}return{out,n}});
   const bad=res.out;ok(res.n>20&&!bad.length,`home targets all owned dumbbells (history: ${w?w[0]+' kg':'none'})`+(bad.length?' '+bad.join(', '):''))}}

 // 8. The plan restarted on Saturday 28 Nov: weeks run Saturday to Friday, easy weeks are 5 and 10, pull-up tests are weeks 6, 9, 11 and 12
 {const p=await page({},'2026-11-28T10:00:00Z');
  const r=await p.evaluate(()=>({start:D.weeks[0].start,end:D.weeks[11].end,days:D.days.join(),w5:D.weeks[4],w6:D.weeks[5],tests:D.weeks.filter(w=>w.test).map(w=>w.n).join(),easy:D.weeks.filter(w=>w.type==='Deload').map(w=>w.n).join(),pos:[W,DI,TW,TD].join(),title:(document.querySelector('.today-hero h1')||{}).textContent,chips:[...document.querySelectorAll('.strip .chip')].map(c=>c.textContent.slice(0,3)).join()}));
  ok(r.start==='2026-11-28'&&r.end==='2027-02-19'&&r.days==='Sat,Sun,Mon,Tue,Wed,Thu,Fri'&&r.chips==='Sat,Sun,Mon,Tue,Wed,Thu,Fri','plan runs Sat 28 Nov 2026 to Fri 19 Feb 2027, Saturday first');
  ok(r.easy==='5,10'&&r.tests==='6,9,11,12'&&r.w5.label==='26 Dec to 1 Jan'&&/Easy week/.test(r.w5.focus),'easy weeks are 5 and 10; pull-up tests in weeks 6, 9, 11 and 12');
  ok(r.pos==='1,0,1,0'&&/Home strength/.test(r.title||''),'opens on week 1, day 1 (Saturday) with Saturday\'s session: '+r.title);}

 // 9. Everything logged before the restart moves to week 0 so "last time" still works; logs made since stay in week 1
 {const OLD="2026-11-19T20:00:00.000Z",LASTWK="2026-11-26T19:00:00.000Z",SAT="2026-11-28T08:00:00.000Z";
  const seed={"1-Sun-loc":{v:"Home",t:OLD},"1-Thu-lp":{...S(4,"10","93"),t:LASTWK},"1-Fri-class":{type:"Treadmill walk",min:"30",done:true,t:"2026-11-20T10:00:00.000Z"},"m-1":{waist:"30",hips:"40",arm:"11",t:OLD},"1-Sat-loc":{v:"Gym Group",t:SAT},"cfg-homedb":{v:"2.3, 4, 7",t:OLD}};
  const p=await page(seed,'2026-12-03T10:00:00Z');
  const db=await p.evaluate(()=>JSON.parse(localStorage.getItem('strengthplan-v3')));
  ok(db['0-Thu-lp']&&db['0-Thu-lp'].s.length===4&&db['0-Thu-lp'].s[0].kg==='93'&&!db['1-Thu-lp']&&db['0-Sun-loc']&&!db['1-Sun-loc']&&!db['1-Fri-class'],'logs from before the restart move to week 0 (kept, not lost)');
  ok(db['1-Sat-loc']&&db['1-Sat-loc'].v==='Gym Group','a log made on the restart day stays in week 1');
  ok(db['m-1']&&db['m-1'].waist==='30'&&db['cfg-homedb']&&db['cfg-homedb'].v==='2.3, 4, 7','baseline measurements and home dumbbell settings are untouched');
  const lt=await p.evaluate(()=>{const c=[...document.querySelectorAll('.exercise-card')].find(x=>x.querySelector('[data-k$="-lp"]'));return c?(c.querySelector('.progression')||{}).textContent||'':'no card'});
  ok(/Last time.*10 @ 93 kg/.test(lt),'Thursday 3 Dec still shows last time for the leg press you did before the restart: '+lt.replace(/\s+/g,' ').slice(0,90));
  ok(!p.errs.length,'no page errors after the migration');}

 // 10. In week 0 the newest entry is the "last time", whichever weekday it was logged on
 {const seed={"0-Tue-pull":{...S(3,"8","25"),t:"2026-11-12T10:00:00.000Z"},"0-Thu-pull2":{...S(3,"8","30"),t:"2026-11-11T10:00:00.000Z"}};
  const p=await page(seed,'2026-12-03T10:00:00Z');
  const lt=await p.evaluate(()=>{const c=[...document.querySelectorAll('.exercise-card')].find(x=>x.querySelector('[data-k$="-pull2"]'));return c?(c.querySelector('.progression')||{}).textContent||'':'no card'});
  ok(/before the restart, Tue.*8 @ 25 kg/.test(lt)&&!/30 kg/.test(lt),'the newer Tuesday pull-up is the last time, not the older Thursday one: '+lt.replace(/\s+/g,' ').slice(0,100));}

 // 11. The Restart button: pick a date, confirm, and the calendar, history and measurements behave
 const restartVia=async(p,date)=>{await p.click('[data-tab="Plan"]');await p.click('#restart-panel summary');await p.fill('#rs-date',date);await p.click('#rs-go');await p.click('#rs-yes');await p.waitForTimeout(150)};
 {const p=await page({"1-Thu-lp":{...S(4,"10","93"),t:T},"m-1":{waist:"30",t:T},"1-Sat-loc":{v:"Gym Group",t:T}},'2026-12-02T10:00:00Z');
  await p.click('[data-tab="Plan"]');await p.click('#restart-panel summary');
  ok(/Week 1 runs .* to .*The plan finishes on/.test(await p.innerText('#rs-prev')),'the panel previews week 1 and the finish date');
  await p.click('#rs-go');
  ok(await p.locator('#rs-yes').count()===1&&/Restart from Wednesday/.test(await p.innerText('.restart-confirm')),'asks for confirmation before restarting, naming the start date');
  await p.click('#rs-no');const before=await p.evaluate(()=>JSON.parse(localStorage.getItem('strengthplan-v3')));
  ok(!before['cfg-restart']&&before['1-Thu-lp'],'cancelling changes nothing');
  await restartVia(p,'2026-12-02');
  const r=await p.evaluate(()=>({db:JSON.parse(localStorage.getItem('strengthplan-v3')),days:D.days.join(),label:D.weeks[0].label,end:D.weeks[11].end,pos:[W,DI,TW,TD].join(),tab:TAB,chips:[...document.querySelectorAll('.strip .chip')].map(c=>c.textContent.slice(0,3)).join(),title:(document.querySelector('h1')||{}).textContent,txt:document.getElementById('app').innerText}));
  ok(r.db['cfg-restart']&&r.db['cfg-restart'].start==='2026-12-02'&&r.days==='Wed,Thu,Fri,Sat,Sun,Mon,Tue'&&r.chips==='Wed,Thu,Fri,Sat,Sun,Mon,Tue'&&r.label==='2 Dec to 8 Dec'&&r.end==='2027-02-23','restart on Wed 2 Dec: weeks run Wednesday to Tuesday, plan ends Tue 23 Feb');
  ok(r.pos==='1,0,1,0'&&r.tab==='Today','lands on today, week 1 day 1');
  ok(r.db['0-Thu-lp']&&r.db['0-Thu-lp'].s[0].kg==='93'&&!r.db['1-Thu-lp']&&r.db['0-Sat-loc']&&!r.db['1-Sat-loc'],'everything logged so far moved to week 0');
  ok(r.db['m-1']&&r.db['m-1'].waist==='30','measurements untouched by the restart');
  await p.click('[data-tab="Week"]');ok(/Measure on Wednesday/.test(await p.innerText('#app')),'measurement reminder follows the new first day');
  ok(!p.errs.length,'no page errors through a restart');
  // it survives a reload
  const snap=r.db;const q=await page(snap,'2026-12-02T12:00:00Z');
  const r2=await q.evaluate(()=>({days:D.days.join(),pos:[W,DI].join(),label:D.weeks[0].label}));
  ok(r2.days==='Wed,Thu,Fri,Sat,Sun,Mon,Tue'&&r2.pos==='1,0'&&r2.label==='2 Dec to 8 Dec','the restart is still in place after reopening the app');
  // restart again, as often as you like: newer logs replace older ones in week 0 and the replaced entry is archived
  await p.waitForTimeout(60);await p.evaluate(()=>put('1-Thu-lp',{s:[{r:"10",kg:"95",done:true}]}));await p.waitForTimeout(60);
  await restartVia(p,'2026-12-02');
  const d2=await p.evaluate(()=>JSON.parse(localStorage.getItem('strengthplan-v3')));
  ok(d2['0-Thu-lp'].s.length===1&&d2['0-Thu-lp'].s[0].kg==='95'&&!d2['1-Thu-lp']&&d2['arch-0-Thu-lp']&&d2['arch-0-Thu-lp'].s[0].kg==='93','a second restart keeps the newest log as last time and archives the one it replaced');
  const bad=await p.evaluate(()=>{const c=document.documentElement.scrollWidth;return c>390});ok(!bad,'no sideways scrolling at 390px');}

 // 12. A restart made on another device arrives through sync, and this device's older logs move to week 0
 {const c=await b.newContext({viewport:{width:390,height:844}});await c.clock.install({time:new Date('2026-12-02T13:00:00Z')});
  const remote={"cfg-restart":{start:"2026-12-02",at:"2026-12-02T09:00:00.000Z",t:"2026-12-02T09:00:00.000Z"},"0-Tue-pull":{...S(3,"8","25"),t:"2026-11-12T10:00:00.000Z"}};
  let patched=null;
  await c.route('https://api.github.com/**',async route=>{const r=route.request(),u=r.url();
   const json=o=>route.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*','access-control-allow-headers':'*','access-control-allow-methods':'*'},body:JSON.stringify(o)});
   if(r.method()==='OPTIONS')return route.fulfill({status:204,headers:{'access-control-allow-origin':'*','access-control-allow-headers':'*','access-control-allow-methods':'*'}});
   if(r.method()==='PATCH'){patched=JSON.parse(JSON.parse(r.postData()).files['fitness-plan-progress.json'].content);return json({})}
   if(/\/gists\?/.test(u))return json([{id:'g1',created_at:'2026-11-01T00:00:00Z',files:{'fitness-plan-progress.json':{}}}]);
   return json({files:{'fitness-plan-progress.json':{content:JSON.stringify(remote)}}})});
  await c.addInitScript(([db,cfg])=>{localStorage.setItem('strengthplan-v3',JSON.stringify(db));localStorage.setItem('strengthplan-sync',JSON.stringify(cfg))},[{"1-Thu-lp":{...S(4,"10","93"),t:T}},{token:"test",gist:"g1"}]);
  const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));await p.goto(URL);await p.waitForTimeout(2500);
  const r=await p.evaluate(()=>({days:D.days.join(),pos:[W,DI].join(),db:JSON.parse(localStorage.getItem('strengthplan-v3'))}));
  ok(r.days==='Wed,Thu,Fri,Sat,Sun,Mon,Tue'&&r.pos==='1,0','a restart from another device changes this device\'s calendar once it syncs');
  ok(r.db['0-Thu-lp']&&!r.db['1-Thu-lp']&&r.db['cfg-restart'],'and this device\'s older logs move to week 0');
  ok(patched&&patched['0-Thu-lp']&&!patched['1-Thu-lp']&&patched['cfg-restart'],'the tidied copy is saved back to the backup');
  ok(!errs.length,'no page errors during sync');}


 await b.close();console.log(fails?`${fails} check(s) failed`:'All checks passed');process.exit(fails?1:0)})();
