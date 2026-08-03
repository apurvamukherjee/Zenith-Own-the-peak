import { useEffect, type ReactNode } from "react";
import { App, Avatar } from "antd";
import { TbSparkles, TbPalette, TbUserCircle, TbCrown, TbCheck, TbLock } from "react-icons/tb";
import { PageTransition } from "../../components/PageTransition";
import { AvatarFrame } from "../../components/AvatarFrame";
import { useSetting, setSetting } from "../../hooks/useSettings";
import { useXP } from "../../hooks/useXP";
import { hapticLight } from "../../lib/haptics";
import {
  ACCENT_THEMES, FRAMES, DEFAULT_ACCENT, isAccentUnlocked,
  type AccentThemeDef, type FrameDef,
} from "../../lib/rewardVault";
import { useEquippableTitles, useEquippedTitle, useVaultUnlocks, markAllCosmeticsSeen } from "./useRewardVault";

function LockDot() {
  return (
    <div style={{
      position: "absolute", top: -4, right: -4, width: 18, height: 18, borderRadius: 9,
      background: "var(--surface)", border: "1px solid var(--border)",
      display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink-soft)",
    }}>
      <TbLock size={10} />
    </div>
  );
}

function CheckDot() {
  return (
    <div style={{
      position: "absolute", top: -4, right: -4, width: 18, height: 18, borderRadius: 9,
      background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center",
      color: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
    }}>
      <TbCheck size={11} />
    </div>
  );
}

function SectionHeader({ icon, title }: { icon: ReactNode; title: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
      <span style={{ color: "var(--accent)" }}>{icon}</span>
      <h3 className="display" style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>{title}</h3>
    </div>
  );
}

function AccentCard({ def, unlocked, equipped, mode, onEquip }: {
  def: AccentThemeDef; unlocked: boolean; equipped: boolean; mode: "light" | "dark"; onEquip: () => void;
}) {
  const hex = def[mode];
  return (
    <div
      onClick={unlocked ? onEquip : undefined}
      style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, width: 76, cursor: unlocked ? "pointer" : "default" }}
    >
      <div style={{ position: "relative" }}>
        <div style={{
          width: 46, height: 46, borderRadius: "50%", background: hex,
          boxShadow: equipped ? `0 0 0 2px var(--bg), 0 0 0 4px ${hex}` : "none",
          filter: unlocked ? "none" : "grayscale(0.65)",
          opacity: unlocked ? 1 : 0.5,
        }} />
        {equipped ? <CheckDot /> : !unlocked && <LockDot />}
      </div>
      <div style={{ fontSize: 11, fontWeight: 700, textAlign: "center", opacity: unlocked ? 1 : 0.6 }}>{def.label}</div>
      {!unlocked && <div style={{ fontSize: 9.5, color: "var(--ink-soft)", textAlign: "center" }}>{def.hint}</div>}
    </div>
  );
}

function FrameCard({ def, unlocked, equipped, onEquip }: {
  def: FrameDef; unlocked: boolean; equipped: boolean; onEquip: () => void;
}) {
  return (
    <div
      onClick={unlocked ? onEquip : undefined}
      style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, width: 82, cursor: unlocked ? "pointer" : "default" }}
    >
      <div style={{ position: "relative" }}>
        {unlocked ? (
          <AvatarFrame frameId={def.id}>
            <Avatar size={44} style={{ background: "var(--border)" }} />
          </AvatarFrame>
        ) : (
          <div style={{
            width: 50, height: 50, borderRadius: "50%", background: "var(--bg)",
            border: "1px dashed var(--border)",
          }} />
        )}
        {equipped && <CheckDot />}
        {!unlocked && <LockDot />}
      </div>
      <div style={{ fontSize: 11, fontWeight: 700, textAlign: "center", opacity: unlocked ? 1 : 0.6 }}>{def.label}</div>
      {!unlocked && <div style={{ fontSize: 9.5, color: "var(--ink-soft)", textAlign: "center" }}>{def.hint}</div>}
    </div>
  );
}

