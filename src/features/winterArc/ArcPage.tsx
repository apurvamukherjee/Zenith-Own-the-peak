import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  TbSnowflake, TbShieldHalf, TbGhost2, TbFlame, TbSwords, TbFlask, TbChevronRight, TbHome,
} from "react-icons/tb";
import { useSetting } from "../../hooks/useSettings";
import { todayKey } from "../../lib/date.utils";
import { ColdIcon } from "../../components/ColdIcon";
import { ARC_START, ARC_END, ARC_DAYS, ARC_RESERVES, dayIndex, daysUntilArc, shiftDate, phaseOf } from "../../lib/winterArc";
import { ARC_THEMES, MILESTONES, GAUNTLET, SECOND_WIND, chapterOf, themeFor, type ArcCellState } from "../../lib/arcCalendar";
import { BOSSES, WRAITH_HP } from "../../lib/arcBosses";
import { useTrainingToday } from "../dashboard/useHomeData";
import { useAchievements } from "../achievements/useAchievements";
import { useArcStates } from "./useWinterArc";
import { useArcBosses } from "./useArcBosses";
import { ArcDrillCard } from "./ArcDrillCard";
import { ArcSafety } from "./ArcSafety";
import "./arc.css";
import "./arcPage.css";

const CHAPTERS = Array.from({ length: Math.ceil(ARC_DAYS / 7) }, (_, i) => chapterOf(shiftDate(ARC_START, i * 7)));
const STATE_LABEL: Record<ArcCellState, string> = {
  done: "Kept", repaired: "Repaired", reserve: "Reserve", exempt: "Paused", owed: "Owed", scar: "Scar",
};
const PHASE_LABEL = { calibration: "Calibration", build: "Build", deload: "Deload", taper: "Taper", finale: "Finale" } as const;

function chapterPlan(n: number): string {
  if (n === 1) return "Trials #1 · calibration";
  if (n === 5) return "Deload · Second Wind · Trials #2";
  const boss = BOSSES.find((b) => b.chapter === n);
  if (n === 9) return `${boss?.title ?? "Taper"} · Final Trials · Murph`;
  return boss ? `Boss · ${boss.title}` : "";
}

// Deterministic so the frost grows the same shape on every visit.
function frostPaths(seed: number): string[] {
  let s = seed;
  const rand = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  const out: string[] = [];
  const grow = (x: number, y: number, angle: number, len: number, depth: number) => {
    if (depth === 0 || len < 4) return;
    const x2 = x + Math.cos(angle) * len, y2 = y + Math.sin(angle) * len;
    out.push(`M${x.toFixed(1)} ${y.toFixed(1)}L${x2.toFixed(1)} ${y2.toFixed(1)}`);
    grow(x2, y2, angle + (rand() - 0.5) * 0.5, len * 0.78, depth - 1);
    if (rand() < 0.75) grow(x2, y2, angle + 0.9 + rand() * 0.3, len * 0.5, depth - 1);
    if (rand() < 0.75) grow(x2, y2, angle - 0.9 - rand() * 0.3, len * 0.5, depth - 1);
  };
  for (let i = 0; i < 5; i++) grow(0, 0, 0.12 + i * 0.32 + rand() * 0.1, 46 + rand() * 30, 6);
  return out;
}

function Frost({ className }: { className: string }) {
  const paths = useMemo(() => frostPaths(className.includes("right") ? 7 : 3), [className]);
  return (
    <svg className={`arc-frost ${className}`} viewBox="0 0 260 260" aria-hidden>
      {paths.map((d, i) => <path key={i} d={d} pathLength={1} style={{ animationDelay: `${(i % 24) * 0.08}s` }} />)}
    </svg>
  );
}

