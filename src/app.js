const D=__DATA__;const IMG=__IMGMAP__;const SVG=__SVG__;
document.getElementById("static").style.display="none";document.getElementById("app").style.display="";
const KEY="strengthplan-v3",CFG="strengthplan-sync";
const LS=(()=>{try{localStorage.setItem("_t","1");localStorage.removeItem("_t");return localStorage}catch(e){return null}})();
const now=()=>new Date().toISOString();
let DB={};try{DB=JSON.parse((LS&&LS.getItem(KEY))||"{}")}catch(e){DB={}}
// migrate old values
for(const k in DB){if(typeof DB[k]!=="object"||DB[k]===null)DB[k]={v:DB[k]};if(!DB[k].t)DB[k].t="2026-11-01T00:00:00.000Z"}
// plan restarted on 9 Nov 2026: archive anything logged against the old start
const DOGEND=new Date(2027,0,5,23,59);const RESTART="2026-11-10T00:00:00.000Z",RESTART2="2026-11-19T00:00:00.000Z";
function archiveOld(){let n=0;for(const k of Object.keys(DB)){const t=DB[k].t||"";if(/^\d+-/.test(k)&&t<RESTART){const a="arch-"+k;if(!DB[a])DB[a]=DB[k];delete DB[k];n++}
 else if(/^[1-9]\d*-/.test(k)&&t<RESTART2){const nk=k.replace(/^\d+-/,"0-");if(!DB[nk]||(DB[nk].t||"")<t){if(DB[nk]&&!DB["arch-"+nk])DB["arch-"+nk]=DB[nk];DB[nk]=DB[k]}else if(!DB["arch-"+k])DB["arch-"+k]=DB[k];delete DB[k];n++}}if(n){try{LS&&LS.setItem(KEY,JSON.stringify(DB))}catch(e){}}return n}
archiveOld();
let C={};try{C=JSON.parse((LS&&LS.getItem(CFG))||"{}")}catch(e){C={}}
const saveC=()=>{try{LS&&LS.setItem(CFG,JSON.stringify(C))}catch(e){}};
let syncMsg="";
function save(k){if(k&&DB[k])DB[k].t=now();try{LS&&LS.setItem(KEY,JSON.stringify(DB));flash("✓ Saved"+(C.token?"":" on this phone"))}catch(e){flash("Couldn't save. Use Safari or the home screen app, not private browsing.")}queueSync()}
function flash(m){const s=document.getElementById("saved");if(s){s.textContent=m;clearTimeout(flash.t);flash.t=setTimeout(()=>s.textContent="",2000)}}
try{navigator.storage&&navigator.storage.persist&&navigator.storage.persist()}catch(e){}
if("serviceWorker" in navigator&&location.protocol.startsWith("http"))navigator.serviceWorker.register("sw.js").catch(()=>{});
// ---------- cloud sync via private GitHub gist ----------
const GH="https://api.github.com",FILE="fitness-plan-progress.json";
const gh=(path,opt={})=>fetch(GH+path,{...opt,headers:{"Authorization":"token "+C.token,"Accept":"application/vnd.github+json",...(opt.body?{"Content-Type":"application/json"}:{})}}).then(async r=>{if(!r.ok)throw new Error(r.status+" "+(await r.text()).slice(0,80));return r.json()});
let syncT=null,syncing=false;
function queueSync(){if(!C.token)return;clearTimeout(syncT);syncT=setTimeout(sync,2500)}
let checkedCopies=false,forcePush=false,copies=0;
async function sync(){if(!C.token||syncing)return;if(!navigator.onLine){syncMsg="Offline: saved on this phone, will sync later";updSync();return}
 syncing=true;syncMsg="Syncing…";updSync();
 try{
  // once per session (and whenever no backup is set), find every backup copy, merge them all, and settle on the oldest one so every device uses the same copy
  if(!C.gist||!checkedCopies){const list=await gh("/gists?per_page=100");const cands=list.filter(x=>x.files&&x.files[FILE]).sort((a,b)=>a.created_at<b.created_at?-1:1);
   if(cands.length){const canon=cands[0].id;let merged=false;
    for(const g of cands){if(g.id===canon&&cands.length===1)break;if(g.id===canon)continue;try{const full=await gh("/gists/"+g.id);const f=full.files[FILE];if(!f)continue;let txt=f.content;if(f.truncated)txt=await fetch(f.raw_url).then(r=>r.text());const other=JSON.parse(txt);
     for(const k in other){const r=other[k],l=DB[k];if(r&&(!l||(r.t||"")>(l.t||""))){DB[k]=r;merged=true}}}catch(e){}}
    if(merged){try{LS&&LS.setItem(KEY,JSON.stringify(DB))}catch(e){}}
    if(C.gist!==canon){C.gist=canon;saveC();merged=true}copies=cands.length;checkedCopies=true;if(merged)forcePush=true}}
  let remote={};if(C.gist){const g=await gh("/gists/"+C.gist);const f=g.files[FILE];if(f){let txt=f.content;if(f.truncated)txt=await fetch(f.raw_url).then(r=>r.text());try{remote=JSON.parse(txt)}catch(e){remote={}}}}
  let changedLocal=false,changedRemote=false;
  for(const k in remote){const r=remote[k],l=DB[k];if(!l||(r.t||"")>(l.t||"")){DB[k]=r;changedLocal=true}}
  for(const k in DB){const r=remote[k],l=DB[k];if(!r||(l.t||"")>(r.t||""))changedRemote=true}for(const k in remote){if(/^\d+-/.test(k)&&(remote[k].t||"")<RESTART)changedRemote=true}
  archiveOld();if(changedLocal){try{LS&&LS.setItem(KEY,JSON.stringify(DB))}catch(e){}}
  if(changedRemote||forcePush||!C.gist){forcePush=false;const body=JSON.stringify({description:"Fitness plan progress (private backup)",files:{[FILE]:{content:JSON.stringify(DB)}}});
   if(C.gist)await gh("/gists/"+C.gist,{method:"PATCH",body});else{const g=await gh("/gists",{method:"POST",body:JSON.stringify({...JSON.parse(body),public:false})});C.gist=g.id;saveC()}}
  C.last=now();saveC();syncMsg="☁️ Synced "+new Date().toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"});if(changedLocal)render();
 }catch(e){syncMsg=String(e.message).startsWith("401")?"Sync key not accepted. Check it on the Plan tab.":"Couldn't sync just now: saved on this phone"}
 syncing=false;updSync()}
function updSync(){const s=document.getElementById("sync");if(s)s.textContent=syncMsg||(C.token?"☁️ Sync on":"Saved on this phone only. Turn on sync in the Plan tab.")}
addEventListener("online",sync);setInterval(()=>{if(C.token&&document.visibilityState==="visible")sync()},30000);addEventListener("focus",sync);document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible")sync()});
// ---------- dates ----------
const DAYS=D.days,pad=n=>String(n).padStart(2,"0");
const start=new Date(D.weeks[0].start+"T12:00:00");
const dateOf=(w,di)=>{const d=new Date(start);d.setDate(d.getDate()+(w-1)*7+di);return d};
function todayPos(){const t=new Date();t.setHours(12,0,0,0);const diff=Math.round((t-start)/864e5);if(diff<0)return[1,0];if(diff>83)return[12,6];return[Math.floor(diff/7)+1,diff%7]}
let [W,DI]=todayPos();const [TW,TD]=todayPos();let TAB="Today";
const defLoc=d=>({Mon:"PureGym",Tue:"Gym Group",Wed:"Gym Group",Thu:"Gym Group"}[d]||"Home");
const locOf=(w,d)=>{const x=DB[`${w}-${d}-loc`];return(x&&x.v)||defLoc(d)};
const esc=t=>String(t==null?"":t).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const K=(w,d,id)=>`${w}-${d}-${id}`;
const get=k=>DB[k]||{};const put=(k,o)=>{DB[k]={...(DB[k]||{}),...o};MEMO={};save(k)};let MEMO={};
// ---------- exercises ----------
function base(d,ab){const s=D.sess[d];return s[ab]||s.list}
function customs(w,d){return Object.keys(DB).filter(k=>k.startsWith("cx-")).map(k=>({...DB[k],id:k})).filter(c=>!c.del&&c.day===d&&(c.week==="all"||+c.week===w)).map(c=>({id:c.id,custom:true,sets:+c.sets||3,reps:c.reps||"8 to 12",unit:"reps",
  v:[{where:D.locs,name:c.name,equip:c.equip||"other",img:"",start:c.start||"Your choice",cue:c.note||"Your own exercise.",kg:c.kg!==false}]}))}
