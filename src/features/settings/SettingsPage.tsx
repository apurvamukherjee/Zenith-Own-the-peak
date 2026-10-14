import { useEffect, useState, type ComponentType, type ReactNode } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { Avatar, Input, Switch } from "antd";
import { AnimatePresence, motion } from "framer-motion";
import { useConvexAuth } from "convex/react";
import {
  TbUser, TbTarget, TbPalette, TbAccessible, TbBell, TbCloud, TbDatabase, TbCode, TbSearch,
  TbSparkles, TbAward, TbQuote, TbUsersGroup, TbShare2, TbChevronRight, TbContrast2, TbRun,
} from "react-icons/tb";
import { SectionTitle } from "../../components/SectionTitle";
import { MountainGrows } from "../../components/MountainGrows";
import { AvatarFrame } from "../../components/AvatarFrame";
import { Hero } from "../../components/ui/Hero";
import { ListGroup, ListRow } from "../../components/ui/List";
import { useSetting, setSetting } from "../../hooks/useSettings";
import { useXP } from "../../hooks/useXP";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { fmtDuration } from "../../lib/date.utils";
import { accentById } from "../../lib/rewardVault";
import { convexConfigured } from "../../lib/convexClient";
import { useEquippedTitle } from "../vault/useRewardVault";
import { RemindersPane } from "./RemindersPane";
import { SyncCard } from "../sync/SyncCard";
import { GoogleCalendarCard } from "../googleCalendar/GoogleCalendarCard";
import { PlanImportCard } from "../gym/PlanImportCard";
import { ProfilePane } from "./ProfilePane";
import { TargetsPane } from "./TargetsPane";
import { AppearancePane } from "./AppearancePane";
import { BackupPane } from "./BackupPane";
import { searchSettings, SEARCH_INDEX, type PaneId } from "./settingsIndex";
import "./settings.css";

const PANES: Record<PaneId, { title: string; icon: ComponentType<{ size?: number }>; color: string }> = {
  profile: { title: "Profile", icon: TbUser, color: "var(--accent)" },
  targets: { title: "Daily targets", icon: TbTarget, color: "var(--teal)" },
  appearance: { title: "Appearance", icon: TbPalette, color: "var(--gold)" },
  accessibility: { title: "Accessibility", icon: TbAccessible, color: "var(--info)" },
  reminders: { title: "Reminders", icon: TbBell, color: "var(--danger)" },
  connections: { title: "Cloud & calendar", icon: TbCloud, color: "var(--info)" },
  backup: { title: "Backup & restore", icon: TbDatabase, color: "var(--success)" },
  plan: { title: "Workout plan file", icon: TbCode, color: "var(--ink-soft)" },
};

const isPane = (v: string | null): v is PaneId => v !== null && v in PANES;

// iOS push: the incoming pane slides over from the right while the outgoing
// screen drifts left; Back reverses it. `custom` is the direction.
const slide = {
  enter: (d: number) => ({ x: d > 0 ? "100%" : "-28%", opacity: d > 0 ? 1 : 0.4 }),
  center: { x: 0, opacity: 1 },
  exit: (d: number) => ({ x: d > 0 ? "-28%" : "100%", opacity: d > 0 ? 0.4 : 1 }),
};

