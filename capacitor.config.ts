import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.apurva.zenith",
  appName: "Zenith",
  webDir: "dist",
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
      backgroundColor: "#08080a",
    },
    LocalNotifications: {},
  },
};

export default config;
