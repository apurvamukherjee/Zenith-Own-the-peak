import type { ReactNode } from "react";
import { frameById } from "../lib/rewardVault";

// Wraps an <Avatar> with the equipped Reward Vault frame — a gradient ring
// built from padding + a gradient background (no clip-path/mask needed).
// With no frameId (or an unrecognized one), renders children unchanged.
export function AvatarFrame({ frameId, children }: { frameId?: string; children: ReactNode }) {
  const frame = frameId ? frameById(frameId) : undefined;
  if (!frame) return <>{children}</>;

  return (
    <div style={{
      display: "inline-flex", borderRadius: "50%", padding: 3,
      background: frame.grad, boxShadow: `0 4px 18px ${frame.glow}`,
      flexShrink: 0,
    }}>
      <div style={{ borderRadius: "50%", background: "var(--bg)", padding: 2, display: "inline-flex" }}>
        {children}
      </div>
    </div>
  );
}
