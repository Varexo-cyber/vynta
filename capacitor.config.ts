import { CapacitorConfig } from "@capacitor/cli";

const productionUrl = "https://vynta.nl";

const config: CapacitorConfig = {
  appId: "nl.vynta.app",
  appName: "Vynta",
  webDir: "dist",
  server: {
    // De native app laadt de productieomgeving van Vynta.
    // Voor lokaal testen: CAPACITOR_SERVER_URL=http://192.168.x.x:3000
    url: process.env.CAPACITOR_SERVER_URL || productionUrl,
    cleartext: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: "#f6f6f4",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
    },
  },
};

export default config;
