import type { ReactNode } from "react";

export function SectionTitle({ eyebrow, title, right }: {
  eyebrow?: string; title: string; right?: ReactNode;
}) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 14 }}>
      <div>
        {eyebrow && (
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "var(--violet)" }}>
            {eyebrow}
          </div>
        )}
        <h2 className="display" style={{ margin: "2px 0 0", fontSize: 26, fontWeight: 800 }}>{title}</h2>
      </div>
      {right}
    </div>
  );
}
