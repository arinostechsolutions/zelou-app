import { ExpoConfig, ConfigContext } from '@expo/config';
import dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Carregar variáveis do .env - especificar caminho explícito
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const result = dotenv.config({ path: envPath });
  if (result.error) {
    console.warn('⚠️ Erro ao carregar .env:', result.error);
  }
}

// Debug: log das variáveis de ambiente
console.log('🔍 process.env.LOCAL_API_BASE:', process.env.LOCAL_API_BASE);
console.log('🔍 envPath:', envPath);
console.log('🔍 fs.existsSync(envPath):', fs.existsSync(envPath));

type EnvName = 'development' | 'staging' | 'production';

const withTrailingSlash = (value: string) => (value.endsWith('/') ? value : `${value}/`);

// Para emulador Android, use 10.0.2.2 se LOCAL_API_BASE não estiver definido
// Para dispositivo físico na rede, use o IP da máquina (ex: 192.168.1.64)
const defaultApiBase = process.env.LOCAL_API_BASE || 'http://10.0.2.2:3000/';

const ENV_SETTINGS: Record<EnvName, { apiBase: string }> = {
  development: {
    apiBase: withTrailingSlash(defaultApiBase),
  },
  staging: {
    apiBase: withTrailingSlash('https://zelou-app-production.up.railway.app/'),
  },
  production: {
    apiBase: withTrailingSlash('https://zelou-app-production.up.railway.app/'),
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
  // EAS Build define EAS_BUILD=true durante a build
  const isEasBuild = process.env.EAS_BUILD === 'true';
  const env = (process.env.APP_ENV as EnvName) ?? (isEasBuild ? 'production' : 'development');
  const apiUrls = buildApiUrls(env);

  return {
    ...config,
    name: 'Zelou',
    slug: 'zelou',
    version: '1.0.2',
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
        ITSAppUsesNonExemptEncryption: false,
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
          },
        },
      ],
    ],
    runtimeVersion: '1.0.2',
  };
};

