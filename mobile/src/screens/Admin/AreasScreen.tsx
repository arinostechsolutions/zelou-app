import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated from 'react-native-reanimated';
import { reservationsApi, Area } from '../../api/reservations';
import GradientHeader from '../../components/GradientHeader';
import { getListItemAnimation } from '../../utils/animations';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

const AreasScreen = () => {
  const navigation = useNavigation();
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadAreas = useCallback(async () => {
    try {
      const response = await reservationsApi.getAreas();
      setAreas(response.data);
    } catch (error) {
      console.error('Erro ao carregar áreas:', error);
      Alert.alert('Erro', 'Não foi possível carregar as áreas');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAreas();
    const unsubscribe = navigation.addListener('focus', loadAreas);
    return unsubscribe;
  }, [loadAreas, navigation]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadAreas();
  }, [loadAreas]);

  const handleDeleteArea = (area: Area) => {
    Alert.alert(
      'Desativar Área',
      `Deseja desativar a área "${area.name}"? Ela não aparecerá mais para reservas.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Desativar',
          style: 'destructive',
          onPress: async () => {
            try {
              await reservationsApi.deleteArea(area._id);
              Alert.alert('Sucesso', 'Área desativada com sucesso');
              loadAreas();
            } catch (error: any) {
              Alert.alert('Erro', error.response?.data?.message || 'Erro ao desativar área');
            }
          },
        },
      ]
    );
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const renderArea = ({ item, index }: { item: Area; index: number }) => (
    <AnimatedTouchableOpacity
      entering={getListItemAnimation(index, 50)}
      style={styles.card}
      onPress={() => navigation.navigate('EditArea' as never, { areaId: item._id } as never)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={styles.iconContainer}>
          <Ionicons name="business-outline" size={24} color="#6366F1" />
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.areaName}>{item.name}</Text>
          {item.description && (
            <Text style={styles.areaDescription} numberOfLines={1}>
              {item.description}
            </Text>
          )}
        </View>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteArea(item)}
        >
          <Ionicons name="trash-outline" size={20} color="#EF4444" />
        </TouchableOpacity>
      </View>

      <View style={styles.cardDetails}>
        <View style={styles.detailItem}>
          <Ionicons name="people-outline" size={16} color="#64748B" />
          <Text style={styles.detailText}>
            {item.rules.capacity ? `${item.rules.capacity} pessoas` : 'Sem limite'}
          </Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="cash-outline" size={16} color="#64748B" />
          <Text style={styles.detailText}>
            {item.rules.fee > 0 ? formatCurrency(item.rules.fee) : 'Gratuito'}
          </Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="calendar-outline" size={16} color="#64748B" />
          <Text style={styles.detailText}>
            {item.rules.maxReservationsPerDay} reserva(s)/dia
          </Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.slotsContainer}>
          {item.availableSlots.slice(0, 3).map((slot, i) => (
            <View key={i} style={styles.slotBadge}>
              <Text style={styles.slotText}>{slot}</Text>
            </View>
          ))}
          {item.availableSlots.length > 3 && (
            <View style={styles.slotBadge}>
              <Text style={styles.slotText}>+{item.availableSlots.length - 3}</Text>
            </View>
          )}
        </View>
        {item.rules.requiresApproval && (
          <View style={styles.approvalBadge}>
            <Ionicons name="shield-checkmark-outline" size={14} color="#F59E0B" />
            <Text style={styles.approvalText}>Aprovação</Text>
          </View>
        )}
      </View>
    </AnimatedTouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <GradientHeader
          title="Áreas Comuns"
          subtitle="Gerenciar espaços do condomínio"
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <GradientHeader
        title="Áreas Comuns"
        subtitle={`${areas.length} áreas cadastradas`}
        onBackPress={() => navigation.goBack()}
      />

      <FlatList
        data={areas}
        renderItem={renderArea}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#6366F1"
            colors={['#6366F1']}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="business-outline" size={64} color="#CBD5E1" />
            <Text style={styles.emptyText}>Nenhuma área cadastrada</Text>
            <Text style={styles.emptySubtext}>
              Adicione áreas comuns para os moradores reservarem
            </Text>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CreateArea' as never)}
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardInfo: {
    flex: 1,
  },
  areaName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  areaDescription: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  deleteButton: {
    padding: 8,
  },
  cardDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 13,
    color: '#64748B',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  slotsContainer: {
    flexDirection: 'row',
    gap: 6,
    flex: 1,
    flexWrap: 'wrap',
  },
  slotBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
  },
  slotText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  approvalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#FEF3C7',
    borderRadius: 6,
  },
  approvalText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#F59E0B',
  },
  emptyContainer: {
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
    marginTop: 8,
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

export default AreasScreen;


