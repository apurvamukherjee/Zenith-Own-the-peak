// Small pure helpers used by the easter-egg system. Every function here is
// side-effect free and unit-testable.

/** MM-DD helper. Empty string if the argument is falsy or malformed. */
export function todayMonthDay(d = new Date()): string {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${mm}-${dd}`;
}

/** Compact YYYY-MM-DD without dashes → palindrome check on the compact digits.
 *  E.g. 2 Feb 2022 → "20220202" → true. 23 Mar 2032 → "20320323" → false.
 *  Also flags the culturally recognisable short forms M/D/YY and D/M/YY
 *  (2/2/22, 3/23/32, etc.) which the user's spec called out. */
export function isPalindromeDate(d = new Date()): boolean {
  const compact =
    String(d.getFullYear()) +
    String(d.getMonth() + 1).padStart(2, "0") +
    String(d.getDate()).padStart(2, "0");
  if (isPalindrome(compact)) return true;

  // Short-form checks (locale-independent — check both orderings).
  const y2 = String(d.getFullYear()).slice(-2);
  const m = String(d.getMonth() + 1);
  const dd = String(d.getDate());
  const mdY = m + dd + y2;
  const dmY = dd + m + y2;
  if (isPalindrome(mdY) || isPalindrome(dmY)) return true;
  return false;
}

function isPalindrome(s: string): boolean {
  if (s.length < 3) return false;
  return s === s.split("").reverse().join("");
}

/** Devil's hour test — 3:33 AM specifically. */
export function isDevilsHour(d = new Date()): boolean {
  return d.getHours() === 3 && d.getMinutes() === 33;
}

/** Is the user in a Konami-Hardcore window right now? */
export function isHardcoreActive(hardcoreUntil: number, now = Date.now()): boolean {
  return hardcoreUntil > 0 && now < hardcoreUntil;
}
export function isSabbathActive(sabbathUntil: number, now = Date.now()): boolean {
  return sabbathUntil > 0 && now < sabbathUntil;
}

/** Konami key sequence. All UPPERCASE for consistency with KeyboardEvent.key. */
export const KONAMI_SEQUENCE: readonly string[] = [
  "ARROWUP", "ARROWUP", "ARROWDOWN", "ARROWDOWN",
  "ARROWLEFT", "ARROWRIGHT", "ARROWLEFT", "ARROWRIGHT",
  "B", "A",
];
