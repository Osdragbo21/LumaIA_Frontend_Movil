// [MÓVIL] Ruta: src/screens/ChatScreen.tsx

import React, { useState, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation } from '@tanstack/react-query';
import * as Speech from 'expo-speech';
import { ArrowLeft, Volume2, Pill, CalendarDays, Sparkles } from 'lucide-react-native';

import { useAuthStore } from '../store/useAuthStore';
import { useAppTheme } from '../store/useThemeStore';
import { consultarAsistente } from '../services/ia.service';

interface Mensaje {
  id: string;
  emisor: 'user' | 'bot';
  texto: string;
}

export const ChatScreen = ({ navigation }: any) => {
  const { usuarioId } = useAuthStore();
  const { colors, typography } = useAppTheme();
  const scrollViewRef = useRef<ScrollView>(null);

  const [historial, setHistorial] = useState<Mensaje[]>([
    { id: 'init', emisor: 'bot', texto: `¡Hola! Qué bueno escucharte hoy. ¿Quieres que te recuerde alguna tarea o que charlemos? 😊` }
  ]);

  const reproducirAudio = (texto: string) => {
    Speech.stop(); // Detener audio previo
    Speech.speak(texto, { language: 'es-MX', rate: 0.9 });
  };

  const mutation = useMutation({
    mutationFn: (pregunta_id: string) => consultarAsistente({ usuario_id: usuarioId!, pregunta_id }),
    onSuccess: (respuesta) => {
      setHistorial(prev => [...prev, { id: Date.now().toString(), emisor: 'bot', texto: respuesta }]);
      reproducirAudio(respuesta);
    },
    onError: (error) => {
      const msjError = error instanceof Error ? error.message : 'Problema al procesar tu consulta.';
      setHistorial(prev => [...prev, { id: Date.now().toString(), emisor: 'bot', texto: `Error: ${msjError}` }]);
    }
  });

  const hacerPregunta = (textoPregunta: string, idPregunta: string) => {
    if (mutation.isPending) return;
    setHistorial(prev => [...prev, { id: Date.now().toString(), emisor: 'user', texto: textoPregunta }]);
    mutation.mutate(idPregunta);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      
      {/* HEADER */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft color={colors.textPrimary} size={28} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <View style={{ backgroundColor: colors.primaryLight, padding: 6, borderRadius: 100, marginRight: 8 }}>
            <Sparkles color={colors.primary} size={20} />
          </View>
          <Text style={{ fontSize: typography.h2, fontWeight: '900', color: colors.textPrimary }}>LumaIA</Text>
        </View>
      </View>

      {/* CHAT AREA */}
      <ScrollView 
        ref={scrollViewRef}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        contentContainerStyle={styles.chatContainer}
      >
        {historial.map((msg) => (
          <View key={msg.id} style={[styles.messageRow, msg.emisor === 'user' ? styles.rowReverse : styles.rowNormal]}>
            
            {msg.emisor === 'bot' && (
              <View style={[styles.botAvatar, { backgroundColor: colors.primary }]}>
                <Sparkles color="#fff" size={18} />
              </View>
            )}

            <View style={{ flexShrink: 1 }}>
              <View style={[styles.bubble, { 
                backgroundColor: msg.emisor === 'user' ? colors.primary : colors.surface,
                borderColor: msg.emisor === 'user' ? colors.primary : colors.border,
                borderTopRightRadius: msg.emisor === 'user' ? 4 : 24,
                borderTopLeftRadius: msg.emisor === 'bot' ? 4 : 24,
              }]}>
                <Text style={{ color: msg.emisor === 'user' ? '#fff' : colors.textPrimary, fontSize: typography.lg, fontWeight: '600' }}>
                  {msg.texto}
                </Text>
              </View>

              {msg.emisor === 'bot' && (
                <TouchableOpacity onPress={() => reproducirAudio(msg.texto)} style={[styles.audioButton, { backgroundColor: colors.border }]}>
                  <Volume2 color={colors.textPrimary} size={18} />
                  <Text style={{ color: colors.textPrimary, fontWeight: 'bold', fontSize: typography.sm, marginLeft: 6 }}>Escuchar</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}

        {mutation.isPending && (
          <View style={[styles.messageRow, styles.rowNormal]}>
            <View style={[styles.botAvatar, { backgroundColor: colors.primary }]}>
              <Sparkles color="#fff" size={18} />
            </View>
            <View style={[styles.bubble, { backgroundColor: colors.surface, borderColor: colors.border, borderTopLeftRadius: 4 }]}>
              <ActivityIndicator color={colors.primary} />
            </View>
          </View>
        )}
      </ScrollView>

      {/* FIXED BOTTOM ACTIONS */}
      <View style={[styles.bottomActions, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <TouchableOpacity 
          disabled={mutation.isPending}
          onPress={() => hacerPregunta('¿A qué hora me toca mi próxima medicina?', 'PROXIMA_TOMA')}
          style={[styles.actionBtn, { borderColor: colors.border, opacity: mutation.isPending ? 0.5 : 1 }]}
        >
          <Pill color={colors.primary} size={28} />
          <Text style={{ color: colors.textPrimary, fontWeight: 'bold', fontSize: typography.sm, textAlign: 'center', marginTop: 4 }}>Próxima{'\n'}Medicina</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          disabled={mutation.isPending}
          onPress={() => hacerPregunta('¿Tengo citas programadas para hoy?', 'CITAS_HOY')}
          style={[styles.actionBtn, { borderColor: colors.border, opacity: mutation.isPending ? 0.5 : 1 }]}
        >
          <CalendarDays color={colors.warning} size={28} />
          <Text style={{ color: colors.textPrimary, fontWeight: 'bold', fontSize: typography.sm, textAlign: 'center', marginTop: 4 }}>Citas{'\n'}de Hoy</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 2 },
  backButton: { padding: 8, backgroundColor: '#f1f5f9', borderRadius: 16, marginRight: 16 },
  headerTitleContainer: { flexDirection: 'row', alignItems: 'center' },
  chatContainer: { padding: 20, paddingBottom: 40, gap: 24 },
  messageRow: { flexDirection: 'row', width: '100%', marginBottom: 16 },
  rowReverse: { justifyContent: 'flex-end' },
  rowNormal: { justifyContent: 'flex-start' },
  botAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 12, marginTop: 4 },
  bubble: { padding: 16, borderRadius: 24, borderWidth: 2, maxWidth: '90%' },
  audioButton: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 100, marginTop: 8, marginLeft: 4 },
  bottomActions: { flexDirection: 'row', padding: 16, borderTopWidth: 2, gap: 12 },
  actionBtn: { flex: 1, backgroundColor: '#fff', borderWidth: 2, borderRadius: 20, padding: 16, alignItems: 'center', justifyContent: 'center' }
});