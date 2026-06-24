import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/types';
import { colors, typography, spacing, radius, shadows } from '@/theme/tokens';
import { PrimaryBtn } from '@/components/PrimaryBtn';
import { saveRole } from '@/lib/auth';

type Props = NativeStackScreenProps<RootStackParamList, 'ChooseRole'>;

const ROLES = [
  { id: 'client' as const, emoji: '💅', title: "I'm a client", subtitle: 'Discover and book top beauty & wellness pros near you.' },
  { id: 'pro' as const, emoji: '✂️', title: "I'm a professional", subtitle: 'Manage bookings, set your schedule, and grow your clientele.' },
];

export function ChooseRoleScreen({ navigation, route }: Props) {
  const { userId } = route.params;
  const [selected, setSelected] = useState<'pro' | 'client' | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleContinue() {
    if (!selected) return;
    setLoading(true);
    try {
      await saveRole(userId, selected);
      if (selected === 'pro') navigation.navigate('Specialty');
      else navigation.navigate('ClientHome');
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Could not save your role. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>How will you use Glamr?</Text>
          <Text style={styles.sub}>Choose your account type.</Text>
        </View>
        <View style={styles.cards}>
          {ROLES.map(r => (
            <TouchableOpacity key={r.id} style={[styles.card, selected === r.id && styles.cardSelected]} onPress={() => setSelected(r.id)} activeOpacity={0.85}>
              <View style={styles.cardTop}>
                <Text style={styles.cardEmoji}>{r.emoji}</Text>
                {selected === r.id && <View style={styles.checkCircle}><Text style={styles.checkMark}>✓</Text></View>}
              </View>
              <Text style={[styles.cardTitle, selected === r.id && styles.cardTitleSelected]}>{r.title}</Text>
              <Text style={styles.cardSub}>{r.subtitle}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <PrimaryBtn label="Continue" onPress={handleContinue} disabled={!selected} loading={loading} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  container: { flex: 1, paddingHorizontal: spacing.screenH, paddingTop: 32, paddingBottom: 40, gap: 32 },
  header: { gap: 8 },
  title: { ...typography.sectionH, color: colors.ink },
  sub: { ...typography.body, color: colors.muted },
  cards: { gap: 16 },
  card: { padding: 24, borderRadius: radius.card, backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.line, gap: 8, ...shadows.card },
  cardSelected: { borderColor: colors.blue, backgroundColor: colors.blueSoft },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardEmoji: { fontSize: 36 },
  checkCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.blue, alignItems: 'center', justifyContent: 'center' },
  checkMark: { color: colors.white, fontSize: 14, fontWeight: '700' },
  cardTitle: { ...typography.bodyMed, fontSize: 18, color: colors.ink, fontWeight: '700' },
  cardTitleSelected: { color: colors.blue },
  cardSub: { ...typography.body, color: colors.muted, lineHeight: 20 },
});
