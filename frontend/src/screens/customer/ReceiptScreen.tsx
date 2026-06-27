import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Share,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { jobApi } from '../../services/api';

interface JobDetail {
  id: string;
  status: string;
  service_type: string;
  price: number;
  year: number;
  make: string;
  model: string;
  location_address?: string;
  created_at: string;
  mechanic_name?: string;
  mechanic_email?: string;
}

export default function ReceiptScreen() {
  const { jobId } = useLocalSearchParams<{ jobId: string }>();

  const { data: job, isLoading } = useQuery<JobDetail>({
    queryKey: ['job', jobId],
    queryFn: async () => (await jobApi.get(jobId)).data,
    enabled: !!jobId,
  });

  const handleShare = async () => {
    if (!job) return;
    try {
      await Share.share({
        message: `Receipt for ${job.service_type} — ${job.year} ${job.make} ${job.model}\nAmount: $${parseFloat(job.price as any).toFixed(2)}\nJob ID: ${job.id.slice(0, 8).toUpperCase()}\nDate: ${new Date(job.created_at).toLocaleDateString()}`,
        title: 'Job Receipt',
      });
    } catch {}
  };

  if (isLoading) return <ActivityIndicator style={{ flex: 1 }} />;
  if (!job) return <Text style={styles.empty}>Receipt not found.</Text>;

  const amount = parseFloat(job.price as any);
  const date = new Date(job.created_at);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 24, alignItems: 'center' }}>
      {/* Receipt card */}
      <View style={styles.receiptCard}>
        {/* Header */}
        <View style={styles.receiptHeader}>
          <Text style={styles.logo}>🔧</Text>
          <Text style={styles.companyName}>Mechanic Marketplace</Text>
          <Text style={styles.receiptLabel}>SERVICE RECEIPT</Text>
        </View>

        {/* Paid stamp */}
        <View style={styles.paidStamp}>
          <Text style={styles.paidText}>PAID</Text>
        </View>

        <View style={styles.divider} />

        {/* Details */}
        <View style={styles.detailsSection}>
          <Row label="Service" value={job.service_type} />
          <Row label="Vehicle" value={`${job.year} ${job.make} ${job.model}`} />
          {job.location_address && <Row label="Location" value={job.location_address} />}
          {job.mechanic_name && <Row label="Mechanic" value={job.mechanic_name} />}
          <Row label="Date" value={date.toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })} />
          <Row label="Job ID" value={`#${job.id.slice(0, 8).toUpperCase()}`} mono />
        </View>

        <View style={styles.divider} />

        {/* Total */}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total Paid</Text>
          <Text style={styles.totalAmount}>${amount.toFixed(2)}</Text>
        </View>

        {/* Perforated edge */}
        <View style={styles.perfRow}>
          {Array.from({ length: 18 }).map((_, i) => (
            <View key={i} style={styles.perfDot} />
          ))}
        </View>

        <Text style={styles.thankYou}>Thank you for your business!</Text>
      </View>

      <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
        <Text style={styles.shareBtnText}>Share Receipt</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, mono && styles.rowValueMono]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  receiptCard: {
    backgroundColor: '#fff', borderRadius: 16, width: '100%',
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12, elevation: 5,
    overflow: 'hidden',
  },
  receiptHeader: { alignItems: 'center', padding: 24, paddingBottom: 16, backgroundColor: '#0f172a' },
  logo: { fontSize: 36, marginBottom: 6 },
  companyName: { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 4 },
  receiptLabel: { fontSize: 11, color: 'rgba(255,255,255,0.5)', letterSpacing: 2 },
  paidStamp: {
    position: 'absolute', top: 20, right: 20,
    borderWidth: 3, borderColor: '#10b981', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 4, transform: [{ rotate: '-15deg' }],
  },
  paidText: { color: '#10b981', fontWeight: '800', fontSize: 18, letterSpacing: 2 },
  divider: { height: 1, backgroundColor: '#f3f4f6', marginHorizontal: 20 },
  detailsSection: { padding: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  rowLabel: { fontSize: 13, color: '#9ca3af', flex: 1 },
  rowValue: { fontSize: 13, color: '#374151', fontWeight: '500', flex: 2, textAlign: 'right' },
  rowValueMono: { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', color: '#111' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  totalLabel: { fontSize: 16, fontWeight: '700', color: '#111' },
  totalAmount: { fontSize: 28, fontWeight: '800', color: '#1a56db' },
  perfRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 8, marginTop: 4 },
  perfDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#f9fafb' },
  thankYou: { textAlign: 'center', fontSize: 13, color: '#9ca3af', padding: 16, paddingTop: 8 },
  shareBtn: {
    backgroundColor: '#1a56db', borderRadius: 14, padding: 16,
    alignItems: 'center', marginTop: 20, width: '100%',
  },
  shareBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  empty: { textAlign: 'center', marginTop: 60, color: '#9ca3af', fontSize: 15 },
});

const Platform = require('react-native').Platform;
