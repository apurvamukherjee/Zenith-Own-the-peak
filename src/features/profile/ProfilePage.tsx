import { useState, type CSSProperties, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { App, Avatar, Modal } from "antd";
import { motion } from "framer-motion";
import {
  TbBolt, TbBook2, TbBulb, TbClipboardList, TbDroplet, TbBarbell, TbChartLine, TbChevronRight, TbPlus,
  TbFlame, TbGasStation, TbMoon, TbTrendingUp, TbTrendingDown, TbTrophy, TbSparkles,
} from "react-icons/tb";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, CartesianGrid, Tooltip } from "recharts";
import { PageTransition } from "../../components/PageTransition";
import { AnimatedNumber } from "../../components/AnimatedNumber";
import { SectionTitle } from "../../components/SectionTitle";
import { Skeleton } from "../../components/Skeleton";
import { SmartInputNumber } from "../../components/SmartInputNumber";
import { Hero } from "../../components/ui/Hero";
import { ListGroup, ListRow } from "../../components/ui/List";
import { useProfileStats, logBodyweight } from "./useProfile";
import { YearHeatmap } from "./YearHeatmap";
import { PhotoTimeline } from "./PhotoTimeline";
import { EfficiencyCard } from "./EfficiencyCard";
import { BodyComposition } from "./BodyComposition";
import { BeforeAfterSlider } from "./BeforeAfterSlider";
import { useSetting } from "../../hooks/useSettings";
import { useXP } from "../../hooks/useXP";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { fmtDuration } from "../../lib/date.utils";
import { useWeeklyReview } from "../review/useWeeklyReview";
import { CompassCard } from "./CompassCard";
import { useTokens } from "../../hooks/useTokens";
import { useAchievements, useUnseenAchievements } from "../achievements/useAchievements";
import { AvatarFrame } from "../../components/AvatarFrame";
import { useEquippedTitle, useUnseenCosmetics } from "../vault/useRewardVault";
import "./profile.css";

