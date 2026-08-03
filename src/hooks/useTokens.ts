import { TOKENS, type Mode } from "../theme";
import { useSetting } from "./useSettings";
import { accentById, DEFAULT_ACCENT } from "../lib/rewardVault";

// Reactive accent palette that flips with the theme. When a non-default
// Reward Vault accent theme is equipped, only `.accent` is overridden —
// `.teal`/`.gold`/`.danger`/`.grid` stay the stock semantic values.
export function useTokens() {
  const mode = useSetting("themeMode") as Mode;
  const resolved = mode === "dark" ? "dark" : "light";
  const equippedAccent = String(useSetting("equippedAccent"));
  const base = TOKENS[resolved];
  if (!equippedAccent || equippedAccent === DEFAULT_ACCENT) return base;
  const theme = accentById(equippedAccent);
  return { ...base, accent: theme[resolved] };
}
