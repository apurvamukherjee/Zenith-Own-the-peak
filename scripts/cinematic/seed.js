// Runs inside the page (dev server). Seeds ~6 weeks of believable history.
async () => {
  const { db } = await import('/src/db/db.ts');
  const { todayKey, weekKey } = await import('/src/lib/date.utils.ts');
  const { estimate1RM } = await import('/src/lib/workout.utils.ts');
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const DAY = 864e5, now = Date.now();
  const dayKey = (i) => todayKey(new Date(now - i * DAY));
  const at = (i, h, m = 0) => { const d = new Date(now - i * DAY); d.setHours(h, m, 0, 0); return d.getTime(); };
  const sched = new Map((await db.weekSchedule.toArray()).map((w) => [w.weekday, w.dayId]));
  const dayEx = await db.dayExercises.toArray();
  const exNames = new Map((await db.exercises.toArray()).map((e) => [e.id, e.name]));
  const best = new Map();
  const W = [], S = [], M = [], SETS = [], BW = [];
  for (let i = 42; i >= 0; i--) {
    const date = dayKey(i), today = i === 0;
    const skip = !today && rnd() < 0.08;           // a few off days, keeps it human
    if (skip) continue;
    // water
    const glasses = today ? 5 : 8 + Math.floor(rnd() * 6);
    for (let g = 0; g < glasses; g++) W.push({ date, amountMl: g % 3 ? 250 : 500, timestamp: at(i, 7 + g) });
    // sleep
    const bed = 22 + Math.floor(rnd() * 2), bm = Math.floor(rnd() * 4) * 15, wake = 6 + Math.floor(rnd() * 2);
    const dur = (24 - bed) * 60 - bm + wake * 60;
    S.push({ date, sleepAt: `${String(bed).padStart(2, '0')}:${String(bm).padStart(2, '0')}`, wakeAt: `0${wake}:00`, durationMin: dur, quality: 3 + Math.floor(rnd() * 3) });
    // meals
    const meals = [['Oats + whey', 'breakfast', 38, 520, 9, 70], ['Chicken rice bowl', 'lunch', 46, 680, 14, 88], ['Paneer bhurji + roti', 'dinner', 34, 610, 26, 52], ['Greek yogurt + banana', 'snack', 18, 260, 4, 38]];
    for (const [k, [name, mealType, p, c, f, cb]] of meals.entries()) {
      if (today && k > 1) break;
      M.push({ date, time: ['08:30', '13:30', '20:30', '17:00'][k], name, mealType, protein: p + Math.round(rnd() * 6), calories: c, fatG: f, carbsG: cb });
    }
    if (i % 4 === 0) BW.push({ date, kg: +(71.8 + (42 - i) * 0.045 + rnd() * 0.3).toFixed(1) });
    // training per the plan's weekday map
    const dayId = sched.get(new Date(date + 'T00:00').getDay());
    if (!dayId) continue;
    const exs = dayEx.filter((d) => d.dayId === dayId).sort((a, b) => a.order - b.order);
    const sessionId = await db.workoutSessions.add({ date, weekKey: weekKey(date), dayId, createdAt: at(i, 18), durationMin: 58 + Math.floor(rnd() * 15) });
    const progress = (42 - i) / 42;
    const doEx = today ? exs.slice(0, 2) : exs;     // today: mid-session
    let t = at(i, 18, 5);
    for (const ex of doEx) {
      const base = Math.max(10, ex.weightKg || 40);
      const w = Math.round((base * (0.82 + 0.28 * progress)) / 2.5) * 2.5;
      for (let s = 1; s <= ex.sets; s++) {
        const reps = ex.repHigh - Math.floor(rnd() * (ex.repHigh - ex.repLow + 1));
        const e1rm = estimate1RM(w, reps), name = exNames.get(ex.exerciseId) ?? 'Exercise';
        const isPR = e1rm > (best.get(name) ?? 0); best.set(name, Math.max(best.get(name) ?? 0, e1rm));
        t += 150000;
        SETS.push({ sessionId, date, exerciseId: ex.exerciseId, exerciseName: name, setIndex: s, weightKg: w, reps, e1rm, isPR, createdAt: t });
      }
    }
  }
  await db.water.bulkAdd(W); await db.sleep.bulkAdd(S); await db.meals.bulkAdd(M);
  await db.workoutSets.bulkAdd(SETS); await db.bodyweight.bulkAdd(BW);
  // History earns XP the app would have granted live.
  const xp = SETS.length * 2 + 900;
  await db.xpEvents.add({ action: 'set', xp, weekKey: weekKey(), createdAt: now - 30 * DAY });
  for (const [key, value] of Object.entries({ onboarded: 1, coachLogger: 1, coachPlanner: 1, coachNutrition: 1, xpTotalCache: xp }))
    await db.settings.put({ key, value });
  return { water: W.length, sleep: S.length, meals: M.length, sets: SETS.length };
}
