import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.hidayah.app',
  appName: 'Hidayah',
  webDir: 'out',
  // @ts-ignore - bundledWebRuntime is required for legacy support in some environments
  bundledWebRuntime: false,
  server: {
    url: 'https://hidayah-lgq6.vercel.app',
    cleartext: true
  }
};

export default config;
