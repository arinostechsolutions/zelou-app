import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { formatDateTime } from '../../utils/dateFormat';
import { useAuth } from '../../contexts/AuthContext';
import { deliveriesApi, Delivery } from '../../api/deliveries';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import GradientHeader from '../../components/GradientHeader';

const DeliveryDetailScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { user } = useAuth();
  const { deliveryId } = route.params as { deliveryId: string };
  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    loadDelivery();
  }, []);

  const loadDelivery = async () => {
    try {
      const response = await deliveriesApi.getById(deliveryId);
      setDelivery(response.data);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar os detalhes da entrega');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmRetrieval = async () => {
    if (!delivery) return;

    Alert.alert(
      'Confirmar Retirada',
      'Deseja confirmar a retirada desta entrega?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            setConfirming(true);
            try {
              await deliveriesApi.confirmRetrieval(delivery._id);
              Alert.alert('Sucesso', 'Retirada confirmada');
              loadDelivery();
            } catch (error: any) {
              Alert.alert('Erro', error.response?.data?.message || 'Erro ao confirmar retirada');
            } finally {
              setConfirming(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <GradientHeader
          title="Detalhes da Entrega"
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
        </View>
      </View>
    );
  }

  if (!delivery) {
    return (
      <View style={styles.container}>
        <GradientHeader
          title="Detalhes da Entrega"
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
          <Text style={styles.errorText}>Entrega não encontrada</Text>
        </View>
      </View>
    );
  }

  const isPending = delivery.status === 'pendente';

  return (
    <View style={styles.container}>
      <GradientHeader
        title="Detalhes da Entrega"
        subtitle={delivery.packageType}
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Foto */}
        <Image source={{ uri: delivery.photoUrl }} style={styles.photo} />

        {/* Status Card */}
        <View style={[styles.statusCard, { borderColor: isPending ? '#F59E0B' : '#10B981' }]}>
          <View style={[styles.statusIconContainer, { backgroundColor: isPending ? '#FEF3C7' : '#D1FAE5' }]}>
            <Ionicons
              name={isPending ? 'time' : 'checkmark-circle'}
              size={28}
              color={isPending ? '#F59E0B' : '#10B981'}
            />
          </View>
          <View style={styles.statusInfo}>
            <Text style={styles.statusLabel}>Status</Text>
            <Text style={[styles.statusValue, { color: isPending ? '#F59E0B' : '#10B981' }]}>
              {isPending ? 'Aguardando Retirada' : 'Retirada'}
            </Text>
          </View>
        </View>

        {/* Informações do Morador */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Morador</Text>
          <View style={styles.residentCard}>
            <View style={styles.residentAvatar}>
              <Ionicons name="person" size={24} color="#6366F1" />
            </View>
            <View style={styles.residentInfo}>
              <Text style={styles.residentName}>{delivery.residentId.name}</Text>
              <View style={styles.unitRow}>
                <Ionicons name="home-outline" size={14} color="#64748B" />
                <Text style={styles.unitText}>
                  {delivery.residentId.unit.block ? `${delivery.residentId.unit.block} - ` : ''}{delivery.residentId.unit.number}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Detalhes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações</Text>

          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Ionicons name="cube-outline" size={20} color="#6366F1" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Tipo</Text>
              <Text style={styles.detailValue}>{delivery.packageType}</Text>
            </View>
          </View>

          {delivery.volumeNumber && (
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Ionicons name="layers-outline" size={20} color="#6366F1" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Volumes</Text>
                <Text style={styles.detailValue}>{delivery.volumeNumber}</Text>
              </View>
            </View>
          )}

          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Ionicons name="person-outline" size={20} color="#6366F1" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Registrado por</Text>
              <Text style={styles.detailValue}>{delivery.createdBy.name}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Ionicons name="calendar-outline" size={20} color="#6366F1" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Data/Hora do registro</Text>
              <Text style={styles.detailValue}>
                {formatDateTime(delivery.createdAt)}
              </Text>
            </View>
          </View>

          {delivery.status === 'retirada' && delivery.retrievedAt && (
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Ionicons name="checkmark-done-outline" size={20} color="#10B981" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Retirado em</Text>
                <Text style={[styles.detailValue, { color: '#10B981' }]}>
                  {formatDateTime(delivery.retrievedAt)}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Observações */}
        {delivery.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Observações</Text>
            <View style={styles.notesContainer}>
              <Text style={styles.notesText}>{delivery.notes}</Text>
            </View>
          </View>
        )}

        {/* Botão Confirmar Retirada */}
        {(user?.role === 'porteiro' || user?.role === 'zelador' || user?.role === 'sindico') &&
          isPending && (
            <TouchableOpacity
              style={[styles.confirmButton, confirming && styles.confirmButtonDisabled]}
              onPress={handleConfirmRetrieval}
              disabled={confirming}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#10B981', '#059669']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.confirmButtonGradient}
              >
                {confirming ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle-outline" size={24} color="#FFFFFF" />
                    <Text style={styles.confirmButtonText}>Confirmar Retirada</Text>
                  </>
                )}
              </LinearGradient>
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
  photo: {
    width: '100%',
    height: 250,
    backgroundColor: '#E2E8F0',
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: -30,
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  statusIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  statusInfo: {
    flex: 1,
  },
  statusLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 2,
  },
  statusValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
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
  residentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 14,
    borderRadius: 12,
  },
  residentAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  residentInfo: {
    flex: 1,
  },
  residentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  unitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  unitText: {
    fontSize: 14,
    color: '#64748B',
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
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
  },
  notesContainer: {
    backgroundColor: '#F8FAFC',
    padding: 14,
    borderRadius: 12,
  },
  notesText: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  confirmButton: {
    marginHorizontal: 16,
    marginTop: 24,
    borderRadius: 12,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  confirmButtonDisabled: {
    opacity: 0.6,
  },
  confirmButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default DeliveryDetailScreen;
