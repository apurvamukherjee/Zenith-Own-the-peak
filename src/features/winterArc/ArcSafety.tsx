import { TbFirstAidKit } from "react-icons/tb";

// The drill stacks unaccustomed high-rep work on top of a 5–6 day split —
// the classic rhabdomyolysis setup in young men (RESEARCH.md, "Volume
// stacking") — so the warning signs ship with the arc, not in a help page.
export function ArcSafety() {
  return (
    <div className="arc-safety" role="note">
      <b><TbFirstAidKit size={13} /> Before you start</b>
      <ul>
        <li><b>Dark urine</b> (tea or cola coloured), or a muscle that swells hard and hurts badly a day after a drill: stop and see a doctor today. That's rhabdo, not soreness.</li>
        <li>Chest pain, dizziness or sharp joint pain: stop the drill and tap Sick / injured. No miss, no debt.</li>
        <li>Just sore? Tap Sore for the recovery drill — the chain still counts.</li>
        <li>Drink to thirst. Nothing here rewards water past your goal.</li>
      </ul>
    </div>
  );
}