function res(e,loc){const v=(e.v||[]).find(x=>x.where.includes(loc))||e.v[0];const main=e.v[0];return{...v,reps:v.reps||e.reps,swap:v!==main&&v.name!==main.name?main.name:""}}
const ACTK=(w,d)=>[`${w}-${d}-class`,`${w}-${d}-act2`,`${w}-${d}-act3`,`${w}-${d}-act4`];
const actsOf=(w,d)=>ACTK(w,d).map(k=>({k,a:get(k)})).filter(x=>DB[x.k]);
const insteadDone=(w,d)=>actsOf(w,d).some(x=>x.a.done&&x.a.mode==="instead");
const norm=n=>n.replace(/, slow$/,"");
function ownItems(w,d){const loc=locOf(w,d);return[...base(d,wkOf(w).ab).filter(e=>e.kind!=="walk"&&(!e.only||e.only.includes(loc))),...customs(w,d)].map(e=>({e,r:res(e,loc)}))}
// everything planned for a day, including sets left over from the day before (ignores the rest-day flag)
function planned(w,d,depth=0){const mk=`p${w}-${d}-${depth}`;if(MEMO[mk])return MEMO[mk];const loc=locOf(w,d);const items=ownItems(w,d);
 if(depth<7){const[pw,pd]=prevDay(w,DAYS.indexOf(d));if(pw>=1)leftovers(pw,pd,depth+1).forEach(x=>{
  const r=res(x.e,loc),same=items.find(y=>norm(y.r.name)===norm(r.name));
  if(same){same.r={...same.r,add:(same.r.add||0)+x.rem,from:[...new Set([...(same.r.from||[]),...x.from])]}}
  else items.push({e:{...x.e,id:`cu-${pw}-${DAYS[pd]}-${x.e.bid||x.e.id}`,bid:x.e.bid||x.e.id,cu:x.from[0]},r:{...r,fixed:x.rem,from:x.from}})})}
 return MEMO[mk]=items}
// sets not done on a past (or rest) day
function leftovers(w,di,depth){const d=DAYS[di];if(w<1||!(isPast(w,di)||isRest(w,d))||insteadDone(w,d))return[];
 const out=[];planned(w,d,depth).forEach(x=>{const n=setsN(x.e,w,x.r),done=doneSets(K(w,d,x.e.id)),rem=n-done;if(rem<=0)return;
  const from=x.r.from&&x.r.from.length&&!(x.r.add)?x.r.from:[...new Set([...(x.r.from||[]),`${w}|${d}`])];
  if(from.every(f=>get(`${f.replace("|","-")}-skipcu`).v))return;out.push({e:x.e,rem,from})});return out}
function listFor(w,d){if(isRest(w,d))return[];const items=planned(w,d,0);
 const order=[];items.forEach(x=>{if(!order.includes(x.r.equip))order.push(x.r.equip)});return order.map(eq=>({eq,items:items.filter(x=>x.r.equip===eq)}))}
const wkOf=w=>w>=1?D.weeks[w-1]:{ab:"A",type:"Normal",n:0};const setsN=(e,w,r)=>{if(r&&r.fixed)return r.fixed+((r&&r.add)||0);const n=+((r&&r.sets)||e.sets);return(wkOf(w).type==="Deload"&&n>2&&!e.custom?2:n)+((r&&r.add)||0)};
const doneSets=k=>((get(k).s)||[]).filter(x=>x&&x.done).length;
// ---------- missed days roll into the next training day ----------
const isPast=(w,di)=>w<TW||(w===TW&&di<TD);
const isRest=(w,d)=>!!get(`${w}-${d}-rest`).v;
const prevDay=(w,di)=>di>0?[w,di-1]:[w-1,6];
function anyDone(w,di){const d=DAYS[di];if(insteadDone(w,d))return true;const p=`${w}-${d}-`;return Object.keys(DB).some(k=>k.startsWith(p)&&doneSets(k)>0)}
function missed(w,di){return w>=1&&(isPast(w,di)||isRest(w,DAYS[di]))&&!anyDone(w,di)}
function carryInfo(w,di){if(w<1)return{items:[],origins:[]};const[pw,pd]=prevDay(w,di);if(pw<1)return{items:[],origins:[]};
 const items=planned(w,DAYS[di],0).filter(x=>x.e.cu||x.r.add);const origins=new Set();items.forEach(x=>(x.r.from||[]).forEach(f=>origins.add(f)));
 // include skipped origins from yesterday so they can be brought back
 const yk=`${pw}|${DAYS[pd]}`;if(get(`${pw}-${DAYS[pd]}-skipcu`).v)origins.add(yk);return{items,origins:[...origins]}}
const goalsFor=w=>({move:450,ex:30,stand:10});
const WKMIN=210;
function weekMin(w){let m=0;DAYS.forEach(d=>{m+=Math.max(num(get(`${w}-${d}-dayw`).exmin),dayMin(w,d))});return m}
function carryNote(w,di){const day=DAYS[di],N=D.daynames;
 if(isRest(w,day))return`<div class="note">😴 <b>Rest day.</b> Today's exercises move to your next training day and are added to that day's session. <button class="mini-btn" data-rest="${w}-${day}-rest">Undo rest day</button></div>`;
 let h="";if(missed(w,di))h+=`<div class="note">😴 <b>Missed.</b> These exercises have moved to your next training day. You can still log them here if you did them.</div>`;
 const ci=carryInfo(w,di);if(!ci.origins.length)return h;const nm=f=>N[f.split("|")[1]],on=ci.origins.filter(f=>!get(`${f.replace("|","-")}-skipcu`).v);
 const list=ci.items.map(x=>`${esc(x.r.name)} (${x.e.cu?x.r.fixed:x.r.add} set${(x.e.cu?x.r.fixed:x.r.add)>1?"s":""})`).join(", ");
 h+=`<div class="note"><b>↩️ Making up ${on.length?[...new Set(on.map(nm))].join(" and "):"nothing (skipped)"}.</b> ${list?`Sets you didn't get to are added to today: ${list}. Where an exercise is already in today's session, the sets are added together (marked "+ sets"). If that's a lot, use a heavier weight or more reps for fewer sets, as long as the total work is about the same.`:""}
 <div class="mode" style="margin-top:8px">${ci.origins.map(f=>{const sk=get(`${f.replace("|","-")}-skipcu`).v;return`<button data-skipcu="${f.replace("|","-")}-skipcu">${sk?"Bring back ":"Skip "}${nm(f)}</button>`}).join("")}</div></div>`;return h}

function dayStat(w,di){const d=DAYS[di];let t=0,c=0;
 listFor(w,d).forEach(g=>g.items.forEach(({e,r})=>{const n=setsN(e,w,r);t+=n;c+=Math.min(n,doneSets(K(w,d,e.id)))}));if(insteadDone(w,d))c=t;return[c,t]}
const dayDone=(w,di)=>{const[c,t]=dayStat(w,di);return c>=t};
const topOf=r=>{const m=String(r).match(/\d+/g);return m?+m[m.length>1?1:0]:0};
function lastTime(w,di,e,name){for(let ww=w;ww>=0;ww--)for(let dd=(ww===w?di-1:6);dd>=0;dd--){const d=DAYS[dd];
  const ids=listFor(ww,d).flatMap(g=>g.items).filter(({e:x,r:rr})=>(x.custom&&x.id===e.id)||(!x.custom&&rr.name===name)).map(({e:x})=>x.id);
  for(const id of ids){const L=get(K(ww,d,id));const s=(L.s||[]).filter(x=>x&&(x.r||x.kg));if(!s.length)continue;
   const R=res(e,locOf(ww,d));
   return{txt:`Last time (${ww?`week ${ww}, ${d}`:`before the restart, ${d}`}): `+s.map(x=>(x.r||"?")+(x.kg?` @ ${x.kg} kg${R.assist?" assist":""}`:"")).join(", "),s,R,plan:Math.min(e.sets,setsN(e,ww,R))}}}return null}
const botOf=r=>{const m=String(r).match(/\d+/);return m?+m[0]:0};
// sanity-check a weight as it's typed, so totals or typos don't skew future targets
function kgCheck(val,c){const v=num(val);if(!v||c.assist)return{};const max=Math.max(...c.have);
 if(c.home&&v>max){if(c.have.includes(v/2)||v/2<=max)return{fix:v/2,msg:`⚠️ Changed ${v} to ${v/2}: log the weight of one dumbbell, not both added together.`};
  return{msg:`⚠️ Your heaviest dumbbell at home is ${max} kg. Check this number, or add the new weight under Home dumbbells in the Plan tab.`}}
 if(c.prev&&c.pair&&v>=c.prev*1.8)return{msg:`⚠️ That's a lot more than last time (${c.prev} kg). This column is the weight of one dumbbell. If ${v} is both added together, change it to ${v/2}.`};
 if(c.prev&&v>=c.prev*2.5)return{msg:`⚠️ That's a big jump from last time (${c.prev} kg). Double-check the number.`};
 if(c.prev&&v<=c.prev/2.5)return{msg:`⚠️ That's much lighter than last time (${c.prev} kg). Double-check the number.`};
 return{}}
