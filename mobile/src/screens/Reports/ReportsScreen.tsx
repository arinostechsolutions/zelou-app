import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Image,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { reportsApi, Report } from '../../api/reports';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import GradientHeader from '../../components/GradientHeader';
import { formatDate } from '../../utils/dateFormat';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

const ReportsScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'aberta' | 'andamento' | 'concluida'>('all');

  const loadReports = useCallback(async () => {
    setLoading(true);
    try {
      const params = filter !== 'all' ? { status: filter } : {};
      const response = await reportsApi.getAll(params);
      setReports(response.data);
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadReports();
    const unsubscribe = navigation.addListener('focus', loadReports);
    return unsubscribe;
  }, [filter, loadReports, navigation]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'aberta':
        return '#F59E0B';
      case 'andamento':
        return '#3B82F6';
      case 'concluida':
        return '#10B981';
      default:
        return '#6B7280';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'aberta':
        return 'Aberta';
      case 'andamento':
        return 'Em Andamento';
      case 'concluida':
        return 'Concluída';
      default:
        return status;
    }
  };

  const filters = [
    { key: 'all', label: 'Todas' },
    { key: 'aberta', label: 'Abertas' },
    { key: 'andamento', label: 'Andamento' },
    { key: 'concluida', label: 'Concluídas' },
  ];

  const renderItem = ({ item, index }: { item: Report; index: number }) => (
    <AnimatedTouchableOpacity
      entering={FadeInDown.delay(index * 50).springify().damping(15)}
      style={styles.card}
      onPress={() => navigation.navigate('ReportDetail' as never, { reportId: item._id } as never)}
      activeOpacity={0.7}
    >
      {item.photos && item.photos.length > 0 && (
        <Image source={{ uri: item.photos[0] }} style={styles.photo} />
      )}
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <View style={styles.categoryBadge}>
            <Ionicons name="warning-outline" size={14} color="#F59E0B" />
            <Text style={styles.categoryText}>{item.category}</Text>
          </View>
          <Text style={styles.date}>
            {formatDate(item.createdAt)}
          </Text>
        </View>
        
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={16} color="#64748B" />
          <Text style={styles.location}>{item.location}</Text>
        </View>
        
        <Text style={styles.description} numberOfLines={2}>
          {item.description}
        </Text>
        
        <View style={styles.footer}>
          <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(item.status)}15` }]}>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {getStatusLabel(item.status)}
            </Text>
          </View>
        </View>
      </View>
    </AnimatedTouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <GradientHeader
        title="Irregularidades"
        subtitle={`${reports.length} ocorrências`}
        onBackPress={() => navigation.goBack()}
      />

      {/* Filtros */}
      <View style={styles.filtersContainer}>
        {filters.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[
              styles.filterButton,
              filter === f.key && styles.filterButtonActive
            ]}
            onPress={() => setFilter(f.key as any)}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.filterText,
              filter === f.key && styles.filterTextActive
            ]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={reports}
        renderItem={renderItem}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl 
            refreshing={loading} 
            onRefresh={loadReports}
            tintColor="#6366F1"
            colors={['#6366F1']}
          />
        }
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="checkmark-circle-outline" size={64} color="#CBD5E1" />
            <Text style={styles.emptyText}>Nenhuma irregularidade</Text>
            <Text style={styles.emptySubtext}>
              {filter !== 'all' ? 'Tente mudar o filtro' : 'Tudo em ordem por aqui!'}
            </Text>
          </View>
        }
      />

      {/* FAB para criar */}
      {user?.role === 'morador' && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('CreateReport' as never)}
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
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterButtonActive: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  list: {
    padding: 16,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
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
  photo: {
    width: '100%',
    height: 160,
    backgroundColor: '#F1F5F9',
  },
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F59E0B',
  },
  date: {
    fontSize: 12,
    color: '#94A3B8',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  location: {
    fontSize: 14,
    color: '#64748B',
  },
  description: {
    fontSize: 14,
    color: '#1E293B',
    lineHeight: 20,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
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

export default ReportsScreen;
