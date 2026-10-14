import { useState, type CSSProperties } from "react";
import { Button, Modal, Input, Segmented, App, Switch, Popconfirm, Checkbox } from "antd";
import { motion } from "framer-motion";
import {
  TbPlus, TbTrash, TbCheck, TbBell, TbClock, TbBookmark,
  TbCopy, TbDroplet, TbStack2, TbX,
} from "react-icons/tb";
import dayjs from "dayjs";
import { useLiveQuery } from "dexie-react-hooks";
import { PageTransition } from "../../components/PageTransition";
import { SectionTitle } from "../../components/SectionTitle";
import { EmptyState } from "../../components/EmptyState";
import { TimeSelect } from "../../components/TimeSelect";
import { ColdIcon } from "../../components/ColdIcon";
import { db } from "../../db/db";
import type { MealDto, ScheduleKind } from "../../db/types";
import {
  useSchedules, useTodayLogs, useTodayMeals, addSchedule, deleteSchedule, markDone,
  deleteMeal, addMeal, slotStatus, KIND_META,
} from "./useNutrition";
import { requestNotificationPermission } from "../../lib/notifications";
import { useSetting, setSetting } from "../../hooks/useSettings";
import {
  useMealTemplates, logFromTemplate, saveMealAsTemplate,
  deleteMealTemplate, copyYesterdayMeals,
} from "./useMealTemplates";
import { FoodPickerModal } from "./FoodPickerModal";
import { FuelHero } from "./FuelHero";
import { ListGroup, ListRow } from "../../components/ui/List";
import "./nutrition.css";
import { MealComboBuilderModal } from "./MealComboBuilderModal";
import { WeeklyMacroChart } from "./WeeklyMacroChart";
import { addWater } from "../water/useWater";
import { hapticLight } from "../../lib/haptics";
import { useBackClose } from "../../hooks/useBackClose";
import { useUndo } from "../../hooks/useUndo";
import { CoachMark } from "../../components/CoachMark";
import { useBulkSelect } from "../../hooks/useBulkSelect";

const STATUS_TONE = {
  done: { c: "var(--success)", label: "Done" },
  due: { c: "var(--gold)", label: "Due now" },
  overdue: { c: "var(--danger)", label: "Overdue" },
  upcoming: { c: "var(--ink-soft)", label: "Upcoming" },
};

