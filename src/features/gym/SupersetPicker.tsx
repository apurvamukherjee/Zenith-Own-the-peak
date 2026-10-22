import { App } from "antd";
import { TbLink } from "react-icons/tb";
import { Sheet } from "../../components/Sheet";
import { useBackClose } from "../../hooks/useBackClose";
import type { DayExerciseDto } from "../../db/types";
import { linkSuperset } from "./useGym";

export function SupersetPicker({ anchor, day, names, onClose }: {
  anchor: DayExerciseDto | null; day: DayExerciseDto[]; names: Map<number, string>; onClose: () => void;
}) {
  const open = anchor != null;
  useBackClose(open, onClose);
  const { message } = App.useApp();
  const name = (d: DayExerciseDto) => names.get(d.exerciseId) ?? "…";
  const candidates = anchor ? day.filter((d) => d.id !== anchor.id && d.supersetGroupId == null) : [];

  async function pick(partner: DayExerciseDto) {
    if (!anchor?.id || !partner.id) return;
    await linkSuperset(anchor.id, partner.id);
    message.success(`Superset: ${name(anchor)} + ${name(partner)}`);
    onClose();
  }

  return (
    <Sheet open={open} onCancel={onClose} footer={null} destroyOnHidden
      title={<div className="ss-title"><span className="ss-title__set">SUPERSET</span>{anchor ? name(anchor) : ""}</div>}>
      <p className="sp-hint">Pick the exercise to alternate with. It moves up next to this one and stays linked in your plan.</p>
      {candidates.length === 0 ? (
        <p className="sp-empty">Every other exercise today is already in a superset.</p>
      ) : (
        <div className="sp-list">
          {candidates.map((d) => (
            <button key={d.id} type="button" className="sp-row" onClick={() => void pick(d)}>
              <span className="sp-row__name">{name(d)}</span>
              <span className="sp-row__meta">{d.sets} × {d.repLow}–{d.repHigh}</span>
              <TbLink size={16} />
            </button>
          ))}
        </div>
      )}
    </Sheet>
  );
}
