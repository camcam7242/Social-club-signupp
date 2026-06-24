import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/types';
import { TopBar } from '@/components/TopBar';
import { PrimaryBtn } from '@/components/PrimaryBtn';
import { colors, typography, spacing, radius } from '@/theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'PickTime'>;

const DAYS = ['Today', 'Thu', 'Fri', 'Sat', 'Sun', 'Mon', 'Tue'];
const DATES = ['23', '24', '25', '26', '27', '28', '29'];
const SLOTS = ['9:00 AM','9:30 AM','10:00 AM','10:30 AM','11:00 AM','11:30 AM','1:00 PM','1:30 PM','2:00 PM','2:30 PM','3:00 PM','3:30 PM','4:00 PM','4:30 PM'];
const BOOKED = ['9:30 AM', '11:00 AM', '2:00 PM'];

export function PickTimeScreen({ navigation }: Props) {
  const [selectedDay, setSelectedDay] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState('');

  return (
    <SafeAreaView style={styles.safe}>
      <TopBar title="Pick a time" onBack={() => navigation.goBack()} />
      <View style={styles.container}>
        {/* Date strip */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateStrip} contentContainerStyle={styles.dateStripContent}>
          {DAYS.map((d, i) => (
            <TouchableOpacity key={i} style={[styles.dateCard, selectedDay === i && styles.dateCardSelected]} onPress={() => setSelectedDay(i)}>
              <Text style={[styles.dayLabel, selectedDay === i && styles.dayLabelSelected]}>{d}</Text>
              <Text style={[styles.dateNum, selectedDay === i && styles.dateNumSelected]}>{DATES[i]}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Time slots */}
        <ScrollView contentContainerStyle={styles.slotsGrid} showsVerticalScrollIndicator={false}>
          {SLOTS.map(slot => {
            const booked = BOOKED.includes(slot);
            const selected = selectedSlot === slot;
            return (
              <TouchableOpacity
                key={slot}
                style={[styles.slot, selected && styles.slotSelected, booked && styles.slotBooked]}
                onPress={() => !booked && setSelectedSlot(slot)}
                disabled={booked}
              >
                <Text style={[styles.slotText, selected && styles.slotTextSelected, booked && styles.slotTextBooked]}>{slot}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.footer}>
          <PrimaryBtn label="Continue" onPress={() => navigation.navigate('CancellationPolicy')} disabled={!selectedSlot} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  container: { flex: 1 },
  dateStrip: { flexGrow: 0, borderBottomWidth: 1, borderBottomColor: colors.line },
  dateStripContent: { paddingHorizontal: spacing.screenH, paddingVertical: 12, gap: 8 },
  dateCard: { width: 56, paddingVertical: 10, borderRadius: radius.card, alignItems: 'center', gap: 4 },
  dateCardSelected: { backgroundColor: colors.blue },
  dayLabel: { ...typography.caption, color: colors.muted },
  dayLabelSelected: { color: 'rgba(255,255,255,0.8)' },
  dateNum: { fontSize: 18, fontWeight: '700', color: colors.ink },
  dateNumSelected: { color: colors.white },
  slotsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: spacing.screenH, gap: 10 },
  slot: { width: '47%', paddingVertical: 14, borderRadius: radius.input, backgroundColor: colors.field, alignItems: 'center', borderWidth: 1.5, borderColor: colors.line },
  slotSelected: { backgroundColor: colors.blueSoft, borderColor: colors.blue },
  slotBooked: { opacity: 0.4 },
  slotText: { ...typography.bodyMed, color: colors.ink },
  slotTextSelected: { color: colors.blue },
  slotTextBooked: { textDecorationLine: 'line-through', color: colors.muted },
  footer: { padding: spacing.screenH, paddingBottom: 32, borderTopWidth: 1, borderTopColor: colors.line },
});
