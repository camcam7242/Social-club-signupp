import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Switch, TouchableOpacity, ScrollView } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mechanicApi, requestApi } from '../../services/api';
import { useRouter } from 'expo-router';
import { ServiceRequest } from '../../types';

export default function MechanicDashboardScreen() {
  const router = useRouter();
  const qc = useQueryClient();

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['mechanic-profile'],
    queryFn: async () => (await mechanicApi.profile()).data,
  });

  const { data: earnings } = useQuery({
    queryKey: ['mechanic-earnings'],
    queryFn: async () => (await mechanicApi.earnings()).data,
  });

  const { data: openRequests = [] } = useQuery<ServiceRequest[]>({
    queryKey: ['open-requests'],
    queryFn: async () => (await requestApi.list()).data,
    enabled: profile?.verified === true,
  });

  const toggleMutation = useMutation({
    mutationFn: (val: boolean) => mechanicApi.updateProfile({ is_available: val }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mechanic-profile'] }),
  });

  if (profileLoading) return <ActivityIndicator style={{ flex: 1 }} />;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      {!profile?.verified && (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>Your account is pending verification. We'll notify you once approved.</Text>
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Availability</Text>
        <View style={styles.row}>
          <Text style={styles.availText}>{profile?.is_available ? 'Online — accepting jobs' : 'Offline'}</Text>
          <Switch
            value={profile?.is_available || false}
            onValueChange={(v) => toggleMutation.mutate(v)}
            disabled={!profile?.verified}
            trackColor={{ true: '#1a56db' }}
          />
        </View>
      </View>

      {earnings && (
        <TouchableOpacity style={styles.card} onPress={() => router.push('/earnings')} activeOpacity={0.8}>
          <View style={styles.row}>
            <Text style={styles.cardTitle}>Earnings</Text>
            <Text style={styles.seeAll}>Full Charts →</Text>
          </View>
          <View style={styles.earningsRow}>
            <View style={styles.earningItem}>
              <Text style={styles.earningValue}>${parseFloat(earnings.this_month).toFixed(2)}</Text>
              <Text style={styles.earningLabel}>This Month</Text>
            </View>
            <View style={styles.earningItem}>
              <Text style={styles.earningValue}>${parseFloat(earnings.total_earned).toFixed(2)}</Text>
              <Text style={styles.earningLabel}>Total Earned</Text>
            </View>
            <View style={styles.earningItem}>
              <Text style={styles.earningValue}>{earnings.completed_jobs}</Text>
              <Text style={styles.earningLabel}>Jobs Done</Text>
            </View>
          </View>
        </TouchableOpacity>
      )}

      {/* Quick Links */}
      <View style={styles.quickLinks}>
        <TouchableOpacity style={styles.quickLink} onPress={() => router.push('/mechanic-docs')}>
          <Text style={styles.quickLinkIcon}>📄</Text>
          <Text style={styles.quickLinkText}>Documents</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickLink} onPress={() => router.push('/availability')}>
          <Text style={styles.quickLinkIcon}>📅</Text>
          <Text style={styles.quickLinkText}>Availability</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickLink} onPress={() => router.push('/earnings')}>
          <Text style={styles.quickLinkIcon}>💰</Text>
          <Text style={styles.quickLinkText}>Earnings</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickLink} onPress={() => router.push('/promo')}>
          <Text style={styles.quickLinkIcon}>🔑</Text>
          <Text style={styles.quickLinkText}>Promo Code</Text>
        </TouchableOpacity>
      </View>

      {profile?.verified && (
        <>
          <Text style={styles.sectionTitle}>Open Requests Near You</Text>
          {openRequests.slice(0, 10).map((r) => (
            <TouchableOpacity key={r.id} style={styles.requestCard} onPress={() => router.push(`/requests/${r.id}`)}>
              <Text style={styles.requestType}>{r.service_type}</Text>
              <Text style={styles.requestVehicle}>{r.year} {r.make} {r.model}</Text>
              <Text style={styles.requestDesc} numberOfLines={1}>{r.description}</Text>
            </TouchableOpacity>
          ))}
          {openRequests.length === 0 && (
            <Text style={styles.empty}>No open requests in your area.</Text>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  banner: { backgroundColor: '#422006', borderRadius: 10, padding: 14, marginBottom: 16 },
  bannerText: { color: '#fcd34d', fontSize: 14 },
  card: {
    backgroundColor: '#0f172a', borderRadius: 12, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#cbd5e1', marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  availText: { fontSize: 15, color: '#f1f5f9' },
  earningsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  earningItem: { alignItems: 'center' },
  earningValue: { fontSize: 22, fontWeight: '700', color: '#1a56db' },
  earningLabel: { fontSize: 12, color: '#94a3b8', marginTop: 4 },
  seeAll: { fontSize: 13, color: '#1a56db', fontWeight: '500' },
  quickLinks: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  quickLink: {
    flex: 1, backgroundColor: '#0f172a', borderRadius: 12, padding: 14,
    alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  quickLinkIcon: { fontSize: 24, marginBottom: 6 },
  quickLinkText: { fontSize: 12, fontWeight: '600', color: '#cbd5e1' },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#f1f5f9', marginTop: 8, marginBottom: 12 },
  requestCard: {
    backgroundColor: '#0f172a', borderRadius: 10, padding: 14, marginBottom: 10,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  requestType: { fontSize: 15, fontWeight: '600', color: '#f1f5f9' },
  requestVehicle: { fontSize: 13, color: '#94a3b8', marginTop: 2 },
  requestDesc: { fontSize: 13, color: '#cbd5e1', marginTop: 4 },
  empty: { textAlign: 'center', color: '#64748b', marginTop: 24, fontSize: 14 },
});
