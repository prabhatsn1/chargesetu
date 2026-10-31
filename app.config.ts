import { IOSConfig, withDangerousMod, type ConfigPlugin } from '@expo/config-plugins';
import { mergeContents } from '@expo/config-plugins/build/utils/generateCode';
import fs from 'node:fs';
import type { ConfigContext, ExpoConfig } from 'expo/config';

// @react-native-firebase/app's AppDelegate patcher looks for `self.moduleName = "..."`
// or `factory.startReactNative(`, neither of which exist in Expo SDK 58's SceneDelegate-based
// AppDelegate.swift template, so it silently skips adding `FirebaseApp.configure()`. Patch it
// in ourselves, anchored on the `return super.application(...)` call instead.
const withFirebaseAppDelegateFix: ConfigPlugin = (config) =>
  withDangerousMod(config, [
    'ios',
    async (config) => {
      const { path } = IOSConfig.Paths.getAppDelegate(config.modRequest.projectRoot);
      const contents = await fs.promises.readFile(path, 'utf8');
      if (contents.includes('FirebaseApp.configure()')) return config;

      const newContents = mergeContents({
        tag: 'chargesetu-firebase-configure',
        src: contents,
        newSrc: '    FirebaseApp.configure()',
        anchor: /return super\.application\(/,
        offset: 0,
        comment: '//',
      }).contents;

      await fs.promises.writeFile(path, newContents);
      return config;
    },
  ]);

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
    withFirebaseAppDelegateFix,
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
  ] as ExpoConfig['plugins'],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    razorpayKeyId: process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID,
  },
});
