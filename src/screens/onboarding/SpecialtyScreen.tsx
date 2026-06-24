import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/types';
import { TopBar } from '@/components/TopBar';
import { PrimaryBtn } from '@/components/PrimaryBtn';
import { Chip } from '@/components/Chip';
import { colors, typography, spacing } from '@/theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'Specialty'>;

const SPECIALTIES = [
  'Hair Stylist', 'Barber', 'Nail Tech', 'Esthetician',
  'Makeup Artist', 'Lash & Brow', 'Massage Therapist', 'Wellness Coach',
];

export function SpecialtyScreen({ navigation }: Props) {
  const [selected, setSelected] = useState<string[]>([]);

  function toggle(s: string) {
    setSelected(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <TopBar title="Your specialty" onBack={() => navigation.goBack()} />
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>What do you specialize in?</Text>
          <Text style={styles.sub}>Select all that apply. You can update this later.</Text>
        </View>
        <ScrollView contentContainerStyle={styles.chips} showsVerticalScrollIndicator={false}>
          {SPECIALTIES.map(s => (
            <Chip key={s} label={s} selected={selected.includes(s)} onPress={() => toggle(s)} />
          ))}
        </ScrollView>
        <PrimaryBtn label="Continue" onPress={() => navigation.navigate('BusinessDetails')} disabled={selected.length === 0} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  container: { flex: 1, paddingHorizontal: spacing.screenH, paddingBottom: 40, gap: 24 },
  header: { gap: 8, paddingTop: 8 },
  title: { ...typography.sectionH, color: colors.ink },
  sub: { ...typography.body, color: colors.muted },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingBottom: 16 },
});
