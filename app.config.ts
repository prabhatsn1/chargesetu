import type { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'ChargeSetu',
  slug: 'chargesetu',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'chargesetu',
  userInterfaceStyle: 'automatic',
  ios: {
    icon: './assets/expo.icon',
    bundleIdentifier: 'com.chargesetu.app',
    supportsTablet: false,
    googleServicesFile: process.env.GOOGLE_SERVICE_INFO_PLIST ?? './GoogleService-Info.plist',
    config: {
      googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
    },
    infoPlist: {
      NSLocationWhenInUseUsageDescription:
        'ChargeSetu uses your location to show nearby EV chargers and to confirm your Host listing location.',
      NSCameraUsageDescription:
        'ChargeSetu needs camera access to take the start/end charge-display photos used to verify a charging session.',
      NSPhotoLibraryUsageDescription:
        'ChargeSetu needs photo library access to attach charger photos and charge-display photos.',
    },
  },
  android: {
    package: 'com.chargesetu.app',
    googleServicesFile: process.env.GOOGLE_SERVICES_JSON ?? './google-services.json',
    adaptiveIcon: {
      backgroundColor: '#E6F4FE',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
    config: {
      googleMaps: {
        apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
      },
    },
    permissions: ['ACCESS_COARSE_LOCATION', 'ACCESS_FINE_LOCATION', 'CAMERA'],
  },
  web: {
    output: 'static',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    '@react-native-firebase/app',
    '@react-native-firebase/auth',
    '@react-native-firebase/messaging',
    [
      '@react-native-google-signin/google-signin',
      {
        // From Firebase console → Authentication → Sign-in method → Google → Web SDK config,
        // reversed client ID of the iOS OAuth client (see README "Google sign-in" setup step).
        // This placeholder lets `expo install`/`expo prebuild` run before real credentials exist —
        // replace it via GOOGLE_SIGNIN_IOS_URL_SCHEME before building for iOS.
        iosUrlScheme: process.env.GOOGLE_SIGNIN_IOS_URL_SCHEME ?? 'com.googleusercontent.apps.REPLACE_ME',
      },
    ],
    [
      'expo-splash-screen',
      {
        backgroundColor: '#208AEF',
        image: './assets/images/splash-icon.png',
        imageWidth: 76,
      },
    ],
    [
      'expo-location',
      {
        locationWhenInUsePermission:
          'ChargeSetu uses your location to show nearby EV chargers and to confirm your Host listing location.',
      },
    ],
    [
      'expo-image-picker',
      {
        cameraPermission:
          'ChargeSetu needs camera access to take the start/end charge-display photos used to verify a charging session.',
        photosPermission: 'ChargeSetu needs photo library access to attach charger and charge-display photos.',
      },
    ],
    [
      'expo-notifications',
      {
        icon: './assets/images/icon.png',
        color: '#16A34A',
      },
    ],
    'expo-apple-authentication',
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    razorpayKeyId: process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID,
  },
});
