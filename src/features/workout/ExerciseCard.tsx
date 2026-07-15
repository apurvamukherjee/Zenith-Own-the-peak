// import { useState } from "react";
// import { Card, InputNumber, Button, App, Tag } from "antd";
// import { CheckOutlined, TrophyFilled, UndoOutlined } from "@ant-design/icons";
// import { motion } from "framer-motion";
// import type { DayType, ExercisePlan, WorkoutSetDto } from "../../db/types";
// import { useGhostSets, logSet, deleteSet } from "../../hooks/useWorkout";
// import { GOLD, TEAL } from "../../theme";

// interface Props {
//   plan: ExercisePlan;
//   dayType: DayType;
//   loggedSets: WorkoutSetDto[];
//   getSessionId: () => Promise<number>;
//   onLogged: (restSec: number) => void;
// }

// export function ExerciseCard({ plan, dayType, loggedSets, getSessionId, onLogged }: Props) {
//   const { message } = App.useApp();
//   const ghost = useGhostSets(dayType, plan.name) ?? [];
//   const [draft, setDraft] = useState<Record<number, { w?: number; r?: number }>>({});

//   const doneCount = loggedSets.length;
//   const rows = Array.from({ length: plan.sets }, (_, i) => i + 1);

//   async function handleLog(setIndex: number) {
//     const g = ghost.find((x) => x.setIndex === setIndex);
//     const d = draft[setIndex] ?? {};
//     const weightKg = d.w ?? g?.weightKg ?? 0;
//     const reps = d.r ?? g?.reps ?? 0;
//     if (weightKg <= 0 || reps <= 0) {
//       message.warning("Add weight and reps first");
//       return;
//     }
//     const sessionId = await getSessionId();
//     const { isPR } = await logSet({ sessionId, exercise: plan.name, setIndex, weightKg, reps });
//     onLogged(plan.restSec);
//     if (isPR) message.success({ content: `New PR on ${plan.name}! 🏆`, duration: 2.5 });
//     setDraft((p) => ({ ...p, [setIndex]: {} }));
//   }

//   return (
//     <Card
//       style={{ marginBottom: 14 }}
//       styles={{ body: { padding: 16 } }}
//       title={
//         <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
//           <span style={{ fontWeight: 700 }}>{plan.name}</span>
//           <Tag color={doneCount >= plan.sets ? TEAL : "default"} style={{ borderRadius: 8, margin: 0 }}>
//             {doneCount}/{plan.sets}
//           </Tag>
//         </div>
//       }
//     >
//       <div style={{ fontSize: 12, color: "var(--ink-soft)", marginBottom: 12 }}>
//         Target {plan.sets} × {plan.repLow}–{plan.repHigh} · rest {plan.restSec}s
//       </div>

//       {rows.map((setIndex) => {
//         const logged = loggedSets.find((s) => s.setIndex === setIndex);
//         const g = ghost.find((x) => x.setIndex === setIndex);
//         const d = draft[setIndex] ?? {};

//         if (logged) {
//           return (
//             <motion.div
//               key={setIndex}
//               initial={{ scale: 0.96, opacity: 0.6 }}
//               animate={{ scale: 1, opacity: 1 }}
//               style={{
//                 display: "flex", alignItems: "center", gap: 10, marginBottom: 8,
//                 background: logged.isPR ? "rgba(255,176,32,0.12)" : "rgba(18,179,161,0.10)",
//                 borderRadius: 12, padding: "8px 12px",
//               }}
//             >
//               <span style={{ width: 26, fontWeight: 700, color: "var(--ink-soft)" }}>{setIndex}</span>
//               <span style={{ flex: 1, fontWeight: 600 }}>
//                 {logged.weightKg} kg × {logged.reps}
//               </span>
//               {logged.isPR && <TrophyFilled style={{ color: GOLD }} />}
//               <span style={{ fontSize: 12, color: "var(--ink-soft)" }}>e1RM {logged.e1rm}</span>
//               <Button
//                 type="text" size="small" icon={<UndoOutlined />} aria-label="Undo set"
//                 onClick={() => logged.id && deleteSet(logged.id)}
//               />
//             </motion.div>
//           );
//         }

//         return (
//           <div key={setIndex} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
//             <span style={{ width: 26, fontWeight: 700, color: "var(--ink-soft)" }}>{setIndex}</span>
//             <div className="ghost" style={{ flex: 1 }}>
//               <InputNumber
//                 inputMode="decimal" min={0} value={d.w} controls={false}
//                 placeholder={g ? `${g.weightKg}` : "kg"}
//                 onChange={(v) => setDraft((p) => ({ ...p, [setIndex]: { ...p[setIndex], w: v ?? undefined } }))}
//                 style={{ width: "100%" }} suffix="kg"
//               />
//             </div>
//             <div className="ghost" style={{ flex: 1 }}>
//               <InputNumber
//                 inputMode="numeric" min={0} value={d.r} controls={false}
//                 placeholder={g ? `${g.reps}` : "reps"}
//                 onChange={(v) => setDraft((p) => ({ ...p, [setIndex]: { ...p[setIndex], r: v ?? undefined } }))}
//                 style={{ width: "100%" }} suffix="reps"
//               />
//             </div>
//             <Button type="primary" icon={<CheckOutlined />} onClick={() => handleLog(setIndex)} aria-label="Log set" />
//           </div>
//         );
//       })}
//     </Card>
//   );
// }