export function NutritionPage() {
  const { message } = App.useApp();
  const schedules = useSchedules();
  const logs = useTodayLogs();
  const meals = useTodayMeals();
  const [manageOpen, setManageOpen] = useState(false);
  const [foodOpen, setFoodOpen] = useState(false);
  const [comboOpen, setComboOpen] = useState(false);
  const withUndo = useUndo();
  const [tplMeal, setTplMeal] = useState<MealDto | null>(null);
  const [tplName, setTplName] = useState("");
  const bulk = useBulkSelect<number>();
  const remindersOn = Number(useSetting("remSupps")) === 1;
  const coachDone = Number(useSetting("coachNutrition"));
  const [coachStep, setCoachStep] = useState(coachDone ? -1 : 0);
  const NUTRITION_COACH = [
    { title: "Log from catalog", body: "Tap the + button and search for food (e.g. 'chicken breast') to get auto-calculated macros by weight." },
    { title: "Bulk delete", body: "Long-press any meal to enter selection mode. Then tap 'All N' to select everything and delete in one go." },
  ];

  const latestBw = useLiveQuery(async () => (await db.bodyweight.orderBy("date").last())?.kg, []);
  const proteinDefault = useSetting("proteinTargetG");
  const calorieTarget = useSetting("calorieTargetKcal");
  const carbTarget = useSetting("carbTargetG");
  const fatTarget = useSetting("fatTargetG");
  const proteinTarget = latestBw ? Math.round(latestBw * 1.8) : proteinDefault;

  const doneIds = new Set(logs.map((l) => l.scheduleId));

  async function toggleReminders(on: boolean) {
    if (on) {
      const ok = await requestNotificationPermission();
      await setSetting("remSupps", ok ? 1 : 0);
      if (!ok) message.info("Allow notifications in your browser to get reminders");
      else message.success("Reminders on while the app is open");
    } else await setSetting("remSupps", 0);
  }

  const nextUp = schedules.find((s) => s.id && !doneIds.has(s.id) && slotStatus(s.time, false) !== "upcoming")
    ?? schedules.find((s) => s.id && !doneIds.has(s.id));

  async function handleCopyYesterday() {
    const n = await copyYesterdayMeals();
    if (n === 0) message.info("Nothing logged yesterday to copy");
    else { hapticLight(); message.success(`Copied ${n} meal${n === 1 ? "" : "s"} from yesterday`); }
  }

  async function quickWater(ml: number) {
    await addWater(ml);
    hapticLight();
    message.success(`+${ml}ml`);
  }

  return (
    <PageTransition>
      {coachStep >= 0 && (
        <CoachMark
          steps={NUTRITION_COACH}
          current={coachStep}
          onNext={() => setCoachStep((s) => s + 1)}
          onDone={() => { setCoachStep(-1); void setSetting("coachNutrition", 1); }}
        />
      )}
      <SectionTitle eyebrow="Fuel your body" title="Nutrition"
        right={<button type="button" className="z-btn z-btn--solid" onClick={() => setFoodOpen(true)}><TbPlus size={16} /> Food</button>} />

      <FuelHero meals={meals} proteinTarget={proteinTarget} fatTarget={fatTarget} carbTarget={carbTarget} kcalTarget={calorieTarget} />

      <TemplatesRow onCreateCombo={() => setComboOpen(true)} />

      <ListGroup
        title={`Meals · ${meals.length}`}
        right={bulk.isSelecting ? (
          <span className="nu-bulk">
            <span className="z-pill" style={{ "--c": "var(--accent)" } as CSSProperties}>{bulk.selected.size} selected</span>
            {bulk.selected.size < meals.length && (
              <button type="button" className="nu-link" onClick={() => bulk.selectAll(meals.map((m) => m.id!).filter(Boolean))}>All {meals.length}</button>
            )}
            <Popconfirm
              title="Delete selected?" okText="Delete" okButtonProps={{ danger: true }}
              onConfirm={async () => {
                const ids = [...bulk.selected];
                const snapshot: MealDto[] = meals.filter((m) => m.id != null && ids.includes(m.id));
                bulk.clear();
                await withUndo({
                  do: async () => { for (const id of ids) await deleteMeal(id); },
                  undo: async () => { for (const m of snapshot) { const { id: _drop, ...rest } = m; await addMeal(rest); } },
                  label: `${ids.length} meal${ids.length === 1 ? "" : "s"} deleted`,
                });
              }}>
              <button type="button" className="nu-link nu-link--danger"><TbTrash size={14} /> Delete</button>
            </Popconfirm>
            <button type="button" className="nu-link" onClick={bulk.clear} aria-label="Cancel selection"><TbX size={15} /></button>
          </span>
        ) : meals.length === 0 ? (
          <button type="button" className="nu-link" onClick={handleCopyYesterday}><TbCopy size={14} /> Same as yesterday</button>
        ) : <span className="nu-hint">Hold to select</span>}
        footer={
          <span className="nu-water">
            <TbDroplet size={13} /> Drink with it
            {[200, 500, 1000].map((v) => (
              <button key={v} type="button" className="nu-chip" onClick={() => quickWater(v)}>+{v >= 1000 ? "1L" : `${v}ml`}</button>
            ))}
          </span>
        }>
        {meals.length === 0 ? (
          <EmptyState icon={<ColdIcon glyph="blade-fork" size={44} />} title="No meals logged yet today"
            hint="Log from the catalog for auto macros, or repeat yesterday in one tap." actionLabel="Add food" onAction={() => setFoodOpen(true)} />
        ) : (
          [...meals].sort((a, b) => a.time.localeCompare(b.time)).map((m) => {
            const id = m.id!;
            const isSelected = bulk.selected.has(id);
            return (
              <div key={id} className={`z-row nu-meal${isSelected ? " is-selected" : ""}`}
                onPointerDown={() => bulk.onItemPress(id)} onPointerUp={bulk.onItemUp} onPointerLeave={bulk.onItemUp}
                onClick={() => { if (bulk.isSelecting) bulk.toggle(id); }}
                style={{ cursor: bulk.isSelecting ? "pointer" : "default" }}>
                {bulk.isSelecting
                  ? <Checkbox checked={isSelected} onChange={() => bulk.toggle(id)} aria-label={`Select ${m.name}`} />
                  : <span className="nu-meal__time">{m.time}</span>}
                <span className="z-row__text">
                  <span className="z-row__label nu-meal__name">{m.name}</span>
                  <span className="nu-meal__macros">
                    <span className="nu-m" style={{ "--c": "var(--teal)" } as CSSProperties}>{Math.round(m.protein)}g P</span>
                    {m.carbsG != null && <span className="nu-m" style={{ "--c": "var(--gold)" } as CSSProperties}>{Math.round(m.carbsG)}g C</span>}
                    {m.fatG != null && <span className="nu-m" style={{ "--c": "var(--info)" } as CSSProperties}>{Math.round(m.fatG)}g F</span>}
                    <span className="nu-meal__kcal">{Math.round(m.calories)} kcal · {m.mealType}</span>
                  </span>
                </span>
                {!bulk.isSelecting && (
                  <span className="nu-meal__actions">
                    <button type="button" className="nu-icon" aria-label="Save as template" onClick={() => { setTplName(m.name); setTplMeal(m); }}><TbBookmark size={16} /></button>
                    <button type="button" className="nu-icon nu-icon--danger" aria-label="Delete meal"
                      onClick={async () => {
                        const { id: _drop, ...rest } = m;
                        await withUndo({ do: () => deleteMeal(id), undo: () => addMeal(rest).then(() => undefined), label: `${m.name} deleted` });
                      }}><TbTrash size={16} /></button>
                  </span>
                )}
              </div>
            );
          })
        )}
      </ListGroup>

      <ListGroup title="Daily schedule"
        right={<button type="button" className="nu-link" onClick={() => setManageOpen(true)}><TbPlus size={14} /> Add</button>}>
        <ListRow icon={<TbBell size={16} />} color="var(--accent)" label="Reminders"
          hint={nextUp ? `Next: ${nextUp.label} at ${nextUp.time}` : "Nothing scheduled"}
          right={<Switch checked={remindersOn} onChange={toggleReminders} aria-label="Schedule reminders" />} />
        {schedules.length === 0 ? (
          <div className="nu-empty-line">Add meds, supplements or meal times to build your daily plan.</div>
        ) : schedules.map((s) => {
          const done = !!s.id && doneIds.has(s.id);
          const status = slotStatus(s.time, done);
          const meta = KIND_META[s.kind];
          return (
            <div key={s.id} className={`z-row nu-slot${done ? " is-done" : ""}`}>
              <span className="z-ico" style={{ "--c": meta.color } as CSSProperties}><meta.icon size={16} /></span>
              <span className="z-row__text">
                <span className="z-row__label" style={{ display: "block" }}>{s.label}</span>
                <span className="z-row__hint" style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <TbClock size={12} /> {s.time}{s.dose ? ` · ${s.dose}` : ""}
                </span>
              </span>
              <span className="z-pill" style={{ "--c": STATUS_TONE[status].c } as CSSProperties}>{STATUS_TONE[status].label}</span>
              <motion.button type="button" whileTap={{ scale: 0.85 }} className={`nu-check${done ? " is-on" : ""}`}
                aria-label={done ? `Mark ${s.label} not done` : `Mark ${s.label} done`} aria-pressed={done}
                onClick={() => s.id && markDone(s.id, !done)}>
                <TbCheck size={15} />
              </motion.button>
              <Popconfirm title="Delete this schedule?" okText="Delete" okButtonProps={{ danger: true }} onConfirm={() => s.id && deleteSchedule(s.id)}>
                <button type="button" className="nu-icon nu-icon--danger" aria-label={`Delete ${s.label}`}><TbTrash size={15} /></button>
              </Popconfirm>
            </div>
          );
        })}
      </ListGroup>

      <ListGroup title="7-day macros">
        <WeeklyMacroChart />
      </ListGroup>

      <ManageScheduleModal open={manageOpen} onClose={() => setManageOpen(false)} />
      <FoodPickerModal open={foodOpen} onClose={() => setFoodOpen(false)} defaultMealType={inferMealType()} />
      <MealComboBuilderModal open={comboOpen} onClose={() => setComboOpen(false)} />
      <Modal open={!!tplMeal} title="Save as template" okText="Save" onCancel={() => setTplMeal(null)} destroyOnClose
        okButtonProps={{ disabled: !tplName.trim() }}
        onOk={async () => {
          if (!tplMeal || !tplName.trim()) return;
          await saveMealAsTemplate(tplMeal, tplName.trim());
          setTplMeal(null);
          message.success("Template saved");
        }}>
        <Input autoFocus value={tplName} onChange={(e) => setTplName(e.target.value)} placeholder="Template name" maxLength={40} />
      </Modal>
    </PageTransition>
  );
}

