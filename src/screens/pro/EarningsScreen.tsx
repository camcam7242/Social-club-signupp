import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/types';
import { TopBar } from '@/components/TopBar';
import { colors, typography, spacing, radius, shadows } from '@/theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'Earnings'>;

const WEEK_DATA = [120, 240, 80, 310, 180, 260, 95];
const WEEK_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const MAX_BAR = Math.max(...WEEK_DATA);
const BAR_MAX_H = 80;

const PAYOUTS = [
  { date: 'Jun 20', amount: '$380.00', status: 'Deposited' },
  { date: 'Jun 13', amount: '$290.50', status: 'Deposited' },
  { date: 'Jun 6', amount: '$172.00', status: 'Deposited' },
];

export function EarningsScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.safe}>
      <TopBar title="Earnings" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Balance card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>AVAILABLE BALANCE</Text>
          <Text style={styles.balanceAmt}>$842.50</Text>
          <TouchableOpacity style={styles.cashOutBtn}>
            <Text style={styles.cashOutText}>Cash out now</Text>
          </TouchableOpacity>
        </View>

        {/* Quick stats */}
        <View style={styles.statsRow}>
          {[{ label: 'This month', value: '$1,285' }, { label: 'Appointments', value: '14' }, { label: 'Avg per visit', value: '$91' }].map((s, i) => (
            <View key={i} style={styles.statCard}>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Bar chart */}
        <View style={styles.chartSection}>
          <Text style={styles.chartTitle}>This week</Text>
          <View style={styles.chart}>
            {WEEK_DATA.map((val, i) => (
              <View key={i} style={styles.barCol}>
                <View style={[styles.bar, { height: (val / MAX_BAR) * BAR_MAX_H, backgroundColor: i === 3 ? colors.blue : colors.blueSoft }]} />
                <Text style={styles.barLabel}>{WEEK_LABELS[i]}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Payout history */}
        <View style={styles.historySection}>
          <Text style={styles.historyTitle}>Payout history</Text>
          {PAYOUTS.map((p, i) => (
            <View key={i} style={styles.payoutRow}>
              <View>
                <Text style={styles.payoutDate}>{p.date}</Text>
                <Text style={styles.payoutStatus}>{p.status}</Text>
              </View>
              <Text style={styles.payoutAmt}>{p.amount}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  scroll: { paddingHorizontal: spacing.screenH, paddingBottom: 40, gap: 20, paddingTop: 8 },
  balanceCard: { padding: 24, borderRadius: radius.large, backgroundColor: colors.blue, gap: 8, ...shadows.btn },
  balanceLabel: { ...typography.labelUpper, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase' },
  balanceAmt: { fontSize: 44, fontWeight: '800', color: colors.white, letterSpacing: -2 },
  cashOutBtn: { alignSelf: 'flex-start', backgroundColor: colors.white, paddingHorizontal: 20, paddingVertical: 10, borderRadius: radius.pill },
  cashOutText: { ...typography.bodyMed, color: colors.blue },
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: { flex: 1, padding: 14, borderRadius: radius.card, backgroundColor: colors.field, gap: 4, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '800', color: colors.ink },
  statLabel: { ...typography.caption, color: colors.muted, textAlign: 'center' },
  chartSection: { gap: 12 },
  chartTitle: { fontSize: 17, fontWeight: '700', color: colors.ink },
  chart: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: BAR_MAX_H + 24 },
  barCol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 6 },
  bar: { width: '100%', borderRadius: 6 },
  barLabel: { ...typography.caption, color: colors.muted },
  historySection: { gap: 12 },
  historyTitle: { fontSize: 17, fontWeight: '700', color: colors.ink },
  payoutRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.line },
  payoutDate: { ...typography.bodyMed, color: colors.ink },
  payoutStatus: { ...typography.caption, color: colors.success, marginTop: 2 },
  payoutAmt: { fontSize: 17, fontWeight: '700', color: colors.ink },
});
