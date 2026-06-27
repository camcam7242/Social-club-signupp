import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert,
  ScrollView, ActivityIndicator, FlatList, TextInput,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { jobApi, mechanicApi, jobNotesApi } from '../../services/api';
import { Job, JobStatus } from '../../types';
import { useRouter } from 'expo-router';
import { useMechanicLocationBroadcast } from '../../hooks/useMechanicLocationBroadcast';

const NEXT_STATUS: Partial<Record<JobStatus, { status: JobStatus; label: string; color: string }>> = {
  scheduled: { status: 'en_route', label: 'Start Driving', color: '#3b82f6' },
  en_route: { status: 'arrived', label: "I've Arrived", color: '#8b5cf6' },
  arrived: { status: 'in_progress', label: 'Start Work', color: '#f97316' },
  in_progress: { status: 'completed', label: 'Mark Complete', color: '#10b981' },
};

const STATUS_LABEL: Record<string, string> = {
  scheduled: 'Scheduled', en_route: 'En Route', arrived: 'Arrived',
  in_progress: 'In Progress', completed: 'Completed', cancelled: 'Cancelled',
};

export default function ActiveJobScreen() {
  const qc = useQueryClient();
  const router = useRouter();
  const [noteTexts, setNoteTexts] = useState<Record<string, string>>({});

  const { data: jobs = [], isLoading, refetch } = useQuery<(Job & { price: number; service_type: string; year: number; make: string; model: string; location_address?: string })[]>({
    queryKey: ['my-jobs'],
    queryFn: async () => (await jobApi.list()).data,
  });

  const statusMutation = useMutation({
    mutationFn: ({ jobId, status }: { jobId: string; status: string }) =>
      mechanicApi.updateJobStatus(jobId, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-jobs'] }),
    onError: (err: any) => Alert.alert('Error', err.response?.data?.error || 'Failed to update status'),
  });

  const addNoteMutation = useMutation({
    mutationFn: ({ jobId, note }: { jobId: string; note: string }) => jobNotesApi.add(jobId, note),
    onSuccess: (_data, vars) => {
      setNoteTexts((prev) => ({ ...prev, [vars.jobId]: '' }));
      qc.invalidateQueries({ queryKey: ['job-notes', vars.jobId] });
    },
    onError: (err: any) => Alert.alert('Error', err.response?.data?.error || 'Failed to add note'),
  });

  const activeStatusJob = jobs.find(j => ["en_route","arrived"].includes(j.status));
  useMechanicLocationBroadcast(activeStatusJob?.status as JobStatus | undefined);

  const activeJobs = jobs.filter(j => !['completed', 'cancelled'].includes(j.status));
  const pastJobs = jobs.filter(j => ['completed', 'cancelled'].includes(j.status));

  if (isLoading) return <ActivityIndicator style={{ flex: 1 }} />;

  const JobNotesSection = ({ jobId }: { jobId: string }) => {
    const { data: notes = [] } = useQuery<{ id: string; note: string; author_name: string; author_role: string; created_at: string }[]>({
      queryKey: ['job-notes', jobId],
      queryFn: async () => (await jobNotesApi.list(jobId)).data,
    });
    const noteText = noteTexts[jobId] || '';
    return (
      <View style={styles.notesSection}>
        <Text style={styles.notesSectionTitle}>Notes</Text>
        {notes.length === 0 && <Text style={styles.notesEmpty}>No notes yet.</Text>}
        {notes.map((n) => (
          <View key={n.id} style={styles.noteCard}>
            <Text style={styles.noteAuthor}>
              {n.author_role === 'mechanic' ? '🔧 Mechanic' : '👤 Customer'}: {n.author_name}
            </Text>
            <Text style={styles.noteText}>{n.note}</Text>
          </View>
        ))}
        <View style={styles.addNoteRow}>
          <TextInput
            style={styles.noteInput}
            value={noteText}
            onChangeText={(t) => setNoteTexts((prev) => ({ ...prev, [jobId]: t }))}
            placeholder="Add a note..."
            placeholderTextColor="#9ca3af"
          />
          <TouchableOpacity
            style={[styles.addNoteBtn, !noteText.trim() && styles.addNoteBtnDisabled]}
            onPress={() => { if (noteText.trim()) addNoteMutation.mutate({ jobId, note: noteText.trim() }); }}
            disabled={!noteText.trim() || addNoteMutation.isPending}
          >
            <Text style={styles.addNoteBtnText}>Add</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderJob = (job: typeof jobs[0], isActive: boolean) => {
    const next = NEXT_STATUS[job.status as JobStatus];
    const isPastCompleted = job.status === 'completed';
    return (
      <View key={job.id} style={[styles.card, isActive && styles.cardActive]}>
        <View style={styles.row}>
          <Text style={styles.serviceType}>{job.service_type}</Text>
          <View style={[styles.badge, { backgroundColor: isActive ? '#dbeafe' : '#f3f4f6' }]}>
            <Text style={[styles.badgeText, { color: isActive ? '#1a56db' : '#6b7280' }]}>
              {STATUS_LABEL[job.status]}
            </Text>
          </View>
        </View>
        <Text style={styles.vehicle}>{job.year} {job.make} {job.model}</Text>
        {job.location_address && <Text style={styles.location}>📍 {job.location_address}</Text>}
        <Text style={styles.price}>💰 ${parseFloat(job.price as any).toFixed(2)}</Text>

        {job.status === 'completed' && (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#0f172a', marginBottom: 8 }]}
            onPress={() => router.push(`/tap-pay/${job.id}`)}
          >
            <Text style={styles.actionBtnText}>💳  Collect Payment (Tap to Pay)</Text>
          </TouchableOpacity>
        )}

        {isPastCompleted && (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#f59e0b', marginBottom: 8 }]}
            onPress={() => router.push(`/(tabs)/new-request?serviceType=${encodeURIComponent(job.service_type)}`)}
          >
            <Text style={styles.actionBtnText}>🔄 Book Again</Text>
          </TouchableOpacity>
        )}

        {/* Chat with Customer */}
        <TouchableOpacity
          style={styles.chatBtn}
          onPress={() => router.push(`/chat/${job.id}`)}
        >
          <Text style={styles.chatBtnText}>💬 Chat with Customer</Text>
        </TouchableOpacity>

        {isActive && next && (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: next.color, marginTop: 8 }]}
            onPress={() => Alert.alert(next.label, 'Update job status?', [
              { text: 'Cancel' },
              { text: 'Confirm', onPress: () => statusMutation.mutate({ jobId: job.id, status: next.status }) },
            ])}
            disabled={statusMutation.isPending}
          >
            <Text style={styles.actionBtnText}>{next.label}</Text>
          </TouchableOpacity>
        )}

        <JobNotesSection jobId={job.id} />
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.sectionTitle}>Active Jobs ({activeJobs.length})</Text>
      {activeJobs.length === 0 && (
        <Text style={styles.empty}>No active jobs. Accept a quote to get started.</Text>
      )}
      {activeJobs.map(j => renderJob(j, true))}

      {pastJobs.length > 0 && (
        <>
          <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Past Jobs</Text>
          {pastJobs.slice(0, 10).map(j => renderJob(j, false))}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#111', marginBottom: 12 },
  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  cardActive: { borderLeftWidth: 4, borderLeftColor: '#1a56db' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  serviceType: { fontSize: 16, fontWeight: '700', color: '#111' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  vehicle: { fontSize: 13, color: '#6b7280', marginBottom: 4 },
  location: { fontSize: 13, color: '#6b7280', marginBottom: 4 },
  price: { fontSize: 14, color: '#374151', fontWeight: '500', marginBottom: 12 },
  actionBtn: { borderRadius: 10, padding: 12, alignItems: 'center' },
  actionBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  empty: { color: '#9ca3af', fontSize: 14, textAlign: 'center', marginTop: 20 },
  chatBtn: {
    backgroundColor: '#eff6ff', borderWidth: 1.5, borderColor: '#1a56db',
    borderRadius: 10, padding: 10, alignItems: 'center', marginTop: 8,
  },
  chatBtnText: { color: '#1a56db', fontWeight: '600', fontSize: 14 },
  notesSection: { marginTop: 12, borderTopWidth: 1, borderTopColor: '#f3f4f6', paddingTop: 12 },
  notesSectionTitle: { fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 6 },
  notesEmpty: { color: '#9ca3af', fontSize: 12, marginBottom: 8 },
  noteCard: {
    backgroundColor: '#f9fafb', borderRadius: 8, padding: 8, marginBottom: 6,
    borderLeftWidth: 3, borderLeftColor: '#10b981',
  },
  noteAuthor: { fontSize: 10, fontWeight: '700', color: '#6b7280', marginBottom: 2 },
  noteText: { fontSize: 13, color: '#374151' },
  addNoteRow: { flexDirection: 'row', gap: 6, marginTop: 6, alignItems: 'flex-end' },
  noteInput: {
    flex: 1, backgroundColor: '#f3f4f6', borderRadius: 8, padding: 8,
    fontSize: 13, color: '#111', minHeight: 38,
  },
  addNoteBtn: { backgroundColor: '#1a56db', borderRadius: 8, padding: 8, justifyContent: 'center' },
  addNoteBtnDisabled: { backgroundColor: '#93c5fd' },
  addNoteBtnText: { color: '#fff', fontWeight: '700', fontSize: 12 },
});
