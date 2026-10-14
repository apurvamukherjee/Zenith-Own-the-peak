import { useEffect, type ReactNode } from "react";
import { App, Avatar } from "antd";
import { TbSparkles, TbPalette, TbUserCircle, TbCrown, TbCheck, TbLock } from "react-icons/tb";
import { PageTransition } from "../../components/PageTransition";
import { SectionTitle } from "../../components/SectionTitle";
import { Hero } from "../../components/ui/Hero";
import "./vault.css";
import { AvatarFrame } from "../../components/AvatarFrame";
import { useSetting, setSetting } from "../../hooks/useSettings";
import { useXP } from "../../hooks/useXP";
import { hapticLight } from "../../lib/haptics";
import {
  ACCENT_THEMES, FRAMES, DEFAULT_ACCENT, isAccentUnlocked,
  type AccentThemeDef, type FrameDef,
} from "../../lib/rewardVault";
import { useEquippableTitles, useEquippedTitle, useVaultUnlocks, markAllCosmeticsSeen } from "./useRewardVault";
import { pressable } from "../../lib/a11y";

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
  return <div className="z-list-title"><span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>{icon}{title}</span></div>;
}

function AccentCard({ def, unlocked, equipped, mode, onEquip }: {
  def: AccentThemeDef; unlocked: boolean; equipped: boolean; mode: "light" | "dark"; onEquip: () => void;
}) {
  const hex = def[mode];
  return (
    <div
      {...(unlocked ? pressable(onEquip) : {})} aria-pressed={unlocked ? equipped : undefined}
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
      <div style={{ fontSize: 12, fontWeight: 700, textAlign: "center", opacity: unlocked ? 1 : 0.6 }}>{def.label}</div>
      {!unlocked && <div style={{ fontSize: 12.5, color: "var(--ink-soft)", textAlign: "center" }}>{def.hint}</div>}
    </div>
  );
}

function FrameCard({ def, unlocked, equipped, onEquip }: {
  def: FrameDef; unlocked: boolean; equipped: boolean; onEquip: () => void;
}) {
  return (
    <div
      {...(unlocked ? pressable(onEquip) : {})} aria-pressed={unlocked ? equipped : undefined}
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
      <div style={{ fontSize: 12, fontWeight: 700, textAlign: "center", opacity: unlocked ? 1 : 0.6 }}>{def.label}</div>
      {!unlocked && <div style={{ fontSize: 12.5, color: "var(--ink-soft)", textAlign: "center" }}>{def.hint}</div>}
    </div>
  );
}

function TitleChip({ name, equipped, onEquip }: { name: string; equipped: boolean; onEquip: () => void }) {
  return (
    <div {...pressable(onEquip)} style={{
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
      <SectionTitle eyebrow="Cosmetics" title="Reward Vault" />
      <Hero tone="ember" eyebrow="Equipped" className="vt-hero">
        <div className="vt-hero__row">
          <AvatarFrame frameId={equippedFrame}>
            <Avatar size={58} style={{ background: "rgba(255,255,255,0.16)" }} icon={<TbSparkles />} />
          </AvatarFrame>
          <div style={{ minWidth: 0 }}>
            <div className="z-hero__title">{equippedTitle}</div>
            <div className="z-hero__sub">Lv.{level.level} · purely cosmetic, zero effect on your stats</div>
          </div>
        </div>
      </Hero>

      <SectionHeader icon={<TbPalette size={16} />} title="Accent themes" />
      <div className="vt-shelf">
        {ACCENT_THEMES.map((def) => (
          <AccentCard
            key={def.id} def={def} mode={mode}
            unlocked={isAccentUnlocked(def.id, unlocked)}
            equipped={equippedAccent === def.id}
            onEquip={() => equipAccent(def.id)}
          />
        ))}
      </div>

      <SectionHeader icon={<TbUserCircle size={16} />} title="Avatar frames" />
      <div className="vt-shelf">
        {FRAMES.map((def) => (
          <FrameCard
            key={def.id} def={def}
            unlocked={unlocked.has(def.id)}
            equipped={equippedFrame === def.id}
            onEquip={() => equipFrame(def.id)}
          />
        ))}
      </div>

      <SectionHeader icon={<TbCrown size={16} />} title="Titles" />
      <div className="vt-shelf vt-shelf--chips">
        {titles.map((l) => (
          <TitleChip key={l.name} name={l.name} equipped={equippedTitle === l.name} onEquip={() => equipTitle(l.name)} />
        ))}
      </div>
      <div className="z-list-foot">Every title you've reached stays equippable, even after leveling past it.</div>
    </PageTransition>
  );
}
