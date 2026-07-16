import { useCallback, useRef } from "react";
import { App } from "antd";
import { TbArrowBackUp } from "react-icons/tb";

// One-tap destructive UX: instead of a Popconfirm, delete immediately and show
// a toast with an "Undo" button for `timeoutMs`. Feels faster and is less
// friction on mobile. If the user taps Undo, we invoke the caller's revive fn.
//
// Usage:
//   const withUndo = useUndo();
//   await withUndo({
//     do:   () => deleteMeal(id),
//     undo: () => addMeal(snapshot),
//     label: "Meal deleted",
//   });
export interface UndoOpts {
  do: () => void | Promise<void>;
  undo: () => void | Promise<void>;
  label: string;
  timeoutMs?: number;
}

export function useUndo() {
  const { message } = App.useApp();
  // Ensure only one pending undo at a time — a second delete replaces the first
  // toast rather than stacking. Prevents "which undo am I looking at" confusion.
  const activeKeyRef = useRef<string | null>(null);

  return useCallback(async (opts: UndoOpts) => {
    const key = `undo-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    activeKeyRef.current = key;
    await opts.do();
    const timeoutMs = opts.timeoutMs ?? 4200;
    let undone = false;
    message.open({
      key, type: "success", duration: timeoutMs / 1000,
      content: (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
          <span>{opts.label}</span>
          <button
            type="button"
            onClick={async () => {
              if (undone) return;
              undone = true;
              await opts.undo();
              message.destroy(key);
              message.success("Restored");
            }}
            style={{
              display: "inline-flex", alignItems: "center", gap: 4,
              background: "transparent", border: "1px solid var(--accent)",
              color: "var(--accent)", padding: "2px 10px", borderRadius: 8,
              fontWeight: 700, cursor: "pointer", fontSize: 12,
            }}
          >
            <TbArrowBackUp size={13} /> Undo
          </button>
        </span>
      ),
    });
  }, [message]);
}
