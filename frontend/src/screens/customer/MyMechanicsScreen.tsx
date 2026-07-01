import React from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { api } from '../../services/api';

interface MechanicHistory {
  id: string;
  business_name: string;
  email: string;
  rating: number;
  review_count: number;
  tier: string;
  is_available: boolean;
  job_count: number;
  last_job_at: string;
  is_favorite: boolean;
}

const TIER_BADGE: Record<string, string> = {
  basic: '🔧',
  certified: '🏅',
  master: '⭐',
};

export default function MyMechanicsScreen() {
  const router = useRouter();
  const qc = useQueryClient();

  const { data: mechanics = [], isLoading } = useQuery<MechanicHistory[]>({
    queryKey: ['my-mechanics'],
    queryFn: async () => (await api.get('/jobs/my-mechanics')).data,
  });

  const favMutation = useMutation({
    mutationFn: (mechanicId: string) => api.post(`/jobs/my-mechanics/${mechanicId}/favorite`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-mechanics'] }),
  });

  if (isLoading) return <ActivityIndicator style={{ flex: 1 }} color="#1a56db" />;

  const renderItem = ({ item }: { item: MechanicHistory }) => (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{TIER_BADGE[item.tier] || '🔧'}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{item.business_name || item.email.split('@')[0]}</Text>
          <View style={styles.ratingRow}>
            <Text style={styles.star}>★</Text>
            <Text style={styles.ratingText}>
              {Number(item.rating).toFixed(1)} · {item.review_count} reviews
            </Text>
            <View style={[styles.dot, { backgroundColor: item.is_available ? '#10b981' : '#64748b' }]} />
            <Text style={styles.availText}>{item.is_available ? 'Online' : 'Offline'}</Text>
          </View>
          <Text style={styles.jobCount}>
            {item.job_count} job{item.job_count !== 1 ? 's' : ''} with you · Last: {new Date(item.last_job_at).toLocaleDateString()}
          </Text>
        </View>
        <TouchableOpacity onPress={() => favMutation.mutate(item.id)} style={styles.favBtn}>
          <Text style={styles.favIcon}>{item.is_favorite ? '❤️' : '🤍'}</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.requestBtn}
        onPress={() => router.push({ pathname: '/(tabs)/new-request', params: { preferred_mechanic_id: item.id } })}
      >
        <Text style={styles.requestBtnText}>Request Again</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={mechanics}
        keyExtractor={(m) => m.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🔧</Text>
            <Text style={styles.emptyTitle}>No mechanics yet</Text>
            <Text style={styles.emptySub}>Once you complete a job, your mechanic will appear here so you can book them again.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  card: {
    backgroundColor: '#1e293b', borderRadius: 14, padding: 16,
    marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 6, elevation: 3,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 14 },
  avatar: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: '#0f172a',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 22 },
  name: { fontSize: 16, fontWeight: '700', color: '#f1f5f9', marginBottom: 4 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  star: { color: '#f59e0b', fontSize: 13 },
  ratingText: { fontSize: 12, color: '#94a3b8' },
  dot: { width: 6, height: 6, borderRadius: 3, marginLeft: 6 },
  availText: { fontSize: 12, color: '#94a3b8' },
  jobCount: { fontSize: 12, color: '#64748b' },
  favBtn: { padding: 4 },
  favIcon: { fontSize: 22 },
  requestBtn: {
    backgroundColor: '#1a56db', borderRadius: 10, padding: 13, alignItems: 'center',
  },
  requestBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  empty: { alignItems: 'center', marginTop: 80, paddingHorizontal: 32 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { color: '#f1f5f9', fontSize: 18, fontWeight: '700', marginBottom: 8 },
  emptySub: { color: '#64748b', fontSize: 14, textAlign: 'center', lineHeight: 20 },
});
