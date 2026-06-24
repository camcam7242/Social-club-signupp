import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/types';
import { TopBar } from '@/components/TopBar';
import { Avatar } from '@/components/Avatar';
import { colors, typography, spacing, radius } from '@/theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'Chat'>;

interface Msg { id: string; text: string; fromMe: boolean; time: string; }

const INITIAL: Msg[] = [
  { id: '1', text: 'Hi! Looking forward to your appointment on Thursday 🙌', fromMe: false, time: '10:02 AM' },
  { id: '2', text: 'Same! Quick question — should I come with my hair washed?', fromMe: true, time: '10:05 AM' },
  { id: '3', text: 'Yes please! Come with clean, detangled hair. See you then!', fromMe: false, time: '10:07 AM' },
];

export function ChatScreen({ navigation }: Props) {
  const [messages, setMessages] = useState<Msg[]>(INITIAL);
  const [input, setInput] = useState('');

  function send() {
    if (!input.trim()) return;
    setMessages(prev => [...prev, { id: Date.now().toString(), text: input.trim(), fromMe: true, time: 'Now' }]);
    setInput('');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <TopBar title="Jordan B." onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.messages} showsVerticalScrollIndicator={false}>
          {messages.map(m => (
            <View key={m.id} style={[styles.msgRow, m.fromMe && styles.msgRowMe]}>
              {!m.fromMe && <Avatar name="Jordan B" size={32} />}
              <View style={[styles.bubble, m.fromMe ? styles.bubbleMe : styles.bubbleThem]}>
                <Text style={[styles.bubbleText, m.fromMe && styles.bubbleTextMe]}>{m.text}</Text>
                <Text style={[styles.msgTime, m.fromMe && styles.msgTimeMe]}>{m.time}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
        <View style={styles.inputBar}>
          <TextInput style={styles.input} value={input} onChangeText={setInput} placeholder="Message..." placeholderTextColor={colors.muted} multiline />
          <TouchableOpacity style={[styles.sendBtn, !input.trim() && { opacity: 0.4 }]} onPress={send} disabled={!input.trim()}>
            <Text style={styles.sendIcon}>↑</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  messages: { padding: spacing.screenH, gap: 12, paddingBottom: 8 },
  msgRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  msgRowMe: { flexDirection: 'row-reverse' },
  bubble: { maxWidth: '75%', padding: 12, borderRadius: 18, gap: 4 },
  bubbleMe: { backgroundColor: colors.blue, borderBottomRightRadius: 4 },
  bubbleThem: { backgroundColor: colors.field, borderBottomLeftRadius: 4 },
  bubbleText: { ...typography.body, color: colors.ink, lineHeight: 20 },
  bubbleTextMe: { color: colors.white },
  msgTime: { ...typography.caption, color: colors.muted, fontSize: 10 },
  msgTimeMe: { color: 'rgba(255,255,255,0.6)', textAlign: 'right' },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', padding: 12, borderTopWidth: 1, borderTopColor: colors.line, gap: 10 },
  input: { flex: 1, minHeight: 44, maxHeight: 120, backgroundColor: colors.field, borderRadius: 22, paddingHorizontal: 16, paddingVertical: 12, ...typography.body, color: colors.ink },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.blue, alignItems: 'center', justifyContent: 'center' },
  sendIcon: { color: colors.white, fontSize: 18, fontWeight: '700' },
});
