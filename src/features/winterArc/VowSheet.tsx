import { useState } from "react";
import { App, Input } from "antd";
import { TbSnowflake, TbCheck } from "react-icons/tb";
import { Sheet } from "../../components/Sheet";
import { TimeSelect } from "../../components/TimeSelect";
import { useBackClose } from "../../hooks/useBackClose";
import { useSetting } from "../../hooks/useSettings";
import { RULE_PRESETS, MAX_RULES, parseList, parseVow } from "../../lib/arcChecklist";
import { saveVow } from "./vow";
import { ArcSafety } from "./ArcSafety";

// Mounted only while open (parent renders it conditionally), so the form
// state below always starts from the saved vow.
export function VowSheet({ onClose }: { onClose: () => void }) {
  const { message } = App.useApp();
  const saved = parseVow(String(useSetting("arcVow")));
  const savedRules = parseList(String(useSetting("arcRules")));
  const [goal, setGoal] = useState(saved?.goal ?? "");
  const [when, setWhen] = useState(saved?.when || "07:00");
  const [where, setWhere] = useState(saved?.where ?? "");
  const [ifThen, setIfThen] = useState(saved?.ifThen ?? "");
  const [rules, setRules] = useState<string[]>(savedRules);
  useBackClose(true, onClose);

  const toggle = (id: string) => setRules((r) => r.includes(id) ? r.filter((x) => x !== id) : r.length < MAX_RULES ? [...r, id] : r);
  const ready = goal.trim().length >= 3 && ifThen.trim().length >= 8;
  const sign = async () => {
    await saveVow({ goal: goal.trim(), when, where: where.trim(), ifThen: ifThen.trim() }, rules, saved?.signedAt);
    void message.success(saved ? "Vow updated." : "Vow signed. Day 0 is on the board.");
    onClose();
  };
  const cold = RULE_PRESETS.find((r) => r.id === "cold");

  return (
    <Sheet open onCancel={onClose} footer={null} destroyOnHidden
      title={<span className="arc-vow__title"><TbSnowflake size={16} /> {saved ? "Your vow" : "Sign the vow"}</span>}>
      <div className="arc-vow">
        <label>
          <span>What will 61 days of this get you? <em>Private — only you see it.</em></span>
          <Input.TextArea value={goal} onChange={(e) => setGoal(e.target.value)} autoSize={{ minRows: 2, maxRows: 4 }}
            placeholder="25 strict push-ups, 7h sleep, a semester I'm proud of." />
        </label>
        <div className="arc-vow__row">
          <label>
            <span>When I do the drill</span>
            <TimeSelect value={when} onChange={setWhen} />
          </label>
          <label>
            <span>Where</span>
            <Input value={where} onChange={(e) => setWhere(e.target.value)} placeholder="Hostel room floor" />
          </label>
        </div>
        <label>
          <span>If I'm tempted to skip, then I will…</span>
          <Input.TextArea value={ifThen} onChange={(e) => setIfThen(e.target.value)} autoSize={{ minRows: 2, maxRows: 4 }}
            placeholder="If I get back late, I'll do the 5-minute minimum before I open my phone." />
        </label>

        <div className="arc-vow__rules">
          <span>Cold Rules — pick up to {MAX_RULES}</span>
          <div className="arc-vow__chips">
            {RULE_PRESETS.map((r) => {
              const on = rules.includes(r.id);
              return (
                <button key={r.id} type="button" className={`arc-chip${on ? " is-on" : ""}`} aria-pressed={on}
                  disabled={!on && rules.length >= MAX_RULES} onClick={() => toggle(r.id)}>
                  {on && <TbCheck size={13} />} {r.label}{r.auto ? " · auto" : ""}
                </button>
              );
            })}
          </div>
          {rules.includes("cold") && cold?.note && <p className="arc-vow__note">{cold.note}</p>}
        </div>

        {!saved && <ArcSafety />}

        <button type="button" className="z-btn z-btn--solid arc-vow__sign" disabled={!ready} onClick={() => void sign()}>
          {saved ? "Save vow" : "Sign it — Day 0"}
        </button>
      </div>
    </Sheet>
  );
}
