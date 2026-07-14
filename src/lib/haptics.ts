// Haptic feedback: real vibration on Capacitor native, navigator.vibrate on web, no-op fallback.
async function loadPlugin(): Promise<any | null> {
  try {
    const mod = "@capacitor/haptics";
    return (await import(/* @vite-ignore */ mod)).Haptics;
  } catch { return null; }
}
function isNative(): boolean {
  const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  return Boolean(cap?.isNativePlatform?.());
}
export async function hapticLight() {
  if (isNative()) { const H = await loadPlugin(); H?.impact?.({ style: "LIGHT" }); }
  else if (navigator.vibrate) navigator.vibrate(10);
}
export async function hapticMedium() {
  if (isNative()) { const H = await loadPlugin(); H?.impact?.({ style: "MEDIUM" }); }
  else if (navigator.vibrate) navigator.vibrate(25);
}
export async function hapticSuccess() {
  if (isNative()) { const H = await loadPlugin(); H?.notification?.({ type: "SUCCESS" }); }
  else if (navigator.vibrate) navigator.vibrate([15, 50, 15]);
}
