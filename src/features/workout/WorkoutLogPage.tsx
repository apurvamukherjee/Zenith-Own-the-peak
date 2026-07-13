import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Empty, Segmented, Button } from "antd";
import { LineChartOutlined } from "@ant-design/icons";
import { PageTransition } from "../../components/PageTransition";
import { SectionTitle } from "../../components/SectionTitle";
import { ExerciseCard } from "./ExerciseCard";
import { RestTimer } from "./RestTimer";
import { PPL_PROGRAM, dayTypeForDate, ALL_DAY_TYPES } from "../../config/pplProgram";
import type { DayType } from "../../db/types";
import { ensureSession, useSessionSets, useTodaySession } from "../../hooks/useWorkout";
import { prettyDate, todayKey } from "../../lib/date.utils";

export function WorkoutLogPage() {
  const autoDay = dayTypeForDate(new Date());
  const [dayType, setDayType] = useState<DayType>(autoDay === "Rest" ? "PushA" : autoDay);
  const [rest, setRest] = useState<{ key: number; seconds: number } | null>(null);

  const session = useTodaySession(dayType);
  const sessionIdRef = useRef<number | undefined>(undefined);
  useEffect(() => {
    sessionIdRef.current = session?.id;
  }, [session?.id]);

  const sets = useSessionSets(session?.id) ?? [];
  const plan = dayType !== "Rest" ? PPL_PROGRAM[dayType] : null;

  const setsByExercise = useMemo(() => {
    const map = new Map<string, typeof sets>();
    for (const s of sets) {
      const arr = map.get(s.exercise) ?? [];
      arr.push(s);
      map.set(s.exercise, arr);
    }
    return map;
  }, [sets]);

  // Lazily create the session the first time a set is logged.
  async function getSessionId(): Promise<number> {
    if (sessionIdRef.current) return sessionIdRef.current;
    const id = await ensureSession(dayType);
    sessionIdRef.current = id;
    return id;
  }

  return (
    <>
      <PageTransition>
        <SectionTitle
          eyebrow={prettyDate(todayKey())}
          title={autoDay === "Rest" ? "Rest day" : "Today's session"}
          right={<Link to="/progress"><Button icon={<LineChartOutlined />}>Progress</Button></Link>}
        />
        <Segmented
          block
          value={dayType}
          onChange={(v) => setDayType(v as DayType)}
          options={ALL_DAY_TYPES.map((d) => ({ label: PPL_PROGRAM[d].label, value: d }))}
          style={{ marginBottom: 6 }}
        />
        {plan && (
          <div style={{ fontSize: 13, color: "var(--ink-soft)", margin: "10px 2px 18px" }}>
            {plan.focus}
          </div>
        )}

        {!plan ? (
          <Empty description="Recovery day — muscle grows now, not in the gym." />
        ) : (
          plan.exercises.map((ex) => (
            <ExerciseCard
              key={ex.name}
              plan={ex}
              dayType={dayType}
              loggedSets={setsByExercise.get(ex.name) ?? []}
              getSessionId={getSessionId}
              onLogged={(restSec) => setRest({ key: Date.now(), seconds: restSec })}
            />
          ))
        )}
      </PageTransition>
      <RestTimer trigger={rest} />
    </>
  );
}
