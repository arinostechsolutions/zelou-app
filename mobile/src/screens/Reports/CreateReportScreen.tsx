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
  FlatList,
  Platform,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Picker } from '@react-native-picker/picker';
import { useNavigation } from '@react-navigation/native';
import { reportsApi } from '../../api/reports';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import GradientHeader from '../../components/GradientHeader';

const CATEGORIES = [
  'Elétrica',
  'Hidráulica',
  'Limpeza',
  'Segurança',
  'Infraestrutura',
  'Outro',
];

const LOCATIONS = [
  'Churrasqueira',
  'Garagem',
  'Elevador',
  'Hall',
  'Área comum',
  'Outro',
];

const CreateReportScreen = () => {
  const navigation = useNavigation();
  const [photos, setPhotos] = useState<string[]>([]);
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
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
      allowsMultipleSelection: true,
    });

    if (!result.canceled) {
      setPhotos([...photos, ...result.assets.map((asset) => asset.uri)]);
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
      setPhotos([...photos, result.assets[0].uri]);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!photos.length || !category || !description || !location) {
      Alert.alert('Erro', 'Preencha todos os campos obrigatórios');
      return;
    }

    setLoading(true);
    try {
      await reportsApi.create({
        photos,
        category,
        description,
        location,
      });
      Alert.alert('Sucesso', 'Irregularidade registrada com sucesso', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error: any) {
      Alert.alert('Erro', error.response?.data?.message || 'Erro ao registrar irregularidade');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <GradientHeader
        title="Nova Irregularidade"
        subtitle="Registrar ocorrência"
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Fotos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="camera-outline" size={18} color="#1E293B" /> Fotos *
          </Text>
          
          <FlatList
            horizontal
            data={photos}
            renderItem={({ item, index }) => (
              <View style={styles.photoContainer}>
                <Image source={{ uri: item }} style={styles.photo} />
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removePhoto(index)}
                >
                  <Ionicons name="close" size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            )}
            keyExtractor={(_, index) => index.toString()}
            showsHorizontalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.photoPlaceholder}>
                <Ionicons name="images-outline" size={32} color="#94A3B8" />
                <Text style={styles.photoPlaceholderText}>Nenhuma foto</Text>
              </View>
            }
            contentContainerStyle={styles.photosList}
          />

          <View style={styles.photoActions}>
            <TouchableOpacity 
              style={styles.photoActionButton} 
              onPress={pickImage}
              activeOpacity={0.7}
            >
              <Ionicons name="images-outline" size={20} color="#6366F1" />
              <Text style={styles.photoActionText}>Galeria</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.photoActionButton} 
              onPress={takePhoto}
              activeOpacity={0.7}
            >
              <Ionicons name="camera-outline" size={20} color="#6366F1" />
              <Text style={styles.photoActionText}>Câmera</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Categoria */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Categoria *</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={category}
              onValueChange={setCategory}
              style={styles.picker}
            >
              <Picker.Item label="Selecione uma categoria" value="" />
              {CATEGORIES.map((cat) => (
                <Picker.Item key={cat} label={cat} value={cat} />
              ))}
            </Picker>
          </View>
        </View>

        {/* Local */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Local *</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={location}
              onValueChange={setLocation}
              style={styles.picker}
            >
              <Picker.Item label="Selecione um local" value="" />
              {LOCATIONS.map((loc) => (
                <Picker.Item key={loc} label={loc} value={loc} />
              ))}
            </Picker>
          </View>
        </View>

        {/* Descrição */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Descrição *</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Descreva a irregularidade em detalhes..."
            placeholderTextColor="#94A3B8"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
        </View>

        {/* Botão Enviar */}
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
                <Ionicons name="warning-outline" size={24} color="#FFFFFF" />
                <Text style={styles.submitButtonText}>Registrar Irregularidade</Text>
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
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 12,
  },
  photosList: {
    marginBottom: 12,
  },
  photoContainer: {
    marginRight: 12,
    position: 'relative',
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
  },
  removeButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#EF4444',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  photoPlaceholder: {
    width: 120,
    height: 120,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  photoPlaceholderText: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 4,
  },
  photoActions: {
    flexDirection: 'row',
    gap: 12,
  },
  photoActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#EEF2FF',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  photoActionText: {
    color: '#6366F1',
    fontSize: 14,
    fontWeight: '600',
  },
  pickerContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  textArea: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    padding: 14,
    fontSize: 15,
    color: '#1E293B',
    minHeight: 120,
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

export default CreateReportScreen;
