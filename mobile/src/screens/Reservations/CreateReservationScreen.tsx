import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { useNavigation } from '@react-navigation/native';
import { reservationsApi, Area, AvailabilityResponse, DayAvailability } from '../../api/reservations';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated from 'react-native-reanimated';
import GradientHeader from '../../components/GradientHeader';
import { formatDateLong } from '../../utils/dateFormat';
import { getListItemAnimation } from '../../utils/animations';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

const CreateReservationScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [areas, setAreas] = useState<Area[]>([]);
  const [selectedArea, setSelectedArea] = useState<Area | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingAreas, setLoadingAreas] = useState(true);
  const [availability, setAvailability] = useState<AvailabilityResponse | null>(null);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  useEffect(() => {
    loadAreas();
  }, []);

  useEffect(() => {
    if (selectedArea) {
      loadAvailability(selectedArea._id, currentMonth, currentYear);
    }
  }, [selectedArea, currentMonth, currentYear]);

  const loadAreas = async () => {
    setLoadingAreas(true);
    try {
      const response = await reservationsApi.getAreas();
      setAreas(response.data);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar as áreas');
    } finally {
      setLoadingAreas(false);
    }
  };

  const loadAvailability = async (areaId: string, month: number, year: number) => {
    setLoadingAvailability(true);
    try {
      const response = await reservationsApi.getAvailability(areaId, month, year);
      setAvailability(response.data);
    } catch (error) {
      console.error('Erro ao carregar disponibilidade:', error);
    } finally {
      setLoadingAvailability(false);
    }
  };

  const handleMonthChange = (date: DateData) => {
    setCurrentMonth(date.month);
    setCurrentYear(date.year);
    setSelectedDate('');
    setSelectedSlot('');
  };

  const handleSelectArea = (area: Area) => {
    setSelectedArea(area);
    setSelectedDate('');
    setSelectedSlot('');
    setAvailability(null);
  };

  const handleSelectDate = async (date: string) => {
    if (!availability || !selectedArea) return;
    
    const dayAvailability = availability.availability[date];
    if (!dayAvailability || !dayAvailability.available) {
      return;
    }
    
    setSelectedDate(date);
    setSelectedSlot('');
    
    // Recarregar disponibilidade para garantir dados atualizados
    loadAvailability(selectedArea._id, currentMonth, currentYear);
  };

  const getAvailableSlots = (): string[] => {
    if (!selectedArea || !selectedDate || !availability) return [];
    
    const dayAvailability = availability.availability[selectedDate];
    if (!dayAvailability) return [];
    
    // Filtrar horários que já estão reservados (pendente ou aprovada)
    const reservedSlots = dayAvailability.reservations.map(r => r.timeSlot);
    return selectedArea.availableSlots.filter(slot => !reservedSlots.includes(slot));
  };

  const handleSubmit = async () => {
    if (!selectedArea || !selectedDate || !selectedSlot) {
      Alert.alert('Erro', 'Preencha todos os campos');
      return;
    }

    setLoading(true);
    try {
      // Verificar disponibilidade novamente antes de enviar
      const freshAvailability = await reservationsApi.getAvailability(
        selectedArea._id, 
        currentMonth, 
        currentYear
      );
      
      const dayData = freshAvailability.data.availability[selectedDate];
      if (dayData) {
        const reservedSlots = dayData.reservations.map(r => r.timeSlot);
        if (reservedSlots.includes(selectedSlot)) {
          Alert.alert(
            'Horário Indisponível', 
            'Este horário foi reservado por outra pessoa enquanto você estava selecionando. Por favor, escolha outro horário.',
            [{ text: 'OK', onPress: () => {
              setAvailability(freshAvailability.data);
              setSelectedSlot('');
            }}]
          );
          setLoading(false);
          return;
        }
      }

      await reservationsApi.create({ 
        areaId: selectedArea._id, 
        date: selectedDate, 
        timeSlot: selectedSlot 
      });
      
      const message = selectedArea.rules.requiresApproval
        ? 'Sua solicitação foi enviada e aguarda aprovação!'
        : 'Reserva confirmada com sucesso!';
      
      Alert.alert('Sucesso', message, [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error: any) {
      Alert.alert('Erro', error.response?.data?.message || 'Erro ao criar reserva');
    } finally {
      setLoading(false);
    }
  };

  // Gerar marcações do calendário
  const getMarkedDates = () => {
    if (!availability) return {};
    
    const marked: Record<string, any> = {};
    
    Object.entries(availability.availability).forEach(([date, day]) => {
      if (date === selectedDate) {
        marked[date] = {
          selected: true,
          selectedColor: '#6366F1',
        };
      } else if (day.available) {
        marked[date] = {
          marked: true,
          dotColor: '#10B981',
        };
      } else if (!day.isPastDate && day.isDayAvailable) {
        // Dia esgotado
        marked[date] = {
          marked: true,
          dotColor: '#EF4444',
        };
      }
    });
    
    return marked;
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <View style={styles.container}>
      <GradientHeader
        title="Nova Reserva"
        subtitle="Selecione a área e a data"
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Seleção de Área */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Selecione a Área</Text>
          
          {loadingAreas ? (
            <ActivityIndicator color="#6366F1" style={{ padding: 20 }} />
          ) : areas.length === 0 ? (
            <Text style={styles.emptyText}>Nenhuma área disponível</Text>
          ) : (
            <View style={styles.areasGrid}>
              {areas.map((area, index) => (
                <AnimatedTouchableOpacity
                  key={area._id}
                  entering={getListItemAnimation(index, 50)}
                  style={[
                    styles.areaCard,
                    selectedArea?._id === area._id && styles.areaCardSelected
                  ]}
                  onPress={() => handleSelectArea(area)}
                  activeOpacity={0.7}
                >
                  <View style={[
                    styles.areaIconContainer,
                    { backgroundColor: selectedArea?._id === area._id ? '#6366F1' : '#F1F5F9' }
                  ]}>
                    <Ionicons 
                      name="business-outline" 
                      size={24} 
                      color={selectedArea?._id === area._id ? '#FFFFFF' : '#6366F1'} 
                    />
                  </View>
                  <Text style={[
                    styles.areaName,
                    selectedArea?._id === area._id && styles.areaNameSelected
                  ]}>
                    {area.name}
                  </Text>
                  {area.rules.fee > 0 && (
                    <Text style={styles.areaFee}>
                      {formatCurrency(area.rules.fee)}
                    </Text>
                  )}
                  {area.rules.feePercentage > 0 && (
                    <Text style={styles.areaFee}>
                      +{area.rules.feePercentage}% taxa
                    </Text>
                  )}
                </AnimatedTouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Detalhes da Área Selecionada */}
        {selectedArea && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informações</Text>
            <View style={styles.infoCard}>
              {selectedArea.description && (
                <Text style={styles.infoDescription}>{selectedArea.description}</Text>
              )}
              <View style={styles.infoRow}>
                <View style={styles.infoItem}>
                  <Ionicons name="people-outline" size={18} color="#64748B" />
                  <Text style={styles.infoText}>
                    {selectedArea.rules.capacity 
                      ? `Até ${selectedArea.rules.capacity} pessoas`
                      : 'Sem limite de pessoas'}
                  </Text>
                </View>
                <View style={styles.infoItem}>
                  <Ionicons name="time-outline" size={18} color="#64748B" />
                  <Text style={styles.infoText}>
                    Cancelar até {selectedArea.rules.cancellationDeadline}h antes
                  </Text>
                </View>
              </View>
              {selectedArea.rules.requiresApproval && (
                <View style={styles.approvalBadge}>
                  <Ionicons name="shield-checkmark-outline" size={16} color="#F59E0B" />
                  <Text style={styles.approvalText}>Requer aprovação</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Calendário */}
        {selectedArea && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Selecione a Data</Text>
              {loadingAvailability && (
                <ActivityIndicator size="small" color="#6366F1" />
              )}
            </View>
            
            <View style={styles.legendContainer}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
                <Text style={styles.legendText}>Disponível</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
                <Text style={styles.legendText}>Esgotado</Text>
              </View>
            </View>

            <Calendar
              onDayPress={(day) => handleSelectDate(day.dateString)}
              onMonthChange={handleMonthChange}
              markedDates={getMarkedDates()}
              minDate={new Date().toISOString().split('T')[0]}
              theme={{
                backgroundColor: '#FFFFFF',
                calendarBackground: '#FFFFFF',
                textSectionTitleColor: '#64748B',
                selectedDayBackgroundColor: '#6366F1',
                selectedDayTextColor: '#FFFFFF',
                todayTextColor: '#6366F1',
                dayTextColor: '#1E293B',
                textDisabledColor: '#CBD5E1',
                dotColor: '#10B981',
                arrowColor: '#6366F1',
                monthTextColor: '#1E293B',
                textMonthFontWeight: '700',
                textDayFontWeight: '500',
              }}
              style={styles.calendar}
            />
          </View>
        )}

        {/* Seleção de Horário */}
        {selectedDate && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Selecione o Horário</Text>
            
            {getAvailableSlots().length === 0 ? (
              <Text style={styles.noSlotsText}>
                Não há horários disponíveis para esta data
              </Text>
            ) : (
              <View style={styles.slotsGrid}>
                {getAvailableSlots().map((slot, index) => (
                  <TouchableOpacity
                    key={slot}
                    style={[
                      styles.slotButton,
                      selectedSlot === slot && styles.slotButtonSelected
                    ]}
                    onPress={() => setSelectedSlot(slot)}
                    activeOpacity={0.7}
                  >
                    <Ionicons 
                      name="time-outline" 
                      size={18} 
                      color={selectedSlot === slot ? '#FFFFFF' : '#6366F1'} 
                    />
                    <Text style={[
                      styles.slotText,
                      selectedSlot === slot && styles.slotTextSelected
                    ]}>
                      {slot}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Resumo e Botão */}
        {selectedArea && selectedDate && selectedSlot && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Resumo</Text>
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Área:</Text>
                <Text style={styles.summaryValue}>{selectedArea.name}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Data:</Text>
                <Text style={styles.summaryValue}>
                  {formatDateLong(selectedDate + 'T12:00:00')}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Horário:</Text>
                <Text style={styles.summaryValue}>{selectedSlot}</Text>
              </View>
              {selectedArea.rules.fee > 0 && (
                <View style={[styles.summaryRow, styles.summaryTotal]}>
                  <Text style={styles.summaryTotalLabel}>Taxa:</Text>
                  <Text style={styles.summaryTotalValue}>
                    {formatCurrency(selectedArea.rules.fee)}
                  </Text>
                </View>
              )}
            </View>

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
                    <Ionicons name="calendar-outline" size={24} color="#FFFFFF" />
                    <Text style={styles.submitButtonText}>
                      {selectedArea.rules.requiresApproval 
                        ? 'Solicitar Reserva' 
                        : 'Confirmar Reserva'}
                    </Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 16,
  },
  areasGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  areaCard: {
    width: '47%',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  areaCardSelected: {
    borderColor: '#6366F1',
    backgroundColor: '#EEF2FF',
  },
  areaIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  areaName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    textAlign: 'center',
  },
  areaNameSelected: {
    color: '#6366F1',
  },
  areaFee: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  emptyText: {
    textAlign: 'center',
    color: '#94A3B8',
    padding: 20,
  },
  infoCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
  },
  infoDescription: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 12,
    lineHeight: 20,
  },
  infoRow: {
    gap: 8,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: '#64748B',
  },
  approvalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  approvalText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F59E0B',
  },
  legendContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    color: '#64748B',
  },
  calendar: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  slotButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  slotButtonSelected: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  slotText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  slotTextSelected: {
    color: '#FFFFFF',
  },
  noSlotsText: {
    textAlign: 'center',
    color: '#94A3B8',
    padding: 20,
    fontSize: 14,
  },
  summaryCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#64748B',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
    textAlign: 'right',
  },
  summaryTotal: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  summaryTotalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  summaryTotalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#6366F1',
  },
  submitButton: {
    borderRadius: 12,
    overflow: 'hidden',
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
});

export default CreateReservationScreen;
