import json, datetime as dt
START = dt.date(2026,11,19)
FOCUS = {1:"Find your working weights; stop sets with about 3 reps spare",2:"Complete all sets and add reps",3:"Keep adding reps; go heavier where the app says so",
4:"Add weight where earned; less pull-up assistance if ready",5:"First unassisted pull-up attempt",6:"Christmas easy week: 2 sets, shorter sessions",
7:"Back to full sets; pick up where you left off",8:"Highest volume week",9:"Strength focus; unassisted pull-up test",
10:"Easy week: 2 sets, recover before the final push",11:"Controlled personal bests; one or two pull-up attempts",12:"Final week: test 1 to 2 pull-ups, take your final measurements"}
TESTS = {5,9,11,12}
weeks=[]
for n in range(1,13):
    s=START+dt.timedelta(weeks=n-1); e=s+dt.timedelta(days=6)
    typ = "Deload" if n in (6,10) else ("Calibration" if n==1 else "Normal")
    rir = "3 to 4" if n in (6,10) else ("3" if n==1 else "2")
    weeks.append(dict(n=n,start=s.isoformat(),end=e.isoformat(),label=f"{s.day} {s.strftime('%b')} to {e.day} {e.strftime('%b')}",
        ab="A" if n%2 else "B",type=typ,rir=rir,test=n in TESTS,focus=FOCUS[n]))
LOC=["Third Space","Office gym","PureGym","Home"]
def ex(name,sets,reps,start,note="",alt=None):
    return dict(name=name,sets=sets,reps=reps,start=start,note=note,alt=alt or {})
def A(name,reps=None,start=None): return dict(name=name,reps=reps,start=start)
PULL_OG=A("Divergent or cable pulldown","10 to 12 (work up to 15)","23 kg")
PULL_HM=A("Band-assisted pull-up","3 to 6","Green or purple band")
PRESS_HM=A("Push-up or dumbbell floor press","8 to 20","Bodyweight or 7 kg")
ABS=ex("Ab crunch",3,"10 to 15","See location","Abs should curl, not swing. Do 2 or 3 sets",
       {"Third Space":A("Weighted toe-touch crunch",None,"4 to 7 kg"),"Office gym":A("Weighted decline crunch (toe-touch crunch if no bench)",None,"7 kg"),
        "PureGym":A("Ab machine",None,"27 kg"),"Home":A("Toe-touch crunch","12 to 20","Bodyweight or 4 kg")})
COPEN=ex("Copenhagen plank",2,"15 to 30 s per side","Knee-supported first","Inner thighs")
SL_RDL=A("Single-leg Romanian deadlift","10 to 15 per leg","7 kg")
SESS={
 "Mon":dict(title="Dog hill walk and recovery",kind="rest",items=["40-minute dog hill walk (ideally before breakfast)","Optional easy cardio","Food: about 1,500 kcal"]),
 "Tue":dict(title="Upper body and pull-ups",kind="gym",both=[
   ex("Assisted pull-up",3,"5 to 8","Assist for 5 clean reps","Do first. Lower over 2 to 3 seconds. Compulsory",{"Office gym":PULL_OG,"Home":PULL_HM}),
   ex("Incline dumbbell press",3,"6 to 10","8 kg each hand","Alternate with the row",{"Home":PRESS_HM}),
   ex("Row (chest-supported, cable or one-arm)",3,"8 to 12","8 kg dumbbells","Alternate with the press",{"Home":A("One-arm dumbbell row",None,"7 kg")}),
   ex("Dumbbell shoulder press",2,"8 to 12","6 kg each hand","Finish with this",{"Home":A("Dumbbell shoulder press",None,"4 or 7 kg")})],
   tip="Short on time: drop the last row set first. Never drop pull-ups."),
 "Wed":dict(title="Lower body, inner thighs and abs",kind="gym",A=[
   ex("Deadlift",3,"4 to 6","50 to 60 kg after warm-up","Stop with reps in reserve; not your 90 kg best",{"Office gym":A("Smith machine deadlift",None,"Find a weight with 3 reps in reserve"),"Home":SL_RDL}),
   ex("Bulgarian split squat",3,"8 to 12 per leg","2 × 7 kg or 1 × 9 kg","Add 3-second lowering when it gets easy at home"),
   COPEN,ABS],B=[
   ex("Smith or barbell squat",3,"5 to 8","Bar plus about 20 kg","Find depth and control first",{"Office gym":A("Smith squat"),"Home":A("Bulgarian split squat, 3-second lowering","8 to 12 per leg","2 × 7 kg")}),
   ex("Romanian deadlift",3,"8 to 10","40 kg bar or 2 × 12 kg dumbbells","Hips back, weight close to legs",{"Office gym":A("Smith or dumbbell Romanian deadlift"),"Home":SL_RDL}),
   COPEN,ABS]),
 "Thu":dict(title="Moderate full body and pull-ups",kind="gym",A=[
   ex("Leg press",3,"8 to 12","93 kg","Straight sets, no 12 + 5 burst",{"Office gym":A("Smith squat",None,"Bar plus about 20 kg"),"Home":A("Bulgarian split squat","8 to 12 per leg","2 × 7 kg")})],B=[
   ex("Hip thrust",3,"8 to 12","40 kg","",{"Office gym":A("Smith hip thrust"),"Home":A("Single-leg hip thrust","10 to 15 per leg","Bodyweight")})],both=[
   ex("Flat dumbbell press or push-up",3,"8 to 12","8 kg each hand","",{"Home":PRESS_HM}),
   ex("Assisted pull-up",3,"6 to 10","Same or slightly more assist than Tuesday","Clean practice, not exhaustion",{"Office gym":PULL_OG,"Home":PULL_HM}),
   ex("Standing dumbbell side crunch",2,"12 to 15 per side","8 kg","Bend sideways, not forwards")],
   finA=ex("Optional: hip abductor machine",2,"12 to 15","66 kg","Only if time is left over",{"Office gym":A("Optional: side-lying abduction with loop band","15 to 20 per side","Red band, then black"),"Home":A("Optional: side-lying abduction with loop band","15 to 20 per side","Red band, then black")}),
   finB=ex("Optional: hip adductor machine",2,"12 to 15","Leave 2 reps in reserve","Only if time is left over",{"Office gym":A("Optional: Copenhagen plank, extra sets","15 to 30 s per side","Bodyweight"),"Home":A("Optional: Copenhagen plank, extra sets","15 to 30 s per side","Bodyweight")})),
 "Fri":dict(title="Dog hill walk, recovery or catch-up",kind="rest",items=["40-minute dog hill walk","If you missed a gym day this week, do it today","Food: about 1,500 kcal"]),
 "Sat":dict(title="Optional home session, run or class",kind="home",both=[
   ex("Bulgarian split squat",3,"8 to 15 per leg","2 × 7 kg",""),
   ex("Single-leg Romanian deadlift",3,"10 to 15 per leg","7 kg",""),
   ex("Push-up or dumbbell floor press",3,"8 to 20","Bodyweight or 7 kg",""),
   ex("Band-assisted pull-up",3,"3 to 8","Green or purple band to start","Add up to 2 slow negatives if you missed a gym pull-up day")],
   tip="20-minute version: 3 rounds of 8 split squats per leg, 10 single-leg RDLs per leg, 8 to 15 push-ups and 3 to 6 band pull-ups. Or swap the whole day for a run, Pilates, a class or rest. Food: 1,700 kcal if you train, 1,500 if you rest."),
 "Sun":dict(title="Rest",kind="rest",items=["Rest or an easy walk","Food: about 1,500 kcal"]),
}
def resolve(e,loc):
    a=e["alt"].get(loc)
    if not a: return e["name"],e["reps"],e["start"],False
    return a["name"],a["reps"] or e["reps"],a["start"] or e["start"],a["name"]!=e["name"]
