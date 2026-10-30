// [MÓVIL] Ruta: src/screens/CuidadorEstadisticasScreen.tsx

import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { BarChart, PieChart } from 'react-native-gifted-charts';
import { AlertCircle, TrendingUp, BrainCircuit, ShieldAlert } from 'lucide-react-native';

import { useAppTheme } from '../store/useThemeStore';
import { obtenerMiAnaliticaCuidador } from '../services/analitica.service';

export const CuidadorEstadisticasScreen = () => {
  const { colors, typography } = useAppTheme();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const { data: analitica, isLoading, isError } = useQuery({
    queryKey: ['analiticaCuidador'],
    queryFn: () => obtenerMiAnaliticaCuidador(7),
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['analiticaCuidador'] });
    setRefreshing(false);
  }, [queryClient]);

  // 1. Datos Manhattan (Barras)
  const barData = analitica?.adherencia.map(item => {
    const dia = item.fecha.split('-')[2];
    return {
      value: item.retraso_minutos,
      label: dia,
      frontColor: item.retraso_minutos > 30 ? colors.danger : colors.primary,
    };
  }) || [];

  // 2. Datos Euclidiana (Dona)
  const pieColors = [colors.primary, colors.warning, colors.success, '#8b5cf6'];
  const pieData = analitica?.intenciones.map((item, index) => ({
    value: item.cantidad,
    color: pieColors[index % pieColors.length],
    text: `${item.cantidad}`,
    label: item.intencion.replace(/_/g, ' '),
  })) || [];

  // 3. Datos DFS (Pastel)
  const dfsData = [
    { value: analitica?.seguridad_dfs.permitidas || 0, color: colors.success, text: `${analitica?.seguridad_dfs.permitidas || 0}`, label: 'Consultas Permitidas' },
    { value: analitica?.seguridad_dfs.bloqueadas || 0, color: colors.danger, text: `${analitica?.seguridad_dfs.bloqueadas || 0}`, label: 'Bloqueos Médicos (RD-01)' }
  ].filter(d => d.value > 0);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.textPrimary, fontSize: typography.h1 }]}>Estadísticas</Text>
        <Text style={{ color: colors.textSecondary, fontSize: typography.sm, marginTop: 4 }}>
          Módulo de Inteligencia Artificial
        </Text>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
      >
        {isLoading && !refreshing ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={{ color: colors.textSecondary, marginTop: 16, fontWeight: 'bold' }}>Calculando métricas...</Text>
          </View>
        ) : isError ? (
          <View style={[styles.errorCard, { backgroundColor: '#ffe4e6', borderColor: colors.danger }]}>
            <AlertCircle color={colors.danger} size={32} />
            <Text style={{ color: colors.danger, fontSize: typography.base, marginLeft: 12, flex: 1, fontWeight: 'bold' }}>
              No se pudieron cargar las estadísticas.
            </Text>
          </View>
        ) : (
          <>
            {/* GRÁFICA 1: DISTANCIA MANHATTAN */}
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.cardHeader}>
                <View style={[styles.iconBox, { backgroundColor: colors.primaryLight }]}><TrendingUp color={colors.primary} size={24} /></View>
                <View>
                  <Text style={[styles.cardTitle, { color: colors.textPrimary, fontSize: typography.lg }]}>Adherencia Médica</Text>
                  <Text style={{ color: colors.textSecondary, fontSize: typography.xs }}>Distancia Manhattan (Retraso en minutos)</Text>
                </View>
              </View>
              {barData.length > 0 ? (
                <View style={styles.chartContainer}>
                  <BarChart data={barData} barWidth={28} spacing={24} roundedTop roundedBottom hideRules xAxisThickness={2} yAxisThickness={0} yAxisTextStyle={{ color: colors.textSecondary, fontSize: 12 }} noOfSections={4} maxValue={Math.max(...barData.map(d => d.value), 60)} />
                </View>
              ) : <Text style={styles.emptyText}>No hay registros de tomas en los últimos 7 días.</Text>}
            </View>

            {/* GRÁFICA 2: DISTANCIA EUCLIDIANA */}
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.cardHeader}>
                <View style={[styles.iconBox, { backgroundColor: '#fef08a' }]}><BrainCircuit color="#ca8a04" size={24} /></View>
                <View>
                  <Text style={[styles.cardTitle, { color: colors.textPrimary, fontSize: typography.lg }]}>Interacciones con Luma</Text>
                  <Text style={{ color: colors.textSecondary, fontSize: typography.xs }}>Distancia Euclidiana (Intenciones)</Text>
                </View>
              </View>
              {pieData.length > 0 ? (
                <View style={styles.pieContainer}>
                  <PieChart donut data={pieData} radius={100} innerRadius={60} textColor="#ffffff" textSize={16} fontWeight="bold" showText />
                  <View style={styles.legendContainer}>
                    {pieData.map((item, index) => (
                      <View key={index} style={styles.legendItem}>
                        <View style={[styles.legendColor, { backgroundColor: item.color }]} />
                        <Text style={{ color: colors.textSecondary, fontSize: typography.sm, fontWeight: 'bold' }}>{item.label}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ) : <Text style={styles.emptyText}>El paciente no ha conversado con Luma recientemente.</Text>}
            </View>

            {/* GRÁFICA 3: DFS (BLOQUEOS MÉDICOS) */}
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.cardHeader}>
                <View style={[styles.iconBox, { backgroundColor: '#ffe4e6' }]}><ShieldAlert color={colors.danger} size={24} /></View>
                <View>
                  <Text style={[styles.cardTitle, { color: colors.textPrimary, fontSize: typography.lg }]}>Auditoría de Seguridad</Text>
                  <Text style={{ color: colors.textSecondary, fontSize: typography.xs }}>Búsqueda en Profundidad (DFS - Regla RD-01)</Text>
                </View>
              </View>
              {dfsData.length > 0 ? (
                <View style={styles.pieContainer}>
                  <PieChart data={dfsData} radius={100} textColor="#ffffff" textSize={16} fontWeight="bold" showText />
                  <View style={styles.legendContainer}>
                    {dfsData.map((item, index) => (
                      <View key={index} style={styles.legendItem}>
                        <View style={[styles.legendColor, { backgroundColor: item.color }]} />
                        <Text style={{ color: colors.textSecondary, fontSize: typography.sm, fontWeight: 'bold' }}>{item.label}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ) : <Text style={styles.emptyText}>No hay registros de auditoría.</Text>}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: { padding: 20, paddingBottom: 16, borderBottomWidth: 2 },
  headerTitle: { fontWeight: '900' },
  scrollContent: { flexGrow: 1, padding: 20, paddingBottom: 40 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100 },
  errorCard: { padding: 20, borderRadius: 24, borderWidth: 2, flexDirection: 'row', alignItems: 'center' },
  card: { borderRadius: 24, borderWidth: 2, padding: 20, marginBottom: 24 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  iconBox: { padding: 12, borderRadius: 16, marginRight: 16 },
  cardTitle: { fontWeight: '900' },
  chartContainer: { alignItems: 'center', paddingRight: 20 },
  pieContainer: { alignItems: 'center', marginTop: 10 },
  legendContainer: { marginTop: 24, width: '100%', gap: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  legendColor: { width: 16, height: 16, borderRadius: 8, marginRight: 12 },
  emptyText: { textAlign: 'center', color: '#94a3b8', fontStyle: 'italic', marginTop: 10 },
});