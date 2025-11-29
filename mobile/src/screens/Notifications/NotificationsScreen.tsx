import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { notificationsApi, Notification } from '../../api/notifications';
import { useTheme } from '../../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated from 'react-native-reanimated';
import { getListItemAnimation } from '../../utils/animations';
import GradientHeader from '../../components/GradientHeader';
import { formatDateRelative } from '../../utils/dateFormat';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

const NotificationsScreen = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadNotifications = useCallback(async () => {
    try {
      const response = await notificationsApi.getAll({ limit: 50 });
      setNotifications(response.data.notifications);
      setUnreadCount(response.data.unreadCount);
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
    const unsubscribe = navigation.addListener('focus', loadNotifications);
    return unsubscribe;
  }, [loadNotifications, navigation]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadNotifications();
  };

  const handleMarkAsRead = async (notification: Notification) => {
    if (!notification.read) {
      try {
        await notificationsApi.markAsRead(notification._id);
        setNotifications(prev =>
          prev.map(n =>
            n._id === notification._id ? { ...n, read: true } : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (error) {
        console.error('Erro ao marcar como lida:', error);
      }
    }
    
    // Navegar para a tela correspondente
    navigateToDetail(notification);
  };

  const navigateToDetail = (notification: Notification) => {
    const { type, data } = notification;
    
    switch (type) {
      case 'delivery':
      case 'delivery_retrieved':
        if (data?.deliveryId) {
          navigation.navigate('DeliveryDetail' as never, { deliveryId: data.deliveryId } as never);
        } else {
          navigation.navigate('DeliveriesList' as never);
        }
        break;
      case 'reservation':
      case 'reservation_request':
      case 'reservation_approved':
      case 'reservation_rejected':
      case 'reservation_cancelled':
        if (data?.reservationId) {
          navigation.navigate('ReservationDetail' as never, { reservationId: data.reservationId } as never);
        } else {
          navigation.navigate('ReservationsList' as never);
        }
        break;
      case 'announcement':
        if (data?.announcementId) {
          navigation.navigate('AnnouncementDetail' as never, { announcementId: data.announcementId } as never);
        } else {
          // Navegar para a tab de comunicados
          const parent = navigation.getParent();
          if (parent) {
            parent.navigate('Announcements' as never);
          }
        }
        break;
      case 'report':
      case 'report_update':
        if (data?.reportId) {
          navigation.navigate('ReportDetail' as never, { reportId: data.reportId } as never);
        } else {
          navigation.navigate('ReportsList' as never);
        }
        break;
      case 'visitor':
      case 'visitor_arrived':
        if (data?.visitorId) {
          navigation.navigate('VisitorDetail' as never, { visitorId: data.visitorId } as never);
        } else {
          navigation.navigate('VisitorsList' as never);
        }
        break;
      case 'document':
        if (data?.documentId) {
          // Documentos abrem diretamente o arquivo, então vamos para a lista
          const docType = data?.documentType || 'document';
          navigation.navigate('Documents' as never, { type: docType } as never);
        } else {
          navigation.navigate('Documents' as never, { type: 'document' } as never);
        }
        break;
      case 'maintenance':
        if (data?.maintenanceId) {
          navigation.navigate('MaintenanceDetail' as never, { maintenanceId: data.maintenanceId } as never);
        } else {
          navigation.navigate('Maintenances' as never);
        }
        break;
      default:
        // Notificações gerais não navegam
        break;
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications(prev =>
        prev.map(n => ({ ...n, read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível marcar todas como lidas');
    }
  };

  const handleDeleteAll = () => {
    Alert.alert(
      'Limpar Notificações',
      'Deseja excluir todas as notificações?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir Todas',
          style: 'destructive',
          onPress: async () => {
            try {
              await notificationsApi.deleteAll();
              setNotifications([]);
              setUnreadCount(0);
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível excluir as notificações');
            }
          },
        },
      ]
    );
  };

  const getNotificationIcon = (type: string): keyof typeof Ionicons.glyphMap => {
    switch (type) {
      case 'delivery':
        return 'cube';
      case 'delivery_retrieved':
        return 'checkmark-circle';
      case 'reservation':
      case 'reservation_request':
        return 'calendar';
      case 'reservation_approved':
        return 'checkmark-circle';
      case 'reservation_rejected':
        return 'close-circle';
      case 'reservation_cancelled':
        return 'calendar-outline';
      case 'announcement':
        return 'megaphone';
      case 'report':
      case 'report_update':
        return 'warning';
      case 'visitor':
      case 'visitor_arrived':
        return 'people';
      case 'document':
        return 'document-text';
      case 'maintenance':
        return 'construct';
      default:
        return 'notifications';
    }
  };

  const getNotificationColor = (type: string): string => {
    switch (type) {
      case 'delivery':
        return '#F59E0B';
      case 'delivery_retrieved':
        return '#10B981';
      case 'reservation':
      case 'reservation_request':
        return '#6366F1';
      case 'reservation_approved':
        return '#10B981';
      case 'reservation_rejected':
        return '#EF4444';
      case 'reservation_cancelled':
        return '#94A3B8';
      case 'announcement':
        return '#8B5CF6';
      case 'report':
      case 'report_update':
        return '#F97316';
      case 'visitor':
      case 'visitor_arrived':
        return '#06B6D4';
      case 'document':
        return '#3B82F6';
      case 'maintenance':
        return '#F97316';
      default:
        return '#64748B';
    }
  };

  const renderItem = ({ item, index }: { item: Notification; index: number }) => {
    const iconColor = getNotificationColor(item.type);
    
    return (
      <AnimatedTouchableOpacity
        entering={getListItemAnimation(index)}
        style={[
          styles.notificationCard,
          !item.read && styles.unreadCard
        ]}
        onPress={() => handleMarkAsRead(item)}
        activeOpacity={0.7}
      >
        <View style={[styles.iconContainer, { backgroundColor: `${iconColor}15` }]}>
          <Ionicons
            name={getNotificationIcon(item.type)}
            size={24}
            color={iconColor}
          />
        </View>
        
        <View style={styles.contentContainer}>
          <View style={styles.headerRow}>
            <Text style={[styles.title, !item.read && styles.unreadTitle]} numberOfLines={1}>
              {item.title}
            </Text>
            {!item.read && <View style={styles.unreadDot} />}
          </View>
          <Text style={styles.body} numberOfLines={2}>
            {item.body}
          </Text>
          <Text style={styles.time}>
            {formatDateRelative(item.createdAt)}
          </Text>
        </View>
        
        <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
      </AnimatedTouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <GradientHeader
          title="Notificações"
          subtitle="Suas atualizações"
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <GradientHeader
        title="Notificações"
        subtitle={unreadCount > 0 ? `${unreadCount} não lida${unreadCount > 1 ? 's' : ''}` : 'Todas lidas'}
        onBackPress={() => navigation.goBack()}
        rightComponent={
          notifications.length > 0 ? (
            <TouchableOpacity
              style={styles.headerButton}
              onPress={handleMarkAllAsRead}
              activeOpacity={0.7}
            >
              <Ionicons name="checkmark-done" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          ) : undefined
        }
      />

      {notifications.length > 0 && (
        <View style={[styles.actionsBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleMarkAllAsRead}
            activeOpacity={0.7}
          >
            <Ionicons name="checkmark-done-outline" size={18} color={colors.primary} />
            <Text style={[styles.actionText, { color: colors.primary }]}>Marcar todas como lidas</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleDeleteAll}
            activeOpacity={0.7}
          >
            <Ionicons name="trash-outline" size={18} color={colors.error} />
            <Text style={[styles.actionText, { color: colors.error }]}>Limpar</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={notifications}
        renderItem={renderItem}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#6366F1"
            colors={['#6366F1']}
          />
        }
        contentContainerStyle={[
          styles.list,
          notifications.length === 0 && styles.emptyList
        ]}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="notifications-off-outline" size={64} color="#CBD5E1" />
            </View>
            <Text style={styles.emptyTitle}>Nenhuma notificação</Text>
            <Text style={styles.emptySubtitle}>
              Você receberá notificações sobre entregas, reservas e comunicados aqui
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6366F1',
  },
  list: {
    padding: 16,
    paddingBottom: 100,
  },
  emptyList: {
    flex: 1,
    justifyContent: 'center',
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  unreadCard: {
    backgroundColor: '#F8FAFF',
    borderColor: '#C7D2FE',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  contentContainer: {
    flex: 1,
    marginRight: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#334155',
    flex: 1,
  },
  unreadTitle: {
    color: '#1E293B',
    fontWeight: '700',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#6366F1',
  },
  body: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
    lineHeight: 18,
  },
  time: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 6,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default NotificationsScreen;

