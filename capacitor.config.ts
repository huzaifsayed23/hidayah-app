import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.hidayah.app',
  appName: 'Hidayah',
  webDir: 'out',
  server: {
    // When you deploy to Vercel, put your URL here for instant updates
    // Example: url: 'https://your-hidayah-app.vercel.app',
    cleartext: true,
    allowNavigation: ['*']
  }
};

export default config;
