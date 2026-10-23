# Gamification Patterns for Limited-Time Events and Streak Mechanics in Consumer Apps

Context: research to inform a 61-day "Winter Arc" event (Nov 1 to Dec 31) in Zenith, a single-user, local-first fitness/habit tracker with an optional small friends leaderboard (Convex). Research date: 2026-10-23. Evidence quality legend used throughout: **[PRIMARY]** = company blog, investor filing, peer-reviewed paper, or official support doc; **[SECONDARY]** = press or teardown that quotes the company; **[COMMENTARY]** = opinion, vendor blog, or fan site; **[UNVERIFIED]** = a figure circulating without a traceable primary source.

## Duolingo: streaks, freezes, wagers, Friend Streaks, leagues, notifications, Year in Review (and the academic evidence on streaks)

### Takeaway
Duolingo's published A/B results are small but consistent. Every mechanic that softens a streak's fragility helped retention: freezes, the weekend amulet, a lower daily bar, and wagers. Milestone celebrations and social co-ownership (Friend Streaks) helped too. Academic work agrees that an intact, visible streak raises later engagement, that a broken streak drives drop-off, and that a "repair" option blunts the drop. I found no published Duolingo data showing guilt or "unhinged" notification tone specifically improves retention. The documented win is algorithmic message selection with novelty decay.

