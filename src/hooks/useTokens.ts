import { TOKENS, type Mode } from "../theme";
import { useSetting } from "./useSettings";

// Reactive accent palette that flips with the theme.
export function useTokens() {
  const mode = useSetting("themeMode") as Mode;
  return TOKENS[mode === "dark" ? "dark" : "light"];
}
