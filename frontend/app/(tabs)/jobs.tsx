import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { requestApi, mechanicApi } from '../../src/services/api';
import { ServiceRequest } from '../../src/types';

export default function MechanicJobsScreen() {
  const qc = useQueryClient();
  const { data: requests = [], isLoading, refetch } = useQuery<ServiceRequest[]>({
    queryKey: ['open-requests'],
    queryFn: async () => (await requestApi.list()).data,
  });

  const quoteMutation = useMutation({
    mutationFn: ({ requestId, price }: { requestId: string; price: number }) =>
      mechanicApi.submitQuote({ request_id: requestId, price, notes: 'I can help with this.' }),
    onSuccess: () => Alert.alert('Quote Sent', 'Your quote has been submitted.'),
    onError: (err: any) => Alert.alert('Error', err.response?.data?.error || 'Failed to submit quote'),
  });

  const renderItem = ({ item }: { item: ServiceRequest }) => (
    <View style={styles.card}>
      <Text style={styles.serviceType}>{item.service_type}</Text>
      <Text style={styles.vehicle}>{item.year} {item.make} {item.model}</Text>
      <Text style={styles.desc} numberOfLines={2}>{item.description}</Text>
      <TouchableOpacity
        style={styles.quoteBtn}
        onPress={() => Alert.prompt('Send Quote', 'Enter your price ($)', (price) => {
          if (!price || isNaN(Number(price))) return;
          quoteMutation.mutate({ requestId: item.id, price: parseFloat(price) });
        })}
      >
        <Text style={styles.quoteBtnText}>Send Quote</Text>
      </TouchableOpacity>
    </View>
  );

  if (isLoading) return <ActivityIndicator style={{ flex: 1 }} />;

  return (
    <FlatList
      data={requests}
      keyExtractor={(r) => r.id}
      renderItem={renderItem}
      onRefresh={refetch}
      refreshing={isLoading}
      contentContainerStyle={{ padding: 16, backgroundColor: '#f9fafb', flexGrow: 1 }}
      ListEmptyComponent={<Text style={styles.empty}>No open jobs available.</Text>}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  serviceType: { fontSize: 16, fontWeight: '700', color: '#111', marginBottom: 4 },
  vehicle: { fontSize: 13, color: '#6b7280', marginBottom: 6 },
  desc: { fontSize: 14, color: '#374151', marginBottom: 12 },
  quoteBtn: { backgroundColor: '#1a56db', borderRadius: 8, padding: 12, alignItems: 'center' },
  quoteBtnText: { color: '#fff', fontWeight: '600' },
  empty: { textAlign: 'center', color: '#9ca3af', marginTop: 60, fontSize: 15 },
});
