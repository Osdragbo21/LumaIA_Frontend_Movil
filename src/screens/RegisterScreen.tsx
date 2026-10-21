// [MÓVIL] Ruta: src/screens/RegisterScreen.tsx

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation } from '@tanstack/react-query';
import { Mail, Lock, User, Eye, EyeOff, HeartPulse, ShieldCheck, ArrowLeft } from 'lucide-react-native';

import { useAppTheme } from '../store/useThemeStore';
import { registrarUsuario, mapEnumToGraphQLRole } from '../services/auth.service';
import { Enum_Rol } from '../types';

export const RegisterScreen = ({ navigation }: any) => {
  const { colors, typography } = useAppTheme();
  
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rol, setRol] = useState<Enum_Rol | null>(null);

  const mutation = useMutation({
    mutationFn: () => registrarUsuario({
      nombre: nombre.trim(),
      correo: correo.trim().toLowerCase(),
      password,
      rol: mapEnumToGraphQLRole(rol!)
    }),
    onSuccess: () => {
      Alert.alert(
        '¡Registro Exitoso!',
        'Tu cuenta ha sido creada. Por favor, inicia sesión.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    },
    onError: (error: Error) => {
      Alert.alert('Error en el Registro', error.message);
    }
  });

  const handleRegister = () => {
    if (!nombre || !correo || !password || !confirmPassword || !rol) {
      Alert.alert('Atención', 'Por favor completa todos los campos y selecciona un rol.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden. Inténtalo de nuevo.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    mutation.mutate();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        
        <View style={[styles.topBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <ArrowLeft color={colors.textPrimary} size={28} />
          </TouchableOpacity>
          <Text style={{ fontSize: typography.h2, fontWeight: '900', color: colors.textPrimary }}>Crear Cuenta</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          
          <View style={styles.logoContainer}>
            <Image 
              source={require('../../assets/logo_LumaIA.png')} 
              style={{ width: 80, height: 80, resizeMode: 'contain', marginBottom: 16 }} 
            />
          </View>

          <Text style={[styles.label, { color: colors.textPrimary, fontSize: typography.xl, marginBottom: 12 }]}>¿Cómo usarás la App?</Text>
          <View style={styles.roleContainer}>
            <TouchableOpacity 
              style={[styles.roleCard, { 
                borderColor: rol === 'Adulto Mayor' ? colors.primary : colors.border, 
                backgroundColor: rol === 'Adulto Mayor' ? colors.primaryLight : colors.surface 
              }]}
              onPress={() => setRol('Adulto Mayor')}
              activeOpacity={0.8}
            >
              <HeartPulse color={rol === 'Adulto Mayor' ? colors.primary : colors.textSecondary} size={40} />
              <Text style={[styles.roleText, { color: rol === 'Adulto Mayor' ? colors.primary : colors.textSecondary, fontSize: typography.lg }]}>Adulto Mayor</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.roleCard, { 
                borderColor: rol === 'Cuidador' ? colors.success : colors.border, 
                backgroundColor: rol === 'Cuidador' ? colors.successLight : colors.surface 
              }]}
              onPress={() => setRol('Cuidador')}
              activeOpacity={0.8}
            >
              <ShieldCheck color={rol === 'Cuidador' ? colors.success : colors.textSecondary} size={40} />
              <Text style={[styles.roleText, { color: rol === 'Cuidador' ? colors.success : colors.textSecondary, fontSize: typography.lg }]}>Cuidador</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.formContainer}>
            <Text style={[styles.label, { color: colors.textPrimary, fontSize: typography.lg }]}>Nombre Completo</Text>
            <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <User color={colors.textSecondary} size={24} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.textPrimary, fontSize: typography.lg }]}
                placeholder="Ej. Juan Pérez"
                placeholderTextColor={colors.textSecondary}
                value={nombre}
                onChangeText={setNombre}
                editable={!mutation.isPending}
              />
            </View>

            <Text style={[styles.label, { color: colors.textPrimary, fontSize: typography.lg, marginTop: 16 }]}>Correo Electrónico</Text>
            <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Mail color={colors.textSecondary} size={24} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.textPrimary, fontSize: typography.lg }]}
                placeholder="ejemplo@correo.com"
                placeholderTextColor={colors.textSecondary}
                value={correo}
                onChangeText={setCorreo}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!mutation.isPending}
              />
            </View>

            <Text style={[styles.label, { color: colors.textPrimary, fontSize: typography.lg, marginTop: 16 }]}>Contraseña</Text>
            <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Lock color={colors.textSecondary} size={24} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.textPrimary, fontSize: typography.lg }]}
                placeholder="Mínimo 6 caracteres"
                placeholderTextColor={colors.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                editable={!mutation.isPending}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                {showPassword ? <EyeOff color={colors.textSecondary} size={24} /> : <Eye color={colors.textSecondary} size={24} />}
              </TouchableOpacity>
            </View>

            <Text style={[styles.label, { color: colors.textPrimary, fontSize: typography.lg, marginTop: 16 }]}>Confirmar Contraseña</Text>
            <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Lock color={colors.textSecondary} size={24} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.textPrimary, fontSize: typography.lg }]}
                placeholder="Repite tu contraseña"
                placeholderTextColor={colors.textSecondary}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                editable={!mutation.isPending}
              />
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeBtn}>
                {showConfirmPassword ? <EyeOff color={colors.textSecondary} size={24} /> : <Eye color={colors.textSecondary} size={24} />}
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={[styles.submitBtn, { backgroundColor: colors.primary, borderBottomColor: '#1e40af', opacity: mutation.isPending ? 0.7 : 1 }]}
              onPress={handleRegister}
              disabled={mutation.isPending}
              activeOpacity={0.8}
            >
              {mutation.isPending ? (
                <ActivityIndicator color="#fff" size="large" />
              ) : (
                <Text style={[styles.submitText, { fontSize: typography.h2 }]}>Finalizar Registro</Text>
              )}
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 2 },
  backButton: { padding: 8, borderRadius: 16, marginRight: 16 },
  scrollContent: { flexGrow: 1, padding: 24 },
  logoContainer: { alignItems: 'center', marginBottom: 16 },
  roleContainer: { flexDirection: 'row', gap: 16, marginBottom: 24 },
  roleCard: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20, borderWidth: 2, borderRadius: 24, minHeight: 130 },
  roleText: { fontWeight: '900', marginTop: 12 },
  formContainer: { width: '100%', paddingBottom: 40 },
  label: { fontWeight: '900', marginBottom: 8 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 2, borderRadius: 16, paddingHorizontal: 16, minHeight: 64 },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontWeight: '600', minHeight: 64 },
  eyeBtn: { padding: 8, marginLeft: 4 },
  submitBtn: { alignItems: 'center', justifyContent: 'center', minHeight: 64, borderRadius: 20, borderBottomWidth: 4, marginTop: 32 },
  submitText: { color: '#fff', fontWeight: '900' },
});