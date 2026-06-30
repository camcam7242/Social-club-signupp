import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { mechanicApi } from '../../services/api';

interface EarningsData {
  this_month: number;
  total: number;
  job_count: number;
  weekly: { week_start: string; amount: number }[];
  by_service: { service_type: string; count: number; revenue: number }[];
}

export default function EarningsScreen() {
  const { data, isLoading } = useQuery<EarningsData>({
    queryKey: ['mechanic-earnings'],
    queryFn: async () => (await mechanicApi.earnings()).data,
  });

  if (isLoading) return <ActivityIndicator style={{ flex: 1 }} />;
  if (!data) return null;

  const weekly = data.weekly || [];
  const maxWeekly = Math.max(...weekly.map((w) => w.amount), 1);
  const bestWeek = weekly.reduce((a, b) => (b.amount > a.amount ? b : a), weekly[0] || { week_start: '', amount: 0 });
  const totalServiceRevenue = data.by_service?.reduce((s, b) => s + b.revenue, 0) || 1;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      {/* Header stats */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, styles.statCardPrimary]}>
          <Text style={styles.statLabelLight}>This Month</Text>
          <Text style={styles.statValueLarge}>${(data.this_month || 0).toFixed(2)}</Text>
        </View>
        <View style={styles.statsCol}>
          <View style={styles.statCardSmall}>
            <Text style={styles.statLabel}>All Time</Text>
            <Text style={styles.statValue}>${(data.total || 0).toFixed(2)}</Text>
          </View>
          <View style={[styles.statCardSmall, { marginTop: 8 }]}>
            <Text style={styles.statLabel}>Jobs Done</Text>
            <Text style={styles.statValue}>{data.job_count || 0}</Text>
          </View>
        </View>
      </View>

      {/* Best week callout */}
      {bestWeek && bestWeek.amount > 0 && (
        <View style={styles.bestWeekCard}>
          <Text style={styles.bestWeekLabel}>🏆 Best Week</Text>
          <Text style={styles.bestWeekValue}>${bestWeek.amount.toFixed(2)}</Text>
          <Text style={styles.bestWeekDate}>
            Week of {new Date(bestWeek.week_start).toLocaleDateString([], { month: 'short', day: 'numeric' })}
          </Text>
        </View>
      )}

      {/* Weekly bar chart */}
      {weekly.length > 0 && (
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Last 8 Weeks</Text>
          <View style={styles.chart}>
            {weekly.slice(-8).map((w, i) => {
              const pct = maxWeekly > 0 ? (w.amount / maxWeekly) : 0;
              const isMax = w.amount === bestWeek.amount && bestWeek.amount > 0;
              return (
                <View key={i} style={styles.barCol}>
                  <Text style={styles.barValue}>${w.amount > 0 ? w.amount.toFixed(0) : ''}</Text>
                  <View style={styles.barTrack}>
                    <View style={[
                      styles.barFill,
                      { height: `${Math.max(pct * 100, 2)}%` },
                      isMax && styles.barFillBest,
                    ]} />
                  </View>
                  <Text style={styles.barLabel}>
                    {new Date(w.week_start).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* Service breakdown */}
      {(data.by_service?.length || 0) > 0 && (
        <View style={styles.breakdownCard}>
          <Text style={styles.chartTitle}>By Service Type</Text>
          {data.by_service.map((s) => {
            const pct = totalServiceRevenue > 0 ? s.revenue / totalServiceRevenue : 0;
            return (
              <View key={s.service_type} style={styles.serviceRow}>
                <View style={styles.serviceHeader}>
                  <Text style={styles.serviceType}>{s.service_type}</Text>
                  <Text style={styles.serviceRevenue}>${s.revenue.toFixed(0)} · {s.count} jobs</Text>
                </View>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${pct * 100}%` }]} />
                </View>
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  statCard: {
    flex: 1.4, backgroundColor: '#1a56db', borderRadius: 16, padding: 20, justifyContent: 'center',
  },
  statCardPrimary: {},
  statsCol: { flex: 1 },
  statCardSmall: {
    flex: 1, backgroundColor: '#0f172a', borderRadius: 12, padding: 14,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  statLabelLight: { fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: '500', marginBottom: 4 },
  statValueLarge: { fontSize: 28, fontWeight: '800', color: '#fff' },
  statLabel: { fontSize: 11, color: '#64748b', fontWeight: '500', marginBottom: 4 },
  statValue: { fontSize: 20, fontWeight: '700', color: '#f1f5f9' },
  bestWeekCard: {
    backgroundColor: '#fffbeb', borderRadius: 14, padding: 16,
    flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12,
  },
  bestWeekLabel: { fontSize: 14, fontWeight: '700', color: '#fcd34d' },
  bestWeekValue: { fontSize: 22, fontWeight: '800', color: '#f1f5f9', flex: 1 },
  bestWeekDate: { fontSize: 12, color: '#64748b' },
  chartCard: {
    backgroundColor: '#0f172a', borderRadius: 16, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  chartTitle: { fontSize: 15, fontWeight: '700', color: '#f1f5f9', marginBottom: 16 },
  chart: { flexDirection: 'row', height: 140, alignItems: 'flex-end', gap: 6 },
  barCol: { flex: 1, alignItems: 'center', height: '100%', justifyContent: 'flex-end' },
  barValue: { fontSize: 8, color: '#64748b', marginBottom: 2 },
  barTrack: { width: '100%', flex: 1, justifyContent: 'flex-end' },
  barFill: { backgroundColor: '#93c5fd', borderRadius: 4, width: '100%' },
  barFillBest: { backgroundColor: '#1a56db' },
  barLabel: { fontSize: 8, color: '#64748b', marginTop: 4, textAlign: 'center' },
  breakdownCard: {
    backgroundColor: '#0f172a', borderRadius: 16, padding: 16, marginBottom: 24,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  serviceRow: { marginBottom: 14 },
  serviceHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  serviceType: { fontSize: 13, fontWeight: '600', color: '#cbd5e1' },
  serviceRevenue: { fontSize: 12, color: '#64748b' },
  progressTrack: { height: 8, backgroundColor: '#0f172a', borderRadius: 4 },
  progressFill: { height: 8, backgroundColor: '#1a56db', borderRadius: 4 },
});
