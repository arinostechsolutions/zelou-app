import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Alert,
  ActivityIndicator,
  Image,
  Modal,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { maintenancesApi, Maintenance, maintenanceTypes, maintenanceStatuses } from '../../api/maintenances';

const MaintenanceDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { maintenanceId } = route.params as { maintenanceId: string };

  const [maintenance, setMaintenance] = useState<Maintenance | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const canManage = user?.role === 'sindico' || user?.role === 'zelador';

  useEffect(() => {
    loadMaintenance();
  }, [maintenanceId]);

  const loadMaintenance = async () => {
    try {
      const response = await maintenancesApi.getById(maintenanceId);
      setMaintenance(response.data);
    } catch (error) {
      console.error('Erro ao carregar manutenção:', error);
      Alert.alert('Erro', 'Não foi possível carregar a manutenção');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!maintenance) return;

    setUpdating(true);
    setShowStatusModal(false);

    try {
      const response = await maintenancesApi.updateStatus(maintenance._id, newStatus);
      setMaintenance(response.data);
      Alert.alert('Sucesso', 'Status atualizado com sucesso!');
    } catch (error: any) {
      Alert.alert('Erro', error.response?.data?.message || 'Erro ao atualizar status');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Excluir Manutenção',
      'Tem certeza que deseja excluir esta manutenção?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await maintenancesApi.delete(maintenanceId);
              Alert.alert('Sucesso', 'Manutenção excluída');
              navigation.goBack();
            } catch (error: any) {
              Alert.alert('Erro', error.response?.data?.message || 'Erro ao excluir');
            }
          },
        },
      ]
    );
  };

  const getTypeInfo = (type: string) => {
    return maintenanceTypes.find(t => t.value === type) || { label: type, icon: 'build-outline' };
  };

  const getStatusInfo = (status: string) => {
    return maintenanceStatuses.find(s => s.value === status) || { label: status, color: '#6B7280' };
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { 
      weekday: 'long',
      day: '2-digit', 
      month: 'long',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  if (!maintenance) {
    return null;
  }

  const typeInfo = getTypeInfo(maintenance.type);
  const statusInfo = getStatusInfo(maintenance.status);
  const createdByName = typeof maintenance.createdBy === 'object' 
    ? maintenance.createdBy.name 
    : 'Desconhecido';

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.headerGradientStart, colors.headerGradientMiddle, colors.headerGradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 8 }]}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Detalhes</Text>
          {canManage && (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={handleDelete}
            >
              <Ionicons name="trash-outline" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Card Principal */}
        <View style={styles.mainCard}>
          <View style={styles.mainCardHeader}>
            <View style={[styles.typeIcon, { backgroundColor: `${statusInfo.color}15` }]}>
              <Ionicons name={typeInfo.icon as any} size={32} color={statusInfo.color} />
            </View>
            <View style={styles.mainCardInfo}>
              <Text style={styles.mainCardTitle}>{maintenance.title}</Text>
              <Text style={styles.mainCardType}>{typeInfo.label}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.statusBadgeLarge, { backgroundColor: `${statusInfo.color}15` }]}
            onPress={() => canManage && setShowStatusModal(true)}
            disabled={!canManage || updating}
          >
            {updating ? (
              <ActivityIndicator size="small" color={statusInfo.color} />
            ) : (
              <>
                <View style={[styles.statusDot, { backgroundColor: statusInfo.color }]} />
                <Text style={[styles.statusTextLarge, { color: statusInfo.color }]}>
                  {statusInfo.label}
                </Text>
                {canManage && (
                  <Ionicons name="chevron-down" size={16} color={statusInfo.color} />
                )}
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Descrição */}
        {maintenance.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Descrição</Text>
            <Text style={styles.descriptionText}>{maintenance.description}</Text>
          </View>
        )}

        {/* Datas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Período</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={20} color="#6366F1" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Início</Text>
                <Text style={styles.infoValue}>{formatDate(maintenance.startDate)}</Text>
                {maintenance.startTime && (
                  <Text style={styles.infoTime}>às {maintenance.startTime}</Text>
                )}
              </View>
            </View>

            {maintenance.endDate && (
              <>
                <View style={styles.divider} />
                <View style={styles.infoRow}>
                  <Ionicons name="calendar-outline" size={20} color="#10B981" />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Término Previsto</Text>
                    <Text style={styles.infoValue}>{formatDate(maintenance.endDate)}</Text>
                    {maintenance.endTime && (
                      <Text style={styles.infoTime}>às {maintenance.endTime}</Text>
                    )}
                  </View>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Local e Responsável */}
        {(maintenance.location || maintenance.responsible) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informações</Text>
            <View style={styles.infoCard}>
              {maintenance.location && (
                <View style={styles.infoRow}>
                  <Ionicons name="location-outline" size={20} color="#6366F1" />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Local</Text>
                    <Text style={styles.infoValue}>{maintenance.location}</Text>
                  </View>
                </View>
              )}
              {maintenance.location && maintenance.responsible && <View style={styles.divider} />}
              {maintenance.responsible && (
                <View style={styles.infoRow}>
                  <Ionicons name="person-outline" size={20} color="#6366F1" />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Responsável</Text>
                    <Text style={styles.infoValue}>{maintenance.responsible}</Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Imagens */}
        {maintenance.images && maintenance.images.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Imagens</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {maintenance.images.map((uri, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => {
                    setSelectedImage(uri);
                    setShowImageModal(true);
                  }}
                >
                  <Image source={{ uri }} style={styles.thumbnail} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Observações */}
        {maintenance.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Observações</Text>
            <Text style={styles.descriptionText}>{maintenance.notes}</Text>
          </View>
        )}

        {/* Rodapé */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Registrado por {createdByName}
          </Text>
          <Text style={styles.footerText}>
            em {new Date(maintenance.createdAt).toLocaleDateString('pt-BR')}
          </Text>
        </View>
      </ScrollView>

      {/* Modal Status */}
      <Modal
        visible={showStatusModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowStatusModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowStatusModal(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Alterar Status</Text>
            {maintenanceStatuses.map((status) => (
              <TouchableOpacity
                key={status.value}
                style={[
                  styles.statusOption,
                  maintenance.status === status.value && styles.statusOptionActive,
                ]}
                onPress={() => handleUpdateStatus(status.value)}
              >
                <View style={[styles.statusDot, { backgroundColor: status.color }]} />
                <Text
                  style={[
                    styles.statusOptionText,
                    maintenance.status === status.value && { color: status.color, fontWeight: '700' },
                  ]}
                >
                  {status.label}
                </Text>
                {maintenance.status === status.value && (
                  <Ionicons name="checkmark" size={20} color={status.color} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modal Imagem */}
      <Modal
        visible={showImageModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowImageModal(false)}
      >
        <TouchableOpacity
          style={styles.imageModalOverlay}
          activeOpacity={1}
          onPress={() => setShowImageModal(false)}
        >
          <TouchableOpacity
            style={styles.closeImageButton}
            onPress={() => setShowImageModal(false)}
          >
            <Ionicons name="close" size={28} color="#FFFFFF" />
          </TouchableOpacity>
          {selectedImage && (
            <Image
              source={{ uri: selectedImage }}
              style={styles.fullImage}
              resizeMode="contain"
            />
          )}
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  deleteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  mainCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  mainCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  typeIcon: {
    width: 60,
    height: 60,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  mainCardInfo: {
    flex: 1,
  },
  mainCardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  mainCardType: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  statusBadgeLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusTextLarge: {
    fontSize: 15,
    fontWeight: '700',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  descriptionText: {
    fontSize: 15,
    color: '#475569',
    lineHeight: 22,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    color: '#1E293B',
    fontWeight: '600',
  },
  infoTime: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 12,
  },
  thumbnail: {
    width: 100,
    height: 100,
    borderRadius: 12,
    marginRight: 12,
  },
  footer: {
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  footerText: {
    fontSize: 13,
    color: '#94A3B8',
  },
  // Modal
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
    padding: 20,
    width: '100%',
    maxWidth: 320,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 16,
    textAlign: 'center',
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 4,
  },
  statusOptionActive: {
    backgroundColor: '#F1F5F9',
  },
  statusOptionText: {
    flex: 1,
    fontSize: 15,
    color: '#475569',
  },
  // Image Modal
  imageModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeImageButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1,
    padding: 8,
  },
  fullImage: {
    width: '100%',
    height: '80%',
  },
});

export default MaintenanceDetailScreen;

