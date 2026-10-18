import { useEffect } from "react";
import { motion } from "framer-motion";
import { PageTransition } from "../../components/PageTransition";
import { SectionTitle } from "../../components/SectionTitle";
import { Hero } from "../../components/ui/Hero";
import { Rings } from "../../components/ui/Rings";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import "./hall.css";
import { AnimatedNumber } from "../../components/AnimatedNumber";
import { ColdIcon } from "../../components/ColdIcon";
import { prettyDate } from "../../lib/date.utils";
import { TIER_META, TIER_RANK, GROUP_LABEL, MYSTERY_COUNT, type AchGroup } from "../../lib/achievements";
import { useAchievements, markAllSeen, type AchievementView } from "./useAchievements";
import { useXP } from "../../hooks/useXP";

const GROUP_ORDER: AchGroup[] = [
  "streak", "iron", "discipline", "water", "sleep", "mind", "road", "table", "body", "mystery",
];

// small tier notches (I..V) in the medallion corner
function Pips({ rank, on }: { rank: number; on: boolean }) {
  return (
    <div style={{ display: "flex", gap: 2, position: "absolute", bottom: 4, right: 5 }}>
      {Array.from({ length: rank }).map((_, i) => (
        <span key={i} style={{
          width: 3, height: 3, borderRadius: 1,
          background: on ? "rgba(255,255,255,0.9)" : "var(--ink-soft)",
          opacity: on ? 0.9 : 0.5,
        }} />
      ))}
    </div>
  );
}

function BadgeCard({ v, index }: { v: AchievementView; index: number }) {
  const { def, unlocked, unlockedAt, ratio, value } = v;
  const tier = TIER_META[def.tier];
  const hidden = !!def.mystery && !unlocked;

  const title = hidden ? "???" : def.name;
  const sub = unlocked ? def.desc : hidden ? def.teaser ?? "Hidden objective." : def.hint;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: Math.min(index * 0.025, 0.35), type: "spring", stiffness: 260, damping: 24 }}
      whileTap={{ scale: 0.97 }}
      style={{
        position: "relative", borderRadius: 18, padding: 14, overflow: "hidden",
        background: "var(--surface)",
        border: `1px solid ${unlocked ? tier.ring : "var(--border)"}`,
        boxShadow: unlocked ? `0 6px 26px ${tier.glow}` : "none",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ position: "relative", flexShrink: 0 }}>
          <div aria-hidden style={{
            width: 52, height: 52, borderRadius: 15,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: unlocked ? tier.grad : "var(--bg)",
            border: unlocked ? "none" : "1px dashed var(--border)",
            color: unlocked ? "#fff" : "var(--ink-soft)",
            filter: unlocked ? "none" : "grayscale(1)",
            opacity: unlocked ? 1 : 0.55,   // disabled-but-visible
          }}>
            <ColdIcon glyph={hidden ? "void" : def.glyph} size={26} />
          </div>
          <Pips rank={TIER_RANK[def.tier]} on={unlocked} />
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="display" style={{
            fontSize: 15, fontWeight: 800, lineHeight: 1.15,
            color: unlocked ? "var(--ink)" : "var(--ink-soft)",
            letterSpacing: hidden ? 2 : 0,
          }}>
            {title}
          </div>
          <div style={{ fontSize: 12.5, color: "var(--ink-soft)", marginTop: 2, fontStyle: hidden ? "italic" : "normal" }}>
            {sub}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        {unlocked ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12, fontWeight: 700 }}>
            <span style={{ textTransform: "uppercase", letterSpacing: 1, color: `color-mix(in srgb, ${tier.ring} 65%, var(--ink))`, textShadow: `0 0 12px ${tier.glow}` }}>
              {tier.label}
            </span>
            <span style={{ color: "var(--ink-soft)" }}>
              {unlockedAt ? prettyDate(new Date(unlockedAt).toISOString()) : ""}
            </span>
          </div>
        ) : hidden ? (
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "var(--ink-soft)", opacity: 0.7 }}>
            Locked · Mystery
          </div>
        ) : (
          <div>
            <div className="hf-bar"><i style={{ width: `${Math.round(ratio * 100)}%`, background: tier.ring }} /></div>
            <div style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 4 }}>{value}</div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export function HallOfFrame() {
  const { views, unlockedCount, total, ready } = useAchievements();
  const { totalXP, weekXP, level, next, progress: lvProgress } = useXP();
  const reduced = useReducedMotion();

  useEffect(() => { void markAllSeen(); }, []);

  const pct = total ? Math.round((unlockedCount / total) * 100) : 0;

  return (
    <PageTransition>
      <SectionTitle eyebrow="Achievements" title="Hall of Frame" />
      <Hero tone="ember" className="hf-hero" eyebrow="Conquered" right={<span className="hf-pill">{MYSTERY_COUNT} hidden</span>}>
        <div className="hf-hero__row">
          <Rings size={104} stroke={10} reduced={reduced} rings={[{ key: "a", pct, color: ["#ffffff", "#ffd76b"] }]}>
            <span className="hf-hero__pct display">{pct}%</span>
          </Rings>
          <div>
            <div className="z-hero__big"><AnimatedNumber value={unlockedCount} /><small>/ {total}</small></div>
            <div className="z-hero__sub">badges earned across {GROUP_ORDER.length} groups</div>
          </div>
        </div>
        <div className="hf-level">
          <div className="hf-level__top">
            <span className="hf-level__name">Lv.{level.level} — {level.name}{next && <em> → {next.name}</em>}</span>
            <span className="hf-level__xp"><b>{totalXP.toLocaleString()} XP</b> +{weekXP} this week</span>
          </div>
          {next && (
            <div className="hf-level__bar">
              <motion.i style={{ width: "100%", transformOrigin: "0 50%" }} initial={reduced ? false : { scaleX: 0 }} animate={{ scaleX: lvProgress }} transition={{ type: "spring", stiffness: 60, damping: 16, delay: 0.3 }} />
            </div>
          )}
        </div>
      </Hero>

      {!ready && (
        <div style={{ textAlign: "center", color: "var(--ink-soft)", fontSize: 13, padding: 20 }}>Tallying the damage…</div>
      )}

      {ready && GROUP_ORDER.map((group) => {
        const inGroup = views.filter((v) => v.def.group === group);
        if (!inGroup.length) return null;
        const won = inGroup.filter((v) => v.unlocked).length;
        return (
          <div key={group}>
            <div className="z-list-title"><span>{GROUP_LABEL[group]}</span><span>{won}/{inGroup.length}</span></div>
            <div className="hf-grid">
              {inGroup.map((v, i) => <BadgeCard key={v.def.id} v={v} index={i} />)}
            </div>
          </div>
        );
      })}
    </PageTransition>
  );
}
