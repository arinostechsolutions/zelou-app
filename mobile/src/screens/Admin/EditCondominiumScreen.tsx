import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { condominiumsApi, Condominium } from '../../api/condominiums';
import GradientHeader from '../../components/GradientHeader';

type EditCondominiumRouteProp = RouteProp<{ EditCondominium: { id: string } }, 'EditCondominium'>;

const EditCondominiumScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<EditCondominiumRouteProp>();
  const { id } = route.params;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [condominium, setCondominium] = useState<Condominium | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [complement, setComplement] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [blocks, setBlocks] = useState('');

  useEffect(() => {
    loadCondominium();
  }, [id]);

  const loadCondominium = async () => {
    try {
      const data = await condominiumsApi.getById(id);
      setCondominium(data);
      setName(data.name);
      setCnpj(data.cnpj);
      setPhone(data.phone || '');
      setEmail(data.email || '');
      setStreet(data.address.street);
      setNumber(data.address.number);
      setComplement(data.address.complement || '');
      setNeighborhood(data.address.neighborhood);
      setCity(data.address.city);
      setState(data.address.state);
      setZipCode(data.address.zipCode);
      setBlocks(data.blocks.join(', '));
    } catch (error: any) {
      console.error('Erro ao carregar condomínio:', error);
      Alert.alert('Erro', 'Não foi possível carregar os dados do condomínio.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim() || !cnpj.trim() || !street.trim() || !city.trim()) {
      Alert.alert('Erro', 'Preencha todos os campos obrigatórios.');
      return;
    }

    setSaving(true);
    try {
      const blocksArray = blocks
        .split(',')
        .map((b) => b.trim())
        .filter((b) => b);

      const updatedData = {
        name: name.trim(),
        cnpj: cnpj.trim(),
        phone: phone.trim(),
        email: email.trim(),
        address: {
          street: street.trim(),
          number: number.trim(),
          complement: complement.trim(),
          neighborhood: neighborhood.trim(),
          city: city.trim(),
          state: state.trim(),
          zipCode: zipCode.trim(),
        },
        blocks: blocksArray.length > 0 ? blocksArray : ['Único'],
      };

      await condominiumsApi.update(id, updatedData);
      Alert.alert('Sucesso', 'Condomínio atualizado com sucesso!', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error: any) {
      console.error('Erro ao atualizar condomínio:', error);
      Alert.alert(
        'Erro',
        error.response?.data?.message || 'Não foi possível atualizar o condomínio.'
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  if (!condominium) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Condomínio não encontrado</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <GradientHeader
        title="Editar Condomínio"
        subtitle="Atualize as informações do condomínio"
        onBackPress={() => navigation.goBack()}
      />

      <KeyboardAwareScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        enableOnAndroid={true}
        extraScrollHeight={20}
        showsVerticalScrollIndicator={false}
      >
        {/* Informações Básicas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações Básicas</Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Nome do Condomínio *</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="business-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Nome do condomínio"
                placeholderTextColor="#94A3B8"
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>CNPJ *</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="document-text-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={cnpj}
                onChangeText={setCnpj}
                placeholder="00.000.000/0000-00"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
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
                onChangeText={setPhone}
                placeholder="(00) 0000-0000"
                placeholderTextColor="#94A3B8"
                keyboardType="phone-pad"
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
                placeholder="contato@condominio.com"
                placeholderTextColor="#94A3B8"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>
        </View>

        {/* Endereço */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Endereço</Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>CEP *</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="location-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={zipCode}
                onChangeText={setZipCode}
                placeholder="00000-000"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.formGroup, { flex: 3 }]}>
              <Text style={styles.label}>Rua *</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  value={street}
                  onChangeText={setStreet}
                  placeholder="Rua"
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </View>

            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={styles.label}>Número *</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  value={number}
                  onChangeText={setNumber}
                  placeholder="Nº"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Complemento</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={complement}
                onChangeText={setComplement}
                placeholder="Apto, bloco, etc"
                placeholderTextColor="#94A3B8"
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Bairro *</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={neighborhood}
                onChangeText={setNeighborhood}
                placeholder="Bairro"
                placeholderTextColor="#94A3B8"
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.formGroup, { flex: 3 }]}>
              <Text style={styles.label}>Cidade *</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  value={city}
                  onChangeText={setCity}
                  placeholder="Cidade"
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </View>

            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={styles.label}>UF *</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  value={state}
                  onChangeText={setState}
                  placeholder="UF"
                  placeholderTextColor="#94A3B8"
                  maxLength={2}
                  autoCapitalize="characters"
                />
              </View>
            </View>
          </View>
        </View>

        {/* Blocos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Blocos</Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Blocos (separados por vírgula)</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="grid-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={blocks}
                onChangeText={setBlocks}
                placeholder="A, B, C ou Torre Única"
                placeholderTextColor="#94A3B8"
              />
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
  row: {
    flexDirection: 'row',
    gap: 12,
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
});

export default EditCondominiumScreen;