function homeDBs(){const v=String(get("cfg-homedb").v||"2.3, 4, 7").match(/\d+(\.\d+)?/g)||["7"];return[...new Set(v.map(Number))].filter(x=>x>0).sort((a,b)=>a-b)}
function plan2(lt,r){if(!lt)return null;const kg=r.kg!==false,as=!!r.assist,top=topOf(r.reps),bot=botOf(r.reps);
 const kgs=lt.s.map(x=>num(x.kg)).filter(Boolean);
 // judge on working sets: the heaviest weight used (or lightest assist); ignore warm-up sets
 const raw=kgs.length?(as?Math.min(...kgs):Math.max(...kgs)):0;
 const work=kgs.length?lt.s.filter(x=>num(x.kg)===raw):lt.s;const reps=work.map(x=>+x.r||0);
 const enough=work.length>=Math.min(2,lt.plan),best=Math.max(...reps),avg=reps.reduce((a,b)=>a+b,0)/reps.length;
 const db=r.equip.startsWith("dumbbell")||/dumbbell/i.test(r.load||"");
 const home=locOf(W,DAYS[DI])==="Home"&&!as&&db&&kg,HAVE=homeDBs(),MAX=Math.max(...HAVE);
 // at home, never suggest more than the heaviest dumbbell she owns; a logged 14 with 7 kg dumbbells is both dumbbells added together
 let ref=raw,note="";if(home&&ref>MAX){note=ref/2<=MAX?` (Last time's ${ref} kg looks like both dumbbells added together; log the weight of one dumbbell.)`:"";ref=ref/2<=MAX?ref/2:MAX}
 if(home&&ref&&!HAVE.includes(ref)){const near=HAVE.reduce((a,x)=>Math.abs(x-ref)<Math.abs(a-ref)?x:a,HAVE[0]);note+=` (${ref} kg isn't one of your home dumbbells, so this uses your ${near} kg${near>ref?"; fewer reps is fine":"; add a rep or two"}.)`;ref=near}
 const step=as?5:db?(ref<10?1:2):2.5,u=as?" kg assist":r.load==="kg per dumbbell"?" kg each hand":r.load==="kg total incl. bar"?" kg in total, bar included":r.load==="kg of plates (not the bar)"?" kg of plates":" kg";
 const way=enough&&avg>=top+4,hit=enough&&reps.every(n=>n>=top),under=reps.every(n=>n<bot-1);
 // a single set far past the range still counts: weight is clearly too light
 const jump=way||best>=top+6?2:hit?1:0;const pair=r.load==="kg per dumbbell"?"s (one in each hand)":"";
 if(home&&ref){
  if(jump){const nx=HAVE.find(x=>x>ref);if(nx)return{t:nx+u,h:`⬆️ You hit the top of the range, so move up to your ${nx} kg dumbbell${pair}. Start at the bottom of the rep range (${bot}) and build up again.${note}`};
   return{t:ref+" kg, more reps",h:`⬆️ You've outgrown the rep range, and ${MAX} kg is your heaviest dumbbell at home. Make it harder instead: add 2 to 3 reps to every set, or lower over 3 seconds. (The gym is where this one can go heavier.)${note}`}}
  if(under){const lower=[...HAVE].reverse().find(x=>x<ref);return{t:(lower||ref)+u,h:`⬇️ Below the range last time. Today use ${lower?`your ${lower} kg dumbbell${pair}`:"the same dumbbells"} and own the reps.${note}`}}
  return{t:ref+u,h:`➡️ Same dumbbell${pair} as last time (${ref} kg). Aim for 1 more rep on at least one set.${note}`}}
 if(jump&&ref&&kg){const t=+(as?Math.max(0,ref-step*jump):ref+step*jump).toFixed(1);
  return{t:t+u,h:`${jump===2?"⏫ Way past the range last time, so jump two steps":"⬆️ You hit the top of the range, so go up one step"}: ${as?"less assist, about ":"about "}${t}${u}. Start at the bottom of the rep range (${bot}) and build up again.`}}
 if(jump)return{t:"Make it harder",h:"⬆️ Too easy last time. Make it harder today: the next push-up level, a lighter band, a weight, or 3 seconds lowering."};
 if(under&&ref&&kg){const t=+(as?ref+step:Math.max(0,ref-step)).toFixed(1);return{t:t+u,h:`⬇️ Below the range last time. Today use ${as?"a bit more assist":"one step lighter"} (about ${t}${u}) and own the reps.`}}
 return{t:ref?ref+u:"Beat last time",h:`➡️ Same ${as?"assist":"weight"} as last time${ref?` (${ref}${u})`:""}. Aim for 1 more rep on at least one set.`}}
const slug=n=>"ph-"+String(n).toLowerCase().replace(/[^a-z0-9]+/g,"-");
function pics(img,name){const own=get(slug(name)).data;const yt="https://www.youtube.com/results?search_query="+encodeURIComponent(name+" how to");
 if(own)return`<div class="pics one"><div class="lb"><img src="${own}" alt=""><span>Your photo</span></div></div><div class="phbar"><label class="mini-btn">📷 Change photo<input type="file" accept="image/*" data-photo="${esc(name)}" hidden></label> <button class="mini-btn" data-unphoto="${esc(name)}">Use default</button></div>`;
 if(!img||!IMG[img])return`<div class="nophoto"><div>📷</div><b>No free photo of this one yet</b><span>Take a photo of the machine at your gym and it will show here every time.</span><div class="phbar"><label class="mini-btn">📷 Add a photo<input type="file" accept="image/*" data-photo="${esc(name)}" hidden></label> <a class="mini-btn" href="${yt}" target="_blank" rel="noopener">▶️ Watch how (online)</a></div></div>`;
 if(!IMG[img][1])return`<div class="pics one"><div class="lb"><img src="${IMG[img][0]}" alt="" loading="lazy"><span>The machine at your gym</span></div></div>`;
 return`<div class="pics"><div class="lb"><img src="${IMG[img][0]}" alt="" loading="lazy"><span>Start</span></div><div class="lb"><img src="${IMG[img][1]}" alt="" loading="lazy"><span>Finish</span></div></div>`}
