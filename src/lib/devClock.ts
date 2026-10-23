// Dev only: `?now=2026-11-10T09:00` shifts this tab's clock so date-gated
// features (the Winter Arc runs Nov 1 → Dec 31) can be tested before they're
// live. The offset sticks for the tab via sessionStorage; `?now=off` clears it.
// main.tsx only calls this behind import.meta.env.DEV, so prod never ships it.
export function installDevClock(): void {
  const KEY = "zenith-dev-now";
  const param = new URLSearchParams(location.search).get("now");
  if (param === "off") { sessionStorage.removeItem(KEY); return; }
  const raw = param ?? sessionStorage.getItem(KEY);
  if (!raw) return;
  const RealDate = Date;
  const target = new RealDate(raw).getTime();
  if (Number.isNaN(target)) return;
  sessionStorage.setItem(KEY, raw);
  const offset = target - RealDate.now();

  class ShiftedDate extends RealDate {
    // Only the no-arg form reads "now"; every explicit form passes straight through.
    constructor(...args: unknown[]) {
      if (args.length === 0) super(RealDate.now() + offset);
      else super(...(args as [number]));
    }
    static now() { return RealDate.now() + offset; }
  }
  globalThis.Date = ShiftedDate as DateConstructor;
  console.info(`[devClock] now = ${new Date().toString()}`);
}
