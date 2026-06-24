import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/types';
import { TopBar } from '@/components/TopBar';
import { PrimaryBtn } from '@/components/PrimaryBtn';
import { colors, typography, spacing, radius, shadows } from '@/theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'Membership'>;

const FEATURES = [
  '✓  Unlimited bookings',
  '✓  Client messaging',
  '✓  Earnings dashboard',
  '✓  No-show protection',
  '✓  Loyalty program tools',
  '✓  Priority discovery placement',
];

export function MembershipScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.safe}>
      <TopBar title="Membership" onBack={() => navigation.goBack()} />
      <View style={styles.container}>
        <View style={styles.planCard}>
          <View style={styles.planBadge}><Text style={styles.planBadgeText}>FREE TRIAL</Text></View>
          <Text style={styles.planPrice}>$0</Text>
          <Text style={styles.planSub}>for 30 days, then $10/mo</Text>
          <Text style={styles.planCancel}>Cancel anytime</Text>
        </View>

        <View style={styles.features}>
          {FEATURES.map((f, i) => (
            <Text key={i} style={styles.featureText}>{f}</Text>
          ))}
        </View>

        <PrimaryBtn label="Start free trial" onPress={() => navigation.navigate('ProAllSet')} />
        <Text style={styles.legal}>You won't be charged until your trial ends. Cancel any time before then.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  container: { flex: 1, paddingHorizontal: spacing.screenH, paddingBottom: 40, gap: 24, paddingTop: 8 },
  planCard: { padding: 28, borderRadius: radius.large, backgroundColor: colors.blue, alignItems: 'center', gap: 6, ...shadows.btn },
  planBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 14, paddingVertical: 4, borderRadius: radius.pill },
  planBadgeText: { ...typography.labelUpper, color: colors.white, textTransform: 'uppercase' },
  planPrice: { fontSize: 52, fontWeight: '800', color: colors.white, letterSpacing: -2 },
  planSub: { ...typography.body, color: 'rgba(255,255,255,0.85)' },
  planCancel: { ...typography.caption, color: 'rgba(255,255,255,0.6)' },
  features: { gap: 12, paddingHorizontal: 4 },
  featureText: { ...typography.body, color: colors.body },
  legal: { ...typography.caption, color: colors.muted, textAlign: 'center', lineHeight: 18 },
});
