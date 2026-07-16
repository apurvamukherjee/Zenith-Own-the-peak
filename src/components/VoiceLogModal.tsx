import { useEffect, useState } from "react";
import { Modal, Button, App, Alert } from "antd";
import { TbMicrophone, TbMicrophoneOff, TbCheck } from "react-icons/tb";
import { useVoiceLog, parseVoiceMeal } from "../hooks/useVoiceLog";
import { useFoods, logFood, computeMacros, portionLabel } from "../features/nutrition/useFoods";
import type { FoodDto, MealType } from "../db/types";
import { todayKey } from "../lib/date.utils";
import { nowHHMM } from "../features/nutrition/useNutrition";
import { useBackClose } from "../hooks/useBackClose";
import { hapticSuccess } from "../lib/haptics";

interface Props { open: boolean; onClose: () => void; }

function inferMealType(): MealType {
  const h = new Date().getHours();
  if (h < 11) return "breakfast";
  if (h < 15) return "lunch";
  if (h < 21) return "dinner";
  return "snack";
}

export function VoiceLogModal({ open, onClose }: Props) {
  const { message } = App.useApp();
  useBackClose(open, onClose);
  const { supported, listening, transcript, error, start, stop, reset } = useVoiceLog();
  const foods = useFoods();
  const [match, setMatch] = useState<{ food: FoodDto; amount: number } | null>(null);

  useEffect(() => { if (!open) { reset(); setMatch(null); } }, [open, reset]);

  // Whenever transcript settles, try to match a catalog food.
  useEffect(() => {
    if (!transcript.trim() || listening) return;
    const parsed = parseVoiceMeal(transcript);
    if (!parsed) return;
    const q = parsed.name.toLowerCase();
    const found = foods.find((f) => f.name.toLowerCase().includes(q))
      ?? foods.find((f) => q.includes(f.name.toLowerCase().split(" ")[0]));
    if (!found) { setMatch(null); return; }
    // Amount: use explicit count/grams if present; otherwise the first preset or unit default.
    let amount: number;
    if (parsed.grams != null && (found.unit === "g" || found.unit === "ml")) amount = parsed.grams;
    else if (parsed.count != null && found.unit !== "g" && found.unit !== "ml") amount = parsed.count;
    else amount = found.presets?.[0]?.amount ?? (found.unit === "g" || found.unit === "ml" ? 100 : 1);
    setMatch({ food: found, amount });
  }, [transcript, listening, foods]);

  async function commit() {
    if (!match) return;
    await logFood(match.food, match.amount, inferMealType(), todayKey(), nowHHMM());
    hapticSuccess();
    message.success(`Logged ${match.food.name}`);
    onClose();
  }

  return (
    <Modal open={open} onCancel={onClose} title="Voice log" footer={null}>
      {!supported && (
        <Alert type="info" showIcon message="Voice input isn't supported here"
          description="Try Chrome or the Android app. You can still tap 'Add food' to log manually." />
      )}
      {supported && (
        <div style={{ textAlign: "center", padding: "8px 0 4px" }}>
          <Button size="large" type={listening ? "primary" : "default"} shape="circle"
            icon={listening ? <TbMicrophoneOff size={28} /> : <TbMicrophone size={28} />}
            onClick={() => (listening ? stop() : start())}
            style={{ width: 80, height: 80, marginBottom: 12 }} />
          <div style={{ fontSize: 12, color: "var(--ink-soft)", marginBottom: 10 }}>
            {listening ? "Listening… say something like \"200g paneer\" or \"3 eggs\"" : "Tap to speak"}
          </div>
          {transcript && (
            <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 10,
              padding: "8px 12px", marginBottom: 10, textAlign: "left" }}>
              <div style={{ fontSize: 11, color: "var(--ink-soft)", fontWeight: 700 }}>You said</div>
              <div style={{ fontSize: 14 }}>{transcript}</div>
            </div>
          )}
          {match && (
            <div style={{ background: "var(--surface)", border: "1px solid var(--accent)", borderRadius: 12,
              padding: "10px 12px", marginBottom: 10, textAlign: "left" }}>
              <div style={{ fontSize: 11, color: "var(--ink-soft)", fontWeight: 700 }}>Match</div>
              <div style={{ fontWeight: 700 }}>{match.food.name}</div>
              <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>
                {portionLabel(match.food, match.amount)} · {computeMacros(match.food, match.amount).kcal} kcal
              </div>
              <Button type="primary" block icon={<TbCheck />} onClick={commit} style={{ marginTop: 8 }}>Log this</Button>
            </div>
          )}
          {transcript && !match && !listening && (
            <Alert type="warning" showIcon
              message="No catalog match" description="Try naming a food from the catalog, or use Add food instead." />
          )}
          {error && <Alert type="error" showIcon message={error} />}
        </div>
      )}
    </Modal>
  );
}