### Cited Findings
**Core streak + published experiments**
- [PRIMARY] Streak = meet a daily goal each day; "Miss a single day, and your streak resets to zero." Flame icon on home screen plus personalized reminders. Blog by Kai Herng Loh, May 10 2017. — [Duolingo blog, 2017](https://blog.duolingo.com/how-streaks-keep-duolingo-learners-committed-to-their-language-goals/)
- [PRIMARY] **Streak Wager** A/B test: at the end of a lesson, the learner stakes in-game currency on keeping the streak 7 more days and gets double back on success. The test showed statistically significant gains in Day-1, Day-7 and Day-14 retention, with Day-7 the largest at **+14%**. Wager users also returned more and completed more lessons than control. — [Duolingo blog, 2017](https://blog.duolingo.com/how-streaks-keep-duolingo-learners-committed-to-their-language-goals/)
- [PRIMARY] **Weekend Amulet**: equippable on Friday, it keeps the streak alive through the weekend without app use. The motivation was that DAU falls **5–10%** on weekends vs midweek. Amulet users were **4% more likely to return a week later** and **5% less likely to lose their streak**. — [Duolingo blog, 2017](https://blog.duolingo.com/how-streaks-keep-duolingo-learners-committed-to-their-language-goals/)
- [PRIMARY] Learners who binge lessons are much more likely to quit than those who pace themselves. No figure given. — [Duolingo blog, 2017](https://blog.duolingo.com/how-streaks-keep-duolingo-learners-committed-to-their-language-goals/)
- [PRIMARY] Osman Mansur, Jan 31 2022:
  - "over 6 million people on a streak of 7 days or more".
  - The new post-lesson streak animation, including **milestone-day animations**, raised the chance a brand-new learner was still active 7 days later by **1.7%**.
  - Allowing up to **two equipped Streak Freezes** (vs one) raised relative daily active learners by **0.38%**. The screenshot shows freezes refill for 400 gems, max 2 equipped.
  - Learners who reach a **7-day streak are 3.6x more likely to complete their course** (correlational).
  - Framing: 2→3 days is a 50% increase in streak length, 200→201 is 0.5%. This is the rationale for celebrating early milestones heavily.
  — [Duolingo blog, 2022](https://blog.duolingo.com/how-duolingo-streak-builds-habit)
- [SECONDARY] Attributed to Jackson Shuttleworth (Duolingo retention group PM), undated:
  - Changing a CTA from "Continue" to "Commit to my goal" produced **10,000 more people opening the app daily**.
  - Requiring only **one lesson** (vs the full daily goal) to keep a streak led to **over 40% more users keeping a 7-day streak**.
  - Two freezes vs one brought **200,000 more people back daily**.
  - Nearly **8 million learners** have a 365+ day streak.
  — [Mobbin, "Streaks are about losing" (study of 859 streak designs)](https://mobbin.com/blog/streaks-are-about-losing-a-study-of-859-streak-designs). Note: the 200k figure and the 0.38% figure from the 2022 blog come from different times and DAU bases, and neither source reconciles them. Other secondary sources give "over 9 million" for year-long streaks — [Mobbin search results summary](https://mobbin.com/blog/streaks-are-about-losing-a-study-of-859-streak-designs)
- [SECONDARY] Duolingo reportedly tested giving new streak starters **two free freezes** (no gem purchase). Staff concluded direct flexibility beat a gem purchase, especially for new streakers. — [Yu-kai Chou streak design analysis](https://yukaichou.com/gamification-study/master-the-art-of-streak-design-for-short-term-engagement-and-long-term-success/); [Lenny's Podcast summary page (Shuttleworth)](https://www.getrecall.ai/summary/lennys-podcast/behind-the-product-duolingo-streaks-or-jackson-shuttleworth-group-pm-retention-team) (page now 404s; could not verify directly)
- [UNVERIFIED] "iOS streak widget raised commitment by 60%". It is widely repeated, but I found no Duolingo primary source. — [Mobbin](https://mobbin.com/blog/streaks-are-about-losing-a-study-of-859-streak-designs) search context
- [UNVERIFIED / vendor] Trophy reports that at the 14-day threshold, average streaks ran 30.63 days with freezes vs 18.87 without. This is observational, from a vendor blog. — [Trophy, Duolingo case study](https://trophy.so/blog/duolingo-gamification-case-study)
- [SECONDARY] Next-day retention reportedly rose from ~13% (2012) to ~55% (2019) per a former product lead. This is internal framing, not audited. — [Elsewhere / Linear Capital](https://elsewhere.news/en/linearcapital/duolingobolt)

**Friend Streaks (social)**
- [PRIMARY] Jackson Shuttleworth, Sep 20 2024:
  - You can share a streak with **up to 5 friends**, one streak per friendship. Both must do a daily lesson, and each friend must accept the invite.
  - Learners with ≥1 Friend Streak are **22% more likely to complete their daily lesson**, and the likelihood rises with each additional one.
  - **57%** of users have at least one friend on the app.
  - The cap was kept at 5 because few users have large friend groups and 5-streak users already retain well.
  - The biggest funnel hurdle was **sending the first invite**.
  - The first internal prototype was **local-device-only with no backend** (fake streaks, friends not notified), and it was still fun enough to win leadership buy-in.
  — [Duolingo blog, Friend Streak product lessons, 2024](https://blog.duolingo.com/product-lessons-friend-streak/); [Friend Streak launch post](https://blog.duolingo.com/friend-streak/)

**Leagues**
- [PRIMARY] Leaderboards were first tested in 2018 ("a little competition worked for a *lot* of learners"). They started with 5 leagues and now have 10. The top 10 in Diamond become eligible for a 3-round Diamond Tournament (Quarterfinals, Semifinals, Finals). — [Duolingo blog, leagues](https://blog.duolingo.com/duolingo-leagues-leaderboards/)
- [COMMENTARY] A weekly cohort of ~30 randomly-assigned users is ranked by XP over 7 days, with tier-specific promotion counts. These are not confirmed by Duolingo and conflict with the official tier count. — [Deconstructor of Fun Duolingo mechanics](https://duolingo.deconstructoroffun.com/mechanics/leagues)

**Notifications**
- [PRIMARY] Practice reminders are pre-written templates, personalized (language, current streak) and selected by a **"sleeping, recovering" multi-armed bandit**, where the payout is lesson completion. **Novelty effect**: new templates are more persuasive and wear off, so the algorithm demotes recently-seen reminders, with spacing based on the same forgetting curve used for vocabulary. Before this system, selection was random. Analysis covered ~200M reminders over 34 days. The blog reports no numeric lift, only "more learners were completing lessons more frequently" and "tens of thousands of new learners" returned. Published at KDD 2020 (Yancey & Settles, pp. 3008–3016). — [Duolingo blog, Sep 3 2020](https://blog.duolingo.com/hi-its-duo-the-ai-behind-the-meme/); [DBLP citation](https://dblp.dagstuhl.de/pid/62/3903.html)
- [PRIMARY] The only tone reference in that post: users have "probably swiped away one of these notifications" and "felt a bit guilty in the process". It does not present guilt as a tested lever. — [Duolingo blog, 2020](https://blog.duolingo.com/hi-its-duo-the-ai-behind-the-meme/)
- [SECONDARY] "Duo is dead" campaign, Feb 11 2025. Users were pushed to complete lessons to collectively earn **50 billion XP** at bringback.duolingo.com, and Duo "returned" a week later. Duolingo's spokesperson said the aim was "entertaining content that reminds our fans to do their lesson". Meltwater measured ~169,000 mentions Feb 4–17 2025, a ~25,560% spike on announcement day, and #ripduo used 45,000+ times. No Duolingo engagement numbers were published. — [NPR, Feb 26 2025](https://npr.org/2025/02/26/nx-s1-5309785/duolingo-owl-mascot-lives); [Meltwater](https://www.meltwater.com/en/blog/duolingo-dead-mascot-campaign)
- [COMMENTARY] Passive-aggressive notifications are criticized for upsetting some users (especially children) but called effective. No underlying data. — [University XP](https://www.universityxp.com/news/2025/7/25/we-havent-seen-you-in-a-while-duolingos-passive-aggressive-strategy-for-keeping-users-hooked)

**Year in Review**
- [PRIMARY] History: started as a Dec 2019 email (active days, time, words, lessons). It moved in-app with share cards in 2020. In 2021 an **XP percentile** was added to the share card, which raised share rates, especially among top learners. In 2022 it added **"learner styles"** (persona archetypes, e.g. XP-focused vs streak-focused vs language-hopper) as a second share option, plus a themed badge for sharers. In 2020 data the **top 10% of XP earners produced more than half of all shares**, so personas were added to make sharing work for non-top performers. "Millions" share. No exact rates were published. — [Duolingo blog, Dec 8 2022](https://blog.duolingo.com/year-in-review-behind-the-scenes)

**Academic evidence on streaks / lapses**
- [PRIMARY, peer-reviewed] Silverman & Barasch, *JCR* 49(6), Apr 2023, 7 studies:
  - **Intact streaks shown in a behavioral log increase subsequent engagement vs broken streaks**, independent of actual past behavior. Only the representation matters.
  - The effect is amplified when people attribute the break to themselves.
  - It is **attenuated when the streak can be "repaired"**.
  - Authors' practice note: highlighting a recent failure "typically doesn't work… people will just drop off once their streaks are broken". Offering a new goal works better.
  — [UDel repository](https://udspace.udel.edu/handle/19716/34160); [CU Boulder summary](https://www.colorado.edu/business/faculty-research/2023/04/19/or-track-how-broken-streaks-affect-consumer-decisions)
- [PRIMARY, peer-reviewed] Milkman et al. megastudy, *Nature* 2021, with 24 Hour Fitness and 61,000+ members:
  - 45% of the ~53–54 four-week interventions significantly raised weekly gym visits, by 9–27%.
  - **The top performer was a tiny bonus for returning after a missed workout**, which lifted visits **27%**. Milkman attributes the effect to breaking a "streak of misses", not to the money.
  - "Exercise is a growing trend" framing lifted visits 24%.
  — [Penn Today](https://penntoday.upenn.edu/news/wharton-study-best-ways-boost-workout-habits); [WEF summary](https://www.weforum.org/stories/health-and-healthcare-systems/science-fitness-goal-motivation/)
- [PRIMARY, peer-reviewed] Fresh Start Effect (Dai, Milkman, Riis, *Management Science* 2014): gym visits, "diet" searches and goal commitments rise after temporal landmarks such as a new week, month, year, semester, birthday or holiday. Landmarks open a "new mental accounting period" that distances the past self's failures. — [Paper PDF](https://anderson-review.ucla.edu/wp-content/uploads/2021/03/Dai-Milkman-Riis_FreshStartEffect_2014_Mgmt_Sci.pdf); [Dai & Li 2018 review](https://anderson-review.ucla.edu/wp-content/uploads/2021/03/Dai-Li_2018_TemporalLandmarks_CurrentOpinioninPsychology.pdf). [UNVERIFIED] effect sizes of +33% at week start / +50% at year start — [Learning Loop](https://learningloop.io/plays/psychology/fresh-start-effect)
- [PRIMARY, peer-reviewed] Lally (UCL) habit study: missing one opportunity "did not materially affect the habit formation process" (as quoted). — [Mobbin](https://mobbin.com/blog/streaks-are-about-losing-a-study-of-859-streak-designs)
- [PRIMARY, qualitative] A run-streak study of 21 recreational runners found features of automaticity, with motivation, identity and self-regulation involved. — [PMC11494719](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11494719/). A medRxiv preprint (not peer reviewed) examines the "backfire" of breaking long run streaks — [medRxiv 2024](https://www.medrxiv.org/content/10.1101/2024.12.26.24319676.full.pdf)
- [UNVERIFIED] "63% more likely to quit after a broken streak" and "71% more likely to resume within 24h". Attributions conflict (CHI 2020 vs JPSP 2020 vs Penn BCFG) and no paper was found. Do not use. — [habit-streak.com](https://habit-streak.com/en/blog/wellness/what-happens-when-you-break-a-streak)

**Streak design survey**
- [COMMENTARY] Mobbin's review of 859 streak designs found streaks "almost always" count days. Patterns observed:
  - Alma: vacation/pause mode, up to 14 days.
  - Paired: 1 freeze/month, auto-replenished.
  - Runna: no freezes, missed workouts roll into the current week.
  - Finch: a "hammer" repairs a missed day rather than blanking it.
  - Emotional framings: hope, pattern completion, anthropomorphism, fear.
  — [Mobbin](https://mobbin.com/blog/streaks-are-about-losing-a-study-of-859-streak-designs)

### Inferences
- For a 61-day event, the evidence favors a **forgiving streak**:
  - A small, pre-granted freeze budget (Duolingo's 2-freeze result; free freezes beat purchased ones).
  - A **repair/comeback mechanic** that rewards the day after a miss (Nature megastudy's top intervention; JCR repair attenuation).
  - A **low minimum bar** to keep the streak alive (Duolingo's one-lesson result: +40% keep 7-day streaks).
  Zenith already has a `streakFreezes` table (1 per ISO week). The event could reuse it rather than add a new concept.
- Heavy celebration of early milestones (days 3, 7, 14) matters more than late ones, because of percentage-growth framing and the +1.7% D7 result from milestone animations.
- Nov 1 is itself a temporal landmark (fresh-start). Mid-event landmarks such as each new week, Dec 1, and "final 30/14/7 days" are natural re-entry points for lapsed users. Prefer "new goal / fresh chapter" copy over "you broke it" copy (JCR finding).
- Commit-device mechanics (wager, "Commit to my goal") are cheap to replicate locally, e.g. a Nov 1 "I commit to the Winter Arc" pledge and an optional XP wager on a 7-day block.
- Guilt-tone notifications are **not** evidence-backed in anything published. The published lever is rotating many templates and demoting recently-seen ones (novelty decay). A local reminder engine can do a simple "don't repeat the last N templates" rotation.
- Year-in-Review lesson: percentile/leaderboard cards only make top performers share. Persona/archetype cards make everyone's recap shareable.

### Gaps
- No primary Duolingo numbers on streak repair, Perfect Streak, Streak Society, the widget, leagues' lift on lessons, XP Happy Hour / XP boosts, or Year-in-Review share rates.
- The KDD 2020 paper's effect sizes were not retrieved (blog gives none).
- The Lenny's Podcast (Shuttleworth) primary transcript was not retrieved (summary URL 404s), so the 200k / 10k / 40% figures are secondary.
- No published A/B data on harsh or guilt notification tone, from Duolingo or academia.

## Strava: monthly challenges, badges, Year in Sport, segments / Local Legends, group challenges

### Takeaway
Strava's strongest published signal is that **group challenges correlate with higher subsequent activity**: half of participants uploaded more in the 30 days after starting one. Local Legends shows a design that rewards **consistency (effort count over a rolling 90-day window) instead of speed**, which suits a solo or small-group context.

### Cited Findings
- [SECONDARY quoting Strava 2021 Year in Sport]:
  - **Group challenge participation doubled** in 2021, having also doubled 2019→2020.
  - **Half of group-challenge participants uploaded more activities in the 30 days after starting a challenge than in the 30 days prior.**
  - Other 2021 figures: 95M athletes, 1.8B uploads (+~38% YoY), club members +37%, 9.6B kudos.
  — [BikeRadar, Year in Sport 2021](https://www.bikeradar.com/news/strava-year-in-sport-2021/); [Endurance.biz](https://endurance.biz/2021/featured-news/by-the-numbers-strava-year-in-sport-2021-report/); [Triathlon Magazine](https://triathlonmagazine.ca/training/strava-year-end-report-32-billion-km-covered-and-9-6-billion-kudos-given/)
- [SECONDARY] 2020 Year in Sport: 1.1B+ uploads (+33%). Successful "Everesting" rides in June 2020 were up 600% YoY, an example of a community-invented challenge going viral. — [Endurance.biz 2020](https://endurance.biz/2020/industry-news/stravas-year-in-sport-data-reveals-boom-in-global-exercise-amid-the-pandemic/)
- [SECONDARY] **Local Legends** (launched July 2020):
  - Ranks athletes by **number of efforts on a segment over a rolling 90-day window**, not speed.
  - The leader gets a "Laurel Crown" and holds it until surpassed. Because the window rolls, leadership can change daily.
  - The leaderboard shows a **histogram** with how many more efforts are needed to catch the leader.
  - Full access is premium-only.
  — [DC Rainmaker](https://dcrainmaker.com/2020/06/strava-legends-feature.html); [BikeRadar](https://bikeradar.com/news/strava-local-legend-worldwide-release); [Android Central](https://www.androidcentral.com/strava-announces-local-legends-new-way-compete-segments)
- Methodology note: private activities and opted-out athletes are excluded from Strava's aggregates. — [Endurance.biz](https://endurance.biz/2021/featured-news/by-the-numbers-strava-year-in-sport-2021-report/)

### Inferences
- The "30 days after vs 30 days before" stat is correlational, since self-selected joiners may already be ramping up. It is still the best public fitness-app signal for time-boxed challenges.
- Local Legend translates directly to a friends leaderboard. Rank on **days active / sessions logged in the event window**, not kg lifted, so a beginner can beat a stronger friend. Show "N more sessions to pass X".
- Solo variant: compete against **your own previous 61 days** (rolling-window personal legend).

### Gaps
- No Strava data found for 2022–2026 Year in Sport challenge stats, monthly challenge badge completion rates, or the design and impact of user-created group challenges.

## Apple Fitness / Watch: limited-edition challenge awards and 7-day competitions

### Takeaway
Apple's model is a **single-day or single-window, binary, date-locked award** (e.g. a 20-min dance workout on Apr 29, or closing all rings 7 days in a row in January) plus a **7-day head-to-head capped at 600 pts/day**. Both are simple to copy locally. No engagement data is published.

### Cited Findings
- [PRIMARY] Competitions run 7 days. Points = % of rings closed (one full Exercise ring ≈ 100 pts), **capped at 600/day, max 4,200/week**. Top scorer wins. — [Apple Watch User Guide](https://support.apple.com/en-gw/guide/watch/apd68a69f5c7)
- [SECONDARY] The winner gets a winner badge and both get a participation badge; ties give both a winner badge. — [Macworld](https://www.macworld.com/article/673405/how-to-set-up-and-win-apple-watch-competitions.html); [Cult of Mac (says loser gets nothing)](https://www.cultofmac.com/?p=606710). These sources conflict on the participation badge.
- [SECONDARY citing Apple] International Dance Day 2026 award: log a **Dance workout of 20+ min on April 29** via any app that writes workouts to Health. Wareable says the Watch dance profile is required, which conflicts; Apple's wording is authoritative. — [9to5Mac, Apr 14 2026](https://9to5mac.com/2026/04/14/apple-watch-getting-two-new-activity-challenges-later-this-month/); [Wareable](https://www.wareable.com/apple/earn-apple-watch-badges-for-earth-day-and-international-dance-day)
- [SECONDARY] "Ring in the New Year" 2023: close all three rings **7 days in a row at any point in January**. The 2025 edition window was Jan 7–31. — [iPhone in Canada, Dec 2022](https://www.iphoneincanada.ca/2022/12/14/apple-unveils-2023-apple-watch-new-year-activity-challenge/); [MacTech, Dec 2024](https://www.mactech.com/2024/12/17/new-apple-watch-activity-challenge-challenges-folks-to-ring-in-the-new-year-with-fitness/amp/)

### Inferences
- The 600/day cap is a fairness device: daily overachievement can't swamp the week, so consistency wins. Copy it for any Winter Arc friend duel (e.g. capped daily discipline score × 7).
- "7 in a row at any point within a window" is more forgiving than "every day of the window". It is a good template for sub-challenges inside the 61 days, e.g. "a perfect 7 any time in December".
- Date-locked one-day awards suit Winter Arc landmarks: Nov 1 kickoff, Diwali/Kali Puja week, Dec 31 finale. These are local-first friendly and need no server.

### Gaps
- No Apple-published participation or retention data for limited-edition awards or competitions. Current (watchOS 11+) competition reward details are not confirmed.

## Habitica: boss battles, quests, party damage, pets/drops

### Takeaway
Habitica turns missed dailies into **shared consequences**: during a boss quest, one member's missed Dailies damage the whole party, scaled by boss strength. That is a strong accountability lever, but it depends on a party and produces "surprise deaths". No engagement data was found.

### Cited Findings
- [COMMENTARY: community wiki] Completing tasks damages the boss. Every participant takes damage for **all** participants' uncompleted Dailies, multiplied by boss strength. — [Habitica Wiki: Obstacles](https://habitica.fandom.com/wiki/Obstacles)
- [COMMENTARY: wiki] Damage is unpredictable (it lands when a teammate's daily rollover, "Cron", runs), so the wiki advises keeping Health higher than usual. A common cause of sudden death is one member's misses hitting everyone. — [Habitica Wiki: Death](https://habitica.fandom.com/wiki/Death)
- [COMMENTARY: wiki] "Rest in the Inn" (pause) stops your own missed Dailies from hurting the party, but not teammates' misses. Resting players deal no boss damage until they check out. — [Habitica Wiki: Rest in the Inn](https://habitica.fandom.com/wiki/Rest_in_the_Inn)

### Inferences
- Solo translation: a **boss with an HP bar that you damage by logging**. Missed days could heal the boss rather than hurting you, which avoids the shame and "what-the-hell" collapse. Example: a 61-day "Winter Wraith" with HP = target sessions; finishing workouts/sleep/protein deals damage. This is fully local.
- Party damage needs a social graph and real-time sync, and it conflicts with the JCR finding that self-attributed failure drives drop-off. In a small friends group it risks resentment. A safer variant is a **cooperative pooled goal** like Duolingo's 50B-XP "bring Duo back" (friends' combined sessions fill one bar), shown via the existing Convex weekly snapshot.
- "Inn"/pause = Alma-style vacation mode. Worth offering for illness, so a 61-day event isn't abandoned after a fever week.

### Gaps
- No published Habitica retention data. Exact damage formula, pet/drop rates, and quest scroll economy were not retrieved.

## Other time-boxed / loss-based systems: Forest, Snapchat, Pokémon GO, battle passes, Spotify Wrapped, Peloton/NRC, BeReal

### Takeaway
The highest-confidence data point is **Spotify Wrapped 2025: 200M+ engaged users in 24h and 500M+ shares**. The pattern behind it is a one-off personal recap as a share artifact. Forest and Snapchat show **loss-salience** devices: a withering tree and an hourglass. Battle passes and Pokémon GO show **tiered progress tracks with daily/weekly quests inside a fixed season**, but no credible public retention numbers.

### Cited Findings
- [SECONDARY citing Spotify] **Spotify Wrapped 2025**:
  - **200M+ engaged users within 24 hours**, 19% more than 2024. 2024 took **62 hours** to reach 200M.
  - Shared **500M+ times** on day one (+41% YoY), counting native shares, screenshots and downloads.
  - "Engaged" = viewed at least one story.
  - Growth came from the US, India, Indonesia, Japan, Colombia and Thailand.
  — [TechCrunch, Dec 4 2025](https://techcrunch.com/2025/12/04/spotify-says-wrapped-2025-is-its-biggest-yet-with-200m-users-in-its-first-day); [Music Week](https://www.musicweek.com/digital/read/spotify-wrapped-2025-was-biggest-ever-with-200-million-engaged-users/093178). Self-reported and unaudited. The 2024 edition was widely called an "AI-centered flop", per the same coverage.
- [SECONDARY] **Forest**:
  - Leaving the app mid-session **withers your virtual tree**. Deep-focus mode gives a 10-second warning before death.
  - Earned coins fund real trees via Trees for the Future (1.5–2M+ planted per App Store / Wikipedia).
  - Per-user real-tree cap of 5 "due to budget", with **limited-time events that allow planting more**.
  - Moved to free + Forest Plus subscription in Dec 2025.
  — [Wikipedia: Forest (application)](https://en.wikipedia.org/wiki/Forest_(application)); [Reset.org](https://en.reset.org/cure-your-phone-addiction-and-plant-trees-03282018/)
- [COMMENTARY: conflicting] **Snapchat**: the ⌛ hourglass warns a Snapstreak is about to expire. Sources disagree on timing ("~4h before expiry" vs "after 20h without a snap"). Restore: Snapchat+ gets more restores than free users, there is a paid $0.99 restore, and restores are limited to recently-lost streaks, but counts conflict across sources. — [BGR](https://bgr.com/guides/how-to-recover-your-snapstreak/); [Unilink](https://www.unilink.us/blog/snapchat-streak-rules); [Beebom](https://beebom.com/snapchat-streak-lost-how-get-snapstreak-back/amp/)
- [SECONDARY] **Pokémon GO Community Day**: a short fixed window with bonuses.
  - In 2022 Niantic shortened the window. Its stated reason: "longer periods work for established communities, but are not as effective in attracting new players/communities". This drew backlash that short windows punish people with jobs.
  - Per Niantic's developer diary, players walk ~4 km on average per event.
  — [Massively OP, Mar 2022](https://massivelyop.com/2022/03/24/massively-on-the-go-pokemon-gos-april-community-day-strategy-hurts-its-own-goals-and-players/); [Siliconera](https://www.siliconera.com/pokemon-go-developer-diaries-series-details-community-days/)
- [PRIMARY: Google Play guidance] **Battle passes**: usually free + premium tracks. They "often improve engagement (and sometimes retention)" because sustained engagement is needed to unlock top rewards. — [Google Play Apps & Games](https://goo.gle/3htI67y). [COMMENTARY] Daily challenges reset every 24h for quick XP, weekly ones give larger XP. — [PM Playground](https://pmplayground.substack.com/p/the-science-behind-battle-passes). [UNVERIFIED] "95.8% D30 lift" style stats — [voxbooster](https://voxbooster.com/blog/battle-pass-statistics-2026/). Do not use.
- [COMMENTARY: fan site] **Peloton "The Annual"**: a yearly cumulative-minutes challenge with tiered badges, now 1,000 → 20,000 min (originally 5,000 in 2020, with tiers added over time). A calculator shows the pace needed per tier. A 2022 bug that removed earned badges/minutes after year end drew complaints. — [PeloBuddy 2023](https://www.pelobuddy.com/2023-annual-challenge-launched/); [PeloBuddy glitch](https://www.pelobuddy.com/glitch-annual-2022-challenge/)

### Inferences
- **Winter Arc recap card (Dec 31)** is the mechanic with the strongest evidence of virality. Use persona archetypes (Duolingo learner styles) plus personal bests, not just rank. Zenith already has `/glance` (a share card) and `navigator.share` + clipboard fallback patterns, so it can reuse those.
- **Tiered season track** (battle-pass-like, free-only since there's no monetization): ~10–20 tiers over 61 days, earned by event XP, with daily and weekly quests feeding it. Peloton's tier-ladder plus a "pace needed" calculator is a good fit, e.g. "on pace for Tier 14".
- Loss salience (Forest/Snapchat) maps to an **evening "streak in danger" state**. Zenith already shows a 21:00+ streak-in-danger banner on Home, so the event could add an hourglass-style visual on that existing banner.
- Earned rewards must be **immutable after the event ends**, as the Peloton glitch shows. Persist event awards as `achievements` rows, never recomputed.
- Pokémon GO's backlash suggests avoiding narrow mandatory time windows for a student with an irregular schedule. Prefer "any 1 day this week" over "Saturday 2–5pm".

### Gaps
- No primary data on Snapchat streak restore rules, Pokémon GO Field Research / 7-day Breakthrough (search returned nothing), Fortnite quest cadence, Nike Run Club challenges, Strava monthly badges, or BeReal's timed-prompt engagement. BeReal and NRC were not covered by any source retrieved in this session.
- No trustworthy free-vs-premium battle-pass retention study.

## Advent-calendar daily unlocks, mystery/loot rewards, variable reward schedules

### Takeaway
I found no published, credible app-level data isolating advent-style unlocks or variable/mystery rewards. The best-supported adjacent findings are that **small, well-timed rewards around comebacks work** (Nature megastudy) and that **novelty decays** (Duolingo bandit). Treat variable rewards as a cheap delight layer, not a proven retention driver.

### Cited Findings
- [PRIMARY] Duolingo's notification system found new reminder templates more persuasive initially, with the effect wearing off (novelty effect). It counteracts this by demoting recently-seen items. — [Duolingo blog, 2020](https://blog.duolingo.com/hi-its-duo-the-ai-behind-the-meme/)
- [PRIMARY] Small per-visit rewards plus planning prompts plus reminders raised gym attendance ~9%. A tiny missed-workout return bonus raised it 27%. — [Penn Today](https://penntoday.upenn.edu/news/wharton-study-best-ways-boost-workout-habits); [WEF](https://www.weforum.org/stories/health-and-healthcare-systems/science-fitness-goal-motivation/)
- [COMMENTARY] Mobbin cites Schultz (1998) on anticipatory dopamine release and Lepper, Greene & Nisbett (1973) on overjustification (extrinsic rewards can undermine intrinsic motivation) as background for streak/reward design. — [Mobbin](https://mobbin.com/blog/streaks-are-about-losing-a-study-of-859-streak-designs)
- [SECONDARY] Forest uses limited-time events to temporarily raise the real-tree cap, i.e. event-scarce rewards. — [Wikipedia: Forest](https://en.wikipedia.org/wiki/Forest_(application))

### Inferences
- An **advent-style "61 doors"** is local-first and cheap. Each day's door unlocks when that day's minimum is met, revealing a quote (Zenith has `quotes`), a stat insight, a mystery badge hint, or bonus XP. Seed contents deterministically (e.g. hash of date) so they're stable across reloads and restores.
- Use **variable content rather than variable XP size**. Rotating reveal types keeps novelty without making core progress feel random or unfair on the friends leaderboard.
- Doors missed on a lapsed day could stay "frosted" and be reopened by the comeback-day mechanic. This merges advent with the evidence-backed comeback bonus.
- Overjustification risk is low for a self-chosen tracker but argues for keeping rewards cosmetic or informational rather than "you must for points".

### Gaps
- No controlled study found on advent-calendar unlocks, loot boxes, or variable-ratio rewards in fitness/habit apps (2020–2026). Hearthstone/Fortnite daily quest effect sizes were not found from credible sources.

## Which mechanics translate to a solo, no-monetization, local-first app vs which need a social graph

### Takeaway
Nearly every evidence-backed mechanic works **solo and offline**: forgiving streaks, freezes, repair/comeback bonus, low minimum bar, milestone celebrations, commitment pledges, temporal-landmark resets, boss HP bars, tier tracks, date-locked awards, and a recap card. Mechanics that need a social graph are Friend Streaks (+22% daily completion, Duolingo's most clearly quantified social result), leagues, head-to-head duels, pooled community goals, and party damage. Zenith's existing Convex weekly-snapshot leaderboard can support the cheap social variants without real-time sync.

### Cited Findings
- [PRIMARY] Duolingo's first Friend Streak prototype was **local-only (no backend)** and was still engaging enough to justify building, so a "fake/self" social layer can carry some value. — [Duolingo blog, 2024](https://blog.duolingo.com/product-lessons-friend-streak/)
- [PRIMARY] Friend Streak users are 22% more likely to do their daily lesson. The largest funnel hurdle is sending the first invite. — [Duolingo blog, 2024](https://blog.duolingo.com/product-lessons-friend-streak/)
- [PRIMARY] Solo-capable mechanics with published effects:
  - Wager: +14% D7 — [Duolingo 2017](https://blog.duolingo.com/how-streaks-keep-duolingo-learners-committed-to-their-language-goals/)
  - Weekend amulet: +4% week-later return — [Duolingo 2017](https://blog.duolingo.com/how-streaks-keep-duolingo-learners-committed-to-their-language-goals/)
  - 2 freezes: +0.38% DAU — [Duolingo 2022](https://blog.duolingo.com/how-duolingo-streak-builds-habit)
  - Milestone animation: +1.7% new-user D7 — [Duolingo 2022](https://blog.duolingo.com/how-duolingo-streak-builds-habit)
  - Return-after-miss bonus: +27% gym visits — [Penn Today](https://penntoday.upenn.edu/news/wharton-study-best-ways-boost-workout-habits)
  - Repairable streaks soften post-break drop-off — [Silverman & Barasch 2023](https://udspace.udel.edu/handle/19716/34160)
- [PRIMARY] Year-in-Review shares were dominated by top-10% performers until persona cards were added. In a tiny friends group the "rank" card will only flatter the leader. — [Duolingo blog, 2022](https://blog.duolingo.com/year-in-review-behind-the-scenes)
- [PRIMARY] Apple competition scoring is a capped daily score over 7 days, computed from each person's own data, so it only needs a daily score exchange, not real-time sync. — [Apple Watch User Guide](https://support.apple.com/en-gw/guide/watch/apd68a69f5c7)
- [SECONDARY] Strava Local Legends ranks by effort count over a rolling window, a consistency metric any small group can compare from periodic snapshots. — [DC Rainmaker](https://dcrainmaker.com/2020/06/strava-legends-feature.html)

### Inferences
**Solo / local-first (no server needed). Fits Zenith's Dexie and mutation-bus architecture:**

| Mechanic | Source pattern | Evidence strength |
|---|---|---|
| Pre-granted freeze budget (e.g. 2–4 for 61 days) | Duolingo freezes | Primary, small effect |
| Comeback-day bonus / streak repair | Nature megastudy; JCR repair | Primary, strong |
| Low daily minimum ("one thing counts") | Duolingo one-lesson | Secondary, large (+40%) |
| Milestone celebrations at 3/7/14/21/30/45/61 | Duolingo animation | Primary, small |
| Nov 1 pledge / 7-day wager in XP | Duolingo wager, CTA | Primary (+14% D7) |
| Fresh-start re-entry (weekly, Dec 1, final-N) | Fresh Start Effect | Primary |
| Boss HP bar damaged by logging | Habitica (solo variant) | Mechanic only |
| Tiered season track + daily/weekly quests | Battle pass / Peloton Annual | Mechanic only |
| Date-locked one-day awards | Apple limited editions | Mechanic only |
| "7 perfect days anywhere in the window" | Apple Ring in New Year | Mechanic only |
| Advent doors with rotating reveal types | Novelty decay | Weak/indirect |
| Evening danger state (hourglass) | Snapchat / Forest | Mechanic only |
| Dec 31 recap card with persona archetype | Wrapped / Duolingo YIR | Strong (virality) |
| Rotating, non-repeating reminder copy | Duolingo bandit | Primary, unquantified |

**Needs a social graph (Zenith: optional Convex, weekly snapshots, small friends list):**
- Friend Streak / buddy pact (both log → shared flame). The highest-quantified social lever, and feasible via existing `follows` plus a daily or weekly snapshot.
- Capped 7-day duels (Apple-style), computable from `weeklyScores`-like snapshots.
- Rolling-window consistency leaderboard (Local Legend-style) on active days, not kg.
- Pooled co-op goal (Duolingo 50B XP), e.g. friends' combined sessions to defeat one shared boss.
- **Avoid**: party damage for others' misses (Habitica) and ranked leagues with demotion in a group of fewer than 10. Both amplify self-attributed failure, which JCR shows drives drop-off.

**Notification tone:** no published evidence supports guilt or "unhinged" tone. The playful tone is a Duolingo brand asset backed by a large algorithmic testing system, not a standalone tested lever. For a single user, prefer playful-but-not-shaming copy, rotated to avoid novelty decay. This also fits Zenith's gothic "Own the peak" voice better than mascot guilt.

### Gaps
- No published data on how social mechanics perform in very small groups (2–10 friends) as opposed to Duolingo-scale networks.
- No evidence found on optimal event length; whether 61 days vs 30-day sprints vs rolling seasons affects completion.
- No published data on event end-of-season effects: post-event drop-off or "season-end cliff" in habit apps.
