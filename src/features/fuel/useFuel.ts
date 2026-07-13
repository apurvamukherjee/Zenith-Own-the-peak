import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../db/db";
import type { FuelDto } from "../../db/types";
import { monthKey, todayKey } from "../../lib/date.utils";

export interface FuelRow extends FuelDto {
  distanceKm: number | null;  // vs previous fill
  mileage: number | null;     // km per litre (full-to-full)
}

export function useFuel() {
  return useLiveQuery(() => db.fuel.orderBy("odometer").toArray(), []) ?? [];
}

export async function addFuel(entry: Omit<FuelDto, "id">) {
  return db.fuel.add(entry);
}
export async function deleteFuel(id: number) {
  await db.fuel.delete(id);
}

// Full-to-full: mileage for a fill = (this odo - prev odo) / litres of this fill.
export function computeRows(fills: FuelDto[]): FuelRow[] {
  const sorted = [...fills].sort((a, b) => a.odometer - b.odometer);
  return sorted.map((f, i) => {
    if (i === 0) return { ...f, distanceKm: null, mileage: null };
    const distanceKm = f.odometer - sorted[i - 1].odometer;
    const mileage = f.litres > 0 ? +(distanceKm / f.litres).toFixed(1) : null;
    return { ...f, distanceKm, mileage };
  });
}

export function fuelStats(rows: FuelRow[]) {
  const withMileage = rows.filter((r) => r.mileage !== null) as (FuelRow & { mileage: number })[];
  const avgMileage = withMileage.length
    ? +(withMileage.reduce((s, r) => s + r.mileage, 0) / withMileage.length).toFixed(1) : 0;
  const latestMileage = withMileage.length ? withMileage[withMileage.length - 1].mileage : 0;
  const totalKm = rows.length > 1 ? rows[rows.length - 1].odometer - rows[0].odometer : 0;
  const totalCost = rows.reduce((s, r) => s + r.cost, 0);
  const costPerKm = totalKm > 0 ? +(totalCost / totalKm).toFixed(2) : 0;
  const thisMonth = monthKey(todayKey());
  const monthSpend = rows.filter((r) => monthKey(r.date) === thisMonth).reduce((s, r) => s + r.cost, 0);
  return { avgMileage, latestMileage, totalKm, totalCost, costPerKm, monthSpend };
}
