import { useEffect, useRef, useState } from "react";
import { Card, Button, Progress, Alert, App } from "antd";
import { SmartInputNumber } from "../../components/SmartInputNumber";
import { TbPlus, TbArrowBackUp, TbRefresh } from "react-icons/tb";
import { BarChart, Bar, XAxis, ResponsiveContainer, Cell } from "recharts";
import { PageTransition } from "../../components/PageTransition";
import { SectionTitle } from "../../components/SectionTitle";
import { EmptyState } from "../../components/EmptyState";
import { ColdIcon } from "../../components/ColdIcon";
import { useTodayWater, useWeeklyWater, useWorkoutToday, addWater, undoLastWater, computeStatus } from "./useWater";
import { useSetting } from "../../hooks/useSettings";
import { useTokens } from "../../hooks/useTokens";
import { useOptimisticNumber } from "../../hooks/useOptimistic";
import { usePullToRefresh } from "../../hooks/usePullToRefresh";
import { hapticLight, hapticSuccess } from "../../lib/haptics";
import { playBellDing } from "../../lib/audio";

const QUICK = [250, 500, 1000];

export function WaterPage() {
  const t = useTokens();
  const { message } = App.useApp();
  const { total, entries } = useTodayWater();
  const weekly = useWeeklyWater();
  const trained = useWorkoutToday();
  const base = useSetting("waterGoalMl");
  const bump = useSetting("workoutBumpMl");
  const wakeHour = useSetting("wakeHour");
  const windowH = useSetting("wakingWindowH");
  const [custom, setCustom] = useState<number>();

  const goal = base + (trained ? bump : 0);
  const { optimistic, commit } = useOptimisticNumber(total, "water");
  const { status, deltaMl } = computeStatus(optimistic, goal, wakeHour, windowH);
  const pct = Math.min(100, Math.round((optimistic / goal) * 100));

  // Pull-to-refresh — feels native even though useLiveQuery already keeps
  // data current. Small dopamine hit + confirms the local-first design.
  const pageRef = useRef<HTMLDivElement | null>(null);
  const { pullPx, refreshing, primed } = usePullToRefresh(pageRef, async () => {
    // useLiveQuery is already reactive; just tick a state to force a
    // visual refresh cycle. 400 ms delay reads as a "checked" beat.
    await new Promise((r) => setTimeout(r, 400));
    void hapticLight();
  });
  const [showedGoalToast, setShowedGoalToast] = useState(false);
  useEffect(() => {
    if (optimistic >= goal && !showedGoalToast) {
      setShowedGoalToast(true);
      // A once-a-day payoff moment — worth the same "impact" sound cue as
      // rest-timer completion in Focus Mode, unlike the quick-add taps above
      // which stay haptic-only since they can fire many times an hour.
      void hapticSuccess();
      playBellDing();
      message.success("Daily goal reached!");
    }
  }, [optimistic, goal, showedGoalToast, message]);

  const banner = {
    "done": { type: "success" as const, msg: "Goal smashed — nice work staying hydrated." },
    "on-track": { type: "info" as const, msg: "On track. Keep sipping through the day." },
    "behind": { type: "warning" as const, msg: `A bit behind — about ${Math.abs(deltaMl)} ml under where you should be by now.` },
    "way-behind": { type: "error" as const, msg: `Way behind — you're ${Math.abs(deltaMl)} ml short. Drink up.` },
  }[status];

  async function log(ml: number) {
    void hapticLight();
    await commit(ml, () => addWater(ml), "water entry");
  }

  return (
    <PageTransition>
      <div ref={pageRef} style={{ position: "relative" }}>
        {/* Pull-to-refresh visual */}
        {(pullPx > 0 || refreshing) && (
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            height: Math.max(28, pullPx), color: "var(--ink-soft)", fontSize: 12,
            gap: 6, transition: "height 0.15s ease-out",
          }}>
            <TbRefresh style={{ transform: `rotate(${primed || refreshing ? 180 : Math.round((pullPx / 70) * 180)}deg)`, transition: "transform 0.1s linear" }} />
            <span>{refreshing ? "Refreshing…" : primed ? "Release to refresh" : "Pull down"}</span>
          </div>
        )}
        <SectionTitle eyebrow="Hydration" title="Water" />

        <Card style={{ marginBottom: 16, textAlign: "center" }} styles={{ body: { padding: 24 } }}>
          <Progress
            type="dashboard" percent={pct} size={180} strokeColor={status === "done" ? t.teal : t.accent}
            strokeWidth={10}
            format={() => (
              <div>
                <div className="display" style={{ fontSize: 30, fontWeight: 800 }}>{(optimistic / 1000).toFixed(2)}L</div>
                <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>of {(goal / 1000).toFixed(1)}L{trained ? " (gym +)" : ""}</div>
              </div>
            )}
          />
        </Card>

        <Alert type={banner.type} message={banner.msg} showIcon style={{ marginBottom: 16, borderRadius: 12 }} />

        <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
          {QUICK.map((ml) => (
            <Button key={ml} size="large" block icon={<TbPlus />} onClick={() => log(ml)} style={{ fontWeight: 700 }} aria-label={`Add ${ml} ml`}>
              {ml}
            </Button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
          <SmartInputNumber placeholder="custom ml" value={custom} onChange={(v) => setCustom(v == null ? undefined : Number(v))} min={1} style={{ flex: 1 }} controls={false} aria-label="Custom water amount" />
          <Button type="primary" onClick={() => { if (custom) { void log(custom); setCustom(undefined); } }}>Add</Button>
          <Button
            icon={<TbArrowBackUp />}
            aria-label="Undo last water entry"
            onClick={async () => { await undoLastWater(); void hapticLight(); message.success("Last entry removed"); }}
          />
        </div>

        {entries.length === 0 ? (
          <EmptyState
            icon={<ColdIcon glyph="droplet" size={80} />}
            title="Nothing logged yet today"
            hint="Tap one of the quick buttons above to log your first sip."
            actionLabel="Add 500 ml"
            onAction={() => void log(500)}
          />
        ) : (
          <Card title="Last 7 days" size="small">
            <div style={{ width: "100%", height: 150 }}>
              <ResponsiveContainer>
                <BarChart data={weekly} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <Bar dataKey="ml" radius={[6, 6, 0, 0]}>
                    {weekly.map((d, i) => (
                      <Cell key={i} fill={d.ml >= goal ? t.teal : "rgba(150,150,170,0.35)"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}
      </div>
    </PageTransition>
  );
}
