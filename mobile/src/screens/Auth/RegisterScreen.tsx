import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { Picker } from '@react-native-picker/picker';

const RegisterScreen = () => {
  const navigation = useNavigation();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    cpf: '',
    phone: '',
    role: 'morador' as 'morador' | 'porteiro' | 'zelador' | 'sindico',
    block: '',
    number: '',
    inviteCode: '',
  });
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!formData.name || !formData.email || !formData.password || !formData.cpf ||
        !formData.phone || !formData.block || !formData.number) {
      Alert.alert('Erro', 'Preencha todos os campos obrigatórios');
      return;
    }

    setLoading(true);
    try {
      await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        cpf: formData.cpf,
        phone: formData.phone,
        role: formData.role,
        unit: {
          block: formData.block,
          number: formData.number,
        },
        inviteCode: formData.inviteCode || undefined,
      });
    } catch (error: any) {
      console.error('Erro ao registrar:', error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          'Erro ao criar conta';
      Alert.alert('Erro', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>← Voltar</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>Criar Conta</Text>

          <TextInput
            style={styles.input}
            placeholder="Nome completo"
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
          />

          <TextInput
            style={styles.input}
            placeholder="Email"
            value={formData.email}
            onChangeText={(text) => setFormData({ ...formData, email: text })}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <TextInput
            style={styles.input}
            placeholder="CPF"
            value={formData.cpf}
            onChangeText={(text) => setFormData({ ...formData, cpf: text })}
            keyboardType="numeric"
          />

          <TextInput
            style={styles.input}
            placeholder="Telefone"
            value={formData.phone}
            onChangeText={(text) => setFormData({ ...formData, phone: text })}
            keyboardType="phone-pad"
          />

          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.role}
              onValueChange={(value) => setFormData({ ...formData, role: value })}
              style={styles.picker}
            >
              <Picker.Item label="Morador" value="morador" />
              <Picker.Item label="Porteiro" value="porteiro" />
              <Picker.Item label="Zelador" value="zelador" />
              <Picker.Item label="Síndico" value="sindico" />
            </Picker>
          </View>

          <TextInput
            style={styles.input}
            placeholder="Bloco"
            value={formData.block}
            onChangeText={(text) => setFormData({ ...formData, block: text })}
          />

          <TextInput
            style={styles.input}
            placeholder="Número da unidade (apto)"
            value={formData.number}
            onChangeText={(text) => setFormData({ ...formData, number: text })}
            keyboardType="numeric"
          />

          <TextInput
            style={styles.input}
            placeholder="Código de convite (opcional)"
            value={formData.inviteCode}
            onChangeText={(text) => setFormData({ ...formData, inviteCode: text })}
          />

          <TextInput
            style={styles.input}
            placeholder="Senha (mínimo 6 caracteres)"
            value={formData.password}
            onChangeText={(text) => setFormData({ ...formData, password: text })}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            <Text style={styles.buttonText}>{loading ? 'Criando conta...' : 'Criar Conta'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    marginTop: 40,
    marginBottom: 20,
  },
  backButton: {
    fontSize: 16,
    color: '#007AFF',
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#f9f9f9',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 16,
    backgroundColor: '#f9f9f9',
  },
  picker: {
    height: 50,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default RegisterScreen;

