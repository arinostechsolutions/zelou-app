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
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { visitorsApi, Visitor } from '../../api/visitors';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated from 'react-native-reanimated';
import GradientHeader from '../../components/GradientHeader';
import { getListItemAnimation } from '../../utils/animations';

const AnimatedView = Animated.createAnimatedComponent(View);

const VisitorsScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { colors } = useTheme();
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(true);

  const loadVisitors = useCallback(async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await visitorsApi.getAll({ date: today });
      setVisitors(response.data);
    } catch (error) {
      console.error('Error loading visitors:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVisitors();
    const unsubscribe = navigation.addListener('focus', loadVisitors);
    return unsubscribe;
  }, [loadVisitors, navigation]);

  const handleEntry = async (id: string, visitorName: string) => {
    Alert.alert(
      'Liberar Entrada',
      `Confirma a entrada de ${visitorName}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            try {
              await visitorsApi.confirmEntry(id);
              loadVisitors();
            } catch (error: any) {
              Alert.alert('Erro', error.response?.data?.message || 'Erro ao liberar entrada');
            }
          },
        },
      ]
    );
  };

  const handleExit = async (id: string, visitorName: string) => {
    Alert.alert(
      'Registrar Saída',
      `Confirma a saída de ${visitorName}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            try {
              await visitorsApi.confirmExit(id);
              loadVisitors();
            } catch (error: any) {
              Alert.alert('Erro', error.response?.data?.message || 'Erro ao registrar saída');
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendente':
        return '#F59E0B';
      case 'liberado':
        return '#10B981';
      case 'saida':
        return '#6B7280';
      default:
        return '#6B7280';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pendente':
        return 'Aguardando';
      case 'liberado':
        return 'No local';
      case 'saida':
        return 'Saiu';
      default:
        return status;
    }
  };

  const getStatusIcon = (status: string): keyof typeof Ionicons.glyphMap => {
    switch (status) {
      case 'pendente':
        return 'time-outline';
      case 'liberado':
        return 'checkmark-circle-outline';
      case 'saida':
        return 'exit-outline';
      default:
        return 'help-circle-outline';
    }
  };

  const renderItem = ({ item, index }: { item: Visitor; index: number }) => (
    <AnimatedView
      entering={getListItemAnimation(index, 50)}
      style={styles.card}
    >
      <View style={styles.cardHeader}>
        <View style={styles.avatarContainer}>
          <Ionicons name="person" size={24} color="#6366F1" />
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.name}>{item.name}</Text>
          <View style={styles.unitRow}>
            <Ionicons name="home-outline" size={14} color="#64748B" />
            <Text style={styles.unit}>{item.unit.block ? `${item.unit.block} - ` : ''}{item.unit.number}</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(item.status)}15` }]}>
          <Ionicons name={getStatusIcon(item.status)} size={14} color={getStatusColor(item.status)} />
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {getStatusLabel(item.status)}
          </Text>
        </View>
      </View>

      <View style={styles.reasonContainer}>
        <Ionicons name="chatbubble-outline" size={14} color="#64748B" />
        <Text style={styles.reason}>{item.reason}</Text>
      </View>

      {/* Ações do Porteiro */}
      {user?.role === 'porteiro' && (
        <View style={styles.actions}>
          {item.status === 'pendente' && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleEntry(item._id, item.name)}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={['#10B981', '#059669']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.actionButtonGradient}
              >
                <Ionicons name="enter-outline" size={18} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>Liberar Entrada</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
          {item.status === 'liberado' && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleExit(item._id, item.name)}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={['#F59E0B', '#D97706']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.actionButtonGradient}
              >
                <Ionicons name="exit-outline" size={18} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>Registrar Saída</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      )}
    </AnimatedView>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <GradientHeader
        title="Visitantes"
        subtitle={`${visitors.length} visitante${visitors.length !== 1 ? 's' : ''} hoje`}
        onBackPress={() => navigation.goBack()}
      />

      {loading && visitors.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={visitors}
          renderItem={renderItem}
          keyExtractor={(item) => item._id}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={loadVisitors}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="people-outline" size={64} color={colors.textTertiary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Nenhum visitante hoje</Text>
              <Text style={[styles.emptySubtext, { color: colors.textTertiary }]}>
                Os visitantes agendados aparecerão aqui
              </Text>
            </View>
          }
        />
      )}

      {/* FAB para criar */}
      {user?.role === 'morador' && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('CreateVisitor' as never)}
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9',
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
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2,
  },
  unitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  unit: {
    fontSize: 13,
    color: '#64748B',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  reasonContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 10,
  },
  reason: {
    flex: 1,
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  actions: {
    marginTop: 12,
  },
  actionButton: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
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
    fontSize: 18,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 4,
    textAlign: 'center',
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
});

export default VisitorsScreen;
