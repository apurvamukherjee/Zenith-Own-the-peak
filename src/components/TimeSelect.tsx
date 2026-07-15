import { Select } from "antd";

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = ["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"];

// Two plain <Select> dropdowns instead of antd's TimePicker. TimePicker's
// scrollable column panel has a known bug on touch devices: with a controlled
// `value` + `needConfirm={false}`, mid-scroll onChange events race the
// re-render and the picker snaps back to the last committed hour (looks
// "stuck"). Two Selects sidestep the whole scroll-panel mechanism — tap to
// choose, no keyboard, no scrolling, no race condition.
export function TimeSelect({ value, onChange, size = "middle" }: {
  value: string; // "HH:mm"
  onChange: (next: string) => void;
  size?: "small" | "middle" | "large";
}) {
  const [h, m] = value.split(":");

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      <Select
        size={size} value={h} popupMatchSelectWidth={false}
        onChange={(nh) => onChange(`${nh}:${m}`)}
        options={HOURS.map((x) => ({ label: x, value: x }))}
        style={{ width: size === "small" ? 62 : 76 }}
      />
      <span style={{ fontWeight: 700, color: "var(--ink-soft)" }}>:</span>
      <Select
        size={size} value={m} popupMatchSelectWidth={false}
        onChange={(nm) => onChange(`${h}:${nm}`)}
        options={MINUTES.map((x) => ({ label: x, value: x }))}
        style={{ width: size === "small" ? 62 : 76 }}
      />
    </div>
  );
}
