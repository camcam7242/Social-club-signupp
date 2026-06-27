import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { requestApi, mechanicApi } from '../../services/api';
import { useSocketStore } from '../../store/socketStore';
import { ServiceRequest, Quote } from '../../types';

const STATUS_COLOR: Record<string, string> = {
  open: '#f59e0b', quoted: '#3b82f6', accepted: '#8b5cf6',
  in_progress: '#f97316', completed: '#10b981', cancelled: '#6b7280',
};

export default function RequestDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const { socket, joinRequest } = useSocketStore();
  const [newQuoteAlert, setNewQuoteAlert] = useState(false);

  const { data: request, isLoading, refetch } = useQuery<ServiceRequest>({
    queryKey: ['request', id],
    queryFn: async () => (await requestApi.get(id)).data,
    refetchInterval: 30_000,
  });

  useEffect(() => {
    if (!id) return;
    joinRequest(id);
  }, [id]);

  useEffect(() => {
    if (!socket) return;
    const onNewQuote = () => {
      setNewQuoteAlert(true);
      qc.invalidateQueries({ queryKey: ['request', id] });
    };
    const onStatusUpdate = () => qc.invalidateQueries({ queryKey: ['request', id] });
    socket.on('new_quote', onNewQuote);
    socket.on('request_status_updated', onStatusUpdate);
    return () => {
      socket.off('new_quote', onNewQuote);
      socket.off('request_status_updated', onStatusUpdate);
    };
  }, [socket, id]);

  const acceptMutation = useMutation({
    mutationFn: (quoteId: string) => mechanicApi.acceptQuote(quoteId),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['request', id] });
      qc.invalidateQueries({ queryKey: ['requests'] });
      router.push(`/jobs/${data.data.id}`);
    },
    onError: (err: any) => Alert.alert('Error', err.response?.data?.error || 'Failed to accept quote'),
  });

  const cancelMutation = useMutation({
    mutationFn: () => requestApi.updateStatus(id, 'cancelled'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['requests'] });
      router.back();
    },
  });

  if (isLoading) return <ActivityIndicator style={{ flex: 1 }} />;
  if (!request) return <Text style={styles.empty}>Request not found.</Text>;

  const quotes: Quote[] = request.quotes || [];
  const canAccept = request.status === 'open' || request.status === 'quoted';
  const canCancel = request.status === 'open' || request.status === 'quoted';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: 16 }}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
    >
      {newQuoteAlert && (
        <TouchableOpacity style={styles.newQuoteBanner} onPress={() => setNewQuoteAlert(false)}>
          <Text style={styles.newQuoteText}>New quote received! Tap to dismiss.</Text>
        </TouchableOpacity>
      )}

      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.serviceType}>{request.service_type}</Text>
          <View style={[styles.badge, { backgroundColor: (STATUS_COLOR[request.status] || '#6b7280') + '20' }]}>
            <Text style={[styles.badgeText, { color: STATUS_COLOR[request.status] || '#6b7280' }]}>
              {request.status.replace('_', ' ')}
            </Text>
          </View>
        </View>
        <Text style={styles.vehicle}>{request.year} {request.make} {request.model}</Text>
        <Text style={styles.description}>{request.description}</Text>
        {request.location_address && (
          <Text style={styles.location}>📍 {request.location_address}</Text>
        )}
      </View>

      <Text style={styles.sectionTitle}>
        Quotes ({quotes.filter(q => q.status === 'pending').length} pending)
      </Text>

      {quotes.length === 0 && (
        <View style={styles.emptyQuotes}>
          <Text style={styles.emptyQuotesText}>Waiting for mechanics to send quotes...</Text>
          <ActivityIndicator style={{ marginTop: 12 }} color="#1a56db" />
        </View>
      )}

      {quotes.map((q, idx) => {
        const isPending = q.status === 'pending';
        const rating = (q as any).mechanic_rating;
        const distance = (q as any).mechanic_distance_km;
        const mechanicName = (q as any).mechanic_name || 'Mechanic';
        return (
          <View key={q.id} style={[styles.quoteCard, !isPending && styles.quoteCardDim]}>
            {/* Rank badge */}
            {isPending && idx === 0 && (
              <View style={styles.bestBadge}><Text style={styles.bestBadgeText}>⭐ Best Match</Text></View>
            )}
            <View style={styles.quoteTopRow}>
              <View>
                <Text style={styles.mechanicName}>{mechanicName}</Text>
                <View style={styles.metaRow}>
                  {rating != null && (
                    <Text style={styles.metaText}>★ {parseFloat(rating).toFixed(1)}</Text>
                  )}
                  {distance != null && (
                    <Text style={styles.metaText}>  {parseFloat(distance).toFixed(1)} km away</Text>
                  )}
                </View>
              </View>
              <View style={styles.priceBlock}>
                <Text style={styles.quotePrice}>${parseFloat(q.price as any).toFixed(2)}</Text>
                {q.estimated_duration_hours && (
                  <Text style={styles.quoteDuration}>~{q.estimated_duration_hours}h</Text>
                )}
              </View>
            </View>

            {q.notes && <Text style={styles.quoteNotes}>{q.notes}</Text>}

            {!isPending && (
              <Text style={styles.quoteStatus}>{q.status.charAt(0).toUpperCase() + q.status.slice(1)}</Text>
            )}

            {isPending && (
              <Text style={styles.quoteExpiry}>
                Offer expires {new Date(q.expires_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            )}

            {canAccept && isPending && (
              <TouchableOpacity
                style={styles.acceptBtn}
                onPress={() => Alert.alert(
                  'Accept Quote',
                  `Book ${mechanicName} for $${parseFloat(q.price as any).toFixed(2)}?`,
                  [
                    { text: 'Cancel' },
                    { text: 'Accept', onPress: () => acceptMutation.mutate(q.id) },
                  ]
                )}
                disabled={acceptMutation.isPending}
              >
                {acceptMutation.isPending
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.acceptBtnText}>Book This Mechanic  →</Text>
                }
              </TouchableOpacity>
            )}
          </View>
        );
      })}

      {canCancel && (
        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={() => Alert.alert('Cancel Request', 'Are you sure?', [
            { text: 'No' },
            { text: 'Yes, Cancel', style: 'destructive', onPress: () => cancelMutation.mutate() },
          ])}
        >
          <Text style={styles.cancelBtnText}>Cancel Request</Text>
        </TouchableOpacity>
      )}

      {(request.status === 'accepted' || request.status === 'in_progress' || request.status === 'completed') && (request as any).job_id && (
        <TouchableOpacity
          style={styles.trackBtn}
          onPress={() => router.push(`/jobs/${(request as any).job_id}`)}
        >
          <Text style={styles.trackBtnText}>🔍 Track Job Status</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  serviceType: { fontSize: 20, fontWeight: '700', color: '#111' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
  vehicle: { fontSize: 14, color: '#6b7280', marginBottom: 8 },
  description: { fontSize: 15, color: '#374151', marginBottom: 8 },
  location: { fontSize: 13, color: '#6b7280' },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#111', marginBottom: 12 },
  emptyQuotes: { backgroundColor: '#fff', borderRadius: 12, padding: 24, alignItems: 'center', marginBottom: 12 },
  emptyQuotesText: { color: '#6b7280', fontSize: 14 },
  quoteCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 3,
    borderWidth: 1, borderColor: '#f3f4f6',
  },
  quoteCardDim: { opacity: 0.55 },
  quoteTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  mechanicName: { fontSize: 16, fontWeight: '700', color: '#111', marginBottom: 4 },
  metaRow: { flexDirection: 'row', gap: 4 },
  metaText: { fontSize: 13, color: '#6b7280' },
  priceBlock: { alignItems: 'flex-end' },
  quotePrice: { fontSize: 26, fontWeight: '800', color: '#1a56db' },
  quoteStatus: { fontSize: 13, color: '#9ca3af', fontWeight: '500', marginTop: 6 },
  quoteDuration: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  quoteNotes: { fontSize: 14, color: '#374151', marginBottom: 8, lineHeight: 20 },
  quoteExpiry: { fontSize: 11, color: '#9ca3af', marginBottom: 8 },
  acceptBtn: { backgroundColor: '#1a56db', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 4 },
  acceptBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  bestBadge: { backgroundColor: '#fef3c7', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start', marginBottom: 10 },
  bestBadgeText: { fontSize: 12, fontWeight: '700', color: '#92400e' },
  cancelBtn: { borderWidth: 1.5, borderColor: '#ef4444', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 8 },
  cancelBtnText: { color: '#ef4444', fontWeight: '600' },
  trackBtn: { backgroundColor: '#10b981', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 8 },
  trackBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  newQuoteBanner: { backgroundColor: '#1a56db', borderRadius: 10, padding: 12, marginBottom: 12, alignItems: 'center' },
  newQuoteText: { color: '#fff', fontWeight: '600' },
  empty: { textAlign: 'center', marginTop: 60, color: '#9ca3af', fontSize: 15 },
});
