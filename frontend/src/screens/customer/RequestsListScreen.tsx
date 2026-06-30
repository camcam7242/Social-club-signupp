import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { requestApi } from '../../services/api';
import { ServiceRequest, RequestStatus } from '../../types';

const STATUS_COLORS: Record<RequestStatus, string> = {
  open: '#f59e0b',
  quoted: '#3b82f6',
  accepted: '#8b5cf6',
  in_progress: '#f97316',
  completed: '#10b981',
  cancelled: '#6b7280',
};

export default function RequestsListScreen() {
  const router = useRouter();
  const { data: requests = [], isLoading, refetch } = useQuery<ServiceRequest[]>({
    queryKey: ['requests'],
    queryFn: async () => (await requestApi.list()).data,
  });

  const renderItem = ({ item }: { item: ServiceRequest }) => (
    <TouchableOpacity style={styles.card} onPress={() => router.push(`/requests/${item.id}`)}>
      <View style={styles.cardHeader}>
        <Text style={styles.serviceType}>{item.service_type}</Text>
        <View style={[styles.badge, { backgroundColor: STATUS_COLORS[item.status] + '20' }]}>
          <Text style={[styles.badgeText, { color: STATUS_COLORS[item.status] }]}>
            {item.status.replace('_', ' ')}
          </Text>
        </View>
      </View>
      <Text style={styles.vehicle}>{item.year} {item.make} {item.model}</Text>
      <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
      {item.quotes && item.quotes.length > 0 && (
        <Text style={styles.quotesCount}>{item.quotes.length} quote{item.quotes.length !== 1 ? 's' : ''} received</Text>
      )}
    </TouchableOpacity>
  );

  if (isLoading) return <ActivityIndicator style={{ flex: 1 }} />;

  return (
    <View style={styles.container}>
      <FlatList
        data={requests}
        keyExtractor={(r) => r.id}
        renderItem={renderItem}
        onRefresh={refetch}
        refreshing={isLoading}
        ListEmptyComponent={<Text style={styles.empty}>No service requests yet.</Text>}
        contentContainerStyle={{ padding: 16 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  card: {
    backgroundColor: '#0f172a', borderRadius: 12, padding: 16,
    marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  serviceType: { fontSize: 16, fontWeight: '700', color: '#f1f5f9' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
  vehicle: { fontSize: 13, color: '#94a3b8', marginBottom: 6 },
  description: { fontSize: 14, color: '#cbd5e1' },
  quotesCount: { marginTop: 8, fontSize: 13, color: '#1a56db', fontWeight: '500' },
  empty: { textAlign: 'center', color: '#64748b', marginTop: 60, fontSize: 15 },
});
