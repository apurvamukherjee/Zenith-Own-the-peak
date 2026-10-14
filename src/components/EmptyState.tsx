import type { ReactNode } from "react";
import { TbArrowRight } from "react-icons/tb";

// Every empty state should tell the user what to do next. No more silent
// "No data yet" walls — always show the exact button that fixes it.
interface Props {
  icon?: ReactNode;
  title: string;
  hint?: string;
  actionLabel?: string;
  onAction?: () => void;
}
export function EmptyState({ icon, title, hint, actionLabel, onAction }: Props) {
  return (
    <div className="z-empty">
      {icon && <div className="z-empty__icon">{icon}</div>}
      <div className="z-empty__title">{title}</div>
      {hint && <div className="z-empty__hint">{hint}</div>}
      {actionLabel && onAction && (
        <button type="button" className="z-btn z-btn--solid" onClick={onAction} style={{ marginTop: 8 }}>
          {actionLabel} <TbArrowRight size={16} />
        </button>
      )}
    </div>
  );
}
