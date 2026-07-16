import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useSetting } from "../hooks/useSettings";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db/db";
import { todayKey } from "../lib/date.utils";
import { todayMonthDay } from "../lib/easterEggs";

// Egg #7 — logs a *set today* on the user's configured birthday → rain
// 30 s of red confetti flakes over the whole app. Configured via
// Settings → Profile → Birthday (MM-DD). Idempotent: fires once per birthday.

interface Flake { id: number; x: number; delay: number; drift: number; rot: number; }

export function BirthdayConfetti() {
  const birthday = String(useSetting("birthday") ?? "");
  const setsToday = useLiveQuery(
    () => db.workoutSets.where("date").equals(todayKey()).count(),
    [],
  ) ?? 0;

  const [rainKey, setRainKey] = useState(0);
  const firedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!birthday || birthday !== todayMonthDay()) return;
    if (setsToday <= 0) return;
    const stamp = `${todayKey()}`;
    if (firedRef.current === stamp) return;
    firedRef.current = stamp;
    setRainKey((k) => k + 1);
    const stop = window.setTimeout(() => setRainKey(0), 30_000);
    return () => window.clearTimeout(stop);
  }, [birthday, setsToday]);

  const flakes: Flake[] = useMemo(() => {
    const arr: Flake[] = [];
    for (let i = 0; i < 40; i++) {
      arr.push({
        id: i,
        x: Math.random() * 100,
        delay: Math.random() * 6,
        drift: (Math.random() - 0.5) * 60,
        rot: (Math.random() - 0.5) * 720,
      });
    }
    return arr;
  }, [rainKey]);

  if (rainKey === 0) return null;

  return (
    <div aria-hidden style={{
      position: "fixed", inset: 0, zIndex: 190,
      pointerEvents: "none", overflow: "hidden",
    }}>
      {flakes.map((f) => (
        <motion.div
          key={`${rainKey}-${f.id}`}
          initial={{ y: -20, x: 0, opacity: 0, rotate: 0 }}
          animate={{ y: "110vh", x: f.drift, opacity: [0, 1, 1, 0], rotate: f.rot }}
          transition={{ duration: 6 + Math.random() * 3, delay: f.delay, repeat: Infinity, repeatDelay: 0, ease: "linear" }}
          style={{
            position: "absolute", left: `${f.x}%`, top: 0,
            width: 8, height: 12, borderRadius: 2,
            background: Math.random() < 0.7 ? "#ff2740" : "#f6b93b",
          }}
        />
      ))}
    </div>
  );
}
