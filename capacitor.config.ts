import { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "nl.vynta.app",
  appName: "Vynta",
  webDir: "dist",
  server: {
    // De native app laadt je Next.js-site vanaf Netlify.
    // Voor lokaal testen: CAPACITOR_SERVER_URL=http://192.168.x.x:3000
    url: process.env.CAPACITOR_SERVER_URL || "https://vynta.netlify.app",
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