function inferMealType() {
  const h = new Date().getHours();
  if (h < 11) return "breakfast" as const;
  if (h < 15) return "lunch" as const;
  if (h < 21) return "dinner" as const;
  return "snack" as const;
}

function ManageScheduleModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  useBackClose(open, onClose);
  const [kind, setKind] = useState<ScheduleKind>("med");
  const [label, setLabel] = useState("");
  const [dose, setDose] = useState("");
  const [time, setTime] = useState(() => dayjs().format("HH:mm"));
  function submit() {
    if (!label.trim()) return;
    addSchedule({ kind, label: label.trim(), dose: dose.trim() || undefined, time });
    setLabel(""); setDose("");
  }
  return (
    <Modal open={open} title="Add to schedule" onCancel={onClose} onOk={submit} okText="Add" footer={[
      <Button key="c" onClick={onClose}>Close</Button>,
      <Button key="a" type="primary" onClick={submit}>Add</Button>,
    ]}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 8 }}>
        <Segmented block value={kind} onChange={(v) => setKind(v as ScheduleKind)}
          options={[{ label: "Med", value: "med" }, { label: "Supplement", value: "supplement" }, { label: "Meal", value: "meal" }]} />
        <Input placeholder="Name (e.g. Creatine, Breakfast)" value={label} onChange={(e) => setLabel(e.target.value)} />
        <div style={{ display: "flex", gap: 10 }}>
          <Input placeholder="Dose / note (optional)" value={dose} onChange={(e) => setDose(e.target.value)} style={{ flex: 1 }} />
          <TimeSelect value={time} onChange={setTime} />
        </div>
      </div>
    </Modal>
  );
}

