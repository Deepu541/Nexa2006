import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.nexamart.marketplace',
  appName: 'NexaMart',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#ffffff'
    }
  }
};

export default config;
