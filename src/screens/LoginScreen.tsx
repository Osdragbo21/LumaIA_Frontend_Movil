// [MÓVIL] Ruta: src/screens/LoginScreen.tsx

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation } from '@tanstack/react-query';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react-native';

import { useAppTheme } from '../store/useThemeStore';
import { useAuthStore } from '../store/useAuthStore';
import { loginUsuario } from '../services/auth.service';

export const LoginScreen = ({ navigation }: any) => {
  const { colors, typography } = useAppTheme();
  const loginFn = useAuthStore((state) => state.login);
  
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const mutation = useMutation({
    mutationFn: () => loginUsuario(correo.trim(), password),
    onSuccess: (data) => {
      loginFn(data.access_token, data.usuario_id, data.rol);
    },
    onError: (error: Error) => {
      Alert.alert('Error al Iniciar Sesión', error.message);
    }
  });

  const handleLogin = () => {
    if (!correo || !password) return;
    mutation.mutate();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          
          <View style={styles.headerContainer}>
            <Image 
              source={require('../../assets/logo_LumaIA.png')} 
              style={{ width: 120, height: 120, resizeMode: 'contain', marginBottom: 16 }} 
            />
            <Text style={[styles.title, { color: colors.textPrimary, fontSize: typography.h1 }]}>Iniciar Sesión</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary, fontSize: typography.lg }]}>Ingresa a tu cuenta LumaIA</Text>
          </View>

          <View style={styles.formContainer}>
            <Text style={[styles.label, { color: colors.textPrimary, fontSize: typography.lg }]}>Correo Electrónico</Text>
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
                placeholder="••••••••"
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

            <TouchableOpacity 
              style={[styles.submitBtn, { backgroundColor: colors.primary, borderBottomColor: '#1e40af' }]}
              onPress={handleLogin}
              disabled={mutation.isPending || !correo || !password}
              activeOpacity={0.8}
            >
              {mutation.isPending ? (
                <ActivityIndicator color="#fff" size="large" />
              ) : (
                <>
                  <Text style={[styles.submitText, { fontSize: typography.h2 }]}>Entrar</Text>
                  <ArrowRight color="#fff" size={28} strokeWidth={3} />
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={{ color: colors.textSecondary, fontSize: typography.lg, fontWeight: 'bold' }}>¿No tienes una cuenta?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')} style={{ paddingVertical: 8 }}>
              <Text style={{ color: colors.primary, fontSize: typography.xl, fontWeight: '900' }}>Crear cuenta nueva</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  scrollContent: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  headerContainer: { alignItems: 'center', marginBottom: 32 },
  title: { fontWeight: '900', marginBottom: 4 },
  subtitle: { fontWeight: '600' },
  formContainer: { width: '100%' },
  label: { fontWeight: '900', marginBottom: 8 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 2, borderRadius: 16, paddingHorizontal: 16, minHeight: 64 },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontWeight: '600', minHeight: 64 },
  eyeBtn: { padding: 8, marginLeft: 4 },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', minHeight: 64, borderRadius: 20, borderBottomWidth: 4, marginTop: 32 },
  submitText: { color: '#fff', fontWeight: '900', marginRight: 12 },
  footer: { alignItems: 'center', marginTop: 40 }
});