import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { chatApi } from '../../services/api';
import { useSocketStore } from '../../store/socketStore';
import { useAuthStore } from '../../store/authStore';

interface ChatMessage {
  id: string;
  job_id: string;
  sender_id: string;
  sender_name: string;
  message: string;
  created_at: string;
}

export default function ChatScreen() {
  const { jobId } = useLocalSearchParams<{ jobId: string }>();
  const qc = useQueryClient();
  const { socket } = useSocketStore();
  const user = useAuthStore((s) => s.user);
  const [text, setText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  const { data: messages = [], isLoading } = useQuery<ChatMessage[]>({
    queryKey: ['chat', jobId],
    queryFn: async () => (await chatApi.getMessages(jobId)).data,
  });

  // Join job chat room
  useEffect(() => {
    if (socket && jobId) {
      socket.emit('join_job', jobId);
    }
  }, [socket, jobId]);

  // Listen for incoming messages
  useEffect(() => {
    if (!socket) return;

    const handleChatMessage = (msg: ChatMessage) => {
      qc.setQueryData<ChatMessage[]>(['chat', jobId], (prev = []) => {
        // avoid duplicate if we already added optimistically
        if (prev.find((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    };

    socket.on('chat_message', handleChatMessage);
    return () => { socket.off('chat_message', handleChatMessage); };
  }, [socket, jobId, qc]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  const sendMutation = useMutation({
    mutationFn: (msg: string) => chatApi.sendMessage(jobId, msg),
    onMutate: async (msg) => {
      const optimistic: ChatMessage = {
        id: `temp-${Date.now()}`,
        job_id: jobId,
        sender_id: user?.id || '',
        sender_name: user?.name || 'You',
        message: msg,
        created_at: new Date().toISOString(),
      };
      qc.setQueryData<ChatMessage[]>(['chat', jobId], (prev = []) => [...prev, optimistic]);
      return { optimistic };
    },
    onSuccess: (res, _vars, ctx) => {
      // Replace optimistic entry with real one
      qc.setQueryData<ChatMessage[]>(['chat', jobId], (prev = []) =>
        prev.map((m) => (m.id === ctx?.optimistic.id ? res.data : m))
      );
    },
    onError: (_err, _vars, ctx) => {
      // Remove optimistic entry on error
      qc.setQueryData<ChatMessage[]>(['chat', jobId], (prev = []) =>
        prev.filter((m) => m.id !== ctx?.optimistic.id)
      );
    },
  });

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setText('');
    sendMutation.mutate(trimmed);
  }, [text, sendMutation]);

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isMe = item.sender_id === user?.id;
    const time = new Date(item.created_at).toLocaleTimeString([], {
      hour: '2-digit', minute: '2-digit',
    });

    return (
      <View style={[styles.bubbleRow, isMe && styles.bubbleRowRight]}>
        <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
          {!isMe && (
            <Text style={styles.senderName}>{item.sender_name}</Text>
          )}
          <Text style={[styles.messageText, isMe && styles.messageTextMe]}>
            {item.message}
          </Text>
          <Text style={[styles.timestamp, isMe && styles.timestampMe]}>{time}</Text>
        </View>
      </View>
    );
  };

  if (isLoading) return <ActivityIndicator style={{ flex: 1 }} />;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      {messages.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No messages yet. Say hello!</Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.listContent}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        />
      )}

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Type a message..."
          placeholderTextColor="#9ca3af"
          multiline
          maxLength={1000}
          returnKeyType="send"
          onSubmitEditing={handleSend}
        />
        <TouchableOpacity
          style={[styles.sendBtn, !text.trim() && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!text.trim() || sendMutation.isPending}
        >
          <Text style={styles.sendBtnText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  listContent: { padding: 16, paddingBottom: 8 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#9ca3af', fontSize: 15 },
  bubbleRow: { flexDirection: 'row', marginBottom: 12 },
  bubbleRowRight: { justifyContent: 'flex-end' },
  bubble: {
    maxWidth: '75%', borderRadius: 16, padding: 12,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  bubbleMe: {
    backgroundColor: '#1a56db', borderBottomRightRadius: 4,
  },
  bubbleThem: {
    backgroundColor: '#fff', borderBottomLeftRadius: 4,
  },
  senderName: { fontSize: 11, fontWeight: '700', color: '#6b7280', marginBottom: 4 },
  messageText: { fontSize: 15, color: '#111', lineHeight: 21 },
  messageTextMe: { color: '#fff' },
  timestamp: { fontSize: 10, color: '#9ca3af', marginTop: 4, textAlign: 'right' },
  timestampMe: { color: 'rgba(255,255,255,0.6)' },
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', padding: 12,
    backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e5e7eb',
    gap: 8,
  },
  input: {
    flex: 1, minHeight: 42, maxHeight: 120, backgroundColor: '#f3f4f6',
    borderRadius: 21, paddingHorizontal: 16, paddingVertical: 10,
    fontSize: 15, color: '#111',
  },
  sendBtn: {
    backgroundColor: '#1a56db', borderRadius: 21, paddingHorizontal: 18,
    paddingVertical: 10, justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: '#93c5fd' },
  sendBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
