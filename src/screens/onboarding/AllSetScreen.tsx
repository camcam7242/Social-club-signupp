import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/types';
import { PrimaryBtn } from '@/components/PrimaryBtn';
import { colors, typography, spacing } from '@/theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'ProAllSet'>;

export function AllSetScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.hero}>
          <Text style={styles.emoji}>🎉</Text>
          <Text style={styles.title}>You're all set!</Text>
          <Text style={styles.sub}>
            Your Glamr profile is live. Clients can now discover and book you.
          </Text>
        </View>
        <PrimaryBtn label="Go to my dashboard" onPress={() => navigation.navigate('ProHome')} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  container: { flex: 1, paddingHorizontal: spacing.screenH, paddingBottom: 40, justifyContent: 'space-between' },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20 },
  emoji: { fontSize: 72 },
  title: { ...typography.heroH, color: colors.ink, textAlign: 'center' },
  sub: { ...typography.body, color: colors.muted, textAlign: 'center', lineHeight: 22 },
});
