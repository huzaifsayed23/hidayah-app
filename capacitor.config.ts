import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.hidayah.app',
  appName: 'Hidayah',
  webDir: 'out',
  server: {
    url: 'https://hidayah-gold.vercel.app', 
    cleartext: true,
    allowNavigation: ['*']
  }
};

export default config;
