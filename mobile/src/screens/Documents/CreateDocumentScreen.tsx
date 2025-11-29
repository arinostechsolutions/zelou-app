import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import { documentsApi } from '../../api/documents';
import { uploadFile } from '../../api/upload';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import GradientHeader from '../../components/GradientHeader';

const CreateDocumentScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const documentType = (route.params as any)?.type || 'document';
  const isRules = documentType === 'rule';

  const [title, setTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState<{
    uri: string;
    name: string;
    mimeType: string;
    size: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setSelectedFile({
          uri: file.uri,
          name: file.name,
          mimeType: file.mimeType || 'application/pdf',
          size: file.size || 0,
        });
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível selecionar o documento');
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Erro', 'Digite um título para o documento');
      return;
    }

    if (!selectedFile) {
      Alert.alert('Erro', 'Selecione um arquivo');
      return;
    }

    setLoading(true);
    try {
      // 1. Fazer upload do arquivo para o Cloudinary
      setUploadProgress('Enviando arquivo...');
      const uploadResult = await uploadFile(
        selectedFile.uri,
        selectedFile.name,
        documentType as 'document' | 'rule',
        selectedFile.mimeType
      );

      // 2. Salvar o documento no banco com a URL do Cloudinary
      setUploadProgress('Salvando documento...');
      await documentsApi.create({
        title: title.trim(),
        type: documentType,
        fileUrl: uploadResult.url,
        fileName: selectedFile.name,
        mimeType: selectedFile.mimeType,
        fileSize: uploadResult.size || selectedFile.size,
      });

      Alert.alert('Sucesso', `${isRules ? 'Regra adicionada' : 'Documento adicionado'} com sucesso!`, [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error: any) {
      Alert.alert('Erro', error.message || error.response?.data?.message || 'Erro ao adicionar documento');
    } finally {
      setLoading(false);
      setUploadProgress('');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <View style={styles.container}>
      <GradientHeader
        title={isRules ? 'Nova Regra' : 'Novo Documento'}
        subtitle="Adicionar arquivo"
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Título */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações</Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Título *</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="document-text-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder={isRules ? 'Ex: Regulamento Interno' : 'Ex: Ata da Reunião'}
                placeholderTextColor="#94A3B8"
                value={title}
                onChangeText={setTitle}
              />
            </View>
          </View>
        </View>

        {/* Seleção de Arquivo */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Arquivo</Text>

          <TouchableOpacity
            style={styles.filePickerButton}
            onPress={handlePickDocument}
            activeOpacity={0.7}
          >
            {selectedFile ? (
              <View style={styles.selectedFileContainer}>
                <View style={styles.fileIconContainer}>
                  <Ionicons name="document-text" size={32} color="#6366F1" />
                </View>
                <View style={styles.fileInfo}>
                  <Text style={styles.fileName} numberOfLines={1}>{selectedFile.name}</Text>
                  <Text style={styles.fileSize}>{formatFileSize(selectedFile.size)}</Text>
                </View>
                <TouchableOpacity
                  style={styles.removeFileButton}
                  onPress={() => setSelectedFile(null)}
                >
                  <Ionicons name="close-circle" size={24} color="#EF4444" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.filePlaceholder}>
                <View style={styles.uploadIconContainer}>
                  <Ionicons name="cloud-upload-outline" size={40} color="#6366F1" />
                </View>
                <Text style={styles.uploadText}>Toque para selecionar</Text>
                <Text style={styles.uploadSubtext}>PDF, DOC, DOCX</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Dicas */}
        <View style={styles.tipsCard}>
          <View style={styles.tipsHeader}>
            <Ionicons name="information-circle-outline" size={20} color="#6366F1" />
            <Text style={styles.tipsTitle}>Informações</Text>
          </View>
          <Text style={styles.tipsText}>
            • {isRules ? 'Regras ficam disponíveis para todos os moradores' : 'Documentos ficam disponíveis para todos os moradores'}{'\n'}
            • Formatos aceitos: PDF, DOC, DOCX{'\n'}
            • Tamanho máximo recomendado: 10MB
          </Text>
        </View>

        {/* Botão Adicionar */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#6366F1', '#8B5CF6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.submitButtonGradient}
          >
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color="#FFFFFF" />
                {uploadProgress ? (
                  <Text style={styles.uploadProgressText}>{uploadProgress}</Text>
                ) : null}
              </View>
            ) : (
              <>
                <Ionicons name="cloud-upload-outline" size={24} color="#FFFFFF" />
                <Text style={styles.submitButtonText}>
                  {isRules ? 'Adicionar Regra' : 'Adicionar Documento'}
                </Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
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
    padding: 16,
    paddingBottom: 40,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
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
        elevation: 2,
      },
    }),
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 0,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1E293B',
  },
  filePickerButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  selectedFileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#C7D2FE',
  },
  fileIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  fileSize: {
    fontSize: 13,
    color: '#64748B',
  },
  removeFileButton: {
    padding: 4,
  },
  filePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    padding: 32,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  uploadIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  uploadText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  uploadSubtext: {
    fontSize: 13,
    color: '#94A3B8',
  },
  tipsCard: {
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366F1',
  },
  tipsText: {
    fontSize: 13,
    color: '#4338CA',
    lineHeight: 20,
  },
  submitButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  uploadProgressText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default CreateDocumentScreen;

