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
  Linking,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { documentsApi, Document } from '../../api/documents';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import GradientHeader from '../../components/GradientHeader';
import { formatDateTime } from '../../utils/dateFormat';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

const DocumentsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Tipo de documento: 'document' ou 'rule'
  const documentType = (route.params as any)?.type || 'document';
  const isRules = documentType === 'rule';
  const isSindico = user?.role === 'sindico';

  const loadDocuments = useCallback(async () => {
    try {
      const response = await documentsApi.getAll({ type: documentType });
      setDocuments(response.data);
    } catch (error) {
      console.error('Erro ao carregar documentos:', error);
      Alert.alert('Erro', 'Não foi possível carregar os documentos');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [documentType]);

  useEffect(() => {
    loadDocuments();
    const unsubscribe = navigation.addListener('focus', loadDocuments);
    return unsubscribe;
  }, [loadDocuments, navigation]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadDocuments();
  }, [loadDocuments]);

  const handleOpenDocument = async (doc: Document) => {
    try {
      const supported = await Linking.canOpenURL(doc.fileUrl);
      if (supported) {
        await Linking.openURL(doc.fileUrl);
      } else {
        Alert.alert('Erro', 'Não foi possível abrir o documento');
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível abrir o documento');
    }
  };

  const handleDeleteDocument = (doc: Document) => {
    Alert.alert(
      'Remover Documento',
      `Deseja remover "${doc.title}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            try {
              await documentsApi.delete(doc._id);
              Alert.alert('Sucesso', 'Documento removido');
              loadDocuments();
            } catch (error: any) {
              Alert.alert('Erro', error.response?.data?.message || 'Erro ao remover documento');
            }
          },
        },
      ]
    );
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDocDate = (dateString: string) => {
    return formatDateTime(dateString);
  };

  const getFileIcon = (mimeType: string): keyof typeof Ionicons.glyphMap => {
    if (mimeType.includes('pdf')) return 'document-text';
    if (mimeType.includes('word') || mimeType.includes('doc')) return 'document';
    if (mimeType.includes('excel') || mimeType.includes('sheet')) return 'grid';
    if (mimeType.includes('image')) return 'image';
    return 'document-outline';
  };

  const renderItem = ({ item, index }: { item: Document; index: number }) => (
    <AnimatedTouchableOpacity
      entering={FadeInDown.delay(index * 50).springify().damping(15)}
      style={styles.card}
      onPress={() => handleOpenDocument(item)}
      activeOpacity={0.7}
    >
      <View style={styles.cardContent}>
        <View style={styles.iconContainer}>
          <Ionicons name={getFileIcon(item.mimeType)} size={28} color="#6366F1" />
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
          <View style={styles.cardMeta}>
            <Ionicons name="calendar-outline" size={12} color="#94A3B8" />
            <Text style={styles.cardDate}>{formatDocDate(item.createdAt)}</Text>
            {item.fileSize > 0 && (
              <>
                <Text style={styles.cardDot}>•</Text>
                <Text style={styles.cardSize}>{formatFileSize(item.fileSize)}</Text>
              </>
            )}
          </View>
        </View>
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.downloadButton}
            onPress={() => handleOpenDocument(item)}
          >
            <Ionicons name="download-outline" size={22} color="#6366F1" />
          </TouchableOpacity>
          {isSindico && (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDeleteDocument(item)}
            >
              <Ionicons name="trash-outline" size={20} color="#EF4444" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </AnimatedTouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <GradientHeader
        title={isRules ? 'Regras' : 'Documentos'}
        subtitle={`${documents.length} ${isRules ? 'regra' : 'documento'}${documents.length !== 1 ? 's' : ''}`}
        onBackPress={() => navigation.goBack()}
      />

      <FlatList
        data={documents}
        renderItem={renderItem}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#6366F1"
            colors={['#6366F1']}
          />
        }
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons 
              name={isRules ? 'list-outline' : 'folder-open-outline'} 
              size={64} 
              color="#CBD5E1" 
            />
            <Text style={styles.emptyText}>
              {isRules ? 'Nenhuma regra cadastrada' : 'Nenhum documento cadastrado'}
            </Text>
            {isSindico && (
              <Text style={styles.emptySubtext}>
                Toque no botão + para adicionar
              </Text>
            )}
          </View>
        }
      />

      {/* FAB para adicionar (apenas síndico) */}
      {isSindico && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('CreateDocument' as never, { type: documentType } as never)}
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
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 6,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardDate: {
    fontSize: 12,
    color: '#94A3B8',
  },
  cardDot: {
    fontSize: 12,
    color: '#CBD5E1',
    marginHorizontal: 4,
  },
  cardSize: {
    fontSize: 12,
    color: '#94A3B8',
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  downloadButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
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
    marginTop: 8,
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

export default DocumentsScreen;

