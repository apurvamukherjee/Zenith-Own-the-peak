import { useState } from "react";
import {
  Card, Progress, Button, Modal, Input, Segmented,
  Tag, App, Empty, Row, Col, Switch, Popconfirm, Checkbox,
} from "antd";
import {
  TbPlus, TbTrash, TbCircleCheck, TbBell, TbClock, TbBookmark,
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
import { useReminders, requestReminderPermission } from "../../hooks/useReminders";
import { useSetting, setSetting } from "../../hooks/useSettings";
import { VIOLET, GOLD } from "../../theme";
import { useTokens } from "../../hooks/useTokens";
import {
  useMealTemplates, logFromTemplate, saveMealAsTemplate,
  deleteMealTemplate, copyYesterdayMeals,
} from "./useMealTemplates";
import { FoodPickerModal } from "./FoodPickerModal";
import { MacroBar, TimeOfDayBar } from "./MacroBar";
import { MealComboBuilderModal } from "./MealComboBuilderModal";
import { WeeklyMacroChart } from "./WeeklyMacroChart";
import { addWater } from "../water/useWater";
import { hapticLight } from "../../lib/haptics";
import { useBackClose } from "../../hooks/useBackClose";
import { useUndo } from "../../hooks/useUndo";
import { CoachMark } from "../../components/CoachMark";
import { useBulkSelect } from "../../hooks/useBulkSelect";

const STATUS_TAG = {
  done: { color: "green", label: "Done" },
  due: { color: "gold", label: "Due now" },
  overdue: { color: "red", label: "Overdue" },
  upcoming: { color: "default", label: "Upcoming" },
};

export function NutritionPage() {
  const t = useTokens();
  const { message } = App.useApp();
  const schedules = useSchedules();
  const logs = useTodayLogs();
  const meals = useTodayMeals();
  const [manageOpen, setManageOpen] = useState(false);
  const [foodOpen, setFoodOpen] = useState(false);
  const [comboOpen, setComboOpen] = useState(false);
  const withUndo = useUndo();
  const bulk = useBulkSelect<number>();
  const [remindersOn, setRemindersOn] = useState(typeof Notification !== "undefined" && Notification.permission === "granted");
  const coachDone = Number(useSetting("coachNutrition"));
  const [coachStep, setCoachStep] = useState(coachDone ? -1 : 0);
  const NUTRITION_COACH = [
    { title: "Log from catalog", body: "Tap the + button and search for food (e.g. 'chicken breast') to get auto-calculated macros by weight." },
    { title: "Bulk delete", body: "Long-press any meal to enter selection mode. Then tap 'All N' to select everything and delete in one go." },
  ];

  useReminders(schedules, logs);

  const latestBw = useLiveQuery(async () => (await db.bodyweight.orderBy("date").last())?.kg, []);
  const proteinDefault = useSetting("proteinTargetG");
  const calorieTarget = useSetting("calorieTargetKcal");
  const carbTarget = useSetting("carbTargetG");
  const fatTarget = useSetting("fatTargetG");
  const proteinTarget = latestBw ? Math.round(latestBw * 1.8) : proteinDefault;

  const protein = meals.reduce((s, m) => s + m.protein, 0);
  const calories = meals.reduce((s, m) => s + m.calories, 0);
  const doneIds = new Set(logs.map((l) => l.scheduleId));

  async function toggleReminders(on: boolean) {
    if (on) {
      const ok = await requestReminderPermission();
      setRemindersOn(ok);
      if (!ok) message.info("Allow notifications in your browser to get reminders");
      else message.success("Reminders on while the app is open");
    } else setRemindersOn(false);
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
        right={<Button icon={<TbPlus />} onClick={() => setManageOpen(true)}>Schedule</Button>} />

      {/* Macro bar (add-on #3) — top of page so imbalances are obvious */}
      <Card size="small" style={{ marginBottom: 12 }} styles={{ body: { padding: "12px 14px" } }}>
        <MacroBar meals={meals} proteinTarget={proteinTarget} fatTarget={fatTarget}
          carbTarget={carbTarget} kcalTarget={calorieTarget} />
        {meals.length > 0 && (
          <div style={{ marginTop: 10, borderTop: "1px solid var(--border)", paddingTop: 8 }}>
            <TimeOfDayBar meals={meals} />
          </div>
        )}
      </Card>

      {/* 7-day macro trend — biggest data gap fixed: 12 writes, zero charts until now */}
      <WeeklyMacroChart />

      {/* Protein ring + calories — kept because the discipline ring on Home still uses protein */}
      <Card size="small" style={{ marginBottom: 12 }}>
        <Row gutter={16} align="middle">
          <Col span={10} style={{ textAlign: "center" }}>
            <Progress type="circle" size={104} percent={Math.min(100, Math.round((protein / proteinTarget) * 100))}
              strokeColor={t.accent}
              format={() => (
                <div style={{ lineHeight: 1.05, whiteSpace: "nowrap" }}>
                  <div className="display" style={{ fontSize: 18, fontWeight: 800 }}>{Math.round(protein)}<span style={{ fontSize: 11 }}>g</span></div>
                  <div style={{ fontSize: 10, color: "var(--ink-soft)" }}>of {proteinTarget}g</div>
                </div>
              )} />
            <div style={{ fontSize: 12, fontWeight: 600, marginTop: 6 }}>Protein</div>
          </Col>
          <Col span={14}>
            <div style={{ fontSize: 12, color: "var(--ink-soft)", marginBottom: 4 }}>Calories</div>
            <div className="display" style={{ fontSize: 22, fontWeight: 800, color: GOLD }}>{Math.round(calories)}<span style={{ fontSize: 12, color: "var(--ink-soft)", fontWeight: 600 }}> / {calorieTarget}</span></div>
            <div style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 6 }}>
              {calories < calorieTarget ? `${Math.max(0, calorieTarget - Math.round(calories))} kcal to your surplus goal — keep eating.` : "Surplus hit. Growth fuel locked in."}
            </div>
          </Col>
        </Row>
      </Card>

      {/* Reminder toggle + next up */}
      <Card size="small" style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <TbBell style={{ color: VIOLET, fontSize: 18 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700 }}>Reminders</div>
            <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>
              {nextUp ? `Next: ${nextUp.label} at ${nextUp.time}` : "Nothing scheduled"}
            </div>
          </div>
          <Switch checked={remindersOn} onChange={toggleReminders} />
        </div>
      </Card>

      {/* Today's schedule */}
      <SectionTitle title="Today's schedule" />
      {schedules.length === 0 ? (
        <Empty description="Add meds, supplements or meal times to build your daily plan." style={{ marginBottom: 12 }} />
      ) : (
        <div style={{ marginBottom: 12 }}>
          {schedules.map((s) => {
            const done = !!s.id && doneIds.has(s.id);
            const status = slotStatus(s.time, done);
            const meta = KIND_META[s.kind];
            return (
              <Card key={s.id} size="small" style={{ marginBottom: 8, opacity: done ? 0.7 : 1 }} styles={{ body: { padding: "12px 14px" } }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ fontSize: 22 }}>{meta.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, textDecoration: done ? "line-through" : "none" }}>{s.label}</div>
                    <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>
                      <TbClock /> {s.time}{s.dose ? ` · ${s.dose}` : ""}
                    </div>
                  </div>
                  <Tag color={STATUS_TAG[status].color} style={{ borderRadius: 8, margin: 0 }}>{STATUS_TAG[status].label}</Tag>
                  <Button type={done ? "default" : "primary"} shape="circle"
                    icon={<TbCircleCheck />} aria-label="Mark done"
                    onClick={() => s.id && markDone(s.id, !done)} />
                  <Popconfirm title="Delete this schedule?" okText="Delete" okButtonProps={{ danger: true }}
                    onConfirm={() => s.id && deleteSchedule(s.id)}>
                    <Button type="text" size="small" danger icon={<TbTrash />} aria-label="Delete" />
                  </Popconfirm>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Templates / combos row */}
      <TemplatesRow onCreateCombo={() => setComboOpen(true)} />

      {/* Meals today */}
      <SectionTitle title="Meals today" right={
        <div style={{ display: "flex", gap: 6 }}>
          {meals.length === 0 && (
            <Button size="small" icon={<TbCopy />} onClick={handleCopyYesterday}>Same as yesterday</Button>
          )}
          <Button type="primary" icon={<TbPlus />} onClick={() => setFoodOpen(true)}>Add food</Button>
        </div>
      } />

      {/* Quick water chips (add-on #7) — logging a meal often coincides with a drink */}
      <Card size="small" style={{ marginBottom: 12 }} styles={{ body: { padding: "10px 12px" } }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-soft)", marginRight: 4 }}>
            <TbDroplet style={{ verticalAlign: "-2px", color: "var(--teal)" }} /> Drink with your meal
          </span>
          {[200, 500, 1000].map((v) => (
            <Button key={v} size="small" onClick={() => quickWater(v)}>+{v}ml</Button>
          ))}
        </div>
      </Card>

      <Card size="small" styles={{ body: { padding: 0 } }}>
        <div className="sticky-cat-head" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <span>Meals · {meals.length}</span>
          {bulk.isSelecting && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, textTransform: "none", letterSpacing: 0, fontWeight: 600 }}>
              <Tag color="red" style={{ margin: 0 }}>{bulk.selected.size} selected</Tag>
              {/* Select-all — tap to grab every meal in one go instead of
                  long-pressing each item individually */}
              {bulk.selected.size < meals.length && (
                <Button size="small" type="text"
                  onClick={() => bulk.selectAll(meals.map((m) => m.id!).filter(Boolean))}
                  style={{ fontSize: 11, padding: "0 6px", color: "var(--accent)", fontWeight: 700 }}>
                  All {meals.length}
                </Button>
              )}
              <Popconfirm
                title="Delete selected?" okText="Delete" okButtonProps={{ danger: true }}
                onConfirm={async () => {
                  const ids = [...bulk.selected];
                  const snapshot: MealDto[] = meals.filter((m) => m.id != null && ids.includes(m.id));
                  bulk.clear();
                  await withUndo({
                    do:   async () => { for (const id of ids) await deleteMeal(id); },
                    undo: async () => { for (const m of snapshot) { const { id: _drop, ...rest } = m; await addMeal(rest); } },
                    label: `${ids.length} meal${ids.length === 1 ? "" : "s"} deleted`,
                  });
                }}
              >
                <Button size="small" danger type="primary" icon={<TbTrash />}>Delete</Button>
              </Popconfirm>
              <Button size="small" type="text" icon={<TbX />} onClick={bulk.clear} aria-label="Cancel selection" />
            </span>
          )}
        </div>
        <div style={{ padding: "8px 12px 12px" }}>
        {meals.length === 0 ? (
          <EmptyState
            icon={<ColdIcon glyph="blade-fork" size={80} />}
            title="No meals logged yet today"
            hint="Tap Add food to log from the catalog, or Same as yesterday to repeat."
            actionLabel="Add food"
            onAction={() => setFoodOpen(true)}
          />
        ) : (
          meals.sort((a, b) => a.time.localeCompare(b.time)).map((m) => {
            const id = m.id!;
            const isSelected = bulk.selected.has(id);
            return (
              <div
                key={id}
                onPointerDown={() => bulk.onItemPress(id)}
                onPointerUp={bulk.onItemUp}
                onPointerLeave={bulk.onItemUp}
                onClick={() => { if (bulk.isSelecting) bulk.toggle(id); }}
                style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "8px 0",
                  borderBottom: "1px solid var(--border)",
                  background: isSelected ? "rgba(255,39,64,0.10)" : "transparent",
                  borderRadius: 8, cursor: bulk.isSelecting ? "pointer" : "default",
                  userSelect: "none", touchAction: "manipulation",
                }}
              >
                {bulk.isSelecting && (
                  <Checkbox checked={isSelected} onChange={() => bulk.toggle(id)} aria-label={`Select ${m.name}`} />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {m.name} <Tag style={{ borderRadius: 6 }}>{m.mealType}</Tag>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>
                    {m.time} · {Math.round(m.protein)}g P
                    {m.fatG != null ? ` · ${Math.round(m.fatG)}g F` : ""}
                    {m.carbsG != null ? ` · ${Math.round(m.carbsG)}g C` : ""}
                    {" · "}{Math.round(m.calories)} kcal
                  </div>
                </div>
                {!bulk.isSelecting && (
                  <>
                    <Button type="text" size="small" icon={<TbBookmark />} onClick={async () => {
                      const name = prompt("Save this meal as a template. Name:", m.name);
                      if (name?.trim()) { await saveMealAsTemplate(m, name); message.success("Template saved"); }
                    }} aria-label="Save as template" />
                    <Button
                      type="text" size="small" danger icon={<TbTrash />}
                      aria-label="Delete meal"
                      onClick={async () => {
                        const { id: _drop, ...rest } = m;
                        await withUndo({
                          do:   () => deleteMeal(id),
                          undo: () => addMeal(rest).then(() => undefined),
                          label: `${m.name} deleted`,
                        });
                      }}
                    />
                  </>
                )}
              </div>
            );
          })
        )}
        </div>
      </Card>

      <ManageScheduleModal open={manageOpen} onClose={() => setManageOpen(false)} />
      <FoodPickerModal open={foodOpen} onClose={() => setFoodOpen(false)}
        defaultMealType={inferMealType()} />
      <MealComboBuilderModal open={comboOpen} onClose={() => setComboOpen(false)} />
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
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-soft)" }}>Quick log</span>
        <Button size="small" type="text" icon={<TbStack2 />} onClick={onCreateCombo}
          style={{ fontSize: 12 }}>New combo</Button>
      </div>
      {templates.length === 0 ? (
        <div style={{ fontSize: 12, color: "var(--ink-soft)", padding: "6px 2px" }}>
          Save a meal or build a combo to fast-log your usuals.
        </div>
      ) : (
        <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }}>
          {templates.map((tpl) => (
            <div key={tpl.id} style={{ position: "relative" }}>
              <button onClick={async () => { await logFromTemplate(tpl); hapticLight(); message.success(`Logged ${tpl.name}`); }}
                style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10,
                  padding: "6px 24px 6px 10px", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap",
                  cursor: "pointer", color: "var(--ink)" }}>
                {tpl.isCombo ? "🍱 " : ""}{tpl.name} · {Math.round(tpl.protein)}p / {Math.round(tpl.calories)}kcal
              </button>
              <Popconfirm title="Delete this template?" okText="Delete" okButtonProps={{ danger: true }}
                onConfirm={() => tpl.id && deleteMealTemplate(tpl.id)}>
                <button title="Delete"
                  style={{ position: "absolute", top: 2, right: 4, background: "none", border: "none",
                    color: "var(--ink-soft)", cursor: "pointer", padding: 0, fontSize: 14, lineHeight: 1 }}>×</button>
              </Popconfirm>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