export function ProfilePage() {
  const t = useTokens();
  const reduced = useReducedMotion();
  const { message } = App.useApp();
  const stats = useProfileStats();
  const review = useWeeklyReview();
  const { unlockedCount, total } = useAchievements();
  const unseen = useUnseenAchievements();
  const name = String(useSetting("name"));
  const profilePic = String(useSetting("profilePic"));
  const equippedFrame = String(useSetting("equippedFrame"));
  const equippedTitle = useEquippedTitle();
  const unseenCosmetics = useUnseenCosmetics();
  const { level, next, progress, totalXP } = useXP();
  const [bwOpen, setBwOpen] = useState(false);
  const [bwVal, setBwVal] = useState<number | null>(null);

  if (!stats) return <PageTransition><Skeleton height={220} radius={28} /></PageTransition>;
  const { gym, study, sleep, water, fuel, bodyweight } = stats;

  return (
    <PageTransition>
      <SectionTitle eyebrow="Your record" title="Stats" />

      <Hero className="pf-hero" right={<span className="z-pill" style={{ "--c": "var(--gold)" } as CSSProperties}><TbTrophy size={12} /> {unlockedCount}/{total}</span>}
        eyebrow="Own the peak">
        <div className="pf-id">
          <AvatarFrame frameId={equippedFrame}>
            <Avatar size={64} src={profilePic || undefined} className="avatar-grad" style={{ fontWeight: 800, fontSize: 26 }}>{name.charAt(0)}</Avatar>
          </AvatarFrame>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div className="pf-id__name display">{name}</div>
            <div className="pf-id__title">Lv.{level.level} · {equippedTitle}</div>
            {next && (
              <div className="pf-xp">
                <span><motion.i style={{ width: "100%", transformOrigin: "0 50%" }} initial={reduced ? false : { scaleX: 0 }} animate={{ scaleX: progress }} transition={{ type: "spring", stiffness: 60, damping: 16, delay: 0.2 }} /></span>
                {totalXP - level.xpRequired}/{next.xpRequired - level.xpRequired} XP
              </div>
            )}
          </div>
        </div>
        <div className="pf-chips">
          <div><TbFlame size={15} style={{ color: "var(--accent)" }} /><b><AnimatedNumber value={gym.streak} /></b><small>day gym streak</small></div>
          <div><TbTrophy size={15} style={{ color: "var(--gold)" }} /><b><AnimatedNumber value={gym.prs} /></b><small>PRs</small></div>
          <div><TbBarbell size={15} style={{ color: "var(--teal)" }} /><b><AnimatedNumber value={gym.sessions} /></b><small>sessions</small></div>
        </div>
      </Hero>

      <ListGroup title="Rewards & tools">
        <ListRow icon={<TbSparkles size={16} />} color="var(--gold)" label="Reward Vault" to="/vault"
          hint={unseenCosmetics > 0 ? `${unseenCosmetics} new to claim` : "Accent themes, frames & titles"}
          value={unseenCosmetics > 0 ? <span className="z-pill" style={{ "--c": "var(--accent)" } as CSSProperties}>{unseenCosmetics} new</span> : undefined} />
        <ListRow icon={<TbTrophy size={16} />} color="var(--accent)" label="Hall of Frame" to="/hall"
          hint={unseen > 0 ? `${unseen} new to claim` : `${unlockedCount} of ${total} conquered`}
          value={unseen > 0 ? <span className="z-pill" style={{ "--c": "var(--accent)" } as CSSProperties}>{unseen} new</span> : undefined} />
        <ListRow icon={<TbClipboardList size={16} />} color="var(--teal)" label="Workout planner" hint="Exercises, days & weekly schedule" to="/planner" />
        <ListRow icon={<TbChartLine size={16} />} color="var(--info)" label="Strength progress" hint="e1RM charts and PR log" to="/progress" />
      </ListGroup>

      {review && (
        <>
          <div className="z-list-title">This week</div>
          <div className="z-bento">
            {review.stats.slice(0, 6).map((st) => (
              <div key={st.key} className="z-tile pf-tile">
                <div className="z-tile__head">{st.label}</div>
                <div className="z-tile__big">
                  <b>{st.prefix}<AnimatedNumber value={st.value} decimals={st.decimals} /></b>
                  {st.suffix && <small>{st.suffix.trim()}</small>}
                </div>
                {st.deltaPct != null && (
                  <span className={`z-pill ${st.deltaPct >= 0 ? "is-good" : "is-bad"}`} style={{ alignSelf: "flex-start", marginTop: 6 }}>
                    {st.deltaPct >= 0 ? <TbTrendingUp size={12} /> : <TbTrendingDown size={12} />}{Math.abs(st.deltaPct)}%
                  </span>
                )}
              </div>
            ))}
          </div>
          {review.insights.length > 0 && (
            <ListGroup title="Insights">
              {review.insights.slice(0, 3).map((ins, i) => (
                <ListRow key={i} icon={<TbBulb size={16} />} color={ins.good ? "var(--success)" : "var(--danger)"} label={<span className="pf-insight">{ins.text}</span>} />
              ))}
            </ListGroup>
          )}
        </>
      )}

      <div className="pf-cards">
        <CompassCard />
        <YearHeatmap />
        <PhotoTimeline />
        <BeforeAfterSlider />
        <EfficiencyCard />
        <BodyComposition />
      </div>

      <ListGroup title="Bodyweight" right={<button type="button" className="pf-link" onClick={() => { setBwVal(bodyweight.latest || null); setBwOpen(true); }}><TbPlus size={14} /> Log</button>}>
        <div className="pf-bw">
          <div className="pf-bw__stats">
            <div><small>Current</small><b>{bodyweight.latest || "–"}<em> kg</em></b></div>
            <div><small>30-day change</small>
              <b style={{ color: bodyweight.change30 > 0 ? "var(--success)" : bodyweight.change30 < 0 ? "var(--danger)" : undefined }}>
                {bodyweight.change30 > 0 ? "+" : ""}{bodyweight.change30}<em> kg</em>
              </b>
            </div>
          </div>
          {bodyweight.series.length > 1 ? (
            <div className="pf-bw__chart">
              <ResponsiveContainer>
                <LineChart data={bodyweight.series} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={t.grid} vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 9, fill: t.ink }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: t.ink }} domain={["dataMin - 1", "dataMax + 1"]} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v: number) => [`${v} kg`, "Weight"]} />
                  <Line type="monotone" dataKey="kg" stroke={t.accent} strokeWidth={3} dot={{ r: 2.5, fill: t.accent, strokeWidth: 0 }} isAnimationActive={!reduced} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : <div className="pf-muted">Log your weight a couple of times to see the trend.</div>}
        </div>
      </ListGroup>

      <div className="z-list-title">Everything, measured</div>
      <div className="pf-modules">
        <Module icon={<TbBolt size={15} />} c="var(--accent)" title="Gym" to="/progress" wide stats={[
          ["Sessions", gym.sessions], ["Sets", gym.totalSets], ["Volume", `${gym.volume.toLocaleString()} kg`],
          ["PRs", gym.prs], ["Best e1RM", `${gym.bestE1rm} kg`], ["Streak", `${gym.streak} d`],
        ]} />
        <Module icon={<TbBook2 size={15} />} c="var(--success)" title="Study" to="/study" bar={study.pct} stats={[
          ["Topics", `${study.topicsDone}/${study.topicsTotal}`], ["Minutes", study.totalMin],
        ]} />
        <Module icon={<TbMoon size={15} />} c="var(--gold)" title="Sleep" to="/sleep" stats={[
          ["7-day avg", sleep.avgMin ? fmtDuration(sleep.avgMin) : "–"], ["Debt", fmtDuration(sleep.debtMin)],
        ]} />
        <Module icon={<TbDroplet size={15} />} c="var(--info)" title="Water" to="/water" bar={water.todayPct} stats={[
          ["7-day", `${water.adherence}%`], ["Streak", `${water.streak} d`],
        ]} />
        <Module icon={<TbGasStation size={15} />} c="var(--gold)" title="Bike fuel" to="/fuel" stats={[
          ["Mileage", `${fuel.avgMileage} km/L`], ["₹/km", fuel.costPerKm], ["Month", `₹${fuel.monthSpend}`], ["Total", `${fuel.totalKm} km`],
        ]} />
      </div>

      <Modal open={bwOpen} title="Log bodyweight" okText="Save" onCancel={() => setBwOpen(false)} destroyOnHidden
        okButtonProps={{ disabled: !bwVal || bwVal <= 0 }}
        onOk={async () => {
          if (!bwVal || bwVal <= 0) return;
          await logBodyweight(bwVal);
          setBwOpen(false);
          message.success(`Logged ${bwVal} kg`);
        }}>
        <SmartInputNumber autoFocus value={bwVal} min={20} max={300} step={0.1} suffix="kg" style={{ width: "100%" }}
          onChange={(v) => setBwVal(v == null ? null : Number(v))} aria-label="Bodyweight in kg" />
      </Modal>
    </PageTransition>
  );
}

function Module({ icon, c, title, to, stats, bar, wide }: {
  icon: ReactNode; c: string; title: string; to: string; stats: [string, ReactNode][]; bar?: number; wide?: boolean;
}) {
  return (
    <Link to={to} className={`z-tile z-tile--press pf-module${wide ? " is-wide" : ""}`} style={{ "--c": c } as CSSProperties}>
      <div className="z-tile__head"><span className="z-ico z-ico--sm">{icon}</span>{title}<TbChevronRight size={14} style={{ marginLeft: "auto", opacity: 0.5 }} /></div>
      {bar !== undefined && <div className="pf-module__bar"><i style={{ width: `${Math.min(100, bar)}%` }} /></div>}
      <dl className="pf-module__stats">
        {stats.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
      </dl>
    </Link>
  );
}
