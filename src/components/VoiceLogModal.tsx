import { useEffect, useMemo } from "react";
import { Modal, Button, App, Alert } from "antd";
import { TbMicrophone, TbMicrophoneOff, TbCheck, TbDroplet, TbBarbell, TbMeat } from "react-icons/tb";
import { useVoiceLog, parseVoiceInput, type VoiceIntent } from "../hooks/useVoiceLog";
import { useFoods, logFood, computeMacros, portionLabel } from "../features/nutrition/useFoods";
import type { FoodDto, MealType } from "../db/types";
import { todayKey } from "../lib/date.utils";
import { nowHHMM } from "../features/nutrition/useNutrition";
import { useBackClose } from "../hooks/useBackClose";
import { hapticSuccess } from "../lib/haptics";
import { useIsMobile } from "../hooks/useIsMobile";
import { addWater } from "../features/water/useWater";
import { useExerciseLibrary, useTodayDayId, useDayExercises, ensureSession, logSet } from "../features/gym/useGym";
import { useSessionSets, useTodaySession } from "../features/gym/useGym";
import { celebrate } from "../lib/celebrate";

interface Props { open: boolean; onClose: () => void; }

function inferMealType(): MealType {
  const h = new Date().getHours();
  if (h < 11) return "breakfast";
  if (h < 15) return "lunch";
  if (h < 21) return "dinner";
  return "snack";
}

type Resolved =
  | { kind: "water"; ml: number }
  | { kind: "meal"; food: FoodDto; amount: number }
  | { kind: "set"; exerciseId: number; exerciseName: string; weightKg: number; reps: number }
  | { kind: "unresolved" };

function fuzzyFindExercise(name: string, lib: Array<{ id?: number; name: string }>): { id: number; name: string } | null {
  const q = name.toLowerCase();
  const exact = lib.find((e) => e.name.toLowerCase() === q);
  if (exact?.id) return { id: exact.id, name: exact.name };
  const contains = lib.find((e) => e.name.toLowerCase().includes(q));
  if (contains?.id) return { id: contains.id, name: contains.name };
  // Match any word in the query against the library name.
  const words = q.split(/\s+/).filter(Boolean);
  for (const w of words) {
    if (w.length < 3) continue;
    const hit = lib.find((e) => e.name.toLowerCase().includes(w));
    if (hit?.id) return { id: hit.id, name: hit.name };
  }
  return null;
}

function fuzzyFindFood(name: string, foods: FoodDto[]): FoodDto | null {
  const q = name.toLowerCase();
  return (
    foods.find((f) => f.name.toLowerCase() === q) ??
    foods.find((f) => f.name.toLowerCase().includes(q)) ??
    foods.find((f) => q.includes(f.name.toLowerCase().split(" ")[0])) ??
    null
  );
}

