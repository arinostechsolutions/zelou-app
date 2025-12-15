import React, { useState, useEffect } from 'react';
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
  Modal,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { reservationsApi, Reservation } from '../../api/reservations';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated from 'react-native-reanimated';
import { formatDateLong } from '../../utils/dateFormat';
import { getListItemAnimation } from '../../utils/animations';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

const ReservationsScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pendente' | 'aprovada'>('all');
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  // Modal de rejeição
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Verificar se é porteiro/zelador/sindico
  const canApprove = user?.role === 'porteiro' || user?.role === 'zelador' || user?.role === 'sindico';
  
  // Verificar se pode exportar relatórios (apenas síndico e master)
  const canExportReport = user?.role === 'sindico' || user?.isMasterAdmin;

  const loadReservations = async () => {
    setLoading(true);
    try {
      let response;
      if (canApprove) {
        // Porteiro/zelador/sindico vê todas as reservas
        const params = filter !== 'all' ? { status: filter } : {};
        response = await reservationsApi.getAll(params);
      } else {
        // Morador vê apenas suas reservas
        response = await reservationsApi.getMyReservations();
      }
      setReservations(response.data);
    } catch (error) {
      console.error('Error loading reservations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReservations();
    const unsubscribe = navigation.addListener('focus', loadReservations);
    return unsubscribe;
  }, [filter]);

  const handleApprove = async (id: string) => {
    Alert.alert(
      'Aprovar Reserva',
      'Deseja aprovar esta reserva?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Aprovar',
          onPress: async () => {
            setProcessingId(id);
            try {
              await reservationsApi.approve(id);
              Alert.alert('Sucesso', 'Reserva aprovada com sucesso!');
              loadReservations();
            } catch (error: any) {
              Alert.alert('Erro', error.response?.data?.message || 'Erro ao aprovar reserva');
            } finally {
              setProcessingId(null);
            }
          },
        },
      ]
    );
  };

  const handleReject = (id: string) => {
    setRejectingId(id);
    setRejectReason('');
    setRejectModalVisible(true);
  };

  const confirmReject = async () => {
    if (!rejectingId) return;
    
    setRejectModalVisible(false);
    setProcessingId(rejectingId);
    
    try {
      await reservationsApi.reject(rejectingId, rejectReason);
      Alert.alert('Sucesso', 'Reserva rejeitada');
      loadReservations();
    } catch (error: any) {
      Alert.alert('Erro', error.response?.data?.message || 'Erro ao rejeitar reserva');
    } finally {
      setProcessingId(null);
      setRejectingId(null);
      setRejectReason('');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendente':
        return '#F59E0B';
      case 'aprovada':
        return '#10B981';
      case 'rejeitada':
        return '#EF4444';
      case 'cancelada':
        return '#6B7280';
      default:
        return '#6B7280';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pendente':
        return 'Pendente';
      case 'aprovada':
        return 'Aprovada';
      case 'rejeitada':
        return 'Rejeitada';
      case 'cancelada':
        return 'Cancelada';
      case 'concluida':
        return 'Concluída';
      default:
        return status;
    }
  };

  const getUserName = (userId: Reservation['userId']) => {
    if (typeof userId === 'string') return '';
    return userId.name;
  };

  const getUserUnit = (userId: Reservation['userId']) => {
    if (typeof userId === 'string') return '';
    return userId.unit.block ? `${userId.unit.block} - ${userId.unit.number}` : userId.unit.number;
  };

  const pendingCount = reservations.filter(r => r.status === 'pendente').length;

  const renderItem = ({ item, index }: { item: Reservation; index: number }) => (
    <AnimatedTouchableOpacity
      entering={getListItemAnimation(index, 50)}
      style={styles.card}
      onPress={() => navigation.navigate('ReservationDetail' as never, { reservationId: item._id } as never)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardInfo}>
          <Text style={styles.areaName}>{item.areaId.name}</Text>
          {canApprove && typeof item.userId !== 'string' && (
            <View style={styles.userInfo}>
              <Ionicons name="person-outline" size={14} color="#64748B" />
              <Text style={styles.userName}>{getUserName(item.userId)}</Text>
              <Text style={styles.userUnit}>• {getUserUnit(item.userId)}</Text>
            </View>
          )}
        </View>
        <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(item.status)}20` }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {getStatusLabel(item.status)}
          </Text>
        </View>
      </View>

      <View style={styles.cardDetails}>
        <View style={styles.detailItem}>
          <Ionicons name="calendar-outline" size={16} color="#64748B" />
          <Text style={styles.detailText}>
            {formatDateLong(item.date)}
          </Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="time-outline" size={16} color="#64748B" />
          <Text style={styles.detailText}>{item.timeSlot}</Text>
        </View>
      </View>

      {/* Botões de aprovação para porteiro/zelador/sindico */}
      {canApprove && item.status === 'pendente' && (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.rejectButton]}
            onPress={() => handleReject(item._id)}
            disabled={processingId === item._id}
          >
            {processingId === item._id ? (
              <ActivityIndicator size="small" color="#EF4444" />
            ) : (
              <>
                <Ionicons name="close-circle-outline" size={20} color="#EF4444" />
                <Text style={styles.rejectButtonText}>Rejeitar</Text>
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.approveButton]}
            onPress={() => handleApprove(item._id)}
            disabled={processingId === item._id}
          >
            {processingId === item._id ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
                <Text style={styles.approveButtonText}>Aprovar</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Mostrar motivo da rejeição */}
      {item.status === 'rejeitada' && item.rejectionReason && (
        <View style={styles.rejectionReason}>
          <Ionicons name="information-circle-outline" size={16} color="#EF4444" />
          <Text style={styles.rejectionReasonText}>{item.rejectionReason}</Text>
        </View>
      )}
    </AnimatedTouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[colors.headerGradientStart, colors.headerGradientMiddle, colors.headerGradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 16 }]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>
              {canApprove ? 'Gerenciar Reservas' : 'Minhas Reservas'}
            </Text>
            <Text style={styles.headerSubtitle}>
              {reservations.length} reservas
              {canApprove && pendingCount > 0 && ` • ${pendingCount} pendentes`}
            </Text>
          </View>
          {canExportReport && (
            <TouchableOpacity
              style={styles.reportButton}
              onPress={() => navigation.navigate('ReservationReport' as never)}
              activeOpacity={0.7}
            >
              <Ionicons name="document-text-outline" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      {/* Filtros para porteiro/zelador/sindico */}
      {canApprove && (
        <View style={styles.filtersContainer}>
          <TouchableOpacity
            style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
            onPress={() => setFilter('all')}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
              Todas
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filter === 'pendente' && styles.filterButtonActive]}
            onPress={() => setFilter('pendente')}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterText, filter === 'pendente' && styles.filterTextActive]}>
              Pendentes
            </Text>
            {pendingCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{pendingCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filter === 'aprovada' && styles.filterButtonActive]}
            onPress={() => setFilter('aprovada')}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterText, filter === 'aprovada' && styles.filterTextActive]}>
              Aprovadas
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {loading && reservations.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={reservations}
          renderItem={renderItem}
          keyExtractor={(item) => item._id}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={loadReservations}
              tintColor="#6366F1"
              colors={['#6366F1']}
            />
          }
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="calendar-outline" size={64} color="#CBD5E1" />
              <Text style={styles.emptyText}>Nenhuma reserva encontrada</Text>
            </View>
          }
        />
      )}

      {/* FAB para criar reserva (morador e síndico) */}
      {(user?.role === 'morador' || user?.role === 'sindico') && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('CreateReservation' as never)}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#6366F1', '#8B5CF6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.fabGradient}
          >
            <Ionicons name="add" size={28} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>
      )}

      {/* Modal de Rejeição */}
      <Modal
        visible={rejectModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRejectModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Rejeitar Reserva</Text>
            <Text style={styles.modalSubtitle}>
              Informe o motivo da rejeição (opcional):
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Ex: Área em manutenção"
              placeholderTextColor="#94A3B8"
              value={rejectReason}
              onChangeText={setRejectReason}
              multiline
              numberOfLines={3}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButtonCancel}
                onPress={() => {
                  setRejectModalVisible(false);
                  setRejectingId(null);
                  setRejectReason('');
                }}
              >
                <Text style={styles.modalButtonCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButtonConfirm}
                onPress={confirmReject}
              >
                <Text style={styles.modalButtonConfirmText}>Rejeitar</Text>
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
  header: {
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  reportButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#E0E7FF',
    fontWeight: '500',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    borderRadius: 28,
    ...Platform.select({
      ios: {
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  fabGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  filterButtonActive: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  filterText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  badge: {
    backgroundColor: '#EF4444',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  list: {
    padding: 16,
    paddingBottom: 100,
  },
  card: {
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
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardInfo: {
    flex: 1,
  },
  areaName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  userName: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  userUnit: {
    fontSize: 13,
    color: '#94A3B8',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  cardDetails: {
    flexDirection: 'row',
    gap: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  rejectButton: {
    backgroundColor: '#FEE2E2',
  },
  rejectButtonText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '600',
  },
  approveButton: {
    backgroundColor: '#10B981',
  },
  approveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  rejectionReason: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    padding: 10,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
  },
  rejectionReasonText: {
    flex: 1,
    fontSize: 13,
    color: '#EF4444',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  empty: {
    padding: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#94A3B8',
    fontWeight: '500',
    marginTop: 16,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 16,
  },
  modalInput: {
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#1E293B',
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButtonCancel: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  modalButtonCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748B',
  },
  modalButtonConfirm: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#EF4444',
    alignItems: 'center',
  },
  modalButtonConfirmText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default ReservationsScreen;
