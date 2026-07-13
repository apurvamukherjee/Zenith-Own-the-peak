import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../db/db";
import type { StudyItemDto, StudyPathDto, StudyStatus, StudySource } from "../../db/types";
import { lastNDates, todayKey } from "../../lib/date.utils";

export function usePaths() {
  return useLiveQuery(() => db.studyPaths.orderBy("createdAt").toArray(), []) ?? [];
}
export function useItems(pathId?: number) {
  return useLiveQuery(
    () => (pathId ? db.studyItems.where({ pathId }).sortBy("order") : Promise.resolve([] as StudyItemDto[])),
    [pathId],
  ) ?? [];
}
export function useAllItems() {
  return useLiveQuery(() => db.studyItems.toArray(), []) ?? [];
}
export function useWeeklyStudy() {
  const dates = lastNDates(7);
  return useLiveQuery(async () => {
    const all = await db.studySessions.where("date").anyOf(dates).toArray();
    return dates.map((d) => ({
      date: d.slice(5),
      min: all.filter((s) => s.date === d).reduce((sum, s) => sum + s.minutes, 0),
    }));
  }, [dates.join()]) ?? [];
}

export async function addPath(p: { title: string; sourceType: StudySource; sourceUrl?: string }) {
  return db.studyPaths.add({ ...p, createdAt: Date.now() });
}
export async function deletePath(id: number) {
  await db.studyItems.where({ pathId: id }).delete();
  await db.studySessions.where({ pathId: id }).delete();
  await db.studyPaths.delete(id);
}
export async function addItem(pathId: number, title: string) {
  const count = await db.studyItems.where({ pathId }).count();
  return db.studyItems.add({ pathId, title, order: count, status: "todo" });
}
export async function cycleStatus(item: StudyItemDto) {
  const next: Record<StudyStatus, StudyStatus> = { todo: "doing", doing: "done", done: "todo" };
  if (item.id) await db.studyItems.update(item.id, { status: next[item.status] });
}
export async function updateNotes(id: number, notes: string) {
  await db.studyItems.update(id, { notes });
}
export async function deleteItem(id: number) {
  await db.studyItems.delete(id);
}
export async function logStudyMinutes(pathId: number, minutes: number) {
  await db.studySessions.add({ pathId, minutes, date: todayKey() });
}

export function pathProgress(items: StudyItemDto[]) {
  const total = items.length;
  const done = items.filter((i) => i.status === "done").length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const upNext = items.find((i) => i.status !== "done");
  return { total, done, pct, upNext };
}

export function sourceLabel(p: StudyPathDto): string {
  return { youtube: "YouTube", playlist: "Playlist", course: "Course", book: "Book", other: "Source" }[p.sourceType];
}
