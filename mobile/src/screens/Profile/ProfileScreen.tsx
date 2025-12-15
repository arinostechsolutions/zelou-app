import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Platform, Switch, Modal } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated from 'react-native-reanimated';
import { getListItemAnimation } from '../../utils/animations';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);
const AnimatedView = Animated.createAnimatedComponent(View);

const ProfileScreen = () => {
  const { user, logout } = useAuth();
  const { colors } = useTheme();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);

  const handleLogout = async () => {
    setLogoutModalVisible(true);
  };

  const confirmLogout = async () => {
    setLogoutModalVisible(false);
    await logout();
  };

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
      default:
        return 'Usuário';
    }
  };

  const menuItems = [
    // Opção de admin (apenas para master admin)
    ...(user?.role === 'master' || user?.isMasterAdmin ? [
      {
        icon: 'shield-checkmark' as keyof typeof Ionicons.glyphMap,
        label: 'Administração',
        color: '#DC2626',
        onPress: () => navigation.navigate('Condominiums' as never),
      },
      {
        icon: 'stats-chart' as keyof typeof Ionicons.glyphMap,
        label: 'Estatísticas',
        color: '#10B981',
        onPress: () => navigation.navigate('Statistics' as never),
      },
    ] : []),
    {
      icon: 'person-outline' as keyof typeof Ionicons.glyphMap,
      label: 'Editar Dados Pessoais',
      color: '#6366F1',
      onPress: () => navigation.navigate('EditProfile' as never),
    },
  ];

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <LinearGradient
            colors={[colors.headerGradientStart, colors.headerGradientMiddle, colors.headerGradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.gradient, { paddingTop: insets.top + 16 }]}
          >
            <View style={styles.headerContent}>
              <Text style={styles.greeting}>
                Olá, <Text style={styles.nameBold}>{user?.name?.split(' ')[0] || 'Usuário'}</Text>
              </Text>
              <View style={styles.infoRow}>
                <View style={styles.infoItem}>
                  <Ionicons name="briefcase-outline" size={16} color="#E0E7FF" />
                  <Text style={styles.infoText}>{getRoleLabel(user?.role)}</Text>
                </View>
                <View style={styles.infoDivider} />
                <View style={styles.infoItem}>
                  <Ionicons name="home-outline" size={16} color="#E0E7FF" />
                  <Text style={styles.infoText}>
                    {user?.unit?.block ? `${user.unit.block} - ` : ''}{user?.unit?.number}
                  </Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </View>

        <View style={styles.menu}>
          {menuItems.map((item, index) => (
            <AnimatedTouchableOpacity
              key={item.label}
              entering={getListItemAnimation(index, 50)}
              style={styles.menuItem}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <View style={[styles.iconContainer, { backgroundColor: `${item.color}20` }]}>
                <Ionicons name={item.icon} size={26} color={item.color} />
              </View>
              <Text style={styles.menuItemText}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={22} color="#94A3B8" />
            </AnimatedTouchableOpacity>
          ))}

          {/* TODO: Reativar seção de Aparência quando implementar dark mode
          <AnimatedView
            entering={getListItemAnimation(menuItems.length, 50)}
            style={[styles.themeSection, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
          >
            <View style={styles.themeSectionHeader}>
              <View style={[styles.iconContainer, { backgroundColor: isDark ? '#A78BFA20' : '#6366F120' }]}>
                <Ionicons name={isDark ? 'moon' : 'sunny'} size={26} color={isDark ? '#A78BFA' : '#F59E0B'} />
              </View>
              <Text style={[styles.menuItemText, { color: colors.text }]}>Aparência</Text>
            </View>
            
            <View style={styles.themeOptions}>
              <TouchableOpacity
                style={[
                  styles.themeOption,
                  { backgroundColor: colors.backgroundTertiary },
                  themeMode === 'light' && styles.themeOptionActive,
                  themeMode === 'light' && { borderColor: colors.primary }
                ]}
                onPress={() => setThemeMode('light')}
                activeOpacity={0.7}
              >
                <Ionicons name="sunny" size={20} color={themeMode === 'light' ? colors.primary : colors.textSecondary} />
                <Text style={[
                  styles.themeOptionText,
                  { color: themeMode === 'light' ? colors.primary : colors.textSecondary }
                ]}>Claro</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.themeOption,
                  { backgroundColor: colors.backgroundTertiary },
                  themeMode === 'dark' && styles.themeOptionActive,
                  themeMode === 'dark' && { borderColor: colors.primary }
                ]}
                onPress={() => setThemeMode('dark')}
                activeOpacity={0.7}
              >
                <Ionicons name="moon" size={20} color={themeMode === 'dark' ? colors.primary : colors.textSecondary} />
                <Text style={[
                  styles.themeOptionText,
                  { color: themeMode === 'dark' ? colors.primary : colors.textSecondary }
                ]}>Escuro</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.themeOption,
                  { backgroundColor: colors.backgroundTertiary },
                  themeMode === 'system' && styles.themeOptionActive,
                  themeMode === 'system' && { borderColor: colors.primary }
                ]}
                onPress={() => setThemeMode('system')}
                activeOpacity={0.7}
              >
                <Ionicons name="phone-portrait" size={20} color={themeMode === 'system' ? colors.primary : colors.textSecondary} />
                <Text style={[
                  styles.themeOptionText,
                  { color: themeMode === 'system' ? colors.primary : colors.textSecondary }
                ]}>Sistema</Text>
              </TouchableOpacity>
            </View>
          </AnimatedView>
          */}

          <AnimatedTouchableOpacity
            entering={getListItemAnimation(menuItems.length, 50)}
            style={[styles.menuItem, styles.logoutItem]}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <View style={[styles.iconContainer, { backgroundColor: '#EF444420' }]}>
              <Ionicons name="log-out-outline" size={26} color="#EF4444" />
            </View>
            <Text style={[styles.menuItemText, styles.logoutText]}>Sair</Text>
            <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
          </AnimatedTouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal de Confirmação de Logout */}
      <Modal
        visible={logoutModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLogoutModalVisible(false)}
      >
        <View style={styles.logoutModalOverlay}>
          <View style={styles.logoutModalContent}>
            <View style={styles.logoutModalIconContainer}>
              <Ionicons name="log-out-outline" size={48} color="#EF4444" />
            </View>
            <Text style={styles.logoutModalTitle}>Sair da conta</Text>
            <Text style={styles.logoutModalMessage}>Deseja realmente sair da sua conta?</Text>
            
            <View style={styles.logoutModalButtons}>
              <TouchableOpacity
                style={[styles.logoutModalButton, styles.logoutModalButtonCancel]}
                onPress={() => setLogoutModalVisible(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.logoutModalButtonCancelText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.logoutModalButton, styles.logoutModalButtonConfirm]}
                onPress={confirmLogout}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#EF4444', '#DC2626']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.logoutModalButtonGradient}
                >
                  <Text style={styles.logoutModalButtonConfirmText}>Sair</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9',
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
  headerContent: {
    marginTop: 24,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
    letterSpacing: 0.3,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  nameBold: {
    fontWeight: '700',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoDivider: {
    width: 1,
    height: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  infoText: {
    fontSize: 14,
    color: '#E0E7FF',
    fontWeight: '500',
  },
  menu: {
    marginTop: 16,
    marginHorizontal: 16,
    gap: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
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
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  menuItemText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    letterSpacing: 0.2,
  },
  logoutItem: {
    borderColor: '#FEE2E2',
  },
  logoutText: {
    fontWeight: '600',
  },
  themeSection: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 2,
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
  themeSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  themeOptions: {
    flexDirection: 'row',
    gap: 10,
  },
  themeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    gap: 6,
  },
  themeOptionActive: {
    borderWidth: 2,
  },
  themeOptionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  logoutModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 40,
  },
  logoutModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    paddingBottom: 32,
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
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
  logoutModalIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  logoutModalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 12,
    textAlign: 'center',
  },
  logoutModalMessage: {
    fontSize: 16,
    color: '#475569',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  logoutModalButtons: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
    marginTop: 8,
  },
  logoutModalButton: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  logoutModalButtonCancel: {
    backgroundColor: '#F1F5F9',
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  logoutModalButtonConfirm: {
    // Gradient será aplicado no LinearGradient
  },
  logoutModalButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutModalButtonCancelText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#64748B',
    textAlign: 'center',
    paddingVertical: 16,
  },
  logoutModalButtonConfirmText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default ProfileScreen;
