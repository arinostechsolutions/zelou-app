// Cores do tema Light
export const lightColors = {
  // Backgrounds
  background: '#F1F5F9',
  backgroundSecondary: '#FFFFFF',
  backgroundTertiary: '#F8FAFC',
  
  // Cards e superfícies
  card: '#FFFFFF',
  cardBorder: '#E2E8F0',
  
  // Textos
  text: '#1E293B',
  textSecondary: '#64748B',
  textTertiary: '#94A3B8',
  textInverse: '#FFFFFF',
  
  // Primárias (roxo/indigo)
  primary: '#6366F1',
  primaryLight: '#8B5CF6',
  primaryDark: '#4F46E5',
  primaryBackground: '#EEF2FF',
  
  // Gradientes para header
  headerGradientStart: '#6366F1',
  headerGradientMiddle: '#8B5CF6',
  headerGradientEnd: '#A855F7',
  
  // Status
  success: '#10B981',
  successBackground: '#D1FAE5',
  warning: '#F59E0B',
  warningBackground: '#FEF3C7',
  error: '#EF4444',
  errorBackground: '#FEE2E2',
  info: '#3B82F6',
  infoBackground: '#DBEAFE',
  
  // Inputs
  inputBackground: '#F8FAFC',
  inputBorder: '#E2E8F0',
  inputText: '#1E293B',
  placeholder: '#94A3B8',
  
  // Dividers e borders
  divider: '#E2E8F0',
  border: '#E2E8F0',
  
  // Overlay
  overlay: 'rgba(0, 0, 0, 0.5)',
  
  // Tab bar
  tabBarBackground: '#FFFFFF',
  tabBarBorder: '#E2E8F0',
  tabBarActive: '#6366F1',
  tabBarInactive: '#94A3B8',
  
  // Shadows (para Platform.select)
  shadowColor: '#000000',
};

// Cores do tema Dark
export const darkColors = {
  // Backgrounds
  background: '#0F172A',
  backgroundSecondary: '#1E293B',
  backgroundTertiary: '#334155',
  
  // Cards e superfícies
  card: '#1E293B',
  cardBorder: '#334155',
  
  // Textos
  text: '#F1F5F9',
  textSecondary: '#94A3B8',
  textTertiary: '#64748B',
  textInverse: '#1E293B',
  
  // Primárias (roxo/indigo - mais vibrante no dark)
  primary: '#818CF8',
  primaryLight: '#A78BFA',
  primaryDark: '#6366F1',
  primaryBackground: '#312E81',
  
  // Gradientes para header (mais escuros no dark mode)
  headerGradientStart: '#1E1B4B',
  headerGradientMiddle: '#312E81',
  headerGradientEnd: '#3730A3',
  
  // Status
  success: '#34D399',
  successBackground: '#064E3B',
  warning: '#FBBF24',
  warningBackground: '#78350F',
  error: '#F87171',
  errorBackground: '#7F1D1D',
  info: '#60A5FA',
  infoBackground: '#1E3A8A',
  
  // Inputs
  inputBackground: '#334155',
  inputBorder: '#475569',
  inputText: '#F1F5F9',
  placeholder: '#64748B',
  
  // Dividers e borders
  divider: '#334155',
  border: '#475569',
  
  // Overlay
  overlay: 'rgba(0, 0, 0, 0.7)',
  
  // Tab bar
  tabBarBackground: '#1E293B',
  tabBarBorder: '#334155',
  tabBarActive: '#818CF8',
  tabBarInactive: '#64748B',
  
  // Shadows
  shadowColor: '#000000',
};

export type ThemeColors = typeof lightColors;

