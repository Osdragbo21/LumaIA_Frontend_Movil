// [MÓVIL] Ruta: src/screens/CuidadorEstadisticasScreen.tsx

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../store/useThemeStore';

export const CuidadorEstadisticasScreen = () => {
  const { colors, typography } = useAppTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.textPrimary, fontSize: typography.h1 }]}>Estadísticas</Text>
      </View>
      <View style={styles.centerContainer}>
        <Text style={{ fontSize: typography.xl, color: colors.textSecondary, fontWeight: 'bold' }}>Módulo de Algoritmos</Text>
        <Text style={{ fontSize: typography.base, color: colors.textSecondary, marginTop: 8 }}>En desarrollo...</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: { padding: 20, paddingBottom: 16, borderBottomWidth: 2 },
  headerTitle: { fontWeight: '900' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});