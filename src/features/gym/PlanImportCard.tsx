import { useRef, useState } from "react";
import { Card, Button, App, Segmented, Collapse, Typography } from "antd";
import { TbDownload, TbUpload, TbCode } from "react-icons/tb";
import { validateWorkoutPlanFile, exportWorkoutPlan, importWorkoutPlan } from "../../lib/workoutPlanFile";

const EXAMPLE = `{
  "type": "zenith-workout-plan",
  "version": 1,
  "days": [
    {
      "name": "Push A",
      "muscles": ["chest", "shoulders", "triceps"],
      "exercises": [
        { "name": "Incline Dumbbell Press", "sets": 3, "repLow": 6, "repHigh": 10, "weightKg": 14, "restSec": 150 },
        { "name": "Lateral Raise", "sets": 3, "repLow": 12, "repHigh": 20, "weightKg": 6, "restSec": 75, "superset": "A" },
        { "name": "Triceps Pushdown", "sets": 3, "repLow": 10, "repHigh": 15, "weightKg": 15, "restSec": 75, "superset": "A" }
      ]
    }
  ],
  "schedule": { "mon": "Push A", "tue": "Rest" }
}`;

// Advanced Settings feature — bulk import/export a full workout program (days
// + exercises + weekly schedule) as one JSON file. Not secretly hidden, just
// a normal card at the bottom of Settings for users who'd rather script a
// plan than click through the Planner. Full field reference:
// docs/WORKOUT_PLAN_FORMAT.md
export function PlanImportCard() {
  const { message, modal } = App.useApp();
  const [mode, setMode] = useState<"add" | "replace">("add");
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleDownload() {
    const plan = await exportWorkoutPlan();
    const json = JSON.stringify(plan, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `zenith-workout-plan-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    message.success("Plan file downloaded");
  }

  function handleFile(file: File) {
    const reader = new FileReader();
    reader.onload = async () => {
      let parsed: unknown;
      try { parsed = JSON.parse(String(reader.result)); }
      catch { modal.error({ title: "Couldn't read that file", content: "It isn't valid JSON." }); return; }

      const result = await validateWorkoutPlanFile(parsed);
      if (!result.ok) {
        modal.error({
          title: "Plan file has errors",
          content: (
            <ul style={{ paddingLeft: 18, margin: 0 }}>
              {result.errors.map((e, i) => <li key={i} style={{ fontSize: 13 }}>{e}</li>)}
            </ul>
          ),
        });
        return;
      }

      const { plan, warnings } = result;
      const exerciseCount = plan.days.reduce((n, d) => n + d.exercises.length, 0);
      const summaryLines = [
        `${plan.days.length} day${plan.days.length === 1 ? "" : "s"}, ${exerciseCount} exercise${exerciseCount === 1 ? "" : "s"}.`,
        ...(warnings.length ? warnings : []),
      ];
      const danger = mode === "replace";
      modal.confirm({
        title: danger ? "Replace your entire plan?" : "Import this plan?",
        content: (
          <div>
            {danger && <p style={{ marginBottom: 8 }}>This deletes all current workout days, exercises-in-days, and the weekly schedule first. Your logged history and exercise library are never touched.</p>}
            <ul style={{ paddingLeft: 18, margin: 0 }}>
              {summaryLines.map((l, i) => <li key={i} style={{ fontSize: 13 }}>{l}</li>)}
            </ul>
          </div>
        ),
        okText: danger ? "Replace" : "Import",
        okButtonProps: danger ? { danger: true } : undefined,
        onOk: async () => {
          try {
            const res = await importWorkoutPlan(plan, mode);
            modal.success({
              title: "Plan imported",
              content: (
                <ul style={{ paddingLeft: 18, margin: 0 }}>
                  <li style={{ fontSize: 13 }}>{res.daysCreated} day{res.daysCreated === 1 ? "" : "s"} created</li>
                  <li style={{ fontSize: 13 }}>{res.exercisesCreated} new exercise{res.exercisesCreated === 1 ? "" : "s"} added to your library</li>
                  {res.warnings.map((w, i) => <li key={i} style={{ fontSize: 13 }}>{w}</li>)}
                </ul>
              ),
            });
          } catch {
            message.error("Import failed — nothing was changed.");
          }
        },
      });
    };
    reader.readAsText(file);
  }

  return (
    <Card size="small" style={{ marginBottom: 12 }} title={<span><TbCode style={{ verticalAlign: "-2px" }} /> Plan file (advanced)</span>}>
      <div style={{ fontSize: 12, color: "var(--ink-soft)", marginBottom: 12 }}>
        Bulk-load a whole program — days, exercises, sets/reps/weight, and the weekly schedule — from one JSON file instead of building it by hand in the Planner.
      </div>
      <div style={{ fontSize: 12, color: "var(--ink-soft)", marginBottom: 6 }}>On upload</div>
      <Segmented
        block value={mode} onChange={(v) => setMode(v as "add" | "replace")}
        options={[
          { label: "Add as new days", value: "add" },
          { label: "Replace all days", value: "replace" },
        ]}
        style={{ marginBottom: 12 }}
      />
      <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
        <Button block icon={<TbDownload />} onClick={handleDownload}>Download</Button>
        <Button block icon={<TbUpload />} onClick={() => fileRef.current?.click()}>Upload</Button>
      </div>
      <Collapse ghost size="small" items={[{
        key: "ref", label: "Format reference",
        children: (
          <div>
            <Typography.Paragraph style={{ fontSize: 12, color: "var(--ink-soft)" }}>
              Full field reference in <code>docs/WORKOUT_PLAN_FORMAT.md</code>. Minimal example:
            </Typography.Paragraph>
            <pre style={{
              fontSize: 11, background: "var(--nav-bg)", border: "1px solid var(--border)",
              borderRadius: 8, padding: 10, overflowX: "auto", margin: 0,
            }}>{EXAMPLE}</pre>
          </div>
        ),
      }]} />
      <input ref={fileRef} type="file" accept="application/json" hidden
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }} />
    </Card>
  );
}
