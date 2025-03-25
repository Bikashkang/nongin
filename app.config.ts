import { ExpoConfig } from '@expo/config-types';

const config: ExpoConfig = {
  name: 'nongin',
  slug: 'nongin',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
  },
  updates: {
    fallbackToCacheTimeout: 0,
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: true,
    infoPlist: {
      NSLocationWhenInUseUsageDescription: "This app needs access to location when open to show your current location.",
      NSLocationAlwaysUsageDescription: "This app needs access to location when in the background to show your current location.",
      UIBackgroundModes: ["location", "fetch", "remote-notification"],
    },
  },
  android: {
    package: 'com.nongin.app',
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#ffffff',
    },
    permissions: [
      "ACCESS_COARSE_LOCATION",
      "ACCESS_FINE_LOCATION",
      "ACCESS_BACKGROUND_LOCATION",
      "NOTIFICATIONS",
      "POST_NOTIFICATIONS"
    ],
  },
  web: {
    favicon: './assets/favicon.png',
  },
  scheme: 'groceryapp',
  extra: {
    eas: {
      projectId: "4d83a602-cb90-42dc-8426-8083e732d7a7"
    }
  },
  plugins: [
    "expo-router",
    "expo-notifications" 
  ]
};

export default config;