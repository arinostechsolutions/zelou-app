import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { announcementsApi, Announcement } from '../../api/announcements';
import { Ionicons } from '@expo/vector-icons';
import GradientHeader from '../../components/GradientHeader';
import { formatDate, formatDateLong } from '../../utils/dateFormat';

const AnnouncementDetailScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { announcementId } = route.params as { announcementId: string };
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnnouncement();
  }, []);

  const loadAnnouncement = async () => {
    try {
      const response = await announcementsApi.getById(announcementId);
      setAnnouncement(response.data);
    } catch (error) {
      console.error('Error loading announcement:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <GradientHeader
          title="Comunicado"
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
        </View>
      </View>
    );
  }

  if (!announcement) {
    return (
      <View style={styles.container}>
        <GradientHeader
          title="Comunicado"
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
          <Text style={styles.errorText}>Comunicado não encontrado</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <GradientHeader
        title="Comunicado"
        subtitle={formatDate(announcement.createdAt)}
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {announcement.priority && (
          <View style={styles.priorityBanner}>
            <Ionicons name="alert-circle" size={18} color="#FFFFFF" />
            <Text style={styles.priorityText}>COMUNICADO PRIORITÁRIO</Text>
          </View>
        )}

        {announcement.photo && (
          <Image source={{ uri: announcement.photo }} style={styles.photo} />
        )}

        <View style={styles.card}>
          <Text style={styles.title}>{announcement.title}</Text>
          <Text style={styles.description}>{announcement.description}</Text>
          
          <View style={styles.metaContainer}>
            <View style={styles.metaItem}>
              <Ionicons name="person-outline" size={16} color="#64748B" />
              <Text style={styles.metaText}>{announcement.createdBy?.name || 'Administração'}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={16} color="#64748B" />
              <Text style={styles.metaText}>
                {formatDateLong(announcement.createdAt)}
              </Text>
            </View>
          </View>
        </View>
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
  priorityBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#EF4444',
    paddingVertical: 10,
  },
  priorityText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  photo: {
    width: '100%',
    height: 220,
    backgroundColor: '#E2E8F0',
  },
  card: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 16,
    padding: 20,
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
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 16,
    lineHeight: 32,
  },
  description: {
    fontSize: 16,
    color: '#475569',
    lineHeight: 26,
    marginBottom: 20,
  },
  metaContainer: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaText: {
    fontSize: 14,
    color: '#64748B',
  },
});

export default AnnouncementDetailScreen;
