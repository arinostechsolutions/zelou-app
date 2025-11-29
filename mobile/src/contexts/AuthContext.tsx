import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi, AuthResponse } from '../api/auth';
import { usersApi } from '../api/users';
import { registerForPushNotificationsAsync } from '../services/notifications';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'morador' | 'porteiro' | 'zelador' | 'sindico' | 'master';
  unit: {
    block: string;
    number: string;
  };
  condominium?: {
    _id: string;
    name?: string;
  };
  isMasterAdmin?: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: any) => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const hasSyncedPushToken = useRef(false);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('token');
      const storedUser = await AsyncStorage.getItem('user');
      
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Error loading stored auth:', error);
    } finally {
      setLoading(false);
    }
  };

  const syncPushToken = async (currentPushToken: string | null, forceUpdate: boolean = false) => {
    try {
      // Obtém o token do dispositivo atual
      const deviceToken = await registerForPushNotificationsAsync();
      
      if (!deviceToken) {
        console.log('Não foi possível obter push token do dispositivo');
        return;
      }

      // Se o token do backend é diferente do dispositivo, ou forceUpdate, atualiza
      if (forceUpdate || currentPushToken !== deviceToken) {
        await usersApi.updatePushToken(deviceToken);
        console.log('Push token atualizado com sucesso:', deviceToken);
      } else {
        console.log('Push token já está atualizado:', deviceToken);
      }
    } catch (error) {
      console.warn('Não foi possível sincronizar o push token', error);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await authApi.login({ email, password });
    const data: AuthResponse = response.data;
    
    await AsyncStorage.setItem('token', data.token);
    await AsyncStorage.setItem('user', JSON.stringify(data.user));
    
    setToken(data.token);
    setUser(data.user);
    hasSyncedPushToken.current = false;
    
    // Sempre atualiza o push token ao fazer login (garante que o token é do usuário correto)
    syncPushToken(data.user.pushToken, true);
  };

  const register = async (data: any) => {
    const response = await authApi.register(data);
    const authData: AuthResponse = response.data;
    
    await AsyncStorage.setItem('token', authData.token);
    await AsyncStorage.setItem('user', JSON.stringify(authData.user));
    
    setToken(authData.token);
    setUser(authData.user);
    hasSyncedPushToken.current = false;
    
    // Sempre atualiza o push token ao registrar
    syncPushToken(authData.user.pushToken, true);
  };

  const logout = async () => {
    try {
      // Limpar o push token do usuário no backend antes de deslogar
      await usersApi.updatePushToken('');
      console.log('Push token removido do usuário');
    } catch (error) {
      console.warn('Erro ao remover push token:', error);
    }
    
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
    setToken(null);
    setUser(null);
    hasSyncedPushToken.current = false;
  };

  const updateUser = async (userData: any) => {
    const updatedUser = {
      ...user,
      ...userData,
      id: userData._id || userData.id || user?.id,
    };
    setUser(updatedUser);
    await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
  };

  // Quando o app é reaberto com usuário já logado, busca dados atualizados do backend
  useEffect(() => {
    const checkAndSyncPushToken = async () => {
      if (user && token && !hasSyncedPushToken.current) {
        hasSyncedPushToken.current = true;
        try {
          // Busca dados atualizados do usuário para verificar pushToken
          const response = await authApi.getMe();
          const userData = response.data;
          const currentPushToken = userData.pushToken || null;
          
          // Sincroniza o pushToken se necessário
          await syncPushToken(currentPushToken);
        } catch (error) {
          console.warn('Erro ao verificar pushToken:', error);
          // Em caso de erro, tenta sincronizar mesmo assim
          await syncPushToken(null);
        }
      }
    };
    
    checkAndSyncPushToken();
  }, [user, token]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        updateUser,
        isAuthenticated: !!token && !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};


