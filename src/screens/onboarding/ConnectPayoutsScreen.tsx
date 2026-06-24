import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/types';
import { TopBar } from '@/components/TopBar';
import { PrimaryBtn } from '@/components/PrimaryBtn';
import { colors, typography, spacing, radius, shadows } from '@/theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'ConnectPayouts'>;

const BULLETS = [
  '🔒 Bank-level encryption via Stripe',
  '💸 Deposits in 1–2 business days',
  '📊 Full payout history in the app',
  '💳 Supports checking & savings accounts',
];

export function ConnectPayoutsScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.safe}>
      <TopBar title="Connect payouts" onBack={() => navigation.goBack()} />
      <View style={styles.container}>
        <View style={styles.hero}>
          <View style={styles.iconCard}>
            <Text style={styles.icon}>🏦</Text>
          </View>
          <Text style={styles.title}>Get paid directly{'\n'}to your bank</Text>
          <Text style={styles.sub}>Connect your bank account through Stripe to receive client payments.</Text>
        </View>

        <View style={styles.bullets}>
          {BULLETS.map((b, i) => (
            <View key={i} style={styles.bulletRow}>
              <Text style={styles.bulletText}>{b}</Text>
            </View>
          ))}
        </View>

        <View style={styles.actions}>
          <PrimaryBtn label="Connect bank account" onPress={() => navigation.navigate('Membership')} />
          <TouchableOpacity onPress={() => navigation.navigate('Membership')}>
            <Text style={styles.skip}>Set up later</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  container: { flex: 1, paddingHorizontal: spacing.screenH, paddingBottom: 40, justifyContent: 'space-between', paddingTop: 8 },
  hero: { alignItems: 'center', gap: 14, paddingTop: 20 },
  iconCard: { width: 80, height: 80, borderRadius: 24, backgroundColor: colors.blueSoft, alignItems: 'center', justifyContent: 'center', ...shadows.card },
  icon: { fontSize: 40 },
  title: { ...typography.sectionH, color: colors.ink, textAlign: 'center' },
  sub: { ...typography.body, color: colors.muted, textAlign: 'center', lineHeight: 22 },
  bullets: { gap: 12 },
  bulletRow: { padding: 16, borderRadius: radius.card, backgroundColor: colors.field },
  bulletText: { ...typography.body, color: colors.body },
  actions: { gap: 16 },
  skip: { ...typography.body, color: colors.muted, textAlign: 'center', textDecorationLine: 'underline' },
});
