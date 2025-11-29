import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  withDelay,
  FadeInDown,
} from 'react-native-reanimated';
import { notificationsApi } from '../../api/notifications';
import { ThemeColors } from '../../themes/colors';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

interface ActionCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
  delay: number;
  onPress: () => void;
  colors: ThemeColors;
}

const ActionCard: React.FC<ActionCardProps> = ({ icon, label, color, delay, onPress, colors }) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    };
  });

  const handlePressIn = () => {
    // Usar animação mais suave no iOS (sem bounce)
    if (Platform.OS === 'ios') {
      scale.value = withTiming(0.96, { duration: 100 });
      opacity.value = withTiming(0.7, { duration: 100 });
    } else {
      scale.value = withSpring(0.95, { damping: 15, stiffness: 300 });
      opacity.value = withTiming(0.8, { duration: 100 });
    }
  };

  const handlePressOut = () => {
    if (Platform.OS === 'ios') {
      scale.value = withTiming(1, { duration: 100 });
      opacity.value = withTiming(1, { duration: 100 });
    } else {
      scale.value = withSpring(1, { damping: 15, stiffness: 300 });
      opacity.value = withTiming(1, { duration: 100 });
    }
  };

  // Animação de entrada: suave no iOS, spring no Android
  const enteringAnimation = Platform.OS === 'ios' 
    ? FadeInDown.delay(delay).duration(300)
    : FadeInDown.delay(delay).springify().damping(15);

  return (
    <AnimatedTouchableOpacity
      entering={enteringAnimation}
      style={[styles.actionCard, animatedStyle, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
    >
      <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
        <Ionicons name={icon} size={32} color={color} />
      </View>
      <Text style={[styles.actionText, { color: colors.text }]}>{label}</Text>
    </AnimatedTouchableOpacity>
  );
};

const HomeScreen = () => {
  const navigation = useNavigation();
  const rootNavigation = navigation.getParent();
  const { user } = useAuth();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const headerOpacity = useSharedValue(0);
  const headerTranslateY = useSharedValue(-20);
  const [unreadCount, setUnreadCount] = useState(0);

  // Carregar contagem de notificações não lidas
  const loadUnreadCount = useCallback(async () => {
    try {
      const response = await notificationsApi.getUnreadCount();
      setUnreadCount(response.data.count);
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
    }
  }, []);

  // Atualizar contagem quando a tela recebe foco
  useFocusEffect(
    useCallback(() => {
      loadUnreadCount();
    }, [loadUnreadCount])
  );

  useEffect(() => {
    headerOpacity.value = withTiming(1, { duration: 600 });
    headerTranslateY.value = withSpring(0, { damping: 15, stiffness: 100 });
  }, []);

  const headerAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: headerOpacity.value,
      transform: [{ translateY: headerTranslateY.value }],
    };
  });

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'morador':
        return 'Morador';
      case 'porteiro':
        return 'Porteiro';
      case 'zelador':
        return 'Zelador';
      case 'sindico':
        return 'Síndico';
      case 'master':
        return 'Administrador';
      default:
        return 'Usuário';
    }
  };

  const navigateToScreen = (screen: string) => {
    navigation.navigate(screen as never);
  };

  const navigateToTab = (tab: string, screen: string) => {
    navigation.navigate(tab as never, { screen } as never);
  };

  // Ações para Master Admin
  const masterAdminActions = [
    {
      icon: 'business' as keyof typeof Ionicons.glyphMap,
      label: 'Condomínios',
      color: '#6366F1',
      onPress: () => navigateToScreen('Condominiums'),
      show: true,
    },
    {
      icon: 'add-circle' as keyof typeof Ionicons.glyphMap,
      label: 'Criar Condomínio',
      color: '#10B981',
      onPress: () => navigateToScreen('CreateCondominium'),
      show: true,
    },
    {
      icon: 'people' as keyof typeof Ionicons.glyphMap,
      label: 'Gerenciar Usuários',
      color: '#F59E0B',
      onPress: () => navigateToScreen('ManageUsers'),
      show: true,
    },
    {
      icon: 'stats-chart' as keyof typeof Ionicons.glyphMap,
      label: 'Relatórios',
      color: '#8B5CF6',
      onPress: () => {},
      show: true,
    },
    {
      icon: 'document-text' as keyof typeof Ionicons.glyphMap,
      label: 'Documentos',
      color: '#0EA5E9',
      onPress: () => navigation.navigate('Documents' as never, { type: 'document' } as never),
      show: true,
    },
    {
      icon: 'list' as keyof typeof Ionicons.glyphMap,
      label: 'Regras',
      color: '#EC4899',
      onPress: () => navigation.navigate('Documents' as never, { type: 'rule' } as never),
      show: true,
    },
  ];

  // Ações para outros usuários
  const regularActions = [
    {
      icon: 'cube' as keyof typeof Ionicons.glyphMap,
      label: 'Entregas',
      color: '#6366F1',
      onPress: () => navigateToTab('Deliveries', 'DeliveriesList'),
      show: true,
    },
    {
      icon: 'warning' as keyof typeof Ionicons.glyphMap,
      label: 'Irregularidades',
      color: '#F59E0B',
      onPress: () => navigateToScreen('ReportsList'),
      show: user?.role === 'morador' || user?.role === 'zelador' || user?.role === 'sindico',
    },
    {
      icon: 'calendar' as keyof typeof Ionicons.glyphMap,
      label: 'Reservas',
      color: '#10B981',
      onPress: () => navigateToScreen('ReservationsList'),
      show: user?.role === 'morador' || user?.role === 'porteiro' || user?.role === 'zelador' || user?.role === 'sindico',
    },
    {
      icon: 'megaphone' as keyof typeof Ionicons.glyphMap,
      label: 'Comunicados',
      color: '#EF4444',
      onPress: () => navigateToTab('Announcements', 'AnnouncementsList'),
      show: true,
    },
    {
      icon: 'people' as keyof typeof Ionicons.glyphMap,
      label: 'Visitantes',
      color: '#8B5CF6',
      onPress: () => navigateToScreen('VisitorsList'),
      show: user?.role === 'porteiro' || user?.role === 'morador',
    },
    {
      icon: 'person-add' as keyof typeof Ionicons.glyphMap,
      label: 'Cadastrar Usuário',
      color: '#0EA5E9',
      onPress: () => navigation.navigate('CreateUser' as never, { 
        condominiumId: user?.condominium?._id || user?.condominium 
      } as never),
      show: user?.role === 'sindico' || user?.role === 'zelador',
    },
    {
      icon: 'business' as keyof typeof Ionicons.glyphMap,
      label: 'Áreas Comuns',
      color: '#14B8A6',
      onPress: () => navigateToScreen('Areas'),
      show: user?.role === 'sindico' || user?.role === 'zelador',
    },
    {
      icon: 'document-text' as keyof typeof Ionicons.glyphMap,
      label: 'Documentos',
      color: '#6366F1',
      onPress: () => navigation.navigate('Documents' as never, { type: 'document' } as never),
      show: true,
    },
    {
      icon: 'list' as keyof typeof Ionicons.glyphMap,
      label: 'Regras',
      color: '#EC4899',
      onPress: () => navigation.navigate('Documents' as never, { type: 'rule' } as never),
      show: true,
    },
    {
      icon: 'construct' as keyof typeof Ionicons.glyphMap,
      label: 'Manutenções',
      color: '#F97316',
      onPress: () => navigateToScreen('Maintenances'),
      show: true,
    },
  ];

  // Selecionar ações baseado no role do usuário
  const isMasterAdmin = user?.role === 'master' || user?.isMasterAdmin;
  const actions = (isMasterAdmin ? masterAdminActions : regularActions).filter((action) => action.show);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Animated.View style={[styles.header, headerAnimatedStyle]}>
          <LinearGradient
            colors={[colors.headerGradientStart, colors.headerGradientMiddle, colors.headerGradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.gradient, { paddingTop: insets.top + 16 }]}
          >
            <View style={styles.headerRow}>
              <View style={styles.headerContent}>
                <Text style={styles.greeting}>
                  Olá, <Text style={styles.nameBold}>{user?.name?.split(' ')[0] || 'Usuário'}</Text>
                </Text>
                <View style={styles.infoRow}>
                  <View style={styles.infoItem}>
                    <Ionicons name="briefcase-outline" size={16} color="#E0E7FF" />
                    <Text style={styles.infoText}>{getRoleLabel(user?.role)}</Text>
                  </View>
                  {user?.unit && (
                    <>
                      <View style={styles.infoDivider} />
                      <View style={styles.infoItem}>
                        <Ionicons name="home-outline" size={16} color="#E0E7FF" />
                        <Text style={styles.infoText}>
                          {user.unit.block ? `${user.unit.block} - ` : ''}{user.unit.number}
                        </Text>
                      </View>
                    </>
                  )}
                </View>
              </View>
              
              {/* Sino de Notificações */}
              <TouchableOpacity
                style={styles.notificationButton}
                onPress={() => navigation.navigate('Notifications' as never)}
                activeOpacity={0.7}
              >
                <Ionicons name="notifications-outline" size={26} color="#FFFFFF" />
                {unreadCount > 0 && (
                  <View style={styles.notificationBadge}>
                    <Text style={styles.notificationBadgeText}>
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </Animated.View>

        <View style={styles.quickActions}>
          {actions.map((action, index) => (
            <ActionCard
              key={action.label}
              icon={action.icon}
              label={action.label}
              color={action.color}
              delay={index * 100}
              onPress={action.onPress}
              colors={colors}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    overflow: 'hidden',
  },
  gradient: {
    paddingBottom: 32,
    paddingHorizontal: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  headerContent: {
    flex: 1,
  },
  notificationButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 16,
  },
  notificationBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  greeting: {
    fontSize: 22,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
    letterSpacing: 0.3,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  nameBold: {
    fontWeight: '700',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoDivider: {
    width: 1,
    height: 14,
    backgroundColor: '#C7D2FE',
    marginHorizontal: 12,
    opacity: 0.6,
  },
  infoText: {
    fontSize: 14,
    color: '#E0E7FF',
    fontWeight: '500',
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  actionCard: {
    backgroundColor: '#FFFFFF',
    width: '47%',
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  actionText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
});

export default HomeScreen;
