import { Platform } from 'react-native';
import { FadeInDown, FadeInUp, FadeInLeft, FadeInRight } from 'react-native-reanimated';

/**
 * Retorna animação de entrada apropriada para cada plataforma
 * iOS: animação suave sem bounce
 * Android: animação com spring/bounce
 */
export const getListItemAnimation = (index: number, delayMultiplier: number = 30) => {
  const delay = index * delayMultiplier;
  
  if (Platform.OS === 'ios') {
    return FadeInDown.delay(delay).duration(300);
  }
  return FadeInDown.delay(delay).springify().damping(15);
};

export const getCardAnimation = (delay: number = 0) => {
  if (Platform.OS === 'ios') {
    return FadeInDown.delay(delay).duration(300);
  }
  return FadeInDown.delay(delay).springify().damping(15);
};

export const getFadeInUpAnimation = (delay: number = 0) => {
  if (Platform.OS === 'ios') {
    return FadeInUp.delay(delay).duration(300);
  }
  return FadeInUp.delay(delay).springify().damping(15);
};

export const getFadeInLeftAnimation = (delay: number = 0) => {
  if (Platform.OS === 'ios') {
    return FadeInLeft.delay(delay).duration(300);
  }
  return FadeInLeft.delay(delay).springify().damping(15);
};

export const getFadeInRightAnimation = (delay: number = 0) => {
  if (Platform.OS === 'ios') {
    return FadeInRight.delay(delay).duration(300);
  }
  return FadeInRight.delay(delay).springify().damping(15);
};

