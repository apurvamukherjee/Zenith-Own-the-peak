import type { TaskDto } from "../db/types";

// Minimal RFC 5545 ICS builder. Recurring rules aren't re-expressed as RRULEs
// — spawnRecurring already materializes each occurrence as a real dated
// TaskDto row, so exporting "every task in a date window" naturally covers
// recurring items too, without RRULE edge cases.
function escapeText(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

function foldLine(line: string): string {
  // ICS lines >75 octets should be folded; simple char-based approximation.
  if (line.length <= 75) return line;
  const parts: string[] = [];
  let rest = line;
  while (rest.length > 75) {
    parts.push(rest.slice(0, 75));
    rest = " " + rest.slice(75);
  }
  parts.push(rest);
  return parts.join("\r\n");
}

function dtStamp(): string {
  return new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

function toICSDate(date: string): string {
  return date.replace(/-/g, "");
}
function toICSDateTime(date: string, time: string): string {
  return `${date.replace(/-/g, "")}T${time.replace(":", "")}00`;
}

export function buildICS(tasks: TaskDto[]): string {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Zenith//Calendar Export//EN",
    "CALSCALE:GREGORIAN",
  ];
  for (const t of tasks) {
    if (!t.id || !t.date) continue;
    lines.push("BEGIN:VEVENT");
    lines.push(`UID:zenith-task-${t.id}@zenith.app`);
    lines.push(`DTSTAMP:${dtStamp()}`);
    if (t.allDay) {
      lines.push(`DTSTART;VALUE=DATE:${toICSDate(t.date)}`);
      const spanEnd = t.spanEnd && t.spanEnd >= t.date ? t.spanEnd : t.date;
      // ICS all-day DTEND is exclusive — bump one day past the last inclusive day.
      const endExclusive = new Date(spanEnd + "T00:00:00");
      endExclusive.setDate(endExclusive.getDate() + 1);
      lines.push(`DTEND;VALUE=DATE:${toICSDate(endExclusive.toISOString().slice(0, 10))}`);
    } else if (t.time) {
      lines.push(`DTSTART:${toICSDateTime(t.date, t.time)}`);
      const end = t.endTime ?? t.time;
      lines.push(`DTEND:${toICSDateTime(t.date, end)}`);
    } else {
      lines.push(`DTSTART;VALUE=DATE:${toICSDate(t.date)}`);
    }
    lines.push(foldLine(`SUMMARY:${escapeText(t.title)}`));
    if (t.location) lines.push(foldLine(`LOCATION:${escapeText(t.location)}`));
    if (t.notes) lines.push(foldLine(`DESCRIPTION:${escapeText(t.notes)}`));
    if (t.status === "done") lines.push("STATUS:CONFIRMED");
    lines.push("END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

// Triggers a share sheet (mobile) or a file download (desktop) for the given
// ICS content — one-way export only, no two-way sync.
export async function exportICS(filename: string, ics: string): Promise<void> {
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const file = new File([blob], filename, { type: "text/calendar" });
  const nav = navigator as Navigator & { canShare?: (data: { files: File[] }) => boolean };
  if (nav.canShare?.({ files: [file] }) && navigator.share) {
    try {
      await navigator.share({ files: [file], title: filename });
      return;
    } catch {
      // fall through to download
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
