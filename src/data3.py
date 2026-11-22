import json,sys
sys.path.insert(0,'/home/claude/plan')
from data import weeks,RULES,PROGRESS,DAYS,DAYNAME
LOCS=["Third Space","Office gym","PureGym","Gym Group","Home"]
GYMS=["Third Space","PureGym","Gym Group"]; ALLG=GYMS+["Office gym"]; ALL=LOCS
def V(where,name,equip,img,start,cue,reps=None,kg=True,unit=None,assist=False):
    d=dict(where=where,name=name,equip=equip,img=img,start=start,cue=cue,reps=reps,kg=kg,unit=unit)
    if assist: d["assist"]=True
    return d
def X(id,sets,reps,variants,unit="reps",only=None):
    d=dict(id=id,sets=sets,reps=reps,v=variants,unit=unit)
    if only: d["only"]=only
    return d
WALK=dict(id="walk",kind="walk")
CHIN="Kneel on the pad, hands on the handles. Pull your chest up towards the bar, lower over 2 to 3 seconds. Log the assist weight in kg (less assist = stronger). "
PULL=lambda id,reps:X(id,3,reps,[
  V(["Gym Group"],"Assisted pull-up machine (Matrix)","machine","Matrix_Assisted_Pull-Up","Assist about 30 kg","Kneel on the pad, hands on the top handles. Pull your chest up towards the handles, lower over 2 to 3 seconds. Log the ASSIST weight: less assist = stronger. Pick an assist where the last rep is hard but clean.",assist=True),
  V(["Third Space","PureGym"],"Band-assisted pull-up","pull-up bar + band","Band_Assisted_Pull-Up","Green or purple band (bring yours)","Loop your pull-up band over the bar and step into it from a box. Pull your chest towards the bar, lower over 2 to 3 seconds. Lighter band = stronger. No band with you? Do the lat pulldown instead: 3 × 10 to 15 at 22.5 kg.",kg=False),
  V(["Office gym"],"Lat pulldown","cable","Wide-Grip_Lat_Pulldown","22.5 kg on the stack","Sit tall, pull the bar to your upper chest, squeeze your shoulder blades down, return slowly.",reps="10 to 15"),
  V(["Home"],"Band-assisted pull-up","pull-up bar + band","Band_Assisted_Pull-Up","Green or purple band","Step into the band from a stable step. Chest to the bar, lower slowly.",kg=False)])
TOE=lambda w:V(w,"Weighted toe-touch crunch","mat + dumbbell","Toe_Touchers","4 to 7 kg dumbbell","Legs straight up, hold the dumbbell in both hands and reach it towards your toes by curling your ribs towards your hips.")
ABX=X("abx",3,"10 to 15",[
  V(["PureGym"],"Abdominal crunch machine (Matrix)","machine","Ab_Crunch_Machine","32 kg (you've done 27 to 32 kg)","Pin-loaded seated crunch. Pads on your upper chest, feet under the bar, crunch your ribs towards your knees, return slowly."),
  V(["Gym Group"],"Ab crunch machine","machine","Ab_Crunch_Machine","41 kg (your working weight)","Seated crunch. Pads on your upper chest, crunch your ribs towards your knees, return slowly. Weights differ from PureGym's machine, so log them separately.",reps="12 to 15"),
  TOE(["Third Space"]),
  V(["Office gym"],"Weighted decline crunch","bench + dumbbell","Decline_Crunch","7 to 9 kg dumbbell","Dumbbell on your chest, curl your ribs towards your pelvis. No decline bench? Do the weighted toe-touch crunch instead."),
  V(["Home"],"Toe-touch crunch","mat","Toe_Touchers","Bodyweight or 4 kg","Legs straight up, reach towards your toes.",reps="15 to 20")])
COP=X("cop",2,"12 to 15",[
  V(GYMS,"Hip adductor machine","machine","Thigh_Adductor","About 40 kg","Squeeze your knees together, pause, return slowly. Inner thighs."),
  V(["Office gym"],"Cable hip adduction","cable","Cable_Hip_Adduction","5 kg on the stack","Ankle strap on the leg nearest the machine. Sweep it across in front of your other leg, slowly back.",reps="12 to 15 per leg"),
  V(["Home"],"Plié dumbbell squat","dumbbells","Plie_Dumbbell_Squat","7 kg dumbbell","Wide stance, toes turned out, hold one dumbbell between your legs. Sit straight down, squeeze your inner thighs to stand.")])
