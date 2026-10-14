import { useRef, type CSSProperties } from "react";
import { App, Slider } from "antd";
import { motion } from "framer-motion";
import { TbCheck, TbLock, TbPhotoPlus, TbPhoto, TbTrash, TbSparkles, TbMoonStars, TbSun } from "react-icons/tb";
import { useSetting, setSetting } from "../../hooks/useSettings";
import { fileToDataURL } from "../../lib/image.utils";
import { hapticLight, hapticSuccess } from "../../lib/haptics";
import { ACCENT_THEMES, DEFAULT_ACCENT, isAccentUnlocked } from "../../lib/rewardVault";
import { useVaultUnlocks } from "../vault/useRewardVault";
import { ListGroup, ListRow } from "../../components/ui/List";
import { useDraft } from "./useDraft";

// Miniature of the app in a given theme — real tokens, not a screenshot, so
// it stays honest if the palette changes.
function ThemePreview({ mode }: { mode: "dark" | "light" }) {
  const dark = mode === "dark";
  const bg = dark ? "#0d0608" : "#f5f0f0";
  const surface = dark ? "#1a1013" : "#ffffff";
  const ink = dark ? "#f3eef2" : "#1a0f13";
  const accent = dark ? "#ff2740" : "#c8112a";
  return (
    <div className="zs-preview" style={{ background: bg }}>
      <div className="zs-preview__card" style={{ background: surface }}>
        <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden>
          <circle cx="17" cy="17" r="13" fill="none" stroke={accent} strokeOpacity="0.18" strokeWidth="4" />
          <circle cx="17" cy="17" r="13" fill="none" stroke={accent} strokeWidth="4" strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 13 * 0.7} 999`} transform="rotate(-90 17 17)" />
        </svg>
        <div style={{ flex: 1 }}>
          <i style={{ background: ink, width: "70%", opacity: 0.9 }} />
          <i style={{ background: ink, width: "45%", opacity: 0.35 }} />
        </div>
      </div>
      <div className="zs-preview__hero" style={{ background: `linear-gradient(135deg, #1a0509, #6e0f1c 55%, ${accent})` }} />
      <div className="zs-preview__row">
        <span style={{ background: surface }} /><span style={{ background: surface }} />
      </div>
    </div>
  );
}

export function AppearancePane() {
  const { message } = App.useApp();
  const mode = String(useSetting("themeMode")) === "light" ? "light" : "dark";
  const equipped = String(useSetting("equippedAccent")) || DEFAULT_ACCENT;
  const unlocks = useVaultUnlocks();
  const bgImage = String(useSetting("bgImage"));
  const [blur, setBlur] = useDraft(Number(useSetting("bgBlur")));
  const [opacity, setOpacity] = useDraft(Number(useSetting("bgOpacity")));
  const bgRef = useRef<HTMLInputElement>(null);

  async function pickWallpaper(file: File) {
    try {
      await setSetting("bgImage", await fileToDataURL(file, 1400, 0.8));
      void hapticSuccess();
    } catch {
      message.error("Couldn't read that image");
    }
  }

  return (
    <>
      <div className="z-list-title">Theme</div>
      <div className="zs-themes" data-row="theme" role="radiogroup" aria-label="Theme">
        {(["dark", "light"] as const).map((m) => (
          <button key={m} type="button" role="radio" aria-checked={mode === m}
            className={`zs-theme${mode === m ? " is-on" : ""}`}
            onClick={() => { void setSetting("themeMode", m); void hapticLight(); }}>
            <ThemePreview mode={m} />
            <span className="zs-theme__label">
              {m === "dark" ? <TbMoonStars size={15} /> : <TbSun size={15} />}
              {m === "dark" ? "Gothic dark" : "Light"}
              {mode === m && (
                <motion.span layoutId="zs-theme-check" className="zs-theme__check" transition={{ type: "spring", stiffness: 500, damping: 32 }}>
                  <TbCheck size={12} />
                </motion.span>
              )}
            </span>
          </button>
        ))}
      </div>

      <ListGroup title="Accent" footer="New accents unlock as you level up. Avatar frames and titles live in the Reward Vault.">
        <div className="zs-accents" data-row="accent" role="radiogroup" aria-label="Accent color">
          {ACCENT_THEMES.map((a) => {
            const unlocked = isAccentUnlocked(a.id, unlocks);
            const on = equipped === a.id;
            return (
              <button key={a.id} type="button" role="radio" aria-checked={on} aria-label={`${a.label}${unlocked ? "" : " (locked)"}`}
                className={`zs-swatch${on ? " is-on" : ""}${unlocked ? "" : " is-locked"}`}
                style={{ "--sw": a[mode] } as CSSProperties}
                onClick={() => {
                  if (!unlocked) { message.info(a.hint); return; }
                  void setSetting("equippedAccent", a.id);
                  void hapticLight();
                }}>
                <span className="zs-swatch__dot">
                  {on && <motion.span layoutId="zs-accent-ring" className="zs-swatch__ring" transition={{ type: "spring", stiffness: 500, damping: 30 }} />}
                  {!unlocked ? <TbLock size={14} /> : on ? <TbCheck size={15} /> : null}
                </span>
                <span className="zs-swatch__label">{a.label}</span>
              </button>
            );
          })}
        </div>
        <ListRow icon={<TbSparkles size={16} />} color="var(--gold)" label="Reward Vault" hint="Frames, titles and accents" to="/vault" />
      </ListGroup>

      <ListGroup title="Wallpaper">
        <div className="zs-wall" data-row="wallpaper">
          <div className="zs-wall__frame">
            {bgImage ? (
              <div className="zs-wall__img" style={{ backgroundImage: `url(${bgImage})`, filter: `blur(${blur / 3}px)`, opacity: opacity / 100 }} />
            ) : (
              <button type="button" className="zs-wall__empty" onClick={() => bgRef.current?.click()}>
                <TbPhotoPlus size={26} /> Add a wallpaper
              </button>
            )}
            {bgImage && <div className="zs-wall__mock"><i /><i /><i /></div>}
          </div>
          <div className="zs-wall__actions">
            <button type="button" className="z-btn" onClick={() => bgRef.current?.click()}>
              <TbPhoto size={16} /> {bgImage ? "Replace" : "Choose image"}
            </button>
            {bgImage && (
              <button type="button" className="z-btn z-btn--danger" onClick={() => setSetting("bgImage", "")}>
                <TbTrash size={16} /> Remove
              </button>
            )}
          </div>
          {bgImage && (
            <div className="zs-wall__sliders">
              <label>Blur <b>{blur}px</b></label>
              <Slider min={0} max={24} value={blur} onChange={setBlur} onChangeComplete={(v) => setSetting("bgBlur", v)} tooltip={{ open: false }} aria-label="Wallpaper blur" />
              <label>Visibility <b>{opacity}%</b></label>
              <Slider min={0} max={100} value={opacity} onChange={setOpacity} onChangeComplete={(v) => setSetting("bgOpacity", v)} tooltip={{ open: false }} aria-label="Wallpaper visibility" />
            </div>
          )}
        </div>
      </ListGroup>
      <input ref={bgRef} type="file" accept="image/*" hidden
        onChange={(e) => { const f = e.target.files?.[0]; if (f) void pickWallpaper(f); e.target.value = ""; }} />
    </>
  );
}
