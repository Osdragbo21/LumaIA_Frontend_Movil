// [MÓVIL] Ruta: src/screens/AgendaScreen.tsx

import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Modal, Pressable, TextInput, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Calendar, MapPin, Clock, Pill, Stethoscope, CheckCircle, Plus, StickyNote, X } from 'lucide-react-native';

import { useAuthStore } from '../store/useAuthStore';
import { useAppTheme } from '../store/useThemeStore';
import { obtenerMedicamentos, crearMedicamento } from '../services/medicamentos.service';
import { obtenerCitas, crearCita } from '../services/citas.service';
import { obtenerNotas, crearNota } from '../services/notas.service';

type FiltroType = 'Todo' | 'Citas' | 'Medicamentos' | 'Notas';
type ModalState = 'none' | 'menu' | 'medicamento' | 'cita' | 'nota';

export const AgendaScreen = () => {
  const { usuarioId } = useAuthStore();
  const { colors, typography } = useAppTheme();
  const queryClient = useQueryClient();
  
  const [filtro, setFiltro] = useState<FiltroType>('Todo');
  const [modalVisible, setModalVisible] = useState<ModalState>('none');

  // ESTADOS: FORMULARIO MEDICAMENTO
  const [medNombre, setMedNombre] = useState('');
  const [medDosis, setMedDosis] = useState('');
  const [medFrecuencia, setMedFrecuencia] = useState('');
  const [medPrimeraToma, setMedPrimeraToma] = useState(new Date());
  const [showMedTimePicker, setShowMedTimePicker] = useState(false);

  // ESTADOS: FORMULARIO CITA
  const [citaTitulo, setCitaTitulo] = useState('');
  const [citaUbicacion, setCitaUbicacion] = useState('');
  const [citaFechaObj, setCitaFechaObj] = useState(new Date());
  const [citaHoraObj, setCitaHoraObj] = useState(new Date());
  const [showCitaDatePicker, setShowCitaDatePicker] = useState(false);
  const [showCitaTimePicker, setShowCitaTimePicker] = useState(false);

  // ESTADOS: FORMULARIO NOTA
  const [notaContenido, setNotaContenido] = useState('');

  // 1. QUERIES
  const { data: medicamentos = [], isLoading: loadMed } = useQuery({ queryKey: ['medicamentos', usuarioId], queryFn: () => obtenerMedicamentos(usuarioId!), enabled: !!usuarioId });
  const { data: citas = [], isLoading: loadCitas } = useQuery({ queryKey: ['citas', usuarioId], queryFn: () => obtenerCitas(usuarioId!), enabled: !!usuarioId });
  const { data: notas = [], isLoading: loadNotas } = useQuery({ queryKey: ['notas', usuarioId], queryFn: () => obtenerNotas(usuarioId!), enabled: !!usuarioId });

  const isLoading = loadMed || loadCitas || loadNotas;

  const mostrarCitas = filtro === 'Todo' || filtro === 'Citas';
  const mostrarMedicamentos = filtro === 'Todo' || filtro === 'Medicamentos';
  const mostrarNotas = filtro === 'Todo' || filtro === 'Notas';

  const emptyState = (!isLoading && 
    ((mostrarCitas && citas.length === 0 && !mostrarMedicamentos && !mostrarNotas) || 
    (mostrarMedicamentos && medicamentos.length === 0 && !mostrarCitas && !mostrarNotas) || 
    (mostrarNotas && notas.length === 0 && !mostrarCitas && !mostrarMedicamentos) ||
    (filtro === 'Todo' && citas.length === 0 && medicamentos.length === 0 && notas.length === 0))
  );

  // 2. MUTACIONES
  const mutMed = useMutation({
    mutationFn: () => {
      // Formatear HH:MM seguro
      const hh = medPrimeraToma.getHours().toString().padStart(2, '0');
      const mm = medPrimeraToma.getMinutes().toString().padStart(2, '0');
      const horaFormateada = `${hh}:${mm}`;

      return crearMedicamento({ 
        usuario_id: usuarioId!, 
        nombre_farmaco: medNombre.trim(), 
        dosis: medDosis.trim(), 
        frecuencia_horas: parseInt(medFrecuencia) || 24, 
        horarios_especificos: [horaFormateada] 
      });
    },
    onSuccess: () => resetAndClose('¡Medicamento guardado con éxito!', 'medicamentos')
  });

  const mutCita = useMutation({
    mutationFn: () => {
      // Combinar Fecha y Hora en un solo objeto ISO
      const isoDate = new Date(
        citaFechaObj.getFullYear(),
        citaFechaObj.getMonth(),
        citaFechaObj.getDate(),
        citaHoraObj.getHours(),
        citaHoraObj.getMinutes()
      ).toISOString();

      return crearCita({ 
        usuario_id: usuarioId!, 
        titulo_evento: citaTitulo.trim(), 
        fecha_hora: isoDate, 
        ubicacion: citaUbicacion.trim() 
      });
    },
    onSuccess: () => resetAndClose('¡Cita programada con éxito!', 'citas')
  });

  const mutNota = useMutation({
    mutationFn: () => crearNota({ 
      usuario_id: usuarioId!, 
      contenido: notaContenido.trim(), 
      fecha_creacion: new Date().toISOString() 
    }),
    onSuccess: () => resetAndClose('¡Apunte guardado con éxito!', 'notas')
  });

  const resetAndClose = (mensaje: string, queryKey: string) => {
    Alert.alert('Éxito', mensaje);
    setModalVisible('none');
    
    // Limpieza de estados
    setMedNombre(''); setMedDosis(''); setMedFrecuencia(''); setMedPrimeraToma(new Date());
    setCitaTitulo(''); setCitaUbicacion(''); setCitaFechaObj(new Date()); setCitaHoraObj(new Date());
    setNotaContenido('');
    
    // Invalida caché para actualización en tiempo real
    queryClient.invalidateQueries({ queryKey: [queryKey, usuarioId] });
  };

  // Manejadores de los Pickers
  const onChangeMedTime = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShowMedTimePicker(false);
    if (selectedDate) setMedPrimeraToma(selectedDate);
  };

  const onChangeCitaDate = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShowCitaDatePicker(false);
    if (selectedDate) setCitaFechaObj(selectedDate);
  };

  const onChangeCitaTime = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShowCitaTimePicker(false);
    if (selectedDate) setCitaHoraObj(selectedDate);
  };

  // Formateadores de UI
  const formatTimeUI = (date: Date) => {
    const hh = date.getHours().toString().padStart(2, '0');
    const mm = date.getMinutes().toString().padStart(2, '0');
    return `${hh}:${mm}`;
  };

  const formatDateUI = (date: Date) => {
    return date.toLocaleDateString('es-MX', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      
      {/* CABECERA Y FILTROS */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.textPrimary, fontSize: typography.h1 }]}>Mi Agenda</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContainer}>
          {(['Todo', 'Citas', 'Medicamentos', 'Notas'] as FiltroType[]).map((opcion) => (
            <TouchableOpacity key={opcion} onPress={() => setFiltro(opcion)} activeOpacity={0.8}
              style={[styles.filterPill, { backgroundColor: filtro === opcion ? colors.primary : colors.background, borderColor: filtro === opcion ? colors.primary : colors.border }]}>
              <Text style={{ color: filtro === opcion ? '#fff' : colors.textSecondary, fontSize: typography.base, fontWeight: 'bold' }}>{opcion}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {isLoading && (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={{ color: colors.textSecondary, fontSize: typography.lg, marginTop: 16, fontWeight: 'bold' }}>Sincronizando agenda...</Text>
          </View>
        )}

        {!isLoading && (
          <View style={styles.listContainer}>
            
            {/* LISTA DE CITAS */}
            {mostrarCitas && citas.map((cita) => (
              <View key={cita._id} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, borderLeftColor: colors.warning }]}>
                <View style={styles.cardHeader}>
                  <View style={[styles.iconBox, { backgroundColor: colors.warning + '15' }]}>
                    <Stethoscope color={colors.warning} size={32} />
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={[styles.cardTitle, { color: colors.textPrimary, fontSize: typography.xl }]}>{cita.titulo_evento}</Text>
                    <View style={styles.badgeContainer}><Text style={[styles.badgeText, { color: colors.warning, fontSize: typography.sm }]}>CITA MÉDICA</Text></View>
                  </View>
                </View>
                <View style={[styles.cardDetails, { borderTopColor: colors.border }]}>
                  <View style={styles.detailRow}>
                    <Calendar color={colors.textSecondary} size={20} />
                    <Text style={[styles.detailText, { color: colors.textSecondary, fontSize: typography.base }]}>
                      {new Date(cita.fecha_hora).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })} a las {new Date(cita.fecha_hora).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                  {cita.ubicacion && (
                    <View style={[styles.detailRow, { marginTop: 8 }]}>
                      <MapPin color={colors.textSecondary} size={20} />
                      <Text style={[styles.detailText, { color: colors.textSecondary, fontSize: typography.base }]}>{cita.ubicacion}</Text>
                    </View>
                  )}
                </View>
              </View>
            ))}

            {/* LISTA DE MEDICAMENTOS */}
            {mostrarMedicamentos && medicamentos.map((med) => (
              <View key={med._id} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, borderLeftColor: colors.primary }]}>
                <View style={styles.cardHeader}>
                  <View style={[styles.iconBox, { backgroundColor: colors.primaryLight }]}>
                    <Pill color={colors.primary} size={32} />
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={[styles.cardTitle, { color: colors.textPrimary, fontSize: typography.xl }]}>{med.nombre_farmaco}</Text>
                    <View style={styles.badgeContainerPrimary}><Text style={[styles.badgeTextPrimary, { color: colors.primary, fontSize: typography.sm }]}>MEDICAMENTO</Text></View>
                  </View>
                </View>
                <View style={[styles.cardDetails, { borderTopColor: colors.border }]}>
                  <View style={styles.detailRow}>
                    <Clock color={colors.textSecondary} size={20} />
                    <Text style={[styles.detailText, { color: colors.textSecondary, fontSize: typography.base, fontWeight: 'bold' }]}>
                      A las {med.horarios_especificos?.join(', ')} • Cada {med.frecuencia_horas} hrs
                    </Text>
                  </View>
                  <View style={[styles.detailRow, { marginTop: 8 }]}>
                    <CheckCircle color={colors.textSecondary} size={20} />
                    <Text style={[styles.detailText, { color: colors.textSecondary, fontSize: typography.base }]}>Dosis: {med.dosis}</Text>
                  </View>
                </View>
              </View>
            ))}

            {/* LISTA DE NOTAS */}
            {mostrarNotas && notas.map((nota) => (
              <View key={nota._id} style={[styles.card, { backgroundColor: '#fefce8', borderColor: '#fde047', borderLeftColor: '#eab308' }]}>
                <View style={styles.cardHeader}>
                  <View style={[styles.iconBox, { backgroundColor: '#fef08a' }]}>
                    <StickyNote color="#ca8a04" size={32} />
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={[styles.cardTitle, { color: colors.textPrimary, fontSize: typography.xl }]}>{nota.contenido}</Text>
                    <Text style={{ color: colors.textSecondary, fontSize: typography.sm, marginTop: 4 }}>{new Date(nota.fecha_creacion).toLocaleDateString('es-MX')}</Text>
                  </View>
                </View>
              </View>
            ))}

            {/* ESTADO VACÍO */}
            {emptyState && (
              <View style={[styles.emptyCard, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                <View style={{ backgroundColor: colors.background, padding: 20, borderRadius: 100, marginBottom: 16 }}><Calendar color={colors.textSecondary} size={48} /></View>
                <Text style={{ fontSize: typography.h2, fontWeight: 'bold', color: colors.textPrimary }}>Agenda Limpia</Text>
                <Text style={{ fontSize: typography.lg, color: colors.textSecondary, textAlign: 'center', marginTop: 8 }}>No tienes eventos registrados para este filtro.</Text>
              </View>
            )}

          </View>
        )}
      </ScrollView>

      {/* FAB - FLOATING ACTION BUTTON */}
      <TouchableOpacity 
        style={[styles.fab, { backgroundColor: colors.primary, shadowColor: colors.primary }]}
        activeOpacity={0.8}
        onPress={() => setModalVisible('menu')}
      >
        <Plus color="#ffffff" size={36} strokeWidth={3} />
      </TouchableOpacity>

      {/* MODAL MAESTRO */}
      <Modal animationType="slide" transparent={true} visible={modalVisible !== 'none'} onRequestClose={() => setModalVisible('none')}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
              
              <View style={styles.modalHeader}>
                <Text style={{ fontSize: typography.h2, fontWeight: '900', color: colors.textPrimary }}>
                  {modalVisible === 'menu' && '¿Qué deseas agregar?'}
                  {modalVisible === 'medicamento' && 'Nuevo Tratamiento'}
                  {modalVisible === 'cita' && 'Nueva Cita Médica'}
                  {modalVisible === 'nota' && 'Nuevo Apunte'}
                </Text>
                <TouchableOpacity onPress={() => setModalVisible('none')} style={{ padding: 8, backgroundColor: colors.background, borderRadius: 100 }}>
                  <X color={colors.textSecondary} size={24} />
                </TouchableOpacity>
              </View>

              <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                
                {/* MENU PRINCIPAL */}
                {modalVisible === 'menu' && (
                  <>
                    <TouchableOpacity style={[styles.menuBtn, { borderColor: colors.border }]} onPress={() => setModalVisible('medicamento')}>
                      <View style={[styles.menuIconBox, { backgroundColor: colors.primaryLight }]}><Pill color={colors.primary} size={32} /></View>
                      <Text style={[styles.menuBtnText, { color: colors.textPrimary, fontSize: typography.xl }]}>Medicamento</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.menuBtn, { borderColor: colors.border }]} onPress={() => setModalVisible('cita')}>
                      <View style={[styles.menuIconBox, { backgroundColor: colors.warning + '15' }]}><Calendar color={colors.warning} size={32} /></View>
                      <Text style={[styles.menuBtnText, { color: colors.textPrimary, fontSize: typography.xl }]}>Cita Médica</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.menuBtn, { borderColor: colors.border }]} onPress={() => setModalVisible('nota')}>
                      <View style={[styles.menuIconBox, { backgroundColor: '#fef08a' }]}><StickyNote color="#ca8a04" size={32} /></View>
                      <Text style={[styles.menuBtnText, { color: colors.textPrimary, fontSize: typography.xl }]}>Nota Personal</Text>
                    </TouchableOpacity>
                  </>
                )}

                {/* FORMULARIO MEDICAMENTO */}
                {modalVisible === 'medicamento' && (
                  <View style={{ paddingBottom: 20 }}>
                    <Text style={[styles.label, { color: colors.textPrimary, fontSize: typography.lg }]}>Nombre del Fármaco</Text>
                    <TextInput style={[styles.input, { borderColor: colors.border, color: colors.textPrimary, fontSize: typography.lg }]} placeholder="Ej. Losartán" placeholderTextColor={colors.textSecondary} value={medNombre} onChangeText={setMedNombre} />
                    
                    <Text style={[styles.label, { color: colors.textPrimary, fontSize: typography.lg, marginTop: 16 }]}>Dosis Recomendada</Text>
                    <TextInput style={[styles.input, { borderColor: colors.border, color: colors.textPrimary, fontSize: typography.lg }]} placeholder="Ej. 1 Pastilla" placeholderTextColor={colors.textSecondary} value={medDosis} onChangeText={setMedDosis} />
                    
                    <Text style={[styles.label, { color: colors.textPrimary, fontSize: typography.lg, marginTop: 16 }]}>Frecuencia (Cada cuántas horas)</Text>
                    <TextInput style={[styles.input, { borderColor: colors.border, color: colors.textPrimary, fontSize: typography.lg }]} placeholder="Ej. 8" keyboardType="numeric" placeholderTextColor={colors.textSecondary} value={medFrecuencia} onChangeText={setMedFrecuencia} />
                    
                    {/* HORA ACCESIBLE */}
                    <Text style={[styles.label, { color: colors.textPrimary, fontSize: typography.lg, marginTop: 16 }]}>¿A qué hora es la primera toma?</Text>
                    <TouchableOpacity 
                      style={[styles.inputBtn, { borderColor: colors.border, backgroundColor: colors.background }]} 
                      onPress={() => setShowMedTimePicker(true)}
                    >
                      <Clock color={colors.primary} size={24} style={{ marginRight: 12 }} />
                      <Text style={{ color: colors.textPrimary, fontSize: typography.lg, fontWeight: 'bold' }}>{formatTimeUI(medPrimeraToma)}</Text>
                    </TouchableOpacity>

                    {showMedTimePicker && (
                      <DateTimePicker value={medPrimeraToma} mode="time" display="default" onChange={onChangeMedTime} />
                    )}

                    <TouchableOpacity style={[styles.submitBtn, { backgroundColor: colors.primary, opacity: mutMed.isPending ? 0.7 : 1 }]} onPress={() => mutMed.mutate()} disabled={mutMed.isPending || !medNombre || !medDosis}>
                      {mutMed.isPending ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontSize: typography.h2, fontWeight: '900' }}>Guardar</Text>}
                    </TouchableOpacity>
                  </View>
                )}

                {/* FORMULARIO CITA */}
                {modalVisible === 'cita' && (
                  <View style={{ paddingBottom: 20 }}>
                    <Text style={[styles.label, { color: colors.textPrimary, fontSize: typography.lg }]}>Motivo o Especialidad</Text>
                    <TextInput style={[styles.input, { borderColor: colors.border, color: colors.textPrimary, fontSize: typography.lg }]} placeholder="Ej. Cardiólogo" placeholderTextColor={colors.textSecondary} value={citaTitulo} onChangeText={setCitaTitulo} />
                    
                    {/* FECHA ACCESIBLE */}
                    <Text style={[styles.label, { color: colors.textPrimary, fontSize: typography.lg, marginTop: 16 }]}>Día de la cita</Text>
                    <TouchableOpacity 
                      style={[styles.inputBtn, { borderColor: colors.border, backgroundColor: colors.background }]} 
                      onPress={() => setShowCitaDatePicker(true)}
                    >
                      <Calendar color={colors.warning} size={24} style={{ marginRight: 12 }} />
                      <Text style={{ color: colors.textPrimary, fontSize: typography.lg, fontWeight: 'bold', textTransform: 'capitalize' }}>{formatDateUI(citaFechaObj)}</Text>
                    </TouchableOpacity>

                    {showCitaDatePicker && (
                      <DateTimePicker value={citaFechaObj} mode="date" display="default" minimumDate={new Date()} onChange={onChangeCitaDate} />
                    )}

                    {/* HORA ACCESIBLE */}
                    <Text style={[styles.label, { color: colors.textPrimary, fontSize: typography.lg, marginTop: 16 }]}>Hora</Text>
                    <TouchableOpacity 
                      style={[styles.inputBtn, { borderColor: colors.border, backgroundColor: colors.background }]} 
                      onPress={() => setShowCitaTimePicker(true)}
                    >
                      <Clock color={colors.warning} size={24} style={{ marginRight: 12 }} />
                      <Text style={{ color: colors.textPrimary, fontSize: typography.lg, fontWeight: 'bold' }}>{formatTimeUI(citaHoraObj)}</Text>
                    </TouchableOpacity>

                    {showCitaTimePicker && (
                      <DateTimePicker value={citaHoraObj} mode="time" display="default" onChange={onChangeCitaTime} />
                    )}

                    <Text style={[styles.label, { color: colors.textPrimary, fontSize: typography.lg, marginTop: 16 }]}>Ubicación (Opcional)</Text>
                    <TextInput style={[styles.input, { borderColor: colors.border, color: colors.textPrimary, fontSize: typography.lg }]} placeholder="Ej. Clínica Centro" placeholderTextColor={colors.textSecondary} value={citaUbicacion} onChangeText={setCitaUbicacion} />
                    
                    <TouchableOpacity style={[styles.submitBtn, { backgroundColor: colors.primary, opacity: mutCita.isPending ? 0.7 : 1 }]} onPress={() => mutCita.mutate()} disabled={mutCita.isPending || !citaTitulo}>
                      {mutCita.isPending ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontSize: typography.h2, fontWeight: '900' }}>Programar Cita</Text>}
                    </TouchableOpacity>
                  </View>
                )}

                {/* FORMULARIO NOTA */}
                {modalVisible === 'nota' && (
                  <View style={{ paddingBottom: 20 }}>
                    <Text style={[styles.label, { color: colors.textPrimary, fontSize: typography.lg }]}>¿Qué deseas recordar?</Text>
                    <TextInput style={[styles.input, { borderColor: colors.border, color: colors.textPrimary, fontSize: typography.lg, minHeight: 120, textAlignVertical: 'top', paddingTop: 16 }]} placeholder="Escribe tu apunte aquí..." placeholderTextColor={colors.textSecondary} multiline value={notaContenido} onChangeText={setNotaContenido} />
                    
                    <TouchableOpacity style={[styles.submitBtn, { backgroundColor: colors.primary, opacity: mutNota.isPending ? 0.7 : 1 }]} onPress={() => mutNota.mutate()} disabled={mutNota.isPending || !notaContenido}>
                      {mutNota.isPending ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontSize: typography.h2, fontWeight: '900' }}>Guardar Apunte</Text>}
                    </TouchableOpacity>
                  </View>
                )}

              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: { padding: 20, paddingBottom: 16, borderBottomWidth: 2 },
  headerTitle: { fontWeight: '900', marginBottom: 16 },
  filterContainer: { gap: 12, paddingRight: 20 },
  filterPill: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 100, borderWidth: 2, minHeight: 48, justifyContent: 'center' },
  scrollContent: { flexGrow: 1, padding: 20, paddingBottom: 100 }, 
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
  cardDetails: { padding: 20, paddingTop: 16, borderTopWidth: 2, backgroundColor: '#fafafa' },
  detailRow: { flexDirection: 'row', alignItems: 'center' },
  detailText: { marginLeft: 12, fontWeight: '600', flex: 1 },
  emptyCard: { padding: 40, borderRadius: 24, borderWidth: 2, borderStyle: 'dashed', alignItems: 'center', marginTop: 20 },
  fab: { position: 'absolute', bottom: 24, right: 24, width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 10 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 40, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  menuBtn: { flexDirection: 'row', alignItems: 'center', padding: 16, borderWidth: 2, borderRadius: 24, marginBottom: 16 },
  menuIconBox: { padding: 12, borderRadius: 16, marginRight: 16 },
  menuBtnText: { fontWeight: 'bold' },
  label: { fontWeight: '900', marginBottom: 8 },
  input: { borderWidth: 2, borderRadius: 16, paddingHorizontal: 16, minHeight: 64, fontWeight: '600', backgroundColor: '#fff' },
  inputBtn: { flexDirection: 'row', alignItems: 'center', borderWidth: 2, borderRadius: 16, paddingHorizontal: 16, minHeight: 64 },
  submitBtn: { alignItems: 'center', justifyContent: 'center', minHeight: 64, borderRadius: 20, borderBottomWidth: 4, marginTop: 32 },
});