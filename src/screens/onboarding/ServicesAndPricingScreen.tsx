import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/types';
import { TopBar } from '@/components/TopBar';
import { PrimaryBtn } from '@/components/PrimaryBtn';
import { colors, typography, spacing, radius, shadows } from '@/theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'ServicesAndPricing'>;

const DURATIONS = ['30 min', '45 min', '60 min', '90 min'];

interface Service { id: string; name: string; duration: string; price: string; }

export function ServicesAndPricingScreen({ navigation }: Props) {
  const [services, setServices] = useState<Service[]>([]);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [duration, setDuration] = useState('60 min');
  const [price, setPrice] = useState('');

  function addService() {
    if (!name || !price) return;
    setServices(prev => [...prev, { id: Date.now().toString(), name, duration, price }]);
    setName(''); setPrice(''); setAdding(false);
  }

  function removeService(id: string) {
    setServices(prev => prev.filter(s => s.id !== id));
  }

  return (
    <SafeAreaView style={styles.safe}>
      <TopBar title="Services & pricing" onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>What services do you offer?</Text>

          {services.map(s => (
            <View key={s.id} style={styles.serviceCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.serviceName}>{s.name}</Text>
                <Text style={styles.serviceMeta}>{s.duration} · ${s.price}</Text>
              </View>
              <TouchableOpacity onPress={() => removeService(s.id)} hitSlop={8}>
                <Text style={styles.removeBtn}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}

          {adding ? (
            <View style={styles.addForm}>
              <Text style={styles.formLabel}>Service name</Text>
              <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="e.g. Box Braids" placeholderTextColor={colors.muted} />
              <Text style={styles.formLabel}>Duration</Text>
              <View style={styles.durationRow}>
                {DURATIONS.map(d => (
                  <TouchableOpacity key={d} style={[styles.durationChip, duration === d && styles.durationSelected]} onPress={() => setDuration(d)}>
                    <Text style={[styles.durationText, duration === d && styles.durationTextSelected]}>{d}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.formLabel}>Price ($)</Text>
              <TextInput style={styles.input} value={price} onChangeText={setPrice} placeholder="e.g. 150" placeholderTextColor={colors.muted} keyboardType="numeric" />
              <View style={styles.formActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setAdding(false)}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.saveBtn, (!name || !price) && { opacity: 0.4 }]} onPress={addService} disabled={!name || !price}>
                  <Text style={styles.saveText}>Add service</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity style={styles.addBtn} onPress={() => setAdding(true)}>
              <Text style={styles.addBtnText}>+ Add a service</Text>
            </TouchableOpacity>
          )}

          <PrimaryBtn label="Continue" onPress={() => navigation.navigate('Availability')} disabled={services.length === 0} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  scroll: { paddingHorizontal: spacing.screenH, paddingTop: 8, paddingBottom: 40, gap: 16 },
  title: { ...typography.sectionH, color: colors.ink, marginBottom: 4 },
  serviceCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: radius.card, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, ...shadows.card },
  serviceName: { ...typography.bodyMed, color: colors.ink },
  serviceMeta: { ...typography.caption, color: colors.muted, marginTop: 2 },
  removeBtn: { fontSize: 16, color: colors.muted, padding: 4 },
  addForm: { padding: 18, borderRadius: radius.card, backgroundColor: colors.field, gap: 10 },
  formLabel: { ...typography.label, color: colors.body },
  input: { height: 48, borderRadius: radius.input, backgroundColor: colors.white, paddingHorizontal: 14, ...typography.body, color: colors.ink, borderWidth: 1, borderColor: colors.line },
  durationRow: { flexDirection: 'row', gap: 8 },
  durationChip: { flex: 1, paddingVertical: 10, borderRadius: radius.pill, backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.line, alignItems: 'center' },
  durationSelected: { backgroundColor: colors.blueSoft, borderColor: colors.blue },
  durationText: { ...typography.label, color: colors.body },
  durationTextSelected: { color: colors.blue },
  formActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  cancelBtn: { flex: 1, height: 44, borderRadius: radius.btn, borderWidth: 1.5, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  cancelText: { ...typography.bodyMed, color: colors.muted },
  saveBtn: { flex: 1, height: 44, borderRadius: radius.btn, backgroundColor: colors.blue, alignItems: 'center', justifyContent: 'center' },
  saveText: { ...typography.bodyMed, color: colors.white },
  addBtn: { height: 52, borderRadius: radius.card, borderWidth: 1.5, borderColor: colors.blue, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  addBtnText: { ...typography.bodyMed, color: colors.blue },
});