function TemplatesRow({ onCreateCombo }: { onCreateCombo: () => void }) {
  const templates = useMealTemplates();
  const { message } = App.useApp();
  return (
    <>
      <div className="z-list-title">
        <span>Quick log</span>
        <button type="button" className="nu-link" onClick={onCreateCombo}><TbStack2 size={14} /> New combo</button>
      </div>
      {templates.length === 0 ? (
        <div className="nu-empty-line nu-empty-line--bare">Save a meal (bookmark icon) or build a combo to fast-log your usuals.</div>
      ) : (
        <div className="nu-tpls">
          {templates.map((tpl) => (
            <div key={tpl.id} className="nu-tpl">
              <motion.button type="button" whileTap={{ scale: 0.95 }} className="nu-tpl__main"
                onClick={async () => { await logFromTemplate(tpl); hapticLight(); message.success(`Logged ${tpl.name}`); }}>
                <span className="nu-tpl__name">{tpl.isCombo && <TbStack2 size={12} />}{tpl.name}</span>
                <span className="nu-tpl__meta">{Math.round(tpl.protein)}g P · {Math.round(tpl.calories)} kcal</span>
              </motion.button>
              <Popconfirm title="Delete this template?" okText="Delete" okButtonProps={{ danger: true }}
                onConfirm={() => tpl.id && deleteMealTemplate(tpl.id)}>
                <button type="button" className="nu-tpl__x" aria-label={`Delete ${tpl.name}`}><TbX size={12} /></button>
              </Popconfirm>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
