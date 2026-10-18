// Haptic feedback: real vibration on Capacitor native, navigator.vibrate on web, no-op fallback.
// Static import: a bare dynamic import() is left unresolved by Vite and fails in the WebView.
import { Capacitor } from "@capacitor/core";
import { Haptics, ImpactStyle, NotificationType } from "@capacitor/haptics";
export function hapticLight() {
  if (Capacitor.isNativePlatform()) void Haptics.impact({ style: ImpactStyle.Light });
  else if (navigator.vibrate) navigator.vibrate(10);
}
export function hapticMedium() {
  if (Capacitor.isNativePlatform()) void Haptics.impact({ style: ImpactStyle.Medium });
  else if (navigator.vibrate) navigator.vibrate(25);
}
export function hapticSuccess() {
  if (Capacitor.isNativePlatform()) void Haptics.notification({ type: NotificationType.Success });
  else if (navigator.vibrate) navigator.vibrate([15, 50, 15]);
}
