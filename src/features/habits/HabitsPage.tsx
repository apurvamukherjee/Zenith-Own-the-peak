import { useState, type CSSProperties } from "react";
import { Button, Input, Popconfirm, App } from "antd";
import { AnimatePresence, motion } from "framer-motion";
import { Hero } from "../../components/ui/Hero";
import { Rings } from "../../components/ui/Rings";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import "./habits.css";
import { TbPlus, TbTrash, TbCheck, TbFlame, TbArrowRight } from "react-icons/tb";
import { PageTransition } from "../../components/PageTransition";
import { SectionTitle } from "../../components/SectionTitle";
import { EmptyState } from "../../components/EmptyState";
import { ColdIcon } from "../../components/ColdIcon";
import { Sheet } from "../../components/Sheet";
import { useBackClose } from "../../hooks/useBackClose";
import { hapticLight, hapticSuccess } from "../../lib/haptics";
import { useHabitsToday, addHabit, deleteHabit, useHabitStreak, toggleHabitToday } from "./useHabits";
import { habitIconFor, HABIT_ICON_NAMES } from "./habitIcons";
import type { HabitDto } from "../../db/types";

export function HabitsPage() {
  const reduced = useReducedMotion();
  const habits = useHabitsToday();
  const [addOpen, setAddOpen] = useState(false);
  const list = habits ?? [];
  const done = list.filter((h) => h.done).length;
  const pct = list.length ? (done / list.length) * 100 : 0;

  return (
    <PageTransition>
      <SectionTitle eyebrow="Forged habits" title="Habits"
        right={<button type="button" className="z-btn z-btn--solid" onClick={() => setAddOpen(true)}><TbPlus size={16} /> Habit</button>} />

      {habits !== undefined && list.length === 0 ? (
        <EmptyState icon={<ColdIcon glyph="rune" size={44} />} title="No habits yet"
          hint="Pair a trigger with an action — e.g. 'After waking' → 'Cold shower' — and build a streak."
          actionLabel="Add a habit" onAction={() => setAddOpen(true)} />
      ) : (
        <>
          <Hero eyebrow="Today" color="var(--accent)" className="hb2-hero"
            right={<span className="z-pill" style={{ "--c": done === list.length && list.length ? "var(--success)" : "var(--ink-soft)" } as CSSProperties}>
              {done === list.length && list.length ? "All forged" : `${list.length - done} to go`}
            </span>}>
            <div className="hb2-hero__row">
              <Rings size={96} stroke={9} reduced={reduced} rings={[{ key: "h", pct, color: pct >= 100 ? ["var(--success)", "var(--gold)"] : ["var(--accent)", "var(--gold)"] }]}>
                <span className="hb2-hero__count display">{done}<small>/{list.length}</small></span>
              </Rings>
              <div>
                <div className="z-hero__title">{done === list.length && list.length ? "Chain unbroken." : done ? "Keep the chain going." : "Light the first one."}</div>
                <div className="z-hero__sub">Triggers are already part of your day — just attach the action.</div>
              </div>
            </div>
          </Hero>

          <div className="z-list-title">Your chains</div>
          <div className="hb2-list">
            {list.map((h) => <HabitCard key={h.id} habit={h} done={h.done} />)}
          </div>
        </>
      )}

      <AddHabitSheet open={addOpen} onClose={() => setAddOpen(false)} />
    </PageTransition>
  );
}

function HabitCard({ habit, done }: { habit: HabitDto; done: boolean }) {
  const streak = useHabitStreak(habit.id);
  const Icon = habitIconFor(habit.icon);
  const [burst, setBurst] = useState(0);

  async function toggle() {
    if (!habit.id) return;
    const nowDone = await toggleHabitToday(habit.id);
    if (nowDone) { void hapticSuccess(); setBurst(Date.now()); } else void hapticLight();
  }

  return (
    <div className={`hb2-card${done ? " is-done" : ""}`} style={{ "--c": habit.color } as CSSProperties}>
      <span className="z-ico z-ico--lg"><Icon size={21} /></span>
      <div className="hb2-card__text">
        <div className="hb2-card__chain">
          <span>{habit.triggerLabel}</span>
          <TbArrowRight size={13} />
          <b>{habit.actionLabel}</b>
        </div>
        <div className="hb2-card__streak">
          <TbFlame size={13} /> {streak > 0 ? `${streak} day streak` : "No streak yet"}
        </div>
      </div>
      <motion.button type="button" className="hb2-check" whileTap={{ scale: 0.82 }} onClick={toggle}
        aria-label={done ? `Mark ${habit.actionLabel} not done today` : `Mark ${habit.actionLabel} done today`} aria-pressed={done}>
        <AnimatePresence>
          {done && (
            <motion.span key="c" initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0 }}
              transition={{ type: "spring", stiffness: 520, damping: 18 }}>
              <TbCheck size={20} />
            </motion.span>
          )}
        </AnimatePresence>
        {burst > 0 && <motion.i key={burst} className="hb2-burst" initial={{ scale: 0.6, opacity: 0.9 }} animate={{ scale: 2.2, opacity: 0 }} transition={{ duration: 0.6, ease: "easeOut" }} />}
      </motion.button>
      <Popconfirm title="Delete this habit?" description="Its streak history goes with it." okText="Delete" okButtonProps={{ danger: true }}
        onConfirm={() => habit.id && deleteHabit(habit.id)}>
        <button type="button" className="hb2-del" aria-label={`Delete ${habit.actionLabel}`}><TbTrash size={15} /></button>
      </Popconfirm>
    </div>
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
          <div style={{ fontSize: 12, color: "var(--ink-soft)", marginBottom: 4 }}>Trigger</div>
          <Input placeholder="e.g. After waking up" value={triggerLabel} onChange={(e) => setTriggerLabel(e.target.value)} />
        </div>
        <div>
          <div style={{ fontSize: 12, color: "var(--ink-soft)", marginBottom: 4 }}>Action</div>
          <Input placeholder="e.g. Cold shower" value={actionLabel} onChange={(e) => setActionLabel(e.target.value)} />
        </div>
        <div>
          <div style={{ fontSize: 12, color: "var(--ink-soft)", marginBottom: 6 }}>Icon</div>
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
