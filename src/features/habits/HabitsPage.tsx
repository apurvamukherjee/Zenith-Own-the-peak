import { useState } from "react";
import { Card, Button, Input, Popconfirm, App } from "antd";
import { TbPlus, TbTrash, TbCheck, TbFlame, TbArrowRight } from "react-icons/tb";
import { PageTransition } from "../../components/PageTransition";
import { SectionTitle } from "../../components/SectionTitle";
import { EmptyState } from "../../components/EmptyState";
import { ColdIcon } from "../../components/ColdIcon";
import { Sheet } from "../../components/Sheet";
import { useBackClose } from "../../hooks/useBackClose";
import { hapticLight, hapticSuccess } from "../../lib/haptics";
import { useHabits, addHabit, deleteHabit, useHabitDoneToday, useHabitStreak, toggleHabitToday } from "./useHabits";
import { habitIconFor, HABIT_ICON_NAMES } from "./habitIcons";
import type { HabitDto } from "../../db/types";

export function HabitsPage() {
  const habits = useHabits();
  const [addOpen, setAddOpen] = useState(false);

  return (
    <PageTransition>
      <SectionTitle eyebrow="Forged Habits" title="Trigger → action" />

      {habits.length === 0 ? (
        <EmptyState icon={<ColdIcon glyph="rune" size={80} />} title="No habits yet"
          hint="Pair a trigger with an action — e.g. 'After waking' → 'Cold shower' — and build a streak."
          actionLabel="Add a habit" onAction={() => setAddOpen(true)} />
      ) : (
        <>
          {habits.map((h) => <HabitCard key={h.id} habit={h} />)}
          <Button block size="large" icon={<TbPlus />} onClick={() => setAddOpen(true)} style={{ marginTop: 4 }}>
            Add a habit
          </Button>
        </>
      )}

      <AddHabitSheet open={addOpen} onClose={() => setAddOpen(false)} />
    </PageTransition>
  );
}

function HabitCard({ habit }: { habit: HabitDto }) {
  const done = useHabitDoneToday(habit.id);
  const streak = useHabitStreak(habit.id);
  const Icon = habitIconFor(habit.icon);

  async function toggle() {
    if (!habit.id) return;
    const nowDone = await toggleHabitToday(habit.id);
    if (nowDone) hapticSuccess(); else hapticLight();
  }

  return (
    <Card size="small" style={{ marginBottom: 10 }} styles={{ body: { padding: 14 } }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{
          width: 42, height: 42, borderRadius: 12, flexShrink: 0,
          background: `${habit.color}22`, display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon size={20} style={{ color: habit.color }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
            <span>{habit.triggerLabel}</span>
            <TbArrowRight size={13} style={{ color: "var(--ink-soft)" }} />
            <span>{habit.actionLabel}</span>
          </div>
          <div style={{ fontSize: 12, color: "var(--ink-soft)", display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
            <TbFlame size={13} style={{ color: streak > 0 ? "var(--gold)" : "var(--ink-soft)" }} />
            {streak > 0 ? `${streak} day streak` : "No streak yet"}
          </div>
        </div>
        <button onClick={toggle} aria-label={done ? "Mark not done today" : "Mark done today"}
          style={{
            width: 34, height: 34, borderRadius: 10, flexShrink: 0, cursor: "pointer",
            border: `1.5px solid ${done ? "var(--teal)" : "var(--border)"}`,
            background: done ? "var(--teal)" : "transparent",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
          {done && <TbCheck size={18} color="#fff" />}
        </button>
        <Popconfirm title="Delete this habit?" description="Its streak history goes with it." okText="Delete" cancelText="Cancel" okButtonProps={{ danger: true }}
          onConfirm={() => habit.id && deleteHabit(habit.id)}>
          <Button type="text" size="small" danger icon={<TbTrash />} aria-label="Delete habit" />
        </Popconfirm>
      </div>
    </Card>
  );
}

function AddHabitSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  useBackClose(open, onClose);
  const { message } = App.useApp();
  const [triggerLabel, setTriggerLabel] = useState("");
  const [actionLabel, setActionLabel] = useState("");
  const [icon, setIcon] = useState<string>(HABIT_ICON_NAMES[0]);

  function reset() {
    setTriggerLabel(""); setActionLabel(""); setIcon(HABIT_ICON_NAMES[0]);
  }

  async function submit() {
    if (!triggerLabel.trim() || !actionLabel.trim()) { message.warning("Fill in both the trigger and the action"); return; }
    await addHabit({ triggerLabel, actionLabel, icon });
    hapticSuccess();
    message.success("Habit added");
    reset();
    onClose();
  }

  return (
    <Sheet open={open} onCancel={() => { reset(); onClose(); }} title="New habit" footer={null} destroyOnHidden>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div>
          <div style={{ fontSize: 11, color: "var(--ink-soft)", marginBottom: 4 }}>Trigger</div>
          <Input placeholder="e.g. After waking up" value={triggerLabel} onChange={(e) => setTriggerLabel(e.target.value)} />
        </div>
        <div>
          <div style={{ fontSize: 11, color: "var(--ink-soft)", marginBottom: 4 }}>Action</div>
          <Input placeholder="e.g. Cold shower" value={actionLabel} onChange={(e) => setActionLabel(e.target.value)} />
        </div>
        <div>
          <div style={{ fontSize: 11, color: "var(--ink-soft)", marginBottom: 6 }}>Icon</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {HABIT_ICON_NAMES.map((name) => {
              const Icon = habitIconFor(name);
              const active = icon === name;
              return (
                <button key={name} onClick={() => setIcon(name)} aria-label={name}
                  style={{
                    width: 38, height: 38, borderRadius: 10, cursor: "pointer",
                    border: `1.5px solid ${active ? "var(--accent)" : "var(--border)"}`,
                    background: active ? "rgba(255,39,64,0.12)" : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                  <Icon size={18} style={{ color: active ? "var(--accent)" : "var(--ink-soft)" }} />
                </button>
              );
            })}
          </div>
        </div>
        <Button type="primary" block size="large" onClick={submit} style={{ fontWeight: 700, marginTop: 6 }}>
          Add habit
        </Button>
      </div>
    </Sheet>
  );
}
