import type { CSSProperties, ReactNode } from "react";
import { Link } from "react-router-dom";
import { TbChevronRight } from "react-icons/tb";

export function ListGroup({ title, right, footer, children, style }: {
  title?: ReactNode; right?: ReactNode; footer?: ReactNode; children: ReactNode; style?: CSSProperties;
}) {
  return (
    <>
      {(title || right) && <div className="z-list-title"><span>{title}</span>{right}</div>}
      <div className="z-list" style={style}>{children}</div>
      {footer && <div className="z-list-foot">{footer}</div>}
    </>
  );
}

interface RowProps {
  icon?: ReactNode;
  /** Tint for the icon chip. */
  color?: string;
  label: ReactNode;
  hint?: ReactNode;
  value?: ReactNode;
  /** Trailing control (switch, stepper…). Replaces the chevron. */
  right?: ReactNode;
  to?: string;
  onClick?: () => void;
  danger?: boolean;
  /** Search deep-links scroll to and flash the row carrying this key. */
  rowKey?: string;
  children?: ReactNode;
}

export function ListRow({ icon, color, label, hint, value, right, to, onClick, danger, rowKey, children }: RowProps) {
  const cls = `z-row${icon ? "" : " z-row--noicon"}${danger ? " z-row--danger" : ""}`;
  const inner = (
    <>
      {icon && <span className="z-ico" style={color ? ({ "--c": color } as CSSProperties) : undefined}>{icon}</span>}
      <span className="z-row__text">
        <span className="z-row__label" style={{ display: "block" }}>{label}</span>
        {hint && <span className="z-row__hint" style={{ display: "block" }}>{hint}</span>}
      </span>
      {value !== undefined && <span className="z-row__value">{value}</span>}
      {right ?? ((to || onClick) && <TbChevronRight size={17} className="z-row__chev" />)}
    </>
  );
  const row = to
    ? <Link to={to} className={cls} data-row={rowKey}>{inner}</Link>
    : onClick
      ? <button type="button" className={cls} onClick={onClick} data-row={rowKey}>{inner}</button>
      : <div className={cls} data-row={rowKey}>{inner}</div>;
  if (!children) return row;
  return <div data-row-wrap>{row}<div className="z-row__body">{children}</div></div>;
}
