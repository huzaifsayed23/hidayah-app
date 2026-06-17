import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.hidayah.app',
  appName: 'Hidayah',
  webDir: 'out',
  // @ts-ignore - bundledWebRuntime is required for legacy support in some environments
  bundledWebRuntime: false,
  server: {
    cleartext: true
  },
  plugins: {
    CapacitorHttp: {
      enabled: true
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    }
  }
};

export default config;
