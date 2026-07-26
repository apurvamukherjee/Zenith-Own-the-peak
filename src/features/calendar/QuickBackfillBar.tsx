import { useState } from "react";
import { Modal, Select, Button, App } from "antd";
import { TbDroplet, TbToolsKitchen2, TbBarbell } from "react-icons/tb";
import dayjs from "dayjs";
import { addWater } from "../water/useWater";
import { backfillSession, useWorkoutDays } from "../gym/useGym";
import { FoodPickerModal } from "../nutrition/FoodPickerModal";
import { hapticSuccess } from "../../lib/haptics";
import { todayKey } from "../../lib/date.utils";

const WATER_QUICK = [250, 500, 1000];

function inferMealType() {
  const h = new Date().getHours();
  if (h < 11) return "breakfast" as const;
  if (h < 15) return "lunch" as const;
  if (h < 21) return "dinner" as const;
  return "snack" as const;
}

interface Props {
  date: string;
  defaultDayId?: number;
}

// Lets the user backfill water/meal/workout logs for a past day straight
// from the calendar, without needing a pre-scheduled task for that date.
export function QuickBackfillBar({ date, defaultDayId }: Props) {
  const { message } = App.useApp();
  const days = useWorkoutDays();
  const [waterOpen, setWaterOpen] = useState(false);
  const [mealOpen, setMealOpen] = useState(false);
  const [workoutOpen, setWorkoutOpen] = useState(false);
  const [pickedDay, setPickedDay] = useState<number | undefined>(defaultDayId);

  if (date > todayKey()) return null;
  const dateLabel = dayjs(date).format("D MMM");

  async function logWater(ml: number) {
    await addWater(ml, date);
    void hapticSuccess();
    message.success(`${ml} ml logged for ${dateLabel}`);
    setWaterOpen(false);
  }

  async function submitWorkout() {
    if (!pickedDay) return;
    await backfillSession(date, pickedDay);
    void hapticSuccess();
    message.success("Workout logged");
    setWorkoutOpen(false);
  }

  return (
    <>
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: "var(--ink-soft)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.04em" }}>
          Backfill this day
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <BackfillChip icon={<TbDroplet size={14} />} label="Water" active={waterOpen} onClick={() => setWaterOpen((v) => !v)} />
          <BackfillChip icon={<TbToolsKitchen2 size={14} />} label="Meal" onClick={() => setMealOpen(true)} />
          <BackfillChip icon={<TbBarbell size={14} />} label="Workout" onClick={() => { setPickedDay(defaultDayId); setWorkoutOpen(true); }} />
        </div>
        {waterOpen && (
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            {WATER_QUICK.map((ml) => (
              <Button key={ml} size="small" onClick={() => logWater(ml)}>{ml}ml</Button>
            ))}
          </div>
        )}
      </div>

      <FoodPickerModal
        open={mealOpen}
        onClose={() => setMealOpen(false)}
        date={date}
        defaultMealType={inferMealType()}
        title={`Log meal — ${dateLabel}`}
      />

      <Modal
        open={workoutOpen}
        onCancel={() => setWorkoutOpen(false)}
        onOk={submitWorkout}
        okText="Log workout"
        okButtonProps={{ disabled: !pickedDay }}
        title={`Log workout — ${dateLabel}`}
      >
        <div style={{ fontSize: 12, color: "var(--ink-soft)", marginBottom: 10 }}>
          Logs all planned sets at your program's target weight/reps for this day.
        </div>
        <Select
          style={{ width: "100%" }}
          placeholder="Pick a workout day"
          value={pickedDay}
          onChange={setPickedDay}
          options={days.filter((d) => d.id != null).map((d) => ({ value: d.id, label: d.name }))}
        />
      </Modal>
    </>
  );
}

function BackfillChip({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active?: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 20,
      border: `1px solid ${active ? "var(--accent)" : "var(--border)"}`,
      background: active ? "var(--accent)22" : "var(--bg)",
      color: "var(--ink)", fontSize: 12, fontWeight: 600, cursor: "pointer", flex: 1, justifyContent: "center",
    }}>
      {icon} {label}
    </button>
  );
}
