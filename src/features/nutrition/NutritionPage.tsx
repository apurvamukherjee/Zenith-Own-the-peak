import { useState } from "react";
import {
  Card, Progress, Button, Modal, Input, InputNumber, TimePicker, Segmented,
  Tag, App, Empty, Row, Col, Switch,
} from "antd";
import {
  PlusOutlined, DeleteOutlined, CheckCircleFilled, BellOutlined, ClockCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useLiveQuery } from "dexie-react-hooks";
import { PageTransition } from "../../components/PageTransition";
import { SectionTitle } from "../../components/SectionTitle";
import { db } from "../../db/db";
import type { MealType, ScheduleKind } from "../../db/types";
import {
  useSchedules, useTodayLogs, useTodayMeals, addSchedule, deleteSchedule, markDone,
  addMeal, deleteMeal, slotStatus, KIND_META, nowHHMM,
} from "./useNutrition";
import { useReminders, requestReminderPermission } from "../../hooks/useReminders";
import { useSetting } from "../../hooks/useSettings";
import { VIOLET, GOLD } from "../../theme";
import { useTokens } from "../../hooks/useTokens";

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
  const [mealOpen, setMealOpen] = useState(false);
  const [remindersOn, setRemindersOn] = useState(typeof Notification !== "undefined" && Notification.permission === "granted");

  useReminders(schedules, logs);

  const latestBw = useLiveQuery(async () => (await db.bodyweight.orderBy("date").last())?.kg, []);
  const proteinDefault = useSetting("proteinTargetG");
  const calorieTarget = useSetting("calorieTargetKcal");
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

  return (
    <PageTransition>
      <SectionTitle eyebrow="Fuel your body" title="Nutrition"
        right={<Button icon={<PlusOutlined />} onClick={() => setManageOpen(true)}>Schedule</Button>} />

      {/* Macros */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col span={10} style={{ textAlign: "center" }}>
            <Progress type="circle" size={110} percent={Math.min(100, Math.round((protein / proteinTarget) * 100))}
              strokeColor={t.accent}
              format={() => <div><div className="display" style={{ fontSize: 22, fontWeight: 800 }}>{protein}g</div><div style={{ fontSize: 11, color: "var(--ink-soft)" }}>of {proteinTarget}g</div></div>} />
            <div style={{ fontSize: 12, fontWeight: 600, marginTop: 6 }}>Protein</div>
          </Col>
          <Col span={14}>
            <div style={{ fontSize: 12, color: "var(--ink-soft)", marginBottom: 4 }}>Calories</div>
            <div className="display" style={{ fontSize: 24, fontWeight: 800, color: GOLD }}>{calories}<span style={{ fontSize: 13, color: "var(--ink-soft)", fontWeight: 600 }}> / {calorieTarget}</span></div>
            <Progress percent={Math.min(100, Math.round((calories / calorieTarget) * 100))} strokeColor={t.gold} showInfo={false} />
            <div style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 8 }}>
              {calories < calorieTarget ? `${calorieTarget - calories} kcal to your surplus goal — keep eating.` : "Surplus hit. Growth fuel in. 💪"}
            </div>
          </Col>
        </Row>
      </Card>

      {/* Reminder toggle + next up */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <BellOutlined style={{ color: VIOLET, fontSize: 18 }} />
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
        <Empty description="Add meds, supplements or meal times to build your daily plan." style={{ marginBottom: 16 }} />
      ) : (
        <div style={{ marginBottom: 16 }}>
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
                      <ClockCircleOutlined /> {s.time}{s.dose ? ` · ${s.dose}` : ""}
                    </div>
                  </div>
                  <Tag color={STATUS_TAG[status].color} style={{ borderRadius: 8, margin: 0 }}>{STATUS_TAG[status].label}</Tag>
                  <Button type={done ? "default" : "primary"} shape="circle"
                    icon={<CheckCircleFilled />} aria-label="Mark done"
                    onClick={() => s.id && markDone(s.id, !done)} />
                  <Button type="text" size="small" danger icon={<DeleteOutlined />}
                    onClick={() => s.id && deleteSchedule(s.id)} aria-label="Delete" />
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Meals today */}
      <SectionTitle title="Meals today" right={<Button type="primary" icon={<PlusOutlined />} onClick={() => setMealOpen(true)}>Meal</Button>} />
      <Card size="small">
        {meals.length === 0 ? <Empty description="No meals logged yet." /> : (
          meals.sort((a, b) => a.time.localeCompare(b.time)).map((m) => (
            <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid #f2f1f7" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{m.name} <Tag style={{ borderRadius: 6 }}>{m.mealType}</Tag></div>
                <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>{m.time} · {m.protein}g P · {m.calories} kcal</div>
              </div>
              <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={() => m.id && deleteMeal(m.id)} aria-label="Delete meal" />
            </div>
          ))
        )}
      </Card>

      <ManageScheduleModal open={manageOpen} onClose={() => setManageOpen(false)} />
      <AddMealModal open={mealOpen} onClose={() => setMealOpen(false)} />
    </PageTransition>
  );
}

function ManageScheduleModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [kind, setKind] = useState<ScheduleKind>("med");
  const [label, setLabel] = useState("");
  const [dose, setDose] = useState("");
  const [time, setTime] = useState(dayjs());
  function submit() {
    if (!label.trim()) return;
    addSchedule({ kind, label: label.trim(), dose: dose.trim() || undefined, time: time.format("HH:mm") });
    setLabel(""); setDose("");
  }
  return (
    <Modal open={open} title="Add to schedule" onCancel={onClose} onOk={submit} okText="Add" footer={[
      <Button key="c" onClick={onClose}>Close</Button>,
      <Button key="a" type="primary" onClick={submit}>Add</Button>,
    ]}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 8 }}>
        <Segmented block value={kind} onChange={(v) => setKind(v as ScheduleKind)}
          options={[{ label: "💊 Med", value: "med" }, { label: "🧪 Supplement", value: "supplement" }, { label: "🍽️ Meal", value: "meal" }]} />
        <Input placeholder="Name (e.g. Creatine, Breakfast)" value={label} onChange={(e) => setLabel(e.target.value)} />
        <div style={{ display: "flex", gap: 10 }}>
          <Input placeholder="Dose / note (optional)" value={dose} onChange={(e) => setDose(e.target.value)} style={{ flex: 1 }} />
          <TimePicker value={time} onChange={(v) => v && setTime(v)} format="HH:mm" allowClear={false} needConfirm={false} />
        </div>
      </div>
    </Modal>
  );
}

function AddMealModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { message } = App.useApp();
  const [name, setName] = useState("");
  const [type, setType] = useState<MealType>("breakfast");
  const [protein, setProtein] = useState<number>();
  const [calories, setCalories] = useState<number>();
  function submit() {
    if (!name.trim()) { message.warning("Name the meal"); return; }
    addMeal({ date: dayjs().format("YYYY-MM-DD"), time: nowHHMM(), name: name.trim(), mealType: type, protein: protein ?? 0, calories: calories ?? 0 });
    setName(""); setProtein(undefined); setCalories(undefined); onClose();
  }
  return (
    <Modal open={open} title="Log a meal" onCancel={onClose} onOk={submit} okText="Log">
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 8 }}>
        <Input placeholder="What did you eat?" value={name} onChange={(e) => setName(e.target.value)} />
        <Segmented block value={type} onChange={(v) => setType(v as MealType)}
          options={[{ label: "Breakfast", value: "breakfast" }, { label: "Lunch", value: "lunch" }, { label: "Dinner", value: "dinner" }, { label: "Snack", value: "snack" }]} />
        <Row gutter={10}>
          <Col span={12}><InputNumber value={protein} onChange={(v) => setProtein(v ?? undefined)} placeholder="Protein g" style={{ width: "100%" }} controls={false} min={0} /></Col>
          <Col span={12}><InputNumber value={calories} onChange={(v) => setCalories(v ?? undefined)} placeholder="Calories" style={{ width: "100%" }} controls={false} min={0} /></Col>
        </Row>
        <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>Rough estimates are fine — consistency beats precision.</div>
      </div>
    </Modal>
  );
}

