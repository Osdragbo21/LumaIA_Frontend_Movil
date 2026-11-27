// [MÓVIL] Ruta: src/screens/DashboardScreen.tsx

import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet, Image, RefreshControl, Linking, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Pill, Stethoscope, Check, LogOut, AlertCircle, Phone, Clock } from 'lucide-react-native';

import { useAuthStore } from '../store/useAuthStore';
import { useAppTheme } from '../store/useThemeStore';
import { obtenerMedicamentos } from '../services/medicamentos.service';
import { obtenerCitas } from '../services/citas.service';
import { obtenerTomasHoy, confirmarToma } from '../services/registros-toma.service';
import { obtenerPerfilUsuario } from '../services/contactos.service';
import { usePushNotifications } from '../hooks/usePushNotifications';

export const DashboardScreen = ({ navigation }: any) => {
  const { rol, usuarioId, logout } = useAuthStore();
  const { colors, typography } = useAppTheme();
  const queryClient = useQueryClient();
  
  const [refreshing, setRefreshing] = useState(false);

  const fechaGenerada = new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
  const fechaFormateada = fechaGenerada.split(', ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(', ');

  usePushNotifications();

  // Queries
  const { data: perfil } = useQuery({ queryKey: ['perfil', usuarioId], queryFn: () => obtenerPerfilUsuario(usuarioId!), enabled: !!usuarioId });
  const { data: medicamentos = [], isLoading: loadMed, isError: errMed } = useQuery({ queryKey: ['medicamentos', usuarioId], queryFn: () => obtenerMedicamentos(usuarioId!), enabled: !!usuarioId });
  const { data: citas = [], isLoading: loadCitas, isError: errCitas } = useQuery({ queryKey: ['citas', usuarioId], queryFn: () => obtenerCitas(usuarioId!), enabled: !!usuarioId });
  const { data: tomasHoy = [], isLoading: loadTomas } = useQuery({ queryKey: ['tomasHoy', usuarioId], queryFn: () => obtenerTomasHoy(usuarioId!), enabled: !!usuarioId });

  // Mutación
  const mutationToma = useMutation({
    mutationFn: ({ id, hora }: { id: string, hora: string }) => confirmarToma(id, hora),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['tomasHoy', usuarioId] }); }
  });

  const isLoading = loadMed || loadCitas || loadTomas;
  const isError = errMed || errCitas;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['medicamentos', usuarioId] });
    await queryClient.invalidateQueries({ queryKey: ['citas', usuarioId] });
    await queryClient.invalidateQueries({ queryKey: ['tomasHoy', usuarioId] });
    setRefreshing(false);
  }, [queryClient, usuarioId]);

  // CORRECCIÓN 1: Lógica del Botón SOS Directo
  const handleSOS = () => {
    const contactos = perfil?.contactos_emergencia || [];
    if (contactos.length > 0) {
      const numeroLimpio = contactos[0].telefono.replace(/[\s\-\(\)]/g, '');
      const url = Platform.OS === 'ios' ? `telprompt:${numeroLimpio}` : `tel:${numeroLimpio}`;
      Linking.openURL(url).catch(() => {
        Alert.alert('Error', 'No se pudo abrir la aplicación de teléfono.');
      });
    } else {
      Alert.alert('Aviso', 'No tienes contactos de emergencia. Ve a la pestaña Apoyo para agregar uno.');
      navigation.navigate('Apoyo');
    }
  };

  // CORRECCIÓN 2: Lógica de Horarios Múltiples
  const obtenerTomaActual = (med: any) => {
    const ahora = new Date();
    const horaActualStr = `${ahora.getHours().toString().padStart(2, '0')}:${ahora.getMinutes().toString().padStart(2, '0')}`;
    
    // Si no tiene horarios, devolvemos un estado por defecto
    if (!med.horarios_especificos || med.horarios_especificos.length === 0) {
      return { hora: "Sin horario", confirmada: tomasHoy.some(t => t.medicamento_id === med._id) };
    }

    // Buscamos qué horarios ya fueron confirmados hoy
    const horariosConfirmados = tomasHoy
      .filter(t => t.medicamento_id === med._id)
      .map(t => {
        const d = new Date(t.fecha_programada);
        // Ajustamos la hora UTC devuelta por Mongo a la hora local (México UTC-6)
        return `${(d.getUTCHours() - 6).toString().padStart(2, '0')}:${d.getUTCMinutes().toString().padStart(2, '0')}`;
      });

    // Buscamos el primer horario que NO haya sido confirmado
    const proximoHorario = med.horarios_especificos.find((h: string) => !horariosConfirmados.includes(h));

    if (proximoHorario) {
      // Hay una toma pendiente
      return { hora: proximoHorario, confirmada: false, totalConfirmadas: horariosConfirmados.length, totalTomas: med.horarios_especificos.length };
    } else {
      // Ya se tomaron todas las de hoy
      return { hora: med.horarios_especificos[med.horarios_especificos.length - 1], confirmada: true, totalConfirmadas: horariosConfirmados.length, totalTomas: med.horarios_especificos.length };
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}>
        
        <View style={[styles.header, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.headerLeft}>
            <Image source={require('../../assets/logo_LumaIA.png')} style={{ width: 60, height: 60, resizeMode: 'contain', marginRight: 12 }} />
            <View>
              <Text style={[styles.welcomeText, { color: colors.textSecondary, fontSize: typography.xs }]}>BIENVENIDO</Text>
              <Text style={{ fontSize: typography.h2, fontWeight: 'bold', color: colors.textPrimary }}>{rol || 'Usuario'}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
            <LogOut color={colors.textSecondary} size={28} />
          </TouchableOpacity>
        </View>

        {/* BOTÓN SOS DIRECTO */}
        <TouchableOpacity style={[styles.sosButton, { backgroundColor: colors.danger, borderBottomColor: '#9f1239' }]} onPress={handleSOS} activeOpacity={0.8}>
          <View style={styles.sosIconContainer}><Phone color="#ffffff" size={28} /></View>
          <Text style={[styles.sosText, { fontSize: typography.h2 }]}>EMERGENCIA SOS</Text>
        </TouchableOpacity>

        <View style={styles.dateContainer}>
          <Clock color={colors.textSecondary} size={20} />
          <Text style={[styles.dateText, { color: colors.textSecondary, fontSize: typography.lg }]}>{fechaFormateada}</Text>
        </View>

        {isLoading && !refreshing && (
          <View style={[styles.emptyCard, { borderColor: colors.border }]}><ActivityIndicator size="large" color={colors.primary} /><Text style={{ color: colors.textSecondary, fontSize: typography.base, marginTop: 16 }}>Preparando tu día...</Text></View>
        )}

        {isError && (
          <View style={[styles.errorCard, { backgroundColor: '#ffe4e6', borderColor: colors.danger }]}><AlertCircle color={colors.danger} size={32} /><Text style={{ color: colors.danger, fontSize: typography.base, marginLeft: 12, flex: 1, fontWeight: 'bold' }}>Ocurrió un problema al cargar tu información.</Text></View>
        )}

        {!isLoading && !isError && (
          <View style={styles.listContainer}>
            
            {medicamentos.map((med) => {
              const tomaActual = obtenerTomaActual(med);
              const isConfirmado = tomaActual.confirmada;
              const cardBg = isConfirmado ? colors.successLight : colors.surface;
              const cardBorder = isConfirmado ? colors.success : colors.border;
              
              return (
                <View key={med._id} style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                  <View style={styles.cardHeader}>
                    <View style={[styles.iconBox, { backgroundColor: isConfirmado ? '#bbf7d0' : colors.primaryLight }]}><Pill color={isConfirmado ? colors.success : colors.primary} size={28} /></View>
                    <View style={styles.cardInfo}>
                      <Text style={[styles.medTitle, { color: colors.textPrimary, fontSize: typography.h2, textDecorationLine: isConfirmado ? 'line-through' : 'none' }]}>{med.nombre_farmaco}</Text>
                      
                      {/* Mostrar la hora de la toma actual o la última confirmada */}
                      <Text style={{ color: isConfirmado ? colors.success : colors.primary, fontSize: typography.lg, fontWeight: 'bold' }}>
                        A las {tomaActual.hora}
                      </Text>
                      
                      <Text style={{ color: colors.textSecondary, fontSize: typography.base }}>Dosis: {med.dosis}</Text>
                      
                      {/* Indicador de progreso (Ej: 1 de 3 tomas) */}
                      {tomaActual.totalTomas > 1 && (
                        <Text style={{ color: colors.textSecondary, fontSize: typography.sm, marginTop: 4, fontWeight: 'bold' }}>
                          Progreso hoy: {tomaActual.totalConfirmadas} de {tomaActual.totalTomas} tomas
                        </Text>
                      )}
                    </View>
                  </View>

                  <TouchableOpacity
                    disabled={isConfirmado || mutationToma.isPending}
                    onPress={() => mutationToma.mutate({ id: med._id, hora: tomaActual.hora })}
                    style={[styles.actionButton, { backgroundColor: isConfirmado ? colors.successLight : colors.primary, borderColor: isConfirmado ? colors.success : '#1e40af', borderBottomWidth: isConfirmado ? 2 : 4 }]}
                  >
                    {mutationToma.isPending && !isConfirmado ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <>
                        <Text style={{ color: isConfirmado ? colors.success : '#fff', fontSize: typography.lg, fontWeight: 'bold', marginRight: 8 }}>
                          {isConfirmado ? 'Todas las tomas completas' : 'Ya lo tomé'}
                        </Text>
                        <Check color={isConfirmado ? colors.success : '#fff'} size={24} strokeWidth={3} />
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              );
            })}

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