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
import { usersApi } from '../../api/users';
import { condominiumsApi, Condominium } from '../../api/condominiums';
import { useAuth } from '../../contexts/AuthContext';
import GradientHeader from '../../components/GradientHeader';

type CreateUserRouteProp = RouteProp<{ CreateUser: { condominiumId?: string } }, 'CreateUser'>;

const CreateUserScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<CreateUserRouteProp>();
  const { user: currentUser } = useAuth();

  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cpf, setCpf] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('morador');
  const [block, setBlock] = useState('');
  const [unitNumber, setUnitNumber] = useState('');
  const [condominiums, setCondominiums] = useState<Condominium[]>([]);
  const [condoModalVisible, setCondoModalVisible] = useState(false);
  
  // Determinar se é master admin
  const isMasterAdmin = currentUser?.isMasterAdmin || currentUser?.role === 'master';
  
  // Para não-master, usar o condomínio do usuário logado
  // Para master, usar o passado por parâmetro ou selecionar
  const userCondominiumId = currentUser?.condominium?._id || (currentUser?.condominium as any);
  const initialCondominiumId = isMasterAdmin 
    ? route.params?.condominiumId 
    : userCondominiumId;
  
  const [selectedCondominiumId, setSelectedCondominiumId] = useState<string | undefined>(
    initialCondominiumId
  );
  const selectedCondominium = condominiums.find((c) => c._id === selectedCondominiumId);
  const selectedCondominiumLabel =
    selectedCondominium?.name ||
    currentUser?.condominium?.name ||
    (selectedCondominiumId ? 'Condomínio selecionado' : 'Nenhum selecionado');

  useEffect(() => {
    const loadCondominiums = async () => {
      try {
        const data = await condominiumsApi.getAll();
        setCondominiums(data);
        if (isMasterAdmin && route.params?.condominiumId) {
          const existing = data.find((c) => c._id === route.params?.condominiumId);
          if (!existing) {
            setSelectedCondominiumId(undefined);
          }
        }
      } catch (error) {
        console.error('Erro ao carregar condomínios:', error);
      }
    };

    // Só carregar lista de condomínios se for master admin
    if (isMasterAdmin) {
      loadCondominiums();
    }
  }, [isMasterAdmin, route.params?.condominiumId]);

  useEffect(() => {
    // Para master admin, usar o parâmetro da rota
    if (isMasterAdmin && route.params?.condominiumId) {
      setSelectedCondominiumId(route.params.condominiumId);
    }
    // Para síndico/zelador, usar o condomínio do usuário logado
    else if (!isMasterAdmin && userCondominiumId) {
      setSelectedCondominiumId(userCondominiumId);
    }
  }, [isMasterAdmin, route.params?.condominiumId, userCondominiumId]);

  const handleCreate = async () => {
    // Para não-master, sempre usar o condomínio do usuário logado
    const targetCondominiumId = isMasterAdmin
      ? selectedCondominiumId
      : userCondominiumId;

    if (!targetCondominiumId) {
      Alert.alert('Erro', 'Não foi possível identificar o condomínio. Faça login novamente.');
      return;
    }
    // Validações
    if (!name.trim() || !email.trim() || !password.trim() || !cpf.trim() || !phone.trim()) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos obrigatórios.');
      return;
    }
    const requiresUnitInfo = role === 'morador';

    if (
      requiresUnitInfo &&
      (!block.trim() || !unitNumber.trim())
    ) {
      Alert.alert('Erro', 'Por favor, informe o bloco e número da unidade.');
      return;
    }

    setLoading(true);
    try {
      const userData = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: password.trim(),
        cpf: cpf.trim(),
        phone: phone.trim(),
        role,
        unit: {
          block: role === 'morador' ? block.trim() : block.trim() || 'Geral',
          number: role === 'morador' ? unitNumber.trim() : unitNumber.trim() || 'SN',
        },
        condominium: targetCondominiumId,
      };

      await usersApi.create(userData);
      Alert.alert('Sucesso', 'Usuário criado com sucesso!', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error: any) {
      console.error('Erro ao criar usuário:', error);
      Alert.alert(
        'Erro',
        error.response?.data?.message || 'Não foi possível criar o usuário.'
      );
    } finally {
      setLoading(false);
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

  const getAvailableRoles = () => {
    if (isMasterAdmin) {
      return ['sindico', 'zelador', 'porteiro', 'morador'];
    }
    if (currentUser?.role === 'sindico') {
      return ['zelador', 'porteiro', 'morador'];
    }
    if (currentUser?.role === 'zelador') {
      return ['porteiro', 'morador'];
    }
    return ['morador'];
  };

  const availableRoles = getAvailableRoles();

  useEffect(() => {
    if (!availableRoles.includes(role)) {
      setRole(availableRoles[0]);
    }
  }, [availableRoles, role]);

  return (
    <View style={styles.container}>
      <GradientHeader
        title="Criar Usuário"
        subtitle="Preencha os dados do novo usuário"
        onBackPress={() => navigation.goBack()}
      />

      <KeyboardAwareScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        enableOnAndroid={true}
        extraScrollHeight={20}
        showsVerticalScrollIndicator={false}
      >
        {/* Só mostrar seletor de condomínio para Master Admin */}
        {isMasterAdmin && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Condomínio</Text>
            <TouchableOpacity
              style={styles.condoSelector}
              activeOpacity={0.7}
              onPress={() => setCondoModalVisible(true)}
            >
              <View style={styles.condoSelectorContent}>
                <Text style={styles.condoSelectorLabel}>Selecione o condomínio</Text>
                <Text style={styles.condoSelectorValue}>{selectedCondominiumLabel}</Text>
              </View>
              <Ionicons name="chevron-down" size={20} color="#94A3B8" />
            </TouchableOpacity>
          </View>
        )}
        
        {/* Mostrar condomínio atual para síndico/zelador (apenas informativo) */}
        {!isMasterAdmin && currentUser?.condominium?.name && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Condomínio</Text>
            <View style={[styles.condoSelector, { backgroundColor: '#F1F5F9' }]}>
              <View style={styles.condoSelectorContent}>
                <Text style={styles.condoSelectorLabel}>Usuário será cadastrado em</Text>
                <Text style={styles.condoSelectorValue}>{currentUser.condominium.name}</Text>
              </View>
              <Ionicons name="business" size={20} color="#6366F1" />
            </View>
          </View>
        )}

        {/* Informações Pessoais */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações Pessoais</Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Nome Completo *</Text>
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
            <Text style={styles.label}>Email *</Text>
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
            <Text style={styles.label}>Senha *</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Senha (mínimo 6 caracteres)"
                placeholderTextColor="#94A3B8"
                secureTextEntry
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>CPF *</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="card-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={cpf}
                onChangeText={setCpf}
                placeholder="000.000.000-00"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Telefone *</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="call-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="(00) 00000-0000"
                placeholderTextColor="#94A3B8"
                keyboardType="phone-pad"
              />
            </View>
          </View>
        </View>

        {/* Função */}
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

        {/* Unidade */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Unidade</Text>
          <Text style={styles.optionalHint}>
            {role === 'morador'
              ? 'Bloco e unidade são obrigatórios para moradores.'
              : 'Opcional para síndicos, zeladores e porteiros.'}
          </Text>

          <View style={styles.row}>
            <View style={[styles.formGroup, styles.halfWidth]}>
              <Text style={styles.label}>
                Bloco {role === 'morador' ? '*' : '(opcional)'}
              </Text>
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
              <Text style={styles.label}>
                Número {role === 'morador' ? '*' : '(opcional)'}
              </Text>
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

        {/* Botão Criar */}
        <TouchableOpacity
          style={styles.createButton}
          onPress={handleCreate}
          disabled={loading}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#6366F1', '#8B5CF6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.createButtonGradient}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="person-add-outline" size={24} color="#FFFFFF" />
                <Text style={styles.createButtonText}>Criar Usuário</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </KeyboardAwareScrollView>

      {/* Modal de seleção de condomínio */}
      <Modal
        animationType="slide"
        transparent
        visible={condoModalVisible}
        onRequestClose={() => setCondoModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Escolher Condomínio</Text>
              <TouchableOpacity onPress={() => setCondoModalVisible(false)}>
                <Ionicons name="close" size={24} color="#475569" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalList}>
              {condominiums.map((condominium) => (
                <TouchableOpacity
                  key={condominium._id}
                  style={[
                    styles.modalItem,
                    selectedCondominiumId === condominium._id && styles.modalItemSelected,
                  ]}
                  onPress={() => {
                    setSelectedCondominiumId(condominium._id);
                    setCondoModalVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalItemText,
                      selectedCondominiumId === condominium._id && styles.modalItemTextSelected,
                    ]}
                  >
                    {condominium.name}
                  </Text>
                  <Text style={styles.modalItemSubText}>
                    {condominium.address.city} - {condominium.address.state}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
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
  createButton: {
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
  createButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 12,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  optionalHint: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 8,
  },
  condoSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  condoSelectorContent: {
    flex: 1,
    marginRight: 12,
  },
  condoSelectorLabel: {
    fontSize: 12,
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  condoSelectorValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
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
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
  },
  modalList: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  modalItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalItemSelected: {
    backgroundColor: '#EEF2FF',
  },
  modalItemText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  modalItemTextSelected: {
    color: '#4C1D95',
  },
  modalItemSubText: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 2,
  },
});

export default CreateUserScreen;