export function VoiceLogModal({ open, onClose }: Props) {
  const { message } = App.useApp();
  useBackClose(open, onClose);
  const isMobile = useIsMobile();
  const { supported, listening, transcript, error, start, stop, reset } = useVoiceLog();
  const foods = useFoods();
  const exercises = useExerciseLibrary();
  const todayDayId = useTodayDayId();
  const dayExercises = useDayExercises(todayDayId ?? undefined);
  const session = useTodaySession(todayDayId ?? null);
  const sessionSets = useSessionSets(session?.id);

  const intent: VoiceIntent = useMemo(
    () => (transcript && !listening ? parseVoiceInput(transcript) : null),
    [transcript, listening],
  );

  const resolved = useMemo<Resolved | null>(() => {
    if (!intent) return null;
    if (intent.kind === "water") return { kind: "water", ml: intent.ml };
    if (intent.kind === "meal") {
      const found = fuzzyFindFood(intent.parsed.name, foods);
      if (!found) return { kind: "unresolved" };
      let amount: number;
      if (intent.parsed.grams != null && (found.unit === "g" || found.unit === "ml")) amount = intent.parsed.grams;
      else if (intent.parsed.count != null && found.unit !== "g" && found.unit !== "ml") amount = intent.parsed.count;
      else amount = found.presets?.[0]?.amount ?? (found.unit === "g" || found.unit === "ml" ? 100 : 1);
      return { kind: "meal", food: found, amount };
    }
    if (intent.kind === "set") {
      const hit = fuzzyFindExercise(intent.exercise, exercises);
      if (!hit) return { kind: "unresolved" };
      return {
        kind: "set", exerciseId: hit.id, exerciseName: hit.name,
        weightKg: intent.weightKg, reps: intent.reps,
      };
    }
    return null;
  }, [intent, foods, exercises]);

  useEffect(() => { if (!open) reset(); }, [open, reset]);

  async function commit() {
    if (!resolved || resolved.kind === "unresolved") return;

    if (resolved.kind === "water") {
      await addWater(resolved.ml);
      hapticSuccess();
      message.success(`+${resolved.ml}ml water logged`);
      onClose();
      return;
    }

    if (resolved.kind === "meal") {
      await logFood(resolved.food, resolved.amount, inferMealType(), todayKey(), nowHHMM());
      hapticSuccess();
      message.success(`Logged ${resolved.food.name}`);
      onClose();
      return;
    }

    if (resolved.kind === "set") {
      if (!todayDayId) {
        message.warning("Today is a rest day — pick a workout day first.");
        return;
      }
      // Determine next setIndex: count existing sets for this exercise + 1.
      // Falls back to the planner's remembered order if we can't resolve.
      const sid = await ensureSession(todayDayId);
      const done = sessionSets.filter((s) => s.exerciseId === resolved.exerciseId);
      const nextIndex = done.length + 1;
      // Sanity: refuse to log a 999th set. Cap at the planned count + 3.
      const plan = dayExercises.find((d) => d.exerciseId === resolved.exerciseId);
      const cap = (plan?.sets ?? 5) + 3;
      if (nextIndex > cap) {
        message.warning(`Already logged ${done.length} sets of ${resolved.exerciseName}.`);
        return;
      }
      const { isPR, e1rm } = await logSet({
        sessionId: sid,
        exerciseId: resolved.exerciseId,
        exerciseName: resolved.exerciseName,
        setIndex: nextIndex,
        weightKg: resolved.weightKg,
        reps: resolved.reps,
      });
      hapticSuccess();
      if (isPR) {
        celebrate({
          kind: "pr",
          title: "New PR",
          subtitle: `${resolved.exerciseName} · ${resolved.weightKg}kg × ${resolved.reps} · e1RM ${Math.round(e1rm)}`,
        });
      }
      message.success(`Logged: ${resolved.exerciseName} ${resolved.weightKg}kg × ${resolved.reps}`);
      onClose();
      return;
    }
  }

  const commitDisabled = !resolved || resolved.kind === "unresolved";

  return (
    <Modal
      open={open} onCancel={onClose} title="Voice log" footer={null}
      centered={!isMobile}
      styles={isMobile ? {
        content: { borderRadius: "20px 20px 0 0", padding: 20 },
        mask: { background: "rgba(0,0,0,0.55)" },
      } : undefined}
    >
      {!supported && (
        <Alert type="info" showIcon message="Voice input isn't supported here"
          description="Try Chrome or the Android app. You can still tap 'Add' on any page to log manually." />
      )}
      {supported && (
        <div style={{ textAlign: "center", padding: "8px 0 4px" }}>
          <Button size="large" type={listening ? "primary" : "default"} shape="circle"
            icon={listening ? <TbMicrophoneOff size={28} /> : <TbMicrophone size={28} />}
            onClick={() => (listening ? stop() : start())}
            style={{ width: 80, height: 80, marginBottom: 12 }}
            aria-label={listening ? "Stop listening" : "Start listening"} />
          <div style={{ fontSize: 12, color: "var(--ink-soft)", marginBottom: 10, lineHeight: 1.45 }}>
            {listening
              ? "Listening… try \"500 ml water\", \"bench 60kg 8 reps\", or \"200g paneer\""
              : "Tap to speak"}
          </div>
          {transcript && (
            <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 10,
              padding: "8px 12px", marginBottom: 10, textAlign: "left" }}>
              <div style={{ fontSize: 11, color: "var(--ink-soft)", fontWeight: 700 }}>You said</div>
              <div style={{ fontSize: 14 }}>{transcript}</div>
            </div>
          )}
          {resolved && resolved.kind !== "unresolved" && (
            <div style={{ background: "var(--surface)", border: "1px solid var(--accent)", borderRadius: 12,
              padding: "10px 12px", marginBottom: 10, textAlign: "left" }}>
              <div style={{ fontSize: 11, color: "var(--ink-soft)", fontWeight: 700,
                display: "inline-flex", alignItems: "center", gap: 6 }}>
                {resolved.kind === "water" && <><TbDroplet /> Water</>}
                {resolved.kind === "meal" && <><TbMeat /> Meal</>}
                {resolved.kind === "set" && <><TbBarbell /> Gym set</>}
              </div>
              {resolved.kind === "water" && (
                <div style={{ fontWeight: 700, marginTop: 2 }}>+{resolved.ml}ml water</div>
              )}
              {resolved.kind === "meal" && (
                <>
                  <div style={{ fontWeight: 700, marginTop: 2 }}>{resolved.food.name}</div>
                  <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>
                    {portionLabel(resolved.food, resolved.amount)} · {computeMacros(resolved.food, resolved.amount).kcal} kcal
                  </div>
                </>
              )}
              {resolved.kind === "set" && (
                <>
                  <div style={{ fontWeight: 700, marginTop: 2 }}>{resolved.exerciseName}</div>
                  <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>
                    {resolved.weightKg}kg × {resolved.reps} reps
                  </div>
                </>
              )}
              <Button type="primary" block icon={<TbCheck />} onClick={commit} disabled={commitDisabled}
                style={{ marginTop: 8 }}>
                Log this
              </Button>
            </div>
          )}
          {resolved?.kind === "unresolved" && (
            <Alert type="warning" showIcon
              message="Couldn't match that"
              description={
                intent?.kind === "set"
                  ? "No matching exercise in your library. Try a specific name like \"bench press\"."
                  : "Try naming a food from the catalog, or use Add food instead."
              }
            />
          )}
          {error && <Alert type="error" showIcon message={error} />}
        </div>
      )}
    </Modal>
  );
}
