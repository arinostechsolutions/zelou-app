import { Platform } from 'react-native';
import { FadeInDown, FadeInUp, FadeInLeft, FadeInRight } from 'react-native-reanimated';

/**
 * Retorna animação de entrada suave sem bounce
 * Todas as plataformas usam animação linear sem spring
 */
export const getListItemAnimation = (index: number, delayMultiplier: number = 30) => {
  const delay = index * delayMultiplier;
  // Removido springify para evitar bounce - usando apenas fade suave
  return FadeInDown.delay(delay).duration(200);
};

export const getCardAnimation = (delay: number = 0) => {
  // Removido springify para evitar bounce - usando apenas fade suave
  return FadeInDown.delay(delay).duration(200);
};

export const getFadeInUpAnimation = (delay: number = 0) => {
  // Removido springify para evitar bounce - usando apenas fade suave
  return FadeInUp.delay(delay).duration(200);
};

export const getFadeInLeftAnimation = (delay: number = 0) => {
  // Removido springify para evitar bounce - usando apenas fade suave
  return FadeInLeft.delay(delay).duration(200);
};

export const getFadeInRightAnimation = (delay: number = 0) => {
  // Removido springify para evitar bounce - usando apenas fade suave
  return FadeInRight.delay(delay).duration(200);
};

