// [MÓVIL] Ruta: src/screens/CuidadorVinculacionScreen.tsx

import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, TextInput, KeyboardAvoidingView, Platform, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Mail, Phone, Users, UserPlus } from 'lucide-react-native';

import { useAuthStore } from '../store/useAuthStore';
import { useAppTheme } from '../store/useThemeStore';
import { obtenerAdultosVinculados, vincularAdultoMayor } from '../services/cuidador.service';

export const CuidadorVinculacionScreen = () => {
  const { usuarioId } = useAuthStore();
  const { colors, typography } = useAppTheme();
  const queryClient = useQueryClient();
  
  const [correo, setCorreo] = useState('');

  const { data: vinculados = [], isLoading } = useQuery({
    queryKey: ['vinculadosList', usuarioId],
    queryFn: () => obtenerAdultosVinculados(usuarioId!),
    enabled: !!usuarioId,
  });

  const mutVincular = useMutation({
    mutationFn: () => vincularAdultoMayor(usuarioId!, correo.trim().toLowerCase()),
    onSuccess: () => {
      Alert.alert('Éxito', 'Paciente vinculado correctamente.');
      setCorreo('');
      queryClient.invalidateQueries({ queryKey: ['vinculadosResumen', usuarioId] });
      queryClient.invalidateQueries({ queryKey: ['vinculadosList', usuarioId] });
    },
    onError: (error: Error) => {
      Alert.alert('Error', error.message || 'No se pudo vincular la cuenta.');
    }
  });

  // CORRECCIÓN CRÍTICA: Función de llamadas robusta
  const hacerLlamada = (numero?: string) => {
    if (!numero) {
      Alert.alert('Aviso', 'El paciente no tiene un contacto de emergencia principal registrado.');
      return;
    }
    
    const numeroLimpio = numero.replace(/[\s\-\(\)]/g, '');
    const url = Platform.OS === 'ios' ? `telprompt:${numeroLimpio}` : `tel:${numeroLimpio}`;

    Linking.openURL(url).catch((err) => {
      console.error('Error al intentar llamar', err);
      Alert.alert('Error', 'No se pudo abrir la aplicación de teléfono. Asegúrate de estar en un dispositivo físico.');
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary, fontSize: typography.h1 }]}>Vincular Paciente</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <UserPlus color={colors.primary} size={28} style={{ marginRight: 12 }} />
              <Text style={{ fontSize: typography.xl, fontWeight: '900', color: colors.textPrimary }}>Agregar Familiar</Text>
            </View>
            <Text style={{ color: colors.textSecondary, fontSize: typography.base, marginBottom: 16 }}>
              Ingresa el correo electrónico registrado por el Adulto Mayor para monitorear su agenda.
            </Text>
            
            <View style={[styles.inputContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Mail color={colors.textSecondary} size={24} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.textPrimary, fontSize: typography.lg }]}
                placeholder="correo@ejemplo.com"
                placeholderTextColor={colors.textSecondary}
                value={correo}
                onChangeText={setCorreo}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <TouchableOpacity 
              style={[styles.submitBtn, { backgroundColor: colors.primary, opacity: mutVincular.isPending ? 0.7 : 1 }]}
              onPress={() => mutVincular.mutate()}
              disabled={mutVincular.isPending || !correo}
            >
              {mutVincular.isPending ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontSize: typography.lg, fontWeight: '900' }}>Vincular Cuenta</Text>}
            </TouchableOpacity>
          </View>

          <Text style={[styles.sectionTitle, { color: colors.textPrimary, fontSize: typography.xl }]}>Directorio de Pacientes</Text>
          
          {isLoading && <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />}
          
          {!isLoading && vinculados.length === 0 && (
            <View style={[styles.emptyCard, { borderColor: colors.border, backgroundColor: colors.surface }]}>
              <Users color={colors.textSecondary} size={40} style={{ marginBottom: 12 }} />
              <Text style={{ fontSize: typography.base, color: colors.textSecondary, textAlign: 'center' }}>No tienes pacientes vinculados a tu cuenta.</Text>
            </View>
          )}

          {!isLoading && vinculados.map((item) => (
            <View key={item.adulto._id} style={[styles.smallCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.smallCardContent}>
                <View style={[styles.smallAvatarBox, { backgroundColor: colors.primaryLight }]}>
                  <Text style={{ color: colors.primary, fontWeight: '900', fontSize: typography.xl }}>{item.adulto.nombre.charAt(0)}</Text>
                </View>
                <View style={styles.cardInfo}>
                  <Text style={[styles.contactName, { color: colors.textPrimary, fontSize: typography.lg }]}>{item.adulto.nombre}</Text>
                  <Text style={{ color: colors.textSecondary, fontSize: typography.sm }}>{item.adulto.correo}</Text>
                </View>
              </View>
              <TouchableOpacity 
                onPress={() => hacerLlamada(item.adulto.contactos_emergencia[0]?.telefono)}
                style={[styles.callCircleBtn, { backgroundColor: colors.successLight, borderColor: colors.success }]}
              >
                <Phone color={colors.success} size={24} />
              </TouchableOpacity>
            </View>
          ))}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: { padding: 20, paddingBottom: 16, borderBottomWidth: 2 },
  headerTitle: { fontWeight: '900' },
  scrollContent: { flexGrow: 1, padding: 20, paddingBottom: 40 },
  card: { padding: 20, borderRadius: 24, borderWidth: 2, marginBottom: 32 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 2, borderRadius: 16, paddingHorizontal: 16, minHeight: 64 },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontWeight: '600', minHeight: 64 },
  submitBtn: { alignItems: 'center', justifyContent: 'center', minHeight: 56, borderRadius: 16, marginTop: 16 },
  sectionTitle: { fontWeight: '900', marginBottom: 16 },
  smallCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 20, borderWidth: 2, marginBottom: 12 },
  smallCardContent: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  smallAvatarBox: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  cardInfo: { flex: 1 },
  contactName: { fontWeight: '900', marginBottom: 4 },
  callCircleBtn: { width: 56, height: 56, borderRadius: 28, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  emptyCard: { padding: 32, borderRadius: 24, borderWidth: 2, borderStyle: 'dashed', alignItems: 'center' },
});