interface Props {
  percent: number;
  height?: number;
  /** Translucent track + white fill, for use on the red hero gradients. */
  onHero?: boolean;
  label?: string;
}

const TICKS = [25, 50, 75];

export function GlowBar({ percent, height = 8, onHero, label }: Props) {
  const pct = Math.max(0, Math.min(100, percent));
  const done = pct >= 100;
  return (
    <div
      role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)} aria-label={label}
      className={`glowbar${onHero ? " glowbar--hero" : ""}${done ? " glowbar--done" : ""}`}
      style={{ height }}
    >
      <div className="glowbar__fill" style={{ transform: `scaleX(${pct / 100})` }} />
      {TICKS.map((t) => (
        <span key={t} aria-hidden className={`glowbar__tick${pct >= t ? " is-passed" : ""}`} style={{ left: `${t}%` }} />
      ))}
    </div>
  );
}
