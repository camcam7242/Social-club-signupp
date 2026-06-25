
import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Linking, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/types';
import { TopBar } from '@/components/TopBar';
import { PrimaryBtn } from '@/components/PrimaryBtn';
import { colors, typography, spacing, radius, shadows } from '@/theme/tokens';
import { supabase } from '@/lib/supabase';

type Props = NativeStackScreenProps<RootStackParamList, 'ConnectPayouts'>;

const BULLETS = [
  '🔒 Bank-level encryption via Stripe',
  '💸 Deposits in 1–2 business days',
  '📊 Full payout history in the app',
  '💳 Supports checking & savings accounts',
];

export function ConnectPayoutsScreen({ navigation }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleConnect() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not signed in');

      const { data, error } = await supabase.functions.invoke('create-connect-account', {
        body: { user_id: user.id },
      });
      if (error) throw error;
      if (!data?.url) throw new Error('No onboarding URL returned');

      await Linking.openURL(data.url);
      navigation.navigate('Membership');
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Could not connect bank account. Please try again.');
    } finally {
      setLoading(false);
    }
  }

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

        <View style={styles.feeNote}>
          <Text style={styles.feeNoteText}>Glamr takes a 15% platform fee per booking. You keep 85%.</Text>
        </View>

        <View style={styles.actions}>
          <PrimaryBtn label="Connect bank account" onPress={handleConnect} loading={loading} />
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
  feeNote: { padding: 14, borderRadius: radius.card, backgroundColor: colors.successTint, borderWidth: 1, borderColor: colors.success },
  feeNoteText: { ...typography.caption, color: colors.successDeep, textAlign: 'center', lineHeight: 18 },
  actions: { gap: 16 },
  skip: { ...typography.body, color: colors.muted, textAlign: 'center', textDecorationLine: 'underline' },
});
