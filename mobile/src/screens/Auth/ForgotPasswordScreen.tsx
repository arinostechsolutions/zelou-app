import React, { useState, useRef } from 'react';
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
  StatusBar,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { authApi } from '../../api/auth';

const { width } = Dimensions.get('window');

const ForgotPasswordScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const codeInputs = useRef<(TextInput | null)[]>([]);
  const [codeDigits, setCodeDigits] = useState(['', '', '', '', '', '']);

  const handleSendCode = async () => {
    if (!email.trim() || !email.includes('@')) {
      Alert.alert('Atenção', 'Digite um email válido');
      return;
    }

    setLoading(true);
    try {
      await authApi.forgotPassword(email.trim().toLowerCase());
      Alert.alert(
        'Código Enviado! 📧',
        'Verifique sua caixa de entrada e spam. O código expira em 15 minutos.',
        [{ text: 'OK', onPress: () => setStep(2) }]
      );
    } catch (error: any) {
      Alert.alert('Erro', error.response?.data?.message || 'Erro ao enviar código');
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (text: string, index: number) => {
    const newDigits = [...codeDigits];
    newDigits[index] = text;
    setCodeDigits(newDigits);

    if (text && index < 5) {
      codeInputs.current[index + 1]?.focus();
    }
  };

  const handleCodeKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !codeDigits[index] && index > 0) {
      codeInputs.current[index - 1]?.focus();
    }
  };

  const handleVerifyCode = async () => {
    const fullCode = codeDigits.join('');
    if (fullCode.length !== 6) {
      Alert.alert('Atenção', 'Digite o código completo de 6 dígitos');
      return;
    }

    setLoading(true);
    try {
      await authApi.verifyResetCode(email.trim().toLowerCase(), fullCode);
      setStep(3);
    } catch (error: any) {
      Alert.alert('Código Inválido', error.response?.data?.message || 'Verifique o código e tente novamente');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!password || password.length < 6) {
      Alert.alert('Atenção', 'A senha deve ter no mínimo 6 caracteres');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Atenção', 'As senhas não coincidem');
      return;
    }

    setLoading(true);
    try {
      const fullCode = codeDigits.join('');
      await authApi.resetPassword(email.trim().toLowerCase(), fullCode, password);
      Alert.alert(
        'Senha Alterada! ✅',
        'Sua senha foi redefinida com sucesso. Faça login com a nova senha.',
        [{ text: 'OK', onPress: () => navigation.navigate('Login' as never) }]
      );
    } catch (error: any) {
      Alert.alert('Erro', error.response?.data?.message || 'Erro ao redefinir senha');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      navigation.goBack();
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {[1, 2, 3].map((s) => (
        <View key={s} style={styles.stepContainer}>
          <View style={[
            styles.stepDot,
            s <= step && styles.stepDotActive,
            s < step && styles.stepDotCompleted,
          ]}>
            {s < step ? (
              <Ionicons name="checkmark" size={14} color="#FFFFFF" />
            ) : (
              <Text style={[styles.stepNumber, s <= step && styles.stepNumberActive]}>
                {s}
              </Text>
            )}
          </View>
          {s < 3 && (
            <View style={[styles.stepLine, s < step && styles.stepLineActive]} />
          )}
        </View>
      ))}
    </View>
  );

  const getStepTitle = () => {
    switch (step) {
      case 1: return 'Recuperar Senha';
      case 2: return 'Verificar Código';
      case 3: return 'Nova Senha';
      default: return '';
    }
  };

  const getStepSubtitle = () => {
    switch (step) {
      case 1: return 'Digite seu email para receber o código';
      case 2: return 'Digite o código enviado para seu email';
      case 3: return 'Crie uma nova senha segura';
      default: return '';
    }
  };

  const renderStep1 = () => (
    <Animated.View entering={FadeInUp.duration(400)} style={styles.stepContent}>
      <View style={styles.stepHeader}>
        <View style={styles.stepIconContainer}>
          <Ionicons name="mail-outline" size={32} color="#6366F1" />
        </View>
        <Text style={styles.stepTitle}>Informe seu Email</Text>
        <Text style={styles.stepDescription}>
          Enviaremos um código de 6 dígitos para você redefinir sua senha
        </Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Email</Text>
        <View style={styles.inputContainer}>
          <Ionicons name="mail-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="seu@email.com"
            placeholderTextColor="#94A3B8"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoFocus
          />
        </View>
      </View>

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleSendCode}
        disabled={loading}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={['#6366F1', '#8B5CF6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.buttonGradient}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.buttonText}>Enviar Código</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderStep2 = () => (
    <Animated.View entering={FadeInUp.duration(400)} style={styles.stepContent}>
      <View style={styles.stepHeader}>
        <View style={styles.stepIconContainer}>
          <Ionicons name="keypad-outline" size={32} color="#6366F1" />
        </View>
        <Text style={styles.stepTitle}>Digite o Código</Text>
        <Text style={styles.stepDescription}>
          Enviamos um código de 6 dígitos para {email}
        </Text>
      </View>

      <View style={styles.codeContainer}>
        {codeDigits.map((digit, index) => (
          <TextInput
            key={index}
            ref={(ref) => (codeInputs.current[index] = ref)}
            style={[styles.codeInput, digit && styles.codeInputFilled]}
            value={digit}
            onChangeText={(text) => handleCodeChange(text.replace(/[^0-9]/g, ''), index)}
            onKeyPress={(e) => handleCodeKeyPress(e, index)}
            keyboardType="number-pad"
            maxLength={1}
            selectTextOnFocus
          />
        ))}
      </View>

      <TouchableOpacity onPress={handleSendCode} style={styles.resendContainer}>
        <Text style={styles.resendText}>Não recebeu? </Text>
        <Text style={styles.resendLink}>Reenviar código</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleVerifyCode}
        disabled={loading}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={['#6366F1', '#8B5CF6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.buttonGradient}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.buttonText}>Verificar</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderStep3 = () => (
    <Animated.View entering={FadeInUp.duration(400)} style={styles.stepContent}>
      <View style={styles.stepHeader}>
        <View style={styles.stepIconContainer}>
          <Ionicons name="lock-closed-outline" size={32} color="#6366F1" />
        </View>
        <Text style={styles.stepTitle}>Nova Senha</Text>
        <Text style={styles.stepDescription}>
          Crie uma senha segura com no mínimo 6 caracteres
        </Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Nova Senha</Text>
        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Mínimo 6 caracteres"
            placeholderTextColor="#94A3B8"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            textContentType="oneTimeCode"
            autoComplete="off"
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#94A3B8" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Confirmar Senha</Text>
        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Repita a senha"
            placeholderTextColor="#94A3B8"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showPassword}
            textContentType="oneTimeCode"
            autoComplete="off"
          />
        </View>
      </View>

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleResetPassword}
        disabled={loading}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={['#10B981', '#059669']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.buttonGradient}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.buttonText}>Redefinir Senha</Text>
              <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <LinearGradient
        colors={['#4F46E5', '#7C3AED', '#9333EA']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top }]}
      >
        <View style={[styles.circle, styles.circle1]} />
        <View style={[styles.circle, styles.circle2]} />
        
        <TouchableOpacity style={styles.backButton} onPress={handleBack} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        
        <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.headerContent}>
          <Text style={styles.headerTitle}>{getStepTitle()}</Text>
          <Text style={styles.headerSubtitle}>{getStepSubtitle()}</Text>
          {renderStepIndicator()}
        </Animated.View>
      </LinearGradient>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.formContainer}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={styles.form}>
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}

            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Lembrou a senha? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login' as never)}>
                <Text style={styles.loginLink}>Fazer login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { paddingHorizontal: 24, paddingBottom: 32, borderBottomLeftRadius: 32, borderBottomRightRadius: 32, overflow: 'hidden' },
  circle: { position: 'absolute', borderRadius: 999, backgroundColor: 'rgba(255, 255, 255, 0.08)' },
  circle1: { width: width * 0.6, height: width * 0.6, top: -width * 0.2, right: -width * 0.2 },
  circle2: { width: width * 0.4, height: width * 0.4, bottom: -width * 0.1, left: -width * 0.15 },
  backButton: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255, 255, 255, 0.2)', justifyContent: 'center', alignItems: 'center', marginTop: 12 },
  headerContent: { alignItems: 'center', marginTop: 16 },
  headerTitle: { fontSize: 26, fontWeight: '800', color: '#FFFFFF', marginBottom: 4 },
  headerSubtitle: { fontSize: 14, color: 'rgba(255, 255, 255, 0.8)', marginBottom: 20, textAlign: 'center' },
  stepIndicator: { flexDirection: 'row', alignItems: 'center' },
  stepContainer: { flexDirection: 'row', alignItems: 'center' },
  stepDot: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255, 255, 255, 0.3)', justifyContent: 'center', alignItems: 'center' },
  stepDotActive: { backgroundColor: '#FFFFFF' },
  stepDotCompleted: { backgroundColor: '#10B981' },
  stepNumber: { fontSize: 13, fontWeight: '700', color: 'rgba(255, 255, 255, 0.7)' },
  stepNumberActive: { color: '#6366F1' },
  stepLine: { width: 40, height: 3, backgroundColor: 'rgba(255, 255, 255, 0.3)', marginHorizontal: 8, borderRadius: 2 },
  stepLineActive: { backgroundColor: '#10B981' },
  formContainer: { flex: 1, marginTop: -16 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 24 },
  form: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 24, ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 16 }, android: { elevation: 4 } }) },
  stepContent: { marginBottom: 16 },
  stepHeader: { alignItems: 'center', marginBottom: 24 },
  stepIconContainer: { width: 64, height: 64, borderRadius: 18, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  stepTitle: { fontSize: 22, fontWeight: '700', color: '#1E293B', marginBottom: 8 },
  stepDescription: { fontSize: 14, color: '#64748B', textAlign: 'center', lineHeight: 20 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 16 },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, paddingVertical: 16, fontSize: 16, color: '#1E293B' },
  codeContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24, paddingHorizontal: 8 },
  codeInput: { width: 48, height: 56, borderRadius: 12, borderWidth: 2, borderColor: '#E2E8F0', backgroundColor: '#F8FAFC', textAlign: 'center', fontSize: 24, fontWeight: '700', color: '#1E293B' },
  codeInputFilled: { borderColor: '#6366F1', backgroundColor: '#EEF2FF' },
  resendContainer: { flexDirection: 'row', justifyContent: 'center', marginBottom: 24 },
  resendText: { fontSize: 14, color: '#64748B' },
  resendLink: { fontSize: 14, color: '#6366F1', fontWeight: '600' },
  button: { borderRadius: 14, overflow: 'hidden', marginTop: 8 },
  buttonDisabled: { opacity: 0.7 },
  buttonGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, gap: 8 },
  buttonText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
  loginContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 16 },
  loginText: { fontSize: 15, color: '#64748B' },
  loginLink: { fontSize: 15, color: '#6366F1', fontWeight: '600' },
});

export default ForgotPasswordScreen;