const EQI={"machine":"⚙️","cable":"🔗","barbell":"🏋️","Smith machine":"🏗️","dumbbells":"💪","bench":"🪑","mat":"🧘","loop band":"🎗️","pull-up band":"🎗️","bodyweight":"🙆","other":"➕"};
const eqIcon=eq=>{for(const k in EQI)if(eq.startsWith(k))return EQI[k];return"🏋️"};
const fmt=d=>d.toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"short"});
const num=v=>+(String(v||"").replace(/[^\d.]/g,""))||0;
function dayKcal(w,d){return num(get(K(w,d,"walk")).kcal)+actsOf(w,d).reduce((s,x)=>s+num(x.a.kcal),0)+num(get(`${w}-${d}-sum`).akcal)}
function dayMin(w,d){return num(get(K(w,d,"walk")).min)+actsOf(w,d).reduce((s,x)=>s+num(x.a.min),0)+num(get(`${w}-${d}-sum`).min)}
// ---------- render ----------
function render(){MEMO={};const wk=D.weeks[W-1],day=DAYS[DI];
 let h=`<div class="wrap"><div class="top"><div class="nav"><button class="arrow" id="prev">‹</button><div class="title"><div class="d">${TAB==="Today"?fmt(dateOf(W,DI)):TAB==="Week"?"Week "+W:"Your plan"}</div><div class="w">Week ${W} of 12 · ${wk.label}</div></div><button class="arrow" id="next">›</button></div>`;
 if(TAB!=="Plan"){h+=`<div class="strip">${DAYS.map((d,i)=>`<button class="chip ${i===DI&&TAB==="Today"?"on":""} ${dayDone(W,i)?"done":""} ${W===TW&&i===TD?"today":""}" data-di="${i}">${d}<b>${dateOf(W,i).getDate()}</b></button>`).join("")}</div>`;
  if(TAB==="Today"){const L=locOf(W,day);h+=`<div class="gyms">${D.locs.map(l=>`<button class="${l===L?"on":""}" data-loc="${l}">${{"Third Space":"🏋️<small>Third Space</small>","Office gym":"🏢<small>Office</small>","PureGym":"💪<small>PureGym</small>","Gym Group":"🏃‍♀️<small>Gym Group</small>","Home":"🏠<small>Home</small>"}[l]}</button>`).join("")}</div>`}}
 h+=`<div class="sync" id="sync"></div></div>`+(TAB==="Today"?today(wk,day):TAB==="Week"?week(wk):plan())+`</div><div class="tabbar">${[["Today","📅"],["Week","🗓️"],["Plan","📋"]].map(([t,i])=>`<button class="${TAB===t?"on":""}" data-tab="${t}"><div>${i}</div>${t}</button>`).join("")}</div>`;
 document.getElementById("app").innerHTML=h;bind();updSync()}
function card(e,r,key,lt){const P=plan2(lt,r);const _home=locOf(W,DAYS[DI])==="Home"&&!r.assist&&(r.equip.startsWith("dumbbell")||/dumbbell/i.test(r.load||""));
 const chk=esc(JSON.stringify({home:_home,have:homeDBs(),pair:r.load==="kg per dumbbell",assist:!!r.assist,prev:lt?Math.max(0,...lt.s.map(x=>num(x.kg)).filter(Boolean)):0}));const plan=setsN(e,W,r),ns=plan+(get(key).extra||0);const S=get(key).s||[];const kg=r.kg!==false;const all=S.filter(x=>x&&x.done).length>=plan;const def=String(r.reps).split(" ")[0];
 return`<div class="ex ${all?"all":""}">${pics(r.img,r.name)}<div class="body"><span class="eq">${eqIcon(r.equip)} ${esc(r.equip)}</span>${e.custom?'<span class="eq" style="background:var(--amber2)">Your exercise</span>':""}
 ${r.swap?`<div class="swap">${esc(locOf(W,DAYS[DI]))} version of: ${esc(r.swap)}</div>`:""}<div class="name">${esc(r.name)}</div>
 <div class="big"><div class="box"><b>${ns}</b><span>sets</span></div><div class="box"><b>${esc(r.reps)}</b><span>${e.unit==="secs"?"time":"reps"}</span></div><div class="box w"><b>${esc(P?P.t:r.start)}</b><span>${P?"today":"start"}</span></div></div>${/per (side|leg|arm)/.test(r.reps)?`<div class="note" style="margin:8px 0 0;padding:8px 10px;font-size:13px">🔁 <b>1 set = ${esc(r.reps.replace(/ per (side|leg|arm).*/,""))} on one ${(r.reps.match(/per (side|leg|arm)/)||[])[1]}, then the same on the other.</b> Do both sides before you tick the set, and type the number for one side.</div>`:""}
 ${e.cu?`<div class="tag del" style="display:inline-block;margin:6px 0">↩️ Missed on ${[...new Set(r.from.map(f=>D.daynames[f.split("|")[1]]))].join(" and ")}${r.add?` (${setsN(e,W,r)} sets in total)`:""}</div>`:r.add?`<div class="tag del" style="display:inline-block;margin:6px 0">↩️ + ${r.add} set${r.add>1?"s":""} from ${[...new Set(r.from.map(f=>D.daynames[f.split("|")[1]]))].join(" and ")}</div>`:""}${r.how?`<div class="tip" style="margin-bottom:4px"><b>Setup:</b> ${esc(r.how)}</div>`:""}<div class="tip">${r.how?"<b>How:</b> ":""}${esc(r.cue)}</div>${IMG[r.img]&&!get(slug(r.name)).data?`<label class="mini-btn" style="margin-top:6px">📷 Use my own photo<input type="file" accept="image/*" data-photo="${esc(r.name)}" hidden></label>`:""}${lt?`<div class="last">${esc(lt.txt)}</div><div class="hint">${esc(P.h)}</div>`:""}
 <div class="hdr ${kg?"":"nokg"}"><span>Set</span><span>${e.unit==="secs"?"Seconds":"Reps done"}</span>${kg?`<span>${esc(r.load||(r.assist?"kg assist":"kg used"))}</span>`:""}<span></span></div>
 ${Array.from({length:ns},(_,j)=>{const x=S[j]||{};return`<div class="setrow ${kg?"":"nokg"}"><span class="sn">${j+1}</span><input inputmode="numeric" placeholder="${esc(def)}" data-k="${key}" data-j="${j}" data-f="r" value="${esc(x.r||"")}">${kg?`<input inputmode="decimal" placeholder="${P&&/^[\d.]+ kg/.test(P.t)?esc(P.t.split(" ")[0]):"kg"}" data-k="${key}" data-j="${j}" data-f="kg" data-chk="${chk}" value="${esc(x.kg||"")}">`:""}<button class="tick ${x.done?"on":""}" data-k="${key}" data-j="${j}" data-n="${plan}" data-def="${esc(def)}">${x.done?"✓":"○"}</button></div>`}).join("")}
 <div class="note" data-warn="${key}" style="display:none;margin:8px 0;padding:8px 10px;font-size:13px"></div><button class="mini-btn" data-addset="${key}">＋ Add a set</button>${e.custom?` <button class="mini-btn" data-del="${e.id}">Remove this exercise</button>`:""}</div></div>`}
