import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated from 'react-native-reanimated';
import { condominiumsApi, Condominium } from '../../api/condominiums';
import { usersApi, User } from '../../api/users';
import GradientHeader from '../../components/GradientHeader';
import { getListItemAnimation } from '../../utils/animations';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

const CondominiumDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { id } = route.params as { id: string };

  const [condominium, setCondominium] = useState<Condominium | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [condoData, usersData] = await Promise.all([
        condominiumsApi.getById(id),
        usersApi.getByCondominium(id),
      ]);
      setCondominium(condoData);
      setUsers(usersData);
    } catch (error: any) {
      Alert.alert('Erro', 'Não foi possível carregar os dados');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      master: 'Master',
      sindico: 'Síndico',
      zelador: 'Zelador',
      porteiro: 'Porteiro',
      morador: 'Morador',
    };
    return labels[role] || role;
  };

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      master: '#DC2626',
      sindico: '#6366F1',
      zelador: '#F59E0B',
      porteiro: '#10B981',
      morador: '#8B5CF6',
    };
    return colors[role] || '#64748B';
  };

  const usersByRole = users.reduce((acc, user) => {
    if (!acc[user.role]) acc[user.role] = [];
    acc[user.role].push(user);
    return acc;
  }, {} as Record<string, User[]>);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  if (!condominium) return null;

  return (
    <View style={styles.container}>
      <GradientHeader
        title={condominium.name}
        subtitle={condominium.address.city}
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Informações do Condomínio */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="document-text-outline" size={20} color="#64748B" />
              <Text style={styles.infoLabel}>CNPJ:</Text>
              <Text style={styles.infoValue}>{condominium.cnpj}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={20} color="#64748B" />
              <Text style={styles.infoLabel}>Endereço:</Text>
              <Text style={styles.infoValue}>
                {condominium.address.street}, {condominium.address.number}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="grid-outline" size={20} color="#64748B" />
              <Text style={styles.infoLabel}>Blocos:</Text>
              <Text style={styles.infoValue}>{condominium.blocks.join(', ')}</Text>
            </View>
          </View>
        </View>

        {/* Ações Rápidas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ações</Text>
          <View style={styles.actionsGrid}>
            <AnimatedTouchableOpacity
              entering={getListItemAnimation(0, 50)}
              style={styles.actionButton}
              onPress={() =>
                navigation.navigate('CreateUser' as never, { condominiumId: id } as never)
              }
            >
              <View style={[styles.actionIcon, { backgroundColor: '#6366F120' }]}>
                <Ionicons name="person-add" size={24} color="#6366F1" />
              </View>
              <Text style={styles.actionText}>Criar Usuário</Text>
            </AnimatedTouchableOpacity>

            <AnimatedTouchableOpacity
              entering={getListItemAnimation(1, 50)}
              style={styles.actionButton}
              onPress={() =>
                navigation.navigate('InviteCodes' as never, { condominiumId: id } as never)
              }
            >
              <View style={[styles.actionIcon, { backgroundColor: '#F59E0B20' }]}>
                <Ionicons name="ticket" size={24} color="#F59E0B" />
              </View>
              <Text style={styles.actionText}>Códigos</Text>
            </AnimatedTouchableOpacity>

            <AnimatedTouchableOpacity
              entering={getListItemAnimation(2, 50)}
              style={styles.actionButton}
              onPress={() =>
                navigation.navigate('EditCondominium' as never, { id } as never)
              }
            >
              <View style={[styles.actionIcon, { backgroundColor: '#10B98120' }]}>
                <Ionicons name="create" size={24} color="#10B981" />
              </View>
              <Text style={styles.actionText}>Editar</Text>
            </AnimatedTouchableOpacity>
          </View>
        </View>

        {/* Usuários por Função */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Usuários ({users.length})</Text>
          {Object.entries(usersByRole).map(([role, roleUsers]) => (
            <View key={role} style={styles.roleSection}>
              <View style={styles.roleHeader}>
                <View
                  style={[
                    styles.roleBadge,
                    { backgroundColor: `${getRoleColor(role)}20` },
                  ]}
                >
                  <Text style={[styles.roleLabel, { color: getRoleColor(role) }]}>
                    {getRoleLabel(role)}
                  </Text>
                </View>
                <Text style={styles.roleCount}>{roleUsers.length}</Text>
              </View>
              {roleUsers.map((user, index) => (
                <AnimatedTouchableOpacity
                  key={user._id}
                  entering={getListItemAnimation(index)}
                  style={styles.userCard}
                  onPress={() =>
                    navigation.navigate('UserDetail' as never, { userId: user._id } as never)
                  }
                >
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{user.name}</Text>
                    <Text style={styles.userUnit}>
                      {user.unit.block ? `${user.unit.block} - ` : ''}{user.unit.number}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
                </AnimatedTouchableOpacity>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
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
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  infoValue: {
    flex: 1,
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '500',
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
  },
  roleSection: {
    marginBottom: 16,
  },
  roleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  roleLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  roleCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  userUnit: {
    fontSize: 12,
    color: '#64748B',
  },
});

export default CondominiumDetailScreen;

