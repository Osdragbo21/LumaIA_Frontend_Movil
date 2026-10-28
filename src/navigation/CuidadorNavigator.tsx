// [MÓVIL] Ruta: src/navigation/CuidadorNavigator.tsx

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Activity, BarChart2, ClipboardList, Users } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppTheme } from '../store/useThemeStore';
import { CuidadorDashboardScreen } from '../screens/CuidadorDashboardScreen';
import { CuidadorEstadisticasScreen } from '../screens/CuidadorEstadisticasScreen';
import { CuidadorGestionScreen } from '../screens/CuidadorGestionScreen';
import { CuidadorVinculacionScreen } from '../screens/CuidadorVinculacionScreen';

const Tab = createBottomTabNavigator();

export const CuidadorNavigator = () => {
  const { colors, typography } = useAppTheme();
  const insets = useSafeAreaInsets();

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
          height: 70 + insets.bottom,
          paddingBottom: 10 + insets.bottom,
          paddingTop: 10,
        },
        tabBarLabelStyle: { fontSize: typography.xs, fontWeight: 'bold' },
      }}
    >
      <Tab.Screen name="Monitoreo" component={CuidadorDashboardScreen} options={{ tabBarIcon: ({ color, size }) => <Activity color={color} size={size + 4} /> }} />
      <Tab.Screen name="Estadísticas" component={CuidadorEstadisticasScreen} options={{ tabBarIcon: ({ color, size }) => <BarChart2 color={color} size={size + 4} /> }} />
      <Tab.Screen name="Gestión" component={CuidadorGestionScreen} options={{ tabBarIcon: ({ color, size }) => <ClipboardList color={color} size={size + 4} /> }} />
      <Tab.Screen name="Vinculados" component={CuidadorVinculacionScreen} options={{ tabBarIcon: ({ color, size }) => <Users color={color} size={size + 4} /> }} />
    </Tab.Navigator>
  );
};