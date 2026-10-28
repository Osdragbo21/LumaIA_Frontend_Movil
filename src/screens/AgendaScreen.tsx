// [MÓVIL] Ruta: src/screens/AgendaScreen.tsx

import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Modal, TextInput, KeyboardAvoidingView, Platform, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Calendar, MapPin, Clock, Pill, Stethoscope, CheckCircle, Plus, StickyNote, X, Edit2, Trash2, RotateCcw } from 'lucide-react-native';

import { useAuthStore } from '../store/useAuthStore';
import { useAppTheme } from '../store/useThemeStore';
import { obtenerMedicamentos, obtenerMedicamentosPapelera, crearMedicamento, actualizarMedicamento, eliminarMedicamento, restaurarMedicamento } from '../services/medicamentos.service';
import { obtenerCitas, obtenerCitasPapelera, crearCita, actualizarCita, eliminarCita, restaurarCita } from '../services/citas.service';
import { obtenerNotas, obtenerNotasPapelera, crearNota, actualizarNota, eliminarNota, restaurarNota } from '../services/notas.service';

type FiltroType = 'Todo' | 'Citas' | 'Medicamentos' | 'Notas' | 'Papelera';
type ModalState = 'none' | 'menu' | 'medicamento' | 'cita' | 'nota';

export const AgendaScreen = () => {
  const { usuarioId } = useAuthStore();
  const { colors, typography } = useAppTheme();
  const queryClient = useQueryClient();
  
  const [filtro, setFiltro] = useState<FiltroType>('Todo');
  const [modalVisible, setModalVisible] = useState<ModalState>('none');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Estados Formulario
  const [medNombre, setMedNombre] = useState('');
  const [medDosis, setMedDosis] = useState('');
  const [medFrecuencia, setMedFrecuencia] = useState('');
  const [medPrimeraToma, setMedPrimeraToma] = useState(new Date());
  const [showMedTimePicker, setShowMedTimePicker] = useState(false);

  const [citaTitulo, setCitaTitulo] = useState('');
  const [citaUbicacion, setCitaUbicacion] = useState('');
  const [citaFechaObj, setCitaFechaObj] = useState(new Date());
  const [citaHoraObj, setCitaHoraObj] = useState(new Date());
  const [showCitaDatePicker, setShowCitaDatePicker] = useState(false);
  const [showCitaTimePicker, setShowCitaTimePicker] = useState(false);

  const [notaContenido, setNotaContenido] = useState('');

  // Queries Activos
  const { data: medicamentos = [], isLoading: loadMed } = useQuery({ queryKey: ['medicamentos', usuarioId], queryFn: () => obtenerMedicamentos(usuarioId!), enabled: !!usuarioId });
  const { data: citas = [], isLoading: loadCitas } = useQuery({ queryKey: ['citas', usuarioId], queryFn: () => obtenerCitas(usuarioId!), enabled: !!usuarioId });
  const { data: notas = [], isLoading: loadNotas } = useQuery({ queryKey: ['notas', usuarioId], queryFn: () => obtenerNotas(usuarioId!), enabled: !!usuarioId });

  // Queries Papelera
  const { data: medPapelera = [], isLoading: loadMedPapelera } = useQuery({ queryKey: ['medicamentosPapelera', usuarioId], queryFn: () => obtenerMedicamentosPapelera(usuarioId!), enabled: filtro === 'Papelera' });
  const { data: citasPapelera = [], isLoading: loadCitasPapelera } = useQuery({ queryKey: ['citasPapelera', usuarioId], queryFn: () => obtenerCitasPapelera(usuarioId!), enabled: filtro === 'Papelera' });
  const { data: notasPapelera = [], isLoading: loadNotasPapelera } = useQuery({ queryKey: ['notasPapelera', usuarioId], queryFn: () => obtenerNotasPapelera(usuarioId!), enabled: filtro === 'Papelera' });

  const isLoading = filtro === 'Papelera' ? (loadMedPapelera || loadCitasPapelera || loadNotasPapelera) : (loadMed || loadCitas || loadNotas);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['medicamentos', usuarioId] });
    await queryClient.invalidateQueries({ queryKey: ['citas', usuarioId] });
    await queryClient.invalidateQueries({ queryKey: ['notas', usuarioId] });
    await queryClient.invalidateQueries({ queryKey: ['medicamentosPapelera', usuarioId] });
    await queryClient.invalidateQueries({ queryKey: ['citasPapelera', usuarioId] });
    await queryClient.invalidateQueries({ queryKey: ['notasPapelera', usuarioId] });
    setRefreshing(false);
  }, [queryClient, usuarioId]);

  // MUTACIONES CREAR / ACTUALIZAR
  const mutMed = useMutation({
    mutationFn: () => {
      const hh = medPrimeraToma.getHours().toString().padStart(2, '0');
      const mm = medPrimeraToma.getMinutes().toString().padStart(2, '0');
      const payload = { nombre_farmaco: medNombre.trim(), dosis: medDosis.trim(), frecuencia_horas: parseInt(medFrecuencia) || 24, horarios_especificos: [`${hh}:${mm}`] };
      return editingId ? actualizarMedicamento({ _id: editingId, ...payload }) : crearMedicamento({ usuario_id: usuarioId!, ...payload });
    },
    onSuccess: () => resetAndClose('¡Medicamento guardado!', 'medicamentos')
  });

  const mutCita = useMutation({
    mutationFn: () => {
      const isoDate = new Date(citaFechaObj.getFullYear(), citaFechaObj.getMonth(), citaFechaObj.getDate(), citaHoraObj.getHours(), citaHoraObj.getMinutes()).toISOString();
      const payload = { titulo_evento: citaTitulo.trim(), fecha_hora: isoDate, ubicacion: citaUbicacion.trim() };
      return editingId ? actualizarCita({ _id: editingId, ...payload }) : crearCita({ usuario_id: usuarioId!, ...payload });
    },
    onSuccess: () => resetAndClose('¡Cita guardada!', 'citas')
  });

  const mutNota = useMutation({
    mutationFn: () => {
      const payload = { contenido: notaContenido.trim() };
      return editingId ? actualizarNota({ _id: editingId, ...payload }) : crearNota({ usuario_id: usuarioId!, fecha_creacion: new Date().toISOString(), ...payload });
    },
    onSuccess: () => resetAndClose('¡Apunte guardado!', 'notas')
  });

  // MUTACIONES ELIMINAR
  const mutDelMed = useMutation({ mutationFn: (id: string) => eliminarMedicamento(id), onSuccess: () => onRefresh() });
  const mutDelCita = useMutation({ mutationFn: (id: string) => eliminarCita(id), onSuccess: () => onRefresh() });
  const mutDelNota = useMutation({ mutationFn: (id: string) => eliminarNota(id), onSuccess: () => onRefresh() });

  // MUTACIONES RESTAURAR
  const mutResMed = useMutation({ mutationFn: (id: string) => restaurarMedicamento(id), onSuccess: () => { Alert.alert('Éxito', 'Restaurado'); onRefresh(); } });
  const mutResCita = useMutation({ mutationFn: (id: string) => restaurarCita(id), onSuccess: () => { Alert.alert('Éxito', 'Restaurado'); onRefresh(); } });
  const mutResNota = useMutation({ mutationFn: (id: string) => restaurarNota(id), onSuccess: () => { Alert.alert('Éxito', 'Restaurado'); onRefresh(); } });

  const resetAndClose = (mensaje: string, queryKey: string) => {
    Alert.alert('Éxito', mensaje);
    closeModal();
    queryClient.invalidateQueries({ queryKey: [queryKey, usuarioId] });
  };

  const closeModal = () => {
    setModalVisible('none');
    setEditingId(null);
    setMedNombre(''); setMedDosis(''); setMedFrecuencia(''); setMedPrimeraToma(new Date());
    setCitaTitulo(''); setCitaUbicacion(''); setCitaFechaObj(new Date()); setCitaHoraObj(new Date());
    setNotaContenido('');
  };

  // HANDLERS EDITAR
  const handleEditMed = (med: any) => {
    setMedNombre(med.nombre_farmaco); setMedDosis(med.dosis); setMedFrecuencia(med.frecuencia_horas?.toString() || '');
    if (med.horarios_especificos?.length > 0) {
      const [h, m] = med.horarios_especificos[0].split(':');
      const d = new Date(); d.setHours(parseInt(h), parseInt(m));
      setMedPrimeraToma(d);
    }
    setEditingId(med._id); setModalVisible('medicamento');
  };

  const handleEditCita = (cita: any) => {
    setCitaTitulo(cita.titulo_evento); setCitaUbicacion(cita.ubicacion || '');
    const d = new Date(cita.fecha_hora);
    setCitaFechaObj(d); setCitaHoraObj(d);
    setEditingId(cita._id); setModalVisible('cita');
  };

  const handleEditNota = (nota: any) => {
    setNotaContenido(nota.contenido);
    setEditingId(nota._id); setModalVisible('nota');
  };

  // HANDLERS ELIMINAR
  const confirmDelete = (tipo: string, id: string, deleteFn: any) => {
    Alert.alert('Eliminar', `¿Estás seguro de enviar est${tipo === 'nota' ? 'a' : 'e'} ${tipo} a la papelera?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => deleteFn.mutate(id) }
    ]);
  };

  const formatTimeUI = (date: Date) => `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  const formatDateUI = (date: Date) => date.toLocaleDateString('es-MX', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });

  // Listas a renderizar
  const renderCitas = filtro === 'Papelera' ? citasPapelera : citas;
  const renderMed = filtro === 'Papelera' ? medPapelera : medicamentos;
  const renderNotas = filtro === 'Papelera' ? notasPapelera : notas;

  const mostrarCitas = filtro === 'Todo' || filtro === 'Citas' || filtro === 'Papelera';
  const mostrarMedicamentos = filtro === 'Todo' || filtro === 'Medicamentos' || filtro === 'Papelera';
  const mostrarNotas = filtro === 'Todo' || filtro === 'Notas' || filtro === 'Papelera';

  const emptyState = !isLoading && renderCitas.length === 0 && renderMed.length === 0 && renderNotas.length === 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.textPrimary, fontSize: typography.h1 }]}>Mi Agenda</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContainer}>
          {(['Todo', 'Citas', 'Medicamentos', 'Notas', 'Papelera'] as FiltroType[]).map((opcion) => (
            <TouchableOpacity key={opcion} onPress={() => setFiltro(opcion)} activeOpacity={0.8}
              style={[styles.filterPill, { backgroundColor: filtro === opcion ? (opcion === 'Papelera' ? colors.danger : colors.primary) : colors.background, borderColor: filtro === opcion ? (opcion === 'Papelera' ? colors.danger : colors.primary) : colors.border }]}>
              {opcion === 'Papelera' && <Trash2 color={filtro === opcion ? '#fff' : colors.textSecondary} size={16} style={{ marginRight: 6 }} />}
              <Text style={{ color: filtro === opcion ? '#fff' : colors.textSecondary, fontSize: typography.base, fontWeight: 'bold' }}>{opcion}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}>
        {isLoading && !refreshing && (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={{ color: colors.textSecondary, fontSize: typography.lg, marginTop: 16, fontWeight: 'bold' }}>Sincronizando agenda...</Text>
          </View>
        )}

        {!isLoading && (
          <View style={styles.listContainer}>
            {mostrarCitas && renderCitas.map((cita) => (
              <View key={cita._id} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, borderLeftColor: colors.warning }]}>
                <View style={styles.cardHeader}>
                  <View style={[styles.iconBox, { backgroundColor: colors.warning + '15' }]}><Stethoscope color={colors.warning} size={32} /></View>
                  <View style={styles.cardInfo}>
                    <Text style={[styles.cardTitle, { color: colors.textPrimary, fontSize: typography.xl }]}>{cita.titulo_evento}</Text>
                    <View style={styles.badgeContainer}><Text style={[styles.badgeText, { color: colors.warning, fontSize: typography.sm }]}>CITA MÉDICA</Text></View>
                  </View>
                  {/* BOTONES DE ACCIÓN */}
                  <View style={styles.actionIconsRow}>
                    {filtro === 'Papelera' ? (
                      <TouchableOpacity onPress={() => mutResCita.mutate(cita._id)} style={styles.iconBtn}><RotateCcw color={colors.success} size={24} /></TouchableOpacity>
                    ) : (
                      <>
                        <TouchableOpacity onPress={() => handleEditCita(cita)} style={styles.iconBtn}><Edit2 color={colors.primary} size={24} /></TouchableOpacity>
                        <TouchableOpacity onPress={() => confirmDelete('cita', cita._id, mutDelCita)} style={styles.iconBtn}><Trash2 color={colors.danger} size={24} /></TouchableOpacity>
                      </>
                    )}
                  </View>
                </View>
                <View style={[styles.cardDetails, { borderTopColor: colors.border }]}>
                  <View style={styles.detailRow}>
                    <Calendar color={colors.textSecondary} size={20} />
                    <Text style={[styles.detailText, { color: colors.textSecondary, fontSize: typography.base }]}>{new Date(cita.fecha_hora).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })} a las {new Date(cita.fecha_hora).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</Text>
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

            {mostrarMedicamentos && renderMed.map((med) => (
              <View key={med._id} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, borderLeftColor: colors.primary }]}>
                <View style={styles.cardHeader}>
                  <View style={[styles.iconBox, { backgroundColor: colors.primaryLight }]}><Pill color={colors.primary} size={32} /></View>
                  <View style={styles.cardInfo}>
                    <Text style={[styles.cardTitle, { color: colors.textPrimary, fontSize: typography.xl }]}>{med.nombre_farmaco}</Text>
                    <View style={styles.badgeContainerPrimary}><Text style={[styles.badgeTextPrimary, { color: colors.primary, fontSize: typography.sm }]}>MEDICAMENTO</Text></View>
                  </View>
                  {/* BOTONES DE ACCIÓN */}
                  <View style={styles.actionIconsRow}>
                    {filtro === 'Papelera' ? (
                      <TouchableOpacity onPress={() => mutResMed.mutate(med._id)} style={styles.iconBtn}><RotateCcw color={colors.success} size={24} /></TouchableOpacity>
                    ) : (
                      <>
                        <TouchableOpacity onPress={() => handleEditMed(med)} style={styles.iconBtn}><Edit2 color={colors.primary} size={24} /></TouchableOpacity>
                        <TouchableOpacity onPress={() => confirmDelete('medicamento', med._id, mutDelMed)} style={styles.iconBtn}><Trash2 color={colors.danger} size={24} /></TouchableOpacity>
                      </>
                    )}
                  </View>
                </View>
                <View style={[styles.cardDetails, { borderTopColor: colors.border }]}>
                  <View style={styles.detailRow}>
                    <Clock color={colors.textSecondary} size={20} />
                    <Text style={[styles.detailText, { color: colors.textSecondary, fontSize: typography.base, fontWeight: 'bold' }]}>A las {med.horarios_especificos?.join(', ')} • Cada {med.frecuencia_horas} hrs</Text>
                  </View>
                  <View style={[styles.detailRow, { marginTop: 8 }]}>
                    <CheckCircle color={colors.textSecondary} size={20} />
                    <Text style={[styles.detailText, { color: colors.textSecondary, fontSize: typography.base }]}>Dosis: {med.dosis}</Text>
                  </View>
                </View>
              </View>
            ))}

            {mostrarNotas && renderNotas.map((nota) => (
              <View key={nota._id} style={[styles.card, { backgroundColor: '#fefce8', borderColor: '#fde047', borderLeftColor: '#eab308' }]}>
                <View style={styles.cardHeader}>
                  <View style={[styles.iconBox, { backgroundColor: '#fef08a' }]}><StickyNote color="#ca8a04" size={32} /></View>
                  <View style={styles.cardInfo}>
                    <Text style={[styles.cardTitle, { color: colors.textPrimary, fontSize: typography.xl }]}>{nota.contenido}</Text>
                    <Text style={{ color: colors.textSecondary, fontSize: typography.sm, marginTop: 4 }}>{new Date(nota.fecha_creacion).toLocaleDateString('es-MX')}</Text>
                  </View>
                  {/* BOTONES DE ACCIÓN */}
                  <View style={styles.actionIconsRow}>
                    {filtro === 'Papelera' ? (
                      <TouchableOpacity onPress={() => mutResNota.mutate(nota._id)} style={styles.iconBtn}><RotateCcw color={colors.success} size={24} /></TouchableOpacity>
                    ) : (
                      <>
                        <TouchableOpacity onPress={() => handleEditNota(nota)} style={styles.iconBtn}><Edit2 color={colors.primary} size={24} /></TouchableOpacity>
                        <TouchableOpacity onPress={() => confirmDelete('nota', nota._id, mutDelNota)} style={styles.iconBtn}><Trash2 color={colors.danger} size={24} /></TouchableOpacity>
                      </>
                    )}
                  </View>
                </View>
              </View>
            ))}

            {emptyState && (
              <View style={[styles.emptyCard, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                <View style={{ backgroundColor: colors.background, padding: 20, borderRadius: 100, marginBottom: 16 }}><Calendar color={colors.textSecondary} size={48} /></View>
                <Text style={{ fontSize: typography.h2, fontWeight: 'bold', color: colors.textPrimary }}>{filtro === 'Papelera' ? 'Papelera Vacía' : 'Agenda Limpia'}</Text>
                <Text style={{ fontSize: typography.lg, color: colors.textSecondary, textAlign: 'center', marginTop: 8 }}>{filtro === 'Papelera' ? 'No hay elementos eliminados.' : 'No tienes eventos registrados para este filtro.'}</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* FAB (Oculto en papelera) */}
      {filtro !== 'Papelera' && (
        <TouchableOpacity style={[styles.fab, { backgroundColor: colors.primary, shadowColor: colors.primary }]} activeOpacity={0.8} onPress={() => setModalVisible('menu')}>
          <Plus color="#ffffff" size={36} strokeWidth={3} />
        </TouchableOpacity>
      )}

      {/* MODALES */}
      <Modal animationType="slide" transparent={true} visible={modalVisible !== 'none'} onRequestClose={closeModal}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
              
              <View style={styles.modalHeader}>
                <Text style={{ fontSize: typography.h2, fontWeight: '900', color: colors.textPrimary }}>
                  {modalVisible === 'menu' && '¿Qué deseas agregar?'}
                  {modalVisible === 'medicamento' && (editingId ? 'Editar Tratamiento' : 'Nuevo Tratamiento')}
                  {modalVisible === 'cita' && (editingId ? 'Editar Cita' : 'Nueva Cita Médica')}
                  {modalVisible === 'nota' && (editingId ? 'Editar Apunte' : 'Nuevo Apunte')}
                </Text>
                <TouchableOpacity onPress={closeModal} style={{ padding: 8, backgroundColor: colors.background, borderRadius: 100 }}>
                  <X color={colors.textSecondary} size={24} />
                </TouchableOpacity>
              </View>

              <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                
                {modalVisible === 'menu' && (
                  <View>
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
                  </View>
                )}

                {modalVisible === 'medicamento' && (
                  <View style={{ paddingBottom: 20 }}>
                    <Text style={[styles.label, { color: colors.textPrimary, fontSize: typography.lg }]}>Nombre del Fármaco</Text>
                    <TextInput style={[styles.input, { borderColor: colors.border, color: colors.textPrimary, fontSize: typography.lg }]} placeholder="Ej. Losartán" placeholderTextColor={colors.textSecondary} value={medNombre} onChangeText={setMedNombre} />
                    
                    <Text style={[styles.label, { color: colors.textPrimary, fontSize: typography.lg, marginTop: 16 }]}>Dosis Recomendada</Text>
                    <TextInput style={[styles.input, { borderColor: colors.border, color: colors.textPrimary, fontSize: typography.lg }]} placeholder="Ej. 1 Pastilla" placeholderTextColor={colors.textSecondary} value={medDosis} onChangeText={setMedDosis} />
                    
                    <Text style={[styles.label, { color: colors.textPrimary, fontSize: typography.lg, marginTop: 16 }]}>Frecuencia (Cada cuántas horas)</Text>
                    <TextInput style={[styles.input, { borderColor: colors.border, color: colors.textPrimary, fontSize: typography.lg }]} placeholder="Ej. 8" keyboardType="numeric" placeholderTextColor={colors.textSecondary} value={medFrecuencia} onChangeText={setMedFrecuencia} />
                    
                    <Text style={[styles.label, { color: colors.textPrimary, fontSize: typography.lg, marginTop: 16 }]}>¿A qué hora es la primera toma?</Text>
                    <TouchableOpacity style={[styles.inputBtn, { borderColor: colors.border, backgroundColor: colors.background }]} onPress={() => setShowMedTimePicker(true)}>
                      <Clock color={colors.primary} size={24} style={{ marginRight: 12 }} />
                      <Text style={{ color: colors.textPrimary, fontSize: typography.lg, fontWeight: 'bold' }}>{formatTimeUI(medPrimeraToma)}</Text>
                    </TouchableOpacity>
                    {showMedTimePicker && (<DateTimePicker value={medPrimeraToma} mode="time" display="default" onChange={(e,d) => { if (Platform.OS === 'android') setShowMedTimePicker(false); if (d) setMedPrimeraToma(d); }} />)}

                    <TouchableOpacity style={[styles.submitBtn, { backgroundColor: colors.primary, opacity: mutMed.isPending ? 0.7 : 1 }]} onPress={() => mutMed.mutate()} disabled={mutMed.isPending || !medNombre || !medDosis}>
                      {mutMed.isPending ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontSize: typography.h2, fontWeight: '900' }}>Guardar</Text>}
                    </TouchableOpacity>
                  </View>
                )}

                {modalVisible === 'cita' && (
                  <View style={{ paddingBottom: 20 }}>
                    <Text style={[styles.label, { color: colors.textPrimary, fontSize: typography.lg }]}>Motivo o Especialidad</Text>
                    <TextInput style={[styles.input, { borderColor: colors.border, color: colors.textPrimary, fontSize: typography.lg }]} placeholder="Ej. Cardiólogo" placeholderTextColor={colors.textSecondary} value={citaTitulo} onChangeText={setCitaTitulo} />
                    
                    <Text style={[styles.label, { color: colors.textPrimary, fontSize: typography.lg, marginTop: 16 }]}>Día de la cita</Text>
                    <TouchableOpacity style={[styles.inputBtn, { borderColor: colors.border, backgroundColor: colors.background }]} onPress={() => setShowCitaDatePicker(true)}>
                      <Calendar color={colors.warning} size={24} style={{ marginRight: 12 }} />
                      <Text style={{ color: colors.textPrimary, fontSize: typography.lg, fontWeight: 'bold', textTransform: 'capitalize' }}>{formatDateUI(citaFechaObj)}</Text>
                    </TouchableOpacity>
                    {showCitaDatePicker && (<DateTimePicker value={citaFechaObj} mode="date" display="default" minimumDate={new Date()} onChange={(e,d) => { if (Platform.OS === 'android') setShowCitaDatePicker(false); if (d) setCitaFechaObj(d); }} />)}

                    <Text style={[styles.label, { color: colors.textPrimary, fontSize: typography.lg, marginTop: 16 }]}>Hora</Text>
                    <TouchableOpacity style={[styles.inputBtn, { borderColor: colors.border, backgroundColor: colors.background }]} onPress={() => setShowCitaTimePicker(true)}>
                      <Clock color={colors.warning} size={24} style={{ marginRight: 12 }} />
                      <Text style={{ color: colors.textPrimary, fontSize: typography.lg, fontWeight: 'bold' }}>{formatTimeUI(citaHoraObj)}</Text>
                    </TouchableOpacity>
                    {showCitaTimePicker && (<DateTimePicker value={citaHoraObj} mode="time" display="default" onChange={(e,d) => { if (Platform.OS === 'android') setShowCitaTimePicker(false); if (d) setCitaHoraObj(d); }} />)}

                    <Text style={[styles.label, { color: colors.textPrimary, fontSize: typography.lg, marginTop: 16 }]}>Ubicación (Opcional)</Text>
                    <TextInput style={[styles.input, { borderColor: colors.border, color: colors.textPrimary, fontSize: typography.lg }]} placeholder="Ej. Clínica Centro" placeholderTextColor={colors.textSecondary} value={citaUbicacion} onChangeText={setCitaUbicacion} />
                    
                    <TouchableOpacity style={[styles.submitBtn, { backgroundColor: colors.primary, opacity: mutCita.isPending ? 0.7 : 1 }]} onPress={() => mutCita.mutate()} disabled={mutCita.isPending || !citaTitulo}>
                      {mutCita.isPending ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontSize: typography.h2, fontWeight: '900' }}>Guardar Cita</Text>}
                    </TouchableOpacity>
                  </View>
                )}

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
  filterPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 100, borderWidth: 2, minHeight: 48, justifyContent: 'center' },
  scrollContent: { flexGrow: 1, padding: 20, paddingBottom: 100 }, 
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 },
  listContainer: { gap: 16 },
  card: { borderRadius: 24, borderWidth: 2, borderLeftWidth: 8, overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', padding: 20, alignItems: 'center' },
  iconBox: { padding: 12, borderRadius: 16, marginRight: 16 },
  cardInfo: { flex: 1 },
  cardTitle: { fontWeight: '900', marginBottom: 6 },
  actionIconsRow: { flexDirection: 'row', alignItems: 'center', marginLeft: 8 },
  iconBtn: { padding: 8, marginLeft: 4 },
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