// [MÓVIL] Ruta: src/screens/DashboardScreen.tsx

import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet, Image, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Pill, Stethoscope, Check, LogOut, AlertCircle, Phone, Clock } from 'lucide-react-native';

import { useAuthStore } from '../store/useAuthStore';
import { useAppTheme } from '../store/useThemeStore';
import { obtenerMedicamentos } from '../services/medicamentos.service';
import { obtenerCitas } from '../services/citas.service';
import { obtenerTomasHoy, confirmarToma } from '../services/registros-toma.service';

export const DashboardScreen = ({ navigation }: any) => {
  const { rol, usuarioId, logout } = useAuthStore();
  const { colors, typography } = useAppTheme();
  const queryClient = useQueryClient();
  
  const [refreshing, setRefreshing] = useState(false);

  const handleLogout = () => logout();

  const fechaGenerada = new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
  const fechaFormateada = fechaGenerada.split(', ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(', ');

  const { data: medicamentos = [], isLoading: loadMed, isError: errMed } = useQuery({
    queryKey: ['medicamentos', usuarioId],
    queryFn: () => obtenerMedicamentos(usuarioId!),
    enabled: !!usuarioId,
  });

  // CORRECCIÓN: El backend ya entrega solo las citas de hoy, no necesitamos filtrar en el frontend
  const { data: citas = [], isLoading: loadCitas, isError: errCitas } = useQuery({
    queryKey: ['citas', usuarioId],
    queryFn: () => obtenerCitas(usuarioId!),
    enabled: !!usuarioId,
  });

  const { data: tomasHoy = [], isLoading: loadTomas } = useQuery({
    queryKey: ['tomasHoy', usuarioId],
    queryFn: () => obtenerTomasHoy(usuarioId!),
    enabled: !!usuarioId,
  });

  const idsConfirmados = new Set(tomasHoy.map((toma: any) => toma.medicamento_id));

  const mutationToma = useMutation({
    mutationFn: (medicamento_id: string) => confirmarToma(medicamento_id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tomasHoy', usuarioId] });
    }
  });

  const isLoading = loadMed || loadCitas || loadTomas;
  const isError = errMed || errCitas;

  // CORRECCIÓN: Función para el Pull-to-Refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['medicamentos', usuarioId] });
    await queryClient.invalidateQueries({ queryKey: ['citas', usuarioId] });
    await queryClient.invalidateQueries({ queryKey: ['tomasHoy', usuarioId] });
    setRefreshing(false);
  }, [queryClient, usuarioId]);

  const handleConfirmarToma = (id: string) => {
    if (!idsConfirmados.has(id)) {
      mutationToma.mutate(id);
    }
  };

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
              <Text style={[styles.welcomeText, { color: colors.textSecondary, fontSize: typography.xs }]}>BIENVENIDO</Text>
              <Text style={{ fontSize: typography.h2, fontWeight: 'bold', color: colors.textPrimary }}>{rol || 'Usuario'}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <LogOut color={colors.textSecondary} size={28} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={[styles.sosButton, { backgroundColor: colors.danger, borderBottomColor: '#9f1239' }]} onPress={() => navigation.navigate('Apoyo')} activeOpacity={0.8}>
          <View style={styles.sosIconContainer}><Phone color="#ffffff" size={28} /></View>
          <Text style={[styles.sosText, { fontSize: typography.h2 }]}>EMERGENCIA SOS</Text>
        </TouchableOpacity>

        <View style={styles.dateContainer}>
          <Clock color={colors.textSecondary} size={20} />
          <Text style={[styles.dateText, { color: colors.textSecondary, fontSize: typography.lg }]}>{fechaFormateada}</Text>
        </View>

        {isLoading && !refreshing && (
          <View style={[styles.emptyCard, { borderColor: colors.border }]}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={{ color: colors.textSecondary, fontSize: typography.base, marginTop: 16 }}>Preparando tu día...</Text>
          </View>
        )}

        {isError && (
          <View style={[styles.errorCard, { backgroundColor: '#ffe4e6', borderColor: colors.danger }]}>
            <AlertCircle color={colors.danger} size={32} />
            <Text style={{ color: colors.danger, fontSize: typography.base, marginLeft: 12, flex: 1, fontWeight: 'bold' }}>Ocurrió un problema al cargar tu información.</Text>
          </View>
        )}

        {!isLoading && !isError && (
          <View style={styles.listContainer}>
            
            {medicamentos.map((med) => {
              const isConfirmado = idsConfirmados.has(med._id);
              const cardBg = isConfirmado ? colors.successLight : colors.surface;
              const cardBorder = isConfirmado ? colors.success : colors.border;
              
              return (
                <View key={med._id} style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                  <View style={styles.cardHeader}>
                    <View style={[styles.iconBox, { backgroundColor: isConfirmado ? '#bbf7d0' : colors.primaryLight }]}><Pill color={isConfirmado ? colors.success : colors.primary} size={28} /></View>
                    <View style={styles.cardInfo}>
                      <Text style={[styles.medTitle, { color: colors.textPrimary, fontSize: typography.h2, textDecorationLine: isConfirmado ? 'line-through' : 'none' }]}>{med.nombre_farmaco}</Text>
                      <Text style={{ color: isConfirmado ? colors.success : colors.primary, fontSize: typography.lg, fontWeight: 'bold' }}>{med.horarios_especificos?.length > 0 ? `A las ${med.horarios_especificos[0]}` : `Cada ${med.frecuencia_horas} hrs`}</Text>
                      <Text style={{ color: colors.textSecondary, fontSize: typography.base }}>Dosis: {med.dosis}</Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    disabled={isConfirmado || mutationToma.isPending}
                    onPress={() => handleConfirmarToma(med._id)}
                    style={[styles.actionButton, { backgroundColor: isConfirmado ? colors.successLight : colors.primary, borderColor: isConfirmado ? colors.success : '#1e40af', borderBottomWidth: isConfirmado ? 2 : 4 }]}
                  >
                    {mutationToma.isPending && !isConfirmado ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <>
                        <Text style={{ color: isConfirmado ? colors.success : '#fff', fontSize: typography.lg, fontWeight: 'bold', marginRight: 8 }}>{isConfirmado ? 'Toma Confirmada' : 'Ya lo tomé'}</Text>
                        <Check color={isConfirmado ? colors.success : '#fff'} size={24} strokeWidth={3} />
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              );
            })}

            {/* CORRECCIÓN: Usamos 'citas' directamente */}
            {citas.map((cita) => (
              <View key={cita._id} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, borderLeftWidth: 6, borderLeftColor: colors.warning }]}>
                <View style={styles.cardHeader}>
                  <View style={[styles.iconBox, { backgroundColor: '#e0e7ff' }]}><Stethoscope color={colors.warning} size={28} /></View>
                  <View style={styles.cardInfo}>
                    <Text style={[styles.medTitle, { color: colors.textPrimary, fontSize: typography.xl }]}>{cita.titulo_evento}</Text>
                    <View style={styles.row}>
                      <View style={{ backgroundColor: '#e0e7ff', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginRight: 8 }}>
                        <Text style={{ color: colors.warning, fontWeight: 'bold', fontSize: typography.sm }}>{new Date(cita.fecha_hora).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</Text>
                      </View>
                      {cita.ubicacion && <Text style={{ color: colors.textSecondary, fontSize: typography.sm, flexShrink: 1 }}>{cita.ubicacion}</Text>}
                    </View>
                  </View>
                </View>
              </View>
            ))}

            {medicamentos.length === 0 && citas.length === 0 && (
              <View style={[styles.emptyCard, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                <View style={{ backgroundColor: '#f1f5f9', padding: 16, borderRadius: 100, marginBottom: 16 }}><Check color="#94a3b8" size={40} /></View>
                <Text style={{ fontSize: typography.h2, fontWeight: 'bold', color: colors.textPrimary }}>¡Todo al día!</Text>
                <Text style={{ fontSize: typography.base, color: colors.textSecondary, textAlign: 'center', marginTop: 8 }}>No tienes tareas médicas pendientes para hoy.</Text>
              </View>
            )}
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
  logoutBtn: { padding: 8 },
  sosButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 20, borderRadius: 24, borderBottomWidth: 4, marginBottom: 24 },
  sosIconContainer: { backgroundColor: 'rgba(255,255,255,0.2)', padding: 8, borderRadius: 100, marginRight: 12 },
  sosText: { color: '#ffffff', fontWeight: '900', letterSpacing: 1 },
  dateContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  dateText: { fontWeight: 'bold', textTransform: 'capitalize', marginLeft: 8 },
  listContainer: { gap: 16 },
  card: { padding: 20, borderRadius: 24, borderWidth: 2, marginBottom: 16 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  iconBox: { padding: 12, borderRadius: 16, marginRight: 16 },
  cardInfo: { flex: 1 },
  medTitle: { fontWeight: '900', marginBottom: 4 },
  actionButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 16, marginTop: 16 },
  row: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  emptyCard: { padding: 40, borderRadius: 24, borderWidth: 2, borderStyle: 'dashed', alignItems: 'center' },
  errorCard: { padding: 20, borderRadius: 24, borderWidth: 2, flexDirection: 'row', alignItems: 'center', marginBottom: 16 }
});