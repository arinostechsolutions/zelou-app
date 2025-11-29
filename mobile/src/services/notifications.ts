import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

export const registerForPushNotificationsAsync = async () => {
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Permissão de notificação negada');
      return null;
    }

    // Tenta obter o projectId de várias fontes
    let projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ||
      Constants?.easConfig?.projectId;

    // Se o projectId for o placeholder ou inválido, tenta sem ele
    if (!projectId || projectId === 'your-eas-project-id') {
      console.log('ProjectId não configurado, tentando obter token sem projectId...');
      try {
        const response = await Notifications.getExpoPushTokenAsync();
        console.log('Push token obtido com sucesso:', response.data);
        return response.data;
      } catch (innerError) {
        console.warn('Falha ao obter token sem projectId:', innerError);
        return null;
      }
    }

    const response = await Notifications.getExpoPushTokenAsync({ projectId });
    console.log('Push token obtido com sucesso:', response.data);
    return response.data;
  } catch (error) {
    console.warn('Falha ao registrar push token:', error);
    return null;
  }
};