FOOD={"Mon":1500,"Tue":1700,"Wed":1700,"Thu":1700,"Fri":1500,"Sat":"1,700 if training, 1,500 if resting","Sun":1500}
RULES=["Counting: for anything marked per side, per leg or per arm, 1 set = the reps on one side and then the same reps on the other. Type the number for one side. For example, side bends 15 per side = 15 on the left, then 15 on the right, logged as 15.","Missed a day, or can't train? Tap \"Make it a rest day\", or just don't log anything. Any exercise or set you didn't do is added to your next day, on top of that day's session, even if you did the rest of the workout.",
"Miss two or more days in a row and they all roll into the next day you train, so nothing is lost.",
"Where the same exercise is on both days, the sets are added together (for example 4 + 4 = 8 sets of Bulgarian split squats). If that's too many, do fewer sets with a heavier weight or more reps, as long as the total work is about the same.",
"Each missed day can be skipped on the catch-up day if it's genuinely too much, for example after travel or illness.",
"A hard run, Pilates or class logged as \"instead\" counts as training that day."]
PROGRESS=["Start each exercise at a weight that leaves the stated reps in reserve.","Add reps each session until every set hits the top of the range.",
"Then add weight (or reduce pull-up assistance) and drop back to the bottom of the range.","Change only one thing at a time: weight, reps or assistance.",
"Pull-up bands, easiest to hardest: green, purple, black, red, yellow, none. Move down a band after 3 × 8.",
"Unassisted pull-up test (test weeks only): one attempt after warming up, before assisted sets."]
DAYS=["Thu","Fri","Sat","Sun","Mon","Tue","Wed"]
DAYNAME=dict(Mon="Monday",Tue="Tuesday",Wed="Wednesday",Thu="Thursday",Fri="Friday",Sat="Saturday",Sun="Sunday")
def session_for(day,ab):
    s=SESS[day]; out=[]
    if day=="Tue": out=s["both"]
    elif day=="Wed": out=s[ab]
    elif day=="Thu": out=s[ab]+s["both"]+[s["fin"+ab]]
    elif day=="Sat": out=s["both"]
    return out
DATA=dict(weeks=weeks,sess=SESS,food=FOOD,rules=RULES,progress=PROGRESS,days=DAYS,daynames=DAYNAME,locs=LOC,protein="115 to 125 g")
if __name__=="__main__":
    json.dump(DATA,open("data.json","w"),ensure_ascii=False,indent=1); print("ok")
