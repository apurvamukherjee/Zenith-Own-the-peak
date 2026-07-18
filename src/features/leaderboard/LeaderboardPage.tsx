import { useEffect, useState } from "react";
import { Button, Input, App, Tag } from "antd";
import { TbUserPlus, TbFlame, TbBarbell, TbCopy, TbUserMinus } from "react-icons/tb";
import { motion } from "framer-motion";
import { PageTransition } from "../../components/PageTransition";
import { SectionTitle } from "../../components/SectionTitle";
import { SkeletonList } from "../../components/Skeleton";
import { EmptyState } from "../../components/EmptyState";
import { ColdIcon } from "../../components/ColdIcon";
import { useSync } from "../sync/useSync";
import { useSetting } from "../../hooks/useSettings";
import { getLeaderboard, followByCode, unfollowUser, type LeaderboardEntry } from "../../lib/social";
import { isoWeek } from "../../lib/xp";
import { LEVELS } from "../../lib/xp";
import { hapticLight, hapticSuccess } from "../../lib/haptics";

export function LeaderboardPage() {
  const { message } = App.useApp();
  const sync = useSync();
  const shareCode = String(useSetting("shareCode" as any) || "");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [addCode, setAddCode] = useState("");
  const [addOpen, setAddOpen] = useState(false);

  const userId = sync.session?.user?.id;
  const weekKey = isoWeek();

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    setLoading(true);
    getLeaderboard(userId).then((data) => {
      setEntries(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [userId, sync.lastBackupTick]);

  async function handleFollow() {
    if (!userId || !addCode.trim()) return;
    const name = await followByCode(userId, addCode.trim());
    if (name) {
      hapticSuccess();
      message.success(`Now following ${name}`);
      setAddCode("");
      setAddOpen(false);
      // Refresh
      const data = await getLeaderboard(userId);
      setEntries(data);
    } else {
      message.error("Code not found — check the spelling");
    }
  }

  async function handleUnfollow(targetId: string) {
    if (!userId) return;
    await unfollowUser(userId, targetId);
    hapticLight();
    setEntries((prev) => prev.filter((e) => e.userId !== targetId));
    message.info("Unfollowed");
  }

  function copyCode() {
    if (!shareCode) return;
    navigator.clipboard?.writeText(shareCode).then(() => {
      hapticLight();
      message.success("Code copied!");
    });
  }

  if (!sync.session) {
    return (
      <PageTransition>
        <SectionTitle eyebrow="Compete" title="Leaderboard" />
        <EmptyState
          icon={<ColdIcon glyph="peak" size={80} />}
          title="Sign in to compete"
          hint="Cloud sync is required for the leaderboard. Set it up in Settings → Cloud sync."
          actionLabel="Go to Settings"
          onAction={() => { window.location.pathname = "/settings"; }}
        />
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <SectionTitle eyebrow="Compete" title="Leaderboard" right={
        <Button size="small" icon={<TbUserPlus />} onClick={() => setAddOpen(!addOpen)}>Add friend</Button>
      } />

      {/* Your share code */}
      {shareCode && (
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          background: "var(--surface)", borderRadius: 12, padding: "8px 14px",
          marginBottom: 12, border: "1px solid var(--border)",
        }}>
          <span style={{ fontSize: 11, color: "var(--ink-soft)" }}>Your code:</span>
          <span className="gothic" style={{ fontSize: 16, fontWeight: 800, letterSpacing: "0.08em", color: "var(--accent)" }}>
            {shareCode}
          </span>
          <Button type="text" size="small" icon={<TbCopy size={14} />} onClick={copyCode} style={{ marginLeft: "auto" }} />
        </div>
      )}

      {/* Add friend input */}
      {addOpen && (
        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
          style={{ overflow: "hidden", marginBottom: 12 }}>
          <div style={{ display: "flex", gap: 8 }}>
            <Input
              placeholder="Enter friend's code (e.g. ZN-4X2K)"
              value={addCode} onChange={(e) => setAddCode(e.target.value.toUpperCase())}
              onPressEnter={handleFollow}
              style={{ flex: 1 }}
            />
            <Button type="primary" onClick={handleFollow}>Follow</Button>
          </div>
        </motion.div>
      )}

      {/* Week label */}
      <div style={{ fontSize: 11, color: "var(--ink-soft)", marginBottom: 10, letterSpacing: "0.1em" }}>
        {weekKey} · Mon–Sun
      </div>

      {loading && <SkeletonList rows={3} />}

      {!loading && entries.length === 0 && (
        <EmptyState
          icon={<ColdIcon glyph="chain" size={80} />}
          title="No friends yet"
          hint="Share your code with friends and paste theirs to follow. You'll see each other's weekly discipline score."
          actionLabel="Copy my code"
          onAction={copyCode}
        />
      )}

      {!loading && entries.map((e, i) => {
        const rank = i + 1;
        const levelDef = LEVELS.find((l) => l.level === e.level) ?? LEVELS[0];
        const TIER_COLOR: Record<string, string> = {
          mythic: "#ff2740", platinum: "#a8a2b0", gold: "#f6b93b", silver: "#c0c0c0", bronze: "#cd7f32",
        };
        return (
          <motion.div key={e.userId}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            style={{
              padding: "10px 12px", marginBottom: 6,
              background: e.isMe ? "var(--ember-inner)" : "var(--surface)",
              borderRadius: 12,
              border: e.isMe ? "1px solid var(--accent)" : "1px solid var(--border)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {/* Rank */}
              <div style={{
                width: 28, height: 28, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 800, fontSize: 14, flexShrink: 0,
                background: rank <= 3 ? "var(--accent)" : "var(--border)",
                color: rank <= 3 ? "#fff" : "var(--ink-soft)",
              }}>
                {rank}
              </div>

              {/* Name + level */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontWeight: 700, fontSize: 14,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                  {e.displayName} {e.isMe && <Tag color="red" style={{ margin: "0 0 0 4px", fontSize: 10, borderRadius: 6 }}>you</Tag>}
                </div>
                <div style={{ fontSize: 10, color: "var(--ink-soft)" }}>
                  Lv.{e.level} {levelDef.name} · {e.badgeCount} badges
                </div>
              </div>

              {/* Stats */}
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontWeight: 800, fontSize: 16, color: "var(--accent)" }}>{e.discipline}%</div>
                <div style={{ fontSize: 10, color: "var(--ink-soft)", display: "flex", gap: 6, justifyContent: "flex-end" }}>
                  <span><TbFlame size={10} style={{ verticalAlign: "-1px" }} /> {e.streak}</span>
                  <span><TbBarbell size={10} style={{ verticalAlign: "-1px" }} /> {(e.volumeKg / 1000).toFixed(1)}t</span>
                </div>
              </div>

              {/* Unfollow (not self) */}
              {!e.isMe && (
                <Button type="text" size="small" danger icon={<TbUserMinus size={14} />}
                  onClick={() => handleUnfollow(e.userId)} style={{ padding: 4 }} />
              )}
            </div>

            {/* Top badges row — visible for everyone */}
            {e.topBadges.length > 0 && (
              <div style={{
                display: "flex", gap: 6, marginTop: 8, paddingTop: 8,
                borderTop: "1px solid var(--border)", flexWrap: "wrap",
              }}>
                {e.topBadges.map((b) => (
                  <span key={b.id} style={{
                    fontSize: 10, fontWeight: 700, padding: "2px 8px",
                    borderRadius: 6, letterSpacing: "0.03em",
                    background: `${TIER_COLOR[b.tier] ?? "var(--border)"}20`,
                    color: TIER_COLOR[b.tier] ?? "var(--ink-soft)",
                    border: `1px solid ${TIER_COLOR[b.tier] ?? "var(--border)"}40`,
                  }}>
                    {b.name}
                  </span>
                ))}
              </div>
            )}
          </motion.div>
        );
      })}
    </PageTransition>
  );
}
