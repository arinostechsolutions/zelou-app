import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Platform,
  Alert,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated from 'react-native-reanimated';
import { condominiumsApi } from '../../api/condominiums';
import GradientHeader from '../../components/GradientHeader';
import { getListItemAnimation } from '../../utils/animations';
import { formatDate } from '../../utils/dateFormat';

type InviteCodesRouteProp = RouteProp<{ InviteCodes: { condominiumId: string } }, 'InviteCodes'>;

interface InviteCode {
  _id: string;
  code: string;
  role: string;
  block?: string;
  unit?: string;
  maxUses: number;
  usedCount: number;
  expiresAt: string;
  isActive: boolean;
  createdBy: {
    name: string;
    email: string;
  };
  createdAt: string;
}

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

const InviteCodesScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<InviteCodesRouteProp>();
  const { condominiumId } = route.params;

  const [inviteCodes, setInviteCodes] = useState<InviteCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [creating, setCreating] = useState(false);

  // Form state
  const [role, setRole] = useState('morador');
  const [block, setBlock] = useState('');
  const [unit, setUnit] = useState('');
  const [maxUses, setMaxUses] = useState('1');

  const loadInviteCodes = useCallback(async () => {
    try {
      const data = await condominiumsApi.getInviteCodes(condominiumId);
      setInviteCodes(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar códigos:', error);
      Alert.alert('Erro', 'Não foi possível carregar os códigos de convite.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [condominiumId]);

  useEffect(() => {
    loadInviteCodes();
  }, [loadInviteCodes]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadInviteCodes();
  }, [loadInviteCodes]);

  const handleCreateCode = async () => {
    if (!maxUses || parseInt(maxUses) < 1) {
      Alert.alert('Erro', 'Número de usos deve ser maior que zero.');
      return;
    }

    setCreating(true);
    try {
      const data: any = {
        role,
        maxUses: parseInt(maxUses),
      };
      if (block) data.block = block;
      if (unit) data.unit = unit;

      await condominiumsApi.generateInviteCode(condominiumId, data);
      setModalVisible(false);
      setRole('morador');
      setBlock('');
      setUnit('');
      setMaxUses('1');
      loadInviteCodes();
      setSuccessModalVisible(true);
    } catch (error: any) {
      console.error('Erro ao criar código:', error);
      Alert.alert('Erro', error.response?.data?.message || 'Não foi possível criar o código.');
    } finally {
      setCreating(false);
    }
  };

  const handleDeactivateCode = (codeId: string) => {
    Alert.alert(
      'Desativar Código',
      'Tem certeza que deseja desativar este código de convite?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Desativar',
          style: 'destructive',
          onPress: async () => {
            try {
              await condominiumsApi.deactivateInviteCode(condominiumId, codeId);
              Alert.alert('Sucesso', 'Código desativado com sucesso!');
              loadInviteCodes();
            } catch (error: any) {
              console.error('Erro ao desativar código:', error);
              Alert.alert('Erro', 'Não foi possível desativar o código.');
            }
          },
        },
      ]
    );
  };

  const getRoleLabel = (roleKey: string) => {
    const labels: Record<string, string> = {
      sindico: 'Síndico',
      zelador: 'Zelador',
      porteiro: 'Porteiro',
      morador: 'Morador',
    };
    return labels[roleKey] || roleKey;
  };

  const getRoleColor = (roleKey: string) => {
    const colors: Record<string, string> = {
      sindico: '#6366F1',
      zelador: '#F59E0B',
      porteiro: '#10B981',
      morador: '#8B5CF6',
    };
    return colors[roleKey] || '#64748B';
  };

  const renderItem = ({ item, index }: { item: InviteCode; index: number }) => {
    const isExpired = new Date(item.expiresAt) < new Date();
    const isFullyUsed = item.usedCount >= item.maxUses;

    return (
      <AnimatedTouchableOpacity
        entering={getListItemAnimation(index, 50)}
        style={[styles.card, !item.isActive && styles.cardInactive]}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={styles.codeContainer}>
            <Text style={styles.code}>{item.code}</Text>
            {!item.isActive && <Text style={styles.inactiveLabel}>INATIVO</Text>}
            {isExpired && item.isActive && <Text style={styles.expiredLabel}>EXPIRADO</Text>}
            {isFullyUsed && item.isActive && !isExpired && <Text style={styles.usedLabel}>ESGOTADO</Text>}
          </View>
          {item.isActive && !isExpired && !isFullyUsed && (
            <TouchableOpacity
              style={styles.deactivateButton}
              onPress={() => handleDeactivateCode(item._id)}
            >
              <Ionicons name="close-circle" size={24} color="#EF4444" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <View
              style={[
                styles.roleBadge,
                { backgroundColor: `${getRoleColor(item.role)}20` },
              ]}
            >
              <Text style={[styles.roleText, { color: getRoleColor(item.role) }]}>
                {getRoleLabel(item.role)}
              </Text>
            </View>
            {item.block && (
              <Text style={styles.infoText}>Bloco: {item.block}</Text>
            )}
            {item.unit && (
              <Text style={styles.infoText}>Unidade: {item.unit}</Text>
            )}
          </View>

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Ionicons name="people-outline" size={16} color="#64748B" />
              <Text style={styles.statText}>
                {item.usedCount}/{item.maxUses} usos
              </Text>
            </View>
            <View style={styles.stat}>
              <Ionicons name="calendar-outline" size={16} color="#64748B" />
              <Text style={styles.statText}>
                Expira: {formatDate(item.expiresAt)}
              </Text>
            </View>
          </View>

          <Text style={styles.createdBy}>
            Criado por: {item.createdBy.name}
          </Text>
        </View>
      </AnimatedTouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <GradientHeader
        title="Códigos de Convite"
        subtitle={`${inviteCodes.length} códigos gerados`}
        onBackPress={() => navigation.goBack()}
      />

      <FlatList
        data={inviteCodes}
        renderItem={renderItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366F1" />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="ticket-outline" size={64} color="#CBD5E1" />
            <Text style={styles.emptyText}>Nenhum código de convite gerado</Text>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
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

      {/* Modal para criar código */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Gerar Código de Convite</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <Text style={styles.modalLabel}>Função *</Text>
              <View style={styles.rolesContainer}>
                {['morador', 'porteiro', 'zelador', 'sindico'].map((roleKey) => (
                  <TouchableOpacity
                    key={roleKey}
                    style={[
                      styles.roleChip,
                      role === roleKey && {
                        backgroundColor: getRoleColor(roleKey),
                        borderColor: getRoleColor(roleKey),
                      },
                    ]}
                    onPress={() => setRole(roleKey)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.roleChipText,
                        role === roleKey && styles.roleChipTextActive,
                      ]}
                    >
                      {getRoleLabel(roleKey)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.modalLabel}>Bloco (opcional)</Text>
              <TextInput
                style={styles.modalInput}
                value={block}
                onChangeText={setBlock}
                placeholder="Ex: A"
                placeholderTextColor="#94A3B8"
              />

              <Text style={styles.modalLabel}>Unidade (opcional)</Text>
              <TextInput
                style={styles.modalInput}
                value={unit}
                onChangeText={setUnit}
                placeholder="Ex: 101"
                placeholderTextColor="#94A3B8"
              />

              <Text style={styles.modalLabel}>Número de Usos *</Text>
              <TextInput
                style={styles.modalInput}
                value={maxUses}
                onChangeText={setMaxUses}
                placeholder="1"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
              />

              <TouchableOpacity
                style={styles.createButton}
                onPress={handleCreateCode}
                disabled={creating}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#6366F1', '#8B5CF6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.createButtonGradient}
                >
                  {creating ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.createButtonText}>Gerar Código</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal de Sucesso */}
      <Modal
        visible={successModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSuccessModalVisible(false)}
      >
        <View style={styles.successModalOverlay}>
          <View style={styles.successModalContent}>
            <Ionicons name="checkmark-circle" size={60} color="#10B981" />
            <Text style={styles.successModalTitle}>Sucesso!</Text>
            <Text style={styles.successModalMessage}>Código de convite criado com sucesso!</Text>
            <TouchableOpacity
              style={styles.successModalButton}
              onPress={() => setSuccessModalVisible(false)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#6366F1', '#8B5CF6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.successModalButtonGradient}
              >
                <Text style={styles.successModalButtonText}>OK</Text>
              </LinearGradient>
            </TouchableOpacity>
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
  },
  listContent: {
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
  cardInactive: {
    opacity: 0.6,
    borderColor: '#CBD5E1',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  code: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    letterSpacing: 2,
  },
  inactiveLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#EF4444',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  expiredLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#F59E0B',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  usedLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  deactivateButton: {
    padding: 4,
  },
  cardBody: {
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '700',
  },
  infoText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  createdBy: {
    fontSize: 11,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#94A3B8',
    marginTop: 16,
    fontWeight: '500',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    borderRadius: 28,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 12,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
  },
  modalBody: {
    padding: 20,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
    marginTop: 16,
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1E293B',
  },
  rolesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  roleChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  roleChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  roleChipTextActive: {
    color: '#FFFFFF',
  },
  createButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 24,
    marginBottom: 8,
  },
  createButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  successModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  successModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
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
  successModalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 20,
    marginBottom: 10,
  },
  successModalMessage: {
    fontSize: 16,
    color: '#475569',
    textAlign: 'center',
    marginBottom: 30,
  },
  successModalButton: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 10,
  },
  successModalButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successModalButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default InviteCodesScreen;

