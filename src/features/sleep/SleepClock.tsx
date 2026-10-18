import { useId } from "react";
import { motion } from "framer-motion";
import { TbMoon, TbSun } from "react-icons/tb";

const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
};

// Geometry lives in a fixed viewBox; the dial itself is fluid (sl-clock in
// sleep.css) and everything inside scales with it.
const VB = 150;
const pct = (v: number) => `${(v / VB) * 100}%`;

// 24-hour dial (midnight at the top) with the night drawn as an arc from
// bedtime to wake-up. Angles are clockwise from 12 o'clock.
export function SleepClock({ sleepAt, wakeAt, reduced, children }: {
  sleepAt?: string; wakeAt?: string; reduced?: boolean; children?: React.ReactNode;
}) {
  const uid = useId().replace(/:/g, "");
  const size = VB;
  const c = size / 2;
  const r = c - 14;
  const pt = (min: number, rad = r) => {
    const a = (min / 1440) * 2 * Math.PI - Math.PI / 2;
    return [c + rad * Math.cos(a), c + rad * Math.sin(a)] as const;
  };
  const has = !!(sleepAt && wakeAt);
  const s = has ? toMin(sleepAt!) : 0;
  const e = has ? toMin(wakeAt!) : 0;
  const span = ((e - s) % 1440 + 1440) % 1440;
  const [sx, sy] = pt(s);
  const [ex, ey] = pt(e);
  const arc = `M ${sx} ${sy} A ${r} ${r} 0 ${span > 720 ? 1 : 0} 1 ${ex} ${ey}`;
  const [mx, my] = pt(s, r);
  const [wx, wy] = pt(e, r);

  return (
    <div className="sl-clock">
      <svg viewBox={`0 0 ${size} ${size}`} aria-hidden>
        <defs>
          <linearGradient id={`${uid}-g`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" style={{ stopColor: "var(--info)" }} />
            <stop offset="100%" style={{ stopColor: "var(--gold)" }} />
          </linearGradient>
        </defs>
        <circle cx={c} cy={c} r={r} fill="none" strokeWidth={12} style={{ stroke: "color-mix(in srgb, var(--gold) 10%, transparent)" }} />
        {Array.from({ length: 24 }, (_, h) => {
          const [x1, y1] = pt(h * 60, r - 12);
          const [x2, y2] = pt(h * 60, r - (h % 6 === 0 ? 19 : 15));
          return <line key={h} x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth={h % 6 === 0 ? 1.6 : 1} style={{ stroke: "color-mix(in srgb, var(--ink) 28%, transparent)" }} />;
        })}
        {[0, 6, 12, 18].map((h) => {
          const [x, y] = pt(h * 60, r - 28);
          return <text key={h} x={x} y={y + 3} textAnchor="middle" fontSize="8.5" fontWeight="700" style={{ fill: "var(--ink-soft)" }}>{h === 0 ? "00" : h}</text>;
        })}
        {has && (
          <motion.path d={arc} fill="none" strokeWidth={12} strokeLinecap="round"
            style={{ stroke: `url(#${uid}-g)`, filter: "drop-shadow(0 0 5px color-mix(in srgb, var(--gold) 60%, transparent))" }}
            initial={reduced ? false : { pathLength: 0 }} animate={{ pathLength: 1 }}
            transition={{ type: "spring", stiffness: 40, damping: 14, delay: 0.2 }} />
        )}
      </svg>
      {has && (
        <>
          <span className="sl-clock__pin" style={{ left: pct(mx), top: pct(my), color: "var(--info)" }}><TbMoon size="1em" /></span>
          <span className="sl-clock__pin" style={{ left: pct(wx), top: pct(wy), color: "var(--gold)" }}><TbSun size="1em" /></span>
        </>
      )}
      <div className="sl-clock__center">{children}</div>
    </div>
  );
}