BSS=X("bss",3,"8 to 12 per leg",[
  V(ALLG,"Bulgarian split squat","dumbbells + bench","Split_Squat_with_Dumbbells","7 kg in each hand","Back foot up on a bench behind you. Drop the back knee straight down, push through the front heel."),
  V(["Home"],"Bulgarian split squat","dumbbells + sofa","Split_Squat_with_Dumbbells","7 kg in each hand","Back foot on the sofa. When it gets easy, take 3 seconds to lower.")])
SLRDL=V(["Home"],"Single-leg Romanian deadlift","dumbbells","Kettlebell_One-Legged_Deadlift","7 kg","Stand on one leg, hinge forwards as the back leg lifts, flat back, stand tall.",reps="10 to 15 per leg")
GGAB=lambda id:X(id,3,"12 to 15",[V(["Gym Group"],"Ab crunch machine","machine","Ab_Crunch_Machine","41 kg (your working weight)","Seated crunch. Pads on your upper chest, crunch your ribs towards your knees, return slowly. Weights differ from PureGym's machine, so log them separately.")],only=["Gym Group"])
RT=lambda w,start="4 to 7 kg dumbbell":V(w,"Russian twist","mat + dumbbell","Plate_Twist",start,"Lean back slightly with a straight back, lift your feet off the floor and keep them up for the whole set. Turn your ribs and the dumbbell to one side, then the other, not just your arms. Too hard? Rest your heels on the floor for the last few reps.",reps="10 to 15 per side")
RC=lambda w:V(w,"Reverse crunch","mat","Reverse_Crunch","Bodyweight","Knees bent, lower back pressed down. Curl your hips off the floor towards your ribs, lower slowly.",reps="12 to 20",kg=False)
GGM=V(["Gym Group"],"Ab crunch machine","machine","Ab_Crunch_Machine","41 kg (your working weight)","Seated crunch. Pads on your upper chest, crunch your ribs towards your knees, return slowly. Weights differ from PureGym's machine, so log them separately.")
TUEAB=X("ggab",3,"12 to 15",[GGM,
  V(["PureGym"],"Abdominal crunch machine (Matrix)","machine","Ab_Crunch_Machine","32 kg (you've done 27 to 32 kg)","Pin-loaded seated crunch. Crunch your ribs towards your knees, return slowly."),
  TOE(["Third Space","Office gym"]),RC(["Home"])])
THUAB=X("ggab2",3,"12 to 15",[GGM,RT(["Third Space","PureGym","Office gym"]),RT(["Home"],"4 kg dumbbell")])
SATAB=X("hrt",3,"10 to 15 per side",[RT(ALL,"4 to 7 kg dumbbell")])
SUNAB=X("bike",2,"15 per side",[V(ALL,"Bicycle crunch","mat","Air_Bike","Bodyweight","Hands lightly behind your head. Bring one elbow towards the opposite knee as the other leg straightens. Slow and controlled.",kg=False)])
S={}
S["Mon"]=dict(title="Arms, thighs and abs (light)",kcal=1500,list=[WALK,
 X("add",3,"12 to 15",[V(GYMS,"Hip adductor machine","machine","Thigh_Adductor","About 40 kg","Squeeze your knees together, pause, return slowly. Inner thighs."),
   V(["Office gym"],"Cable hip adduction","cable","Cable_Hip_Adduction","5 kg on the stack","Ankle strap on the leg nearest the machine. Sweep it across in front of your other leg, slowly back.",reps="12 to 15 per leg"),
   V(["Home"],"Plié dumbbell squat","dumbbells","Plie_Dumbbell_Squat","7 kg dumbbell","Wide stance, toes turned out, hold one dumbbell between your legs. Sit straight down, squeeze your inner thighs to stand.")]),
 X("abd",3,"12 to 15",[V(GYMS,"Hip abductor machine","machine","Thigh_Abductor","70 kg (you've done 66 to 77 kg)","Push your knees outwards, pause, return slowly. Outer glutes."),
   V(["Office gym","Home"],"Banded side leg raise","loop band","Side_Leg_Raises","Red loop band above knees","Stand tall holding something for balance. Lift the leg out to the side slowly, no leaning. Keep the band in your work bag.",reps="15 to 20 per side",kg=False)]),
 X("curl",3,"10 to 12",[V(ALLG,"Dumbbell biceps curl","dumbbells","Dumbbell_Bicep_Curl","5 kg each hand","Elbows tucked in. Curl up, lower over 2 seconds."),V(["Home"],"Dumbbell biceps curl","dumbbells","Dumbbell_Bicep_Curl","4 kg each hand","Elbows tucked in. Curl up, lower over 2 seconds.")]),
 X("tri",3,"10 to 12",[V(ALL,"Overhead triceps extension","dumbbells","Standing_Dumbbell_Triceps_Extension","7 kg (one dumbbell, both hands)","Elbows point up and stay close to your head. Lower behind your head, press up.")]),
 X("abm",3,"12 to 15",[V(["PureGym"],"Abdominal crunch machine (Matrix)","machine","Ab_Crunch_Machine","32 kg (you've done 27 to 32 kg)","Pin-loaded seated crunch. Crunch your ribs towards your knees, return slowly."),
   V(["Gym Group"],"Ab crunch machine","machine","Ab_Crunch_Machine","41 kg (your working weight)","Seated crunch. Crunch your ribs towards your knees, return slowly. Log separately from PureGym's machine."),
   V(["Third Space"],"Hanging knee raise","captain's chair","Hanging_Leg_Raise","Bodyweight","Back against the pad. Lift your knees to your chest, curl your hips up, lower slowly.",reps="10 to 15",kg=False),
   TOE(["Office gym"]),V(["Home"],"Toe-touch crunch","mat","Toe_Touchers","Bodyweight or 4 kg","Legs straight up, reach towards your toes.",reps="15 to 20")])],
 note="Light day: finish feeling like you could do more.")
