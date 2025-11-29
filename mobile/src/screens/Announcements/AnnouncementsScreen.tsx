import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, Image, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { announcementsApi, Announcement } from '../../api/announcements';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { formatDate } from '../../utils/dateFormat';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

const AnnouncementsScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(false);

  const loadAnnouncements = async () => {
    setLoading(true);
    try {
      const response = await announcementsApi.getAll();
      setAnnouncements(response.data);
    } catch (error) {
      console.error('Error loading announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnnouncements();
    const unsubscribe = navigation.addListener('focus', loadAnnouncements);
    return unsubscribe;
  }, []);

  const renderItem = ({ item, index }: { item: Announcement; index: number }) => (
    <AnimatedTouchableOpacity
      entering={FadeInDown.delay(index * 50).springify().damping(15)}
      style={[styles.card, item.priority && styles.priorityCard]}
      onPress={() => navigation.navigate('AnnouncementDetail' as never, { announcementId: item._id } as never)}
      activeOpacity={0.7}
    >
      {item.priority && <View style={styles.priorityBadge}><Text style={styles.priorityText}>PRIORIDADE</Text></View>}
      {item.photo && <Image source={{ uri: item.photo }} style={styles.photo} />}
      <View style={styles.cardContent}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
        <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
      </View>
    </AnimatedTouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#6366F1', '#8B5CF6', '#A855F7']}
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
            <Text style={styles.headerTitle}>Comunicados</Text>
            <Text style={styles.headerSubtitle}>{announcements.length} comunicados</Text>
          </View>
        </View>
      </LinearGradient>

      <FlatList
        data={announcements}
        renderItem={renderItem}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl 
            refreshing={loading} 
            onRefresh={loadAnnouncements}
            tintColor="#6366F1"
            colors={['#6366F1']}
          />
        }
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="megaphone-outline" size={64} color="#CBD5E1" />
            <Text style={styles.emptyText}>Nenhum comunicado encontrado</Text>
          </View>
        }
      />

      {/* FAB - Botão de adicionar comunicado */}
      {(user?.role === 'zelador' || user?.role === 'sindico') && (
        <TouchableOpacity
          style={[styles.fab, { bottom: insets.bottom + 24 }]}
          onPress={() => navigation.navigate('CreateAnnouncement' as never)}
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
  container: { flex: 1, backgroundColor: '#F1F5F9' },
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
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  fabGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: { padding: 16, paddingBottom: 100 },
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
  priorityCard: { borderLeftWidth: 4, borderLeftColor: '#FF3B30' },
  priorityBadge: { backgroundColor: '#FF3B30', padding: 4, alignItems: 'center' },
  priorityText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  photo: { width: '100%', height: 150, backgroundColor: '#f0f0f0' },
  cardContent: { padding: 16 },
  title: { fontSize: 18, fontWeight: '600', marginBottom: 8 },
  description: { fontSize: 14, color: '#666', marginBottom: 8 },
  date: { fontSize: 12, color: '#999' },
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
});

export default AnnouncementsScreen;


