import { InputNumber, type InputNumberProps } from "antd";
import { useNumericInputMode } from "../hooks/useNumericInputMode";

// Drop-in replacement for antd InputNumber that:
//  - uses inputMode="decimal" on touch-first devices (mobile soft keyboard)
//  - skips inputMode on hover-capable devices (desktop with real keyboard)
// This avoids the "software number pad pops up on desktop" issue.
//
// The antd InputNumber onChange fires with `value: ValueType | null`.
// SmartInputNumber preserves that signature exactly so existing onChange
// handlers don't need to change.
export function SmartInputNumber(props: InputNumberProps) {
  const inputMode = useNumericInputMode();
  return <InputNumber inputMode={inputMode} {...props} />;
}

// Convenience cast helper — lets callers narrow the onChange value to number
// without wrapping every single handler: `onChange={(v) => setN(asNum(v, 0))}`.
export function asNum(v: unknown, fallback = 0): number {
  const n = Number(v);
  return isNaN(n) ? fallback : n;
}
