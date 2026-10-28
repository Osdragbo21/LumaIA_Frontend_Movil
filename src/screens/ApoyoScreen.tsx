// [MÓVIL] Ruta: src/screens/ApoyoScreen.tsx

import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Linking, Alert, ActivityIndicator, Modal, TextInput, KeyboardAvoidingView, Platform, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Phone, AlertTriangle, User, Heart, MessageCircle, Plus, X, Users } from 'lucide-react-native';

import { useAppTheme } from '../store/useThemeStore';
import { useAuthStore } from '../store/useAuthStore';
import { obtenerPerfilUsuario, agregarContactoEmergencia, AgregarContactoInput } from '../services/contactos.service';

export const ApoyoScreen = () => {
  const { colors, typography } = useAppTheme();
  const { usuarioId } = useAuthStore();
  const queryClient = useQueryClient();

  const [modalVisible, setModalVisible] = useState(false);
  const [nombreContacto, setNombreContacto] = useState('');
  const [telefonoContacto, setTelefonoContacto] = useState('');
  const [parentescoContacto, setParentescoContacto] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const { data: perfil, isLoading: loadPerfil, isError: errPerfil } = useQuery({
    queryKey: ['perfil', usuarioId],
    queryFn: () => obtenerPerfilUsuario(usuarioId!),
    enabled: !!usuarioId,
  });

  const cuidadorId = perfil?.cuidador_vinculado_id;
  const { data: cuidador, isLoading: loadCuidador } = useQuery({
    queryKey: ['perfil', cuidadorId],
    queryFn: () => obtenerPerfilUsuario(cuidadorId!),
    enabled: !!cuidadorId,
  });

  const contactos = perfil?.contactos_emergencia || [];
  const isLoading = loadPerfil || loadCuidador;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['perfil', usuarioId] });
    if (cuidadorId) {
      await queryClient.invalidateQueries({ queryKey: ['perfil', cuidadorId] });
    }
    setRefreshing(false);
  }, [queryClient, usuarioId, cuidadorId]);

  const addContactMutation = useMutation({
    mutationFn: (input: AgregarContactoInput) => agregarContactoEmergencia(input),
    onSuccess: () => {
      Alert.alert('Éxito', 'Contacto agregado a tu red de apoyo.');
      setModalVisible(false);
      setNombreContacto('');
      setTelefonoContacto('');
      setParentescoContacto('');
      queryClient.invalidateQueries({ queryKey: ['perfil', usuarioId] });
    },
    onError: (error: Error) => {
      Alert.alert('Error', error.message);
    }
  });

  // CORRECCIÓN CRÍTICA: Función de llamadas robusta
  const hacerLlamada = (numero?: string) => {
    if (!numero) {
      Alert.alert('Aviso', 'Este contacto no tiene un número registrado.');
      return;
    }
    
    // Limpiamos el número de espacios, guiones o paréntesis
    const numeroLimpio = numero.replace(/[\s\-\(\)]/g, '');
    
    // En iOS es mejor usar telprompt para que pida confirmación, en Android tel: directo
    const url = Platform.OS === 'ios' ? `telprompt:${numeroLimpio}` : `tel:${numeroLimpio}`;

    // Ejecutamos directamente sin validar canOpenURL para evitar bloqueos de seguridad del OS
    Linking.openURL(url).catch((err) => {
      console.error('Error al intentar llamar', err);
      Alert.alert('Error', 'No se pudo abrir la aplicación de teléfono. Asegúrate de estar en un dispositivo físico.');
    });
  };

  const handleSOS = () => {
    if (contactos.length > 0) {
      hacerLlamada(contactos[0].telefono);
    } else {
      Alert.alert('Aviso', 'Agrega un contacto primero para usar la alerta de llamada SOS.');
    }
  };

  const handleGuardarContacto = () => {
    if (!nombreContacto.trim() || !telefonoContacto.trim() || !parentescoContacto.trim()) {
      Alert.alert('Campos incompletos', 'Por favor llena todos los datos del contacto.');
      return;
    }
    addContactMutation.mutate({
      usuario_id: usuarioId!,
      nombre_contacto: nombreContacto.trim(),
      telefono: telefonoContacto.trim(),
      parentesco: parentescoContacto.trim()
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.textPrimary, fontSize: typography.h1 }]}>Red de Apoyo</Text>
        <Text style={{ color: colors.textSecondary, fontSize: typography.lg, marginTop: 4, fontWeight: '600' }}>
          Tus contactos de confianza a un toque de distancia.
        </Text>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
      >
        
        <TouchableOpacity 
          style={[styles.sosButton, { backgroundColor: colors.danger, borderBottomColor: '#9f1239' }]}
          activeOpacity={0.8}
          onPress={handleSOS}
        >
          <View style={styles.sosIconContainer}>
            <AlertTriangle color="#ffffff" size={48} strokeWidth={2.5} />
          </View>
          <Text style={[styles.sosText, { fontSize: typography.h1 }]}>LLAMADA DE{'\n'}EMERGENCIA</Text>
        </TouchableOpacity>

        {isLoading && !refreshing ? (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={{ color: colors.textSecondary, marginTop: 16, fontWeight: 'bold', fontSize: typography.lg }}>Cargando tu red...</Text>
          </View>
        ) : errPerfil ? (
          <View style={{ padding: 20, backgroundColor: '#ffe4e6', borderRadius: 16, borderWidth: 2, borderColor: colors.danger }}>
            <Text style={{ color: colors.danger, fontWeight: 'bold', textAlign: 'center', fontSize: typography.lg }}>Ocurrió un error al cargar la red de apoyo.</Text>
          </View>
        ) : (
          <>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary, fontSize: typography.xl }]}>Mi Cuidador Principal</Text>
            {cuidador ? (
              <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.cardContent}>
                  <View style={[styles.avatarBox, { backgroundColor: colors.primaryLight }]}>
                    <Heart color={colors.primary} size={32} />
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={[styles.contactName, { color: colors.textPrimary, fontSize: typography.h2 }]}>{cuidador.nombre}</Text>
                    <Text style={{ color: colors.primary, fontSize: typography.base, fontWeight: 'bold' }}>Cuenta Vinculada Oficial</Text>
                  </View>
                </View>
                <View style={[styles.actionButtonsRow, { borderTopColor: colors.border }]}>
                  <TouchableOpacity onPress={() => Alert.alert('Alerta enviada', `Se notificó a ${cuidador.correo} (Simulado)`)} style={[styles.actionBtn, { borderRightColor: colors.border }]}>
                    <AlertTriangle color={colors.primary} size={24} />
                    <Text style={[styles.actionText, { color: colors.primary, fontSize: typography.base }]}>Enviar Alerta</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => Linking.openURL(`mailto:${cuidador.correo}`)} style={styles.actionBtn}>
                    <MessageCircle color={colors.textSecondary} size={24} />
                    <Text style={[styles.actionText, { color: colors.textSecondary, fontSize: typography.base }]}>Mensaje</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={[styles.card, { padding: 20, backgroundColor: colors.surface, borderColor: colors.border, alignItems: 'center' }]}>
                <Text style={{ color: colors.textSecondary, fontWeight: 'bold', fontSize: typography.lg, textAlign: 'center' }}>Aún no tienes un cuidador vinculado desde los ajustes.</Text>
              </View>
            )}

            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary, fontSize: typography.xl, marginBottom: 0 }]}>Contactos Adicionales</Text>
              <TouchableOpacity 
                style={[styles.addBtnSmall, { backgroundColor: colors.primaryLight }]}
                onPress={() => setModalVisible(true)}
              >
                <Plus color={colors.primary} size={24} strokeWidth={3} />
                <Text style={{ color: colors.primary, fontWeight: '900', marginLeft: 4, fontSize: typography.base }}>AÑADIR</Text>
              </TouchableOpacity>
            </View>

            {contactos.length > 0 ? (
              contactos.map((contacto, index) => (
                <View key={index} style={[styles.smallCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <View style={styles.smallCardContent}>
                    <View style={[styles.smallAvatarBox, { backgroundColor: colors.background }]}>
                      <User color={colors.textSecondary} size={24} />
                    </View>
                    <View style={styles.cardInfo}>
                      <Text style={[styles.contactName, { color: colors.textPrimary, fontSize: typography.lg }]}>{contacto.nombre_contacto}</Text>
                      <Text style={{ color: colors.primary, fontSize: typography.base, fontWeight: 'bold', marginBottom: 2 }}>{contacto.parentesco}</Text>
                      <Text style={{ color: colors.textSecondary, fontSize: typography.base, fontWeight: '600' }}>{contacto.telefono}</Text>
                    </View>
                  </View>
                  <TouchableOpacity 
                    onPress={() => hacerLlamada(contacto.telefono)}
                    style={[styles.callCircleBtn, { backgroundColor: colors.successLight, borderColor: colors.success }]}
                  >
                    <Phone color={colors.success} size={24} />
                  </TouchableOpacity>
                </View>
              ))
            ) : (
              <View style={[styles.emptyCard, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                <View style={{ backgroundColor: colors.background, padding: 16, borderRadius: 100, marginBottom: 12 }}>
                  <Users color={colors.textSecondary} size={40} />
                </View>
                <Text style={{ fontSize: typography.lg, color: colors.textSecondary, textAlign: 'center', fontWeight: 'bold' }}>
                  No tienes contactos extra guardados.
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
              
              <View style={styles.modalHeader}>
                <Text style={{ fontSize: typography.h2, fontWeight: '900', color: colors.textPrimary }}>Nuevo Contacto</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)} style={{ padding: 8, backgroundColor: colors.background, borderRadius: 100 }}>
                  <X color={colors.textSecondary} size={24} />
                </TouchableOpacity>
              </View>

              <ScrollView keyboardShouldPersistTaps="handled">
                <Text style={[styles.label, { color: colors.textPrimary, fontSize: typography.lg }]}>Nombre Completo</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.textPrimary, fontSize: typography.lg }]}
                  placeholder="Ej. María Sánchez"
                  placeholderTextColor={colors.textSecondary}
                  value={nombreContacto}
                  onChangeText={setNombreContacto}
                  editable={!addContactMutation.isPending}
                />

                <Text style={[styles.label, { color: colors.textPrimary, fontSize: typography.lg, marginTop: 16 }]}>Parentesco / Rol</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.textPrimary, fontSize: typography.lg }]}
                  placeholder="Ej. Hija, Vecino, Médico"
                  placeholderTextColor={colors.textSecondary}
                  value={parentescoContacto}
                  onChangeText={setParentescoContacto}
                  editable={!addContactMutation.isPending}
                />

                <Text style={[styles.label, { color: colors.textPrimary, fontSize: typography.lg, marginTop: 16 }]}>Número de Teléfono</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.textPrimary, fontSize: typography.lg }]}
                  placeholder="Ej. 5512345678"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="phone-pad"
                  value={telefonoContacto}
                  onChangeText={setTelefonoContacto}
                  editable={!addContactMutation.isPending}
                />

                <TouchableOpacity 
                  style={[styles.submitBtn, { backgroundColor: colors.primary, borderBottomColor: '#1e40af', opacity: addContactMutation.isPending ? 0.7 : 1 }]}
                  onPress={handleGuardarContacto}
                  disabled={addContactMutation.isPending}
                  activeOpacity={0.8}
                >
                  {addContactMutation.isPending ? (
                    <ActivityIndicator color="#fff" size="large" />
                  ) : (
                    <Text style={{ color: '#fff', fontSize: typography.h2, fontWeight: '900' }}>Guardar Contacto</Text>
                  )}
                </TouchableOpacity>
              </ScrollView>

            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: { padding: 20, paddingBottom: 24, borderBottomWidth: 2 },
  headerTitle: { fontWeight: '900' },
  scrollContent: { flexGrow: 1, padding: 20, paddingBottom: 40 },
  sosButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 24, borderRadius: 32, borderBottomWidth: 8, marginBottom: 32, shadowColor: '#e11d48', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10 },
  sosIconContainer: { backgroundColor: 'rgba(255,255,255,0.25)', padding: 16, borderRadius: 100, marginRight: 16 },
  sosText: { color: '#ffffff', fontWeight: '900', letterSpacing: 1 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, marginTop: 16 },
  sectionTitle: { fontWeight: '900', marginBottom: 16 },
  addBtnSmall: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  card: { borderRadius: 24, borderWidth: 2, marginBottom: 24, overflow: 'hidden' },
  cardContent: { flexDirection: 'row', padding: 20, alignItems: 'center' },
  avatarBox: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  cardInfo: { flex: 1 },
  contactName: { fontWeight: '900', marginBottom: 4 },
  actionButtonsRow: { flexDirection: 'row', borderTopWidth: 2, backgroundColor: '#fafafa' },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRightWidth: 2 },
  actionText: { fontWeight: 'bold', marginLeft: 8 },
  smallCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 20, borderWidth: 2, marginBottom: 12 },
  smallCardContent: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  smallAvatarBox: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  callCircleBtn: { width: 56, height: 56, borderRadius: 28, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  emptyCard: { padding: 32, borderRadius: 24, borderWidth: 2, borderStyle: 'dashed', alignItems: 'center' },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 40, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  label: { fontWeight: '900', marginBottom: 8 },
  input: { borderWidth: 2, borderRadius: 16, paddingHorizontal: 16, minHeight: 64, fontWeight: '600' },
  submitBtn: { alignItems: 'center', justifyContent: 'center', minHeight: 64, borderRadius: 20, borderBottomWidth: 4, marginTop: 32 },
});