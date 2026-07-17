// Blood-drip loading indicator. Replaces antd's grey <Spin> which visually
// broke the mood. Renders a droplet that swells at the top, stretches down,
// releases, and dissolves — looping. SVG-only, no images, no libs.
// Two sizes: 20 (inline) and 32 (large). Aria-live so screen readers still
// hear "loading" without any change.
interface Props { size?: number; label?: string; }
export function BloodDrop({ size = 32, label = "Loading" }: Props) {
  const s = size;
  return (
    <div role="status" aria-label={label}
      style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: s, height: s * 1.6 }}>
      <svg viewBox="0 0 24 40" width={s} height={s * 1.6} aria-hidden>
        <defs>
          <linearGradient id="bd-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"  stopColor="#ff2740" stopOpacity="0.95" />
            <stop offset="60%" stopColor="#c8112a" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#6e0f1c" stopOpacity="0.85" />
          </linearGradient>
          <radialGradient id="bd-hl" cx="35%" cy="30%" r="30%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.55)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </radialGradient>
        </defs>

        {/* Nib at the top — where the droplet forms + releases */}
        <path d="M10 0 Q12 4 14 0 Z" fill="url(#bd-grad)" opacity="0.5" />

        {/* Growing/falling droplet */}
        <g style={{ transformOrigin: "12px 8px" }}>
          <ellipse cx="12" cy="8" rx="4" ry="5" fill="url(#bd-grad)">
            <animate attributeName="cy" values="6;10;10;30" keyTimes="0;0.35;0.5;1" dur="1.6s" repeatCount="indefinite" />
            <animate attributeName="ry" values="3;6;5;3" keyTimes="0;0.35;0.5;1" dur="1.6s" repeatCount="indefinite" />
            <animate attributeName="rx" values="3;4;4;2.5" keyTimes="0;0.35;0.5;1" dur="1.6s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.2;0.85;1" dur="1.6s" repeatCount="indefinite" />
          </ellipse>
          <ellipse cx="10.5" cy="6" rx="1" ry="1.5" fill="url(#bd-hl)">
            <animate attributeName="cy" values="4;8;8;28" keyTimes="0;0.35;0.5;1" dur="1.6s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0;0.9;0.9;0" keyTimes="0;0.2;0.85;1" dur="1.6s" repeatCount="indefinite" />
          </ellipse>
        </g>

        {/* Pool at the bottom — swells briefly when the droplet lands */}
        <ellipse cx="12" cy="36" rx="6" ry="1.5" fill="url(#bd-grad)" opacity="0.55">
          <animate attributeName="rx" values="0;0;7;5" keyTimes="0;0.7;0.9;1" dur="1.6s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0;0;0.7;0" keyTimes="0;0.75;0.9;1" dur="1.6s" repeatCount="indefinite" />
        </ellipse>
      </svg>
    </div>
  );
}