export function SettingsPage() {
  const reduced = useReducedMotion();
  const [params, setParams] = useSearchParams();
  const pane = isPane(params.get("s")) ? (params.get("s") as PaneId) : null;
  const focus = params.get("f");
  const [query, setQuery] = useState("");

  // Each pane is its own history entry so device/browser Back closes it.
  const open = (id: PaneId, f?: string) => setParams(f ? { s: id, f } : { s: id });

  useEffect(() => { document.querySelector("main")?.scrollTo({ top: 0 }); }, [pane]);

  // Google's OAuth callback lands on /settings?google=… — route it to the
  // pane that renders the card which consumes those params.
  if (params.has("google") && !pane) {
    const next = new URLSearchParams(params);
    next.set("s", "connections");
    return <Navigate to={`/settings?${next}`} replace />;
  }

  const dir = pane ? 1 : -1;
  const transition = reduced ? { duration: 0 } : { type: "spring" as const, stiffness: 380, damping: 38, mass: 0.9 };

  return (
    <div className="zs-stage">
      <AnimatePresence mode="popLayout" initial={false} custom={dir}>
        <motion.div key={pane ?? "overview"} className="z-page" custom={dir} variants={slide}
          initial="enter" animate="center" exit="exit" transition={transition}>
          {pane
            ? <PaneView id={pane} focus={focus} />
            : <Overview query={query} setQuery={setQuery} open={open} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function PaneView({ id, focus }: { id: PaneId; focus: string | null }) {
  // Deep link from search: wait for the push to settle, then scroll the
  // matching control into view and flash it.
  useEffect(() => {
    if (!focus) return;
    const t = window.setTimeout(() => {
      const el = document.querySelector<HTMLElement>(`[data-row="${CSS.escape(focus)}"]`);
      if (!el) return;
      el.scrollIntoView({ block: "center", behavior: "smooth" });
      el.classList.add("is-flash");
      window.setTimeout(() => el.classList.remove("is-flash"), 1900);
    }, 380);
    return () => window.clearTimeout(t);
  }, [id, focus]);

  const meta = PANES[id];
  return (
    <>
      <SectionTitle eyebrow="Settings" title={meta.title} />
      {id === "profile" && <ProfilePane />}
      {id === "targets" && <TargetsPane />}
      {id === "appearance" && <AppearancePane />}
      {id === "accessibility" && <AccessibilityPane />}
      {id === "reminders" && <RemindersPane />}
      {id === "connections" && (
        <div className="zs-cards">
          <div data-row="cloud"><SyncCard /></div>
          <div data-row="google"><GoogleCalendarCard /></div>
        </div>
      )}
      {id === "backup" && <BackupPane />}
      {id === "plan" && <div className="zs-cards" data-row="plan"><PlanImportCard /></div>}
    </>
  );
}

function Overview({ query, setQuery, open }: { query: string; setQuery: (q: string) => void; open: (id: PaneId, f?: string) => void }) {
  const results = searchSettings(query);
  return (
    <>
      <SectionTitle eyebrow="Zenith" title="Settings" />
      <Input className="zs-search" allowClear value={query} onChange={(e) => setQuery(e.target.value)}
        prefix={<TbSearch size={17} />} placeholder="Search settings" aria-label="Search settings" enterKeyHint="search" />

      <AnimatePresence mode="wait" initial={false}>
        {query.trim() ? (
          <motion.div key="results" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
            {results.length ? (
              <ListGroup title={`${results.length} result${results.length === 1 ? "" : "s"}`}>
                {results.map((r) => {
                  const P = PANES[r.pane];
                  return (
                    <ListRow key={`${r.pane}:${r.key}`} icon={<P.icon size={16} />} color={P.color}
                      label={<Highlight text={r.label} q={query} />} hint={P.title} onClick={() => open(r.pane, r.key)} />
                  );
                })}
              </ListGroup>
            ) : (
              <div className="zs-noresult">
                Nothing matches “{query.trim()}”. Try <button type="button" onClick={() => setQuery("water")}>water</button>,{" "}
                <button type="button" onClick={() => setQuery("theme")}>theme</button> or{" "}
                <button type="button" onClick={() => setQuery("backup")}>backup</button>.
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div key="groups" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
            <ProfileCard onOpen={() => open("profile")} />
            <OverviewGroups open={open} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function Highlight({ text, q }: { text: string; q: string }) {
  const word = q.trim().toLowerCase().split(/\s+/).find((w) => text.toLowerCase().includes(w));
  if (!word) return <>{text}</>;
  const i = text.toLowerCase().indexOf(word);
  return <>{text.slice(0, i)}<mark className="zs-mark">{text.slice(i, i + word.length)}</mark>{text.slice(i + word.length)}</>;
}

function ProfileCard({ onOpen }: { onOpen: () => void }) {
  const name = String(useSetting("name"));
  const pic = String(useSetting("profilePic"));
  const frame = String(useSetting("equippedFrame"));
  const { level, next, progress, totalXP } = useXP();
  const title = useEquippedTitle();
  return (
    <motion.button type="button" className="zs-profile" onClick={onOpen} whileTap={{ scale: 0.98 }}>
      <Hero className="zs-profile__hero">
        <div className="zs-profile__row">
          <AvatarFrame frameId={frame}>
            <Avatar size={60} src={pic || undefined} className="avatar-grad">{name.charAt(0)}</Avatar>
          </AvatarFrame>
          <div className="zs-profile__text">
            <div className="zs-profile__name display">{name}</div>
            <div className="zs-profile__meta">Lv.{level.level} · {title}</div>
            {next && (
              <div className="zs-profile__xp">
                <span><motion.i initial={{ width: 0 }} animate={{ width: `${Math.round(progress * 100)}%` }} transition={{ type: "spring", stiffness: 60, damping: 16, delay: 0.2 }} /></span>
                {totalXP - level.xpRequired}/{next.xpRequired - level.xpRequired} XP
              </div>
            )}
          </div>
          <TbChevronRight size={18} className="z-row__chev" />
        </div>
      </Hero>
    </motion.button>
  );
}

function CloudValue() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  return <>{isLoading ? "…" : isAuthenticated ? "Signed in" : "Off"}</>;
}

function OverviewGroups({ open }: { open: (id: PaneId, f?: string) => void }) {
  const water = Number(useSetting("waterGoalMl"));
  const protein = Number(useSetting("proteinTargetG"));
  const sleep = Number(useSetting("sleepTargetMin"));
  const mode = String(useSetting("themeMode")) === "light" ? "Light" : "Dark";
  const accent = accentById(String(useSetting("equippedAccent"))).label;
  const contrast = Number(useSetting("highContrast")) === 1;
  const motionOff = Number(useSetting("reduceMotion")) === 1;
  const rem = [useSetting("remWater"), useSetting("remSession"), useSetting("remBedtime"), useSetting("remSupps"), useSetting("remEvents")]
    .filter((v) => Number(v) === 1).length;

  const row = (id: PaneId, value: ReactNode, hint?: string) => {
    const P = PANES[id];
    return <ListRow icon={<P.icon size={16} />} color={P.color} label={P.title} hint={hint} value={value} onClick={() => open(id)} />;
  };

  return (
    <>
      <ListGroup title="You">
        {row("targets", `${+(water / 1000).toFixed(2)}L · ${protein}g · ${fmtDuration(sleep)}`)}
        {row("appearance", `${mode} · ${accent}`)}
        {row("accessibility", contrast && motionOff ? "2 on" : contrast ? "High contrast" : motionOff ? "Less motion" : "Default")}
      </ListGroup>

      <ListGroup title="Notifications">
        {row("reminders", `${rem} of 5 on`)}
      </ListGroup>

      <ListGroup title="Data">
        {row("connections", convexConfigured ? <CloudValue /> : "Not set up")}
        {row("backup", "Local")}
        {row("plan", "Advanced")}
      </ListGroup>

      <ListGroup title="More">
        <ListRow icon={<TbSparkles size={16} />} color="var(--gold)" label="Reward Vault" to="/vault" />
        <ListRow icon={<TbAward size={16} />} color="var(--gold)" label="Hall of Frame" to="/hall" />
        <ListRow icon={<TbUsersGroup size={16} />} color="var(--info)" label="Leaderboard" to="/leaderboard" />
        <ListRow icon={<TbQuote size={16} />} color="var(--accent)" label="Motivation quotes" to="/quotes" />
        <ListRow icon={<TbShare2 size={16} />} color="var(--teal)" label="Share card" to="/glance" />
      </ListGroup>

      <div className="zs-about">
        <MountainGrows />
        <div className="zs-about__brand">Zenith · Own the peak</div>
        <div className="zs-about__by">by Apurva</div>
        <div className="zs-about__count">{SEARCH_INDEX.length} settings · searchable</div>
      </div>
    </>
  );
}

function AccessibilityPane() {
  const contrast = Number(useSetting("highContrast")) === 1;
  const motionOff = Number(useSetting("reduceMotion")) === 1;
  const osReduce = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  return (
    <ListGroup title="Display & motion"
      footer={osReduce ? "Your device already asks apps to reduce motion — Zenith follows it regardless of this switch." : undefined}>
      <div data-row="contrast">
        <ListRow icon={<TbContrast2 size={16} />} color="var(--info)" label="High contrast" hint="AAA-contrast text, no gradients"
          right={<Switch checked={contrast} onChange={(v) => setSetting("highContrast", v ? 1 : 0)} aria-label="High contrast" />} />
      </div>
      <div data-row="motion">
        <ListRow icon={<TbRun size={16} />} color="var(--accent)" label="Reduce motion" hint="Calms embers, waves, page slides and celebrations"
          right={<Switch checked={motionOff} onChange={(v) => setSetting("reduceMotion", v ? 1 : 0)} aria-label="Reduce motion" />} />
      </div>
    </ListGroup>
  );
}

