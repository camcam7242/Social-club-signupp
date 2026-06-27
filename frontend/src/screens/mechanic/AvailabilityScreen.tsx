import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert,
  ScrollView, ActivityIndicator, Modal, TextInput, Platform,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { availabilityApi } from '../../services/api';

interface Block {
  id: string;
  start_at: string;
  end_at: string;
  reason?: string;
}

function formatDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDateLabel(iso: string) {
  return new Date(iso).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function AvailabilityScreen() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [startDate, setStartDate] = useState(formatDate(new Date()));
  const [startTime, setStartTime] = useState('09:00');
  const [endDate, setEndDate] = useState(formatDate(new Date()));
  const [endTime, setEndTime] = useState('17:00');
  const [reason, setReason] = useState('');

  const { data: blocks = [], isLoading } = useQuery<Block[]>({
    queryKey: ['availability'],
    queryFn: async () => (await availabilityApi.list()).data,
  });

  const createMutation = useMutation({
    mutationFn: () => {
      const start_at = new Date(`${startDate}T${startTime}:00`).toISOString();
      const end_at = new Date(`${endDate}T${endTime}:00`).toISOString();
      if (new Date(end_at) <= new Date(start_at)) {
        throw new Error('End time must be after start time');
      }
      return availabilityApi.create(start_at, end_at, reason.trim() || undefined);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['availability'] });
      setShowModal(false);
      setReason('');
    },
    onError: (e: any) => Alert.alert('Error', e.message || 'Failed to save block'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => availabilityApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['availability'] }),
    onError: () => Alert.alert('Error', 'Failed to remove block'),
  });

  if (isLoading) return <ActivityIndicator style={{ flex: 1 }} />;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          Block off times when you're unavailable. Customers won't be able to book you during these windows.
        </Text>
      </View>

      <TouchableOpacity style={styles.addBtn} onPress={() => setShowModal(true)}>
        <Text style={styles.addBtnText}>+ Block Off Time</Text>
      </TouchableOpacity>

      {blocks.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📅</Text>
          <Text style={styles.emptyTitle}>No blocked times</Text>
          <Text style={styles.emptyText}>You're available all the time. Block off vacation days, personal time, or other commitments.</Text>
        </View>
      )}

      {blocks.map((block) => (
        <View key={block.id} style={styles.blockCard}>
          <View style={styles.blockRow}>
            <View style={styles.blockInfo}>
              <Text style={styles.blockDate}>{formatDateLabel(block.start_at)}</Text>
              <Text style={styles.blockTime}>
                {formatTime(block.start_at)} — {formatTime(block.end_at)}
                {new Date(block.start_at).toDateString() !== new Date(block.end_at).toDateString()
                  ? ` (${formatDateLabel(block.end_at)})`
                  : ''}
              </Text>
              {block.reason && <Text style={styles.blockReason}>{block.reason}</Text>}
            </View>
            <TouchableOpacity
              onPress={() => Alert.alert('Remove Block', 'Remove this time block?', [
                { text: 'Cancel' },
                { text: 'Remove', style: 'destructive', onPress: () => deleteMutation.mutate(block.id) },
              ])}
              style={styles.deleteBtn}
            >
              <Text style={styles.deleteBtnText}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}

      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Block Off Time</Text>

            <Text style={styles.fieldLabel}>Start Date (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.fieldInput}
              value={startDate}
              onChangeText={setStartDate}
              placeholder="2024-12-25"
              keyboardType="numbers-and-punctuation"
            />

            <Text style={styles.fieldLabel}>Start Time (HH:MM)</Text>
            <TextInput
              style={styles.fieldInput}
              value={startTime}
              onChangeText={setStartTime}
              placeholder="09:00"
              keyboardType="numbers-and-punctuation"
            />

            <Text style={styles.fieldLabel}>End Date (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.fieldInput}
              value={endDate}
              onChangeText={setEndDate}
              placeholder="2024-12-25"
              keyboardType="numbers-and-punctuation"
            />

            <Text style={styles.fieldLabel}>End Time (HH:MM)</Text>
            <TextInput
              style={styles.fieldInput}
              value={endTime}
              onChangeText={setEndTime}
              placeholder="17:00"
              keyboardType="numbers-and-punctuation"
            />

            <Text style={styles.fieldLabel}>Reason (optional)</Text>
            <TextInput
              style={styles.fieldInput}
              value={reason}
              onChangeText={setReason}
              placeholder="e.g. Vacation, Family event..."
            />

            <TouchableOpacity
              style={styles.saveBtn}
              onPress={() => createMutation.mutate()}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.saveBtnText}>Save Block</Text>
              }
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setShowModal(false)} style={styles.cancelLink}>
              <Text style={styles.cancelLinkText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  infoBox: { backgroundColor: '#eff6ff', borderRadius: 12, padding: 14, marginBottom: 16 },
  infoText: { fontSize: 13, color: '#1e40af', lineHeight: 19 },
  addBtn: {
    backgroundColor: '#1a56db', borderRadius: 12, padding: 15,
    alignItems: 'center', marginBottom: 20,
  },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  emptyState: { alignItems: 'center', paddingVertical: 48 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#374151', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#9ca3af', textAlign: 'center', lineHeight: 20 },
  blockCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 10,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
    borderLeftWidth: 4, borderLeftColor: '#ef4444',
  },
  blockRow: { flexDirection: 'row', alignItems: 'center' },
  blockInfo: { flex: 1 },
  blockDate: { fontSize: 15, fontWeight: '700', color: '#111', marginBottom: 3 },
  blockTime: { fontSize: 13, color: '#6b7280', marginBottom: 3 },
  blockReason: { fontSize: 12, color: '#9ca3af', fontStyle: 'italic' },
  deleteBtn: { padding: 8 },
  deleteBtnText: { fontSize: 18, color: '#ef4444', fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#111', marginBottom: 16 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 10 },
  fieldInput: {
    borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 10,
    padding: 12, fontSize: 15, backgroundColor: '#f9fafb', color: '#111',
  },
  saveBtn: { backgroundColor: '#1a56db', borderRadius: 12, padding: 15, alignItems: 'center', marginTop: 16 },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  cancelLink: { alignItems: 'center', marginTop: 14 },
  cancelLinkText: { color: '#6b7280', fontSize: 14 },
});
