import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/types';
import { TopBar } from '@/components/TopBar';
import { PrimaryBtn } from '@/components/PrimaryBtn';
import { colors, typography, spacing, radius } from '@/theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'CancellationPolicy'>;

const TIERS = [
  { time: '24+ hours before', refund: '100%', detail: 'Full refund, no questions asked', color: colors.success },
  { time: '12–24 hours before', refund: '50%', detail: '$90 refunded · $90 retained', color: colors.warning },
  { time: 'Under 12 hours', refund: '0%', detail: 'No refund — pro time is reserved', color: colors.danger },
];

export function CancellationPolicyScreen({ navigation }: Props) {
  const [agreed, setAgreed] = useState(false);

  return (
    <SafeAreaView style={styles.safe}>
      <TopBar title="Cancellation policy" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Review before you pay</Text>

        <View style={styles.holdCard}>
          <Text style={styles.holdLabel}>HOLD AMOUNT</Text>
          <Text style={styles.holdAmount}>$180.00</Text>
          <Text style={styles.holdSub}>Your card is authorized now and charged after your appointment.</Text>
        </View>

        <View style={styles.tiersSection}>
          <Text style={styles.tiersTitle}>Cancellation refund policy</Text>
          {TIERS.map((tier, i) => (
            <View key={i} style={styles.tierRow}>
              <View style={[styles.tierDot, { backgroundColor: tier.color }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.tierTime}>{tier.time}</Text>
                <Text style={styles.tierDetail}>{tier.detail}</Text>
              </View>
              <Text style={[styles.tierRefund, { color: tier.color }]}>{tier.refund}</Text>
            </View>
          ))}
        </View>

        <View style={styles.rescheduleNote}>
          <Text style={styles.rescheduleText}>🔄 Rescheduling is always free, any time before the appointment.</Text>
        </View>

        <TouchableOpacity style={styles.checkRow} onPress={() => setAgreed(v => !v)}>
          <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
            {agreed && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.checkLabel}>I understand and agree to this cancellation policy</Text>
        </TouchableOpacity>

        <PrimaryBtn label="Agree & hold $180" onPress={() => navigation.navigate('ConfirmBooking')} disabled={!agreed} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  scroll: { paddingHorizontal: spacing.screenH, paddingTop: 8, paddingBottom: 40, gap: 20 },
  title: { ...typography.sectionH, color: colors.ink },
  holdCard: { padding: 20, borderRadius: radius.card, backgroundColor: colors.blueSoft, gap: 4 },
  holdLabel: { ...typography.labelUpper, color: colors.blue, textTransform: 'uppercase' },
  holdAmount: { fontSize: 36, fontWeight: '800', color: colors.blue, letterSpacing: -1 },
  holdSub: { ...typography.body, color: colors.body, lineHeight: 20 },
  tiersSection: { gap: 12 },
  tiersTitle: { fontSize: 16, fontWeight: '700', color: colors.ink },
  tierRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: radius.card, backgroundColor: colors.field },
  tierDot: { width: 10, height: 10, borderRadius: 5 },
  tierTime: { ...typography.bodyMed, color: colors.ink },
  tierDetail: { ...typography.caption, color: colors.muted, marginTop: 2 },
  tierRefund: { fontSize: 18, fontWeight: '800' },
  rescheduleNote: { padding: 14, borderRadius: radius.card, backgroundColor: colors.successTint },
  rescheduleText: { ...typography.body, color: colors.successDeep, lineHeight: 20 },
  checkRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: colors.line, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  checkboxChecked: { backgroundColor: colors.blue, borderColor: colors.blue },
  checkmark: { color: colors.white, fontWeight: '700', fontSize: 13 },
  checkLabel: { flex: 1, ...typography.body, color: colors.body, lineHeight: 20 },
});
