import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';

// Screens
import HomeScreen from '../screens/Home/HomeScreen';
import DeliveriesScreen from '../screens/Deliveries/DeliveriesScreen';
import DeliveryDetailScreen from '../screens/Deliveries/DeliveryDetailScreen';
import CreateDeliveryScreen from '../screens/Deliveries/CreateDeliveryScreen';
import ReportsScreen from '../screens/Reports/ReportsScreen';
import ReportDetailScreen from '../screens/Reports/ReportDetailScreen';
import CreateReportScreen from '../screens/Reports/CreateReportScreen';
import ReservationsScreen from '../screens/Reservations/ReservationsScreen';
import ReservationDetailScreen from '../screens/Reservations/ReservationDetailScreen';
import CreateReservationScreen from '../screens/Reservations/CreateReservationScreen';
import AnnouncementsScreen from '../screens/Announcements/AnnouncementsScreen';
import AnnouncementDetailScreen from '../screens/Announcements/AnnouncementDetailScreen';
import CreateAnnouncementScreen from '../screens/Announcements/CreateAnnouncementScreen';
import VisitorsScreen from '../screens/Visitors/VisitorsScreen';
import CreateVisitorScreen from '../screens/Visitors/CreateVisitorScreen';
import ProfileScreen from '../screens/Profile/ProfileScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();
const RootStack = createStackNavigator();

// Stack para Home - inclui todas as telas acessíveis pelo home
const HomeStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="HomeMain" component={HomeScreen} />
    {/* Telas de Entregas */}
    <Stack.Screen name="DeliveriesList" component={DeliveriesScreen} />
    <Stack.Screen name="DeliveryDetail" component={DeliveryDetailScreen} />
    <Stack.Screen name="CreateDelivery" component={CreateDeliveryScreen} />
    {/* Telas de Irregularidades */}
    <Stack.Screen name="ReportsList" component={ReportsScreen} />
    <Stack.Screen name="ReportDetail" component={ReportDetailScreen} />
    <Stack.Screen name="CreateReport" component={CreateReportScreen} />
    {/* Telas de Reservas */}
    <Stack.Screen name="ReservationsList" component={ReservationsScreen} />
    <Stack.Screen name="ReservationDetail" component={ReservationDetailScreen} />
    <Stack.Screen name="CreateReservation" component={CreateReservationScreen} />
    {/* Telas de Visitantes */}
    <Stack.Screen name="VisitorsList" component={VisitorsScreen} />
    <Stack.Screen name="CreateVisitor" component={CreateVisitorScreen} />
    {/* Telas Admin */}
    <Stack.Screen name="Condominiums" component={CondominiumsScreen} />
    <Stack.Screen name="CondominiumDetail" component={CondominiumDetailScreen} />
    <Stack.Screen name="CreateCondominium" component={CreateCondominiumScreen} />
    <Stack.Screen name="EditCondominium" component={EditCondominiumScreen} />
    <Stack.Screen name="ManageUsers" component={ManageUsersScreen} />
    <Stack.Screen name="UserDetail" component={UserDetailScreen} />
    <Stack.Screen name="EditUser" component={EditUserScreen} />
    <Stack.Screen name="CreateUser" component={CreateUserScreen} />
    <Stack.Screen name="InviteCodes" component={InviteCodesScreen} />
    {/* Telas de Áreas Comuns */}
    <Stack.Screen name="Areas" component={AreasScreen} />
    <Stack.Screen name="CreateArea" component={CreateAreaScreen} />
    {/* Telas de Documentos e Regras */}
    <Stack.Screen name="Documents" component={DocumentsScreen} />
    <Stack.Screen name="CreateDocument" component={CreateDocumentScreen} />
    {/* Tela de Notificações */}
    <Stack.Screen name="Notifications" component={NotificationsScreen} />
  </Stack.Navigator>
);

const AnnouncementsStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="AnnouncementsList" component={AnnouncementsScreen} />
    <Stack.Screen name="AnnouncementDetail" component={AnnouncementDetailScreen} />
    <Stack.Screen name="CreateAnnouncement" component={CreateAnnouncementScreen} />
  </Stack.Navigator>
);

const DeliveriesStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="DeliveriesList" component={DeliveriesScreen} />
    <Stack.Screen name="DeliveryDetail" component={DeliveryDetailScreen} />
    <Stack.Screen name="CreateDelivery" component={CreateDeliveryScreen} />
  </Stack.Navigator>
);

const ProfileStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="ProfileMain" component={ProfileScreen} />
  </Stack.Navigator>
);

// Animated Icon Component
const AnimatedIcon = ({ focused, iconName }: { focused: boolean; iconName: keyof typeof Ionicons.glyphMap }) => {
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scale: withSpring(focused ? 1.1 : 1, {
            damping: 12,
            stiffness: 200,
          }),
        },
      ],
    };
  });

  return (
    <Animated.View style={animatedStyle}>
      <Ionicons 
        name={iconName} 
        size={28} 
        color={focused ? '#6366F1' : '#94A3B8'} 
      />
    </Animated.View>
  );
};

const MainTabs = () => (
  <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Announcements') {
            iconName = focused ? 'megaphone' : 'megaphone-outline';
          } else if (route.name === 'Deliveries') {
            iconName = focused ? 'cube' : 'cube-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <AnimatedIcon focused={focused} iconName={iconName} />;
        },
        tabBarActiveTintColor: '#6366F1',
        tabBarInactiveTintColor: '#94A3B8',
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E2E8F0',
          height: Platform.OS === 'ios' ? 90 : 70,
          paddingBottom: Platform.OS === 'ios' ? 30 : 12,
          paddingTop: 10,
          paddingHorizontal: 20,
          elevation: 0,
          shadowColor: 'transparent',
          justifyContent: 'space-between',
        },
        tabBarItemStyle: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 4,
        },
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeStack}
        options={{
          tabBarLabel: 'Início',
        }}
      />
      <Tab.Screen 
        name="Announcements" 
        component={AnnouncementsStack}
        options={{
          tabBarLabel: 'Comunicados',
        }}
      />
      <Tab.Screen 
        name="Deliveries" 
        component={DeliveriesStack}
        options={{
          tabBarLabel: 'Entregas',
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileStack}
        options={{
          tabBarLabel: 'Perfil',
        }}
      />
    </Tab.Navigator>
);

// Admin Screens
import CondominiumsScreen from '../screens/Admin/CondominiumsScreen';
import CondominiumDetailScreen from '../screens/Admin/CondominiumDetailScreen';
import CreateCondominiumScreen from '../screens/Admin/CreateCondominiumScreen';
import EditCondominiumScreen from '../screens/Admin/EditCondominiumScreen';
import ManageUsersScreen from '../screens/Admin/ManageUsersScreen';
import UserDetailScreen from '../screens/Admin/UserDetailScreen';
import EditUserScreen from '../screens/Admin/EditUserScreen';
import CreateUserScreen from '../screens/Admin/CreateUserScreen';
import InviteCodesScreen from '../screens/Admin/InviteCodesScreen';
import AreasScreen from '../screens/Admin/AreasScreen';
import CreateAreaScreen from '../screens/Admin/CreateAreaScreen';
import DocumentsScreen from '../screens/Documents/DocumentsScreen';
import CreateDocumentScreen from '../screens/Documents/CreateDocumentScreen';
import NotificationsScreen from '../screens/Notifications/NotificationsScreen';

const MainNavigator = () => <MainTabs />;

export default MainNavigator;