const MF=[["waist","Waist"],["hips","Hips"],["arm","Arm"]];
function measCard(w){const k=`m-${w}`,M=get(k);let ch="";
 MF.forEach(([f,lab])=>{let first=null,fw=0;for(let i=1;i<=w;i++){const v=num(get(`m-${i}`)[f]);if(v){first=v;fw=i;break}}const now=num(M[f]);
  if(first!=null&&now&&fw<w){const d=+(now-first).toFixed(2);ch+=`<span>${lab}: ${d>0?"+":""}${d} in since week ${fw}</span>`}});
 return`<div class="cls"><b>📏 Measurements, week ${w}</b><div class="tip">Measure once a week, on Thursday (the first day of each plan week) or the first day you can, after a few hours without food (morning or afternoon), relaxed, same tape. Fill in what you have; the card stays on Today until all three are in. Waist: at your belly button. Hips: widest point. Arm: middle of the upper arm, same arm each time, relaxed.</div><div class="sum">
 <div><label>Waist (in)</label><input inputmode="decimal" data-o="${k}" data-f="waist" value="${esc(M.waist||"")}"></div><div><label>Hips (in)</label><input inputmode="decimal" data-o="${k}" data-f="hips" value="${esc(M.hips||"")}"></div>
 <div><label>Arm (in)</label><input inputmode="decimal" data-o="${k}" data-f="arm" value="${esc(M.arm||"")}"></div><div><label>Weight (kg, optional)</label><input inputmode="decimal" data-o="${k}" data-f="kg" value="${esc(M.kg||"")}"></div></div>${ch?`<div class="tot">${ch}</div>`:""}</div>`}
function measTable(){const rows=[];for(let w=1;w<=12;w++){const M=get(`m-${w}`);if(M.waist||M.hips||M.arm||M.kg)rows.push(`<tr><td>${w}</td><td>${esc(M.waist||"")}</td><td>${esc(M.hips||"")}</td><td>${esc(M.arm||"")}</td><td>${esc(M.kg||"")}</td></tr>`)}
 return`<h3>Measurements</h3>`+(rows.length?`<table class="cal"><tr><th>Week</th><th>Waist</th><th>Hips</th><th>Arm</th><th>kg</th></tr>${rows.join("")}</table>`:`<p style="font-size:14px">Add them on Thursdays (or in the Week tab). Your changes since week 1 will show here.</p>`)}
function today(wk,day){const s=D.sess[day];const ck=`${W}-${day}-class`,CL=get(ck),wkey=K(W,day,"walk"),WL=get(wkey),sk=`${W}-${day}-sum`,SM=get(sk);
 let tags=`<span class="tag">Week ${wk.ab}</span>`+(wk.type==="Deload"?`<span class="tag del">Easy week: 2 sets</span>`:"")+(wk.n===1?`<span class="tag del">Finding your weights</span>`:"")+(wk.test&&day==="Tue"?`<span class="tag test">Pull-up test today</span>`:"");
 let h=`<div class="hero"><h2>${esc(s.title)}</h2><div class="tags">${tags}</div><div class="prog"><i id="pbar"></i></div><div class="saved" id="saved"></div></div>`;
 if(W===1&&DI===0)h+=`<div class="note"><b>Day 1.</b> Your plan starts today. Go easy: stop every set with about 3 reps spare while you find your weights.</div>`;
 if(s.note)h+=`<div class="note">${esc(s.note)}</div>`;
 if(wk.test&&day==="Tue")h+=`<div class="note"><b>Pull-up test:</b> after warming up, try one unassisted pull-up. Then do your assisted sets.</div>`;
 const dogOn=dateOf(W,DI)<=DOGEND;
 h+=`<details class="cls ${WL.done?"all":""}" ${WL.done||WL.min?"open":""}><summary>${dogOn?"🐕 Dog walk":"🚶‍♀️ Walk"} (optional)</summary><div class="tip">${dogOn?"Any length counts; 40 minutes when you can.":"Log a walk whenever you get the chance."} It doesn't affect today's progress.</div>
 <div class="walkrow"><input inputmode="numeric" placeholder="minutes" data-o="${wkey}" data-f="min" value="${esc(WL.min||"")}"><input inputmode="numeric" placeholder="kcal (watch)" data-o="${wkey}" data-f="kcal" value="${esc(WL.kcal||"")}"><button class="tick ${WL.done?"on":""}" data-flag="${wkey}">${WL.done?"✓":"○"}</button></div></details>`;
 {const keys=ACTK(W,day),present=keys.filter(k=>DB[k]);const shown=present.length?present:[keys[0]];const anyOn=present.some(k=>get(k).done||get(k).type);
 const opts=sel=>D.acttypes.map(g=>`<optgroup label="${esc(g[0])}">${g[1].map(c=>`<option ${sel===c?"selected":""}>${esc(c)}</option>`).join("")}</optgroup>`).join("");
 h+=`<details class="cls ${present.some(k=>get(k).done)?"all":""}" ${anyOn?"open":""}><summary>🏃‍♀️ Cardio, class or other activity</summary><div class="tip">Treadmill walks, runs, bike, classes, Fitness+ and anything else. ${esc(s.cls)}.</div>`+
 shown.map((k,i)=>{const A=get(k);return`<div style="border-top:${i?"1px solid var(--line)":"0"};padding-top:${i?"10px":"0"};margin-top:${i?"10px":"0"}">
 <div class="row"><select data-o="${k}" data-f="type"><option value="">Choose activity…</option>${opts(A.type)}</select><input placeholder="Name or details (optional)" data-o="${k}" data-f="name" value="${esc(A.name||"")}"></div>
 <div class="mode"><button class="${A.mode!=="instead"?"on":""}" data-mode="${k}|extra">As an extra</button><button class="${A.mode==="instead"?"on":""}" data-mode="${k}|instead">Instead of today's session</button></div>
 <div class="row2"><input inputmode="numeric" placeholder="minutes" data-o="${k}" data-f="min" value="${esc(A.min||"")}"><input inputmode="numeric" placeholder="kcal (watch)" data-o="${k}" data-f="kcal" value="${esc(A.kcal||"")}"><button class="tick ${A.done?"on":""}" data-flag="${k}">${A.done?"✓":"○"}</button></div></div>`}).join("")+
 (shown.length<keys.length?`<button class="mini-btn" style="margin-top:10px" data-addact="${keys[shown.length]}">＋ Add another activity</button>`:"")+`</details>`;}
 h+=carryNote(W,DI);
 {const M=get(`m-${W}`);if(DI===0||!(M.waist&&M.hips&&M.arm))h+=measCard(W);}
 const groups=listFor(W,day);
 if(!isRest(W,day)&&!anyDone(W,DI)&&!(W<TW||(W===TW&&DI<TD)))h+=`<div style="text-align:right;margin:4px 0 8px"><button class="mini-btn" data-rest="${W}-${day}-rest">😴 Can't train ${W===TW&&DI===TD?"today":"this day"}? Make it a rest day</button></div>`;
 groups.forEach(g=>{h+=`<div class="grp">${eqIcon(g.eq)} ${esc(g.eq)}${g.items.length>1?` · ${g.items.length} exercises together`:""}</div>`;g.items.forEach(({e,r})=>{h+=card(e,r,K(W,day,e.id),lastTime(W,DI,e,r.name))})});
 h+=`<details class="cls"><summary>＋ Add an exercise</summary><div class="frm"><div class="full"><label>Exercise</label><input id="cx-name" placeholder="e.g. Cable triceps pushdown"></div>
 <div><label>Equipment</label><select id="cx-eq">${D.equip.map(q=>`<option>${q}</option>`).join("")}</select></div><div><label>Start weight</label><input id="cx-start" placeholder="e.g. 10 kg"></div>
 <div><label>Sets</label><input id="cx-sets" inputmode="numeric" value="3"></div><div><label>Reps</label><input id="cx-reps" placeholder="e.g. 10 to 12"></div>
 <div class="full"><label>Notes (optional)</label><input id="cx-note" placeholder="How to do it"></div>
 <div class="full"><label><input type="checkbox" id="cx-all" style="width:auto;height:auto"> Add to every ${D.daynames[day]} (all 12 weeks)</label></div></div><button class="btn" id="cx-add" style="margin-top:10px">Add exercise</button></details>`;
 h+=`<div class="cls"><b>⌚ Apple Watch totals for today's workout</b><div class="tip">Enter these when you finish the session.</div><div class="sum">
 <div><label>Workout minutes</label><input inputmode="numeric" data-o="${sk}" data-f="min" value="${esc(SM.min||"")}"></div><div><label>Active kcal</label><input inputmode="numeric" data-o="${sk}" data-f="akcal" value="${esc(SM.akcal||"")}"></div>
 <div><label>Total kcal</label><input inputmode="numeric" data-o="${sk}" data-f="tkcal" value="${esc(SM.tkcal||"")}"></div><div><label>Avg heart rate</label><input inputmode="numeric" data-o="${sk}" data-f="hr" value="${esc(SM.hr||"")}"></div></div>
 <div class="tot"><span>Today: ${dayMin(W,day)} min</span><span>${dayKcal(W,day)} active kcal (walk + class + workout)</span></div></div>`;
 const dk=`${W}-${day}-dayw`,DW=get(dk);
 const G=goalsFor(W),ring=(v,g,u,lab,f,col)=>{const n=num(v),pc=Math.min(100,g?100*n/g:0);return`<div><label>${lab} <span style="opacity:.7">(goal ${g}${u})</span></label><input inputmode="numeric" data-o="${dk}" data-f="${f}" value="${esc(v||"")}"><div class="prog" style="margin-top:6px;height:6px"><i style="width:${pc}%;background:${col}"></i></div>${n>=g?`<div style="font-size:12px;color:${col};font-weight:700">✓ Ring closed</div>`:""}</div>`};
 h+=`<div class="cls"><b>⭕ Apple Watch rings for the whole day</b><div class="tip">Enter these at the end of the day from the Fitness app, or tap your "Log my rings" shortcut. Daily goals: Move ${G.move} kcal, Exercise ${G.ex} min, Stand ${G.stand} hours.</div><div class="sum">
 ${ring(DW.akcal,G.move," kcal","🔴 Move (active kcal)","akcal","#d9534f")}${ring(DW.exmin,G.ex," min","🟢 Exercise (minutes)","exmin","#4c9a5b")}
 ${ring(DW.stand,G.stand," h","🔵 Stand (hours)","stand","#3d7eb5")}<div><label>Steps (optional)</label><input inputmode="numeric" data-o="${dk}" data-f="steps" value="${esc(DW.steps||"")}"></div></div></div>`;
 return h+`<button class="btn" id="goNext">${W===12&&DI===6?"Plan complete 🎉":"Next day ›"}</button>`}
