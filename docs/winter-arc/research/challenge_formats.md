# Gamifiable Fitness Challenge Formats for a 61-Day "Winter Arc" (Nov 1 – Dec 31)

Context: one user, 22 years old, intermediate lifter, gym split 5–6 days/week, plus a daily no-equipment bodyweight "drill" done in a hostel room. Day count: Nov (30) + Dec (31) = 61 days.

## 1. 75 Hard / 75 Soft / 75 Medium — exact rules, why popular, criticisms

### Takeaway
75 Hard is 5–6 all-or-nothing daily tasks with a "miss one, restart at Day 1" rule. That rule is what makes it popular and what physicians and dietitians criticise most, together with the gallon of water and the lack of rest days. 75 Soft is a looser variant from a TikTok creator. 75 Medium has no single authoritative ruleset.

### Cited Findings
**75 Hard rules** (I could not reach Frisella's official site. The rules below come from TODAY's coverage, which other secondary sources match):
- Created by Andy Frisella in 2019. He calls it a "mental toughness" program, "an Ironman for your brain", and says it is "not a diet nor fitness plan." — [Secondary guide aggregation via search](https://www.today.com/today/amp/rcna153979)
- The rules, as five daily tasks plus one overarching rule — [TODAY](https://www.today.com/today/amp/rcna153979):
  1. **Restart rule:** break any rule and you start over at Day 1 ("If you skip a day, you must start over").
  2. **Diet:** pick any diet that fits your goal. No alcohol and no cheat meals ("Not a drop. Not a beer. Not a wine.").
  3. **Water:** 1 gallon (~3.8 L) a day, spread across the day.
  4. **Workouts:** two 45-minute workouts a day, one of them outdoors "regardless of the weather."
  5. **Reading:** 10 pages a day of a nonfiction self-development book, physical book only (no e-book).
  6. **Progress photo:** one every day.
- Some sources say "5 tasks + 1 rule" and others say "6 rules". The content is the same and only the count differs. — [TODAY](https://www.today.com/today/amp/rcna153979)
- One report cites Frisella himself as saying about 90% of participants fail to finish. This is a secondary report and I could not verify it. — [abc17news/CNN syndication](https://abc17news.com/cnn-health/2026/03/21/should-you-try-the-75-hard-challenge-experts-warn-the-risks-may-outweigh-the-benefits/)

**75 Soft rules:**
- Created by TikTok user Stephen Gallagher as a more approachable alternative. It has 4 daily tasks for 75 days — [Marathon Handbook](https://marathonhandbook.com/75-soft-challenge/):
  1. Eat a healthy, well-balanced diet. Drink alcohol only on social occasions.
  2. Exercise 45 min a day, with at least 1 rest day (active recovery) per week.
  3. Drink at least 3 L of water a day.
  4. Read 10 pages a day.

**75 Medium:**
- No authoritative source. The pages I found are low-quality printable/template sites and contradict each other. They describe "six rules", for example "pick any diet and follow it 90% of the time", while also listing "no alcohol or cheating", and photos only on Day 1 and Day 75. — [search aggregation of printable sites, low quality](https://marathonhandbook.com/75-soft-challenge/) (treat as unreliable)

**Criticisms (physicians, dietitians, clinicians):**
- **Dr. Shane Davis** (sports medicine, Tufts Medical Center): the program leaves little room for rest and recovery, which raises injury risk. He discourages doing it for longer than 75 days, says no science supports the 75-day length, and says "being strict with something that's not sustainable is less productive." — [TODAY](https://www.today.com/today/amp/rcna153979)
- **Dr. Thomas Hildebrandt** (Mount Sinai Center of Excellence in Eating and Weight Disorders): people with eating disorders may relapse because of the success/failure cycle. The high chance of failure can also kill motivation, and the average person doesn't have the time. — [TODAY](https://www.today.com/today/amp/rcna153979)
- **Dr. Miho Tanaka** (Mass General Brigham Women's Sports Medicine): the rigidity makes it hard to tailor to your body, and injury "might be a sign that this challenge isn't the best fit." — [TODAY](https://www.today.com/today/amp/rcna153979)
- **Dr. Asad Siddiqi** (Weill Cornell / NewYork-Presbyterian): "high likelihood for harm" with strict engagement. He doubts it leads to permanent lifestyle change. — [TODAY](https://www.today.com/today/amp/rcna153979)
- **Kelley Kitley, LCSW:** all-or-nothing thinking means people "let the pendulum swing in the other direction" afterwards. — [TODAY](https://www.today.com/today/amp/rcna153979)
- **Natalie Rizzo, RD:** "going 100% all out with it is just a recipe for failure." — [TODAY](https://www.today.com/today/amp/rcna153979)
- **Water/hyponatremia:** a dietitian (Liv Morrison) called the gallon "downright dangerous" and said ~4 L is too much for most people and can lead to hyponatremia. An NHS GP (Dr Hana Patel) also warned about hyponatremia. Another expert noted that typical fluid recommendations are about 9 cups (women) and 12.5 cups (men), and that combining the gallon with a strict diet and more exercise raises the risk of electrolyte (sodium) imbalance. — [Surrey Live / Geo / CNN coverage via search](https://www.getsurrey.co.uk/news/health/doctor-issues-warning-anyone-trying-31042437); [CNN syndication](https://abc17news.com/cnn-health/2026/03/21/should-you-try-the-75-hard-challenge-experts-warn-the-risks-may-outweigh-the-benefits/)
- **Dr John Burke** (AXA Health CMO): "continual overexertion" may raise the risk of chronic tendonitis, joint pain, hormonal imbalance, anxiety and depression. — [Geo TV](https://www.geo.tv/latest/526228-75-hard-challenge-trainers-and-health-experts-warn-against-tiktok-challenge)
- The creator has no medical qualifications, and the diet rules give no concrete nutrition guidance. — [Geo TV](https://www.geo.tv/latest/526228-75-hard-challenge-trainers-and-health-experts-warn-against-tiktok-challenge)
- Caveat: the hyponatremia warnings come from news and wellness coverage, not studies of 75 Hard participants. They describe a plausible risk, not a measured one. — [CNN syndication](https://abc17news.com/cnn-health/2026/03/21/should-you-try-the-75-hard-challenge-experts-warn-the-risks-may-outweigh-the-benefits/)

### Inferences
- **Why it's popular:** a binary daily checklist, a visible streak, a single "restart" stake, and photo-based before/after proof. These are classic streak and loss-aversion mechanics, and they map directly onto Zenith's existing streak, XP and photo (`dayPhotos`) systems.
- **For Winter Arc, borrow the checklist and drop the hard reset.** A 61-day event where one miss wipes everything will fail most users (see the "~90% fail" claim). Better design: a daily "Arc checklist" with streak freezes (Zenith already has `spendStreakFreeze()`, 1 per ISO week). Score each day 0–100% so a partial day still counts.
- **Two 45-minute workouts with no rest day** is incompatible with a 5–6 day lifting split plus a daily drill. Winter Arc should count the gym session as "workout 1" and make the drill short (10–20 min), not a second 45-minute session.
- **Water target:** use the user's existing `waterGoalMl` setting (Zenith already has this) rather than a fixed gallon. Never reward intake above the goal.
- **Reading 10 pages** maps onto Zenith's Study module (minutes logged) better than a page count.

### Gaps
- Official 75hard.com rule text (the site didn't come up in search). 75 Medium has no authoritative creator or ruleset. No peer-reviewed study of 75 Hard outcomes or injury rates exists in what I found.

## 2. Randomised / game formats: deck of cards, dice, bingo, roulette

### Takeaway
The deck-of-cards workout is well documented: suit = exercise and card value = reps, but the rules for face cards, aces and jokers vary by source. Dice, bingo and roulette have no canonical rules, so Winter Arc can define its own. All of these are just a random generator plus a "done" tap or rep entry.

### Cited Findings
- **Deck of cards:** each suit is assigned an exercise. Example: hearts = sit-ups, diamonds = push-ups, clubs = squats, spades = star jumps. — [Active Truth](https://www.activetruth.com.au/blogs/active-truth-blog/deck-of-cards-simple-at-home-bodyweight-workout). Suits can also stand for categories (cardio/strength). Another example set is squats, glute bridges, push-ups and lunges. — [Fatherly](https://www.fatherly.com/health/deck-of-cards-workout)
- Number cards 2–10 = that many reps. — [NIFS](https://www.nifs.org/blog/plan-a-fun-workout-with-a-deck-of-cards)
- Face cards: either a flat 10 reps, or J/Q/K = 11/12/13. — [Little Day Out](https://www.littledayout.com/deck-of-cards-workout-a-fun-simple-exercise-idea-with-kids/). Some variants use a timed hold or a fixed exercise instead. — [Fatherly](https://www.fatherly.com/health/deck-of-cards-workout)
- Aces: 1 rep, or a high value (10+). — [NIFS](https://www.nifs.org/blog/plan-a-fun-workout-with-a-deck-of-cards). One UK school worksheet counts aces as 11. — [CCS Northants PDF](https://www.ccs.northants.sch.uk/_site/data/files/secondary/85C609557E3771EE06EA9FD3BB73CEC7.pdf)
- Jokers: a wild card or a rest, or a set penalty (e.g. 10 burpees or 20 mountain climbers). — [Active Truth](https://www.activetruth.com.au/blogs/active-truth-blog/deck-of-cards-simple-at-home-bodyweight-workout); [CCS Northants](https://www.ccs.northants.sch.uk/_site/data/files/secondary/85C609557E3771EE06EA9FD3BB73CEC7.pdf)
- Structure: draw, do the reps, draw again, until the deck runs out or a time cap is hit. Two-player competitive versions exist. — [NIFS](https://www.nifs.org/blog/topic/strength-workout); [CCS Northants](https://www.ccs.northants.sch.uk/_site/data/files/secondary/85C609557E3771EE06EA9FD3BB73CEC7.pdf)
- No official ruleset exists, so the setter decides. — [search synthesis of the above](https://www.nifs.org/blog/plan-a-fun-workout-with-a-deck-of-cards)

### Inferences (my arithmetic and design proposals, not sourced)
- **Deck totals per suit**, i.e. per exercise. Number cards 2–10 add up to 54 reps.
  - Faces = 10, ace = 1: 85 reps per suit, 340 for the full deck.
  - Faces = 11/12/13, ace = 1: 91 reps per suit, 364 for the deck.
  - Faces = 10, ace = 11: 95 reps per suit, 380 for the deck.
  - Each suit's exercise therefore gets about 85–95 reps. For an intermediate lifter that is a hard but reasonable session. Too much for a leg day if squats are a suit.
- **Scaling the deck:**
  - Half deck (26 cards) for weeks 1–2, full deck for weeks 3+.
  - Or a "rep multiplier" (×0.5 → ×1.0).
  - Or swap the suit exercises by gym day: on leg days use core/mobility suits instead of squats and lunges.
- **Dice (proposal):** roll 1d6 for the exercise and 2d6 for reps. 2d6 gives 2–12 reps (mean 7). Do 10 rolls, or roll until a time cap. A "doubles = repeat the set" rule adds drama.
- **Bingo (proposal):** a 5×5 card for the week or month. Cells are mini-tasks, for example "50 push-ups in one set block", "2-min plank total", "10k steps", "cold shower", "sleep ≥ 7.5 h", "hit protein". The centre square is free. Any line = bonus XP, blackout = badge. Tracking is tap-to-complete. Cells can auto-complete from existing Zenith data (water, sleep, protein, steps). Good weekly mechanic for a 61-day event, with about 9 weekly cards.
- **Roulette (proposal):** spin a wheel of 8–12 drill templates (EMOM, ladder, deck, Tabata-style, etc.). Make it weighted so the same template never repeats two days running and the wheel respects the leg-day filter.
- **App input:** the user taps "draw/roll/spin", the app shows the exercise and reps, and the user taps "done". The session ends when the deck is empty or the cap is hit, and the total time is auto-recorded.

### Gaps
- No reputable source (ACE/NSCA) on deck/dice/bingo rules. These are folk formats. I found no evidence on whether randomisation improves adherence.

## 3. Timed and progressive formats: EMOM, AMRAP, Tabata, ladders, Death-by, 100-rep, "+1 per day", 30-day plank/squat

### Takeaway
These formats have simple numeric rules that need only a timer plus a rep count, which makes them the best fit for a daily hostel-room drill. Original Tabata (170% of VO2max) can't be reproduced with bodyweight work. Death-by and "+1 a day" formats scale steeply. Long plank holds have diminishing returns according to McGill.

### Cited Findings
- **Cindy (CrossFit benchmark, AMRAP):** 20-minute AMRAP of 5 pull-ups, 10 push-ups, 15 air squats, done in that order. Scaling options: jumping pull-ups, knee push-ups, squats to a target. "Half Cindy" = same reps in 10 minutes. "Hard Cindy" (2022) = weighted pull-ups, feet-on-box push-ups, plate squats. — [Marathon Handbook](https://marathonhandbook.com/cindy-crossfit-workout/); [Morning Chalk Up](https://morningchalkup.com/2023/04/09/crossfit-cindy-workout/); [CoachWeb](https://www.coachweb.com/fitness/bodyweight-workouts/crossfit-cindy-workout)
- **Death by X (EMOM ladder):** pick one movement. Minute 1 = 1 rep, minute 2 = 2 reps, and so on, adding one rep each minute. You continue until you can't finish the prescribed reps inside the minute. **Score** = full rounds completed + reps in the failed round. The workout ends the first minute you miss. Variants: a time cap (e.g. 15 min), a scaled start at 3 reps, or switching to a second movement after failure (e.g. jumping squats ascending by 2). — [BoxRox](https://www.boxrox.com/challenging-death-by-crossfit-workouts-plus-mat-frasers-impossible-wod-rx/); [Tom's Guide](https://www.tomsguide.com/news/i-tried-the-death-by-burpees-challenge-and-it-wasnt-as-bad-as-it-sounds); [IntervalTimer](https://www.intervaltimer.com/wod/2026-05-27); [SF CrossFit](https://sanfranciscocrossfit.com/?p=5168)
- **Tabata (original, Tabata et al., MSSE 1996):**
  - Protocol: 7–8 bouts of 20 s at **170% of VO2max**, with 10 s rest between bouts, after a 10-minute warm-up.
  - Schedule: 4 days/week for 6 weeks. The 5th day was 30 min at 70% VO2max plus 4 intervals.
  - Results: +28% anaerobic capacity and +14% VO2max, versus +9% VO2max and no anaerobic change in the steady-state group.
  - Most people will never work at 170% of VO2max, so bodyweight "Tabata" (20/10 × 8) is not true Tabata.
  - Sources: [ACE (Jonathan Ross)](https://www.acefitness.org/education-and-resources/professional/expert-articles/3791/everything-you-need-to-know-about-tabata-training/); [BodyRecomposition (Lyle McDonald)](https://bodyrecomposition.com/research/the-tabata-protocol)
- **Plank duration (McGill):** Stuart McGill (spine biomechanist) said holding a plank longer than 10 s is pointless, "There's no utility to this kind of activity other than claiming a record". He recommends 10-second holds ×3 and the daily "Big 3": curl-up, side plank, bird dog.
  - Counterpoints: trainer Benji Tiger favours 30–60 s, and Dan John reportedly puts the benchmark at about 2 min with no benefit beyond that.
  - Form degrades on long holds (hips sag, more lumbar strain).
  - Sources: [Business Insider](https://businessinsider.nl/sports-scientist-says-there-is-no-point-in-holding-plank-for-long-time-2018-3); [Men's Health AU](https://menshealth.com.au/dont-hold-plank-for-more-than-ten-seconds/); [HuffPost CA](https://www.huffingtonpost.ca/2018/03/28/how-long-to-hold-a-plank_a_23397921/); [Tom's Guide](https://www.tomsguide.com/uk/how-to/plank-exercise-how-long-do-you-need-to-hold-to-work-your-abs)
- **High-rep safety (rhabdomyolysis):**
  - Exertional rhabdomyolysis has been reported after high-repetition bodyweight work on a single muscle group (calf raises) — [PMC5496832](https://pmc.ncbi.nlm.nih.gov/articles/PMC5496832) — and in a healthy 21-year-old after 143 biceps curl reps (JSCR 2017, DOI 10.1519/JSC.0000000000001824, via the same search).
  - Three women at one gym got ER after unaccustomed intensive workouts — [PMC5926575](https://pmc.ncbi.nlm.nih.gov/articles/PMC5926575).
  - CrossFit has documented cases too — [CrossFit Journal PDF](https://library.crossfit.com/free/pdf/38_05_cf_rhabdo.pdf).
  - A review of 327 ER cases (2008–2017) found mostly young men, often with long-duration or high-rep exercise. — [Rev Med Saúde Brasília 2019](https://portalrevistas.ucb.br/index.php/rmsbr/article/download/10938/6629/50563)
  - Risk factors: unaccustomed volume, eccentric emphasis, long duration, heat, statins. Social-media workouts may be raising incidence. — [UCLA Proceedings](https://proceedings.med.ucla.edu/wp-content/uploads/2023/06/Chung-A230307JC-BLM-formatted.pdf)

### Inferences (exact rules proposed for the app; arithmetic is mine)
- **EMOM:** every minute on the minute do R reps, then rest for the rest of the minute. Inputs: movement, R, minutes N. Example: EMOM 10 × 10 push-ups = 100 reps. Progress by +1 rep/minute per week or +2 minutes per week. Fail state = a minute missed.
- **AMRAP:** as many rounds as possible of a fixed circuit in T minutes. Score = rounds + extra reps. A hostel "Cindy" swaps pull-ups for something with no bar: towel/door rows are risky, so use pike push-ups or a hold instead. Example: "Room Cindy" = 10 min AMRAP of 5 pike push-ups / 10 push-ups / 15 squats.
- **Tabata-style:** 20 s on / 10 s off × 8 = 4 min per block. Label it "20/10 intervals", not "Tabata", to stay honest. Score = the lowest round's reps (classic CrossFit scoring) or the total.
- **Ladders and pyramids:**
  - Ascending ladder 1→10 = 55 reps.
  - Pyramid 1→10→1 = 100 reps.
  - Descending 10→1 = 55 reps.
  - Input: tap per rung, or the app counts.
- **Death by X totals:** finishing minute n means 1+2+…+n = n(n+1)/2 reps. Minute 10 = 55 reps, minute 15 = 120, minute 20 = 210. Death-by push-ups is a natural weekly boss fight. The score (minutes completed) is a clean number to retest.
- **"+1 a day" (Day N = N reps):** over 61 days, Day 61 = 61 reps and the cumulative total is 1+…+61 = 1,891 reps. Very achievable for an intermediate lifter on push-ups, if the user may split the reps into sets.
  - Better variant: start at a baseline, e.g. Day N = 20 + N, so 21 on Day 1 and 81 on Day 61. Allow free splitting.
  - Do not run it on squats on leg day.
- **100 push-ups a day, every day:** 6,100 push-ups over 61 days. That stacks on top of chest/shoulder/triceps gym days (push days) and risks elbow, shoulder or tendon overuse, and the ER literature points to unaccustomed volume as the trigger.
  - Ramp in: weeks 1–2 at 50/day, then +10/week, capped at 100.
  - Treat push days as "half quota" or "rest".
- **30-day plank challenges** (typical viral versions push to 3–5-minute holds). Per McGill, replace them with "Big 3" sets or cumulative-time formats: e.g. total plank time per day, built from holds of ≤30–60 s with perfect form. Progress by adding sets, side planks, and harder variants (RKC plank, long-lever plank) rather than longer single holds.
- **30-day squat challenges:** if the user lifts legs 2×/week, a daily 100–250 air-squat quota adds junk volume. Keep squats out of the drill on leg days and the day after.
- **Rhabdo guard in-app:** cap any single-movement daily volume increase (e.g. no more than +20–25% week over week). Show a warning on "Death by" or 100-rep days when the user's last 7 days show no similar volume. Add a dark-urine/severe-swelling warning in the event's safety screen.

### Gaps
- No primary source fetched for ACE/NSCA EMOM/AMRAP definitions; these are standard community definitions. No evidence found on optimal "+1/day" progressions or injury rates from 30-day challenges.

## 4. Signature challenges and habit add-ons: Goggins 4x4x48, Murph and Hero WODs, hill sprints, Spartan, 10k steps, cold exposure, 5am wake

### Takeaway
4x4x48 and Murph are one-off "event weekend" or "boss fight" material, not daily mechanics. The evidence says the 10,000-step target is arbitrary (benefit plateaus around 8,000–10,000 steps/day for under-60s). Cold-water immersion has real cardiac and drowning risks, and done right after lifting it blunts hypertrophy. Cold showers should therefore be optional, timed away from lifting, and never framed as a recovery tool.

### Cited Findings
- **Goggins 4x4x48:**
  - Rule: run 4 miles every 4 hours for 48 hours, which is 12 legs and 48 miles total.
  - Goggins created it to train for 100+ mile races.
  - Non-runners: Goggins said to walk or jog 45–60 min per leg. Other hosts accept hiking, swimming, cycling or gym work.
  - It's virtual and non-competitive. Hosts offer lighter variants: 4x4x24 ("half-crazy"), 2x4x48.
  - There is no official rulebook.
  - Sources: [GoFundMe explainer](https://www.gofundme.com/en-ie/c/blog/4-4-48-challenge); [RunSignup event pages](https://runscore.runsignup.com/Race/IA/Huxley/CRAZYTRAIN4x4x48DavidGogginsChallenge); [Wise County PDF](https://www.wisecounty.org/DocumentCenter/View/609/4x4x48-Challange)
- **Murph (CrossFit Hero WOD, for time):**
  - **Rx:** 1-mile run, 100 pull-ups, 200 push-ups, 300 air squats, 1-mile run, wearing a 20 lb vest. One source says 14 lb for women, while CrossFit Roots says 20 lb for both.
  - The middle 600 reps can be partitioned however you like before the second run.
  - **CrossFit intermediate:** 1-mile runs with 50/100/150 reps.
  - **CrossFit beginner:** 800 m runs plus 10 rounds of ring rows / push-ups (knees or elevated) / squats.
  - **Half Murph:** 0.5 mi / 50 / 100 / 150 / 0.5 mi.
  - Common partition: 20 rounds of 5/10/15 ("Cindy" rounds).
  - Sources: [TechRadar](https://www.techradar.com/health-fitness/the-murph-workout-explained-what-is-it-how-to-do-it-and-how-to-adapt-it-for-different-fitness-levels); [BarBend](https://barbend.com/how-to-do-murph-tips); [CrossFit Roots](https://crossfitroots.com/memorial-day-murph-3/); [Battle Bunker](https://thebattlebunker.com/blogs/logbook/murph-workout-guide-how-to-train)
- **Daily steps (Paluch et al., Lancet Public Health 2022):** 15 cohorts, 47,471 adults, 3,013 deaths.
  - Mortality risk fell as steps rose, then plateaued at **8,000–10,000 steps/day for adults under 60** (6,000–8,000 for 60+).
  - Stepping rate (cadence) was not significant once volume was adjusted for.
  - The authors note that "10,000 steps" has little evidence behind it.
  - Sources: [DOAJ record](https://doaj.org/article/c3639c468b4348958202e52793ab979d); [UCL full text](https://discovery.ucl.ac.uk/id/eprint/10170017/1/1-s2.0-S2468266721003029-main.pdf)
- **Cold water: Espeland, de Weerd & Mercer 2022 (Int J Circumpolar Health)**, a narrative review that screened down to 104 studies.
  - **Insulin:** repeated winter immersions "significantly increased insulin sensitivity".
  - **Mood:** reduced tension and fatigue, but one study showed no difference versus control. A small trial hinted at relief of depressive symptoms, but it was too small to conclude anything.
  - **Brown fat:** thermogenesis is under 20 kcal/day.
  - **Risks:** cold shock (gasp reflex, jumps in heart rate and blood pressure, hyperventilation), cardiac arrhythmia (autonomic conflict), higher drowning risk, and hypothermia, which is "very prevalent" and higher in the morning when core temperature is lower.
  - Conclusion: benefits "will continue to be a subject of debate".
  - Source: [PMC9518606](https://pmc.ncbi.nlm.nih.gov/articles/PMC9518606)
- **Cain et al. 2025 meta-analysis (PLoS One):** 11 RCTs, 3,177 healthy adults. Cold-water immersion caused an acute rise in inflammation. Stress was lower at 12 h after immersion, with no effect at 0, 1 or 24 h. — [PubMed 39879231](https://pubmed.ncbi.nlm.nih.gov/39879231/)
- **Cold immersion blunts hypertrophy:**
  - Roberts et al. 2015 (J Physiol): 21 active men, 12 weeks of strength training 2×/week, with either 10 min of cold-water immersion (~10 °C, waist deep) or active recovery after each session. Strength and muscle mass rose more in the active-recovery group (P < 0.05), with blunted type II fibre growth.
  - Roberts advised against ice baths for anyone chasing strength or muscle growth, except in phases where recovery matters more than adaptation.
  - Follow-up: Peake et al. 2020 (Front Physiol) confirmed that cold-water immersion attenuates hypertrophy.
  - Sources: [NIH Brage record](https://nih.brage.unit.no/nih-xmlui/handle/11250/2402781); [Human Kinetics/Schoenfeld excerpt](https://us.humankinetics.com/blogs/excerpt/cold-water-immersion-hypertrophic-friend-or-foe); [UQ news](https://www.uq.edu.au/news/node/117683); [Frontiers 2020](https://pmc.ncbi.nlm.nih.gov/articles/PMC7339943/)

### Inferences
- **Murph as the Winter Arc finale boss (Dec 31, or a weekend near it).** Hostel version with no bar and no vest: 1-mile run (or 1,600 m brisk walk/stair climb) + 200 push-ups + 300 squats + a 1-mile run, with pull-ups replaced or dropped. Offer three tiers: Half (100/150), Intermediate, and Full. The app logs time to finish via a stopwatch and offers partition presets (20 × 5/10/15, or 10 × 10/20/30 without the pull-ups).
  - Do it as a Day-1 vs Day-61 comparison, or only at the end.
  - Never schedule it within 48 h of a leg day.
- **4x4x48 is not appropriate as-is** for a student during term: sleep disruption, and 48 miles is a big jump in running volume. Running interferes more with lifting than cycling does (see §6).
  - Possible "mini" version: a 4×1×12 "Arc Weekend" = 1 mile (or a 15-min walk) every 4 hours across 12 waking hours. That's 4 check-ins, tap-to-confirm.
  - The 4x4x24 / 2x4x48 lighter host variants show this kind of scaling is socially accepted.
- **Steps:** set the daily target at 8,000 by default (user-editable), not 10,000, per Paluch. The "10k" label works as a stretch bonus. Input: manual entry or a phone pedometer, if Zenith ever adds one. Zenith has no steps table today.
- **Cold showers (in the West Bengal winter, tap water is cool, not icy):**
  - Optional bonus only, worth low XP.
  - Not within about 4–6 h after lifting. This window is my extrapolation from Roberts' post-exercise protocol. The study only tested immediately post-session, so the exact window is uncertain.
  - Cap at 30 s–3 min. Never in open water alone. A safety screen should mention the cardiac/arrhythmia risk.
  - Never market it as "recovery".
- **5am wake:** no source fetched. A fixed alarm time that conflicts with a student's sleep is counterproductive. Zenith already tracks `wakeHour` and sleep. Better mechanic: a "consistent wake ±30 min of target" streak plus a sleep ≥ 7 h requirement, rather than a hard 5:00.
- **Hill sprints (proposal, unsourced):** e.g. 6–10 × 10–15 s uphill sprints at near-max effort, walk-down recovery, once a week on a non-leg day. They need outdoor access and add lower-body load, so make them optional.
- **"Spartan" style:** I found no usable source (likely meaning the "300" workout or Spartan Race training). Treat it as a gap.

### Gaps
- Spartan/"300" workout rules not researched. No source on 5am wake effects or on hill-sprint protocols. Goggins' own description of the 4x4x48 rules came only via secondary hosts. Exact Murph vest standards conflict between sources.

## 5. Weekly "boss fight" benchmarks: max push-ups, plank hold, 1-mile run, start vs end retests

### Takeaway
Max push-ups is the best-evidenced field test (more than 40 push-ups was associated with sharply lower cardiovascular risk in active men) and needs only a rep count. Death-by push-ups and AMRAP scores make good "boss HP" numbers. Plank max holds are a poor metric beyond about 2 minutes.

### Cited Findings
- **Yang et al. 2019 (JAMA Network Open):** 1,104 active male firefighters, mean age about 39.6, followed for 10 years.
  - Men who could do more than 40 push-ups had an incidence rate ratio of 0.04 for CVD events versus men doing fewer than 10, reported as a 96% lower risk.
  - Of 37 CVD events, all but one occurred in men doing 40 or fewer.
  - Push-up capacity was more strongly associated with outcomes than estimated aerobic capacity.
  - Caveats: observational, men only, active-job population.
  - Sources: [Harvard Chan School](https://hsph.harvard.edu/news/push-up-capacity-cardiovascular-disease-events-men); [Cooper Institute](https://www.cooperinstitute.org/blog/does-your-ability-to-do-pushups-predict-cardiovascular-risk)
- Plank holds beyond about 1–2 min mostly test tolerance, and form tends to degrade (hip sag, lumbar strain). — [Tom's Guide](https://www.tomsguide.com/uk/how-to/plank-exercise-how-long-do-you-need-to-hold-to-work-your-abs); [Business Insider/McGill](https://businessinsider.nl/sports-scientist-says-there-is-no-point-in-holding-plank-for-long-time-2018-3)
- Cindy's score (rounds in 20 min) and Death-by's score (rounds + reps) are standard repeatable benchmarks. — [Marathon Handbook](https://marathonhandbook.com/cindy-crossfit-workout/); [BoxRox](https://www.boxrox.com/challenging-death-by-crossfit-workouts-plus-mat-frasers-impossible-wod-rx/)

### Inferences (proposed benchmark battery)
- **Day 1 / Day 31 / Day 61 "Trials"** (start, midpoint, end), all equipment-free:
  1. **Max push-ups**, one set, strict form (chest to fist-height, no hip sag), stop at the first form break. Input: reps. Milestone badge at 40, per Yang.
  2. **Death by push-ups or burpees.** Input: last full minute plus extra reps.
  3. **Plank or side-plank form-quality hold**, capped at 2:00. If they hit the cap, switch to a harder variant (RKC plank) the next time. Input: timer.
  4. **Wall sit or max air squats in 2 min.** Input: timer or reps. Schedule it away from leg day.
  5. **1-mile (1.6 km) run or brisk walk time.** Input: mm:ss. Optional, because hostel and urban running access varies.
  6. **Gym lift e1RM** (Zenith already computes e1RM on `/progress`): show the Day-1 vs Day-61 delta for the top lifts on the results card.
- **Weekly boss fight (Sundays or the rest day):** rotate through these. Push-ups max (wk 1, 5, 9), Death-by (wk 2, 6), 10-min Room-Cindy AMRAP (wk 3, 7), plank/Big-3 quality (wk 4, 8), Finale Murph tier (Dec 31). "Boss HP" = last week's score. Beating it = "defeated" plus XP.
- Avoid testing to failure more than once a week on the same movement pattern.

### Gaps
- I didn't fetch ACSM push-up norms tables by age, which could be used for percentile labels. No sourced 1-mile norms for 22-year-old males.

## 6. Scaling a 61-day bodyweight drill alongside heavy lifting; recovery and deload

### Takeaway
Extra endurance and conditioning work interferes with lifting in a dose-dependent way, more so with running and with higher frequency and duration. So the drill should stay short, avoid the muscles trained that day, and get its own deload week. Strength athletes deload about every 5–6 weeks for about a week, which fits roughly one deload in the middle of the arc and a taper before the final tests.

### Cited Findings
- **Concurrent training (Wilson et al. 2012, JSCR):** meta-analysis of 21 studies, 422 effect sizes.
  - Hypertrophy effect size: 0.85 for concurrent training vs 1.23 for strength training alone. This figure comes from a secondary summary.
  - Running interfered more than cycling, possibly because of eccentric muscle damage.
  - Endurance frequency and duration correlated negatively with hypertrophy, strength and power.
  - One blog summary claims power was most affected, and a 2022 follow-up by the same group reportedly found strength and hypertrophy largely unaffected but explosive strength reduced.
  - **Sources conflict. The full paper wasn't read.**
  - Sources: [Academia.edu summary](https://www.academia.edu/103997237/Concurrent_Training); [EliteFTS](https://elitefts.com/blogs/training/improve-endurance-and-strength-simultaneously); [Biolayne](https://biolayne.com/reps/issue-8/concurrent-training-cardio-will-probably-not-kill-your-gains/)
- **Deloading (Rogerson et al., Sports Med Open 2024):** 246 strength and physique athletes. Typical deload: **6.4 ± 1.7 days, every 5.6 ± 2.3 weeks**. Volume was cut, frequency kept the same, and intensity was lowered via more reps in reserve. The main purpose was managing fatigue. This is a convenience sample showing practice, not optimal outcomes. — [SHURA full text](https://shura.shu.ac.uk/33446/1/s40798-024-00691-y.pdf)
- **Bell et al. 2023:** Delphi consensus of 34 → 21 coaches on deload design principles. I found no specific interval recommendation. — [DOAJ](https://doaj.org/article/599784d71dff41b197ff5cf66a3d11dd)
- 75 Hard's lack of rest days is the core injury and overtraining criticism from sports medicine physicians. — [TODAY](https://www.today.com/today/amp/rcna153979)
- Unaccustomed high-rep volume is the common trigger in exertional rhabdomyolysis cases. — [PMC5926575](https://pmc.ncbi.nlm.nih.gov/articles/PMC5926575)

### Inferences (proposed 61-day drill structure)
- **Drill should be "minimum effective, always doable":** 10–20 min, no failure sets on gym days, done in the room.
- **Map the drill to the gym day** (Zenith knows the active plan's day via `weekSchedule`/the active `WorkoutPlan`):
  - **Leg day and the day after:** core (McGill Big 3: curl-up, side plank, bird dog) + hip/ankle/T-spine mobility. No squats, lunges or jumps.
  - **Push day:** lower body/core, or light pull-pattern isometrics. No push-up quotas. Count 0 push-ups toward a "+1/day" challenge, or let gym pressing count.
  - **Pull day:** push-ups and core are fine.
  - **Rest day:** the conditioning drill (EMOM/AMRAP/Death-by/deck), or the weekly boss fight.
- **Volume progression:** +1 rep per EMOM minute per week, or +1 minute per week, or +5–10% of total reps per week. Cap single-movement weekly increases at about 20–25%.
- **Proposed 61-day periodisation** (based on the deload practice above):
  - **Days 1–3 (Nov 1–3), Calibration:** baseline Trials, easy drills.
  - **Days 4–28 (Nov 4–28), Build 1:** about 3.5 weeks of progressive drill volume.
  - **Days 29–35 (Nov 29–Dec 5), Deload week:** drill volume at about 50%, mobility/Big 3 focus, and a gym deload if the user's program allows it. Day 31 = midpoint Trials, done at the start of the deload. Alternatively run the Trials on Day 28 before the deload.
  - **Days 36–56 (Dec 6–26), Build 2:** 3 weeks, harder variants (decline push-ups, pike, pistol progressions on non-leg days).
  - **Days 57–60 (Dec 27–30), Taper:** volume about 50%, intensity kept.
  - **Day 61 (Dec 31), Final Trials + Finale boss** (Murph tier). Possibly split the Trials onto Day 60 and Murph onto Day 61.
  - Streak freezes: Zenith already allows 1 per ISO week. Keep them active, because a missed day shouldn't reset a 61-day arc.
- **Recovery inputs worth gating XP on:** sleep ≥ target (existing `sleepTargetMin`), protein target (existing), water target (existing). This also makes "recovery" part of winning, the opposite of the 75 Hard all-out framing.
- **Readiness check (optional):** a 1-tap "sore/tired/fine" before the drill. "Sore" swaps today's drill for the mobility template without breaking the streak.

### Gaps
- No direct study of daily bodyweight conditioning added to a 5–6 day hypertrophy split. Wilson 2012 numbers come from secondary summaries and partly conflict. NSCA/ACSM recovery guidance was not fetched directly.

## 7. Which formats map to simple app inputs

### Takeaway
Nearly every format reduces to one of four inputs: tap-done, reps, timer/stopwatch, or a randomiser. Each format has a single "score" number that can be retested.

### Cited Findings
- AMRAP score = rounds + reps. — [Marathon Handbook](https://marathonhandbook.com/cindy-crossfit-workout/)
- Death-by score = full rounds + reps in the final round, and the workout ends at the first missed minute. — [BoxRox](https://www.boxrox.com/challenging-death-by-crossfit-workouts-plus-mat-frasers-impossible-wod-rx/); [IntervalTimer](https://www.intervaltimer.com/wod/2026-05-27)
- Murph = time to finish, with the middle reps partitioned freely. — [TechRadar](https://www.techradar.com/health-fitness/the-murph-workout-explained-what-is-it-how-to-do-it-and-how-to-adapt-it-for-different-fitness-levels)
- Deck of cards = draw-until-empty or time cap. — [NIFS](https://www.nifs.org/blog/topic/strength-workout)
- 75 Hard/Soft = binary daily checklist plus a photo. — [TODAY](https://www.today.com/today/amp/rcna153979); [Marathon Handbook](https://marathonhandbook.com/75-soft-challenge/)

### Inferences (mapping table)
| Format | Input | Timer needed | Score/stat | Daily/weekly |
|---|---|---|---|---|
| Arc checklist (75-style: drill, gym, water, protein, sleep, read/study, photo) | tap-done per item (many auto-fill from Zenith data) | no | % of items, streak | daily |
| "+1 per day" push-ups | reps (split allowed), app shows target N | no | reps vs target | daily |
| Fixed quota (e.g. 50–100 push-ups) | reps, incremental taps (+5/+10) | no | cumulative | daily |
| EMOM | app-driven; tap "missed" if failed | interval beep per minute | minutes completed | daily drill |
| AMRAP (Room Cindy) | rounds counter (+1 tap) + extra reps | countdown | rounds+reps | drill / boss |
| 20/10 intervals | reps per round (optional) | 20/10 beep × 8 | total or lowest round | drill |
| Ladder/pyramid | tap per rung | optional stopwatch | time to finish | drill |
| Death by X | app-driven per-minute target; tap "failed" | minute beep | last minute + reps | weekly boss |
| Deck / dice / roulette | "draw/roll/spin" → "done" | optional cap | cards done, time | drill (variety day) |
| Weekly bingo | tap cell; auto-complete from logs | no | lines, blackout | weekly |
| Max push-up test | reps | no | reps (badge at 40) | Day 1/31/61 + weekly rotation |
| Plank/side plank | hold timer (capped 2:00) | stopwatch | seconds | boss rotation |
| 1-mile time | mm:ss entry or stopwatch | stopwatch | time | Day 1/61 optional |
| Murph tier | stopwatch + partition preset | stopwatch | finish time | finale |
| Steps | number entry | no | steps vs 8k target | daily |
| Cold shower | tap-done (+duration optional) | optional | streak (bonus only) | optional daily |
| Wake consistency | auto from sleep log | no | within ±30 min | daily |

- The existing Zenith pieces cover most of this: a rest timer store (`lib/restTimerStore.ts`), streak + freeze (`lib/streak.utils.ts`), XP (`lib/xp.ts`), achievements, and day photos.
- What's new: interval-timer beeps (EMOM, 20/10, Death-by), a randomiser, and a bingo grid.

### Gaps
- No research on which input types maximise adherence. The mapping is design judgement.
