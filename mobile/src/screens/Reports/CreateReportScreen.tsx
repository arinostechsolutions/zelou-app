import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Image,
  FlatList,
  Platform,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Switch,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { reportsApi } from '../../api/reports';
import { uploadFile } from '../../api/upload';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import GradientHeader from '../../components/GradientHeader';

interface CategoryOption {
  value: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

interface LocationOption {
  value: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

const CATEGORIES: CategoryOption[] = [
  { value: 'Elétrica', label: 'Elétrica', icon: 'flash', color: '#F59E0B' },
  { value: 'Hidráulica', label: 'Hidráulica', icon: 'water', color: '#3B82F6' },
  { value: 'Limpeza', label: 'Limpeza', icon: 'sparkles', color: '#10B981' },
  { value: 'Segurança', label: 'Segurança', icon: 'shield-checkmark', color: '#EF4444' },
  { value: 'Infraestrutura', label: 'Infraestrutura', icon: 'construct', color: '#8B5CF6' },
  { value: 'Barulho', label: 'Barulho / Perturbação', icon: 'volume-high', color: '#F97316' },
  { value: 'Outro', label: 'Outro', icon: 'ellipsis-horizontal-circle', color: '#64748B' },
];

const LOCATIONS: LocationOption[] = [
  { value: 'Churrasqueira', label: 'Churrasqueira', icon: 'flame', color: '#F97316' },
  { value: 'Garagem', label: 'Garagem', icon: 'car', color: '#6366F1' },
  { value: 'Elevador', label: 'Elevador', icon: 'swap-vertical', color: '#8B5CF6' },
  { value: 'Hall', label: 'Hall de Entrada', icon: 'business', color: '#0EA5E9' },
  { value: 'Piscina', label: 'Piscina', icon: 'water', color: '#06B6D4' },
  { value: 'Academia', label: 'Academia', icon: 'fitness', color: '#10B981' },
  { value: 'Playground', label: 'Playground', icon: 'happy', color: '#F59E0B' },
  { value: 'Corredor', label: 'Corredor', icon: 'walk', color: '#64748B' },
  { value: 'Escada', label: 'Escada', icon: 'trending-up', color: '#78716C' },
  { value: 'Área comum', label: 'Área Comum', icon: 'people', color: '#EC4899' },
  { value: 'Outro', label: 'Outro Local', icon: 'location', color: '#64748B' },
];

const CreateReportScreen = () => {
  const navigation = useNavigation();
  const [photos, setPhotos] = useState<string[]>([]);
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);

