import { useEffect, useState } from "react";
import { Progress, Button } from "antd";
import { motion } from "framer-motion";
import { TbFlame, TbShare, TbArrowLeft } from "react-icons/tb";
import { useNavigate } from "react-router-dom";
import { useSetting } from "../../hooks/useSettings";
import { useTokens } from "../../hooks/useTokens";
import { useTodayWater, useWorkoutToday } from "../water/useWater";
import { computeUnifiedStreak } from "../../lib/streak.utils";
import { computeTodayScore } from "../../lib/todayScore";

// A screenshot-friendly "today at a glance" summary. Meant to be a nice photo
// to share, or the layout that will drive a phone widget once Capacitor is
// wrapped. Zero chrome — just the ring, streak, and brand.
export function GlancePage() {
  const t = useTokens();
  const navigate = useNavigate();
  const name = useSetting("name");
  const waterGoal = useSetting("waterGoalMl");
  const proteinTarget = useSetting("proteinTargetG");
  const { total: waterMl } = useTodayWater();
  const trained = useWorkoutToday();
  const [streak, setStreak] = useState(0);
  const [score, setScore] = useState({ score: 0, waterPct: 0, sessionDone: false, sleepLogged: false, proteinPct: 0 });

  useEffect(() => { computeUnifiedStreak().then(setStreak); }, [waterMl, trained]);
  useEffect(() => { computeTodayScore(waterGoal, proteinTarget).then(setScore); }, [waterMl, waterGoal, proteinTarget]);

  const today = new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "short" });

  function share() {
    const text = `Zenith — ${today}\nDiscipline ${score.score}% · ${streak}-day streak · ${name}`;
    if (navigator.share) navigator.share({ title: "Zenith", text }).catch(() => {});
    else navigator.clipboard?.writeText(text);
  }

  return (
    <div style={{
      minHeight: "100dvh", background: "linear-gradient(160deg,#08060a 0%,#1a0509 30%,#6e0f1c 70%,#d81f34 100%)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      color: "#fff", padding: "40px 20px", position: "relative",
    }}>
      <Button type="text" icon={<TbArrowLeft />} onClick={() => navigate(-1)}
        style={{ position: "absolute", top: 20, left: 20, color: "#fff" }} />
      <Button type="text" icon={<TbShare />} onClick={share}
        style={{ position: "absolute", top: 20, right: 20, color: "#fff" }} />

      <div style={{ fontSize: 12, fontWeight: 700, opacity: 0.7, letterSpacing: 2, textTransform: "uppercase" }}>{today}</div>
      <div className="display" style={{ fontSize: 32, fontWeight: 800, marginTop: 2, marginBottom: 20 }}>{name}</div>

      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
        <Progress type="dashboard" percent={score.score} size={200} strokeColor={t.accent} strokeWidth={10}
          format={() => (
            <div>
              <div className="display" style={{ fontSize: 48, fontWeight: 800, color: "#fff", lineHeight: 1 }}>{score.score}%</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}>discipline</div>
            </div>
          )} />
      </motion.div>

      <div style={{ marginTop: 24, display: "flex", alignItems: "center", gap: 6, fontSize: 20, fontWeight: 800 }}>
        <TbFlame /> {streak}-day streak
      </div>

      <div style={{ marginTop: "auto", fontSize: 11, letterSpacing: 2, opacity: 0.5 }}>
        ZENITH · OWN THE PEAK
      </div>
    </div>
  );
}
