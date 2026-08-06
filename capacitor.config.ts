import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.safha.app',
  appName: 'Safha',
  webDir: 'dist',
  server: {
    url: process.env.CAP_SERVER_URL || 'http://localhost:3000',
    cleartext: true
  },
  android: {
    allowMixedContent: true
  }
};

export default config;