function week(wk){let tk=0,tm=0,da=0,dt=0,st=0,sn=0,mv=0,nm=0;const G=goalsFor(W);let cm=0,ce=0,cs=0;DAYS.forEach(d=>{const x=get(`${W}-${d}-dayw`);da+=num(x.akcal);if(num(x.akcal)){mv+=num(x.akcal);nm++}if(num(x.akcal)>=G.move)cm++;if(num(x.exmin)>=G.ex)ce++;if(num(x.stand)>=G.stand)cs++;if(num(x.steps)){st+=num(x.steps);sn++}});
 const rows=DAYS.map((d,i)=>{const s=D.sess[d];const[c,t]=dayStat(W,i);tk+=dayKcal(W,d);tm+=dayMin(W,d);const AC=actsOf(W,d).filter(x=>x.a.done);
  const body=`<div style="font-weight:700;margin-bottom:4px">${esc(s.title)} <span style="font-weight:400;color:var(--mute);font-size:13px">${c}/${t} · ${dayKcal(W,d)} kcal${num(get(`${W}-${d}-dayw`).akcal)?` · day ${num(get(`${W}-${d}-dayw`).akcal)}`:""}</span>${AC.map(x=>`<div style="font-weight:400;font-size:13px;color:var(--rose)">🏃‍♀️ ${esc(x.a.type||"Activity")} ${x.a.min?x.a.min+" min":""} ✓</div>`).join("")}</div>`+
   listFor(W,d).map(g=>g.items.map(({e,r})=>`<div class="mini" data-di="${i}">${get(slug(r.name)).data?`<img src="${get(slug(r.name)).data}" alt="">`:r.img&&IMG[r.img]?`<img src="${IMG[r.img][1]||IMG[r.img][0]}" alt="" loading="lazy">`:`<div class="ph">${eqIcon(r.equip)}</div>`}<div class="ms"><b>${esc(r.name)}</b>${setsN(e,W,r)} × ${esc(r.reps)}${doneSets(K(W,d,e.id))>=setsN(e,W,r)?" ✓":""}</div></div>`).join("")).join("");
  return`<tr><td>${d}<div style="font-weight:400;font-size:12px;color:var(--mute)">${dateOf(W,i).getDate()}</div>${dayDone(W,i)?'<div style="color:var(--teal)">✓</div>':""}</td><td>${body}</td></tr>`}).join("");
 return`<div class="hero"><h2>Week ${wk.n}</h2><div style="font-size:14px">${esc(wk.focus)}</div><div class="tot"><span>⏱️ ${weekMin(W)} of ${WKMIN} exercise minutes</span><span>${DAYS.filter((d,i)=>missed(W,i)).length} missed or rest day(s)</span></div><div class="tot"><span>${tm} min logged</span><span>${tk} active kcal (workouts)</span></div>${nm||sn||cs||ce?`<div class="tot"><span>Rings closed: 🔴 ${cm}/7 · 🟢 ${ce}/7 · 🔵 ${cs}/7</span>${nm>=5&&mv/nm>G.move*1.15?`<span>Your Move average is ${Math.round(mv/nm)} kcal, well above the goal. Try ${Math.round(mv/nm/10)*10} on your watch.</span>`:nm>=5&&mv/nm<G.move*0.8?`<span>Your Move average is ${Math.round(mv/nm)} kcal. Set your watch to ${Math.round(mv/nm*1.05/10)*10} for now and build up.</span>`:""}<span>${sn?Math.round(st/sn).toLocaleString("en-GB")+" steps a day":""}</span></div>`:""}</div><table class="wk">${rows}</table>`+measCard(W)}
