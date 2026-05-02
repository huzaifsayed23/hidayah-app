import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.hidayah.app',
  appName: 'hidayah-app',
  webDir: 'public',
  server: {
    url: 'https://hidayah-lgq6.vercel.app',
    cleartext: true
  },
  bundledWebRuntime: false
};

export default config;