function Sky() {
  const flakes = useMemo(() => Array.from({ length: 44 }, (_, i) => ({
    left: `${(i * 37.7) % 100}%`, size: 1.5 + (i % 4) * 0.9,
    duration: 7 + ((i * 7) % 8), delay: -((i * 1.3) % 11), dx: ((i % 5) - 2) * 16,
  })), []);
  const crystals = useMemo(() => Array.from({ length: 9 }, (_, i) => ({
    left: `${(i * 53.3 + 6) % 96}%`, size: 10 + (i % 3) * 6,
    duration: 11 + (i % 4) * 3, delay: -((i * 2.7) % 13), dx: ((i % 3) - 1) * 30,
  })), []);
  return (
    <div className="arc-sky" aria-hidden>
      <div className="arc-sky__fog" />
      <Frost className="arc-frost--left" />
      <Frost className="arc-frost--right" />
      {flakes.map((f, i) => (
        <i key={i} className="snow arc-sky__flake" style={{
          left: f.left, width: f.size, height: f.size, animationDuration: `${f.duration}s`, animationDelay: `${f.delay}s`,
          ["--dx" as string]: `${f.dx}px`,
        }} />
      ))}
      {crystals.map((c, i) => (
        <span key={i} className="snow arc-sky__crystal" style={{
          left: c.left, animationDuration: `${c.duration}s`, animationDelay: `${c.delay}s`, ["--dx" as string]: `${c.dx}px`,
        }}><TbSnowflake size={c.size} /></span>
      ))}
    </div>
  );
}

