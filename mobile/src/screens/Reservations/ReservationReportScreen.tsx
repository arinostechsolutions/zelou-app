import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import DateTimePicker from '@react-native-community/datetimepicker';
import api, { API_BASE_URL } from '../../api/axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

interface Area {
  _id: string;
  name: string;
}

const ReservationReportScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [areas, setAreas] = useState<Area[]>([]);
  const [loadingAreas, setLoadingAreas] = useState(true);

  // Filtros
  const [filterType, setFilterType] = useState<'month' | 'custom'>('month');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [selectedStatus, setSelectedStatus] = useState('todas');
  const [selectedArea, setSelectedArea] = useState('todas');

  // Modals
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showStatusPicker, setShowStatusPicker] = useState(false);
  const [showAreaPicker, setShowAreaPicker] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const statuses = [
    { value: 'todas', label: 'Todas' },
    { value: 'aprovada', label: 'Aprovadas' },
    { value: 'pendente', label: 'Pendentes' },
    { value: 'rejeitada', label: 'Rejeitadas' },
    { value: 'cancelada', label: 'Canceladas' },
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  useEffect(() => {
    loadAreas();
  }, []);

  useEffect(() => {
    // Atualizar datas quando mês/ano mudar (apenas para filtro por mês)
    if (filterType === 'month') {
      const start = new Date(selectedYear, selectedMonth, 1);
      const end = new Date(selectedYear, selectedMonth + 1, 0);
      setStartDate(start);
      setEndDate(end);
    }
  }, [selectedMonth, selectedYear, filterType]);

  // Quando mudar para filtro personalizado, definir datas padrão
  useEffect(() => {
    if (filterType === 'custom') {
      // Definir período padrão: últimos 15 dias
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 15);
      setStartDate(start);
      setEndDate(end);
    }
  }, [filterType]);

  const onStartDateChange = (event: any, selectedDate?: Date) => {
    setShowStartDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setStartDate(selectedDate);
      // Se a data inicial for maior que a final, ajustar
      if (selectedDate > endDate) {
        setEndDate(selectedDate);
      }
    }
  };

  const onEndDateChange = (event: any, selectedDate?: Date) => {
    setShowEndDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setEndDate(selectedDate);
      // Se a data final for menor que a inicial, ajustar
      if (selectedDate < startDate) {
        setStartDate(selectedDate);
      }
    }
  };

  const loadAreas = async () => {
    try {
      const response = await api.get('/areas');
      setAreas(response.data);
    } catch (error) {
      console.error('Erro ao carregar áreas:', error);
    } finally {
      setLoadingAreas(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const handleGenerateReport = async () => {
    setLoading(true);

    try {
      const token = await AsyncStorage.getItem('token');
      
      const params = new URLSearchParams({
        startDate: formatDate(startDate),
        endDate: formatDate(endDate),
        status: selectedStatus,
        areaId: selectedArea,
      });

      // Formatar nome do condomínio para o arquivo
      const condoName = user?.condominium?.name || 'condominio';
      const condoNameForFile = condoName
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove acentos
        .replace(/[^a-zA-Z0-9\s]/g, '') // Remove caracteres especiais
        .replace(/\s+/g, '_') // Substitui espaços por underscore
        .toLowerCase();
      
      const today = new Date();
      const dateStr = `${String(today.getDate()).padStart(2, '0')}_${String(today.getMonth() + 1).padStart(2, '0')}_${today.getFullYear()}`;
      const fileName = `${condoNameForFile}_${dateStr}.pdf`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;
      // Remover barra final do API_BASE_URL se existir para evitar dupla barra
      const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
      const downloadUrl = `${baseUrl}/reservations/report/pdf?${params}`;

      console.log('📥 Baixando relatório de:', downloadUrl);
      console.log('📁 Salvando em:', fileUri);

      // Usar FileSystem.downloadAsync para baixar o PDF diretamente
      const downloadResult = await FileSystem.downloadAsync(
        downloadUrl,
        fileUri,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log('📊 Resultado do download:', downloadResult.status, downloadResult.uri);

      if (downloadResult.status !== 200) {
        // Tentar ler o conteúdo do erro
        try {
          const errorContent = await FileSystem.readAsStringAsync(downloadResult.uri);
          console.error('❌ Conteúdo do erro:', errorContent);
        } catch (e) {
          console.error('❌ Não foi possível ler o erro');
        }
        throw new Error(`Erro ao baixar o relatório (status: ${downloadResult.status})`);
      }

      // Verificar se pode compartilhar
      const canShare = await Sharing.isAvailableAsync();
      
      if (canShare) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Relatório de Reservas',
        });
      } else {
        Alert.alert('Sucesso', `Relatório salvo em: ${fileUri}`);
      }

    } catch (error: any) {
      console.error('❌ Erro ao gerar relatório:', error);
      Alert.alert('Erro', error.message || 'Erro ao gerar relatório');
    } finally {
      setLoading(false);
    }
  };

  const renderMonthPicker = () => (
    <Modal
      visible={showMonthPicker}
      transparent
      animationType="fade"
      onRequestClose={() => setShowMonthPicker(false)}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setShowMonthPicker(false)}
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Selecionar Período</Text>

          <Text style={styles.modalLabel}>Ano</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.yearScroll}>
            {years.map((year) => (
              <TouchableOpacity
                key={year}
                style={[
                  styles.yearButton,
                  selectedYear === year && styles.yearButtonActive,
                ]}
                onPress={() => setSelectedYear(year)}
              >
                <Text
                  style={[
                    styles.yearButtonText,
                    selectedYear === year && styles.yearButtonTextActive,
                  ]}
                >
                  {year}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.modalLabel}>Mês</Text>
          <View style={styles.monthGrid}>
            {months.map((month, index) => (
              <TouchableOpacity
                key={month}
                style={[
                  styles.monthButton,
                  selectedMonth === index && styles.monthButtonActive,
                ]}
                onPress={() => {
                  setSelectedMonth(index);
                  setShowMonthPicker(false);
                }}
              >
                <Text
                  style={[
                    styles.monthButtonText,
                    selectedMonth === index && styles.monthButtonTextActive,
                  ]}
                >
                  {month.substring(0, 3)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  const renderStatusPicker = () => (
    <Modal
      visible={showStatusPicker}
      transparent
      animationType="fade"
      onRequestClose={() => setShowStatusPicker(false)}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setShowStatusPicker(false)}
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Filtrar por Status</Text>
          {statuses.map((status) => (
            <TouchableOpacity
              key={status.value}
              style={[
                styles.optionItem,
                selectedStatus === status.value && styles.optionItemActive,
              ]}
              onPress={() => {
                setSelectedStatus(status.value);
                setShowStatusPicker(false);
              }}
            >
              <Text
                style={[
                  styles.optionText,
                  selectedStatus === status.value && styles.optionTextActive,
                ]}
              >
                {status.label}
              </Text>
              {selectedStatus === status.value && (
                <Ionicons name="checkmark" size={20} color="#6366F1" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );

  const renderAreaPicker = () => (
    <Modal
      visible={showAreaPicker}
      transparent
      animationType="fade"
      onRequestClose={() => setShowAreaPicker(false)}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setShowAreaPicker(false)}
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Filtrar por Área</Text>
          <TouchableOpacity
            style={[
              styles.optionItem,
              selectedArea === 'todas' && styles.optionItemActive,
            ]}
            onPress={() => {
              setSelectedArea('todas');
              setShowAreaPicker(false);
            }}
          >
            <Text
              style={[
                styles.optionText,
                selectedArea === 'todas' && styles.optionTextActive,
              ]}
            >
              Todas as Áreas
            </Text>
            {selectedArea === 'todas' && (
              <Ionicons name="checkmark" size={20} color="#6366F1" />
            )}
          </TouchableOpacity>
          {areas.map((area) => (
            <TouchableOpacity
              key={area._id}
              style={[
                styles.optionItem,
                selectedArea === area._id && styles.optionItemActive,
              ]}
              onPress={() => {
                setSelectedArea(area._id);
                setShowAreaPicker(false);
              }}
            >
              <Text
                style={[
                  styles.optionText,
                  selectedArea === area._id && styles.optionTextActive,
                ]}
              >
                {area.name}
              </Text>
              {selectedArea === area._id && (
                <Ionicons name="checkmark" size={20} color="#6366F1" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
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
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Relatório de Reservas</Text>
            <Text style={styles.headerSubtitle}>Exporte em PDF para enviar</Text>
          </View>
          <View style={styles.headerRight} />
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Tipo de Filtro */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Período do Relatório</Text>
          <View style={styles.filterTypeContainer}>
            <TouchableOpacity
              style={[
                styles.filterTypeButton,
                filterType === 'month' && styles.filterTypeButtonActive,
              ]}
              onPress={() => setFilterType('month')}
            >
              <Ionicons
                name="calendar"
                size={20}
                color={filterType === 'month' ? '#FFFFFF' : '#6366F1'}
              />
              <Text
                style={[
                  styles.filterTypeText,
                  filterType === 'month' && styles.filterTypeTextActive,
                ]}
              >
                Por Mês
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterTypeButton,
                filterType === 'custom' && styles.filterTypeButtonActive,
              ]}
              onPress={() => setFilterType('custom')}
            >
              <Ionicons
                name="calendar-outline"
                size={20}
                color={filterType === 'custom' ? '#FFFFFF' : '#6366F1'}
              />
              <Text
                style={[
                  styles.filterTypeText,
                  filterType === 'custom' && styles.filterTypeTextActive,
                ]}
              >
                Personalizado
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Seleção de Mês */}
        {filterType === 'month' && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.selectorButton}
              onPress={() => setShowMonthPicker(true)}
            >
              <View style={styles.selectorContent}>
                <Ionicons name="calendar-outline" size={22} color="#6366F1" />
                <View style={styles.selectorTextContainer}>
                  <Text style={styles.selectorLabel}>Mês/Ano</Text>
                  <Text style={styles.selectorValue}>
                    {months[selectedMonth]} de {selectedYear}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
            </TouchableOpacity>
          </View>
        )}

        {/* Seleção de Datas Personalizadas */}
        {filterType === 'custom' && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.selectorButton}
              onPress={() => setShowStartDatePicker(true)}
            >
              <View style={styles.selectorContent}>
                <Ionicons name="calendar-outline" size={22} color="#6366F1" />
                <View style={styles.selectorTextContainer}>
                  <Text style={styles.selectorLabel}>Data Inicial</Text>
                  <Text style={styles.selectorValue}>
                    {startDate.toLocaleDateString('pt-BR')}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.selectorButton}
              onPress={() => setShowEndDatePicker(true)}
            >
              <View style={styles.selectorContent}>
                <Ionicons name="calendar-outline" size={22} color="#6366F1" />
                <View style={styles.selectorTextContainer}>
                  <Text style={styles.selectorLabel}>Data Final</Text>
                  <Text style={styles.selectorValue}>
                    {endDate.toLocaleDateString('pt-BR')}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
            </TouchableOpacity>
          </View>
        )}

        {/* DateTimePickers para Android */}
        {Platform.OS === 'android' && showStartDatePicker && (
          <DateTimePicker
            value={startDate}
            mode="date"
            display="default"
            onChange={onStartDateChange}
          />
        )}
        {Platform.OS === 'android' && showEndDatePicker && (
          <DateTimePicker
            value={endDate}
            mode="date"
            display="default"
            onChange={onEndDateChange}
          />
        )}

        {/* Modal DatePicker para iOS */}
        {Platform.OS === 'ios' && (
          <Modal
            visible={showStartDatePicker}
            transparent
            animationType="slide"
            onRequestClose={() => setShowStartDatePicker(false)}
          >
            <View style={styles.datePickerOverlay}>
              <View style={styles.datePickerContainer}>
                <View style={styles.datePickerHeader}>
                  <TouchableOpacity onPress={() => setShowStartDatePicker(false)}>
                    <Text style={styles.datePickerCancel}>Cancelar</Text>
                  </TouchableOpacity>
                  <Text style={styles.datePickerTitle}>Data Inicial</Text>
                  <TouchableOpacity onPress={() => setShowStartDatePicker(false)}>
                    <Text style={styles.datePickerDone}>Confirmar</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.datePickerContent}>
                  <DateTimePicker
                    value={startDate}
                    mode="date"
                    display="spinner"
                    onChange={(event, date) => {
                      if (date) setStartDate(date);
                    }}
                    locale="pt-BR"
                    textColor="#1E293B"
                    themeVariant="light"
                    style={styles.datePicker}
                  />
                </View>
              </View>
            </View>
          </Modal>
        )}

        {Platform.OS === 'ios' && (
          <Modal
            visible={showEndDatePicker}
            transparent
            animationType="slide"
            onRequestClose={() => setShowEndDatePicker(false)}
          >
            <View style={styles.datePickerOverlay}>
              <View style={styles.datePickerContainer}>
                <View style={styles.datePickerHeader}>
                  <TouchableOpacity onPress={() => setShowEndDatePicker(false)}>
                    <Text style={styles.datePickerCancel}>Cancelar</Text>
                  </TouchableOpacity>
                  <Text style={styles.datePickerTitle}>Data Final</Text>
                  <TouchableOpacity onPress={() => setShowEndDatePicker(false)}>
                    <Text style={styles.datePickerDone}>Confirmar</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.datePickerContent}>
                  <DateTimePicker
                    value={endDate}
                    mode="date"
                    display="spinner"
                    onChange={(event, date) => {
                      if (date) setEndDate(date);
                    }}
                    locale="pt-BR"
                    textColor="#1E293B"
                    themeVariant="light"
                    style={styles.datePicker}
                  />
                </View>
              </View>
            </View>
          </Modal>
        )}

        {/* Filtros Adicionais */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Filtros Adicionais</Text>

          <TouchableOpacity
            style={styles.selectorButton}
            onPress={() => setShowStatusPicker(true)}
          >
            <View style={styles.selectorContent}>
              <Ionicons name="flag-outline" size={22} color="#6366F1" />
              <View style={styles.selectorTextContainer}>
                <Text style={styles.selectorLabel}>Status</Text>
                <Text style={styles.selectorValue}>
                  {statuses.find(s => s.value === selectedStatus)?.label}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.selectorButton}
            onPress={() => setShowAreaPicker(true)}
            disabled={loadingAreas}
          >
            <View style={styles.selectorContent}>
              <Ionicons name="location-outline" size={22} color="#6366F1" />
              <View style={styles.selectorTextContainer}>
                <Text style={styles.selectorLabel}>Área</Text>
                <Text style={styles.selectorValue}>
                  {loadingAreas
                    ? 'Carregando...'
                    : selectedArea === 'todas'
                    ? 'Todas as Áreas'
                    : areas.find(a => a._id === selectedArea)?.name || 'Selecionar'}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        {/* Resumo */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resumo do Relatório</Text>
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Período:</Text>
              <Text style={styles.summaryValue}>
                {startDate.toLocaleDateString('pt-BR')} a {endDate.toLocaleDateString('pt-BR')}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Status:</Text>
              <Text style={styles.summaryValue}>
                {statuses.find(s => s.value === selectedStatus)?.label}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Área:</Text>
              <Text style={styles.summaryValue}>
                {selectedArea === 'todas'
                  ? 'Todas'
                  : areas.find(a => a._id === selectedArea)?.name || '-'}
              </Text>
            </View>
          </View>
        </View>

        {/* Botão Gerar */}
        <TouchableOpacity
          style={styles.generateButton}
          onPress={handleGenerateReport}
          disabled={loading}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#6366F1', '#8B5CF6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.generateButtonGradient}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="document-text-outline" size={22} color="#FFFFFF" />
                <Text style={styles.generateButtonText}>Gerar PDF</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <Text style={styles.helpText}>
          O relatório será gerado em PDF e você poderá compartilhar ou salvar no seu dispositivo.
        </Text>
      </ScrollView>

      {/* Modals */}
      {renderMonthPicker()}
      {renderStatusPicker()}
      {renderAreaPicker()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  header: {
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
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
  headerTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
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
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  filterTypeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  filterTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#6366F1',
  },
  filterTypeButtonActive: {
    backgroundColor: '#6366F1',
  },
  filterTypeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366F1',
  },
  filterTypeTextActive: {
    color: '#FFFFFF',
  },
  selectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  selectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  selectorTextContainer: {
    gap: 2,
  },
  selectorLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  selectorValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#64748B',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  generateButton: {
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
  generateButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  helpText: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 16,
    paddingHorizontal: 20,
  },
  // Modal styles
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
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 10,
    marginTop: 10,
  },
  yearScroll: {
    flexGrow: 0,
    marginBottom: 10,
  },
  yearButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    marginRight: 10,
  },
  yearButtonActive: {
    backgroundColor: '#6366F1',
  },
  yearButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  yearButtonTextActive: {
    color: '#FFFFFF',
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
  },
  monthButton: {
    width: '30%',
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  monthButtonActive: {
    backgroundColor: '#6366F1',
  },
  monthButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  monthButtonTextActive: {
    color: '#FFFFFF',
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 8,
    backgroundColor: '#F8FAFC',
  },
  optionItemActive: {
    backgroundColor: '#EEF2FF',
  },
  optionText: {
    fontSize: 15,
    color: '#475569',
  },
  optionTextActive: {
    color: '#6366F1',
    fontWeight: '600',
  },
  // DatePicker Modal styles (iOS)
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
  datePickerContent: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  datePicker: {
    height: 200,
    width: '100%',
    backgroundColor: '#FFFFFF',
  },
});

export default ReservationReportScreen;

