// Haptic feedback: real vibration on Capacitor native, navigator.vibrate on web, no-op fallback.
// Static import: a bare dynamic import() is left unresolved by Vite and fails in the WebView.
import { Haptics, ImpactStyle, NotificationType } from "@capacitor/haptics";
function isNative(): boolean {
  const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  return Boolean(cap?.isNativePlatform?.());
}
export function hapticLight() {
  if (isNative()) void Haptics.impact({ style: ImpactStyle.Light });
  else if (navigator.vibrate) navigator.vibrate(10);
}
export function hapticMedium() {
  if (isNative()) void Haptics.impact({ style: ImpactStyle.Medium });
  else if (navigator.vibrate) navigator.vibrate(25);
}
export function hapticSuccess() {
  if (isNative()) void Haptics.notification({ type: NotificationType.Success });
  else if (navigator.vibrate) navigator.vibrate([15, 50, 15]);
}