S["Tue"]=dict(title="Upper body and pull-ups",kcal=1700,list=[PULL("pull","5 to 8"),
 X("incl",3,"6 to 10",[V(ALLG,"Incline dumbbell press","dumbbells + bench","Incline_Dumbbell_Press","8 kg each hand (you did 8 to 10 reps)","Bench at about 30 degrees. Lower to your upper chest, press up."),
   V(["Home"],"Dumbbell floor press","dumbbells","Dumbbell_Floor_Press","7 kg each hand","Lie on the floor, elbows touch the floor at the bottom, press up.",reps="8 to 15")]),
 X("row",3,"8 to 12",[V(ALLG,"Seated cable row","cable","Seated_Cable_Rows","20.5 kg (you did 3 × 12 at 18 kg)","Chest up, pull the handle to your lower ribs, squeeze your shoulder blades, return slowly."),
   V(["Home"],"One-arm dumbbell row","dumbbells + chair","One-Arm_Dumbbell_Row","7 kg","Hand and knee on a chair or sofa, back flat, pull the dumbbell to your hip.")]),
 X("ohp",2,"8 to 12",[V(ALL,"Dumbbell shoulder press","dumbbells + bench","Dumbbell_Shoulder_Press","6 kg each hand (you did 8 to 12 reps)","Seated, back supported. Press overhead without arching your back.")]),TUEAB,WALK],
 note="Pull-ups first while you're fresh. Short on time? Drop the last row set, never the pull-ups.")
S["Wed"]=dict(title="Lower body, inner thighs and abs",kcal=1700,
 A=[X("dl",3,"4 to 6",[V(GYMS,"Barbell deadlift","barbell","Barbell_Deadlift","50 to 60 kg (bar included)","Bar over mid-foot, flat back, push the floor away and stand tall. Bar close to your legs."),
     V(["Office gym"],"Smith machine deadlift","Smith machine","Barbell_Deadlift","Find a weight with 3 reps spare","Same movement as the photo, using the Smith bar. Flat back, push the floor away."),SLRDL]),BSS,COP,ABX,WALK],
 B=[X("sq",3,"5 to 8",[V(GYMS+["Office gym"],"Smith machine squat","Smith machine","Smith_Machine_Squat","Bar plus about 20 kg","Feet slightly in front of the bar. Sit down until thighs are about parallel, drive up."),
     V(["Home"],"Bulgarian split squat, slow","dumbbells + sofa","Split_Squat_with_Dumbbells","7 kg in each hand","Take 3 seconds to lower, then push up.",reps="8 to 12 per leg")]),
    X("rdl",3,"8 to 10",[V(GYMS,"Barbell Romanian deadlift","barbell","Romanian_Deadlift","40 kg (bar included)","Soft knees, hips back, bar close to your legs until a strong hamstring stretch, stand."),
     V(["Office gym"],"Dumbbell Romanian deadlift","dumbbells","Stiff-Legged_Dumbbell_Deadlift","12 kg each hand","Soft knees, hips back, dumbbells close to your legs, flat back."),SLRDL]),COP,ABX,WALK])
