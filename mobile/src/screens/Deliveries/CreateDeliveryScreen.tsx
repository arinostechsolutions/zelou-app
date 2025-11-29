import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Image,
  ActivityIndicator,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { deliveriesApi } from '../../api/deliveries';
import { usersApi, LookupResidentResponse } from '../../api/users';
import GradientHeader from '../../components/GradientHeader';

const CreateDeliveryScreen = () => {
  const navigation = useNavigation();
  const [photo, setPhoto] = useState<string | null>(null);
  const [block, setBlock] = useState('');
  const [unitNumber, setUnitNumber] = useState('');
  const [resident, setResident] = useState<LookupResidentResponse | null>(null);
  const [searchingResident, setSearchingResident] = useState(false);
  const [packageType, setPackageType] = useState('Encomenda');
  const [volumeNumber, setVolumeNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Precisamos de permissão para acessar suas fotos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setPhoto(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Precisamos de permissão para acessar sua câmera');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setPhoto(result.assets[0].uri);
    }
  };

  const handleLookupResident = async () => {
    if (!block.trim() || !unitNumber.trim()) {
      Alert.alert('Atenção', 'Informe o bloco e o número da unidade.');
      return;
    }

    setSearchingResident(true);
    try {
      const data = await usersApi.lookupResident({
        block: block.trim().toUpperCase(),
        number: unitNumber.trim(),
      });
      setResident(data);
    } catch (error: any) {
      setResident(null);
      Alert.alert('Não encontrado', error.response?.data?.message || 'Não localizamos o morador informado.');
    } finally {
      setSearchingResident(false);
    }
  };

  const handleSubmit = async () => {
    if (!photo || !resident) {
      Alert.alert('Erro', 'Selecione o morador e adicione a foto da encomenda.');
      return;
    }

    // In a real app, you'd upload the photo to a storage service (S3, Cloudinary, etc.)
    // For now, we'll use the local URI
    setLoading(true);
    try {
      await deliveriesApi.create({
        residentId: resident._id,
        photoUrl: photo, // This should be the uploaded URL in production
        packageType,
        volumeNumber: volumeNumber || undefined,
        notes: notes || undefined,
      });
      Alert.alert('Sucesso', 'Entrega registrada com sucesso');
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Erro', error.response?.data?.message || 'Erro ao registrar entrega');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <GradientHeader
        title="Registrar Entrega"
        subtitle="Preencha os dados da encomenda"
        onBackPress={() => navigation.goBack()}
      />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <TouchableOpacity style={styles.photoButton} onPress={pickImage}>
          {photo ? (
            <Image source={{ uri: photo }} style={styles.photo} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Text style={styles.photoPlaceholderText}>Tocar para adicionar foto</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.cameraButton} onPress={takePhoto}>
          <Text style={styles.cameraButtonText}>Tirar Foto</Text>
        </TouchableOpacity>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Identificar destinatário</Text>
          <View style={styles.row}>
            <View style={[styles.formGroup, styles.half]}>
              <Text style={styles.label}>Bloco</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: A"
                autoCapitalize="characters"
                value={block}
                onChangeText={setBlock}
              />
            </View>
            <View style={[styles.formGroup, styles.half]}>
              <Text style={styles.label}>Unidade</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: 101"
                value={unitNumber}
                onChangeText={setUnitNumber}
                keyboardType="numeric"
              />
            </View>
          </View>
          <TouchableOpacity
            style={styles.lookupButton}
            onPress={handleLookupResident}
            activeOpacity={0.8}
            disabled={searchingResident}
          >
            {searchingResident ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.lookupButtonText}>Buscar Morador</Text>
            )}
          </TouchableOpacity>

          {resident ? (
            <View style={styles.residentCard}>
              <View style={styles.residentHeader}>
                <View>
                  <Text style={styles.residentName}>{resident.name}</Text>
                  <Text style={styles.residentInfo}>
                    Bloco {resident.unit.block} · Unidade {resident.unit.number}
                  </Text>
                  <Text style={styles.residentInfo}>{resident.email}</Text>
                  <Text style={styles.residentInfo}>{resident.phone}</Text>
                </View>
                <TouchableOpacity onPress={() => setResident(null)}>
                  <Ionicons name="close" size={20} color="#94A3B8" />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <Text style={styles.helperText}>
              Informe o bloco e a unidade para localizar automaticamente o morador.
            </Text>
          )}
        </View>

        <TextInput
          style={styles.input}
          placeholder="Tipo de encomenda"
          value={packageType}
          onChangeText={setPackageType}
        />

        <TextInput
          style={styles.input}
          placeholder="Número de volumes (opcional)"
          value={volumeNumber}
          onChangeText={setVolumeNumber}
          keyboardType="numeric"
        />

        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Observações (opcional)"
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={4}
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Registrando...' : 'Registrar Entrega'}
          </Text>
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
  photoButton: {
    marginBottom: 16,
  },
  photo: {
    width: '100%',
    height: 200,
    borderRadius: 16,
  },
  photoPlaceholder: {
    width: '100%',
    height: 200,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  photoPlaceholderText: {
    color: '#94A3B8',
    fontSize: 16,
    fontWeight: '500',
  },
  cameraButton: {
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
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
  cameraButtonText: {
    color: '#6366F1',
    fontSize: 16,
    fontWeight: '600',
  },
  input: {
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
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
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    color: '#1E293B',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  formGroup: {
    flex: 1,
  },
  half: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
    color: '#475569',
  },
  lookupButton: {
    backgroundColor: '#6366F1',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
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
  lookupButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  residentCard: {
    borderWidth: 2,
    borderColor: '#10B981',
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#F0FDF4',
  },
  residentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  residentName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  residentInfo: {
    fontSize: 14,
    color: '#475569',
    marginTop: 4,
  },
  helperText: {
    fontSize: 13,
    color: '#94A3B8',
  },
  button: {
    backgroundColor: '#6366F1',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
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
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default CreateDeliveryScreen;


