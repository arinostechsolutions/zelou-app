import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { reservationsApi, Reservation } from '../../api/reservations';
import { Ionicons } from '@expo/vector-icons';
import GradientHeader from '../../components/GradientHeader';
import { formatDateLong, formatDateTime } from '../../utils/dateFormat';

const ReservationDetailScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { reservationId } = route.params as { reservationId: string };
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    loadReservation();
  }, []);

  const loadReservation = async () => {
    try {
      const response = await reservationsApi.getById(reservationId);
      setReservation(response.data);
    } catch (error: any) {
      console.error('Erro ao carregar reserva:', error);
      Alert.alert('Erro', error.response?.data?.message || 'Não foi possível carregar os detalhes');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!reservation) return;
    Alert.alert('Cancelar Reserva', 'Deseja cancelar esta reserva?', [
      { text: 'Não', style: 'cancel' },
      {
        text: 'Sim, cancelar',
        style: 'destructive',
        onPress: async () => {
          setCancelling(true);
          try {
            await reservationsApi.cancel(reservation._id);
            Alert.alert('Sucesso', 'Reserva cancelada com sucesso', [
              { text: 'OK', onPress: () => navigation.goBack() }
            ]);
          } catch (error: any) {
            Alert.alert('Erro', error.response?.data?.message || 'Erro ao cancelar reserva');
          } finally {
            setCancelling(false);
          }
        },
      },
    ]);
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
      case 'concluida':
        return '#6366F1';
      default:
        return '#6B7280';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pendente':
        return 'Aguardando Aprovação';
      case 'aprovada':
        return 'Aprovada';
      case 'rejeitada':
        return 'Não Aprovada';
      case 'cancelada':
        return 'Cancelada';
      case 'concluida':
        return 'Concluída';
      default:
        return status;
    }
  };

  const getStatusIcon = (status: string): keyof typeof Ionicons.glyphMap => {
    switch (status) {
      case 'pendente':
        return 'time-outline';
      case 'aprovada':
        return 'checkmark-circle-outline';
      case 'rejeitada':
        return 'close-circle-outline';
      case 'cancelada':
        return 'ban-outline';
      case 'concluida':
        return 'flag-outline';
      default:
        return 'help-circle-outline';
    }
  };

  const canCancel = reservation?.status === 'pendente' || reservation?.status === 'aprovada';

  if (loading) {
    return (
      <View style={styles.container}>
        <GradientHeader
          title="Detalhes da Reserva"
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
        </View>
      </View>
    );
  }

  if (!reservation) {
    return (
      <View style={styles.container}>
        <GradientHeader
          title="Detalhes da Reserva"
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
          <Text style={styles.errorText}>Reserva não encontrada</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <GradientHeader
        title={reservation.areaId.name}
        subtitle="Detalhes da reserva"
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Card */}
        <View style={[styles.statusCard, { borderColor: getStatusColor(reservation.status) }]}>
          <View style={[styles.statusIconContainer, { backgroundColor: `${getStatusColor(reservation.status)}20` }]}>
            <Ionicons 
              name={getStatusIcon(reservation.status)} 
              size={32} 
              color={getStatusColor(reservation.status)} 
            />
          </View>
          <Text style={[styles.statusText, { color: getStatusColor(reservation.status) }]}>
            {getStatusLabel(reservation.status)}
          </Text>
          {reservation.status === 'pendente' && (
            <Text style={styles.statusDescription}>
              Sua reserva está sendo analisada e você será notificado quando for aprovada.
            </Text>
          )}
        </View>

        {/* Detalhes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações da Reserva</Text>
          
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Ionicons name="calendar-outline" size={20} color="#6366F1" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Data</Text>
              <Text style={styles.detailValue}>
                {formatDateLong(reservation.date)}
              </Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Ionicons name="time-outline" size={20} color="#6366F1" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Horário</Text>
              <Text style={styles.detailValue}>{reservation.timeSlot}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Ionicons name="business-outline" size={20} color="#6366F1" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Local</Text>
              <Text style={styles.detailValue}>{reservation.areaId.name}</Text>
            </View>
          </View>

          {reservation.areaId.rules?.fee > 0 && (
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Ionicons name="cash-outline" size={20} color="#6366F1" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Taxa</Text>
                <Text style={styles.detailValue}>
                  {reservation.areaId.rules.fee.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  })}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Aprovação / Rejeição */}
        {reservation.approvedBy && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {reservation.status === 'rejeitada' ? 'Reprovação' : 'Aprovação'}
            </Text>
            
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Ionicons 
                  name="person-outline" 
                  size={20} 
                  color={reservation.status === 'rejeitada' ? '#EF4444' : '#6366F1'} 
                />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>
                  {reservation.status === 'rejeitada' ? 'Reprovado por' : 'Aprovado por'}
                </Text>
                <Text style={styles.detailValue}>{reservation.approvedBy.name}</Text>
              </View>
            </View>

            {reservation.approvedAt && (
              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <Ionicons 
                    name={reservation.status === 'rejeitada' ? 'close-circle-outline' : 'checkmark-done-outline'} 
                    size={20} 
                    color={reservation.status === 'rejeitada' ? '#EF4444' : '#6366F1'} 
                  />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>
                    {reservation.status === 'rejeitada' ? 'Data da reprovação' : 'Data da aprovação'}
                  </Text>
                  <Text style={styles.detailValue}>
                    {formatDateTime(reservation.approvedAt)}
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Motivo da Rejeição */}
        {reservation.status === 'rejeitada' && reservation.rejectionReason && (
          <View style={styles.rejectionCard}>
            <View style={styles.rejectionHeader}>
              <Ionicons name="information-circle-outline" size={20} color="#EF4444" />
              <Text style={styles.rejectionTitle}>Motivo da não aprovação</Text>
            </View>
            <Text style={styles.rejectionText}>{reservation.rejectionReason}</Text>
          </View>
        )}

        {/* Botão Cancelar */}
        {canCancel && (
          <TouchableOpacity
            style={[styles.cancelButton, cancelling && styles.cancelButtonDisabled]}
            onPress={handleCancel}
            disabled={cancelling}
            activeOpacity={0.8}
          >
            {cancelling ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="close-circle-outline" size={24} color="#FFFFFF" />
                <Text style={styles.cancelButtonText}>Cancelar Reserva</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>
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
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 16,
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
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
  statusIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statusText: {
    fontSize: 20,
    fontWeight: '700',
  },
  statusDescription: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
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
        elevation: 2,
      },
    }),
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  detailIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    color: '#1E293B',
    fontWeight: '600',
  },
  rejectionCard: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  rejectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  rejectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
  },
  rejectionText: {
    fontSize: 14,
    color: '#991B1B',
    lineHeight: 20,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#EF4444',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  cancelButtonDisabled: {
    opacity: 0.6,
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default ReservationDetailScreen;
