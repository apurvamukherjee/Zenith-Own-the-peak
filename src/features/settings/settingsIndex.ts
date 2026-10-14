export type PaneId = "profile" | "targets" | "appearance" | "accessibility" | "reminders" | "connections" | "backup" | "plan";

interface SearchEntry {
  pane: PaneId;
  /** Matches the `data-row` attribute the pane puts on that control. */
  key: string;
  label: string;
  terms: string;
}

export const SEARCH_INDEX: SearchEntry[] = [
  { pane: "profile", key: "photo", label: "Profile picture", terms: "avatar photo image camera" },
  { pane: "profile", key: "name", label: "Name", terms: "display name profile" },
  { pane: "profile", key: "birthday", label: "Birthday", terms: "birth date cake confetti" },
  { pane: "targets", key: "water", label: "Water goal", terms: "hydration ml litre liter daily target" },
  { pane: "targets", key: "bump", label: "Training-day water bonus", terms: "workout extra ml hydration" },
  { pane: "targets", key: "window", label: "Hours awake", terms: "waking window water pace" },
  { pane: "targets", key: "protein", label: "Protein target", terms: "macro grams nutrition" },
  { pane: "targets", key: "carbs", label: "Carbs target", terms: "macro carbohydrate nutrition" },
  { pane: "targets", key: "fat", label: "Fat target", terms: "macro nutrition" },
  { pane: "targets", key: "calories", label: "Calorie target", terms: "kcal energy nutrition macro" },
  { pane: "targets", key: "sleep", label: "Sleep target", terms: "hours bed rest duration" },
  { pane: "targets", key: "wake", label: "Wake-up time", terms: "morning hour alarm pace" },
  { pane: "appearance", key: "theme", label: "Theme", terms: "dark light mode gothic" },
  { pane: "appearance", key: "accent", label: "Accent color", terms: "colour theme vault red gold violet bronze" },
  { pane: "appearance", key: "wallpaper", label: "Wallpaper", terms: "background image blur dim photo" },
  { pane: "accessibility", key: "contrast", label: "High contrast", terms: "a11y vision readability" },
  { pane: "accessibility", key: "motion", label: "Reduce motion", terms: "animation a11y vestibular effects" },
  { pane: "reminders", key: "permission", label: "Notification permission", terms: "allow notifications push enable" },
  { pane: "reminders", key: "water", label: "Hydration nudges", terms: "water reminder notification" },
  { pane: "reminders", key: "session", label: "Session reminder", terms: "workout train gym notification" },
  { pane: "reminders", key: "bedtime", label: "Bedtime wind-down", terms: "sleep night notification" },
  { pane: "reminders", key: "supps", label: "Supplement & med times", terms: "medicine pills creatine notification" },
  { pane: "reminders", key: "events", label: "Event reminders", terms: "calendar remind me notification" },
  { pane: "connections", key: "cloud", label: "Cloud sync", terms: "backup account email sign in leaderboard restore" },
  { pane: "connections", key: "google", label: "Google Calendar", terms: "gcal sync two-way calendar" },
  { pane: "backup", key: "storage", label: "Storage & protection", terms: "space persist eviction quota" },
  { pane: "backup", key: "export", label: "Export backup", terms: "download json save file" },
  { pane: "backup", key: "encrypted", label: "Encrypted export", terms: "password secure aes private" },
  { pane: "backup", key: "import", label: "Restore from file", terms: "import upload backup" },
  { pane: "plan", key: "plan", label: "Workout plan file", terms: "json program import export advanced training" },
];

/** Every word must appear in the label or its synonyms. */
export function searchSettings(query: string): SearchEntry[] {
  const words = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  return SEARCH_INDEX.filter((e) => {
    const hay = `${e.label} ${e.terms}`.toLowerCase();
    return words.every((w) => hay.includes(w));
  });
}
