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
import { useNavigation } from '@react-navigation/native';
import { visitorsApi } from '../../api/visitors';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import GradientHeader from '../../components/GradientHeader';

const CreateVisitorScreen = () => {
  const navigation = useNavigation();
  const [name, setName] = useState('');
  const [cpf, setCpf] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const formatCPF = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{0,3})(\d{0,3})(\d{0,3})(\d{0,2})$/);
    if (match) {
      return [match[1], match[2], match[3], match[4]]
        .filter(Boolean)
        .join('.')
        .replace(/\.(\d{2})$/, '-$1');
    }
    return text;
  };

  const handleCPFChange = (text: string) => {
    setCpf(formatCPF(text));
  };

  const handleSubmit = async () => {
    if (!name || !reason) {
      Alert.alert('Erro', 'Preencha todos os campos obrigatórios');
      return;
    }

    setLoading(true);
    try {
      await visitorsApi.create({ 
        name, 
        cpf: cpf ? cpf.replace(/\D/g, '') : undefined, 
        reason 
      });
      Alert.alert('Sucesso', 'Visitante registrado com sucesso', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error: any) {
      Alert.alert('Erro', error.response?.data?.message || 'Erro ao registrar visitante');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <GradientHeader
        title="Novo Visitante"
        subtitle="Agendar visita"
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Informações do Visitante */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações do Visitante</Text>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Nome completo *</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Digite o nome do visitante"
                placeholderTextColor="#94A3B8"
                value={name}
                onChangeText={setName}
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>CPF (opcional)</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="card-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="000.000.000-00"
                placeholderTextColor="#94A3B8"
                value={cpf}
                onChangeText={handleCPFChange}
                keyboardType="numeric"
                maxLength={14}
              />
            </View>
          </View>
        </View>

        {/* Motivo da Visita */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Motivo da Visita *</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Descreva o motivo da visita..."
            placeholderTextColor="#94A3B8"
            value={reason}
            onChangeText={setReason}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Dicas */}
        <View style={styles.tipsCard}>
          <View style={styles.tipsHeader}>
            <Ionicons name="information-circle-outline" size={20} color="#6366F1" />
            <Text style={styles.tipsTitle}>Informações</Text>
          </View>
          <Text style={styles.tipsText}>
            • O visitante será notificado na portaria{'\n'}
            • O porteiro liberará a entrada após verificação{'\n'}
            • Você receberá uma notificação quando o visitante chegar
          </Text>
        </View>

        {/* Botão Registrar */}
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
                <Ionicons name="person-add-outline" size={24} color="#FFFFFF" />
                <Text style={styles.submitButtonText}>Registrar Visitante</Text>
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
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    padding: 14,
    fontSize: 15,
    color: '#1E293B',
    minHeight: 100,
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
});

export default CreateVisitorScreen;
