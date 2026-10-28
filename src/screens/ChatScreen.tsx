// [MÓVIL] Ruta: src/screens/ChatScreen.tsx

import React, { useState, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, TextInput, KeyboardAvoidingView, Platform, Modal, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation } from '@tanstack/react-query';
import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { ArrowLeft, Volume2, Pill, CalendarDays, Sparkles, CheckSquare, Sun, Mic, Send, ChevronDown, Cloud, Server, Square } from 'lucide-react-native';

import { useAuthStore } from '../store/useAuthStore';
import { useAppTheme } from '../store/useThemeStore';
import { consultarAsistente, transcribirAudioIA } from '../services/ia.service';

interface Mensaje {
  id: string;
  emisor: 'user' | 'bot';
  texto: string;
}

type ModeloIA = 'Luma Cloud' | 'Llama 3.2 Local';

export const ChatScreen = ({ navigation }: any) => {
  const { usuarioId } = useAuthStore();
  const { colors, typography } = useAppTheme();
  const scrollViewRef = useRef<ScrollView>(null);

  const [historial, setHistorial] = useState<Mensaje[]>([
    { id: 'init', emisor: 'bot', texto: `¡Hola! Soy Luma. ¿En qué te puedo ayudar hoy? 😊` }
  ]);
  
  const [inputText, setInputText] = useState('');
  const [modeloIA, setModeloIA] = useState<ModeloIA>('Luma Cloud');
  const [modalModeloVisible, setModalModeloVisible] = useState(false);
  
  // ESTADOS DE AUDIO
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isListening, setIsListening] = useState(false);

  const reproducirAudio = (texto: string) => {
    Speech.stop(); 
    Speech.speak(texto, { language: 'es-MX', rate: 0.9 });
  };

  // 1. Mutación para la respuesta de la IA
  const mutation = useMutation({
    mutationFn: (pregunta_id: string) => consultarAsistente({ usuario_id: usuarioId!, pregunta_id, modelo: modeloIA }),
    onSuccess: (respuesta) => {
      setHistorial(prev => [...prev, { id: Date.now().toString(), emisor: 'bot', texto: respuesta }]);
      reproducirAudio(respuesta);
    },
    onError: (error) => {
      const msjError = error instanceof Error ? error.message : 'Problema al procesar tu consulta.';
      setHistorial(prev => [...prev, { id: Date.now().toString(), emisor: 'bot', texto: `Error: ${msjError}` }]);
    }
  });

  const hacerPregunta = (textoPregunta: string, idOculto?: string) => {
    if (mutation.isPending || mutTranscribir.isPending) return;
    const promptFinal = idOculto ? idOculto : textoPregunta;
    setHistorial(prev => [...prev, { id: Date.now().toString(), emisor: 'user', texto: textoPregunta }]);
    mutation.mutate(promptFinal);
    setInputText('');
  };

  // 2. Mutación para transcribir el audio
  const mutTranscribir = useMutation({
    mutationFn: (base64: string) => transcribirAudioIA(base64),
    onSuccess: (textoTranscrito) => {
      // UX MEJORADA: En lugar de solo ponerlo en el input, lo enviamos automáticamente a la IA
      hacerPregunta(textoTranscrito);
    },
    onError: () => {
      Alert.alert('Error', 'No pudimos entender el audio. Por favor, intenta de nuevo.');
    }
  });

  // 3. Lógica del Micrófono Nativo
  const startRecordingMobile = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status === 'granted') {
        await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
        const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
        setRecording(recording);
        setIsListening(true);
      } else {
        Alert.alert('Permiso denegado', 'Necesitamos acceso al micrófono para escucharte.');
      }
    } catch (err) {
      console.error('Failed to start recording', err);
      Alert.alert('Error', 'No se pudo iniciar el micrófono. Verifica los permisos.');
    }
  };

  const stopRecordingMobile = async () => {
    if (!recording) return;
    setIsListening(false);
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    setRecording(null);
    
    if (uri) {
       // Convertimos el audio a Base64 y lo enviamos al backend
       const base64Audio = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
       mutTranscribir.mutate(base64Audio);
    }
  };

  const handleMicPress = () => {
    if (isListening) {
      stopRecordingMobile();
    } else {
      startRecordingMobile();
    }
  };

  const isProcessing = mutation.isPending || mutTranscribir.isPending;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <ArrowLeft color={colors.textPrimary} size={28} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <View style={{ backgroundColor: colors.primaryLight, padding: 6, borderRadius: 100, marginRight: 8 }}>
              {modeloIA === 'Luma Cloud' ? <Cloud color={colors.primary} size={20} /> : <Server color={colors.primary} size={20} />}
            </View>
            <Text style={{ fontSize: typography.h2, fontWeight: '900', color: colors.textPrimary }}>Luma</Text>
          </View>
        </View>

        <ScrollView ref={scrollViewRef} onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })} contentContainerStyle={styles.chatContainer}>
          {historial.map((msg) => (
            <View key={msg.id} style={[styles.messageRow, msg.emisor === 'user' ? styles.rowReverse : styles.rowNormal]}>
              {msg.emisor === 'bot' && (
                <View style={[styles.botAvatar, { backgroundColor: colors.primary }]}><Sparkles color="#fff" size={18} /></View>
              )}
              <View style={{ flexShrink: 1 }}>
                <View style={[styles.bubble, { 
                  backgroundColor: msg.emisor === 'user' ? colors.primary : colors.surface,
                  borderColor: msg.emisor === 'user' ? colors.primary : colors.border,
                  borderTopRightRadius: msg.emisor === 'user' ? 4 : 24,
                  borderTopLeftRadius: msg.emisor === 'bot' ? 4 : 24,
                }]}>
                  <Text style={{ color: msg.emisor === 'user' ? '#fff' : colors.textPrimary, fontSize: typography.lg, fontWeight: '600' }}>{msg.texto}</Text>
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
          
          {/* Indicador de carga unificado (Escuchando, Transcribiendo o Pensando) */}
          {(isProcessing || isListening) && (
            <View style={[styles.messageRow, styles.rowNormal]}>
              <View style={[styles.botAvatar, { backgroundColor: colors.primary }]}><Sparkles color="#fff" size={18} /></View>
              <View style={[styles.bubble, { backgroundColor: colors.surface, borderColor: colors.border, borderTopLeftRadius: 4, flexDirection: 'row', alignItems: 'center' }]}>
                <ActivityIndicator color={colors.primary} size="small" style={{ marginRight: 8 }} />
                <Text style={{ color: colors.textSecondary, fontSize: typography.base, fontWeight: 'bold' }}>
                  {isListening ? 'Escuchando...' : mutTranscribir.isPending ? 'Transcribiendo...' : 'Pensando...'}
                </Text>
              </View>
            </View>
          )}
        </ScrollView>

        <View style={[styles.bottomArea, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.bottomScroll}>
            <TouchableOpacity disabled={isProcessing || isListening} onPress={() => hacerPregunta('¿Cuál es mi próxima medicina?', 'PROXIMA_TOMA')} style={[styles.quickBtn, { borderColor: colors.border, opacity: (isProcessing || isListening) ? 0.5 : 1 }]}>
              <Pill color={colors.primary} size={20} />
              <Text style={{ color: colors.textPrimary, fontSize: typography.sm, fontWeight: 'bold', marginLeft: 8 }}>Próxima Medicina</Text>
            </TouchableOpacity>
            <TouchableOpacity disabled={isProcessing || isListening} onPress={() => hacerPregunta('¿Qué pastillas ya me tomé hoy?', 'TOMAS_REALIZADAS')} style={[styles.quickBtn, { borderColor: colors.border, opacity: (isProcessing || isListening) ? 0.5 : 1 }]}>
              <CheckSquare color={colors.success} size={20} />
              <Text style={{ color: colors.textPrimary, fontSize: typography.sm, fontWeight: 'bold', marginLeft: 8 }}>Ya Tomadas</Text>
            </TouchableOpacity>
            <TouchableOpacity disabled={isProcessing || isListening} onPress={() => hacerPregunta('¿Tengo citas programadas para hoy?', 'CITAS_HOY')} style={[styles.quickBtn, { borderColor: colors.border, opacity: (isProcessing || isListening) ? 0.5 : 1 }]}>
              <CalendarDays color={colors.warning} size={20} />
              <Text style={{ color: colors.textPrimary, fontSize: typography.sm, fontWeight: 'bold', marginLeft: 8 }}>Citas Hoy</Text>
            </TouchableOpacity>
          </ScrollView>

          <View style={[styles.inputWrapper, { backgroundColor: (isProcessing || isListening) ? '#f1f5f9' : colors.background, borderColor: isListening ? colors.danger : colors.border }]}>
            <TouchableOpacity disabled={isProcessing || isListening} onPress={() => setModalModeloVisible(true)} style={[styles.modelSelector, { backgroundColor: colors.surface, opacity: (isProcessing || isListening) ? 0.5 : 1 }]}>
              {modeloIA === 'Luma Cloud' ? <Cloud color={colors.primary} size={16} /> : <Server color={colors.primary} size={16} />}
              <Text style={{ color: colors.textPrimary, fontSize: typography.xs, fontWeight: 'bold', marginHorizontal: 4 }}>{modeloIA === 'Luma Cloud' ? 'Cloud' : 'Local'}</Text>
              <ChevronDown color={colors.textSecondary} size={16} />
            </TouchableOpacity>

            <TextInput
              style={[styles.textInput, { color: (isProcessing || isListening) ? colors.textSecondary : colors.textPrimary, fontSize: typography.base }]}
              placeholder={isListening ? "Habla ahora..." : isProcessing ? "Procesando..." : "Escribe tu mensaje..."}
              placeholderTextColor={isListening ? colors.danger : colors.textSecondary}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={200}
              editable={!isListening && !isProcessing} // BLOQUEO TOTAL DEL INPUT
            />

            <View style={styles.actionRight}>
              {inputText.trim().length > 0 ? (
                <TouchableOpacity disabled={isProcessing || isListening} onPress={() => hacerPregunta(inputText)} style={[styles.sendBtn, { backgroundColor: (isProcessing || isListening) ? colors.textSecondary : colors.primary }]}>
                  <Send color="#fff" size={20} />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity disabled={isProcessing} onPress={handleMicPress} style={[styles.micBtn, { backgroundColor: isListening ? colors.danger : colors.surface, opacity: isProcessing ? 0.5 : 1 }]}>
                  {isListening ? <Square color="#fff" size={20} fill="#fff" /> : <Mic color={colors.textPrimary} size={24} />}
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        <Modal animationType="fade" transparent={true} visible={modalModeloVisible} onRequestClose={() => setModalModeloVisible(false)}>
          <Pressable style={styles.modalOverlay} onPress={() => setModalModeloVisible(false)}>
            <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
              <View style={[styles.modalHandler, { backgroundColor: colors.border }]} />
              <Text style={{ fontSize: typography.h2, fontWeight: '900', color: colors.textPrimary, marginBottom: 20, textAlign: 'center' }}>Motor de Inteligencia</Text>

              <TouchableOpacity style={[styles.modalOption, { borderColor: modeloIA === 'Luma Cloud' ? colors.primary : colors.border, backgroundColor: modeloIA === 'Luma Cloud' ? colors.primaryLight : colors.surface }]} onPress={() => { setModeloIA('Luma Cloud'); setModalModeloVisible(false); }}>
                <View style={[styles.optionIcon, { backgroundColor: '#e0e7ff' }]}><Cloud color={colors.primary} size={28} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.textPrimary, fontSize: typography.lg, fontWeight: 'bold' }}>Luma Cloud</Text>
                  <Text style={{ color: colors.textSecondary, fontSize: typography.sm, marginTop: 2 }}>Respuestas rápidas vía API en la nube.</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.modalOption, { borderColor: modeloIA === 'Llama 3.2 Local' ? colors.primary : colors.border, backgroundColor: modeloIA === 'Llama 3.2 Local' ? colors.primaryLight : colors.surface }]} onPress={() => { setModeloIA('Llama 3.2 Local'); setModalModeloVisible(false); }}>
                <View style={[styles.optionIcon, { backgroundColor: '#dcfce7' }]}><Server color="#16a34a" size={28} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.textPrimary, fontSize: typography.lg, fontWeight: 'bold' }}>Llama 3.2 Local</Text>
                  <Text style={{ color: colors.textSecondary, fontSize: typography.sm, marginTop: 2 }}>Procesamiento 100% privado en tu servidor local vía Ollama.</Text>
                </View>
              </TouchableOpacity>

            </View>
          </Pressable>
        </Modal>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 2 },
  backButton: { padding: 8, backgroundColor: '#f1f5f9', borderRadius: 16, marginRight: 16 },
  headerTitleContainer: { flexDirection: 'row', alignItems: 'center' },
  chatContainer: { padding: 20, paddingBottom: 20, gap: 24 },
  messageRow: { flexDirection: 'row', width: '100%', marginBottom: 16 },
  rowReverse: { justifyContent: 'flex-end' },
  rowNormal: { justifyContent: 'flex-start' },
  botAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 12, marginTop: 4 },
  bubble: { padding: 16, borderRadius: 24, borderWidth: 2, maxWidth: '90%' },
  audioButton: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 100, marginTop: 8, marginLeft: 4 },
  bottomArea: { borderTopWidth: 2, paddingVertical: 12, paddingBottom: 16 },
  bottomScroll: { paddingHorizontal: 16, gap: 12, marginBottom: 16 },
  quickBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 2, borderRadius: 100, paddingHorizontal: 16, paddingVertical: 10, height: 48 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, borderWidth: 2, borderRadius: 32, padding: 8, minHeight: 64 },
  modelSelector: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 100, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 1 },
  textInput: { flex: 1, marginHorizontal: 12, paddingVertical: 8, maxHeight: 100 },
  actionRight: { justifyContent: 'center', alignItems: 'center', width: 44, height: 44 },
  micBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  sendBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 40 },
  modalHandler: { width: 48, height: 6, borderRadius: 3, alignSelf: 'center', marginBottom: 24 },
  modalOption: { flexDirection: 'row', alignItems: 'center', padding: 16, borderWidth: 2, borderRadius: 24, marginBottom: 12 },
  optionIcon: { padding: 12, borderRadius: 16, marginRight: 16 },
});