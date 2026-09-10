import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input, Modal } from "antd";
import {
  TbSearch, TbHome, TbBarbell, TbCalendar, TbSettings, TbMeat,
  TbDroplet, TbMoon, TbBook2, TbGasStation, TbClipboardList, TbTrophy, TbBolt, TbCheckbox,
  TbWallet, TbInbox,
} from "react-icons/tb";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db/db";
import { useBackClose } from "../hooks/useBackClose";
import { addWater } from "../features/water/useWater";
import { hapticLight } from "../lib/haptics";
import type { IconType } from "react-icons";

// Cmd+K / Ctrl+K anywhere → searchable command overlay.
// Substring match (case-insensitive) — fast, dependency-free.
interface Command {
  id: string;
  label: string;
  hint?: string;
  icon: IconType;
  action: () => void | Promise<void>;
  keywords?: string;
}

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  useBackClose(open, onClose);
  const navigate = useNavigate();
  const [q, setQ] = useState("");

  // Dynamic sources: exercises + foods + tasks. Names alone; the palette just navigates.
  const exercises = useLiveQuery(() => db.exercises.orderBy("name").toArray(), []) ?? [];
  const foods = useLiveQuery(() => db.foods.orderBy("name").toArray(), []) ?? [];
  const tasks = useLiveQuery(() => db.tasks.where("status").anyOf(["todo", "in_progress"]).toArray(), []) ?? [];

  const commands: Command[] = useMemo(() => {
    const nav = (path: string) => () => { navigate(path); onClose(); };
    const water = (ml: number) => async () => {
      await addWater(ml);
      void hapticLight();
      onClose();
    };
    const base: Command[] = [
      { id: "nav-home", label: "Go to Home", icon: TbHome, action: nav("/"), keywords: "dashboard" },
      { id: "nav-train", label: "Log workout", icon: TbBarbell, action: nav("/workout"), keywords: "gym session sets" },
      { id: "nav-plan", label: "Open Planner", icon: TbClipboardList, action: nav("/planner"), keywords: "program routine" },
      { id: "nav-nutr", label: "Open Nutrition", icon: TbMeat, action: nav("/nutrition"), keywords: "meals macros protein food" },
      { id: "nav-water", label: "Open Water", icon: TbDroplet, action: nav("/water"), keywords: "hydration" },
      { id: "nav-sleep", label: "Open Sleep", icon: TbMoon, action: nav("/sleep"), keywords: "bedtime" },
      { id: "nav-study", label: "Open Study", icon: TbBook2, action: nav("/study"), keywords: "learn topics" },
      { id: "nav-fuel", label: "Open Fuel", icon: TbGasStation, action: nav("/fuel"), keywords: "bike mileage" },
      { id: "nav-expenses", label: "Open War Chest", icon: TbWallet, action: nav("/expenses"), keywords: "expense budget money spend upi" },
      { id: "nav-inbox", label: "Open Inbox", icon: TbInbox, action: nav("/tasks?list=inbox"), keywords: "capture brain dump quick task" },
      { id: "nav-cal", label: "Open Calendar", icon: TbCalendar, action: nav("/calendar"), keywords: "month heatmap" },
      { id: "nav-hall", label: "Hall of Frame", icon: TbTrophy, action: nav("/hall"), keywords: "achievements badges" },
      { id: "nav-set", label: "Open Settings", icon: TbSettings, action: nav("/settings"), keywords: "profile targets theme" },
      { id: "nav-quick", label: "Quick log", icon: TbBolt, action: nav("/quick"), keywords: "shortcut" },
      { id: "act-water-250", label: "Log 250ml water", hint: "Quick log", icon: TbDroplet, action: water(250) },
      { id: "act-water-500", label: "Log 500ml water", hint: "Quick log", icon: TbDroplet, action: water(500) },
      { id: "act-water-1l", label: "Log 1L water", hint: "Quick log", icon: TbDroplet, action: water(1000) },
    ];
    // Dynamic commands: jump to /progress focused on an exercise, log a food.
    for (const ex of exercises.slice(0, 40)) {
      base.push({
        id: `ex-${ex.id}`, label: ex.name, hint: "exercise · view progress",
        icon: TbBarbell, action: nav(`/progress`), keywords: (ex.primaryMuscle ?? "") + " workout",
      });
    }
    for (const f of foods.slice(0, 40)) {
      base.push({
        id: `food-${f.id}`, label: f.name, hint: "food · log meal",
        icon: TbMeat, action: nav("/nutrition"), keywords: f.category ?? "",
      });
    }
    for (const t of tasks.slice(0, 30)) {
      base.push({
        id: `task-${t.id}`, label: t.title, hint: `task · ${t.listId}`,
        icon: TbCheckbox, action: nav(`/tasks?list=${t.listId}`),
        keywords: (t.listId ?? "") + " " + (t.location ?? "") + " " + (t.description ?? ""),
      });
    }
    return base;
  }, [exercises, foods, tasks, navigate, onClose]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return commands.slice(0, 12);
    return commands
      .filter((c) => {
        const hay = (c.label + " " + (c.keywords ?? "") + " " + (c.hint ?? "")).toLowerCase();
        return hay.includes(s);
      })
      .slice(0, 20);
  }, [q, commands]);

  const [cursor, setCursor] = useState(0);
  useEffect(() => { setCursor(0); }, [q]);

  return (
    <Modal
      open={open} onCancel={onClose} footer={null} title={null} closable={false}
      styles={{ body: { padding: 0 }, content: { padding: 0 } }}
      width={520} destroyOnHidden
    >
      <div style={{ padding: 12, borderBottom: "1px solid var(--border)" }}>
        <Input
          size="large" autoFocus placeholder="Type a command…"
          prefix={<TbSearch />} value={q}
          onChange={(e) => setQ(e.target.value)}
          onPressEnter={() => { const c = filtered[cursor]; if (c) void c.action(); }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") { e.preventDefault(); setCursor((i) => Math.min(filtered.length - 1, i + 1)); }
            else if (e.key === "ArrowUp") { e.preventDefault(); setCursor((i) => Math.max(0, i - 1)); }
            else if (e.key === "Escape") { onClose(); }
          }}
        />
      </div>
      <div style={{ maxHeight: 400, overflowY: "auto" }}>
        {filtered.length === 0 ? (
          <div style={{ padding: 16, color: "var(--ink-soft)", textAlign: "center", fontSize: 13 }}>
            No matches.
          </div>
        ) : filtered.map((c, i) => {
          const Icon = c.icon;
          const active = i === cursor;
          return (
            <button
              key={c.id} type="button"
              onMouseEnter={() => setCursor(i)}
              onClick={() => void c.action()}
              style={{
                display: "flex", width: "100%", alignItems: "center", gap: 10,
                padding: "10px 14px", border: "none",
                background: active ? "var(--surface-2)" : "transparent",
                color: "var(--ink)", textAlign: "left", cursor: "pointer",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <Icon size={16} style={{ color: "var(--accent)", flex: "0 0 auto" }} />
              <span style={{ fontSize: 13, fontWeight: 600, flex: 1, minWidth: 0, textOverflow: "ellipsis", whiteSpace: "nowrap", overflow: "hidden" }}>
                {c.label}
              </span>
              {c.hint && <span style={{ fontSize: 11, color: "var(--ink-soft)" }}>{c.hint}</span>}
            </button>
          );
        })}
      </div>
      <div style={{ padding: "6px 12px", fontSize: 10, color: "var(--ink-soft)", borderTop: "1px solid var(--border)" }}>
        ↑↓ navigate · ↵ run · esc close
      </div>
    </Modal>
  );
}

// Global mounter — wraps CommandPalette with a hotkey listener. Import once.
export function CommandPaletteHost() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    function onKey(ev: KeyboardEvent) {
      if ((ev.metaKey || ev.ctrlKey) && (ev.key === "k" || ev.key === "K")) {
        ev.preventDefault();
        setOpen((v) => !v);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  return <CommandPalette open={open} onClose={() => setOpen(false)} />;
}
