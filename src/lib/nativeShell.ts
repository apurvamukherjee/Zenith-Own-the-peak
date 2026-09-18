// Native-shell chrome: status bar color + native splash hand-off. Web-only
// builds never load these plugins (same dynamic-import-behind-isNativePlatform
// guard as notifications.ts/haptics.ts), so this is a no-op on Vercel.
function isNative(): boolean {
  const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  return Boolean(cap?.isNativePlatform?.());
}

export async function initStatusBar() {
  if (!isNative()) return;
  try {
    const { StatusBar, Style } = await import(/* @vite-ignore */ "@capacitor/status-bar");
    const cachedTheme = localStorage.getItem("zenith-theme");
    await StatusBar.setStyle({ style: cachedTheme === "light" ? Style.Light : Style.Dark });
    await StatusBar.setBackgroundColor({ color: cachedTheme === "light" ? "#c8112a" : "#0d0608" });
  } catch { /* plugin unavailable */ }
}

// Called once App.tsx's own splash+seed gate (`ready`) flips true, so the
// native launch image hands off straight to the in-app UI instead of a
// double splash.
export async function hideNativeSplash() {
  if (!isNative()) return;
  try {
    const { SplashScreen } = await import(/* @vite-ignore */ "@capacitor/splash-screen");
    await SplashScreen.hide();
  } catch { /* plugin unavailable */ }
}