export function ArcPage() {
  const date = todayKey();
  const joined = String(useSetting("arcJoined"));
  const reserves = Number(useSetting("arcReserves"));
  const training = useTrainingToday();
  const states = useArcStates();
  const bosses = useArcBosses(date);
  const { views } = useAchievements();
  const [picked, setPicked] = useState<string | null>(null);
  const { hash } = useLocation();
  // "How it works" links land here as /arc#how — scroll the explainer into view.
  useEffect(() => {
    if (hash === "#how") document.getElementById("arc-how")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [hash]);

  const count = (k: ArcCellState) => [...states.values()].filter((s) => s === k).length;
  const kept = count("done") + count("repaired");
  const until = daysUntilArc(date);
  const day = Math.min(ARC_DAYS, dayIndex(date) + 1);
  const live = until <= 0 && date <= ARC_END;
  const reservesUsed = [...states.entries()].filter(([d, s]) => s === "reserve" && d >= (date >= SECOND_WIND ? SECOND_WIND : ARC_START)).length;
  const blackIce = !!joined && reserves === 0;
  const reservesLeft = joined ? Math.max(0, reserves - reservesUsed) : ARC_RESERVES;
  const badges = views.filter((v) => v.def.group === "winter");
  const nextThemes = ARC_THEMES.filter((t) => t.date >= date).slice(0, 4);
  const sel = picked ? { date: picked, state: states.get(picked), theme: themeFor(picked) } : null;

  return (
    <div className="arc-page">
      <Sky />
      <div className="arc-page__body">
        <header className="arc-hero">
          <div className="arc-card__eyebrow"><TbSnowflake size={14} /> Winter Arc · the final 61</div>
          <h1 className="arc-hero__title display">
            {until > 0 ? `${until} day${until === 1 ? "" : "s"} out` : live ? `Day ${day}` : "Arc closed"}
            {live && <small> / {ARC_DAYS}</small>}
          </h1>
          <p className="arc-hero__sub">
            {live ? `${PHASE_LABEL[phaseOf(date)]} · Chapter ${chapterOf(date).n} of ${CHAPTERS.length}`
              : until > 0 ? "Nov 1 → Dec 31 · one drill a day, every day" : `Closed Dec 31 · ${kept} of ${ARC_DAYS} kept`}
          </p>
          <div className="arc-hero__stats">
            <div><b>{kept}</b><span><TbFlame size={12} /> kept</span></div>
            <div><b>{reservesLeft}</b><span><TbShieldHalf size={12} /> {blackIce ? "Black Ice" : "reserves"}</span></div>
            <div><b>{count("scar")}</b><span>scars</span></div>
            <div><b>{bosses?.wraith ?? WRAITH_HP}</b><span><TbGhost2 size={12} /> Wraith HP</span></div>
          </div>
          <div className="arc-hero__bar" role="progressbar" aria-valuenow={kept} aria-valuemin={0} aria-valuemax={ARC_DAYS} aria-label="Days kept">
            <i style={{ width: `${kept / ARC_DAYS * 100}%` }} />
            {MILESTONES.map((m) => <em key={m} className={kept >= m ? "is-on" : ""} style={{ left: `${m / ARC_DAYS * 100}%` }} title={`${m} days`} />)}
          </div>
        </header>

        <section className="arc-section">
          <ArcDrillCard trainedToday={training?.muscles} gate={false} />
        </section>

        <section id="arc-how" className="arc-section arc-glass">
          <h2 className="arc-h2">How the arc works</h2>
          <div className="arc-how">
            <details open={!joined}>
              <summary>One drill a day</summary>
              <p>Every day picks a hostel-room drill — the same one on every phone. It ramps up over the 61 days, halves in the deload (Nov 29–Dec 5) and the taper, and dodges whatever muscles you trained. Some days it comes as an EMOM, 20/10 intervals or a ladder; the card has a timer.</p>
              <p>Sore or wrecked? Tap it and the drill becomes 8 minutes of McGill Big 3 + hips. The chain still counts.</p>
            </details>
            <details open={!joined}>
              <summary>Miss a day → you owe it</summary>
              <p>A missed day isn't over: tomorrow's drill carries <b>+50% debt</b> per missed day (2 days max, never past 1.5× the movement's peak). Clear it and the missed days count as <b>repaired</b>.</p>
              <p>What debt can't reach, your <b>3 reserves</b> cover automatically. Anything left becomes a <b>scar</b>. Black Ice means zero reserves. The <b>5-minute minimum</b> keeps the chain but repays nothing.</p>
            </details>
            <details>
              <summary>Sick, exams, festivals</summary>
              <p><b>Sick / injured</b> pauses today or yesterday — no miss, no debt. <b>Exam Mode</b> (one week, you arm it) trims pushes and adds a study item. The <b>Festival Gauntlet</b> (Nov 8–19, Kali Puja → Jagaddhatri) only asks for 9 of 12 days: survive, don't thrive.</p>
            </details>
            <details>
              <summary>Chapters, bosses and the Wraith</summary>
              <p>Nine Sunday-start chapters. Most have a <TbSwords size={12} /> boss you can fight any day that week; rematches put your old score up as the boss's HP. <TbFlask size={12} /> Trials (push-ups, plank, Death-by) run in week 1, from Dec 1 and on Dec 30 — Wrapped compares them. Dec 31 is Hostel Murph.</p>
              <p>The <TbGhost2 size={12} /> Winter Wraith has {WRAITH_HP} HP: kept days and bosses hurt it, scars heal it. On a chapter's first day you can stake 50 XP on a perfect week.</p>
            </details>
            <details>
              <summary>The gate, pushes and XP</summary>
              <p>Until the drill's handled, Home opens behind the Arc Gate. Skipping means typing <i>"I'm skipping today. I owe one drill."</i> and an if-then plan for tomorrow. Pushes escalate through the day (up to 5, quiet hours before bed), and the morning after a miss always opens with a comeback, not a roast.</p>
              <p>Drill and full checklist earn 1.5× XP. The first drill after a miss earns a +15 comeback bonus. Dec 1 is the Second Wind: Phase 1 scars archive and reserves reset.</p>
            </details>
            <details>
              <summary>Stay safe</summary>
              <ArcSafety />
            </details>
          </div>
          <p className="arc-foot">Kolkata dates come from panchang listings — a festival can land a day off.</p>
        </section>

        <section className="arc-section arc-glass">
          <h2 className="arc-h2">The frost map</h2>
          <div className="arc-map" role="grid" aria-label="Winter Arc days">
            {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => <span key={i} className="arc-map__dow">{d}</span>)}
            {Array.from({ length: ARC_DAYS }, (_, i) => {
              const d = shiftDate(ARC_START, i);
              const st = states.get(d);
              const theme = themeFor(d);
              const gauntlet = d >= GAUNTLET.start && d <= GAUNTLET.end;
              return (
                <button key={d} type="button" role="gridcell"
                  className={`arc-map__cell${st ? ` is-${st}` : d > date ? " is-future" : ""}${d === date ? " is-today" : ""}${gauntlet ? " is-gauntlet" : ""}${picked === d ? " is-picked" : ""}`}
                  aria-label={`${d}${st ? `: ${STATE_LABEL[st]}` : ""}${theme ? ` — ${theme.title}` : ""}`}
                  onClick={() => setPicked(picked === d ? null : d)}>
                  {Number(d.slice(8))}
                  {theme && <i className="arc-map__dot" />}
                </button>
              );
            })}
          </div>
          {sel && (
            <div className="arc-map__detail">
              <b>{new Date(sel.date + "T00:00").toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })}</b>
              {" · "}{sel.state ? STATE_LABEL[sel.state] : sel.date > date ? "Ahead" : "—"}
              {sel.theme && <p>{sel.theme.indoor && <TbHome size={12} />} <b>{sel.theme.title}.</b> {sel.theme.copy}</p>}
            </div>
          )}
          <div className="arc-legend">
            {(["done", "repaired", "reserve", "exempt", "owed", "scar"] as const).map((k) => (
              <span key={k}><i className={`arc-map__cell is-${k}`} /> {STATE_LABEL[k]}</span>
            ))}
            <span><i className="arc-map__cell is-gauntlet" /> Gauntlet</span>
          </div>
        </section>

        <section className="arc-section arc-glass">
          <h2 className="arc-h2">Nine chapters</h2>
          <ol className="arc-chapters">
            {CHAPTERS.map((c) => {
              const len = dayIndex(c.end) - dayIndex(c.start) + 1;
              let k = 0;
              for (let d = c.start; d <= c.end; d = shiftDate(d, 1)) if (states.get(d) === "done" || states.get(d) === "repaired") k++;
              const now = date >= c.start && date <= c.end;
              return (
                <li key={c.n} className={`${now ? "is-now" : ""}${date > c.end ? " is-past" : ""}`}>
                  <span className="arc-chapters__n">{c.n}</span>
                  <div>
                    <b>{new Date(c.start + "T00:00").toLocaleDateString(undefined, { day: "numeric", month: "short" })} – {new Date(c.end + "T00:00").toLocaleDateString(undefined, { day: "numeric", month: "short" })}</b>
                    <span>{chapterPlan(c.n)}</span>
                  </div>
                  <em>{k}/{len}</em>
                </li>
              );
            })}
          </ol>
        </section>

        {nextThemes.length > 0 && (
          <section className="arc-section arc-glass">
            <h2 className="arc-h2">Coming up</h2>
            <ul className="arc-upcoming">
              {nextThemes.map((t) => (
                <li key={t.date}>
                  <span>{new Date(t.date + "T00:00").toLocaleDateString(undefined, { day: "numeric", month: "short" })}</span>
                  <div><b>{t.indoor && <TbHome size={12} />} {t.title}</b><p>{t.copy}</p></div>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="arc-section arc-glass">
          <div className="arc-h2row">
            <h2 className="arc-h2">Winter badges</h2>
            <Link to="/hall" className="arc-card__link">Hall <TbChevronRight size={13} /></Link>
          </div>
          <div className="arc-badges">
            {badges.map(({ def, unlocked, ratio }) => {
              const hidden = def.mystery && !unlocked;
              return (
                <div key={def.id} className={`arc-badge${unlocked ? " is-on" : ""}`} title={hidden ? def.teaser : def.hint}>
                  <span className="arc-badge__glyph"><ColdIcon glyph={hidden ? "void" : def.glyph} size={22} /></span>
                  <b>{hidden ? "???" : def.name}</b>
                  <span className="arc-badge__bar"><i style={{ width: `${(unlocked ? 1 : ratio) * 100}%` }} /></span>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
