import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';

export default function AdminDashboardScreen() {
  const qc = useQueryClient();

  const { data: analytics, isLoading } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: async () => (await api.get('/admin/analytics')).data,
  });

  const { data: pendingMechanics = [] } = useQuery({
    queryKey: ['pending-mechanics'],
    queryFn: async () => (await api.get('/admin/mechanics/pending')).data,
  });

  const verifyMutation = useMutation({
    mutationFn: ({ id, verified }: { id: string; verified: boolean }) =>
      api.put(`/admin/mechanics/${id}/verify`, { verified }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pending-mechanics'] }),
  });

  if (isLoading) return <ActivityIndicator style={{ flex: 1 }} />;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.heading}>Platform Overview</Text>

      {analytics && (
        <View style={styles.statsGrid}>
          {[
            { label: 'Total Users', value: analytics.users.total },
            { label: 'Customers', value: analytics.users.customers },
            { label: 'Mechanics', value: analytics.users.mechanics },
            { label: 'New This Month', value: analytics.users.new_this_month },
            { label: 'Total Requests', value: analytics.requests.total },
            { label: 'Completed Jobs', value: analytics.requests.completed },
            { label: 'Platform Revenue', value: `$${parseFloat(analytics.payments.platform_revenue || 0).toFixed(2)}` },
            { label: 'Gross Revenue', value: `$${parseFloat(analytics.payments.gross_revenue || 0).toFixed(2)}` },
          ].map(({ label, value }) => (
            <View key={label} style={styles.statCard}>
              <Text style={styles.statValue}>{value}</Text>
              <Text style={styles.statLabel}>{label}</Text>
            </View>
          ))}
        </View>
      )}

      <Text style={styles.sectionTitle}>Pending Mechanic Approvals ({pendingMechanics.length})</Text>
      {pendingMechanics.map((m: any) => (
        <View key={m.id} style={styles.mechanicCard}>
          <Text style={styles.mechanicEmail}>{m.email}</Text>
          {m.business_name && <Text style={styles.mechanicBusiness}>{m.business_name}</Text>}
          <Text style={styles.docCount}>{m.documents?.length || 0} document(s) uploaded</Text>
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.approveBtn}
              onPress={() => verifyMutation.mutate({ id: m.id, verified: true })}
            >
              <Text style={styles.approveBtnText}>Approve</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.rejectBtn}
              onPress={() => Alert.alert('Reject', 'Reject this mechanic?', [
                { text: 'Cancel' },
                { text: 'Reject', style: 'destructive', onPress: () => verifyMutation.mutate({ id: m.id, verified: false }) },
              ])}
            >
              <Text style={styles.rejectBtnText}>Reject</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
      {pendingMechanics.length === 0 && (
        <Text style={styles.empty}>No pending approvals.</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  heading: { fontSize: 22, fontWeight: '700', color: '#f1f5f9', marginBottom: 16 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  statCard: {
    width: '47%', backgroundColor: '#0f172a', borderRadius: 10,
    padding: 14, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  statValue: { fontSize: 22, fontWeight: '700', color: '#1a56db' },
  statLabel: { fontSize: 12, color: '#94a3b8', marginTop: 4 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#f1f5f9', marginBottom: 12 },
  mechanicCard: {
    backgroundColor: '#0f172a', borderRadius: 10, padding: 14, marginBottom: 10,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  mechanicEmail: { fontSize: 15, fontWeight: '600', color: '#f1f5f9' },
  mechanicBusiness: { fontSize: 13, color: '#94a3b8', marginTop: 2 },
  docCount: { fontSize: 12, color: '#64748b', marginTop: 4, marginBottom: 12 },
  actionRow: { flexDirection: 'row', gap: 10 },
  approveBtn: { flex: 1, backgroundColor: '#10b981', borderRadius: 8, padding: 10, alignItems: 'center' },
  approveBtnText: { color: '#fff', fontWeight: '600' },
  rejectBtn: { flex: 1, backgroundColor: '#fee2e2', borderRadius: 8, padding: 10, alignItems: 'center' },
  rejectBtnText: { color: '#ef4444', fontWeight: '600' },
  empty: { textAlign: 'center', color: '#64748b', marginTop: 20, fontSize: 14 },
});