function TitleChip({ name, equipped, onEquip }: { name: string; equipped: boolean; onEquip: () => void }) {
  return (
    <div onClick={onEquip} style={{
      padding: "6px 14px", borderRadius: 999, cursor: "pointer",
      background: equipped ? "var(--accent)" : "var(--surface)",
      color: equipped ? "#fff" : "var(--ink)",
      border: `1px solid ${equipped ? "var(--accent)" : "var(--border)"}`,
      fontSize: 12.5, fontWeight: 700,
    }}>
      {name}
    </div>
  );
}

export function VaultPage() {
  const { message } = App.useApp();
  const { level } = useXP();
  const mode: "light" | "dark" = String(useSetting("themeMode")) === "light" ? "light" : "dark";
  const equippedAccent = String(useSetting("equippedAccent")) || DEFAULT_ACCENT;
  const equippedFrame = String(useSetting("equippedFrame"));
  const equippedTitle = useEquippedTitle();
  const unlocked = useVaultUnlocks();
  const titles = useEquippableTitles();

  useEffect(() => { void markAllCosmeticsSeen(); }, []);

  function equipAccent(id: string) {
    void setSetting("equippedAccent", id);
    hapticLight();
    const label = ACCENT_THEMES.find((a) => a.id === id)?.label ?? id;
    message.success(`Equipped ${label}`);
  }
  function equipFrame(id: string) {
    void setSetting("equippedFrame", equippedFrame === id ? "" : id); // tap again to remove
    hapticLight();
  }
  function equipTitle(name: string) {
    void setSetting("equippedTitle", name);
    hapticLight();
  }

  return (
    <PageTransition>
      <div style={{
        position: "relative", overflow: "hidden", borderRadius: 20, padding: "22px 18px",
        marginBottom: 22, background: "var(--hero)", color: "#fff",
      }}>
        <div aria-hidden style={{ position: "absolute", top: -40, right: -30, width: 180, height: 180, borderRadius: "50%", background: "rgba(255,255,255,0.10)", filter: "blur(6px)" }} />
        <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 14 }}>
          <AvatarFrame frameId={equippedFrame}>
            <Avatar size={54} style={{ background: "rgba(255,255,255,0.16)" }} icon={<TbSparkles />} />
          </AvatarFrame>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", opacity: 0.85 }}>Reward Vault</div>
            <div className="display" style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.1 }}>{equippedTitle}</div>
            <div style={{ fontSize: 12, opacity: 0.85, marginTop: 2 }}>Lv.{level.level} · purely cosmetic, zero effect on your stats</div>
          </div>
        </div>
      </div>

      <SectionHeader icon={<TbPalette size={18} />} title="Accent Themes" />
      <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginBottom: 28 }}>
        {ACCENT_THEMES.map((def) => (
          <AccentCard
            key={def.id} def={def} mode={mode}
            unlocked={isAccentUnlocked(def.id, unlocked)}
            equipped={equippedAccent === def.id}
            onEquip={() => equipAccent(def.id)}
          />
        ))}
      </div>

      <SectionHeader icon={<TbUserCircle size={18} />} title="Avatar Frames" />
      <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginBottom: 28 }}>
        {FRAMES.map((def) => (
          <FrameCard
            key={def.id} def={def}
            unlocked={unlocked.has(def.id)}
            equipped={equippedFrame === def.id}
            onEquip={() => equipFrame(def.id)}
          />
        ))}
      </div>

      <SectionHeader icon={<TbCrown size={18} />} title="Titles" />
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
        {titles.map((l) => (
          <TitleChip key={l.name} name={l.name} equipped={equippedTitle === l.name} onEquip={() => equipTitle(l.name)} />
        ))}
      </div>
      <div style={{ fontSize: 11, color: "var(--ink-soft)", marginBottom: 20 }}>
        Every title you've reached stays equippable, even after leveling past it.
      </div>
    </PageTransition>
  );
}
