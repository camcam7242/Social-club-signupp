import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/types';
import { TopBar } from '@/components/TopBar';
import { colors, typography, spacing, radius, shadows } from '@/theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'AccountType'>;

function RoleCard({ title, subtitle, emoji, onPress }: { title: string; subtitle: string; emoji: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <Text style={styles.cardEmoji}>{emoji}</Text>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardSub}>{subtitle}</Text>
    </TouchableOpacity>
  );
}

export function AccountTypeScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.safe}>
      <TopBar onBack={() => navigation.goBack()} />
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>How will you use Glamr?</Text>
          <Text style={styles.sub}>Choose your account type to get started.</Text>
        </View>
        <View style={styles.cards}>
          <RoleCard
            emoji="✂️"
            title="I'm a professional"
            subtitle="Manage bookings, set your schedule, and grow your clientele."
            onPress={() => navigation.navigate('CreateAccount', { role: 'pro' })}
          />
          <RoleCard
            emoji="💅"
            title="I'm a client"
            subtitle="Discover and book top beauty & wellness pros near you."
            onPress={() => navigation.navigate('CreateAccount', { role: 'client' })}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  container: { flex: 1, paddingHorizontal: spacing.screenH, paddingTop: 8 },
  header: { marginBottom: 32, gap: 8 },
  title: { ...typography.sectionH, color: colors.ink },
  sub: { ...typography.body, color: colors.muted },
  cards: { gap: 16 },
  card: {
    padding: 24,
    borderRadius: radius.card,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.line,
    gap: 8,
    ...shadows.card,
  },
  cardEmoji: { fontSize: 36 },
  cardTitle: { ...typography.bodyMed, fontSize: 18, color: colors.ink, fontWeight: '700' },
  cardSub: { ...typography.body, color: colors.muted, lineHeight: 20 },
});
