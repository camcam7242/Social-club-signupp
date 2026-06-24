import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/types';
import { TopBar } from '@/components/TopBar';
import { PrimaryBtn } from '@/components/PrimaryBtn';
import { colors, typography, spacing, radius } from '@/theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'Availability'>;

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const TIMES = ['8:00 AM','9:00 AM','10:00 AM','11:00 AM','12:00 PM','1:00 PM','2:00 PM','3:00 PM','4:00 PM','5:00 PM','6:00 PM','7:00 PM','8:00 PM'];

interface DayConfig { enabled: boolean; start: string; end: string; }

export function AvailabilityScreen({ navigation }: Props) {
  const [schedule, setSchedule] = useState<Record<string, DayConfig>>({
    Mon: { enabled: true, start: '9:00 AM', end: '6:00 PM' },
    Tue: { enabled: true, start: '9:00 AM', end: '6:00 PM' },
    Wed: { enabled: true, start: '9:00 AM', end: '6:00 PM' },
    Thu: { enabled: true, start: '9:00 AM', end: '6:00 PM' },
    Fri: { enabled: true, start: '9:00 AM', end: '6:00 PM' },
    Sat: { enabled: false, start: '10:00 AM', end: '4:00 PM' },
    Sun: { enabled: false, start: '10:00 AM', end: '4:00 PM' },
  });
  const [picking, setPicking] = useState<{ day: string; field: 'start' | 'end' } | null>(null);

  function toggleDay(day: string) {
    setSchedule(prev => ({ ...prev, [day]: { ...prev[day], enabled: !prev[day].enabled } }));
  }

  function pickTime(time: string) {
    if (!picking) return;
    setSchedule(prev => ({ ...prev, [picking.day]: { ...prev[picking.day], [picking.field]: time } }));
    setPicking(null);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <TopBar title="Availability" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Set your weekly hours</Text>
        {DAYS.map(day => {
          const cfg = schedule[day];
          return (
            <View key={day} style={styles.dayRow}>
              <View style={styles.dayLeft}>
                <Switch value={cfg.enabled} onValueChange={() => toggleDay(day)} trackColor={{ true: colors.blue }} thumbColor={colors.white} />
                <Text style={[styles.dayName, !cfg.enabled && styles.dayNameOff]}>{day}</Text>
              </View>
              {cfg.enabled ? (
                <View style={styles.timeRow}>
                  <TouchableOpacity style={styles.timePill} onPress={() => setPicking({ day, field: 'start' })}>
                    <Text style={styles.timeText}>{cfg.start}</Text>
                  </TouchableOpacity>
                  <Text style={styles.timeSep}>–</Text>
                  <TouchableOpacity style={styles.timePill} onPress={() => setPicking({ day, field: 'end' })}>
                    <Text style={styles.timeText}>{cfg.end}</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <Text style={styles.offText}>Closed</Text>
              )}
            </View>
          );
        })}

        {picking && (
          <View style={styles.timePicker}>
            <Text style={styles.timePickerTitle}>Select {picking.field === 'start' ? 'start' : 'end'} time — {picking.day}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 8 }}>
              {TIMES.map(t => (
                <TouchableOpacity key={t} style={[styles.timeOption, schedule[picking.day][picking.field] === t && styles.timeOptionSelected]} onPress={() => pickTime(t)}>
                  <Text style={[styles.timeOptionText, schedule[picking.day][picking.field] === t && styles.timeOptionTextSelected]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <PrimaryBtn label="Continue" onPress={() => navigation.navigate('Portfolio')} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  scroll: { paddingHorizontal: spacing.screenH, paddingTop: 8, paddingBottom: 40, gap: 4 },
  title: { ...typography.sectionH, color: colors.ink, marginBottom: 12 },
  dayRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.line },
  dayLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dayName: { ...typography.bodyMed, color: colors.ink, width: 36 },
  dayNameOff: { color: colors.muted },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  timePill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill, backgroundColor: colors.blueSoft },
  timeText: { ...typography.label, color: colors.blue },
  timeSep: { ...typography.body, color: colors.muted },
  offText: { ...typography.body, color: colors.muted },
  timePicker: { marginTop: 8, padding: 16, borderRadius: radius.card, backgroundColor: colors.field },
  timePickerTitle: { ...typography.label, color: colors.body, marginBottom: 4 },
  timeOption: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill, backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.line },
  timeOptionSelected: { backgroundColor: colors.blue, borderColor: colors.blue },
  timeOptionText: { ...typography.label, color: colors.body },
  timeOptionTextSelected: { color: colors.white },
});