function plan(){const n=Object.keys(DB).length;
 return`<h3>Save your progress to the cloud</h3><div class="cls"><div class="tip" style="margin-top:0">Your ticks and numbers always save on this phone. Turn on sync to also back them up to a private, secret file in your GitHub account, so nothing is lost if Safari clears its data, and so it matches on every device (Safari, the home screen app and your laptop).</div>
 ${C.token?`<p>☁️ Sync is on. ${C.last?"Last synced "+new Date(C.last).toLocaleString("en-GB",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"}):""}${syncMsg&&!/Synced/.test(syncMsg)?` · <b>${esc(syncMsg)}</b>`:""}</p><p style="font-size:13px">Backup code: <b>${esc((C.gist||"none yet").slice(-6))}</b>${copies>1?` (merged ${copies} copies into one)`:""}. Your phone and laptop should show the same code. This copy is ${navigator.standalone||matchMedia("(display-mode: standalone)").matches?"the home-screen app":"a browser tab"}; each one is linked separately.</p><button class="btn" id="syncnow">Sync now</button><button class="btn alt" id="pairlink">📱 Copy a link for my other devices</button><div class="tip" id="pairmsg"></div><button class="btn alt" id="unsync">Turn off sync on this device</button>`
 :`<ol style="font-size:14px;padding-left:18px"><li>On GitHub, open <b>Settings → Developer settings → Personal access tokens → Tokens (classic)</b>.</li><li>Tap <b>Generate new token (classic)</b>, name it "Fitness plan", set the expiry to 1 year, and tick only <b>gist</b>.</li><li>Copy the token and paste it below. <b>Already set up on another device?</b> There, tap "Copy a link for my other devices" in this tab, then paste that link here instead.</li><li><b>Then do the same on your laptop</b> (open this website there, Plan tab, paste the same token). After that, anything you log on your phone shows on your laptop within about 30 seconds, and the other way round.</li></ol>
 <div class="frm"><div class="full"><input id="tok" placeholder="Paste your token or the link from your other device" autocomplete="off"></div></div><button class="btn" id="connect" style="margin-top:10px">Turn on sync</button>`}
 <div class="tip">${n} items saved on this device.</div></div>
 <h3>12 weeks</h3><table class="cal"><tr><th>Week</th><th>Dates</th><th>Focus</th></tr>${D.weeks.map(w=>`<tr class="${w.n===TW?"cur":""}" data-w="${w.n}"><td>${w.n}${w.type==="Deload"?" 🟡":""}${w.test?" 🎯":""}</td><td>${w.label}</td><td>${esc(w.focus)}</td></tr>`).join("")}</table>
 <p style="font-size:13px;color:var(--mute)">🟡 easy week (2 sets) · 🎯 pull-up test week · tap a week to open it</p>
 <button class="btn alt" id="exp">⬇️ Download backup</button><label class="btn alt" style="text-align:center">⬆️ Restore from backup<input type="file" id="imp" accept=".json,application/json" style="display:none"></label><button class="btn alt" id="csv">📊 Download log as spreadsheet (CSV)</button>
 <h3>Home dumbbells</h3><p style="font-size:14px">The dumbbell weights you have at home (2.3 kg = 5 lb). Home targets only ever use these. Update this if you buy heavier dumbbells.</p><div class="row"><input data-o="cfg-homedb" data-f="v" value="${esc(get("cfg-homedb").v||"2.3, 4, 7")}" placeholder="e.g. 4, 7"></div>
 ${measTable()}
 <h3>Apple Watch ring goals</h3><table class="cal"><tr><th>🔴 Move</th><th>🟢 Exercise</th><th>🔵 Stand</th></tr><tr><td>450 kcal a day</td><td>30 min a day</td><td>10 hours a day</td></tr></table><p style="font-size:14px">The same every day for all 12 weeks.</p>
 <p style="font-size:14px">Set these on your watch (Fitness app on iPhone, your profile, Change Goals). Move counts active calories only, not the calories your body burns at rest. If the Week tab says you're well above or below the Move goal, use its suggestion.</p>
 <details><summary><b>Log my rings with one tap (Shortcuts)</b></summary><ol style="font-size:14px;padding-left:20px">
 <li>Use the "Log my rings" shortcut (signed on your Mac and AirDropped to your iPhone), or build it: Find Health Samples, Type <b>Active Calories</b>, Start Date <b>is today</b>, then Calculate Statistics <b>Sum</b>. Do the same for <b>Exercise Minutes</b> and <b>Steps</b>.</li>
 <li>Add a URL: <code>https://ai16aau.github.io/fitness-plan/#watch&amp;move=[Move]&amp;ex=[Exercise]&amp;steps=[Steps]</code>, then Open URLs.</li>
 <li>Run it at the end of the day, or set a personal Automation for 9:30pm. It fills in Move, Exercise and Steps. Type Stand in yourself. Your numbers travel after the # sign, which never leaves your phone.</li>
 <li>The shortcut opens the page in Safari. If you use the app from your home screen, turn on sync below so both copies share the numbers.</li></ol></details>
 <h3>Getting stronger</h3><ul>${D.progress.map(r=>`<li>${esc(r)}</li>`).join("")}</ul><h3>Missed a day?</h3><ul>${D.rules.map(r=>`<li>${esc(r)}</li>`).join("")}</ul>`}
function go(dx){DI+=dx;if(DI>6){if(W<12){W++;DI=0}else DI=6}if(DI<0){if(W>1){W--;DI=6}else DI=0}render();scrollTo(0,0)}
function bar(){const b=document.getElementById("pbar");if(!b)return;const[c,t]=dayStat(W,DI);b.style.width=(t?100*c/t:0)+"%";const ch=document.querySelector(`.chip[data-di="${DI}"]`);if(ch)ch.classList.toggle("done",dayDone(W,DI))}
function setv(k,j,f,v){DB[k]=DB[k]||{};DB[k].s=DB[k].s||[];DB[k].s[j]=DB[k].s[j]||{};DB[k].s[j][f]=v;save(k)}
function bind(){const $=id=>document.getElementById(id),Q=s=>document.querySelectorAll(s),day=DAYS[DI];
 $("prev").onclick=()=>TAB==="Week"?(W>1&&(W--,render())):go(-1);$("next").onclick=()=>TAB==="Week"?(W<12&&(W++,render())):go(1);
 Q("[data-di]").forEach(b=>b.onclick=()=>{DI=+b.dataset.di;TAB="Today";render();scrollTo(0,0)});
 Q("[data-loc]").forEach(b=>b.onclick=()=>{put(`${W}-${day}-loc`,{v:b.dataset.loc});render()});
 Q("[data-tab]").forEach(b=>b.onclick=()=>{TAB=b.dataset.tab;render();scrollTo(0,0)});
 Q("[data-w]").forEach(b=>b.onclick=()=>{W=+b.dataset.w;TAB="Week";render();scrollTo(0,0)});
 Q("input[data-f][data-k]").forEach(i=>i.oninput=()=>setv(i.dataset.k,+i.dataset.j,i.dataset.f,i.value));
 Q("input[data-chk]").forEach(i=>i.onchange=()=>{const w=document.querySelector(`[data-warn="${i.dataset.k}"]`),m=kgCheck(i.value,JSON.parse(i.dataset.chk));
  if(m.fix!=null){i.value=m.fix;setv(i.dataset.k,+i.dataset.j,"kg",String(m.fix))}if(w){w.style.display=m.msg?"block":"none";w.textContent=m.msg||""}});
 Q("[data-o]").forEach(i=>{const f=()=>{put(i.dataset.o,{[i.dataset.f]:i.value});const tt=document.querySelector(".tot");};i.oninput=f;i.onchange=f});
 Q("[data-flag]").forEach(b=>b.onclick=()=>{const k=b.dataset.flag;put(k,{done:!get(k).done});render()});
 Q("[data-rest]").forEach(b=>b.onclick=()=>{const k=b.dataset.rest;put(k,{v:!get(k).v});render()});
 Q("[data-skipcu]").forEach(b=>b.onclick=()=>{const k=b.dataset.skipcu;put(k,{v:!get(k).v});render()});
 Q("[data-mode]").forEach(b=>b.onclick=()=>{const[k,m]=b.dataset.mode.split("|");put(k,{mode:m});render()});
 Q("[data-addact]").forEach(b=>b.onclick=()=>{put(b.dataset.addact,{mode:"extra"});render()});
 Q(".tick[data-j]").forEach(b=>b.onclick=()=>{const k=b.dataset.k,j=+b.dataset.j;const cur=(get(k).s||[])[j]||{};const v=!cur.done;
  if(v&&!cur.r){const inp=document.querySelector(`input[data-k="${k}"][data-j="${j}"][data-f="r"]`);if(inp){inp.value=b.dataset.def;setv(k,j,"r",b.dataset.def)}}
  if(v&&!cur.kg&&j>0){const prev=(get(k).s||[])[j-1]||{};const ik=document.querySelector(`input[data-k="${k}"][data-j="${j}"][data-f="kg"]`);if(ik&&prev.kg){ik.value=prev.kg;setv(k,j,"kg",prev.kg)}}
  setv(k,j,"done",v);b.classList.toggle("on",v);b.textContent=v?"✓":"○";const ex=b.closest(".ex");const all=doneSets(k)>=+b.dataset.n;ex.classList.toggle("all",all);bar();
  if(v&&all){let nx=ex.nextElementSibling;while(nx&&!nx.classList.contains("ex"))nx=nx.nextElementSibling;if(nx)setTimeout(()=>nx.scrollIntoView({behavior:"smooth",block:"start"}),300)}});
 Q("[data-addset]").forEach(b=>b.onclick=()=>{const k=b.dataset.addset;const s=get(k).s||[];const id=k.split("-").slice(2).join("-");/* extra set beyond plan */DB[k]=DB[k]||{};DB[k].extra=(DB[k].extra||0)+1;save(k);render()});
 Q("[data-del]").forEach(b=>b.onclick=()=>{if(confirm("Remove this exercise?")){put(b.dataset.del,{del:true});render()}});
 if($("cx-add"))$("cx-add").onclick=()=>{const name=$("cx-name").value.trim();if(!name){alert("Give the exercise a name first.");return}
  const id="cx-"+Date.now().toString(36);DB[id]={day,week:$("cx-all").checked?"all":W,name,equip:$("cx-eq").value,sets:$("cx-sets").value||3,reps:$("cx-reps").value||"8 to 12",start:$("cx-start").value,note:$("cx-note").value,kg:!["mat","bodyweight"].includes($("cx-eq").value)};save(id);render()};
 Q("[data-photo]").forEach(i=>i.onchange=()=>{const f=i.files[0];if(!f)return;const img=new Image();img.onload=()=>{const c=document.createElement("canvas");const s=Math.min(1,480/Math.max(img.width,img.height));c.width=img.width*s;c.height=img.height*s;c.getContext("2d").drawImage(img,0,0,c.width,c.height);put(slug(i.dataset.photo),{data:c.toDataURL("image/jpeg",0.6),del:false});render()};img.src=URL.createObjectURL(f)});
 Q("[data-unphoto]").forEach(b=>b.onclick=()=>{put(slug(b.dataset.unphoto),{data:""});render()});
 if($("goNext"))$("goNext").onclick=()=>go(1);
 if($("connect"))$("connect").onclick=()=>{const t=$("tok").value.trim();if(!t){alert("Paste your token first.");return}const pr=parsePair(t);if(pr){C.token=pr.token;C.gist=pr.gist}else{C.token=t;delete C.gist}saveC();sync().then(render)};
 if($("pairlink"))$("pairlink").onclick=()=>{const link=`${location.origin}${location.pathname}#pair=${encodeURIComponent(C.token)}~${encodeURIComponent(C.gist||"")}`;const m=$("pairmsg");
  const done=()=>{m.textContent="Copied. On your phone (with the same Apple ID, Bluetooth and Wi-Fi on), paste it into the sync box in the Plan tab, or into Safari's address bar. Treat it like a password: don't post or send it to anyone."};
  (navigator.clipboard?navigator.clipboard.writeText(link).then(done):Promise.reject()).catch(()=>{m.innerHTML=`Copy this link: <input readonly value="${esc(link)}" style="width:100%" onclick="this.select()">`})};
 if($("syncnow"))$("syncnow").onclick=()=>sync().then(render);
 if($("unsync"))$("unsync").onclick=()=>{if(confirm("Turn off sync on this device? Your progress stays on the phone and in your GitHub backup.")){C={};saveC();render()}};
 const dl=(name,txt,type)=>{const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([txt],{type}));a.download=name;document.body.appendChild(a);a.click();a.remove()};
 if($("exp"))$("exp").onclick=()=>dl(`fitness-plan-backup-${new Date().toISOString().slice(0,10)}.json`,JSON.stringify(DB),"application/json");
 if($("imp"))$("imp").onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{const o=JSON.parse(r.result);if(confirm("Add this backup to the progress on this device? Newer entries win.")){for(const k in o){const v=typeof o[k]==="object"&&o[k]?o[k]:{v:o[k]};if(!v.t)v.t="2026-11-01T00:00:00.000Z";if(!DB[k]||(v.t>(DB[k].t||"")))DB[k]=v}save();render();alert("Backup restored.")}}catch(x){alert("That file isn't a backup from this app.")}};r.readAsText(f)};
 if($("csv"))$("csv").onclick=()=>{const rows=[["Week","Day","Date","Location","Exercise","Equipment","Set","Reps or seconds","kg","Done","Minutes","kcal"]];
  for(let w=1;w<=12;w++)DAYS.forEach((d,di)=>{const dt=dateOf(w,di).toISOString().slice(0,10),loc=locOf(w,d);const Wk=get(K(w,d,"walk"));if(Wk.done||Wk.min)rows.push([w,d,dt,"",dateOf(w,di)<=DOGEND?"Dog walk":"Walk","","","","",Wk.done?"Yes":"",Wk.min||"",Wk.kcal||""]);
   actsOf(w,d).forEach(({a:CL})=>{if(CL.type||CL.done)rows.push([w,d,dt,"",(CL.type||"Activity")+(CL.name?" ("+CL.name+")":"")+(CL.mode==="instead"?" [instead of session]":""),"","","","",CL.done?"Yes":"",CL.min||"",CL.kcal||""])});
   listFor(w,d).forEach(g=>g.items.forEach(({e,r})=>(get(K(w,d,e.id)).s||[]).forEach((x,j)=>{if(x)rows.push([w,d,dt,loc,r.name,r.equip,j+1,x.r||"",x.kg||"",x.done?"Yes":"","",""])})));
   const SM=get(`${w}-${d}-sum`);if(SM.min||SM.akcal)rows.push([w,d,dt,loc,"Apple Watch workout total","","","","","",SM.min||"",SM.akcal||""]);if(di===0){const M=get(`m-${w}`);if(M.waist||M.hips||M.arm)rows.push([w,d,dt,"","Measurements (in): waist "+(M.waist||"?")+", hips "+(M.hips||"?")+", arm "+(M.arm||"?")+(M.kg?", weight "+M.kg+" kg":""),"","","","","","",""])}const DW=get(`${w}-${d}-dayw`);if(DW.akcal||DW.tkcal||DW.steps)rows.push([w,d,dt,"","Apple Watch rings (Move kcal; stand "+(DW.stand||"?")+" h; steps "+(DW.steps||"?")+")","","","","","",DW.exmin||"",DW.akcal||""])});
  dl("workout-log.csv",rows.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(",")).join("\n"),"text/csv")};
 bar()}
