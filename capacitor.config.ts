import { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "nl.vynta.app",
  appName: "Vynta",
  webDir: "public",
  server: {
    url: process.env.CAPACITOR_SERVER_URL || "https://vynta.nl",
    cleartext: false,
  },
  android: {
    backgroundColor: "#f6f4f1",
    allowMixedContent: false,
  },
  ios: {
    backgroundColor: "#f6f4f1",
    contentInset: "always",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: "#f6f4f1",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      iosSpinnerStyle: "small",
      showSpinner: false,
    },
    StatusBar: {
      style: "DEFAULT",
      backgroundColor: "#f6f4f1",
      overlaysWebView: false,
    },
    Keyboard: {
      resize: "body" as any,
      resizeOnFullScreen: true,
    },
  },
};

export default config;
