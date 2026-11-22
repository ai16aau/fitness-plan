// Regression checks for the fitness plan app. Run before every publish:
//   (serve the site folder on port 8790)  node tests/regression.js
const {chromium}=require('playwright');
const URL=process.env.APP_URL||'http://localhost:8790/';
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++};
(async()=>{const b=await chromium.launch();
 const T="2026-11-19T20:00:00.000Z",S=(n,r,kg)=>({s:Array.from({length:n},()=>({r,kg,done:true})),t:T});
 async function page(seed,time='2026-11-21T10:00:00Z'){const c=await b.newContext({viewport:{width:390,height:844}});await c.clock.install({time:new Date(time)});
  await c.addInitScript(s=>localStorage.setItem('strengthplan-v3',JSON.stringify(s)),seed);const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.goto(URL);await p.waitForTimeout(1200);p.errs=errs;return p}
 const txt=p=>p.evaluate(()=>document.getElementById('app').innerText);

 // 1. Home dumbbell targets never exceed the heaviest home dumbbell, whatever was logged
 {const seed={"1-Thu-loc":{v:"Home",t:T},"1-Sat-loc":{v:"Home",t:T},"1-Thu-lp":S(4,"15","14")};
  const p=await page(seed);const t=await txt(p);
  ok(!/1[0-9](\.\d)? kg each hand/.test(t)&&/7 kg, more reps/.test(t),'home split squat logged as 14 kg never suggests more than 7 kg');
  const targets=await p.evaluate(()=>[...document.querySelectorAll('.box.w b')].map(b=>b.textContent));
  ok(targets.every(x=>{const m=x.match(/^(\d+(\.\d+)?) kg/);return!m||+m[1]<=7}),'every home target on Saturday is 7 kg or less: '+targets.join(' | '));
  ok(!p.errs.length,'no page errors');}

 // 2. Typing a both-dumbbells total at home is corrected as you type
 {const p=await page({"1-Sat-loc":{v:"Home",t:T}});
  const inp=p.locator('input[data-chk]').first();await inp.fill('14');await inp.dispatchEvent('change');await p.waitForTimeout(200);
  ok(await inp.inputValue()==='7','typing 14 at home becomes 7');
  ok(/log the weight of one dumbbell/.test(await txt(p)),'and explains why');}

 // 3. At the gym, a suspicious jump is flagged but not changed
 {const p=await page({"0-Tue-incl":{...S(3,"10","8"),t:"2026-11-10T13:00:00.000Z"},"1-Tue-loc":{v:"Gym Group",t:T}},'2026-11-24T10:00:00Z');
  const inp=p.locator('input[data-k$="-incl"][data-chk]').first();await inp.fill('16');await inp.dispatchEvent('change');await p.waitForTimeout(200);
  ok(await inp.inputValue()==='16'&&/That's a lot more than last time/.test(await txt(p)),'gym jump from 8 to 16 kg is flagged, not changed');}

 // 4. Each-side exercises explain what one set is
 {const p=await page({"1-Sat-loc":{v:"Home",t:T}});ok(/1 set = .* on one (leg|side|arm), then the same on the other/.test(await txt(p)),'per-side counting note shows');}

 // 5. A skipped exercise carries to the next day
 {const p=await page({"1-Thu-loc":{v:"Home",t:T},"1-Thu-lp":S(4,"10","7"),"1-Thu-flat":S(4,"10",""),"1-Thu-side":S(3,"20","7"),"1-Thu-ggab2":S(3,"10","4"),"1-Thu-ht":S(4,"12","")},'2026-11-20T10:00:00Z');
  ok(/Band-assisted pull-up/.test(await txt(p)),'Thursday pull-ups not done appear on Friday');}

 // 6. A cardio extra does not count as doing the session
 {const p=await page({"1-Fri-class":{type:"Treadmill walk",min:"60",done:true,t:T}},'2026-11-20T10:00:00Z');
  const [c,t]=await p.evaluate(()=>dayStat(W,DI));ok(c===0&&t>0,'treadmill walk as an extra leaves the session to do');}

 // 7. Every home target, on every day, is a dumbbell she owns, whatever the history (none, gym weights, totals, odd numbers)
 {const days=["Thu","Fri","Sat","Sun","Mon","Tue","Wed"];const p0=await page({},'2026-11-26T10:00:00Z');
  const ids=await p0.evaluate(()=>{const o={};DAYS.forEach(d=>{o[d]=ownItems(1,d).map(x=>x.e.id)});return o});
  for(const w of [null,["6","10"],["8","12"],["14","15"],["9","8"],["2","5"]]){const s={};days.forEach(d=>{s[`2-${d}-loc`]={v:"Home",t:T};if(w){s[`1-${d}-loc`]={v:"Gym Group",t:T};ids[d].forEach(id=>s[`1-${d}-${id}`]=S(3,w[1],w[0]))}});
   const q=await page(s,'2026-11-26T10:00:00Z');
   const bad=await q.evaluate(()=>{const out=[];const have=homeDBs();for(let di=0;di<7;di++){DI=di;W=2;render();document.querySelectorAll('.ex').forEach(ex=>{const t=(ex.querySelector('.box.w b')||{}).textContent||"";
     const label=ex.innerText.split('\n').find(l=>/kg (per dumbbell|\(one dumbbell\))/i.test(l));if(label||/dumbbell/i.test(t))[...t.matchAll(/(\d+(\.\d+)?) kg/g)].map(m=>+m[1]).forEach(k=>{if(!have.includes(k))out.push(DAYS[di]+': '+t)})})}return out});
   ok(!bad.length,`home targets all owned dumbbells (history: ${w?w[0]+' kg':'none'})`+(bad.length?' '+bad.join(', '):''))}}

 await b.close();console.log(fails?`${fails} check(s) failed`:'All checks passed');process.exit(fails?1:0)})();
