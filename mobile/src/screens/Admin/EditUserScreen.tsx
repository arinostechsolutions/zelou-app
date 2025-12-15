import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
  Modal,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { usersApi, User } from '../../api/users';
import { useAuth } from '../../contexts/AuthContext';
import GradientHeader from '../../components/GradientHeader';

type EditUserRouteProp = RouteProp<{ EditUser: { userId: string } }, 'EditUser'>;

const EditUserScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<EditUserRouteProp>();
  const { userId } = route.params;
  const { user: currentUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [successModalVisible, setSuccessModalVisible] = useState(false);

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [cpf, setCpf] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('');
  const [block, setBlock] = useState('');
  const [unitNumber, setUnitNumber] = useState('');

  useEffect(() => {
    loadUser();
  }, [userId]);

  const formatCPF = (value: string) => {
    if (!value) return '';
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
    if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`;
  };

  const formatPhone = (value: string) => {
    if (!value) return '';
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

  const loadUser = async () => {
    try {
      const data = await usersApi.getById(userId);
      setUser(data);
      setName(data.name || '');
      setEmail(data.email || '');
      // Aplicar máscara ao carregar - tratar null/undefined
      setCpf(data.cpf ? formatCPF(data.cpf) : '');
      setPhone(data.phone ? formatPhone(data.phone) : '');
      setRole(data.role || '');
      setBlock(data.unit?.block || '');
      setUnitNumber(data.unit?.number || '');
    } catch (error: any) {
      console.error('Erro ao carregar usuário:', error);
      Alert.alert('Erro', 'Não foi possível carregar os dados do usuário.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // Validações - garantir que não são null/undefined
    const nameValue = (name || '').trim();
    const emailValue = (email || '').trim();
    const cpfValue = (cpf || '').replace(/\D/g, '');
    const phoneValue = (phone || '').replace(/\D/g, '');
    const blockValue = (block || '').trim();
    const unitNumberValue = (unitNumber || '').trim();
    
    if (!nameValue) {
      Alert.alert('Erro', 'Por favor, informe o nome.');
      return;
    }
    if (!emailValue) {
      Alert.alert('Erro', 'Por favor, informe o email.');
      return;
    }
    if (!cpfValue || cpfValue.length !== 11) {
      Alert.alert('Erro', 'Por favor, informe um CPF válido.');
      return;
    }
    if (!phoneValue || phoneValue.length < 10) {
      Alert.alert('Erro', 'Por favor, informe um telefone válido.');
      return;
    }
    // Bloco é opcional - alguns condomínios não têm blocos/torres
    if (!unitNumberValue) {
      Alert.alert('Erro', 'Por favor, informe o número da unidade.');
      return;
    }

    setSaving(true);
    try {
      const updatedData = {
        name: nameValue,
        email: emailValue.toLowerCase(),
        cpf: cpfValue,
        phone: phoneValue,
        role: role || 'morador',
        unit: {
          block: blockValue || undefined,  // Opcional
          number: unitNumberValue,
        },
      };

      await usersApi.update(userId, updatedData);
      setSuccessModalVisible(true);
    } catch (error: any) {
      console.error('Erro ao atualizar usuário:', error);
      Alert.alert(
        'Erro',
        error.response?.data?.message || 'Não foi possível atualizar o usuário.'
      );
    } finally {
      setSaving(false);
    }
  };

  const getRoleLabel = (roleKey: string) => {
    const labels: Record<string, string> = {
      master: 'Master Admin',
      sindico: 'Síndico',
      zelador: 'Zelador',
      porteiro: 'Porteiro',
      morador: 'Morador',
    };
    return labels[roleKey] || roleKey;
  };

  const getRoleColor = (roleKey: string) => {
    const colors: Record<string, string> = {
      master: '#DC2626',
      sindico: '#6366F1',
      zelador: '#F59E0B',
      porteiro: '#10B981',
      morador: '#8B5CF6',
    };
    return colors[roleKey] || '#64748B';
  };

  // Determinar quais roles o usuário atual pode atribuir
  const getAvailableRoles = () => {
    if (currentUser?.isMasterAdmin) {
      return ['master', 'sindico', 'zelador', 'porteiro', 'morador'];
    }
    if (currentUser?.role === 'sindico') {
      return ['zelador', 'porteiro', 'morador'];
    }
    if (currentUser?.role === 'zelador') {
      return ['porteiro', 'morador'];
    }
    return [];
  };

  const availableRoles = getAvailableRoles();

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Usuário não encontrado</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <GradientHeader
        title="Editar Usuário"
        onBackPress={() => navigation.goBack()}
      />

      <KeyboardAwareScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        enableOnAndroid={true}
        extraScrollHeight={20}
        showsVerticalScrollIndicator={false}
      >
        {/* Informações Pessoais */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações Pessoais</Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Nome Completo</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Nome completo"
                placeholderTextColor="#94A3B8"
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="email@exemplo.com"
                placeholderTextColor="#94A3B8"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>CPF</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="card-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={cpf}
                onChangeText={(text) => setCpf(formatCPF(text))}
                placeholder="000.000.000-00"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                maxLength={14}
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Telefone</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="call-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={(text) => setPhone(formatPhone(text))}
                placeholder="(00) 00000-0000"
                placeholderTextColor="#94A3B8"
                keyboardType="phone-pad"
                maxLength={15}
              />
            </View>
          </View>
        </View>

        {/* Função */}
        {availableRoles.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Função</Text>
            <View style={styles.rolesContainer}>
              {availableRoles.map((roleKey) => (
                <TouchableOpacity
                  key={roleKey}
                  style={[
                    styles.roleChip,
                    role === roleKey && {
                      backgroundColor: getRoleColor(roleKey),
                      borderColor: getRoleColor(roleKey),
                    },
                  ]}
                  onPress={() => setRole(roleKey)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.roleChipText,
                      role === roleKey && styles.roleChipTextActive,
                    ]}
                  >
                    {getRoleLabel(roleKey)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Unidade */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Unidade</Text>

          <View style={styles.row}>
            <View style={[styles.formGroup, styles.halfWidth]}>
              <Text style={styles.label}>Bloco (opcional)</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="business-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={block}
                  onChangeText={setBlock}
                  placeholder="Ex: A"
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </View>

            <View style={[styles.formGroup, styles.halfWidth]}>
              <Text style={styles.label}>Número</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="home-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={unitNumber}
                  onChangeText={setUnitNumber}
                  placeholder="Ex: 101"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>
        </View>

        {/* Botão Salvar */}
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#6366F1', '#8B5CF6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.saveButtonGradient}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={24} color="#FFFFFF" />
                <Text style={styles.saveButtonText}>Salvar Alterações</Text>
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
            <View style={styles.successIconContainer}>
              <Ionicons name="checkmark-circle" size={64} color="#10B981" />
            </View>
            <Text style={styles.modalTitle}>Sucesso!</Text>
            <Text style={styles.modalMessage}>Usuário atualizado com sucesso!</Text>
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
  },
  errorText: {
    fontSize: 16,
    color: '#94A3B8',
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
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
        elevation: 4,
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
  rolesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  roleChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  roleChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  roleChipTextActive: {
    color: '#FFFFFF',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  saveButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  saveButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 12,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
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
        shadowOpacity: 0.25,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  successIconContainer: {
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  modalButton: {
    borderRadius: 12,
    overflow: 'hidden',
    width: '100%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  modalButtonGradient: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default EditUserScreen;

