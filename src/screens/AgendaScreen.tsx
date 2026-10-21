// [MÓVIL] Ruta: src/screens/AgendaScreen.tsx

import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Modal, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Calendar, MapPin, Clock, Pill, Stethoscope, CheckCircle, Plus, StickyNote } from 'lucide-react-native';

import { useAuthStore } from '../store/useAuthStore';
import { useAppTheme } from '../store/useThemeStore';
import { obtenerMedicamentos } from '../services/medicamentos.service';
import { obtenerCitas } from '../services/citas.service';

type FiltroType = 'Todo' | 'Citas' | 'Medicamentos';

export const AgendaScreen = () => {
  const { usuarioId } = useAuthStore();
  const { colors, typography } = useAppTheme();
  
  const [filtro, setFiltro] = useState<FiltroType>('Todo');
  const [modalVisible, setModalVisible] = useState(false);

  const { data: medicamentos = [], isLoading: loadMed } = useQuery({
    queryKey: ['medicamentos', usuarioId],
    queryFn: () => obtenerMedicamentos(usuarioId!),
    enabled: !!usuarioId,
  });

  const { data: citas = [], isLoading: loadCitas } = useQuery({
    queryKey: ['citas', usuarioId],
    queryFn: () => obtenerCitas(usuarioId!),
    enabled: !!usuarioId,
  });

  const isLoading = loadMed || loadCitas;

  const mostrarCitas = filtro === 'Todo' || filtro === 'Citas';
  const mostrarMedicamentos = filtro === 'Todo' || filtro === 'Medicamentos';

  const emptyState = (!isLoading && 
    ((mostrarCitas && citas.length === 0 && !mostrarMedicamentos) || 
    (mostrarMedicamentos && medicamentos.length === 0 && !mostrarCitas) || 
    (filtro === 'Todo' && citas.length === 0 && medicamentos.length === 0))
  );

  const handleAction = (tipo: string) => {
    setModalVisible(false);
    // En un futuro, esto navegará a las pantallas de creación
    Alert.alert('Próximamente', `Pantalla para crear ${tipo} en desarrollo.`);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      
      {/* HEADER Y PÍLDORAS DE FILTRO */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.textPrimary, fontSize: typography.h1 }]}>Mi Agenda</Text>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContainer}>
          {(['Todo', 'Citas', 'Medicamentos'] as FiltroType[]).map((opcion) => (
            <TouchableOpacity 
              key={opcion}
              onPress={() => setFiltro(opcion)}
              style={[
                styles.filterPill, 
                { 
                  backgroundColor: filtro === opcion ? colors.primary : colors.background,
                  borderColor: filtro === opcion ? colors.primary : colors.border
                }
              ]}
              activeOpacity={0.8}
            >
              <Text style={{ 
                color: filtro === opcion ? '#fff' : colors.textSecondary, 
                fontSize: typography.base, 
                fontWeight: 'bold' 
              }}>
                {opcion}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {isLoading && (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={{ color: colors.textSecondary, fontSize: typography.lg, marginTop: 16, fontWeight: 'bold' }}>Cargando agenda...</Text>
          </View>
        )}

        {!isLoading && (
          <View style={styles.listContainer}>
            
            {/* RENDERIZAR CITAS */}
            {mostrarCitas && citas.map((cita) => (
              <View key={cita._id} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, borderLeftColor: colors.warning }]}>
                <View style={styles.cardHeader}>
                  <View style={[styles.iconBox, { backgroundColor: colors.warning + '15' }]}>
                    <Stethoscope color={colors.warning} size={32} />
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={[styles.cardTitle, { color: colors.textPrimary, fontSize: typography.xl }]}>
                      {cita.titulo_evento}
                    </Text>
                    <View style={styles.badgeContainer}>
                      <Text style={[styles.badgeText, { color: colors.warning, fontSize: typography.sm }]}>CITA MÉDICA</Text>
                    </View>
                  </View>
                </View>
                
                <View style={[styles.cardDetails, { borderTopColor: colors.border }]}>
                  <View style={styles.detailRow}>
                    <Calendar color={colors.textSecondary} size={20} />
                    <Text style={[styles.detailText, { color: colors.textSecondary, fontSize: typography.base }]}>
                      {new Date(cita.fecha_hora).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Clock color={colors.textSecondary} size={20} />
                    <Text style={[styles.detailText, { color: colors.textSecondary, fontSize: typography.base }]}>
                      {new Date(cita.fecha_hora).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                  {cita.ubicacion && (
                    <View style={styles.detailRow}>
                      <MapPin color={colors.textSecondary} size={20} />
                      <Text style={[styles.detailText, { color: colors.textSecondary, fontSize: typography.base }]}>{cita.ubicacion}</Text>
                    </View>
                  )}
                </View>
              </View>
            ))}

            {/* RENDERIZAR MEDICAMENTOS */}
            {mostrarMedicamentos && medicamentos.map((med) => (
              <View key={med._id} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, borderLeftColor: colors.primary }]}>
                <View style={styles.cardHeader}>
                  <View style={[styles.iconBox, { backgroundColor: colors.primaryLight }]}>
                    <Pill color={colors.primary} size={32} />
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={[styles.cardTitle, { color: colors.textPrimary, fontSize: typography.xl }]}>
                      {med.nombre_farmaco}
                    </Text>
                    <View style={styles.badgeContainerPrimary}>
                      <Text style={[styles.badgeTextPrimary, { color: colors.primary, fontSize: typography.sm }]}>MEDICAMENTO</Text>
                    </View>
                  </View>
                </View>
                
                <View style={[styles.cardDetails, { borderTopColor: colors.border }]}>
                  <View style={styles.detailRow}>
                    <Clock color={colors.textSecondary} size={20} />
                    <Text style={[styles.detailText, { color: colors.textSecondary, fontSize: typography.base, fontWeight: 'bold' }]}>
                      {med.horarios_especificos?.length > 0 ? `A las ${med.horarios_especificos.join(', ')}` : `Cada ${med.frecuencia_horas} hrs`}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <CheckCircle color={colors.textSecondary} size={20} />
                    <Text style={[styles.detailText, { color: colors.textSecondary, fontSize: typography.base }]}>
                      Dosis: {med.dosis}
                    </Text>
                  </View>
                </View>
              </View>
            ))}

            {/* ESTADO VACÍO */}
            {emptyState && (
              <View style={[styles.emptyCard, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                <View style={{ backgroundColor: colors.background, padding: 20, borderRadius: 100, marginBottom: 16 }}>
                  <Calendar color={colors.textSecondary} size={48} />
                </View>
                <Text style={{ fontSize: typography.h2, fontWeight: 'bold', color: colors.textPrimary }}>Agenda Limpia</Text>
                <Text style={{ fontSize: typography.lg, color: colors.textSecondary, textAlign: 'center', marginTop: 8 }}>
                  No tienes eventos registrados para este filtro.
                </Text>
              </View>
            )}

          </View>
        )}
      </ScrollView>

      {/* FLOATING ACTION BUTTON (FAB) */}
      <TouchableOpacity 
        style={[styles.fab, { backgroundColor: colors.primary, shadowColor: colors.primary }]}
        activeOpacity={0.8}
        onPress={() => setModalVisible(true)}
      >
        <Plus color="#ffffff" size={36} strokeWidth={3} />
      </TouchableOpacity>

      {/* MODAL DE ACCIONES */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={[styles.modalHandler, { backgroundColor: colors.border }]} />
            <Text style={{ fontSize: typography.h2, fontWeight: '900', color: colors.textPrimary, marginBottom: 24, textAlign: 'center' }}>¿Qué deseas agregar?</Text>

            <TouchableOpacity style={[styles.modalBtn, { borderColor: colors.border }]} onPress={() => handleAction('Nuevo Medicamento')}>
              <View style={[styles.modalIconBox, { backgroundColor: colors.primaryLight }]}>
                <Pill color={colors.primary} size={32} />
              </View>
              <Text style={[styles.modalBtnText, { color: colors.textPrimary, fontSize: typography.xl }]}>Nuevo Medicamento</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.modalBtn, { borderColor: colors.border }]} onPress={() => handleAction('Nueva Cita')}>
              <View style={[styles.modalIconBox, { backgroundColor: colors.warning + '15' }]}>
                <Calendar color={colors.warning} size={32} />
              </View>
              <Text style={[styles.modalBtnText, { color: colors.textPrimary, fontSize: typography.xl }]}>Nueva Cita Médica</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.modalBtn, { borderColor: colors.border }]} onPress={() => handleAction('Nueva Nota')}>
              <View style={[styles.modalIconBox, { backgroundColor: '#fef08a' }]}>
                <StickyNote color="#ca8a04" size={32} />
              </View>
              <Text style={[styles.modalBtnText, { color: colors.textPrimary, fontSize: typography.xl }]}>Nueva Nota Personal</Text>
            </TouchableOpacity>

          </View>
        </Pressable>
      </Modal>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: { padding: 20, paddingBottom: 16, borderBottomWidth: 2 },
  headerTitle: { fontWeight: '900', marginBottom: 16 },
  filterContainer: { gap: 12, paddingRight: 20 },
  filterPill: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 100, borderWidth: 2, minHeight: 48, justifyContent: 'center' },
  scrollContent: { flexGrow: 1, padding: 20, paddingBottom: 100 }, // Padding bottom extra para el FAB
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 },
  listContainer: { gap: 16 },
  card: { borderRadius: 24, borderWidth: 2, borderLeftWidth: 8, overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', padding: 20, alignItems: 'center' },
  iconBox: { padding: 12, borderRadius: 16, marginRight: 16 },
  cardInfo: { flex: 1 },
  cardTitle: { fontWeight: '900', marginBottom: 6 },
  badgeContainer: { alignSelf: 'flex-start', backgroundColor: '#eef2ff', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontWeight: '900', letterSpacing: 0.5 },
  badgeContainerPrimary: { alignSelf: 'flex-start', backgroundColor: '#eff6ff', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeTextPrimary: { fontWeight: '900', letterSpacing: 0.5 },
  cardDetails: { padding: 20, paddingTop: 16, borderTopWidth: 2, gap: 12, backgroundColor: '#fafafa' },
  detailRow: { flexDirection: 'row', alignItems: 'center' },
  detailText: { marginLeft: 12, fontWeight: '500', textTransform: 'capitalize', flex: 1 },
  emptyCard: { padding: 40, borderRadius: 24, borderWidth: 2, borderStyle: 'dashed', alignItems: 'center', marginTop: 20 },
  fab: { position: 'absolute', bottom: 24, right: 24, width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 10 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 40 },
  modalHandler: { width: 48, height: 6, borderRadius: 3, alignSelf: 'center', marginBottom: 24 },
  modalBtn: { flexDirection: 'row', alignItems: 'center', padding: 16, borderWidth: 2, borderRadius: 24, marginBottom: 16 },
  modalIconBox: { padding: 12, borderRadius: 16, marginRight: 16 },
  modalBtnText: { fontWeight: 'bold' }
});