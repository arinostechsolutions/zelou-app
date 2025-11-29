import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, Image, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { announcementsApi, Announcement } from '../../api/announcements';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated from 'react-native-reanimated';
import { formatDate } from '../../utils/dateFormat';
import { getListItemAnimation } from '../../utils/animations';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

const AnnouncementsScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { colors } = useTheme();
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
      entering={getListItemAnimation(index)}
      style={[
        styles.card, 
        { backgroundColor: colors.card, borderColor: colors.cardBorder },
        item.priority && { borderColor: colors.error }
      ]}
      onPress={() => navigation.navigate('AnnouncementDetail' as never, { announcementId: item._id } as never)}
      activeOpacity={0.7}
    >
      {item.photo ? (
        <Image source={{ uri: item.photo }} style={styles.photo} />
      ) : (
        <View style={[
          styles.iconContainer, 
          { backgroundColor: item.priority ? colors.errorBackground : colors.primaryBackground }
        ]}>
          <Ionicons 
            name={item.priority ? "alert-circle" : "megaphone"} 
            size={24} 
            color={item.priority ? colors.error : colors.primary} 
          />
        </View>
      )}
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>{item.title}</Text>
          {item.priority && (
            <View style={[styles.priorityBadge, { backgroundColor: colors.errorBackground }]}>
              <Text style={[styles.priorityText, { color: colors.error }]}>URGENTE</Text>
            </View>
          )}
        </View>
        <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={2}>{item.description}</Text>
        <View style={styles.cardFooter}>
          <View style={styles.authorRow}>
            <Ionicons name="person-outline" size={12} color={colors.textTertiary} />
            <Text style={[styles.author, { color: colors.textTertiary }]}>{item.createdBy?.name || 'Administração'}</Text>
          </View>
          <Text style={[styles.date, { color: colors.textTertiary }]}>{formatDate(item.createdAt)}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} style={styles.chevron} />
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
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="megaphone-outline" size={64} color={colors.textTertiary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Nenhum comunicado encontrado</Text>
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
    borderRadius: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  priorityCard: { 
    borderLeftWidth: 3, 
    borderLeftColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainerPriority: {
    backgroundColor: '#FEE2E2',
  },
  photo: { 
    width: 48, 
    height: 48, 
    borderRadius: 10,
    backgroundColor: '#F1F5F9' 
  },
  cardContent: { 
    flex: 1, 
    marginLeft: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  title: { 
    fontSize: 15, 
    fontWeight: '600', 
    color: '#1E293B',
    flex: 1,
    marginRight: 8,
  },
  priorityBadge: { 
    backgroundColor: '#EF4444', 
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priorityText: { 
    color: '#FFFFFF', 
    fontSize: 9, 
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  description: { 
    fontSize: 13, 
    color: '#64748B', 
    lineHeight: 18,
    marginBottom: 6,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  author: {
    fontSize: 12,
    color: '#94A3B8',
  },
  date: { 
    fontSize: 12, 
    color: '#94A3B8',
  },
  chevron: {
    marginLeft: 8,
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
});

export default AnnouncementsScreen;


