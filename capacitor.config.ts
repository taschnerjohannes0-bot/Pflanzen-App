import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'de.taschner.pflanzentagebuch',
  appName: 'Pflanzentagebuch',
  webDir: 'dist',
  ios: {
    contentInset: 'never',
  },
  plugins: {
    LocalNotifications: {
      iconColor: '#2f6b4f',
    },
  },
}

export default config
