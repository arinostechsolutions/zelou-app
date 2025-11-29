import Constants from 'expo-constants';

export const API_BASE_URL = Constants.expoConfig?.extra?.API_BASE_URL || 'http://localhost:3000/api/';
export const APP_ENV = Constants.expoConfig?.extra?.APP_ENV || 'development';

// Debug: log da URL da API
console.log('API_BASE_URL:', API_BASE_URL);

