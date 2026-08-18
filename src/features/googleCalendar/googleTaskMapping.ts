import dayjs from "dayjs";
import type { TaskDto, TaskPriority, TaskStatus } from "../../db/types";

// The one place that knows how a Zenith TaskDto and a Google Calendar event
// translate into each other. Both directions live here so the mapping can't
// drift between push and pull — everything else (the sync engine, the push
// action) treats these as opaque.

const TZ = Intl.DateTimeFormat().resolvedOptions().timeZone;

export interface GoogleEventBody {
  summary: string;
  location?: string;
  description?: string;
  start: { date?: string; dateTime?: string; timeZone?: string };
  end: { date?: string; dateTime?: string; timeZone?: string };
  extendedProperties: { private: Record<string, string> };
}

export interface PulledEventLike {
  id: string;
  status: "confirmed" | "tentative" | "cancelled";
  summary?: string;
  location?: string;
  description?: string;
  start?: { date?: string; dateTime?: string };
  end?: { date?: string; dateTime?: string };
  updated?: string;
  extendedProperties?: { private?: Record<string, string> };
}

/**
 * Zenith task → Google event body, for insert/patch. Google events have no
 * concept of Zenith's status/priority/listId/dose/remindBefore — stashed in
 * extendedProperties.private (invisible in Google's UI) so every pull is
 * lossless instead of a naive summary/description-only mapping.
 */
export function taskToGoogleEventBody(task: TaskDto): GoogleEventBody {
  const priv: Record<string, string> = {
    zenithTaskId: String(task.id),
    status: task.status,
    priority: String(task.priority),
    listId: task.listId,
  };
  if (task.dose) priv.dose = task.dose;
  if (task.remindBefore != null) priv.remindBefore = String(task.remindBefore);

  return {
    summary: task.title,
    ...(task.location ? { location: task.location } : {}),
    ...(task.notes ? { description: task.notes } : {}),
    ...timeRange(task),
    extendedProperties: { private: priv },
  };
}

function timeRange(task: TaskDto): Pick<GoogleEventBody, "start" | "end"> {
  const date = task.date!; // caller only ever passes dated tasks — see useGoogleCalendarSync

  if (task.allDay || !task.time) {
    // All-day (single or multi-day). Google's end.date is EXCLUSIVE — the
    // same +1-day convention lib/icsExport.ts already uses, so the two stay
    // consistent. A task with neither allDay nor a time also lands here: a
    // "point in time, no duration" event has no Google equivalent, so it's
    // represented as a single all-day event, same as the ICS export's fallback.
    const endDate = dayjs(task.spanEnd && task.spanEnd > date ? task.spanEnd : date).add(1, "day").format("YYYY-MM-DD");
    return { start: { date }, end: { date: endDate } };
  }

  const startDateTime = `${date}T${task.time}:00`;
  const endDateTime = `${date}T${task.endTime ?? task.time}:00`;
  return {
    start: { dateTime: startDateTime, timeZone: TZ },
    end: { dateTime: endDateTime, timeZone: TZ },
  };
}

export type TaskChanges = Partial<Pick<
  TaskDto,
  "title" | "status" | "priority" | "listId" | "date" | "time" | "endTime" | "allDay" | "spanEnd" | "location" | "notes" | "dose" | "remindBefore"
>>;

// Fallback for events with no Zenith metadata (created directly in Google
// Calendar's own UI) — "Daily Life" is the closest thing to a generic default
// among the seeded lists (config/seedTaskLists.ts).
const FALLBACK_LIST_ID = "daily";

/**
 * Google event → the TaskDto fields it should apply. A cancelled event maps
 * to Zenith's own `status: "cancelled"` (a soft update) rather than a local
 * delete — Zenith already has that status, so no tombstone concept is
 * needed for the pull direction; only push (Zenith → Google) needs the
 * outbox, since only Zenith hard-deletes rows.
 */
export function googleEventToTaskChanges(event: PulledEventLike): TaskChanges {
  if (event.status === "cancelled") return { status: "cancelled" };

  const priv = event.extendedProperties?.private;
  const { date, time, endTime, allDay, spanEnd } = timesFromEvent(event);

  return {
    title: event.summary || "(untitled)",
    status: (priv?.status as TaskStatus) ?? "todo",
    priority: (priv?.priority ? (Number(priv.priority) as TaskPriority) : undefined) ?? 2,
    listId: priv?.listId ?? FALLBACK_LIST_ID,
    date, time, endTime, allDay, spanEnd,
    ...(event.location ? { location: event.location } : {}),
    ...(event.description ? { notes: event.description } : {}),
    ...(priv?.dose ? { dose: priv.dose } : {}),
    ...(priv?.remindBefore ? { remindBefore: Number(priv.remindBefore) } : {}),
  };
}

function timesFromEvent(event: PulledEventLike): { date: string; time?: string; endTime?: string; allDay?: number; spanEnd?: string } {
  if (event.start?.date) {
    // All-day. end.date is exclusive — subtract a day to get the inclusive
    // last day, and only set spanEnd when it's genuinely multi-day.
    const date = event.start.date;
    const lastDay = event.end?.date ? dayjs(event.end.date).subtract(1, "day").format("YYYY-MM-DD") : date;
    return { date, allDay: 1, spanEnd: lastDay > date ? lastDay : undefined };
  }
  const start = dayjs(event.start?.dateTime);
  const date = start.format("YYYY-MM-DD");
  const time = start.format("HH:mm");
  const end = event.end?.dateTime ? dayjs(event.end.dateTime).format("HH:mm") : undefined;
  return { date, time, endTime: end && end !== time ? end : undefined };
}