  const selectedCategory = CATEGORIES.find(c => c.value === category);
  const selectedLocation = LOCATIONS.find(l => l.value === location);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Precisamos de permissão para acessar suas fotos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsMultipleSelection: true,
      selectionLimit: 5,
    });

    if (!result.canceled) {
      setPhotos([...photos, ...result.assets.map((asset) => asset.uri)]);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Precisamos de permissão para acessar sua câmera');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setPhotos([...photos, result.assets[0].uri]);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!photos.length || !category || !description || !location) {
      Alert.alert('Erro', 'Preencha todos os campos obrigatórios');
      return;
    }

    setLoading(true);
    try {
      // Upload das fotos para o Cloudinary
      const uploadedPhotos: string[] = [];
      
      for (let i = 0; i < photos.length; i++) {
        const photoUri = photos[i];
        const fileName = `report_${Date.now()}_${i}.jpg`;
        
        const uploadedUrl = await uploadFile(photoUri, fileName, 'report', 'image/jpeg');
        uploadedPhotos.push(uploadedUrl);
      }

      // Criar o report com as URLs do Cloudinary
      await reportsApi.create({
        photos: uploadedPhotos,
        category,
        description,
        location,
        isAnonymous,
      });
      
      setSuccessModalVisible(true);
    } catch (error: any) {
      console.error('Erro ao criar irregularidade:', error);
      Alert.alert('Erro', error.response?.data?.message || error.message || 'Erro ao registrar irregularidade');
    } finally {
      setLoading(false);
    }
  };

  const scrollViewRef = useRef<ScrollView>(null);

  return (
    <View style={styles.container}>
      <GradientHeader
        title="Nova Irregularidade"
        subtitle="Registrar ocorrência"
        onBackPress={() => navigation.goBack()}
      />

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView 
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
        {/* Fotos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="camera-outline" size={18} color="#1E293B" /> Fotos *
          </Text>
          
          <FlatList
            horizontal
            data={photos}
            renderItem={({ item, index }) => (
              <View style={styles.photoContainer}>
                <Image source={{ uri: item }} style={styles.photo} />
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removePhoto(index)}
                >
                  <Ionicons name="close" size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            )}
            keyExtractor={(_, index) => index.toString()}
            showsHorizontalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.photoPlaceholder}>
                <Ionicons name="images-outline" size={32} color="#94A3B8" />
                <Text style={styles.photoPlaceholderText}>Nenhuma foto</Text>
              </View>
            }
            contentContainerStyle={styles.photosList}
          />

          <View style={styles.photoActions}>
            <TouchableOpacity 
              style={styles.photoActionButton} 
              onPress={pickImage}
              activeOpacity={0.7}
            >
              <Ionicons name="images-outline" size={20} color="#6366F1" />
              <Text style={styles.photoActionText}>Galeria</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.photoActionButton} 
              onPress={takePhoto}
              activeOpacity={0.7}
            >
              <Ionicons name="camera-outline" size={20} color="#6366F1" />
              <Text style={styles.photoActionText}>Câmera</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Categoria */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="pricetag-outline" size={18} color="#1E293B" /> Categoria *
          </Text>
          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => setShowCategoryModal(true)}
            activeOpacity={0.7}
          >
            {selectedCategory ? (
              <View style={styles.selectedOption}>
                <View style={[styles.selectedIconContainer, { backgroundColor: `${selectedCategory.color}20` }]}>
                  <Ionicons name={selectedCategory.icon} size={20} color={selectedCategory.color} />
                </View>
                <Text style={styles.selectedText}>{selectedCategory.label}</Text>
              </View>
            ) : (
              <Text style={styles.placeholderText}>Selecione uma categoria</Text>
            )}
            <Ionicons name="chevron-down" size={20} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        {/* Local */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="location-outline" size={18} color="#1E293B" /> Local *
          </Text>
          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => setShowLocationModal(true)}
            activeOpacity={0.7}
          >
            {selectedLocation ? (
              <View style={styles.selectedOption}>
                <View style={[styles.selectedIconContainer, { backgroundColor: `${selectedLocation.color}20` }]}>
                  <Ionicons name={selectedLocation.icon} size={20} color={selectedLocation.color} />
                </View>
                <Text style={styles.selectedText}>{selectedLocation.label}</Text>
              </View>
            ) : (
              <Text style={styles.placeholderText}>Selecione um local</Text>
            )}
            <Ionicons name="chevron-down" size={20} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        {/* Enviar como Anônimo */}
        <View style={styles.section}>
          <View style={[
            styles.anonymousContainer,
            isAnonymous && styles.anonymousContainerActive
          ]}>
            <View style={styles.anonymousInfo}>
              <View style={[
                styles.anonymousIconContainer,
                isAnonymous && styles.anonymousIconContainerActive
              ]}>
                <Ionicons 
                  name={isAnonymous ? "shield-checkmark" : "shield-outline"} 
                  size={24} 
                  color={isAnonymous ? "#FFFFFF" : "#6366F1"} 
                />
              </View>
              <View style={styles.anonymousTextContainer}>
                <Text style={[
                  styles.anonymousTitle,
                  isAnonymous && styles.anonymousTitleActive
                ]}>
                  Enviar como anônimo
                </Text>
                <Text style={[
                  styles.anonymousDescription,
                  isAnonymous && styles.anonymousDescriptionActive
                ]}>
                  {isAnonymous 
                    ? 'Seu nome e dados não serão exibidos publicamente' 
                    : 'Seu nome e dados não serão exibidos'}
                </Text>
              </View>
            </View>
            <Switch
              value={isAnonymous}
              onValueChange={setIsAnonymous}
              trackColor={{ false: '#E2E8F0', true: '#6366F1' }}
              thumbColor="#FFFFFF"
              ios_backgroundColor="#E2E8F0"
            />
          </View>
        </View>

        {/* Descrição */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Descrição *</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Descreva a irregularidade em detalhes..."
            placeholderTextColor="#94A3B8"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            onFocus={() => {
              // Scroll para baixo quando o campo de descrição receber foco
              setTimeout(() => {
                scrollViewRef.current?.scrollToEnd({ animated: true });
              }, 300);
            }}
          />
        </View>

        {/* Botão Enviar */}
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
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="warning-outline" size={24} color="#FFFFFF" />
                <Text style={styles.submitButtonText}>Registrar Irregularidade</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>

      {/* Modal de Categoria */}
      <Modal
        visible={showCategoryModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowCategoryModal(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecione a Categoria</Text>
              <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.value}
                  style={[
                    styles.modalOption,
                    category === cat.value && styles.modalOptionSelected
                  ]}
                  onPress={() => {
                    setCategory(cat.value);
                    setShowCategoryModal(false);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={[styles.modalOptionIcon, { backgroundColor: `${cat.color}20` }]}>
                    <Ionicons name={cat.icon} size={24} color={cat.color} />
                  </View>
                  <Text style={[
                    styles.modalOptionText,
                    category === cat.value && styles.modalOptionTextSelected
                  ]}>
                    {cat.label}
                  </Text>
                  {category === cat.value && (
                    <Ionicons name="checkmark-circle" size={24} color="#6366F1" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modal de Local */}
      <Modal
        visible={showLocationModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowLocationModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowLocationModal(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecione o Local</Text>
              <TouchableOpacity onPress={() => setShowLocationModal(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {LOCATIONS.map((loc) => (
                <TouchableOpacity
                  key={loc.value}
                  style={[
                    styles.modalOption,
                    location === loc.value && styles.modalOptionSelected
                  ]}
                  onPress={() => {
                    setLocation(loc.value);
                    setShowLocationModal(false);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={[styles.modalOptionIcon, { backgroundColor: `${loc.color}20` }]}>
                    <Ionicons name={loc.icon} size={24} color={loc.color} />
                  </View>
                  <Text style={[
                    styles.modalOptionText,
                    location === loc.value && styles.modalOptionTextSelected
                  ]}>
                    {loc.label}
                  </Text>
                  {location === loc.value && (
                    <Ionicons name="checkmark-circle" size={24} color="#6366F1" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modal de Sucesso */}
      <Modal
        visible={successModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setSuccessModalVisible(false);
          navigation.goBack();
        }}
      >
        <View style={styles.successModalOverlay}>
          <View style={styles.successModalContent}>
            <Ionicons name="checkmark-circle" size={60} color="#10B981" />
            <Text style={styles.successModalTitle}>Sucesso!</Text>
            <Text style={styles.successModalMessage}>Irregularidade registrada com sucesso!</Text>
            <TouchableOpacity
              style={styles.successModalButton}
              onPress={() => {
                setSuccessModalVisible(false);
                navigation.goBack();
              }}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#6366F1', '#8B5CF6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.successModalButtonGradient}
              >
                <Text style={styles.successModalButtonText}>OK</Text>
              </LinearGradient>
            </TouchableOpacity>
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
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 12,
  },
  photosList: {
    marginBottom: 12,
  },
  photoContainer: {
    marginRight: 12,
    marginTop: 8,
    position: 'relative',
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
  },
  removeButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#EF4444',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  photoPlaceholder: {
    width: 120,
    height: 120,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  photoPlaceholderText: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 4,
  },
  photoActions: {
    flexDirection: 'row',
    gap: 12,
  },
  photoActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#EEF2FF',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  photoActionText: {
    color: '#6366F1',
    fontSize: 14,
    fontWeight: '600',
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    padding: 14,
    minHeight: 56,
  },
  selectedOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  selectedIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
  },
  placeholderText: {
    fontSize: 15,
    color: '#94A3B8',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  modalScroll: {
    padding: 16,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  modalOptionSelected: {
    backgroundColor: '#EEF2FF',
    borderColor: '#6366F1',
  },
  modalOptionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  modalOptionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#475569',
  },
  modalOptionTextSelected: {
    color: '#1E293B',
    fontWeight: '600',
  },
  textArea: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    padding: 14,
    fontSize: 15,
    color: '#1E293B',
    minHeight: 120,
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
  successModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  successModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  successModalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 20,
    marginBottom: 10,
  },
  successModalMessage: {
    fontSize: 16,
    color: '#475569',
    textAlign: 'center',
    marginBottom: 30,
  },
  successModalButton: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 10,
  },
  successModalButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successModalButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  anonymousContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  anonymousContainerActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#6366F1',
    borderWidth: 3,
    ...Platform.select({
      ios: {
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  anonymousInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 16,
  },
  anonymousIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  anonymousIconContainerActive: {
    backgroundColor: '#6366F1',
  },
  anonymousTextContainer: {
    marginLeft: 14,
    flex: 1,
  },
  anonymousTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  anonymousTitleActive: {
    color: '#6366F1',
  },
  anonymousDescription: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    fontWeight: '500',
  },
  anonymousDescriptionActive: {
    color: '#475569',
    fontWeight: '600',
  },
});

export default CreateReportScreen;
