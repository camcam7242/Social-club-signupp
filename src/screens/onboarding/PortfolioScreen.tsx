import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/types';
import { TopBar } from '@/components/TopBar';
import { PrimaryBtn } from '@/components/PrimaryBtn';
import { colors, typography, spacing, radius } from '@/theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'Portfolio'>;

const SLOT_SIZE = (Dimensions.get('window').width - spacing.screenH * 2 - 8) / 3;
const ACCENT = [colors.blue, colors.avatarPurple, colors.avatarTeal, colors.avatarOrange, colors.avatarPink, '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export function PortfolioScreen({ navigation }: Props) {
  const [photos, setPhotos] = useState<number[]>([]);

  function addPhoto(idx: number) {
    if (photos.includes(idx)) {
      setPhotos(prev => prev.filter(i => i !== idx));
    } else {
      setPhotos(prev => [...prev, idx]);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <TopBar title="Portfolio" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Show off your work</Text>
        <View style={styles.hint}>
          <Text style={styles.hintText}>📸 Pros with 3+ photos get booked 2× more</Text>
        </View>
        <View style={styles.grid}>
          {Array.from({ length: 9 }).map((_, i) => {
            const filled = photos.includes(i);
            return (
              <TouchableOpacity key={i} style={[styles.slot, filled && { backgroundColor: ACCENT[i] }]} onPress={() => addPhoto(i)}>
                {filled ? (
                  <Text style={styles.checkmark}>✓</Text>
                ) : (
                  <Text style={styles.plus}>+</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
        <Text style={styles.count}>{photos.length} of 9 photos added</Text>
        <PrimaryBtn label="Continue" onPress={() => navigation.navigate('ConnectPayouts')} disabled={photos.length < 1} />
        {photos.length === 0 && (
          <TouchableOpacity onPress={() => navigation.navigate('ConnectPayouts')}>
            <Text style={styles.skip}>Skip for now</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  scroll: { paddingHorizontal: spacing.screenH, paddingTop: 8, paddingBottom: 40, gap: 20 },
  title: { ...typography.sectionH, color: colors.ink },
  hint: { padding: 14, borderRadius: radius.card, backgroundColor: colors.blueSoft },
  hintText: { ...typography.body, color: colors.blue },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  slot: { width: SLOT_SIZE, height: SLOT_SIZE, borderRadius: radius.input, backgroundColor: colors.field, borderWidth: 1.5, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  plus: { fontSize: 28, color: colors.muted },
  checkmark: { fontSize: 28, color: colors.white },
  count: { ...typography.body, color: colors.muted, textAlign: 'center' },
  skip: { ...typography.body, color: colors.muted, textAlign: 'center', textDecorationLine: 'underline' },
});
