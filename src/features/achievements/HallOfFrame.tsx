import { useEffect } from "react";
import { Progress } from "antd";
import { motion } from "framer-motion";
import { TbTrophy } from "react-icons/tb";
import { PageTransition } from "../../components/PageTransition";
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
          <div style={{ fontSize: 11.5, color: "var(--ink-soft)", marginTop: 2, fontStyle: hidden ? "italic" : "normal" }}>
            {sub}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        {unlocked ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 11, fontWeight: 700 }}>
            <span style={{ textTransform: "uppercase", letterSpacing: 1, color: tier.ring, textShadow: `0 0 12px ${tier.glow}` }}>
              {tier.label}
            </span>
            <span style={{ color: "var(--ink-soft)" }}>
              {unlockedAt ? prettyDate(new Date(unlockedAt).toISOString()) : ""}
            </span>
          </div>
        ) : hidden ? (
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "var(--ink-soft)", opacity: 0.7 }}>
            Locked · Mystery
          </div>
        ) : (
          <div>
            <Progress percent={Math.round(ratio * 100)} showInfo={false} size="small" strokeColor={tier.ring} trailColor="var(--border)" />
            <div style={{ fontSize: 11, color: "var(--ink-soft)", marginTop: 2 }}>{value}</div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export function HallOfFrame() {
  const { views, unlockedCount, total, ready } = useAchievements();
  const { totalXP, weekXP, level, next, progress: lvProgress } = useXP();

  useEffect(() => { void markAllSeen(); }, []);

  const pct = total ? Math.round((unlockedCount / total) * 100) : 0;

  return (
    <PageTransition>
      <div style={{ position: "relative", overflow: "hidden", borderRadius: 20, padding: "22px 18px", marginBottom: 18, background: "var(--hero)", color: "#fff" }}>
        <div aria-hidden style={{ position: "absolute", top: -40, right: -30, width: 180, height: 180, borderRadius: "50%", background: "rgba(255,255,255,0.10)", filter: "blur(6px)" }} />
        <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 58, height: 58, borderRadius: 16, background: "rgba(255,255,255,0.16)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <TbTrophy size={30} />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", opacity: 0.85 }}>Hall of Frame</div>
            <div className="display" style={{ fontSize: 30, fontWeight: 800, lineHeight: 1.05 }}>
              <AnimatedNumber value={unlockedCount} /> <span style={{ opacity: 0.7, fontSize: 20 }}>/ {total}</span>
            </div>
            <div style={{ fontSize: 12.5, opacity: 0.9, marginTop: 2 }}>conquered · {pct}% · {MYSTERY_COUNT} hidden</div>
          </div>
        </div>
        <div style={{ marginTop: 14 }}>
          <Progress percent={pct} showInfo={false} strokeColor="#fff" trailColor="rgba(255,255,255,0.22)" />
        </div>

        {/* XP + Level section */}
        <div style={{ marginTop: 16, padding: "12px 14px", background: "rgba(0,0,0,0.25)", borderRadius: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div>
              <span style={{ fontFamily: '"Cinzel", serif', fontWeight: 800, fontSize: 16, letterSpacing: "0.06em" }}>
                Lv.{level.level} — {level.name}
              </span>
              {next && (
                <span style={{ fontSize: 10, opacity: 0.65, marginLeft: 8 }}>→ {next.name}</span>
              )}
            </div>
            <div style={{ textAlign: "right", fontSize: 11, opacity: 0.8 }}>
              <div style={{ fontWeight: 700 }}>{totalXP.toLocaleString()} XP</div>
              <div style={{ opacity: 0.65 }}>+{weekXP} this week</div>
            </div>
          </div>
          {next && (
            <div style={{ height: 4, background: "rgba(255,255,255,0.2)", borderRadius: 2, overflow: "hidden" }}>
              <div style={{
                height: "100%", background: "#fff", borderRadius: 2,
                width: `${Math.round(lvProgress * 100)}%`,
                transition: "width 800ms cubic-bezier(0.22,1,0.36,1)",
              }} />
            </div>
          )}
        </div>
      </div>

      {!ready && (
        <div style={{ textAlign: "center", color: "var(--ink-soft)", fontSize: 13, padding: 20 }}>Tallying the damage…</div>
      )}

      {ready && GROUP_ORDER.map((group) => {
        const inGroup = views.filter((v) => v.def.group === group);
        if (!inGroup.length) return null;
        const won = inGroup.filter((v) => v.unlocked).length;
        return (
          <div key={group} style={{ marginBottom: 22 }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 10 }}>
              <h3 className="display" style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>{GROUP_LABEL[group]}</h3>
              <span style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-soft)" }}>{won}/{inGroup.length}</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {inGroup.map((v, i) => <BadgeCard key={v.def.id} v={v} index={i} />)}
            </div>
          </div>
        );
      })}
    </PageTransition>
  );
}
