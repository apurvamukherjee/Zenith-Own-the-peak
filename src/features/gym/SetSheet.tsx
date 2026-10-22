import { TbArrowBarDown, TbPlus, TbTrash, TbX } from "react-icons/tb";
import { Popconfirm } from "antd";
import { Sheet } from "../../components/Sheet";
import { SmartInputNumber } from "../../components/SmartInputNumber";
import { useBackClose } from "../../hooks/useBackClose";
import type { DropStageDto, WorkoutSetDto } from "../../db/types";

export interface SetDraft { weightKg: number; reps: number; drops: DropStageDto[]; }

const round = (n: number) => Math.max(0, Math.round(n * 100) / 100);

function Stepper({ value, onChange, steps, unit, label }: {
  value: number; onChange: (v: number) => void; steps: number[]; unit?: string; label: string;
}) {
  return (
    <div className="ss-field">
      <div className="ss-field__label">{label}</div>
      <div className="ss-field__value">
        <SmartInputNumber
          aria-label={label} value={value} min={0} controls={false} variant="borderless"
          onChange={(v) => { if (typeof v === "number") onChange(round(v)); }}
          className="ss-num"
        />
        {unit && <span className="ss-unit">{unit}</span>}
      </div>
      <div className="ss-steps">
        {[...steps].reverse().map((s) => (
          <button key={`-${s}`} type="button" className="ss-step" onClick={() => onChange(round(value - s))}>−{s}</button>
        ))}
        {steps.map((s) => (
          <button key={`+${s}`} type="button" className="ss-step ss-step--up" onClick={() => onChange(round(value + s))}>+{s}</button>
        ))}
      </div>
    </div>
  );
}

// One editor for drop stages — used for both a pending and a logged set.
function DropStages({ drops, onChange, step }: {
  drops: DropStageDto[]; onChange: (d: DropStageDto[]) => void; step: number;
}) {
  const patch = (i: number, p: Partial<DropStageDto>) =>
    onChange(drops.map((d, idx) => (idx === i ? { ...d, ...p } : d)));
  return (
    <div className="ss-drops">
      {drops.map((d, i) => (
        <div key={i} className="ss-drop">
          <span className="ss-drop__tag">↓{i + 1}</span>
          <button type="button" className="ss-mini" aria-label="Decrease drop weight" onClick={() => patch(i, { weightKg: round(d.weightKg - step) })}>−</button>
          <span className="ss-drop__val">{d.weightKg}<small>kg</small></span>
          <button type="button" className="ss-mini" aria-label="Increase drop weight" onClick={() => patch(i, { weightKg: round(d.weightKg + step) })}>+</button>
          <span className="ss-x">×</span>
          <button type="button" className="ss-mini" aria-label="Decrease drop reps" onClick={() => patch(i, { reps: Math.max(1, d.reps - 1) })}>−</button>
          <span className="ss-drop__val">{d.reps}</span>
          <button type="button" className="ss-mini" aria-label="Increase drop reps" onClick={() => patch(i, { reps: d.reps + 1 })}>+</button>
          <button type="button" className="ss-mini ss-mini--del" aria-label="Remove drop stage" onClick={() => onChange(drops.filter((_, idx) => idx !== i))}><TbX /></button>
        </div>
      ))}
    </div>
  );
}

export function SetSheet({
  open, onClose, title, setIndex, draft, onDraft, step, repRange, ghost, primaryLabel, onPrimary, onDelete,
}: {
  open: boolean; onClose: () => void; title: string; setIndex: number;
  draft: SetDraft; onDraft: (d: SetDraft) => void; step: number;
  repRange: [number, number]; ghost?: WorkoutSetDto;
  primaryLabel: string; onPrimary: () => void; onDelete?: () => void;
}) {
  useBackClose(open, onClose);
  const [lo, hi] = repRange;
  const quickReps = Array.from({ length: Math.min(hi - lo + 1, 7) }, (_, i) => lo + i);

  function addDrop() {
    const last = draft.drops[draft.drops.length - 1] ?? draft;
    onDraft({ ...draft, drops: [...draft.drops, { weightKg: round(last.weightKg * 0.8), reps: last.reps }] });
  }

  return (
    <Sheet open={open} onCancel={onClose} footer={null} destroyOnHidden
      title={<div className="ss-title"><span className="ss-title__set">SET {String(setIndex).padStart(2, "0")}</span>{title}</div>}>
      <div className="ss">
        {ghost && (
          <button type="button" className="ss-ghost"
            onClick={() => onDraft({ ...draft, weightKg: ghost.weightKg, reps: ghost.reps })}>
            Last time <b>{ghost.weightKg} × {ghost.reps}</b> <span>use</span>
          </button>
        )}
        <Stepper label="Weight" unit="kg" value={draft.weightKg} steps={[step, step * 2]}
          onChange={(weightKg) => onDraft({ ...draft, weightKg })} />
        <Stepper label="Reps" value={draft.reps} steps={[1]}
          onChange={(reps) => onDraft({ ...draft, reps: Math.max(1, Math.round(reps)) })} />
        <div className="ss-quick" role="group" aria-label="Rep target">
          {quickReps.map((n) => (
            <button key={n} type="button" className={`ss-quick__btn${draft.reps === n ? " is-on" : ""}`}
              onClick={() => onDraft({ ...draft, reps: n })}>{n}</button>
          ))}
        </div>

        <DropStages drops={draft.drops} step={step} onChange={(drops) => onDraft({ ...draft, drops })} />
        <button type="button" className="ss-adddrop" onClick={addDrop}>
          <TbArrowBarDown /> {draft.drops.length ? <>Add another drop <TbPlus /></> : "Make it a drop set"}
        </button>

        <div className="ss-actions">
          {onDelete && (
            <Popconfirm title="Delete this set?" okText="Delete" cancelText="Cancel" okButtonProps={{ danger: true }} onConfirm={onDelete}>
              <button type="button" className="ss-del" aria-label="Delete set"><TbTrash size={18} /></button>
            </Popconfirm>
          )}
          <button type="button" className="ss-go" disabled={draft.weightKg <= 0 || draft.reps <= 0} onClick={onPrimary}>
            {primaryLabel}
          </button>
        </div>
      </div>
    </Sheet>
  );
}
