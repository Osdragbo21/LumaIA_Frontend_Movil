// [MÓVIL] Ruta: src/screens/CuidadorDashboardScreen.tsx

import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet, Image, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { LogOut, Activity, Pill, Stethoscope, AlertCircle } from 'lucide-react-native';

import { useAuthStore } from '../store/useAuthStore';
import { useAppTheme } from '../store/useThemeStore';
import { obtenerAdultosVinculados } from '../services/cuidador.service';

export const CuidadorDashboardScreen = () => {
  const { usuarioId, logout } = useAuthStore();
  const { colors, typography } = useAppTheme();
  const queryClient = useQueryClient();

  const [refreshing, setRefreshing] = useState(false);

  const { data: vinculados = [], isLoading, isError } = useQuery({
    queryKey: ['vinculadosResumen', usuarioId],
    queryFn: () => obtenerAdultosVinculados(usuarioId!),
    enabled: !!usuarioId,
  });

  // CORRECCIÓN: Función para el Pull-to-Refresh del Cuidador
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['vinculadosResumen', usuarioId] });
    setRefreshing(false);
  }, [queryClient, usuarioId]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView 
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
      >
        
        <View style={[styles.header, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.headerLeft}>
            <Image source={require('../../assets/logo_LumaIA.png')} style={{ width: 60, height: 60, resizeMode: 'contain', marginRight: 12 }} />
            <View>
              <Text style={[styles.welcomeText, { color: colors.textSecondary, fontSize: typography.xs }]}>PORTAL CUIDADOR</Text>
              <Text style={{ fontSize: typography.h2, fontWeight: 'bold', color: colors.textPrimary }}>Monitoreo</Text>
            </View>
          </View>
          <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
            <LogOut color={colors.danger} size={28} />
          </TouchableOpacity>
        </View>

        {isLoading && !refreshing ? (
          <View style={[styles.emptyCard, { borderColor: colors.border }]}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={{ color: colors.textSecondary, fontSize: typography.base, marginTop: 16 }}>Sincronizando estado...</Text>
          </View>
        ) : isError ? (
          <View style={[styles.errorCard, { backgroundColor: '#ffe4e6', borderColor: colors.danger }]}>
            <AlertCircle color={colors.danger} size={32} />
            <Text style={{ color: colors.danger, fontSize: typography.base, marginLeft: 12, flex: 1, fontWeight: 'bold' }}>Error de conexión.</Text>
          </View>
        ) : vinculados.length === 0 ? (
          <View style={[styles.emptyCard, { borderColor: colors.border, backgroundColor: colors.surface }]}>
            <Text style={{ fontSize: typography.h2, fontWeight: 'bold', color: colors.textPrimary }}>Bienvenido</Text>
            <Text style={{ fontSize: typography.base, color: colors.textSecondary, textAlign: 'center', marginTop: 8 }}>Aún no tienes pacientes vinculados. Ve a la pestaña "Vinculados" para agregar uno.</Text>
          </View>
        ) : (
          <View style={styles.listContainer}>
            {vinculados.map((item) => {
              const medsTotales = item.medicamentos.length;
              const tomasUnicasHoy = new Set(item.tomas_hoy.map(t => t.medicamento_id)).size;
              const alDia = tomasUnicasHoy >= medsTotales && medsTotales > 0;

              return (
                <View key={item.adulto._id} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <View style={styles.cardHeader}>
                    <View style={[styles.avatarBox, { backgroundColor: colors.primaryLight }]}><Text style={{ color: colors.primary, fontSize: typography.h2, fontWeight: '900' }}>{item.adulto.nombre.charAt(0)}</Text></View>
                    <View style={styles.cardInfo}>
                      <Text style={[styles.cardTitle, { color: colors.textPrimary, fontSize: typography.h2 }]}>{item.adulto.nombre}</Text>
                      <View style={[styles.statusBadge, { backgroundColor: alDia ? colors.successLight : '#fff1f2', borderColor: alDia ? colors.success : colors.danger }]}>
                        <Activity color={alDia ? colors.success : colors.danger} size={16} />
                        <Text style={{ color: alDia ? colors.success : colors.danger, fontSize: typography.sm, fontWeight: 'bold', marginLeft: 4 }}>{alDia ? 'Al Día' : 'Atención Pendiente'}</Text>
                      </View>
                    </View>
                  </View>
                  
                  <View style={[styles.cardDetails, { borderTopColor: colors.border }]}>
                    <View style={styles.detailRow}>
                      <Pill color={colors.primary} size={24} />
                      <Text style={[styles.detailText, { color: colors.textSecondary, fontSize: typography.lg }]}>Tomadas hoy: <Text style={{ color: colors.primary, fontWeight: '900' }}>{tomasUnicasHoy} de {medsTotales}</Text></Text>
                    </View>
                    <View style={[styles.detailRow, { marginTop: 12 }]}>
                      <Stethoscope color={colors.warning} size={24} />
                      <Text style={[styles.detailText, { color: colors.textSecondary, fontSize: typography.lg }]}>Citas hoy: <Text style={{ color: colors.warning, fontWeight: '900' }}>{item.citas_hoy.length}</Text></Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 24, borderWidth: 2, marginBottom: 24 },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  welcomeText: { fontWeight: 'bold', letterSpacing: 1, marginBottom: 2 },
  logoutBtn: { padding: 8, backgroundColor: '#ffe4e6', borderRadius: 16 },
  listContainer: { gap: 16 },
  card: { borderRadius: 24, borderWidth: 2, overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', padding: 20, alignItems: 'center' },
  avatarBox: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  cardInfo: { flex: 1 },
  cardTitle: { fontWeight: '900', marginBottom: 6 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100, borderWidth: 1 },
  cardDetails: { padding: 20, paddingTop: 16, borderTopWidth: 2, backgroundColor: '#fafafa' },
  detailRow: { flexDirection: 'row', alignItems: 'center' },
  detailText: { marginLeft: 12, fontWeight: '600' },
  emptyCard: { padding: 40, borderRadius: 24, borderWidth: 2, borderStyle: 'dashed', alignItems: 'center' },
  errorCard: { padding: 20, borderRadius: 24, borderWidth: 2, flexDirection: 'row', alignItems: 'center' }
});