TAIL=[X("flat",3,"8 to 12",[V(ALLG,"Flat dumbbell bench press","dumbbells + bench","Dumbbell_Bench_Press","8 kg each hand","Shoulder blades back, lower to chest level, press up."),
   V(["Home"],"Incline push-up","worktop, sofa or pull-up bar","Incline_Push-Up","Level 1: hands on the kitchen worktop","Body in one straight line from head to heels, lower your chest to the edge, push back up.",reps="8 to 15",kg=False)]),
 PULL("pull2","6 to 10"),
 X("side",2,"12 to 15 per side",[V(ALL,"Standing dumbbell side bend","dumbbells","Dumbbell_Side_Bend","8 kg","Bend sideways towards the dumbbell, crunch back up with the other side of your waist. No twisting.")]),THUAB,WALK]
S["Thu"]=dict(title="Full body and pull-ups (moderate)",kcal=1700,
 A=[X("lp",3,"8 to 12",[V(GYMS,"Leg press","machine","Leg_Press","100 kg (you've done 93 to 117 kg)","Lower until knees are about 90 degrees, press without locking your knees. Straight sets."),
     V(["Office gym"],"Smith machine squat","Smith machine","Smith_Machine_Squat","Bar plus about 20 kg","Sit down until thighs are about parallel, drive up."),
     V(["Home"],"Bulgarian split squat","dumbbells + sofa","Split_Squat_with_Dumbbells","7 kg in each hand","Back foot on the sofa, drop the back knee down.",reps="8 to 12 per leg")])]+TAIL,
 B=[X("ht",3,"8 to 12",[V(GYMS,"Barbell hip thrust","barbell + bench","Barbell_Hip_Thrust","40 kg","Upper back on a bench, bar on your hips (use a pad). Drive up until flat, squeeze your glutes."),
     V(["Office gym"],"Smith machine hip thrust","Smith machine + bench","Barbell_Hip_Thrust","40 kg","Same movement as the photo, using the Smith bar over your hips."),
     V(["Home"],"Single-leg hip thrust","sofa","Single_Leg_Glute_Bridge","Bodyweight","Shoulders on the sofa, one foot down, drive up through the heel.",reps="10 to 15 per leg",kg=False)])]+TAIL,
 note="Moderate day: keep 2 to 3 reps spare on everything.")
H=["Home"]
S["Fri"]=dict(title="Pilates and bands (low effort)",kcal=1500,home=True,list=[WALK,
 X("gb",3,"15",[V(ALL,"Banded glute bridge","mat + loop band","Butt_Lift_Bridge","Red loop band above knees","Push your knees out against the band, lift your hips, squeeze, lower slowly.",kg=False)]),
 X("db",3,"8 per side",[V(ALL,"Dead bug","mat","Dead_Bug","Bodyweight","Lower back pressed down. Lower opposite arm and leg slowly, return.",kg=False)]),
 X("sp",2,"20 to 30 s per side",[V(ALL,"Side plank","mat","Side_Bridge","Knees down if needed","Elbow under shoulder, hips lifted in a straight line.",kg=False)],unit="secs"),
 X("pa",2,"15",[V(ALL,"Band pull-apart","pull-up band","Band_Pull_Apart","Red or yellow band","Arms straight at chest height, pull the band apart, squeeze your shoulder blades.",kg=False)]),
 X("sup",2,"10 (3-second hold)",[V(ALL,"Superman hold","mat","Superman","Bodyweight","Lift arms and legs a little off the floor, hold 3 seconds, lower.",kg=False)])],
 note="If you missed a gym day this week, do that session today instead.")
