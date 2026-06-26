import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert,
  ActivityIndicator, ScrollView, TextInput,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { api, disputeApi, jobNotesApi } from '../../services/api';
import { useSocketStore } from '../../store/socketStore';
import { useAuthStore } from '../../store/authStore';
import { Job, JobStatus } from '../../types';

const STEPS: { status: JobStatus; label: string; icon: string }[] = [
  { status: 'scheduled', label: 'Booked', icon: '📅' },
  { status: 'en_route', label: 'Mechanic En Route', icon: '🚗' },
  { status: 'arrived', label: 'Mechanic Arrived', icon: '📍' },
  { status: 'in_progress', label: 'Work In Progress', icon: '🔧' },
  { status: 'completed', label: 'Job Complete', icon: '✅' },
];

const STATUS_INDEX: Record<JobStatus, number> = {
  scheduled: 0, en_route: 1, arrived: 2, in_progress: 3, completed: 4, cancelled: -1,
};

export default function JobTrackingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const { socket, joinJob } = useSocketStore();
  const user = useAuthStore((s) => s.user);
  const [liveStatus, setLiveStatus] = useState<JobStatus | null>(null);
  const [noteText, setNoteText] = useState('');

  const { data: job, isLoading } = useQuery<Job & { price?: number }>({
    queryKey: ['job', id],
    queryFn: async () => (await api.get(`/jobs/${id}`)).data,
  });

  useEffect(() => {
    if (!id) return;
    joinJob(id);
  }, [id]);

  useEffect(() => {
    if (!socket) return;

    const handle = (status: JobStatus) => (data: any) => {
      setLiveStatus(status);
      qc.invalidateQueries({ queryKey: ['job', id] });
      if (status === 'completed') {
        Alert.alert('Job Complete!', 'Your mechanic has finished the work. Please proceed to payment.');
      }
    };

    socket.on('mechanic_en_route', handle('en_route'));
    socket.on('mechanic_arrived', handle('arrived'));
    socket.on('job_started', handle('in_progress'));
    socket.on('job_completed', handle('completed'));
    socket.on('payment_processed', () => {
      Alert.alert('Payment Confirmed', 'Thank you! Please leave a review.');
      router.push(`/review/${id}`);
    });

    return () => {
      socket.off('mechanic_en_route');
      socket.off('mechanic_arrived');
      socket.off('job_started');
      socket.off('job_completed');
      socket.off('payment_processed');
    };
  }, [socket, id]);



  const { data: notes = [] } = useQuery<{ id: string; note: string; author_name: string; author_role: string; created_at: string }[]>({
    queryKey: ['job-notes', id],
    queryFn: async () => (await jobNotesApi.list(id)).data,
  });

  const addNoteMutation = useMutation({
    mutationFn: (note: string) => jobNotesApi.add(id, note),
    onSuccess: () => {
      setNoteText('');
      qc.invalidateQueries({ queryKey: ['job-notes', id] });
    },
    onError: (err: any) => Alert.alert('Error', err.response?.data?.error || 'Failed to add note'),
  });

  const fileDisputeMutation = useMutation({
    mutationFn: ({ reason, details }: { reason: string; details?: string }) =>
      disputeApi.file(id, reason, details),
    onSuccess: () => {
      Alert.alert('Dispute Filed', 'Our team will review your issue within 24 hours.');
    },
    onError: (err: any) => Alert.alert('Error', err.response?.data?.error || 'Failed to file dispute'),
  });

  const handleFileDispute = () => {
    Alert.prompt(
      '⚠️ Report an Issue',
      'Please describe the issue with this job:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          onPress: (reason) => {
            if (!reason?.trim()) return;
            fileDisputeMutation.mutate({ reason: reason.trim() });
          },
        },
      ],
      'plain-text'
    );
  };

  if (isLoading) return <ActivityIndicator style={{ flex: 1 }} />;
  if (!job) return <Text style={styles.empty}>Job not found.</Text>;

  const currentStatus: JobStatus = liveStatus || job.status;
  const currentIndex = STATUS_INDEX[currentStatus] ?? 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.title}>Job Tracking</Text>

      {currentStatus === 'cancelled' ? (
        <View style={styles.cancelledCard}>
          <Text style={styles.cancelledText}>This job was cancelled.</Text>
        </View>
      ) : (
        <View style={styles.timelineCard}>
          {STEPS.map((step, i) => {
            const done = i < currentIndex;
            const active = i === currentIndex;
            return (
              <View key={step.status} style={styles.stepRow}>
                <View style={styles.stepLeft}>
                  <View style={[
                    styles.stepDot,
                    done && styles.stepDotDone,
                    active && styles.stepDotActive,
                  ]}>
                    {done ? (
                      <Text style={styles.stepCheck}>✓</Text>
                    ) : (
                      <Text style={styles.stepIcon}>{active ? step.icon : ''}</Text>
                    )}
                  </View>
                  {i < STEPS.length - 1 && (
                    <View style={[styles.stepLine, done && styles.stepLineDone]} />
                  )}
                </View>
                <View style={styles.stepContent}>
                  <Text style={[
                    styles.stepLabel,
                    active && styles.stepLabelActive,
                    done && styles.stepLabelDone,
                  ]}>
                    {step.label}
                  </Text>
                  {active && (
                    <Text style={styles.stepSub}>Current status</Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Chat with Mechanic */}
      <TouchableOpacity
        style={styles.chatBtn}
        onPress={() => router.push(`/chat/${id}`)}
      >
        <Text style={styles.chatBtnText}>💬 Chat with Mechanic</Text>
      </TouchableOpacity>

      {currentStatus === 'completed' && (
        <View style={styles.paySection}>
          <Text style={styles.payTitle}>Ready to Pay</Text>
          <Text style={styles.paySubtitle}>Your mechanic has completed the job.</Text>
          <TouchableOpacity
            style={styles.payBtn}
            onPress={() => router.push(`/pay/${id}`)}
          >
            <Text style={styles.payBtnText}>Pay Now  →</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push(`/receipt/${id}`)} style={styles.receiptBtn}>
            <Text style={styles.receiptBtnText}>📄 View Receipt</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push(`/review/${id}`)} style={styles.skipPay}>
            <Text style={styles.skipPayText}>Leave a Review</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleFileDispute} style={styles.disputeBtn} disabled={fileDisputeMutation.isPending}>
            <Text style={styles.disputeBtnText}>⚠️ Report an Issue</Text>
          </TouchableOpacity>
        </View>
      )}

      {(currentStatus === 'en_route' || currentStatus === 'arrived') && (
        <View style={styles.infoCard}>
          <Text style={styles.infoIcon}>🗺️</Text>
          <Text style={styles.infoText}>Your mechanic is on the way. Stay near your vehicle.</Text>
        </View>
      )}

      {(currentStatus === 'en_route' || currentStatus === 'arrived') && (
        <TouchableOpacity style={styles.liveMapBtn} onPress={() => router.push(`/track/${id}`)}>
          <Text style={styles.liveMapBtnText}>🗺️  Track Live on Map</Text>
        </TouchableOpacity>
      )}

      {currentStatus === 'in_progress' && (
        <View style={styles.infoCard}>
          <Text style={styles.infoIcon}>🔧</Text>
          <Text style={styles.infoText}>Work is in progress. You'll be notified when it's done.</Text>
        </View>
      )}

      {/* Job Notes */}
      <View style={styles.notesSection}>
        <Text style={styles.notesSectionTitle}>Notes</Text>
        {notes.length === 0 && (
          <Text style={styles.notesEmpty}>No notes yet.</Text>
        )}
        {notes.map((n) => (
          <View key={n.id} style={styles.noteCard}>
            <Text style={styles.noteAuthor}>
              {n.author_role === 'mechanic' ? '🔧 Mechanic' : '👤 Customer'}: {n.author_name}
            </Text>
            <Text style={styles.noteText}>{n.note}</Text>
            <Text style={styles.noteTime}>
              {new Date(n.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        ))}
        <View style={styles.addNoteRow}>
          <TextInput
            style={styles.noteInput}
            value={noteText}
            onChangeText={setNoteText}
            placeholder="Add a note..."
            placeholderTextColor="#9ca3af"
            multiline
          />
          <TouchableOpacity
            style={[styles.addNoteBtn, !noteText.trim() && styles.addNoteBtnDisabled]}
            onPress={() => { if (noteText.trim()) addNoteMutation.mutate(noteText.trim()); }}
            disabled={!noteText.trim() || addNoteMutation.isPending}
          >
            <Text style={styles.addNoteBtnText}>Add</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  title: { fontSize: 22, fontWeight: '700', color: '#111', marginBottom: 20 },
  timelineCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 16,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 3,
  },
  stepRow: { flexDirection: 'row', marginBottom: 4 },
  stepLeft: { alignItems: 'center', width: 36 },
  stepDot: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#f3f4f6', borderWidth: 2, borderColor: '#e5e7eb',
    alignItems: 'center', justifyContent: 'center',
  },
  stepDotDone: { backgroundColor: '#10b981', borderColor: '#10b981' },
  stepDotActive: { backgroundColor: '#1a56db', borderColor: '#1a56db' },
  stepCheck: { color: '#fff', fontWeight: '700', fontSize: 14 },
  stepIcon: { fontSize: 14 },
  stepLine: { width: 2, flex: 1, backgroundColor: '#e5e7eb', marginVertical: 4 },
  stepLineDone: { backgroundColor: '#10b981' },
  stepContent: { flex: 1, paddingLeft: 12, paddingBottom: 20 },
  stepLabel: { fontSize: 15, color: '#9ca3af', fontWeight: '500' },
  stepLabelActive: { color: '#1a56db', fontWeight: '700', fontSize: 16 },
  stepLabelDone: { color: '#374151' },
  stepSub: { fontSize: 12, color: '#1a56db', marginTop: 2 },
  cancelledCard: { backgroundColor: '#fee2e2', borderRadius: 12, padding: 20, alignItems: 'center' },
  cancelledText: { color: '#ef4444', fontWeight: '600', fontSize: 16 },
  paySection: {
    backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 16,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 3, alignItems: 'center',
  },
  payTitle: { fontSize: 20, fontWeight: '700', color: '#111', marginBottom: 6 },
  paySubtitle: { fontSize: 14, color: '#6b7280', marginBottom: 20 },
  payBtn: { backgroundColor: '#1a56db', borderRadius: 12, padding: 16, alignItems: 'center', width: '100%' },
  payBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  skipPay: { marginTop: 14 },
  skipPayText: { color: '#1a56db', fontSize: 14 },
  infoCard: {
    backgroundColor: '#eff6ff', borderRadius: 12, padding: 16,
    flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16,
  },
  infoIcon: { fontSize: 24 },
  infoText: { flex: 1, fontSize: 14, color: '#1e40af' },
  liveMapBtn: {
    backgroundColor: '#f0fdf4', borderWidth: 1.5, borderColor: '#10b981',
    borderRadius: 12, padding: 14, alignItems: 'center', marginBottom: 16,
  },
  liveMapBtnText: { color: '#10b981', fontWeight: '600', fontSize: 15 },
  empty: { textAlign: 'center', marginTop: 60, color: '#9ca3af', fontSize: 15 },
  chatBtn: {
    backgroundColor: '#eff6ff', borderWidth: 1.5, borderColor: '#1a56db',
    borderRadius: 12, padding: 14, alignItems: 'center', marginBottom: 16,
  },
  chatBtnText: { color: '#1a56db', fontWeight: '600', fontSize: 15 },
  receiptBtn: { marginTop: 10 },
  receiptBtnText: { color: '#374151', fontSize: 14, textAlign: 'center' },
  disputeBtn: { marginTop: 14 },
  disputeBtnText: { color: '#ef4444', fontSize: 13, textAlign: 'center' },
  notesSection: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 24,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  notesSectionTitle: { fontSize: 16, fontWeight: '700', color: '#111', marginBottom: 10 },
  notesEmpty: { color: '#9ca3af', fontSize: 13, marginBottom: 10 },
  noteCard: {
    backgroundColor: '#f9fafb', borderRadius: 10, padding: 12, marginBottom: 8,
    borderLeftWidth: 3, borderLeftColor: '#1a56db',
  },
  noteAuthor: { fontSize: 11, fontWeight: '700', color: '#6b7280', marginBottom: 4 },
  noteText: { fontSize: 14, color: '#374151' },
  noteTime: { fontSize: 10, color: '#9ca3af', marginTop: 4 },
  addNoteRow: { flexDirection: 'row', gap: 8, marginTop: 8, alignItems: 'flex-end' },
  noteInput: {
    flex: 1, backgroundColor: '#f3f4f6', borderRadius: 10, padding: 10,
    fontSize: 14, color: '#111', minHeight: 42,
  },
  addNoteBtn: { backgroundColor: '#1a56db', borderRadius: 10, padding: 10, justifyContent: 'center' },
  addNoteBtnDisabled: { backgroundColor: '#93c5fd' },
  addNoteBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
});
