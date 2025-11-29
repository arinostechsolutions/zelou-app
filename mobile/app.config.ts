import { ExpoConfig, ConfigContext } from '@expo/config';
import dotenv from 'dotenv';

// Carregar variáveis do .env
dotenv.config();

type EnvName = 'development' | 'staging' | 'production';

const withTrailingSlash = (value: string) => (value.endsWith('/') ? value : `${value}/`);

const ENV_SETTINGS: Record<EnvName, { apiBase: string }> = {
  development: {
    apiBase: withTrailingSlash(process.env.LOCAL_API_BASE ?? 'http://192.168.1.64:3000/'),
  },
  staging: {
    apiBase: withTrailingSlash('https://your-staging-api.com/'),
  },
  production: {
    apiBase: withTrailingSlash('https://your-production-api.com/'),
  },
};

const buildApiUrls = (env: EnvName) => {
  const base = ENV_SETTINGS[env] ?? ENV_SETTINGS.production;
  const apiRoot = withTrailingSlash(`${base.apiBase}api/`);

  // Debug
  console.log('🔧 Environment:', env);
  console.log('🔧 API Base:', base.apiBase);
  console.log('🔧 API Root:', apiRoot);
  console.log('🔧 LOCAL_API_BASE from env:', process.env.LOCAL_API_BASE);

  return {
    API_BASE_URL: apiRoot,
  };
};

export default ({ config }: ConfigContext): ExpoConfig => {
  const env = (process.env.APP_ENV as EnvName) ?? 'development';
  const apiUrls = buildApiUrls(env);

  return {
    ...config,
    name: 'Zelou',
    slug: 'zelou',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.zelou.app',
      infoPlist: {
        NSCameraUsageDescription: 'Este app precisa da câmera para tirar fotos de entregas e irregularidades.',
        NSPhotoLibraryUsageDescription: 'Este app precisa acessar suas fotos para anexar imagens.',
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      package: 'com.zelou.app',
      versionCode: 1,
      targetSdkVersion: 35,
      permissions: [
        'CAMERA',
        'READ_EXTERNAL_STORAGE',
        'WRITE_EXTERNAL_STORAGE',
        'READ_MEDIA_IMAGES',
      ],
    },
    web: {
      favicon: './assets/favicon.png',
    },
    extra: {
      ...config.extra,
      ...apiUrls,
      APP_ENV: env,
      eas: {
        projectId: 'feb54e15-748e-4218-8901-b30166d05c52',
      },
    },
    plugins: [
      'expo-font',
      'expo-asset',
      [
        'expo-build-properties',
        {
          android: {
            compileSdkVersion: 35,
            targetSdkVersion: 35,
          },
        },
      ],
    ],
    runtimeVersion: '1.0.0',
  };
};

