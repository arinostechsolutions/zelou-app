import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightColors, darkColors, ThemeColors } from '../themes/colors';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextData {
  theme: 'light' | 'dark';
  themeMode: ThemeMode;
  colors: ThemeColors;
  isDark: boolean;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextData>({} as ThemeContextData);

const THEME_STORAGE_KEY = '@zelou:theme';

interface ThemeProviderProps {
  children: ReactNode;
}

// TODO: Reativar dark mode no futuro - remover FORCE_LIGHT_MODE
const FORCE_LIGHT_MODE = true;

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('light');
  const [isLoading, setIsLoading] = useState(true);

  // Carregar preferência salva
  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      // Se forçar light mode, ignorar preferência salva
      if (FORCE_LIGHT_MODE) {
        setIsLoading(false);
        return;
      }
      
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
        setThemeModeState(savedTheme as ThemeMode);
      }
    } catch (error) {
      console.error('Erro ao carregar preferência de tema:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setThemeMode = async (mode: ThemeMode) => {
    // Se forçar light mode, não permitir mudança
    if (FORCE_LIGHT_MODE) return;
    
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
      setThemeModeState(mode);
    } catch (error) {
      console.error('Erro ao salvar preferência de tema:', error);
    }
  };

  const toggleTheme = () => {
    // Se forçar light mode, não permitir mudança
    if (FORCE_LIGHT_MODE) return;
    
    const currentTheme = themeMode === 'system' 
      ? (systemColorScheme || 'light') 
      : themeMode;
    
    setThemeMode(currentTheme === 'light' ? 'dark' : 'light');
  };

  // Determinar tema atual baseado no modo (forçar light se necessário)
  const theme: 'light' | 'dark' = FORCE_LIGHT_MODE 
    ? 'light'
    : (themeMode === 'system' 
        ? (systemColorScheme || 'light') 
        : themeMode);

  const isDark = theme === 'dark';
  const colors = isDark ? darkColors : lightColors;

  // Não renderizar até carregar preferência
  if (isLoading) {
    return null;
  }

  return (
    <ThemeContext.Provider 
      value={{ 
        theme, 
        themeMode, 
        colors, 
        isDark, 
        setThemeMode, 
        toggleTheme 
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;

