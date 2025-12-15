import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
  Switch,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { reservationsApi } from '../../api/reservations';
import GradientHeader from '../../components/GradientHeader';

const DAYS_OF_WEEK = [
  { value: 0, label: 'Dom' },
  { value: 1, label: 'Seg' },
  { value: 2, label: 'Ter' },
  { value: 3, label: 'Qua' },
  { value: 4, label: 'Qui' },
  { value: 5, label: 'Sex' },
  { value: 6, label: 'Sáb' },
];

const DEFAULT_SLOTS = [
  '08:00 - 12:00',
  '14:00 - 18:00',
  '19:00 - 23:00',
];

const CreateAreaScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  
  // Dados básicos
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  
  // Regras
  const [maxReservationsPerDay, setMaxReservationsPerDay] = useState('1');
  const [capacity, setCapacity] = useState('');
  const [fee, setFee] = useState('');
  const [feePercentage, setFeePercentage] = useState('');
  const [cancellationDeadline, setCancellationDeadline] = useState('24');
  const [requiresApproval, setRequiresApproval] = useState(true);
  
  // Disponibilidade
  const [availableDays, setAvailableDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [availableSlots, setAvailableSlots] = useState<string[]>(DEFAULT_SLOTS);
  const [newSlot, setNewSlot] = useState('');

  const toggleDay = (day: number) => {
    if (availableDays.includes(day)) {
      setAvailableDays(availableDays.filter(d => d !== day));
    } else {
      setAvailableDays([...availableDays, day].sort());
    }
  };

  const addSlot = () => {
    if (!newSlot.trim()) return;
    if (availableSlots.includes(newSlot.trim())) {
      Alert.alert('Atenção', 'Este horário já foi adicionado');
      return;
    }
    setAvailableSlots([...availableSlots, newSlot.trim()]);
    setNewSlot('');
  };

  const removeSlot = (slot: string) => {
    setAvailableSlots(availableSlots.filter(s => s !== slot));
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert('Erro', 'Nome da área é obrigatório');
      return;
    }

    if (availableDays.length === 0) {
      Alert.alert('Erro', 'Selecione pelo menos um dia da semana');
      return;
    }

    if (availableSlots.length === 0) {
      Alert.alert('Erro', 'Adicione pelo menos um horário disponível');
      return;
    }

    setLoading(true);
    try {
      await reservationsApi.createArea({
        name: name.trim(),
        description: description.trim() || undefined,
        rules: {
          maxReservationsPerDay: parseInt(maxReservationsPerDay) || 1,
          capacity: capacity ? parseInt(capacity) : undefined,
          fee: fee ? parseFloat(fee.replace(',', '.')) : 0,
          feePercentage: feePercentage ? parseFloat(feePercentage.replace(',', '.')) : 0,
          cancellationDeadline: parseInt(cancellationDeadline) || 24,
          requiresApproval,
        },
        availableDays,
        availableSlots,
      });

      setSuccessModalVisible(true);
    } catch (error: any) {
      Alert.alert('Erro', error.response?.data?.message || 'Erro ao criar área');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <GradientHeader
        title="Nova Área"
        subtitle="Cadastrar área comum"
        onBackPress={() => navigation.goBack()}
      />

      <KeyboardAwareScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        enableOnAndroid={true}
        extraScrollHeight={20}
        showsVerticalScrollIndicator={false}
      >
        {/* Informações Básicas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações Básicas</Text>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Nome da Área *</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="business-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Ex: Salão de Festas"
                placeholderTextColor="#94A3B8"
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Descrição</Text>
            <TextInput
              style={[styles.inputContainer, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Descreva a área e suas características..."
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Regras */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Regras de Uso</Text>
          
          <View style={styles.row}>
            <View style={[styles.formGroup, styles.halfWidth]}>
              <Text style={styles.label}>Reservas/Dia</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  value={maxReservationsPerDay}
                  onChangeText={setMaxReservationsPerDay}
                  placeholder="1"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                />
              </View>
            </View>
            
            <View style={[styles.formGroup, styles.halfWidth]}>
              <Text style={styles.label}>Capacidade</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  value={capacity}
                  onChangeText={setCapacity}
                  placeholder="Pessoas"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.formGroup, styles.halfWidth]}>
              <Text style={styles.label}>Taxa (R$)</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  value={fee}
                  onChangeText={setFee}
                  placeholder="0,00"
                  placeholderTextColor="#94A3B8"
                  keyboardType="decimal-pad"
                />
              </View>
            </View>
            
            <View style={[styles.formGroup, styles.halfWidth]}>
              <Text style={styles.label}>Taxa (%)</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  value={feePercentage}
                  onChangeText={setFeePercentage}
                  placeholder="0"
                  placeholderTextColor="#94A3B8"
                  keyboardType="decimal-pad"
                />
              </View>
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Cancelamento (horas antes)</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="time-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={cancellationDeadline}
                onChangeText={setCancellationDeadline}
                placeholder="24"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.switchRow}>
            <View style={styles.switchInfo}>
              <Text style={styles.switchLabel}>Requer Aprovação</Text>
              <Text style={styles.switchDescription}>
                Reservas precisam ser aprovadas por um gestor
              </Text>
            </View>
            <Switch
              value={requiresApproval}
              onValueChange={setRequiresApproval}
              trackColor={{ false: '#E2E8F0', true: '#C7D2FE' }}
              thumbColor={requiresApproval ? '#6366F1' : '#94A3B8'}
            />
          </View>
        </View>

        {/* Dias Disponíveis */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dias Disponíveis</Text>
          
          <View style={styles.daysContainer}>
            {DAYS_OF_WEEK.map((day) => (
              <TouchableOpacity
                key={day.value}
                style={[
                  styles.dayButton,
                  availableDays.includes(day.value) && styles.dayButtonActive
                ]}
                onPress={() => toggleDay(day.value)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.dayButtonText,
                  availableDays.includes(day.value) && styles.dayButtonTextActive
                ]}>
                  {day.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Horários */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Horários Disponíveis</Text>
          
          <View style={styles.slotsContainer}>
            {availableSlots.map((slot) => (
              <View key={slot} style={styles.slotChip}>
                <Text style={styles.slotChipText}>{slot}</Text>
                <TouchableOpacity onPress={() => removeSlot(slot)}>
                  <Ionicons name="close-circle" size={18} color="#EF4444" />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          <View style={styles.addSlotContainer}>
            <View style={[styles.inputContainer, { flex: 1 }]}>
              <TextInput
                style={styles.input}
                value={newSlot}
                onChangeText={setNewSlot}
                placeholder="Ex: 08:00 - 12:00"
                placeholderTextColor="#94A3B8"
              />
            </View>
            <TouchableOpacity
              style={styles.addSlotButton}
              onPress={addSlot}
              activeOpacity={0.7}
            >
              <Ionicons name="add" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Botão Criar */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleCreate}
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
                <Ionicons name="add-circle-outline" size={24} color="#FFFFFF" />
                <Text style={styles.submitButtonText}>Criar Área</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </KeyboardAwareScrollView>

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
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons name="checkmark-circle" size={60} color="#10B981" />
            <Text style={styles.modalTitle}>Sucesso!</Text>
            <Text style={styles.modalMessage}>Área criada com sucesso!</Text>
            <TouchableOpacity
              style={styles.modalButton}
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
                style={styles.modalButtonGradient}
              >
                <Text style={styles.modalButtonText}>OK</Text>
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
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 16,
  },
  formGroup: {
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
  textArea: {
    minHeight: 80,
    paddingTop: 12,
    paddingBottom: 12,
    alignItems: 'flex-start',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
  },
  switchInfo: {
    flex: 1,
    marginRight: 12,
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  switchDescription: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  daysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F1F5F9',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayButtonActive: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  dayButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  dayButtonTextActive: {
    color: '#FFFFFF',
  },
  slotsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  slotChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingLeft: 12,
    paddingRight: 8,
    backgroundColor: '#EEF2FF',
    borderRadius: 20,
  },
  slotChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6366F1',
  },
  addSlotContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  addSlotButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
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
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
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
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 20,
    marginBottom: 10,
  },
  modalMessage: {
    fontSize: 16,
    color: '#475569',
    textAlign: 'center',
    marginBottom: 30,
  },
  modalButton: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 10,
  },
  modalButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default CreateAreaScreen;