S["Sat"]=dict(title="Home strength",kcal=1700,home=True,list=[WALK,
 X("hbss",3,"8 to 15 per leg",[V(ALL,"Bulgarian split squat","dumbbells + sofa","Split_Squat_with_Dumbbells","7 kg in each hand","Back foot on the sofa. Lower over 3 seconds, push up through the front heel.")]),
 X("hsl",3,"10 to 15 per leg",[V(ALL,"Single-leg Romanian deadlift","dumbbells","Kettlebell_One-Legged_Deadlift","7 kg","Stand on one leg, hinge forwards as the back leg lifts, flat back.")]),
 X("hpl",3,"3 to 8",[V(ALL,"Band-assisted pull-up","bar + band","Band_Assisted_Pull-Up","Green or purple band","Step into the band from a step. Chest to the bar, lower slowly.",kg=False)]),
 X("hpu",3,"8 to 15",[V(["Third Space","PureGym","Gym Group","Office gym"],"Incline push-up","bench or Smith bar","Incline_Push-Up","Hands on a bench, or a Smith bar set at hip height","Body in one straight line from head to heels, lower your chest to the bench or bar, push back up.",kg=False),V(["Home"],"Incline push-up","worktop, sofa or pull-up bar","Incline_Push-Up","Level 1: hands on the kitchen worktop","Body in one straight line from head to heels, lower your chest to the edge, push back up.",kg=False)]),SATAB],
 note="Or swap the whole day for a run, class or Apple Fitness+ using the card above.")
S["Sun"]=dict(title="Gentle mobility",kcal=1500,home=True,list=[WALK,
 X("cat",2,"10",[V(ALL,"Cat-cow","mat","Cat_Stretch","Bodyweight","On all fours, round your back up, then let it dip slowly. Breathe.",kg=False)]),
 X("wgs",2,"5 per side",[V(ALL,"World's greatest stretch","mat","Worlds_Greatest_Stretch","Bodyweight","Big lunge, hand down, rotate the other arm up to the ceiling.",kg=False)]),
 X("hf",2,"30 s per side",[V(ALL,"Kneeling hip flexor stretch","mat","Kneeling_Hip_Flexor","Bodyweight","Back knee down, squeeze that glute, shift forwards gently.",kg=False)],unit="secs"),
 X("tt",2,"15",[V(ALL,"Toe-touch crunch","mat","Toe_Touchers","Bodyweight","Legs straight up, reach towards your toes.",kg=False)]),
 SUNAB,
 X("cp",1,"60 s",[V(ALL,"Child's pose","mat","Childs_Pose","Bodyweight","Knees wide, sit back on your heels, arms long, breathe slowly.",kg=False)],unit="secs")])
# Home uses lighter dumbbells (7 kg, 4 kg, 5 lb), so more reps and often an extra set
HOME={"add":(4,"15 to 20"),"abd":(3,"20 to 25 per side"),"curl":(4,"12 to 20"),"abm":(3,"15 to 25"),
 "incl":(4,"12 to 20"),"row":(4,"12 to 20 per arm"),"ohp":(3,"12 to 15"),"ggab":(3,"15 to 25"),
 "dl":(4,"12 to 15 per leg"),"bss":(3,"10 to 15 per leg"),"cop":(3,"15 to 20"),"abx":(3,"15 to 25"),
 "sq":(4,"10 to 15 per leg"),"rdl":(4,"12 to 15 per leg"),
 "lp":(4,"10 to 15 per leg"),"flat":(4,"8 to 15"),"side":(3,"15 to 20 per side"),"ggab2":(3,"15 to 20 per side"),"ht":(4,"12 to 20 per leg"),
 "hbss":(4,"10 to 15 per leg"),"hsl":(4,"12 to 15 per leg"),"hrt":(3,"15 to 20 per side")}
HOMESTART={"side":"7 kg","ohp":"4 to 7 kg each hand"}
import copy
def homeadj(x):
    if x.get("kind")=="walk" or x["id"] not in HOME:return
    sets,reps=HOME[x["id"]]
    for i,v in enumerate(x["v"]):
        if "Home" in v["where"]:
            if v["where"]==["Home"]:h=v
            else:
                h=copy.deepcopy(v);h["where"]=["Home"];v["where"]=[w for w in v["where"] if w!="Home"];x["v"].append(h)
            h["sets"]=sets;h["reps"]=reps
            if x["id"] in HOMESTART:h["start"]=HOMESTART[x["id"]]
            if "Home weights are lighter" not in h["cue"]:h["cue"]=h["cue"].rstrip()+" Home weights are lighter, so take each set close to the point where you can't do another clean rep."
            break
for d,s in S.items():
    for k in ("A","B","list"):
        for x in s.get(k,[]):homeadj(x)

