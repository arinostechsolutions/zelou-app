import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { condominiumsApi } from '../../api/condominiums';
import GradientHeader from '../../components/GradientHeader';

const CreateCondominiumScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    cnpj: '',
    phone: '',
    email: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    zipCode: '',
    blocks: '',
  });

  const handleCreate = async () => {
    // Validações básicas
    if (!formData.name || !formData.cnpj || !formData.street || !formData.city) {
      Alert.alert('Erro', 'Preencha todos os campos obrigatórios');
      return;
    }

    setLoading(true);
    try {
      const blocksArray = formData.blocks
        .split(',')
        .map((b) => b.trim())
        .filter((b) => b);

      await condominiumsApi.create({
        name: formData.name,
        cnpj: formData.cnpj,
        phone: formData.phone,
        email: formData.email,
        address: {
          street: formData.street,
          number: formData.number,
          complement: formData.complement,
          neighborhood: formData.neighborhood,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
        },
        blocks: blocksArray,
      });

      Alert.alert('Sucesso', 'Condomínio criado com sucesso!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert('Erro', error.response?.data?.message || 'Erro ao criar condomínio');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <GradientHeader
        title="Criar Condomínio"
        subtitle="Preencha as informações abaixo"
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Informações Básicas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações Básicas</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nome do Condomínio *</Text>
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              placeholder="Ex: Residencial Jardim das Flores"
              placeholderTextColor="#94A3B8"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>CNPJ *</Text>
            <TextInput
              style={styles.input}
              value={formData.cnpj}
              onChangeText={(text) => setFormData({ ...formData, cnpj: text })}
              placeholder="00.000.000/0000-00"
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Telefone</Text>
            <TextInput
              style={styles.input}
              value={formData.phone}
              onChangeText={(text) => setFormData({ ...formData, phone: text })}
              placeholder="(00) 00000-0000"
              placeholderTextColor="#94A3B8"
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              placeholder="contato@condominio.com"
              placeholderTextColor="#94A3B8"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        </View>

        {/* Endereço */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Endereço</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>CEP *</Text>
            <TextInput
              style={styles.input}
              value={formData.zipCode}
              onChangeText={(text) => setFormData({ ...formData, zipCode: text })}
              placeholder="00000-000"
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Rua *</Text>
            <TextInput
              style={styles.input}
              value={formData.street}
              onChangeText={(text) => setFormData({ ...formData, street: text })}
              placeholder="Nome da rua"
              placeholderTextColor="#94A3B8"
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Número *</Text>
              <TextInput
                style={styles.input}
                value={formData.number}
                onChangeText={(text) => setFormData({ ...formData, number: text })}
                placeholder="123"
                placeholderTextColor="#94A3B8"
              />
            </View>

            <View style={[styles.inputGroup, { flex: 2 }]}>
              <Text style={styles.label}>Complemento</Text>
              <TextInput
                style={styles.input}
                value={formData.complement}
                onChangeText={(text) => setFormData({ ...formData, complement: text })}
                placeholder="Apto, Bloco, etc"
                placeholderTextColor="#94A3B8"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Bairro *</Text>
            <TextInput
              style={styles.input}
              value={formData.neighborhood}
              onChangeText={(text) => setFormData({ ...formData, neighborhood: text })}
              placeholder="Nome do bairro"
              placeholderTextColor="#94A3B8"
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 2, marginRight: 8 }]}>
              <Text style={styles.label}>Cidade *</Text>
              <TextInput
                style={styles.input}
                value={formData.city}
                onChangeText={(text) => setFormData({ ...formData, city: text })}
                placeholder="Nome da cidade"
                placeholderTextColor="#94A3B8"
              />
            </View>

            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>UF *</Text>
              <TextInput
                style={styles.input}
                value={formData.state}
                onChangeText={(text) => setFormData({ ...formData, state: text.toUpperCase() })}
                placeholder="SP"
                placeholderTextColor="#94A3B8"
                maxLength={2}
                autoCapitalize="characters"
              />
            </View>
          </View>
        </View>

        {/* Blocos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Blocos</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Blocos (separados por vírgula)</Text>
            <TextInput
              style={styles.input}
              value={formData.blocks}
              onChangeText={(text) => setFormData({ ...formData, blocks: text })}
              placeholder="A, B, C, D"
              placeholderTextColor="#94A3B8"
            />
            <Text style={styles.hint}>Ex: A, B, C ou 1, 2, 3</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleCreate}
          disabled={loading}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={loading ? ['#94A3B8', '#94A3B8'] : ['#6366F1', '#8B5CF6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.buttonGradient}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
                <Text style={styles.buttonText}>Criar Condomínio</Text>
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
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 16,
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
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1E293B',
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  hint: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
  },
  button: {
    margin: 16,
    marginTop: 8,
    marginBottom: 32,
    borderRadius: 16,
    overflow: 'hidden',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    gap: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default CreateCondominiumScreen;

