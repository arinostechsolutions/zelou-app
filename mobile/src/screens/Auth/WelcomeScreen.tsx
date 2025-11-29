import React from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  StatusBar,
  Dimensions,
  Platform,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import Constants from 'expo-constants';

const { width, height } = Dimensions.get('window');

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

const WelcomeScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Background Gradient */}
      <LinearGradient
        colors={['#4F46E5', '#7C3AED', '#9333EA']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      />

      {/* Decorative circles */}
      <View style={[styles.circle, styles.circle1]} />
      <View style={[styles.circle, styles.circle2]} />
      <View style={[styles.circle, styles.circle3]} />

      {/* Content */}
      <View style={[styles.content, { paddingTop: insets.top + 40 }]}>
        {/* Logo Section */}
        <Animated.View 
          entering={FadeInDown.delay(100).duration(600)}
          style={styles.logoSection}
        >
          <Image 
            source={require('../../../assets/icon-2.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.appName}>Zelou</Text>
          <Text style={styles.tagline}>Seu condomínio mais organizado, seguro e inteligente.</Text>
        </Animated.View>

        {/* Features Section */}
        <Animated.View 
          entering={FadeInDown.delay(300).duration(600)}
          style={styles.featuresSection}
        >
          <View style={styles.featureRow}>
            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Ionicons name="cube-outline" size={24} color="#FFFFFF" />
              </View>
              <Text style={styles.featureText}>Entregas</Text>
            </View>
            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Ionicons name="calendar-outline" size={24} color="#FFFFFF" />
              </View>
              <Text style={styles.featureText}>Reservas</Text>
            </View>
            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Ionicons name="megaphone-outline" size={24} color="#FFFFFF" />
              </View>
              <Text style={styles.featureText}>Recados</Text>
            </View>
          </View>
        </Animated.View>

        {/* Spacer */}
        <View style={styles.spacer} />

        {/* Buttons Section */}
        <Animated.View 
          entering={FadeInUp.delay(500).duration(600)}
          style={[styles.buttonsSection, { paddingBottom: insets.bottom + 20 }]}
        >
          <AnimatedTouchableOpacity
            entering={FadeInUp.delay(600).duration(400)}
            style={styles.primaryButton}
            onPress={() => navigation.navigate('Login' as never)}
            activeOpacity={0.9}
          >
            <Text style={styles.primaryButtonText}>Entrar</Text>
            <Ionicons name="arrow-forward" size={20} color="#6366F1" />
          </AnimatedTouchableOpacity>

          <AnimatedTouchableOpacity
            entering={FadeInUp.delay(700).duration(400)}
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('Register' as never)}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryButtonText}>Criar conta</Text>
          </AnimatedTouchableOpacity>

          <Text style={styles.version}>
            Versão {Constants.expoConfig?.version || '1.0.0'}
          </Text>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#4F46E5',
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  circle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  circle1: {
    width: width * 0.8,
    height: width * 0.8,
    top: -width * 0.3,
    right: -width * 0.3,
  },
  circle2: {
    width: width * 0.6,
    height: width * 0.6,
    bottom: height * 0.2,
    left: -width * 0.3,
  },
  circle3: {
    width: width * 0.4,
    height: width * 0.4,
    bottom: -width * 0.1,
    right: -width * 0.1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  logoSection: {
    alignItems: 'center',
    marginTop: height * 0.08,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 20,
  },
  appName: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -1,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 24,
  },
  featuresSection: {
    marginTop: 48,
  },
  featureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 32,
  },
  featureItem: {
    alignItems: 'center',
    width: 90,
  },
  featureIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
    textAlign: 'center',
  },
  spacer: {
    flex: 1,
  },
  buttonsSection: {
    gap: 12,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 18,
    borderRadius: 16,
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#6366F1',
  },
  secondaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  secondaryButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  version: {
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
    marginTop: 16,
  },
});

export default WelcomeScreen;
