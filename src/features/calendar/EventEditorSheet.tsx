import { useEffect, useMemo, useState } from "react";
import { Button, Input, Select, Switch } from "antd";
import {
  TbBarbell, TbPill, TbCapsule, TbToolsKitchen2, TbBook2, TbHome,
  TbTrash, TbCheck, TbBell, TbRepeat, TbMapPin, TbX,
} from "react-icons/tb";
import dayjs from "dayjs";
import { Sheet } from "../../components/Sheet";
import { TimeSelect } from "../../components/TimeSelect";
import { SmartInputNumber } from "../../components/SmartInputNumber";
import { useBackClose } from "../../hooks/useBackClose";
import { useTaskLists, addTask, updateTask, deleteTask, completeTask } from "../tasks/useTasks";
import { stopRecurringSeries, spawnRecurring } from "../tasks/useRecurringSpawner";
import { db } from "../../db/db";
import { todayKey } from "../../lib/date.utils";
import { hapticLight, hapticSuccess } from "../../lib/haptics";
import type { TaskDto, TaskPriority } from "../../db/types";

type Recurrence = "none" | "daily" | "weekly" | "monthly";

interface Props {
  open: boolean;
  onClose: () => void;
  task?: TaskDto | null;       // present → edit mode; absent → create mode
  defaultDate?: string;
  defaultTime?: string;
  defaultEndTime?: string;
  onComplete?: (task: TaskDto) => void; // if provided, routes completion (e.g. through useMealCompletion)
}

const TYPE_PRESETS = [
  { listId: "gym", label: "Workout", icon: TbBarbell },
  { listId: "medicine", label: "Med", icon: TbPill },
  { listId: "supplement", label: "Supplement", icon: TbCapsule },
  { listId: "mealtime", label: "Meal", icon: TbToolsKitchen2 },
  { listId: "study", label: "Study", icon: TbBook2 },
  { listId: "daily", label: "Personal", icon: TbHome },
];
const PRIORITIES: { value: TaskPriority; label: string; color: string }[] = [
  { value: 1, label: "Urgent", color: "#ff2740" },
  { value: 2, label: "Normal", color: "var(--ink-soft)" },
  { value: 3, label: "Low", color: "var(--teal)" },
];
const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

