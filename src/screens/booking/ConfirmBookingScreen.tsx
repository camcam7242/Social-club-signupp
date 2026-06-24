import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/types';
import { PrimaryBtn } from '@/components/PrimaryBtn';
import { colors, typography, spacing, radius, shadows } from '@/theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'ConfirmBooking'>;

export function ConfirmBookingScreen({ navigation }: Props) {
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);

  function confirm() {
    setLoading(true);
    setTimeout(() => { setLoading(false); setConfirmed(true); }, 1200);
  }

  if (confirmed) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.successContainer}>
          <Text style={styles.successEmoji}>🎉</Text>
          <Text style={styles.successTitle}>Booking requested!</Text>
          <Text style={styles.successSub}>Jordan B. has 24 hours to accept. You'll get a notification once confirmed.</Text>
          <View style={styles.holdInfo}>
            <Text style={styles.holdInfoText}>$180 hold placed on your card. Charged only after your appointment.</Text>
          </View>
          <PrimaryBtn label="Done" onPress={() => navigation.navigate('ClientHome')} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Confirm booking</Text>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryPro}>Jordan B. · Hair Stylist</Text>
          <View style={styles.divider} />
          <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Service</Text><Text style={styles.summaryValue}>Box Braids</Text></View>
          <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Date</Text><Text style={styles.summaryValue}>Thu, Jun 26</Text></View>
          <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Time</Text><Text style={styles.summaryValue}>10:00 AM</Text></View>
          <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Duration</Text><Text style={styles.summaryValue}>3 hours</Text></View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Authorization hold</Text>
            <Text style={[styles.summaryValue, { color: colors.blue, fontWeight: '700' }]}>$180.00</Text>
          </View>
        </View>

        <Text style={styles.disclaimer}>Your card is authorized for $180. The charge is captured after your appointment is complete.</Text>

        <PrimaryBtn label="Confirm & hold $180" onPress={confirm} loading={loading} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  container: { flex: 1, paddingHorizontal: spacing.screenH, paddingBottom: 40, paddingTop: 24, gap: 20 },
  title: { ...typography.sectionH, color: colors.ink },
  summaryCard: { padding: 20, borderRadius: radius.card, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, gap: 12, ...shadows.card },
  summaryPro: { fontSize: 18, fontWeight: '700', color: colors.ink },
  divider: { height: 1, backgroundColor: colors.line },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryLabel: { ...typography.body, color: colors.muted },
  summaryValue: { ...typography.bodyMed, color: colors.ink },
  disclaimer: { ...typography.caption, color: colors.muted, textAlign: 'center', lineHeight: 18 },
  successContainer: { flex: 1, paddingHorizontal: spacing.screenH, paddingBottom: 40, justifyContent: 'center', gap: 20 },
  successEmoji: { fontSize: 72, textAlign: 'center' },
  successTitle: { ...typography.heroH, color: colors.ink, textAlign: 'center' },
  successSub: { ...typography.body, color: colors.muted, textAlign: 'center', lineHeight: 22 },
  holdInfo: { padding: 16, borderRadius: radius.card, backgroundColor: colors.blueSoft },
  holdInfoText: { ...typography.body, color: colors.blue, textAlign: 'center' },
});
