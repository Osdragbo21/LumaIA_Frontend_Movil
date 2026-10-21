// [MÓVIL] Ruta: src/navigation/MainNavigator.tsx

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, Mic, CalendarDays, PhoneCall } from 'lucide-react-native';
import { useAppTheme } from '../store/useThemeStore';

import { DashboardScreen } from '../screens/DashboardScreen';
import { ChatScreen } from '../screens/ChatScreen';
import { AgendaScreen } from '../screens/AgendaScreen';
import { ApoyoScreen } from '../screens/ApoyoScreen';

const Tab = createBottomTabNavigator();

export const MainNavigator = () => {
  const { colors, typography } = useAppTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 2,
          borderTopColor: colors.border,
          height: 70, 
          paddingBottom: 10,
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontSize: typography.xs,
          fontWeight: 'bold',
        },
      }}
    >
      <Tab.Screen 
        name="Inicio" 
        component={DashboardScreen} 
        options={{
          tabBarIcon: ({ color, size }) => <Home color={color} size={size + 4} />
        }}
      />
      <Tab.Screen 
        name="Luma" 
        component={ChatScreen} 
        options={{
          tabBarIcon: ({ color, size }) => <Mic color={color} size={size + 4} />
        }}
      />
      <Tab.Screen 
        name="Agenda" 
        component={AgendaScreen} 
        options={{
          tabBarIcon: ({ color, size }) => <CalendarDays color={color} size={size + 4} />
        }}
      />
      <Tab.Screen 
        name="Apoyo" 
        component={ApoyoScreen} 
        options={{
          tabBarIcon: ({ color, size }) => <PhoneCall color={color} size={size + 4} />
        }}
      />
    </Tab.Navigator>
  );
};