export function EventEditorSheet({ open, onClose, task, defaultDate, defaultTime, defaultEndTime, onComplete }: Props) {
  useBackClose(open, onClose);
  const lists = useTaskLists();
  const morePresetLists = useMemo(
    () => lists.filter((l) => !TYPE_PRESETS.some((p) => p.listId === l.id)),
    [lists],
  );

  const [listId, setListId] = useState("daily");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(todayKey());
  const [allDay, setAllDay] = useState(false);
  const [isMultiDay, setIsMultiDay] = useState(false);
  const [spanEnd, setSpanEnd] = useState(todayKey());
  const [hasTime, setHasTime] = useState(false);
  const [time, setTime] = useState("09:00");
  const [hasEnd, setHasEnd] = useState(false);
  const [endTime, setEndTime] = useState("10:00");
  const [priority, setPriority] = useState<TaskPriority>(2);
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [dose, setDose] = useState("");
  const [reminderOn, setReminderOn] = useState(false);
  const [remindBefore, setRemindBefore] = useState(10);
  const [recurrence, setRecurrence] = useState<Recurrence>("none");
  const [weekdays, setWeekdays] = useState<number[]>([]);

  const isEdit = !!task;
  const isMedish = listId === "medicine" || listId === "supplement";
  const isRecurringInstance = !!task?.recurringRuleId;

  useEffect(() => {
    if (!open) return;
    if (task) {
      setListId(task.listId);
      setTitle(task.title);
      setDate(task.date ?? todayKey());
      setAllDay(!!task.allDay);
      setIsMultiDay(!!task.spanEnd && task.spanEnd !== task.date);
      setSpanEnd(task.spanEnd ?? task.date ?? todayKey());
      setHasTime(!!task.time);
      setTime(task.time ?? "09:00");
      setHasEnd(!!task.endTime);
      setEndTime(task.endTime ?? "10:00");
      setPriority(task.priority);
      setLocation(task.location ?? "");
      setNotes(task.notes ?? "");
      setDose(task.dose ?? "");
      setReminderOn(task.remindBefore != null);
      setRemindBefore(task.remindBefore ?? 10);
      setRecurrence("none");
      setWeekdays([]);
    } else {
      setListId("daily");
      setTitle("");
      setDate(defaultDate ?? todayKey());
      setAllDay(false);
      setIsMultiDay(false);
      setSpanEnd(defaultDate ?? todayKey());
      setHasTime(!!defaultTime);
      setTime(defaultTime ?? "09:00");
      setHasEnd(!!defaultEndTime);
      setEndTime(defaultEndTime ?? "10:00");
      setPriority(2);
      setLocation("");
      setNotes("");
      setDose("");
      setReminderOn(false);
      setRemindBefore(10);
      setRecurrence("none");
      setWeekdays([]);
    }
  }, [open, task, defaultDate, defaultTime, defaultEndTime]);

  function toggleWeekday(d: number) {
    setWeekdays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort()));
  }

  async function handleSave() {
    if (!title.trim()) return;
    const finalTime = !allDay && hasTime ? time : undefined;
    const finalEndTime = !allDay && hasTime && hasEnd ? endTime : undefined;
    const finalDose = isMedish ? (dose.trim() || undefined) : undefined;
    const finalRemindBefore = !allDay && reminderOn && hasTime ? remindBefore : undefined;
    const finalAllDay = allDay ? 1 : undefined;
    const finalSpanEnd = allDay && isMultiDay ? (spanEnd >= date ? spanEnd : date) : undefined;

    if (!task && recurrence !== "none") {
      await db.recurringRules.add({
        frequency: recurrence,
        interval: 1,
        weekdays: recurrence === "weekly" && weekdays.length ? weekdays.join(",") : undefined,
        active: 1,
        templateTitle: title.trim(),
        templateListId: listId,
        templatePriority: priority,
        templateTime: finalTime,
        templateEndTime: finalEndTime,
        templateDose: finalDose,
        templateRemindBefore: finalRemindBefore,
        templateAllDay: finalAllDay,
        createdAt: Date.now(),
      });
      await spawnRecurring(todayKey(), dayjs().add(60, "day").format("YYYY-MM-DD"));
    } else if (task?.id) {
      await updateTask(task.id, {
        title: title.trim(), listId, priority, date, time: finalTime, endTime: finalEndTime,
        location: location.trim() || undefined, notes: notes.trim() || undefined,
        dose: finalDose, remindBefore: finalRemindBefore,
        allDay: finalAllDay, spanEnd: finalSpanEnd,
      });
    } else {
      await addTask({
        title: title.trim(), listId, priority, date, time: finalTime, endTime: finalEndTime,
        location: location.trim() || undefined, notes: notes.trim() || undefined,
        dose: finalDose, remindBefore: finalRemindBefore,
        allDay: finalAllDay, spanEnd: finalSpanEnd,
      });
    }
    hapticSuccess();
    onClose();
  }

  async function handleDelete() {
    if (!task?.id) return;
    await deleteTask(task.id);
    hapticLight();
    onClose();
  }

  async function handleStopSeries() {
    if (!task?.recurringRuleId || !task.id) return;
    await stopRecurringSeries(task.recurringRuleId);
    await deleteTask(task.id);
    hapticLight();
    onClose();
  }

  async function handleComplete() {
    if (!task?.id) return;
    if (onComplete) { onComplete(task); onClose(); return; }
    await completeTask(task.id);
    hapticSuccess();
    onClose();
  }

  return (
    <Sheet open={open} onCancel={onClose} footer={null} title={isEdit ? "Edit event" : "New event"}
      styles={{ body: { maxHeight: "70vh", overflowY: "auto" } }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 8 }}>
        {/* Type presets */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-soft)", marginBottom: 6 }}>Type</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {TYPE_PRESETS.map((p) => {
              const Icon = p.icon;
              const active = listId === p.listId;
              return (
                <button key={p.listId} onClick={() => setListId(p.listId)} style={{
                  display: "flex", alignItems: "center", gap: 5, padding: "6px 10px", borderRadius: 10,
                  border: `1px solid ${active ? "var(--accent)" : "var(--border)"}`,
                  background: active ? "var(--accent)18" : "var(--surface)",
                  color: active ? "var(--accent)" : "var(--ink)",
                  fontSize: 12, fontWeight: 700, cursor: "pointer",
                }}>
                  <Icon size={13} /> {p.label}
                </button>
              );
            })}
            {morePresetLists.length > 0 && (
              <Select size="small" placeholder="More…" value={undefined}
                onChange={(v: string) => setListId(v)}
                options={morePresetLists.map((l) => ({ label: l.name, value: l.id }))}
                style={{ minWidth: 90 }} />
            )}
          </div>
          {!TYPE_PRESETS.some((p) => p.listId === listId) && (
            <div style={{ fontSize: 11, color: "var(--ink-soft)", marginTop: 4 }}>
              List: {lists.find((l) => l.id === listId)?.name ?? listId}
            </div>
          )}
        </div>

        <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)}
          onPressEnter={handleSave} autoFocus />

        {isMedish && (
          <Input placeholder="Dose (optional, e.g. 500mg)" value={dose} onChange={(e) => setDose(e.target.value)} />
        )}

        {/* Date + time */}
        <div>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
            style={{ padding: 8, borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--ink)", width: "100%" }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>All-day</span>
          <Switch size="small" checked={allDay} onChange={setAllDay} />
        </div>
        {allDay && (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>Spans multiple days</span>
              <Switch size="small" checked={isMultiDay} onChange={(v) => { setIsMultiDay(v); if (v && spanEnd < date) setSpanEnd(date); }} />
            </div>
            {isMultiDay && (
              <div>
                <div style={{ fontSize: 11, color: "var(--ink-soft)", marginBottom: 4 }}>Until</div>
                <input type="date" value={spanEnd} min={date} onChange={(e) => setSpanEnd(e.target.value)}
                  style={{ padding: 8, borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--ink)", width: "100%" }} />
              </div>
            )}
          </>
        )}
        {!allDay && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Specific time</span>
            <Switch size="small" checked={hasTime} onChange={setHasTime} />
          </div>
        )}
        {!allDay && hasTime && (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 12, color: "var(--ink-soft)" }}>Starts</span>
              <TimeSelect value={time} onChange={setTime} size="small" />
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>Time block (has an end)</span>
              <Switch size="small" checked={hasEnd} onChange={setHasEnd} />
            </div>
            {hasEnd && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 12, color: "var(--ink-soft)" }}>Ends</span>
                <TimeSelect value={endTime} onChange={setEndTime} size="small" />
              </div>
            )}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}>
                <TbBell size={14} /> Remind me
              </span>
              <Switch size="small" checked={reminderOn} onChange={setReminderOn} />
            </div>
            {reminderOn && (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <SmartInputNumber size="small" min={0} max={1440} value={remindBefore}
                  onChange={(v) => setRemindBefore(v == null ? 10 : Number(v))} style={{ width: 90 }} />
                <span style={{ fontSize: 12, color: "var(--ink-soft)" }}>minutes before</span>
              </div>
            )}
          </>
        )}

        {/* Recurrence — create mode only */}
        {!isEdit && (
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: "flex", alignItems: "center", gap: 5 }}>
              <TbRepeat size={14} /> Repeats
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {(["none", "daily", "weekly", "monthly"] as Recurrence[]).map((r) => (
                <button key={r} onClick={() => setRecurrence(r)} style={{
                  flex: 1, padding: "6px 0", borderRadius: 8, fontSize: 12, fontWeight: 700, textTransform: "capitalize",
                  border: `1px solid ${recurrence === r ? "var(--accent)" : "var(--border)"}`,
                  background: recurrence === r ? "var(--accent)18" : "var(--surface)",
                  color: recurrence === r ? "var(--accent)" : "var(--ink)", cursor: "pointer",
                }}>
                  {r}
                </button>
              ))}
            </div>
            {recurrence === "weekly" && (
              <div style={{ display: "flex", gap: 4, marginTop: 8 }}>
                {WEEKDAYS.map((label, i) => (
                  <button key={i} onClick={() => toggleWeekday(i)} style={{
                    width: 30, height: 30, borderRadius: "50%", fontSize: 11, fontWeight: 700,
                    border: `1px solid ${weekdays.includes(i) ? "var(--accent)" : "var(--border)"}`,
                    background: weekdays.includes(i) ? "var(--accent)" : "transparent",
                    color: weekdays.includes(i) ? "#fff" : "var(--ink)", cursor: "pointer",
                  }}>
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        {isRecurringInstance && (
          <div style={{ fontSize: 11, color: "var(--ink-soft)", fontStyle: "italic" }}>
            Part of a repeating series — editing here only changes this occurrence.
          </div>
        )}

        <Input placeholder="Location (optional)" prefix={<TbMapPin size={14} style={{ color: "var(--ink-soft)" }} />}
          value={location} onChange={(e) => setLocation(e.target.value)} />
        <Input.TextArea placeholder="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />

        {/* Priority */}
        <div style={{ display: "flex", gap: 6 }}>
          {PRIORITIES.map((p) => (
            <button key={p.value} onClick={() => setPriority(p.value)} style={{
              flex: 1, padding: "6px 0", borderRadius: 8, fontSize: 12, fontWeight: 700,
              border: `1px solid ${priority === p.value ? p.color : "var(--border)"}`,
              background: priority === p.value ? `${p.color}18` : "var(--surface)",
              color: priority === p.value ? p.color : "var(--ink)", cursor: "pointer",
            }}>
              {p.label}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
          {isEdit && task?.status !== "done" && (
            <Button icon={<TbCheck />} onClick={handleComplete}>Done</Button>
          )}
          <Button type="primary" onClick={handleSave} style={{ flex: 1 }}>
            {isEdit ? "Save" : "Create"}
          </Button>
        </div>
        {isEdit && (
          <div style={{ display: "flex", gap: 8 }}>
            {isRecurringInstance && (
              <Button danger icon={<TbX />} onClick={handleStopSeries} style={{ flex: 1 }}>Stop series</Button>
            )}
            <Button danger icon={<TbTrash />} onClick={handleDelete} style={{ flex: 1 }}>Delete</Button>
          </div>
        )}
      </div>
    </Sheet>
  );
}
