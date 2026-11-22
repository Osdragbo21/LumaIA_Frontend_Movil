// [MÓVIL] Ruta: src/screens/CuidadorEstadisticasScreen.tsx

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { BarChart, PieChart, LineChart } from 'react-native-gifted-charts';
import {
  AlertCircle,
  TrendingUp,
  BrainCircuit,
  ShieldAlert,
  Route,
  Users,
  Mountain,
  Activity,
  CheckCircle2,
  AlertOctagon,
  Lightbulb,
  Map,
  HelpCircle,
} from 'lucide-react-native';

import { useAppTheme } from '../store/useThemeStore';
import { obtenerMiAnaliticaCuidador } from '../services/analitica.service';

export const CuidadorEstadisticasScreen = () => {
  const { colors, typography } = useAppTheme();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  // CÁLCULO RESPONSIVO DEL ANCHO DE GRÁFICAS
  // 84px (paddings del ScrollView, bordes y paddings de la card) + 36px (eje Y) + 28px (margen de seguridad interno)
  const { width: screenWidth } = useWindowDimensions();
  const chartWidth = Math.max(screenWidth - 148, 180);

  const { data: analitica, isLoading, isError } = useQuery({
    queryKey: ['analiticaCuidador'],
    queryFn: () => obtenerMiAnaliticaCuidador(7),
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['analiticaCuidador'] });
    setRefreshing(false);
  }, [queryClient]);

  const mostrarInfo = (titulo: string, mensaje: string) => {
    Alert.alert(titulo, mensaje, [{ text: 'Entendido', style: 'default' }]);
  };

  // Procesamiento de Datos
  const barData =
    analitica?.adherencia.map(item => ({
      value: item.retraso_minutos,
      label: item.fecha.split('-')[2],
      frontColor: item.retraso_minutos > 30 ? colors.danger : colors.primary,
    })) || [];

  // Ancho dinámico de barras para que todos los días quepan sin cortarse
  const barCount = Math.max(barData.length, 1);
  const barInitialSpacing = 10;
  const barSpacing = 12;
  const dynamicBarWidth = Math.min(
    26,
    Math.max(
      12,
      Math.floor((chartWidth - barInitialSpacing * 2 - barSpacing * (barCount - 1)) / barCount)
    )
  );

  const pieColors = [colors.primary, colors.warning, colors.success, '#8b5cf6'];
  const pieData =
    analitica?.intenciones.map((item, index) => ({
      value: item.cantidad,
      color: pieColors[index % pieColors.length],
      text: `${item.cantidad}`,
      label: item.intencion.replace(/_/g, ' '),
    })) || [];

  const dfsData = [
    {
      value: analitica?.seguridad_dfs.permitidas || 0,
      color: colors.success,
      text: `${analitica?.seguridad_dfs.permitidas || 0}`,
      label: 'Consultas Permitidas',
    },
    {
      value: analitica?.seguridad_dfs.bloqueadas || 0,
      color: colors.danger,
      text: `${analitica?.seguridad_dfs.bloqueadas || 0}`,
      label: 'Bloqueos Médicos (RD-01)',
    },
  ].filter(d => d.value > 0);

  const ucsList = analitica?.escalamiento_ucs || [];
  const maxUcsCosto = Math.max(...ucsList.map(i => i.costo_acumulado), 1);

  const hillData =
    analitica?.optimizacion_hill_climbing.map(item => ({
      value: item.retraso_actual,
      label: `It ${item.iteracion}`,
      dataPointText: `${item.retraso_actual}m`,
    })) || [];

  const hillSpacing =
    hillData.length > 1
      ? Math.min(60, Math.max(28, Math.floor((chartWidth - 48) / (hillData.length - 1))))
      : 40;

  const ml = analitica?.prediccion_riesgo;
  const pcaData = ml
    ? [
        {
          value: ml.coordenada_pca_y,
          label: ml.coordenada_pca_x.toFixed(2),
          customDataPoint: () => (
            <View
              style={{
                width: 14,
                height: 14,
                borderRadius: 7,
                backgroundColor: ml.es_comportamiento_atipico ? colors.danger : colors.primary,
              }}
            />
          ),
        },
      ]
    : [];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.textPrimary, fontSize: typography.h1 }]}>
          Estadísticas
        </Text>
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
            <Text style={{ color: colors.textSecondary, marginTop: 16, fontWeight: 'bold' }}>
              Calculando métricas...
            </Text>
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
            {/* 1. CONSEJOS DE LUMA */}
            {ml && ml.recomendaciones.length > 0 && (
              <View style={[styles.card, { backgroundColor: '#f0fdf4', borderColor: colors.success }]}>
                <View style={styles.cardHeader}>
                  <View style={styles.headerLeft}>
                    <View style={[styles.iconBox, { backgroundColor: '#dcfce7' }]}>
                      <Lightbulb color={colors.success} size={24} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.cardTitle, { color: colors.textPrimary, fontSize: typography.lg }]}>
                        Consejos de Luma
                      </Text>
                      <Text style={{ color: colors.textSecondary, fontSize: typography.xs }}>
                        Motor de Recomendaciones
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() =>
                      mostrarInfo(
                        'Motor de Recomendaciones',
                        'Combina los resultados de Machine Learning, K-Means y reglas lógicas para generar sugerencias de cuidado personalizadas.'
                      )
                    }
                  >
                    <HelpCircle color={colors.textSecondary} size={24} />
                  </TouchableOpacity>
                </View>
                <View style={{ gap: 12 }}>
                  {ml.recomendaciones.map((rec, idx) => (
                    <View key={idx} style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                      <Text style={{ color: colors.success, fontWeight: '900', marginRight: 8 }}>•</Text>
                      <Text style={{ color: colors.textPrimary, fontSize: typography.sm, flex: 1, lineHeight: 20 }}>
                        {rec}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* 2. PREDICCIÓN DE RIESGO (ML) */}
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.cardHeader}>
                <View style={styles.headerLeft}>
                  <View style={[styles.iconBox, { backgroundColor: '#f3e8ff' }]}>
                    <Activity color="#9333ea" size={24} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.cardTitle, { color: colors.textPrimary, fontSize: typography.lg }]}>
                      Predicción de Riesgo
                    </Text>
                    <Text style={{ color: colors.textSecondary, fontSize: typography.xs }}>
                      Aprendizaje Supervisado
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() =>
                    mostrarInfo(
                      'Clasificación Supervisada',
                      'Compara el resultado de una regla fija tradicional contra un modelo de Machine Learning (Árbol de Decisión, Random Forest o KNN) entrenado con datos históricos para predecir si el paciente abandonará su tratamiento.'
                    )
                  }
                >
                  <HelpCircle color={colors.textSecondary} size={24} />
                </TouchableOpacity>
              </View>

              {ml ? (
                <View style={{ gap: 16 }}>
                  <View
                    style={[
                      styles.mlCard,
                      {
                        backgroundColor: ml.riesgo_regla_fija ? '#ffe4e6' : '#dcfce7',
                        borderColor: ml.riesgo_regla_fija ? colors.danger : colors.success,
                      },
                    ]}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                      {ml.riesgo_regla_fija ? (
                        <AlertOctagon color={colors.danger} size={20} />
                      ) : (
                        <CheckCircle2 color={colors.success} size={20} />
                      )}
                      <Text
                        style={{
                          fontWeight: 'bold',
                          color: ml.riesgo_regla_fija ? colors.danger : colors.success,
                          marginLeft: 8,
                        }}
                      >
                        Regla Fija Clásica
                      </Text>
                    </View>
                    <Text style={{ color: colors.textPrimary, fontSize: typography.sm }}>
                      {ml.riesgo_regla_fija
                        ? 'Riesgo Alto de abandono del tratamiento.'
                        : 'Riesgo Bajo. El paciente es adherente.'}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.mlCard,
                      {
                        backgroundColor: ml.riesgo_machine_learning ? '#ffe4e6' : '#dcfce7',
                        borderColor: ml.riesgo_machine_learning ? colors.danger : colors.success,
                      },
                    ]}
                  >
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 8,
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                        {ml.riesgo_machine_learning ? (
                          <AlertOctagon color={colors.danger} size={20} />
                        ) : (
                          <CheckCircle2 color={colors.success} size={20} />
                        )}
                        <Text
                          style={{
                            fontWeight: 'bold',
                            color: ml.riesgo_machine_learning ? colors.danger : colors.success,
                            marginLeft: 8,
                          }}
                        >
                          Modelo: {ml.algoritmo_utilizado}
                        </Text>
                      </View>
                      <View style={{ backgroundColor: '#fff', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 100 }}>
                        <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#9333ea' }}>
                          {ml.exactitud_modelo_ml}% Exactitud
                        </Text>
                      </View>
                    </View>
                    <Text style={{ color: colors.textPrimary, fontSize: typography.sm }}>
                      {ml.riesgo_machine_learning
                        ? 'El modelo predice un Riesgo Alto de abandono.'
                        : 'El modelo predice un Riesgo Bajo.'}
                    </Text>
                  </View>
                </View>
              ) : (
                <Text style={styles.emptyText}>No hay datos suficientes para predecir.</Text>
              )}
            </View>

            {/* 3. PERFIL DEL PACIENTE (K-MEANS Y PCA) */}
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.cardHeader}>
                <View style={styles.headerLeft}>
                  <View style={[styles.iconBox, { backgroundColor: '#e0f2fe' }]}>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.cardTitle, { color: colors.textPrimary, fontSize: typography.lg }]}>
                      Perfil del Paciente
                    </Text>
                    <Text style={{ color: colors.textSecondary, fontSize: typography.xs }}>
                      K-Means y Proyección PCA 2D
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() =>
                    mostrarInfo(
                      'K-Means y PCA',
                      'K-Means agrupa a los pacientes según su comportamiento. PCA reduce las variables para poder graficarlas en un plano 2D.\n\nEje Y: Componente Principal 2\nEje X: Componente Principal 1'
                    )
                  }
                >
                  <HelpCircle color={colors.textSecondary} size={24} />
                </TouchableOpacity>
              </View>

              {ml ? (
                <View>
                  <View
                    style={{
                      backgroundColor: '#f1f5f9',
                      padding: 12,
                      borderRadius: 12,
                      marginBottom: 16,
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ color: colors.textSecondary, fontSize: typography.xs, fontWeight: 'bold', marginBottom: 4 }}>
                      CLÚSTER IDENTIFICADO
                    </Text>
                    <Text style={{ color: colors.primary, fontSize: typography.lg, fontWeight: '900', textAlign: 'center' }}>
                      {ml.perfil_paciente}
                    </Text>
                  </View>

                  {pcaData.length > 0 && (
                    <View style={styles.chartContainer}>
                      <Text style={styles.axisLabel}>Eje Y: Componente 2 • Eje X: Componente 1</Text>
                      <LineChart
                        data={pcaData}
                        thickness={0}
                        hideRules={false}
                        yAxisThickness={2}
                        xAxisThickness={2}
                        yAxisLabelWidth={36}
                        yAxisTextStyle={{ color: colors.textSecondary, fontSize: 10 }}
                        xAxisLabelTextStyle={{ color: colors.textSecondary, fontSize: 10 }}
                        width={chartWidth}
                        xAxisLength={chartWidth}
                        rulesLength={chartWidth}
                        initialSpacing={24}
                        disableScroll
                      />
                      {ml.es_comportamiento_atipico && (
                        <Text
                          style={{
                            color: colors.danger,
                            fontSize: typography.xs,
                            fontWeight: 'bold',
                            textAlign: 'center',
                            marginTop: 16,
                          }}
                        >
                          ⚠️ Comportamiento Atípico Detectado (Anomalía)
                        </Text>
                      )}
                    </View>
                  )}
                </View>
              ) : (
                <Text style={styles.emptyText}>No hay datos para perfilar.</Text>
              )}
            </View>

            {/* 4. ADHERENCIA MÉDICA (MANHATTAN) */}
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.cardHeader}>
                <View style={styles.headerLeft}>
                  <View style={[styles.iconBox, { backgroundColor: colors.primaryLight }]}>
                    <TrendingUp color={colors.primary} size={24} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.cardTitle, { color: colors.textPrimary, fontSize: typography.lg }]}>
                      Adherencia Médica
                    </Text>
                    <Text style={{ color: colors.textSecondary, fontSize: typography.xs }}>
                      Distancia Manhattan
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() =>
                    mostrarInfo(
                      'Distancia Manhattan',
                      'Mide el retraso total acumulado al tomar los medicamentos comparando la hora programada vs la hora real.\n\nEje Y: Minutos de retraso\nEje X: Día del mes'
                    )
                  }
                >
                  <HelpCircle color={colors.textSecondary} size={24} />
                </TouchableOpacity>
              </View>
              {barData.length > 0 ? (
                <View style={styles.chartContainer}>
                  <Text style={styles.axisLabel}>Eje Y: Minutos • Eje X: Día del mes</Text>
                  <BarChart
                    data={barData}
                    barWidth={dynamicBarWidth}
                    spacing={barSpacing}
                    initialSpacing={barInitialSpacing}
                    endSpacing={10}
                    roundedTop
                    roundedBottom
                    hideRules={false}
                    xAxisThickness={2}
                    yAxisThickness={2}
                    yAxisLabelWidth={36}
                    yAxisTextStyle={{ color: colors.textSecondary, fontSize: 12 }}
                    xAxisLabelTextStyle={{ color: colors.textSecondary, fontSize: 12 }}
                    noOfSections={4}
                    maxValue={Math.max(...barData.map(d => d.value), 60)}
                    width={chartWidth}
                    xAxisLength={chartWidth}
                    rulesLength={chartWidth}
                    disableScroll
                  />
                </View>
              ) : (
                <Text style={styles.emptyText}>No hay registros de tomas.</Text>
              )}
            </View>

            {/* 5. INTERACCIONES (EUCLIDIANA) */}
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.cardHeader}>
                <View style={styles.headerLeft}>
                  <View style={[styles.iconBox, { backgroundColor: '#fef08a' }]}>
                    <BrainCircuit color="#ca8a04" size={24} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.cardTitle, { color: colors.textPrimary, fontSize: typography.lg }]}>
                      Interacciones con Luma
                    </Text>
                    <Text style={{ color: colors.textSecondary, fontSize: typography.xs }}>
                      Distancia Euclidiana
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() =>
                    mostrarInfo(
                      'Distancia Euclidiana',
                      'Clasifica las intenciones del texto libre del paciente midiendo la distancia vectorial contra frases de ejemplo. Muestra de qué temas habla más el paciente.'
                    )
                  }
                >
                  <HelpCircle color={colors.textSecondary} size={24} />
                </TouchableOpacity>
              </View>
              {pieData.length > 0 ? (
                <View style={styles.pieContainer}>
                  <PieChart
                    donut
                    data={pieData}
                    radius={100}
                    innerRadius={60}
                    textColor="#ffffff"
                    textSize={16}
                    fontWeight="bold"
                    showText
                  />
                  <View style={styles.legendContainer}>
                    {pieData.map((item, index) => (
                      <View key={index} style={styles.legendItem}>
                        <View style={[styles.legendColor, { backgroundColor: item.color }]} />
                        <Text style={{ color: colors.textSecondary, fontSize: typography.sm, fontWeight: 'bold' }}>
                          {item.label}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              ) : (
                <Text style={styles.emptyText}>Sin conversaciones recientes.</Text>
              )}
            </View>

            {/* 6. AUDITORÍA DE SEGURIDAD (DFS) */}
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.cardHeader}>
                <View style={styles.headerLeft}>
                  <View style={[styles.iconBox, { backgroundColor: '#ffe4e6' }]}>
                    <ShieldAlert color={colors.danger} size={24} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.cardTitle, { color: colors.textPrimary, fontSize: typography.lg }]}>
                      Auditoría de Seguridad
                    </Text>
                    <Text style={{ color: colors.textSecondary, fontSize: typography.xs }}>
                      Búsqueda en Profundidad (DFS)
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() =>
                    mostrarInfo(
                      'Búsqueda en Profundidad (DFS)',
                      'Recorre el árbol de reglas del asistente para garantizar que ninguna consulta médica (síntomas o dosis) sea respondida, activando el bloqueo de seguridad (Regla RD-01).'
                    )
                  }
                >
                  <HelpCircle color={colors.textSecondary} size={24} />
                </TouchableOpacity>
              </View>
              {dfsData.length > 0 ? (
                <View style={styles.pieContainer}>
                  <PieChart
                    data={dfsData}
                    radius={100}
                    textColor="#ffffff"
                    textSize={16}
                    fontWeight="bold"
                    showText
                  />
                  <View style={styles.legendContainer}>
                    {dfsData.map((item, index) => (
                      <View key={index} style={styles.legendItem}>
                        <View style={[styles.legendColor, { backgroundColor: item.color }]} />
                        <Text style={{ color: colors.textSecondary, fontSize: typography.sm, fontWeight: 'bold' }}>
                          {item.label}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              ) : (
                <Text style={styles.emptyText}>No hay registros de auditoría.</Text>
              )}
            </View>

            {/* 7. GUÍA DE NAVEGACIÓN (BFS) */}
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.cardHeader}>
                <View style={styles.headerLeft}>
                  <View style={[styles.iconBox, { backgroundColor: '#e0e7ff' }]}>
                    <Route color={colors.warning} size={24} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.cardTitle, { color: colors.textPrimary, fontSize: typography.lg }]}>
                      Guía de Navegación
                    </Text>
                    <Text style={{ color: colors.textSecondary, fontSize: typography.xs }}>
                      Búsqueda en Anchura (BFS)
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() =>
                    mostrarInfo(
                      'Búsqueda en Anchura (BFS)',
                      'Explora el mapa de la aplicación por niveles para encontrar la ruta más corta (con menos toques) para realizar una acción específica.'
                    )
                  }
                >
                  <HelpCircle color={colors.textSecondary} size={24} />
                </TouchableOpacity>
              </View>
              <Text style={{ color: colors.textSecondary, fontSize: typography.sm, marginBottom: 16, fontStyle: 'italic' }}>
                Ruta calculada con menos toques para: "Agregar un Medicamento"
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.bfsContainer}>
                {analitica?.ruta_bfs_optima.map((nodo, index) => (
                  <View key={index} style={styles.bfsNodeWrapper}>
                    <View
                      style={[
                        styles.bfsNode,
                        {
                          backgroundColor:
                            index === analitica.ruta_bfs_optima.length - 1 ? colors.primary : colors.surface,
                          borderColor: colors.primary,
                        },
                      ]}
                    >
                      <Text
                        style={{
                          color: index === analitica.ruta_bfs_optima.length - 1 ? '#fff' : colors.primary,
                          fontWeight: 'bold',
                          fontSize: typography.sm,
                        }}
                      >
                        {nodo}
                      </Text>
                    </View>
                    {index < analitica.ruta_bfs_optima.length - 1 && (
                      <Text style={{ color: colors.textSecondary, marginHorizontal: 8 }}>→</Text>
                    )}
                  </View>
                ))}
              </ScrollView>
            </View>

            {/* 8. ESCALAMIENTO DE EMERGENCIA (UCS) */}
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.cardHeader}>
                <View style={styles.headerLeft}>
                  <View style={[styles.iconBox, { backgroundColor: '#fef3c7' }]}>
                    <Users color="#d97706" size={24} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.cardTitle, { color: colors.textPrimary, fontSize: typography.lg }]}>
                      Escalamiento de Emergencia
                    </Text>
                    <Text style={{ color: colors.textSecondary, fontSize: typography.xs }}>
                      Costo Uniforme (UCS)
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() =>
                    mostrarInfo(
                      'Búsqueda de Costo Uniforme (UCS)',
                      'Ordena a quién contactar primero en una emergencia evaluando el "costo" (tiempo estimado de respuesta) de cada contacto.\n\nOrden: Contactos por minutos acumulados'
                    )
                  }
                >
                  <HelpCircle color={colors.textSecondary} size={24} />
                </TouchableOpacity>
              </View>
              {ucsList.length > 0 ? (
                <View style={styles.ucsListContainer}>
                  <Text style={styles.axisLabel}>Contactos ordenados por minutos acumulados</Text>
                  {ucsList.map((item, idx) => {
                    const porcentaje = Math.max((item.costo_acumulado / maxUcsCosto) * 100, 8);
                    return (
                      <View key={idx} style={styles.ucsItem}>
                        <View style={styles.ucsHeaderRow}>
                          <Text
                            style={{ color: colors.textPrimary, fontSize: typography.sm, fontWeight: 'bold', flex: 1 }}
                            numberOfLines={1}
                          >
                            {idx + 1}. {item.nombre}
                          </Text>
                          <Text
                            style={{
                              color: colors.textSecondary,
                              fontSize: typography.xs,
                              fontWeight: 'bold',
                              marginLeft: 8,
                            }}
                          >
                            {item.costo_acumulado} min
                          </Text>
                        </View>
                        <View style={styles.ucsBarTrack}>
                          <View
                            style={[
                              styles.ucsBarFill,
                              { width: `${porcentaje}%`, backgroundColor: colors.warning },
                            ]}
                          />
                        </View>
                      </View>
                    );
                  })}
                </View>
              ) : (
                <Text style={styles.emptyText}>No hay contactos registrados.</Text>
              )}
            </View>

            {/* 9. OPTIMIZACIÓN DE ALERTAS (HILL CLIMBING) */}
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.cardHeader}>
                <View style={styles.headerLeft}>
                  <View style={[styles.iconBox, { backgroundColor: '#dcfce7' }]}>
                    <Mountain color={colors.success} size={24} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.cardTitle, { color: colors.textPrimary, fontSize: typography.lg }]}>
                      Optimización de Alertas
                    </Text>
                    <Text style={{ color: colors.textSecondary, fontSize: typography.xs }}>
                      Escalada de Colinas
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() =>
                    mostrarInfo(
                      'Escalada de Colinas (Hill Climbing)',
                      'Simula el ajuste de la hora de los recordatorios buscando iterativamente el punto donde el retraso del paciente sea el mínimo posible (óptimo local).\n\nEje Y: Retraso en minutos\nEje X: Iteraciones del algoritmo'
                    )
                  }
                >
                  <HelpCircle color={colors.textSecondary} size={24} />
                </TouchableOpacity>
              </View>
              {hillData.length > 0 ? (
                <View style={styles.chartContainer}>
                  <Text style={styles.axisLabel}>Eje Y: Retraso (min) • Eje X: Iteraciones</Text>
                  <LineChart
                    data={hillData}
                    color={colors.success}
                    thickness={3}
                    dataPointsColor={colors.success}
                    hideRules={false}
                    yAxisThickness={2}
                    xAxisThickness={2}
                    yAxisLabelWidth={36}
                    yAxisTextStyle={{ color: colors.textSecondary, fontSize: 12 }}
                    xAxisLabelTextStyle={{ color: colors.textSecondary, fontSize: 12 }}
                    textFontSize={10}
                    textColor={colors.textSecondary}
                    textShiftY={-8}
                    textShiftX={6}
                    initialSpacing={24}
                    spacing={hillSpacing}
                    width={chartWidth}
                    xAxisLength={chartWidth}
                    rulesLength={chartWidth}
                    disableScroll
                  />
                  <Text
                    style={{
                      color: colors.success,
                      fontSize: typography.sm,
                      fontWeight: 'bold',
                      marginTop: 16,
                      textAlign: 'center',
                    }}
                  >
                    Resultado:{' '}
                    {analitica?.optimizacion_hill_climbing[analitica.optimizacion_hill_climbing.length - 1].ajuste}
                  </Text>
                </View>
              ) : (
                <Text style={styles.emptyText}>No hay datos para optimizar.</Text>
              )}
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
  card: { borderRadius: 24, borderWidth: 2, padding: 20, marginBottom: 24, overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconBox: { padding: 12, borderRadius: 16, marginRight: 16 },
  cardTitle: { fontWeight: '900' },
  chartContainer: { width: '100%', overflow: 'hidden' },
  axisLabel: { color: '#64748b', fontSize: 11, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  pieContainer: { alignItems: 'center', marginTop: 10 },
  legendContainer: { marginTop: 24, width: '100%', gap: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  legendColor: { width: 16, height: 16, borderRadius: 8, marginRight: 12 },
  emptyText: { textAlign: 'center', color: '#94a3b8', fontStyle: 'italic', marginTop: 10 },
  bfsContainer: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  bfsNodeWrapper: { flexDirection: 'row', alignItems: 'center' },
  bfsNode: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, borderWidth: 2 },
  mlCard: { padding: 16, borderRadius: 16, borderWidth: 2 },
  ucsListContainer: { width: '100%', gap: 14 },
  ucsItem: { gap: 6 },
  ucsHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ucsBarTrack: { height: 18, backgroundColor: '#f1f5f9', borderRadius: 9, overflow: 'hidden' },
  ucsBarFill: { height: '100%', borderRadius: 9 },
});