function parsePair(s){const m=String(s).match(/#pair=([^~]+)~?(.*)$/);return m?{token:decodeURIComponent(m[1]),gist:decodeURIComponent(m[2]||"")||undefined}:null}
function importPair(){const pr=parsePair(location.hash||"");if(!pr)return;C.token=pr.token;if(pr.gist)C.gist=pr.gist;else delete C.gist;saveC();TAB="Plan";history.replaceState(null,"",location.pathname+location.search);sync().then(render)}
importPair();
function importWatch(){const hsh=location.hash||"";if(!hsh.startsWith("#watch"))return;const q=new URLSearchParams(hsh.slice(6).replace(/^[?&]/,""));const[tw,td]=todayPos();const k=`${tw}-${DAYS[td]}-dayw`,o={};
 const f=(n,key)=>{const v=q.get(n);if(v!=null&&v!==""&&!isNaN(parseFloat(String(v).replace(",","."))))o[key]=String(Math.round(parseFloat(String(v).replace(",","."))))};f("move","akcal");f("ex","exmin");f("stand","stand");f("steps","steps");
 if(Object.keys(o).length){put(k,o);W=tw;DI=td;TAB="Today"}history.replaceState(null,"",location.pathname+location.search);}
addEventListener("hashchange",()=>{importPair();importWatch();render()});importWatch();
render();sync();
