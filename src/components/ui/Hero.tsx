import type { CSSProperties, ReactNode } from "react";
import { useReducedMotion } from "../../hooks/useReducedMotion";

// Fixed per-ember params (not Math.random during render) so re-renders never reshuffle them.
const EMBERS = [
  { x: 8, d: 7.5, s: 0, z: 3 }, { x: 19, d: 9, s: 2.2, z: 2 }, { x: 31, d: 6.8, s: 4.1, z: 2 },
  { x: 46, d: 8.4, s: 1.3, z: 3 }, { x: 58, d: 10, s: 3.4, z: 2 }, { x: 71, d: 7.2, s: 5.2, z: 3 },
  { x: 83, d: 9.6, s: 0.8, z: 2 }, { x: 93, d: 8, s: 2.9, z: 3 },
];

export function Embers() {
  const reduced = useReducedMotion();
  if (reduced) return null;
  return (
    <div className="z-embers" aria-hidden>
      {EMBERS.map((e, i) => (
        <span key={i} style={{ left: `${e.x}%`, width: e.z, height: e.z, animationDuration: `${e.d}s`, animationDelay: `${e.s}s` }} />
      ))}
    </div>
  );
}

interface Props {
  /** "surface": dark glass with an accent aura. "ember": the red brand gradient. */
  tone?: "surface" | "ember";
  /** Aura / ember tint for the surface tone, e.g. `var(--info)` on Water. */
  color?: string;
  color2?: string;
  eyebrow?: ReactNode;
  right?: ReactNode;
  embers?: boolean;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

export function Hero({ tone = "surface", color, color2, eyebrow, right, embers = true, className, style, children }: Props) {
  const vars = { ...(color ? { "--hc": color } : {}), ...(color2 ? { "--hc2": color2 } : {}), ...style } as CSSProperties;
  return (
    <section className={`z-hero${tone === "ember" ? " z-hero--ember" : ""}${className ? ` ${className}` : ""}`} style={vars}>
      <div className="z-aura z-aura--a" aria-hidden />
      <div className="z-aura z-aura--b" aria-hidden />
      {embers && <Embers />}
      {(eyebrow || right) && (
        <div className="z-hero__head">
          {eyebrow ? <span className="gothic-eyebrow">{eyebrow}</span> : <span />}
          {right}
        </div>
      )}
      {children}
    </section>
  );
}