# ---------- exact setup for every exercise ----------
# load = what the kg column means; how = setup shown before the cue; start = clearer starting weight
PAIR="kg per dumbbell"; ONE="kg (one dumbbell)"; STACK="kg on the stack"; BAR="kg total incl. bar"; PLATES="kg of plates (not the bar)"
SPEC={
 "Leg press":dict(load="kg on the machine",how="Sit with your back flat on the pad, feet hip-width in the middle of the platform. Release the safety handles before you start and lock them again after. If it's plate-loaded, log the total plates; if it has a pin stack, log the number on the stack."),
 "Smith machine squat":dict(load=PLATES,start="Empty bar plus a 10 kg plate on each side (log 20)",how="Bar across your upper back (not your neck), feet slightly in front of the bar. Twist the bar to unhook it and twist back to rack it. Log only the plates you add, because Smith bars vary."),
 "Bulgarian split squat":dict(load=PAIR,start="Two 7 kg dumbbells, one in each hand",how="Hold one dumbbell in each hand, arms hanging straight by your sides. Back foot laces-down on the bench or sofa, front foot about a big stride ahead. Do all reps on one leg, then switch: that's 1 set. Too heavy? Hold just one dumbbell at your chest with both hands."),
 "Bulgarian split squat, slow":dict(load=PAIR,start="Two 7 kg dumbbells, one in each hand",how="Hold one dumbbell in each hand, arms by your sides. Back foot laces-down on the sofa. All reps on one leg, then switch: that's 1 set."),
 "Flat dumbbell bench press":dict(load=PAIR,start="Two 8 kg dumbbells, one in each hand",how="Lie flat on the bench, feet on the floor, one dumbbell in each hand above your chest, palms facing your feet. Both arms press at the same time."),
 "Incline dumbbell press":dict(load=PAIR,start="Two 8 kg dumbbells, one in each hand",how="Set the bench back to about 30 degrees (the second or third notch). One dumbbell in each hand, both press together."),
 "Dumbbell floor press":dict(load=PAIR,start="Two 7 kg dumbbells, one in each hand",how="Lie on your back on the floor, knees bent, one dumbbell in each hand. Both press together."),
 "Incline push-up":dict(how="The higher your hands, the easier it is. Pick the level where you can lower your chest all the way to the edge: 1) kitchen worktop, 2) sofa seat or a gym bench, 3) your pull-up bar on the floor, going as low as you can (halfway is fine to start, a bit lower each week), 4) a full push-up. Move to the next level when you can do 3 sets of 15. No kneeling, so it's easy on your knees and skin. Write your level in the notes if you like."),
 "Assisted pull-up machine (Matrix)":dict(load="kg of assist",how="Set the pin to the assist weight (more weight = more help). Step up, kneel on the pad with both knees, hands on the top handles facing forwards."),
 "Band-assisted pull-up":dict(how="Loop one band over the bar and pull it through itself so it's secure. Stand on a box or step, put one foot (or both knees) in the band, hands just wider than your shoulders, palms facing away."),
 "Lat pulldown":dict(load=STACK,start="22.5 kg on the stack",how="Wide bar, hands just wider than your shoulders, palms facing away. Knee pad snug on your thighs."),
 "Standing dumbbell side bend":dict(load=ONE,how="One dumbbell in one hand, the other hand on your hip. Do all reps on one side, then swap the dumbbell to the other hand: that's 1 set."),
 "Ab crunch machine":dict(load=STACK,how="Set the seat so the pads sit on your upper chest, feet hooked under the rollers. Log the number on the stack."),
 "Abdominal crunch machine (Matrix)":dict(load=STACK,how="Set the seat so the pads sit on your upper chest, feet under the rollers. Log the number on the stack."),
 "Russian twist":dict(load=ONE,start="One 4 kg dumbbell (move to 7 kg when it's easy)",how="Sit on a mat, knees bent. Hold one dumbbell horizontally in front of your stomach with both hands, like holding a rowing handle (palms down, one hand on each side). Lift your feet off the floor. Count each turn to one side: 15 per side means 15 to the left and 15 to the right (30 turns in total), and you log 15. The photo shows a weight plate; you use one dumbbell."),
 "Barbell hip thrust":dict(load=BAR,start="40 kg: 20 kg bar plus a 10 kg plate on each side",how="Sit on the floor with your upper back against the side of a bench, bar across your hip bones with a bar pad. Feet flat, hip-width apart."),
 "Smith machine hip thrust":dict(load=PLATES,start="A 10 kg plate on each side (log 20)",how="Upper back against a bench placed under the Smith bar, bar across your hip bones with a pad. Log only the plates you add."),
 "Single-leg hip thrust":dict(how="Upper back against the sofa, one foot flat on the floor, the other leg bent and lifted. All reps on one leg, then switch: that's 1 set."),
 "Banded glute bridge":dict(how="Lie on your back, knees bent, feet flat, loop band just above your knees."),
 "Dead bug":dict(how="Lie on your back, arms pointing at the ceiling, knees bent at 90 degrees above your hips. 8 per side means 8 with the left arm and right leg, and 8 with the right arm and left leg (16 in total)."),
 "Side plank":dict(how="Hold on one side for the time, then the other side: that's 1 set."),
 "Band pull-apart":dict(how="Hold a light band with both hands, shoulder-width apart, arms straight out in front."),
 "Single-leg Romanian deadlift":dict(load=ONE,start="One 7 kg dumbbell",how="Hold one dumbbell in the hand opposite your standing leg (standing on the left leg, dumbbell in the right hand). All reps on one leg, then switch: that's 1 set. Hold a wall with your free hand if you wobble."),
 "Bicycle crunch":dict(how="15 per side means 15 left-elbow touches and 15 right-elbow touches (30 in total)."),
 "Hip adductor machine":dict(load=STACK,start="About 40 kg on the stack",how="Sit back, pads on the inside of your knees. Set the start lever so your legs open to a comfortable stretch. Log the number on the stack."),
 "Hip abductor machine":dict(load=STACK,how="Sit back, pads on the outside of your knees, legs together to start. Log the number on the stack."),
 "Cable hip adduction":dict(load=STACK,how="Pulley at the lowest setting, ankle strap on the leg nearest the machine. All reps on one leg, then turn round and do the other: that's 1 set."),
 "Plié dumbbell squat":dict(load=ONE,start="One 7 kg dumbbell",how="Hold one dumbbell upright by its top end with both hands, hanging between your legs. Feet wider than your shoulders, toes turned out."),
 "Banded side leg raise":dict(how="Loop band just above your knees. All reps on one leg, then switch: that's 1 set."),
 "Dumbbell biceps curl":dict(load=PAIR,how="One dumbbell in each hand, palms facing forwards. Curl both arms at the same time."),
 "Overhead triceps extension":dict(load=ONE,start="One 7 kg dumbbell, held with both hands",how="Sit or stand tall. Hold one dumbbell with both hands cupping the top end, arms straight above your head."),
 "Hanging knee raise":dict(how="Captain's chair: forearms on the arm pads, back against the back pad, legs hanging."),
 "Weighted toe-touch crunch":dict(load=ONE,start="One 4 to 7 kg dumbbell",how="Lie on your back, legs straight up. Hold one dumbbell with both hands, arms straight up towards your feet."),
 "Weighted decline crunch":dict(load=ONE,start="One 7 to 9 kg dumbbell",how="Hook your feet under the pads of a decline bench. Hold one dumbbell with both hands flat against your chest."),
 "Toe-touch crunch":dict(load=ONE,start="Bodyweight, or one 4 kg dumbbell held in both hands",how="Lie on your back, legs straight up. Log kg only if you hold the dumbbell."),
 "Reverse crunch":dict(how="Lie on your back, hands by your sides or holding the sofa behind your head."),
 "Seated cable row":dict(load=STACK,how="V-handle (close grip) on the low cable. Feet on the foot plates, knees slightly bent, sit tall. Log the number on the stack."),
 "One-arm dumbbell row":dict(load=ONE,start="One 7 kg dumbbell",how="Left hand and left knee on the sofa, dumbbell in your right hand. All reps with the right arm, then switch sides: that's 1 set."),
 "Dumbbell shoulder press":dict(load=PAIR,start="Two 6 kg dumbbells, one in each hand",how="Bench upright (the highest notch). One dumbbell in each hand at shoulder height, palms facing forwards. Both arms press together."),
 "Barbell deadlift":dict(load=BAR,start="50 kg: 20 kg bar plus a 15 kg plate on each side",how="Bar on the floor. Use the full-size plates (or blocks) so the bar sits at mid-shin. Hands just outside your legs, both palms facing you."),
 "Smith machine deadlift":dict(load=PLATES,start="A 10 kg plate on each side (log 20)",how="Set the safety stops just below knee height and start from them. Log only the plates you add."),
 "Barbell Romanian deadlift":dict(load=BAR,start="40 kg: 20 kg bar plus a 10 kg plate on each side",how="Start standing, holding the bar at your hips (lift it from a rack at hip height). Hands just outside your thighs."),
 "Dumbbell Romanian deadlift":dict(load=PAIR,start="Two 12 kg dumbbells, one in each hand",how="One dumbbell in each hand in front of your thighs, palms facing you."),
}
for d_,s_ in S.items():
    for k_ in ("A","B","list"):
        for x_ in s_.get(k_,[]):
            if x_.get("kind")=="walk":continue
            for v_ in x_["v"]:
                sp_=SPEC.get(v_["name"])
                if not sp_ or v_.get("_spec"):continue
                if "load" in sp_ and v_.get("kg",True)!=False:v_["load"]=sp_["load"]
                if "start" in sp_ and not v_["start"].startswith(("41 kg","70 kg","100 kg","20.5 kg","32 kg")):
                    if not (v_["name"]=="Dumbbell shoulder press" and "Home" in v_["where"]):v_["start"]=sp_["start"]
                if v_["name"]=="Dumbbell shoulder press" and "Home" in v_["where"]:v_["start"]="Two dumbbells, one in each hand: 4 kg, or 7 kg when 15 reps is easy"
                v_["how"]=sp_["how"];v_["_spec"]=1

