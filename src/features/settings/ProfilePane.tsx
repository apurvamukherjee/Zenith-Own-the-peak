import { useRef } from "react";
import { App, Avatar, Select } from "antd";
import { motion } from "framer-motion";
import { TbCamera, TbUser, TbCake, TbCrown, TbTrash } from "react-icons/tb";
import { AvatarFrame } from "../../components/AvatarFrame";
import { Hero } from "../../components/ui/Hero";
import { ListGroup, ListRow } from "../../components/ui/List";
import { useSetting, setSetting } from "../../hooks/useSettings";
import { useXP } from "../../hooks/useXP";
import { fileToDataURL } from "../../lib/image.utils";
import { hapticSuccess } from "../../lib/haptics";
import { useEquippedTitle } from "../vault/useRewardVault";
import { useDraft } from "./useDraft";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS_IN = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

export function ProfilePane() {
  const { message } = App.useApp();
  const storedName = String(useSetting("name"));
  const [name, setName] = useDraft(storedName);
  const pic = String(useSetting("profilePic"));
  const frame = String(useSetting("equippedFrame"));
  const birthday = String(useSetting("birthday") ?? "");
  const { level } = useXP();
  const title = useEquippedTitle();
  const picRef = useRef<HTMLInputElement>(null);

  const [bm, bd] = /^\d{2}-\d{2}$/.test(birthday) ? birthday.split("-").map(Number) : [0, 0];
  const setBirthday = (m: number, d: number) => {
    if (!m) { void setSetting("birthday", ""); return; }
    const day = Math.min(d || 1, DAYS_IN[m - 1]);
    void setSetting("birthday", `${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`);
  };
  const commitName = () => {
    const v = name.trim();
    if (v && v !== storedName) void setSetting("name", v);
    else if (!v) setName(storedName);
  };

  async function pick(file: File) {
    try {
      await setSetting("profilePic", await fileToDataURL(file, 400, 0.85));
      void hapticSuccess();
    } catch {
      message.error("Couldn't read that image");
    }
  }

  return (
    <>
      <Hero className="zs-idhero">
        <motion.button type="button" className="zs-idhero__avatar" data-row="photo" whileTap={{ scale: 0.94 }}
          onClick={() => picRef.current?.click()} aria-label="Change profile picture">
          <AvatarFrame frameId={frame}>
            <Avatar size={92} src={pic || undefined} className="avatar-grad">{storedName.charAt(0)}</Avatar>
          </AvatarFrame>
          <span className="zs-idhero__cam"><TbCamera size={16} /></span>
        </motion.button>
        <div className="zs-idhero__name display">{storedName}</div>
        <div className="zs-idhero__meta"><span className="z-pill" style={{ "--c": "var(--accent)" } as React.CSSProperties}>Lv.{level.level}</span> {title}</div>
        {pic && (
          <button type="button" className="z-btn z-btn--ghost" style={{ marginTop: 6, fontSize: 12.5 }} onClick={() => setSetting("profilePic", "")}>
            <TbTrash size={14} /> Remove photo
          </button>
        )}
      </Hero>

      <ListGroup title="Identity">
        <ListRow rowKey="name" icon={<TbUser size={16} />} color="var(--accent)" label="Name"
          right={
            <input className="zs-inline-input" value={name} maxLength={24} aria-label="Name" enterKeyHint="done"
              onChange={(e) => setName(e.target.value)} onBlur={commitName}
              onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }} />
          } />
        <ListRow rowKey="birthday" icon={<TbCake size={16} />} color="var(--gold)" label="Birthday" hint="Something special happens on the day">
          <div className="zs-bday">
            <Select value={bm || undefined} placeholder="Month" allowClear style={{ flex: 1.4 }} aria-label="Birthday month"
              options={MONTHS.map((m, i) => ({ value: i + 1, label: m }))}
              onChange={(m: number | undefined) => setBirthday(m ?? 0, bd)} />
            <Select value={bd || undefined} placeholder="Day" disabled={!bm} style={{ flex: 1 }} aria-label="Birthday day"
              options={Array.from({ length: bm ? DAYS_IN[bm - 1] : 31 }, (_, i) => ({ value: i + 1, label: String(i + 1) }))}
              onChange={(d: number) => setBirthday(bm, d)} />
          </div>
        </ListRow>
        <ListRow icon={<TbCrown size={16} />} color="var(--gold)" label="Title & frame" value={title} to="/vault" />
      </ListGroup>
      <input ref={picRef} type="file" accept="image/*" hidden
        onChange={(e) => { const f = e.target.files?.[0]; if (f) void pick(f); e.target.value = ""; }} />
    </>
  );
}
