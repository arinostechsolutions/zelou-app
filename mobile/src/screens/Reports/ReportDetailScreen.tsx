import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  StyleSheet,
  TouchableOpacity,
  Alert,
  FlatList,
  TextInput,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { reportsApi, Report } from '../../api/reports';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import GradientHeader from '../../components/GradientHeader';
import { formatDateTime } from '../../utils/dateFormat';

const ReportDetailScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { user } = useAuth();
  const { reportId } = route.params as { reportId: string };
  const [report, setReport] = useState<Report | null>(null);
  const [newStatus, setNewStatus] = useState<string>('');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadReport();
  }, []);

  const loadReport = async () => {
    try {
      const response = await reportsApi.getById(reportId);
      setReport(response.data);
      setNewStatus(response.data.status);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar os detalhes');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!report) return;

    setUpdating(true);
    try {
      await reportsApi.updateStatus(report._id, newStatus, comment || undefined);
      Alert.alert('Sucesso', 'Status atualizado');
      loadReport();
      setComment('');
    } catch (error: any) {
      Alert.alert('Erro', error.response?.data?.message || 'Erro ao atualizar status');
    } finally {
      setUpdating(false);
    }
  };

  const handleAddComment = async () => {
    if (!report || !comment.trim()) return;

    setUpdating(true);
    try {
      await reportsApi.addComment(report._id, comment);
      Alert.alert('Sucesso', 'Comentário adicionado');
      loadReport();
      setComment('');
    } catch (error: any) {
      Alert.alert('Erro', error.response?.data?.message || 'Erro ao adicionar comentário');
    } finally {
      setUpdating(false);
    }
  };

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

  if (loading) {
    return (
      <View style={styles.container}>
        <GradientHeader
          title="Detalhes"
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
        </View>
      </View>
    );
  }

  if (!report) {
    return (
      <View style={styles.container}>
        <GradientHeader
          title="Detalhes"
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
          <Text style={styles.errorText}>Ocorrência não encontrada</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <GradientHeader
        title={report.category}
        subtitle={report.location}
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Fotos */}
        {report.photos && report.photos.length > 0 && (
          <View style={styles.photosSection}>
            <FlatList
              horizontal
              data={report.photos}
              renderItem={({ item }) => (
                <Image source={{ uri: item }} style={styles.photo} />
              )}
              keyExtractor={(item, index) => index.toString()}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.photosList}
            />
          </View>
        )}

        {/* Status Card */}
        <View style={[styles.statusCard, { borderColor: getStatusColor(report.status) }]}>
          <View style={[styles.statusIconContainer, { backgroundColor: `${getStatusColor(report.status)}20` }]}>
            <Ionicons 
              name={report.status === 'concluida' ? 'checkmark-circle' : 'time'} 
              size={24} 
              color={getStatusColor(report.status)} 
            />
          </View>
          <View style={styles.statusInfo}>
            <Text style={styles.statusLabel}>Status atual</Text>
            <Text style={[styles.statusValue, { color: getStatusColor(report.status) }]}>
              {getStatusLabel(report.status)}
            </Text>
          </View>
        </View>

        {/* Descrição */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Descrição</Text>
          <Text style={styles.description}>{report.description}</Text>
        </View>

        {/* Atualizar Status (zelador/sindico) */}
        {(user?.role === 'zelador' || user?.role === 'sindico') && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Atualizar Status</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={newStatus}
                onValueChange={setNewStatus}
                style={styles.picker}
              >
                <Picker.Item label="Aberta" value="aberta" />
                <Picker.Item label="Em Andamento" value="andamento" />
                <Picker.Item label="Concluída" value="concluida" />
              </Picker>
            </View>
            <TextInput
              style={styles.commentInput}
              placeholder="Comentário (opcional)"
              placeholderTextColor="#94A3B8"
              value={comment}
              onChangeText={setComment}
              multiline
            />
            <TouchableOpacity
              style={[styles.updateButton, updating && styles.buttonDisabled]}
              onPress={handleUpdateStatus}
              disabled={updating}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#6366F1', '#8B5CF6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.updateButtonGradient}
              >
                {updating ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="refresh-outline" size={20} color="#FFFFFF" />
                    <Text style={styles.updateButtonText}>Atualizar Status</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* Histórico */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Histórico</Text>
          {report.history && report.history.length > 0 ? (
            report.history.map((entry, index) => (
              <View key={index} style={styles.historyItem}>
                <View style={styles.historyHeader}>
                  <View style={[styles.historyDot, { backgroundColor: getStatusColor(entry.status) }]} />
                  <Text style={[styles.historyStatus, { color: getStatusColor(entry.status) }]}>
                    {getStatusLabel(entry.status)}
                  </Text>
                </View>
                <View style={styles.historyContent}>
                  <Text style={styles.historyUser}>
                    {entry.changedBy?.name} ({entry.changedBy?.role})
                  </Text>
                  {entry.comment && (
                    <Text style={styles.historyComment}>{entry.comment}</Text>
                  )}
                  <Text style={styles.historyDate}>
                    {formatDateTime(entry.date)}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.emptyHistory}>Nenhum histórico disponível</Text>
          )}
        </View>

        {/* Adicionar Comentário */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Adicionar Comentário</Text>
          <TextInput
            style={[styles.commentInput, styles.textArea]}
            placeholder="Digite seu comentário..."
            placeholderTextColor="#94A3B8"
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={3}
          />
          <TouchableOpacity
            style={[styles.commentButton, (updating || !comment.trim()) && styles.buttonDisabled]}
            onPress={handleAddComment}
            disabled={updating || !comment.trim()}
            activeOpacity={0.8}
          >
            <Ionicons name="chatbubble-outline" size={20} color="#FFFFFF" />
            <Text style={styles.commentButtonText}>Adicionar Comentário</Text>
          </TouchableOpacity>
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
  photosSection: {
    marginBottom: 16,
  },
  photosList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  photo: {
    width: 280,
    height: 180,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
    marginRight: 12,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
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
  statusIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  statusInfo: {
    flex: 1,
  },
  statusLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 2,
  },
  statusValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
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
        elevation: 2,
      },
    }),
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: '#475569',
    lineHeight: 22,
  },
  pickerContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    marginBottom: 12,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  commentInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    padding: 14,
    fontSize: 15,
    color: '#1E293B',
    marginBottom: 12,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  updateButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  updateButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  updateButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  historyItem: {
    marginBottom: 16,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  historyStatus: {
    fontSize: 14,
    fontWeight: '600',
  },
  historyContent: {
    marginLeft: 16,
    paddingLeft: 16,
    borderLeftWidth: 2,
    borderLeftColor: '#E2E8F0',
  },
  historyUser: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 4,
  },
  historyComment: {
    fontSize: 14,
    color: '#1E293B',
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 8,
    marginBottom: 4,
  },
  historyDate: {
    fontSize: 12,
    color: '#94A3B8',
  },
  emptyHistory: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    padding: 20,
  },
  commentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  commentButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});

export default ReportDetailScreen;