CLS={"Mon":"Extra if you like: Apple Fitness+ Treadmill 20 min (walk or run), or Apple Fitness+ Time to Walk",
 "Tue":"Only if you can't get to a gym: Apple Fitness+ Strength (upper body), 20 to 30 min",
 "Wed":"Only if you can't get to a gym: Apple Fitness+ Strength (lower body), 20 to 30 min",
 "Thu":"Only if you can't get to a gym: Apple Fitness+ Strength (total body), 20 to 30 min",
 "Fri":"Apple Fitness+ Pilates 20 min or a Third Space Pilates class instead; or add Fitness+ Core 10 min",
 "Sat":"Your usual Apple Fitness+ Treadmill run (20 min, about 3 km, or 30 min, about 4 to 4.5 km), Dance, Kickboxing, Cycling 20 min, Rowing 10 min, or a Third Space class",
 "Sun":"Apple Fitness+ Yoga 10 to 20 min or Mindful Cooldown 10 min; Apple Fitness+ Time to Walk"}
for d in S: S[d]["cls"]=CLS[d]
CLASSES=["Fitness+ Treadmill run","Fitness+ Treadmill walk","Fitness+ Strength","Fitness+ Core","Fitness+ Pilates","Fitness+ Yoga","Fitness+ HIIT","Fitness+ Cycling","Fitness+ Rowing","Fitness+ Dance","Fitness+ Kickboxing","Fitness+ Mindful Cooldown","Fitness+ Meditation","Fitness+ Time to Walk","Fitness+ Time to Run","Third Space Pilates","Third Space reformer Pilates","Third Space yoga","Third Space strength class","Third Space boxing","Third Space dance","Outdoor run","Other"]
EQUIP=["machine","cable","barbell","Smith machine","dumbbells","bench","mat","loop band","pull-up band","bodyweight","other"]
ACTTYPES=[["Cardio",["Treadmill walk","Treadmill run","Outdoor walk","Outdoor run","Exercise bike","Rowing machine","Cross trainer","Stair climber","Swimming","Hike"]],
 ["Apple Fitness+",[c for c in CLASSES if c.startswith("Fitness+")]],["Third Space classes",[c for c in CLASSES if c.startswith("Third Space")]],
 ["Other",["Dance","Sport","Stretching","Other"]]]
DATA=dict(classes=CLASSES,acttypes=ACTTYPES,equip=EQUIP,weeks=weeks,sess=S,rules=RULES,progress=PROGRESS,days=DAYS,daynames=DAYNAME,locs=LOCS)
json.dump(DATA,open("data3.json","w"),ensure_ascii=False)
ids=set()
for s in S.values():
    for k in ("list","A","B"):
        for e in s.get(k,[]):
            for v in e.get("v",[]):
                if v["img"]: ids.add(v["img"])
json.dump(sorted(ids),open("ids.json","w")); print(len(ids))
# sanity: every exercise has a variant for every location
for d,s in S.items():
    for k in ("list","A","B"):
        for e in s.get(k,[]):
            for v in e.get("v",[]):
                if not v["img"]: print("NO PHOTO",d,k,v["name"])
    for k in ("list","A","B"):
        for e in s.get(k,[]):
            if e.get("kind")=="walk":continue
            for L in LOCS:
                if not any(L in v["where"] for v in e["v"]): print("MISSING",d,k,e["id"],L)
