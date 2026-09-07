import { Button, Tag, App, Popconfirm } from "antd";
import { TbCheck, TbPlus, TbEdit, TbCopy, TbTrash, TbRefresh, TbBarbell } from "react-icons/tb";
import { Sheet } from "../../components/Sheet";
import { useBackClose } from "../../hooks/useBackClose";
import type { WorkoutPlanRowDto } from "../../db/types";
import {
  useWorkoutPlans, useActivePlanId, switchToPlan, createCustomPlan,
  renamePlan, deletePlan, resetBuiltInPlan, planDayNames, planExerciseCount,
} from "./usePlans";

interface Props { open: boolean; onClose: () => void; }

function PlanCard({ plan, isActive, onActivate, onReset, onRename, onDuplicate, onDelete }: {
  plan: WorkoutPlanRowDto; isActive: boolean;
  onActivate: () => void; onReset?: () => void;
  onRename: () => void; onDuplicate: () => void; onDelete: () => void;
}) {
  const dayNames = planDayNames(plan);
  return (
    <div style={{
      background: "var(--surface)", borderRadius: 14, padding: 12, marginBottom: 10,
      border: isActive ? "1px solid var(--accent)" : "1px solid var(--border)",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 14, display: "flex", alignItems: "center", gap: 6 }}>
            {plan.name}
            {plan.isBuiltIn === 1 && <Tag style={{ borderRadius: 6, fontSize: 9, margin: 0 }}>Built-in</Tag>}
          </div>
          <div style={{ fontSize: 11, color: "var(--ink-soft)", marginTop: 2 }}>
            {dayNames.length} day{dayNames.length === 1 ? "" : "s"} · {planExerciseCount(plan)} exercises
          </div>
        </div>
        {isActive ? (
          <Tag color="var(--accent)" style={{ borderRadius: 8, margin: 0, color: "#fff", border: "none", fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
            <TbCheck size={12} /> Active
          </Tag>
        ) : (
          <Button size="small" type="primary" onClick={onActivate}>Activate</Button>
        )}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
        {dayNames.length === 0 ? (
          <span style={{ fontSize: 11, color: "var(--ink-soft)" }}>No days yet</span>
        ) : dayNames.map((n, i) => (
          <span key={i} style={{
            fontSize: 10, fontWeight: 600, borderRadius: 999, padding: "2px 8px",
            background: "var(--bg)", border: "1px solid var(--border)", color: "var(--ink-soft)",
          }}>{n}</span>
        ))}
      </div>
      <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
        {onReset && (
          <Popconfirm title="Reset to default?" description="Discards your edits to this built-in plan." onConfirm={onReset} okText="Reset" okButtonProps={{ danger: true }}>
            <Button size="small" type="text" icon={<TbRefresh size={14} />} title="Reset to default" />
          </Popconfirm>
        )}
        <Button size="small" type="text" icon={<TbCopy size={14} />} title="Duplicate as new plan" onClick={onDuplicate} />
        {plan.isBuiltIn !== 1 && (
          <>
            <Button size="small" type="text" icon={<TbEdit size={14} />} title="Rename" onClick={onRename} />
            <Popconfirm
              title={isActive ? "Can't delete the active plan" : "Delete this plan?"}
              description={isActive ? "Switch to another plan first." : "This can't be undone."}
              onConfirm={onDelete} okText="Delete" okButtonProps={{ danger: true, disabled: isActive }}
              disabled={isActive}
            >
              <Button size="small" type="text" danger icon={<TbTrash size={14} />} title="Delete" disabled={isActive} />
            </Popconfirm>
          </>
        )}
      </div>
    </div>
  );
}

export function PlanSwitcherSheet({ open, onClose }: Props) {
  useBackClose(open, onClose);
  const { message } = App.useApp();
  const plans = useWorkoutPlans();
  const activeId = useActivePlanId();
  const builtIns = plans.filter((p) => p.isBuiltIn === 1);
  const custom = plans.filter((p) => p.isBuiltIn !== 1);

  async function handleActivate(plan: WorkoutPlanRowDto) {
    const outgoing = plans.find((p) => p.id === activeId);
    await switchToPlan(plan.id!);
    message.success(outgoing ? `Switched to "${plan.name}" — "${outgoing.name}" saved.` : `Switched to "${plan.name}"`);
  }

  async function handleDuplicate(plan: WorkoutPlanRowDto) {
    const name = prompt("Name for the new plan", `${plan.name} copy`);
    if (!name) return;
    await createCustomPlan(name, plan.id);
    message.success(`Created and switched to "${name}"`);
  }

  async function handleRename(plan: WorkoutPlanRowDto) {
    const name = prompt("Rename plan", plan.name);
    if (!name) return;
    await renamePlan(plan.id!, name);
  }

  async function handleDelete(plan: WorkoutPlanRowDto) {
    try { await deletePlan(plan.id!); } catch (err) { message.error(String((err as Error).message)); }
  }

  async function handleReset(plan: WorkoutPlanRowDto) {
    await resetBuiltInPlan(plan.id!);
    message.success(`"${plan.name}" reset to default`);
  }

  async function handleCreateBlank() {
    const name = prompt("Name your new plan");
    if (!name) return;
    await createCustomPlan(name);
    message.success(`Created and switched to "${name}"`);
  }

  return (
    <Sheet open={open} onCancel={onClose} footer={null} title={<span style={{ display: "flex", alignItems: "center", gap: 8 }}><TbBarbell /> Switch Plan</span>}>
      <div style={{ marginTop: 8, maxHeight: "70vh", overflowY: "auto" }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.6, textTransform: "uppercase", color: "var(--ink-soft)", marginBottom: 8 }}>
          Built-in
        </div>
        {builtIns.map((p) => (
          <PlanCard key={p.id} plan={p} isActive={p.id === activeId}
            onActivate={() => handleActivate(p)} onReset={() => handleReset(p)}
            onRename={() => handleRename(p)} onDuplicate={() => handleDuplicate(p)} onDelete={() => handleDelete(p)} />
        ))}

        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.6, textTransform: "uppercase", color: "var(--ink-soft)", margin: "14px 0 8px" }}>
          My Plans
        </div>
        {custom.length === 0 && (
          <div style={{ fontSize: 12, color: "var(--ink-soft)", padding: "8px 0 12px" }}>No custom plans yet.</div>
        )}
        {custom.map((p) => (
          <PlanCard key={p.id} plan={p} isActive={p.id === activeId}
            onActivate={() => handleActivate(p)}
            onRename={() => handleRename(p)} onDuplicate={() => handleDuplicate(p)} onDelete={() => handleDelete(p)} />
        ))}

        <Button type="dashed" block icon={<TbPlus />} onClick={handleCreateBlank} style={{ marginTop: 4 }}>
          Create custom plan
        </Button>
      </div>
    </Sheet>
  );
}
