import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  ActivityIndicator,
  Modal,
  Image,
  KeyboardAvoidingView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../contexts/ThemeContext';
import { maintenancesApi, maintenanceTypes } from '../../api/maintenances';
import { uploadFile } from '../../api/upload';

const CreateMaintenanceScreen = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [location, setLocation] = useState('');
  const [responsible, setResponsible] = useState('');
  const [notes, setNotes] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Modals
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR');
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const localUri = result.assets[0].uri;
      // Mostrar imagem local imediatamente
      setImages(prev => [...prev, localUri]);
      
      try {
        const uploadedUrl = await uploadFile(localUri);
        // Substituir URI local pela URL do Cloudinary
        setImages(prev => prev.map(img => img === localUri ? uploadedUrl : img));
      } catch (error) {
        console.error('Erro no upload:', error);
        // Remover imagem em caso de erro
        setImages(prev => prev.filter(img => img !== localUri));
        Alert.alert('Erro', 'Não foi possível fazer upload da imagem');
      }
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Precisamos de acesso à câmera');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const localUri = result.assets[0].uri;
      // Mostrar imagem local imediatamente
      setImages(prev => [...prev, localUri]);
      
      try {
        const uploadedUrl = await uploadFile(localUri);
        // Substituir URI local pela URL do Cloudinary
        setImages(prev => prev.map(img => img === localUri ? uploadedUrl : img));
      } catch (error) {
        console.error('Erro no upload:', error);
        // Remover imagem em caso de erro
        setImages(prev => prev.filter(img => img !== localUri));
        Alert.alert('Erro', 'Não foi possível fazer upload da imagem');
      }
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Erro', 'Título é obrigatório');
      return;
    }

    if (!type) {
      Alert.alert('Erro', 'Selecione o tipo de manutenção');
      return;
    }

    setLoading(true);

    try {
      await maintenancesApi.create({
        title: title.trim(),
        description: description.trim() || undefined,
        type,
        startDate: startDate.toISOString(),
        startTime: startTime ? formatTime(startTime) : undefined,
        endDate: endDate ? endDate.toISOString() : undefined,
        endTime: endTime ? formatTime(endTime) : undefined,
        location: location.trim() || undefined,
        responsible: responsible.trim() || undefined,
        images: images.length > 0 ? images : undefined,
        notes: notes.trim() || undefined,
      });

      Alert.alert('Sucesso', 'Manutenção registrada com sucesso!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error: any) {
      console.error('Erro ao criar manutenção:', error);
      Alert.alert('Erro', error.response?.data?.message || 'Erro ao registrar manutenção');
    } finally {
      setLoading(false);
    }
  };

  const selectedType = maintenanceTypes.find(t => t.value === type);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.headerGradientStart, colors.headerGradientMiddle, colors.headerGradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 8 }]}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Nova Manutenção</Text>
          <View style={styles.headerRight} />
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Título */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Título *</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="text-outline" size={20} color="#6366F1" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="Ex: Manutenção do elevador"
                placeholderTextColor="#94A3B8"
              />
            </View>
          </View>

          {/* Tipo */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tipo de Manutenção *</Text>
            <TouchableOpacity
              style={styles.selectorButton}
              onPress={() => setShowTypePicker(true)}
            >
              <View style={styles.selectorContent}>
                <Ionicons 
                  name={(selectedType?.icon || 'build-outline') as any} 
                  size={22} 
                  color="#6366F1" 
                />
                <Text style={[styles.selectorText, !type && styles.placeholderText]}>
                  {selectedType?.label || 'Selecione o tipo'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          {/* Descrição */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Descrição</Text>
            <View style={[styles.inputContainer, styles.textAreaContainer]}>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Descreva a manutenção..."
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Data de Início */}
          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Data de Início *</Text>
              <TouchableOpacity
                style={styles.selectorButton}
                onPress={() => setShowStartDatePicker(true)}
              >
                <View style={styles.selectorContent}>
                  <Ionicons name="calendar-outline" size={20} color="#6366F1" />
                  <Text style={styles.selectorText}>{formatDate(startDate)}</Text>
                </View>
              </TouchableOpacity>
            </View>

            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Horário (opcional)</Text>
              <TouchableOpacity
                style={styles.selectorButton}
                onPress={() => setShowStartTimePicker(true)}
              >
                <View style={styles.selectorContent}>
                  <Ionicons name="time-outline" size={20} color="#6366F1" />
                  <Text style={[styles.selectorText, !startTime && styles.placeholderText]}>
                    {startTime ? formatTime(startTime) : 'Selecionar'}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Data de Término */}
          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Data de Término</Text>
              <TouchableOpacity
                style={styles.selectorButton}
                onPress={() => setShowEndDatePicker(true)}
              >
                <View style={styles.selectorContent}>
                  <Ionicons name="calendar-outline" size={20} color="#6366F1" />
                  <Text style={[styles.selectorText, !endDate && styles.placeholderText]}>
                    {endDate ? formatDate(endDate) : 'Selecionar'}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Horário (opcional)</Text>
              <TouchableOpacity
                style={styles.selectorButton}
                onPress={() => setShowEndTimePicker(true)}
                disabled={!endDate}
              >
                <View style={styles.selectorContent}>
                  <Ionicons name="time-outline" size={20} color={endDate ? '#6366F1' : '#CBD5E1'} />
                  <Text style={[styles.selectorText, (!endTime || !endDate) && styles.placeholderText]}>
                    {endTime && endDate ? formatTime(endTime) : 'Selecionar'}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Local */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Local</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="location-outline" size={20} color="#6366F1" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={location}
                onChangeText={setLocation}
                placeholder="Ex: Hall de entrada, Garagem..."
                placeholderTextColor="#94A3B8"
              />
            </View>
          </View>

          {/* Responsável */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Empresa/Profissional Responsável</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color="#6366F1" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={responsible}
                onChangeText={setResponsible}
                placeholder="Ex: Elevadores XYZ"
                placeholderTextColor="#94A3B8"
              />
            </View>
          </View>

          {/* Imagens */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Imagens (opcional)</Text>
            <View style={styles.imageButtons}>
              <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
                <Ionicons name="images-outline" size={24} color="#6366F1" />
                <Text style={styles.imageButtonText}>Galeria</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.imageButton} onPress={takePhoto}>
                <Ionicons name="camera-outline" size={24} color="#6366F1" />
                <Text style={styles.imageButtonText}>Câmera</Text>
              </TouchableOpacity>
            </View>
            
            {images.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesPreview}>
                {images.map((uri, index) => (
                  <View key={index} style={styles.imagePreviewContainer}>
                    <Image source={{ uri }} style={styles.imagePreview} />
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={() => removeImage(index)}
                    >
                      <Ionicons name="close-circle" size={24} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>

          {/* Observações */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Observações</Text>
            <View style={[styles.inputContainer, styles.textAreaContainer]}>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Observações adicionais..."
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Botão Salvar */}
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#6366F1', '#8B5CF6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.submitButtonGradient}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={22} color="#FFFFFF" />
                  <Text style={styles.submitButtonText}>Registrar Manutenção</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modal Tipo */}
      <Modal
        visible={showTypePicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowTypePicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowTypePicker(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Tipo de Manutenção</Text>
            <ScrollView style={styles.modalScroll}>
              {maintenanceTypes.map((item) => (
                <TouchableOpacity
                  key={item.value}
                  style={[
                    styles.modalOption,
                    type === item.value && styles.modalOptionActive,
                  ]}
                  onPress={() => {
                    setType(item.value);
                    setShowTypePicker(false);
                  }}
                >
                  <Ionicons 
                    name={item.icon as any} 
                    size={22} 
                    color={type === item.value ? '#6366F1' : '#64748B'} 
                  />
                  <Text
                    style={[
                      styles.modalOptionText,
                      type === item.value && styles.modalOptionTextActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                  {type === item.value && (
                    <Ionicons name="checkmark" size={20} color="#6366F1" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* DateTimePickers */}
      {showStartDatePicker && (
        Platform.OS === 'ios' ? (
          <Modal visible transparent animationType="slide">
            <View style={styles.datePickerOverlay}>
              <View style={styles.datePickerContainer}>
                <View style={styles.datePickerHeader}>
                  <TouchableOpacity onPress={() => setShowStartDatePicker(false)}>
                    <Text style={styles.datePickerCancel}>Cancelar</Text>
                  </TouchableOpacity>
                  <Text style={styles.datePickerTitle}>Data de Início</Text>
                  <TouchableOpacity onPress={() => setShowStartDatePicker(false)}>
                    <Text style={styles.datePickerDone}>Confirmar</Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={startDate}
                  mode="date"
                  display="spinner"
                  onChange={(e, date) => date && setStartDate(date)}
                  locale="pt-BR"
                  themeVariant="light"
                />
              </View>
            </View>
          </Modal>
        ) : (
          <DateTimePicker
            value={startDate}
            mode="date"
            display="default"
            onChange={(e, date) => {
              setShowStartDatePicker(false);
              if (date) setStartDate(date);
            }}
          />
        )
      )}

      {showStartTimePicker && (
        Platform.OS === 'ios' ? (
          <Modal visible transparent animationType="slide">
            <View style={styles.datePickerOverlay}>
              <View style={styles.datePickerContainer}>
                <View style={styles.datePickerHeader}>
                  <TouchableOpacity onPress={() => setShowStartTimePicker(false)}>
                    <Text style={styles.datePickerCancel}>Cancelar</Text>
                  </TouchableOpacity>
                  <Text style={styles.datePickerTitle}>Horário de Início</Text>
                  <TouchableOpacity onPress={() => setShowStartTimePicker(false)}>
                    <Text style={styles.datePickerDone}>Confirmar</Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={startTime || new Date()}
                  mode="time"
                  display="spinner"
                  onChange={(e, date) => date && setStartTime(date)}
                  locale="pt-BR"
                  themeVariant="light"
                />
              </View>
            </View>
          </Modal>
        ) : (
          <DateTimePicker
            value={startTime || new Date()}
            mode="time"
            display="default"
            onChange={(e, date) => {
              setShowStartTimePicker(false);
              if (date) setStartTime(date);
            }}
          />
        )
      )}

      {showEndDatePicker && (
        Platform.OS === 'ios' ? (
          <Modal visible transparent animationType="slide">
            <View style={styles.datePickerOverlay}>
              <View style={styles.datePickerContainer}>
                <View style={styles.datePickerHeader}>
                  <TouchableOpacity onPress={() => setShowEndDatePicker(false)}>
                    <Text style={styles.datePickerCancel}>Cancelar</Text>
                  </TouchableOpacity>
                  <Text style={styles.datePickerTitle}>Data de Término</Text>
                  <TouchableOpacity onPress={() => setShowEndDatePicker(false)}>
                    <Text style={styles.datePickerDone}>Confirmar</Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={endDate || new Date()}
                  mode="date"
                  display="spinner"
                  onChange={(e, date) => date && setEndDate(date)}
                  locale="pt-BR"
                  themeVariant="light"
                  minimumDate={startDate}
                />
              </View>
            </View>
          </Modal>
        ) : (
          <DateTimePicker
            value={endDate || new Date()}
            mode="date"
            display="default"
            minimumDate={startDate}
            onChange={(e, date) => {
              setShowEndDatePicker(false);
              if (date) setEndDate(date);
            }}
          />
        )
      )}

      {showEndTimePicker && (
        Platform.OS === 'ios' ? (
          <Modal visible transparent animationType="slide">
            <View style={styles.datePickerOverlay}>
              <View style={styles.datePickerContainer}>
                <View style={styles.datePickerHeader}>
                  <TouchableOpacity onPress={() => setShowEndTimePicker(false)}>
                    <Text style={styles.datePickerCancel}>Cancelar</Text>
                  </TouchableOpacity>
                  <Text style={styles.datePickerTitle}>Horário de Término</Text>
                  <TouchableOpacity onPress={() => setShowEndTimePicker(false)}>
                    <Text style={styles.datePickerDone}>Confirmar</Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={endTime || new Date()}
                  mode="time"
                  display="spinner"
                  onChange={(e, date) => date && setEndTime(date)}
                  locale="pt-BR"
                  themeVariant="light"
                />
              </View>
            </View>
          </Modal>
        ) : (
          <DateTimePicker
            value={endTime || new Date()}
            mode="time"
            display="default"
            onChange={(e, date) => {
              setShowEndTimePicker(false);
              if (date) setEndTime(date);
            }}
          />
        )
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  flex: {
    flex: 1,
  },
  header: {
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  inputGroup: {
    marginBottom: 16,
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
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 15,
    color: '#1E293B',
  },
  textAreaContainer: {
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  selectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    height: 50,
  },
  selectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  selectorText: {
    fontSize: 15,
    color: '#1E293B',
  },
  placeholderText: {
    color: '#94A3B8',
  },
  imageButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  imageButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 14,
  },
  imageButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366F1',
  },
  imagesPreview: {
    marginTop: 12,
  },
  imagePreviewContainer: {
    marginRight: 12,
    position: 'relative',
  },
  imagePreview: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  submitButton: {
    marginTop: 8,
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  submitButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 360,
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalScroll: {
    maxHeight: 400,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 4,
  },
  modalOptionActive: {
    backgroundColor: '#EEF2FF',
  },
  modalOptionText: {
    flex: 1,
    fontSize: 15,
    color: '#475569',
  },
  modalOptionTextActive: {
    color: '#6366F1',
    fontWeight: '600',
  },
  // DatePicker
  datePickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  datePickerContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 30,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  datePickerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1E293B',
  },
  datePickerCancel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#64748B',
  },
  datePickerDone: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6366F1',
  },
});

export default CreateMaintenanceScreen;

