import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "ph.kugi.mobile",
  appName: "Kugi",
  webDir: "out",
  server: {
    url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    androidScheme: "https",
  },
};

export default config;
