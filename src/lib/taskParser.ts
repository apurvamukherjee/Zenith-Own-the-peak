import dayjs from "dayjs";

// ─────────────────────────────────────────────────────────────────────────────
// NATURAL LANGUAGE TASK PARSER
// Extracts date, time, priority, location, recurrence from free-text input.
// Whatever tokens aren't matched become the title.
// Offline, zero-dependency (only dayjs for date math).
// ─────────────────────────────────────────────────────────────────────────────

export interface ParsedTask {
  title: string;
  date?: string;       // YYYY-MM-DD
  time?: string;       // HH:mm
  endTime?: string;    // HH:mm
  priority?: 1 | 2 | 3;
  location?: string;
  recurring?: { frequency: "daily" | "weekly" | "monthly"; weekdays?: number[] };
}

const WEEKDAYS: Record<string, number> = {
  sunday: 0, sun: 0, monday: 1, mon: 1, tuesday: 2, tue: 2, tues: 2,
  wednesday: 3, wed: 3, thursday: 4, thu: 4, thurs: 4,
  friday: 5, fri: 5, saturday: 6, sat: 6,
};

export function parseTaskInput(raw: string): ParsedTask {
  let text = raw.trim();
  const result: ParsedTask = { title: "" };

  // ── Priority ────────────────────────────────────────────────────────────
  if (/\b(urgent|p1|!!)\b/i.test(text)) { result.priority = 1; text = text.replace(/\b(urgent|p1|!!)\b/gi, ""); }
  else if (/\b(low|p3|chill)\b/i.test(text)) { result.priority = 3; text = text.replace(/\b(low|p3|chill)\b/gi, ""); }
  else if (/\b(p2|normal|medium)\b/i.test(text)) { result.priority = 2; text = text.replace(/\b(p2|normal|medium)\b/gi, ""); }

  // ── Recurrence ──────────────────────────────────────────────────────────
  const recDaily = /\b(?:every\s*day|daily)\b/i.exec(text);
  if (recDaily) { result.recurring = { frequency: "daily" }; text = text.replace(recDaily[0], ""); }

  const recWeekly = /\b(?:every\s*week|weekly)\b/i.exec(text);
  if (recWeekly) { result.recurring = { frequency: "weekly" }; text = text.replace(recWeekly[0], ""); }

  const recMonthly = /\b(?:every\s*month|monthly)\b/i.exec(text);
  if (recMonthly) { result.recurring = { frequency: "monthly" }; text = text.replace(recMonthly[0], ""); }

  const recWeekday = /\bevery\s+((?:mon|tue|wed|thu|fri|sat|sun)\w*)/i.exec(text);
  if (recWeekday && !result.recurring) {
    const day = WEEKDAYS[recWeekday[1].toLowerCase().slice(0, 3)];
    if (day !== undefined) {
      result.recurring = { frequency: "weekly", weekdays: [day] };
      text = text.replace(recWeekday[0], "");
    }
  }

  // ── Location ("at X" or "@ X") ──────────────────────────────────────────
  const locMatch = /\b(?:at|@)\s+(.+?)(?=\s+(?:tomorrow|today|next|in\s+\d|every|\d{1,2}(?:am|pm|:\d{2}))|$)/i.exec(text);
  if (locMatch && locMatch[1].length > 1 && !/^\d{1,2}(?:am|pm|:\d{2})/i.test(locMatch[1])) {
    result.location = locMatch[1].trim();
    text = text.replace(locMatch[0], "");
  }

  // ── Duration ("for 1h", "for 30min") ────────────────────────────────────
  let durationMin = 0;
  const durMatch = /\bfor\s+(\d+)\s*(?:h(?:ours?)?|hr)/i.exec(text);
  if (durMatch) { durationMin = parseInt(durMatch[1]) * 60; text = text.replace(durMatch[0], ""); }
  const durMinMatch = /\bfor\s+(\d+)\s*(?:min(?:utes?)?|m)\b/i.exec(text);
  if (durMinMatch) { durationMin += parseInt(durMinMatch[1]); text = text.replace(durMinMatch[0], ""); }

  // ── Time (12h: "9am", "2:30pm"; 24h: "14:00") ──────────────────────────
  const timeMatch = /\b(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i.exec(text);
  if (timeMatch) {
    let h = parseInt(timeMatch[1]);
    const m = parseInt(timeMatch[2] || "0");
    const ampm = timeMatch[3].toLowerCase();
    if (ampm === "pm" && h < 12) h += 12;
    if (ampm === "am" && h === 12) h = 0;
    result.time = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    text = text.replace(timeMatch[0], "");
  }
  const time24 = /\b(\d{2}):(\d{2})\b/.exec(text);
  if (!result.time && time24) {
    result.time = `${time24[1]}:${time24[2]}`;
    text = text.replace(time24[0], "");
  }

  // Compute endTime from duration
  if (result.time && durationMin > 0) {
    const [h, m] = result.time.split(":").map(Number);
    const totalMin = h * 60 + m + durationMin;
    result.endTime = `${String(Math.floor(totalMin / 60) % 24).padStart(2, "0")}:${String(totalMin % 60).padStart(2, "0")}`;
  }

  // ── Relative date ───────────────────────────────────────────────────────
  if (/\btoday\b/i.test(text)) { result.date = dayjs().format("YYYY-MM-DD"); text = text.replace(/\btoday\b/gi, ""); }
  else if (/\b(?:tomorrow|tmrw|tom)\b/i.test(text)) { result.date = dayjs().add(1, "day").format("YYYY-MM-DD"); text = text.replace(/\b(?:tomorrow|tmrw|tom)\b/gi, ""); }
  else if (/\byesterday\b/i.test(text)) { result.date = dayjs().subtract(1, "day").format("YYYY-MM-DD"); text = text.replace(/\byesterday\b/gi, ""); }

  const inN = /\bin\s+(\d+)\s*(day|week|month)s?\b/i.exec(text);
  if (inN && !result.date) {
    result.date = dayjs().add(parseInt(inN[1]), inN[2].toLowerCase() as any).format("YYYY-MM-DD");
    text = text.replace(inN[0], "");
  }

  const nextDay = /\bnext\s+(\w+)\b/i.exec(text);
  if (nextDay && !result.date) {
    const wd = WEEKDAYS[nextDay[1].toLowerCase().slice(0, 3)];
    if (wd !== undefined) {
      let target = dayjs().day(wd);
      if (target.isBefore(dayjs()) || target.isSame(dayjs(), "day")) target = target.add(7, "day");
      result.date = target.format("YYYY-MM-DD");
      text = text.replace(nextDay[0], "");
    }
  }

  // Bare weekday name without "next" → next occurrence
  for (const [name, wd] of Object.entries(WEEKDAYS)) {
    const re = new RegExp(`\\b${name}\\b`, "i");
    if (!result.date && re.test(text)) {
      let target = dayjs().day(wd);
      if (target.isBefore(dayjs()) || target.isSame(dayjs(), "day")) target = target.add(7, "day");
      result.date = target.format("YYYY-MM-DD");
      text = text.replace(re, "");
      break;
    }
  }

  // ── Title = whatever remains ────────────────────────────────────────────
  result.title = text.replace(/\s{2,}/g, " ").replace(/^\s+|\s+$/g, "");

  return result;
}
