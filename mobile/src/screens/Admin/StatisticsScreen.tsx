import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Platform,
  RefreshControl,
  TouchableOpacity,
  Modal,
  FlatList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../contexts/ThemeContext';
import GradientHeader from '../../components/GradientHeader';
import { statisticsApi, StatisticsResponse } from '../../api/statistics';
import { condominiumsApi, Condominium } from '../../api/condominiums';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const StatisticsScreen = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statistics, setStatistics] = useState<StatisticsResponse | null>(null);
  const [condominiums, setCondominiums] = useState<Condominium[]>([]);
  const [selectedCondominiumId, setSelectedCondominiumId] = useState<string | undefined>(undefined);
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  const loadCondominiums = async () => {
    try {
      const data = await condominiumsApi.getAll();
      setCondominiums(data);
    } catch (error) {
      console.error('Erro ao carregar condomínios:', error);
    }
  };

  const loadStatistics = async () => {
    try {
      const data = await statisticsApi.getAll(selectedCondominiumId);
      setStatistics(data);
    } catch (error: any) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const initialize = async () => {
      await loadCondominiums();
      await loadStatistics();
    };
    initialize();
  }, []);

  useEffect(() => {
    if (!loading) {
      loadStatistics();
    }
  }, [selectedCondominiumId]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadStatistics();
  };

  const StatCard = ({ icon, label, value, color }: { icon: string; label: string; value: number; color: string }) => (
    <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
      <View style={[styles.statIconContainer, { backgroundColor: `${color}15` }]}>
        <Ionicons name={icon as any} size={24} color={color} />
      </View>
      <Text style={[styles.statValue, { color: colors.text }]}>{value.toLocaleString('pt-BR')}</Text>
      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  );

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      morador: 'Moradores',
      porteiro: 'Porteiros',
      zelador: 'Zeladores',
      sindico: 'Síndicos',
      master: 'Master Admin',
    };
    return labels[role] || role;
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pendente: 'Pendentes',
      aprovada: 'Aprovadas',
      rejeitada: 'Rejeitadas',
      concluida: 'Concluídas',
      em_andamento: 'Em Andamento',
      aberta: 'Abertas',
      retirada: 'Retiradas',
      agendada: 'Agendadas',
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <GradientHeader
          title="Estatísticas"
          subtitle="Desempenho do app"
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  if (!statistics) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <GradientHeader
          title="Estatísticas"
          subtitle="Desempenho do app"
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={colors.textTertiary} />
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>
            Erro ao carregar estatísticas
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <GradientHeader
        title="Estatísticas"
        subtitle={selectedCondominiumId ? condominiums.find(c => c._id === selectedCondominiumId)?.name || "Desempenho do app" : "Desempenho do app"}
        onBackPress={() => navigation.goBack()}
        rightComponent={
          <TouchableOpacity
            style={styles.filterHeaderButton}
            onPress={() => setFilterModalVisible(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="filter" size={24} color="#FFFFFF" />
            {selectedCondominiumId && (
              <View style={styles.filterBadge} />
            )}
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Visão Geral */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Visão Geral</Text>
          <View style={styles.statsGrid}>
            <StatCard icon="people" label="Usuários" value={statistics.overview.totalUsers} color="#6366F1" />
            <StatCard icon="business" label="Condomínios" value={statistics.overview.totalCondominiums} color="#10B981" />
            <StatCard icon="cube" label="Entregas" value={statistics.overview.totalDeliveries} color="#F59E0B" />
            <StatCard icon="warning" label="Irregularidades" value={statistics.overview.totalReports} color="#EF4444" />
            <StatCard icon="calendar" label="Reservas" value={statistics.overview.totalReservations} color="#8B5CF6" />
            <StatCard icon="megaphone" label="Comunicados" value={statistics.overview.totalAnnouncements} color="#06B6D4" />
            <StatCard icon="people-outline" label="Visitantes" value={statistics.overview.totalVisitors} color="#3B82F6" />
            <StatCard icon="construct" label="Manutenções" value={statistics.overview.totalMaintenances} color="#F97316" />
          </View>
        </View>

        {/* Atividade Recente (7 dias) */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Atividade Recente (7 dias)</Text>
          <View style={styles.activityGrid}>
            <View style={styles.activityItem}>
              <View style={[styles.activityIcon, { backgroundColor: '#F59E0B15' }]}>
                <Ionicons name="cube" size={20} color="#F59E0B" />
              </View>
              <View style={styles.activityContent}>
                <Text style={[styles.activityValue, { color: colors.text }]}>
                  {statistics.recentActivity.deliveries}
                </Text>
                <Text style={[styles.activityLabel, { color: colors.textSecondary }]}>Entregas</Text>
              </View>
            </View>
            <View style={styles.activityItem}>
              <View style={[styles.activityIcon, { backgroundColor: '#EF444415' }]}>
                <Ionicons name="warning" size={20} color="#EF4444" />
              </View>
              <View style={styles.activityContent}>
                <Text style={[styles.activityValue, { color: colors.text }]}>
                  {statistics.recentActivity.reports}
                </Text>
                <Text style={[styles.activityLabel, { color: colors.textSecondary }]}>Irregularidades</Text>
              </View>
            </View>
            <View style={styles.activityItem}>
              <View style={[styles.activityIcon, { backgroundColor: '#8B5CF615' }]}>
                <Ionicons name="calendar" size={20} color="#8B5CF6" />
              </View>
              <View style={styles.activityContent}>
                <Text style={[styles.activityValue, { color: colors.text }]}>
                  {statistics.recentActivity.reservations}
                </Text>
                <Text style={[styles.activityLabel, { color: colors.textSecondary }]}>Reservas</Text>
              </View>
            </View>
            <View style={styles.activityItem}>
              <View style={[styles.activityIcon, { backgroundColor: '#6366F115' }]}>
                <Ionicons name="person-add" size={20} color="#6366F1" />
              </View>
              <View style={styles.activityContent}>
                <Text style={[styles.activityValue, { color: colors.text }]}>
                  {statistics.recentActivity.users}
                </Text>
                <Text style={[styles.activityLabel, { color: colors.textSecondary }]}>Novos Usuários</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Usuários por Condomínio */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Usuários por Condomínio</Text>
          {statistics.usersByCondominium.map((item, index) => (
            <View key={index} style={styles.condominiumCard}>
              <View style={styles.condominiumHeader}>
                <Ionicons name="business" size={20} color={colors.primary} />
                <Text style={[styles.condominiumName, { color: colors.text }]}>{item.condominiumName}</Text>
                <Text style={[styles.condominiumCount, { color: colors.primary }]}>
                  {item.totalUsers} usuários
                </Text>
              </View>
              <View style={styles.rolesContainer}>
                {Object.entries(item.roles).map(([role, count]) => {
                  if (count === 0) return null;
                  return (
                    <View key={role} style={styles.roleTag}>
                      <Text style={[styles.roleTagText, { color: colors.textSecondary }]}>
                        {getRoleLabel(role)}: {count}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          ))}
        </View>

        {/* Usuários por Função */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Usuários por Função</Text>
          {statistics.usersByRole.map((item, index) => (
            <View key={index} style={styles.roleRow}>
              <Text style={[styles.roleName, { color: colors.text }]}>{getRoleLabel(item.role)}</Text>
              <View style={styles.roleBarContainer}>
                <View
                  style={[
                    styles.roleBar,
                    {
                      width: `${(item.count / statistics.overview.totalUsers) * 100}%`,
                      backgroundColor: colors.primary,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.roleCount, { color: colors.textSecondary }]}>{item.count}</Text>
            </View>
          ))}
        </View>

        {/* Status de Entregas */}
        {Object.keys(statistics.deliveriesByStatus).length > 0 && (
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Status de Entregas</Text>
            {Object.entries(statistics.deliveriesByStatus).map(([status, count]) => (
              <View key={status} style={styles.statusRow}>
                <Text style={[styles.statusLabel, { color: colors.text }]}>
                  {getStatusLabel(status)}
                </Text>
                <Text style={[styles.statusCount, { color: colors.textSecondary }]}>{count}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Status de Reservas */}
        {Object.keys(statistics.reservationsByStatus).length > 0 && (
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Status de Reservas</Text>
            {Object.entries(statistics.reservationsByStatus).map(([status, count]) => (
              <View key={status} style={styles.statusRow}>
                <Text style={[styles.statusLabel, { color: colors.text }]}>
                  {getStatusLabel(status)}
                </Text>
                <Text style={[styles.statusCount, { color: colors.textSecondary }]}>{count}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Status de Irregularidades */}
        {Object.keys(statistics.reportsByStatus).length > 0 && (
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Status de Irregularidades</Text>
            {Object.entries(statistics.reportsByStatus).map(([status, count]) => (
              <View key={status} style={styles.statusRow}>
                <Text style={[styles.statusLabel, { color: colors.text }]}>
                  {getStatusLabel(status)}
                </Text>
                <Text style={[styles.statusCount, { color: colors.textSecondary }]}>{count}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Status de Manutenções */}
        {Object.keys(statistics.maintenancesByStatus).length > 0 && (
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Status de Manutenções</Text>
            {Object.entries(statistics.maintenancesByStatus).map(([status, count]) => (
              <View key={status} style={styles.statusRow}>
                <Text style={[styles.statusLabel, { color: colors.text }]}>
                  {getStatusLabel(status)}
                </Text>
                <Text style={[styles.statusCount, { color: colors.textSecondary }]}>{count}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Modal de Filtro */}
      <Modal
        visible={filterModalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          {/* Header do Modal */}
          <View style={[styles.modalHeader, { paddingTop: insets.top + 16 }]}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setFilterModalVisible(false)}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={28} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Filtrar por Condomínio</Text>
            <View style={styles.modalCloseButton} />
          </View>

          <View style={styles.modalContent}>
            {/* Opção Todos */}
            <TouchableOpacity
              style={[
                styles.modalFilterItem,
                { 
                  backgroundColor: colors.card, 
                  borderColor: !selectedCondominiumId ? colors.primary : colors.cardBorder 
                },
                !selectedCondominiumId && styles.modalFilterItemSelected
              ]}
              onPress={() => {
                setSelectedCondominiumId(undefined);
                setFilterModalVisible(false);
              }}
              activeOpacity={0.7}
            >
              <View style={styles.modalFilterItemContent}>
                <Ionicons 
                  name="business-outline" 
                  size={24} 
                  color={!selectedCondominiumId ? colors.primary : colors.textSecondary} 
                />
                <Text style={[
                  styles.modalFilterItemText,
                  { color: !selectedCondominiumId ? colors.text : colors.textSecondary }
                ]}>
                  Todos os Condomínios
                </Text>
              </View>
              {!selectedCondominiumId && (
                <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
              )}
            </TouchableOpacity>

            {/* Lista de Condomínios */}
            <FlatList
              data={condominiums}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalFilterItem,
                    { 
                      backgroundColor: colors.card, 
                      borderColor: selectedCondominiumId === item._id ? colors.primary : colors.cardBorder 
                    },
                    selectedCondominiumId === item._id && styles.modalFilterItemSelected
                  ]}
                  onPress={() => {
                    setSelectedCondominiumId(item._id);
                    setFilterModalVisible(false);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.modalFilterItemContent}>
                    <Ionicons 
                      name="business" 
                      size={24} 
                      color={selectedCondominiumId === item._id ? colors.primary : colors.textSecondary} 
                    />
                    <Text style={[
                      styles.modalFilterItemText,
                      { color: selectedCondominiumId === item._id ? colors.text : colors.textSecondary }
                    ]}>
                      {item.name}
                    </Text>
                  </View>
                  {selectedCondominiumId === item._id && (
                    <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                  )}
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.modalFilterList}
              ListEmptyComponent={
                <View style={styles.modalEmptyContainer}>
                  <Ionicons name="business-outline" size={64} color={colors.textTertiary} />
                  <Text style={[styles.modalEmptyText, { color: colors.textSecondary }]}>
                    Nenhum condomínio encontrado
                  </Text>
                </View>
              }
            />
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
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
        elevation: 4,
      },
    }),
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    color: '#1E293B',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
    color: '#1E293B',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    color: '#64748B',
  },
  activityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '47%',
    gap: 12,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityContent: {
    flex: 1,
  },
  activityValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
  },
  activityLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  condominiumCard: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  condominiumHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  condominiumName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  condominiumCount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6366F1',
  },
  rolesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  roleTag: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  roleTagText: {
    fontSize: 12,
    color: '#64748B',
  },
  roleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  roleName: {
    width: 120,
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  roleBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  roleBar: {
    height: '100%',
    borderRadius: 4,
  },
  roleCount: {
    width: 50,
    textAlign: 'right',
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1E293B',
  },
  statusCount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
  filterHeaderButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#EF4444',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalFilterList: {
    paddingBottom: 20,
  },
  modalFilterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
  },
  modalFilterItemSelected: {
    borderWidth: 2,
  },
  modalFilterItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  modalFilterItemText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
    flex: 1,
  },
  modalEmptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  modalEmptyText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
});

export default StatisticsScreen;

