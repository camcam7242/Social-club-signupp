import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Linking, Alert,
} from 'react-native';
import { useMutation } from '@tanstack/react-query';
import { diagnosisApi } from '../../services/api';

interface Part { name: string; search_term: string; }
interface Diagnosis {
  likely_problem: string;
  confidence: number;
  severity: 'low' | 'medium' | 'high' | 'urgent';
  explanation: string;
  parts_needed: Part[];
  recommended_tier: 'basic' | 'certified' | 'master';
  safe_to_drive: boolean;
}

const SEV_COLOR: Record<string, string> = {
  low: '#10b981', medium: '#f59e0b', high: '#f97316', urgent: '#ef4444',
};
const TIER_LABEL: Record<string, string> = {
  basic: '🔧 Basic Technician', certified: '🏅 Certified Mechanic', master: '⭐ Master Technician',
};

export default function DiagnosisScreen() {
  const [symptoms, setSymptoms] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');

  const mutation = useMutation<Diagnosis, any, void>({
    mutationFn: async () => (await diagnosisApi.diagnose({ symptoms, make, model, year })).data,
    onError: (err) =>
      Alert.alert('Error', err?.response?.data?.error || 'Could not get a diagnosis.'),
  });

  const d = mutation.data;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>🔍 AI Diagnosis</Text>
      <Text style={styles.subtitle}>
        Describe what's wrong and get an instant likely diagnosis with a confidence score and the parts you'll need.
      </Text>

      <View style={styles.vehicleRow}>
        <TextInput style={[styles.input, styles.small]} placeholder="Year" placeholderTextColor="#64748b"
          value={year} onChangeText={setYear} keyboardType="number-pad" maxLength={4} />
        <TextInput style={[styles.input, styles.small]} placeholder="Make" placeholderTextColor="#64748b"
          value={make} onChangeText={setMake} />
        <TextInput style={[styles.input, styles.small]} placeholder="Model" placeholderTextColor="#64748b"
          value={model} onChangeText={setModel} />
      </View>

      <TextInput
        style={[styles.input, styles.textarea]}
        placeholder="e.g. Car shakes when braking and makes a grinding noise..."
        placeholderTextColor="#64748b"
        value={symptoms}
        onChangeText={setSymptoms}
        multiline
        maxLength={2000}
      />

      <TouchableOpacity
        style={[styles.btn, (!symptoms.trim() || mutation.isPending) && styles.btnDisabled]}
        onPress={() => mutation.mutate()}
        disabled={!symptoms.trim() || mutation.isPending}
      >
        {mutation.isPending
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.btnText}>Diagnose</Text>}
      </TouchableOpacity>

      {d && (
        <View style={styles.result}>
          <View style={styles.resultHeader}>
            <Text style={styles.problem}>{d.likely_problem}</Text>
            <View style={[styles.sevBadge, { backgroundColor: SEV_COLOR[d.severity] }]}>
              <Text style={styles.sevText}>{d.severity.toUpperCase()}</Text>
            </View>
          </View>

          <View style={styles.confRow}>
            <Text style={styles.confLabel}>Confidence</Text>
            <View style={styles.confBarBg}>
              <View style={[styles.confBarFill, { width: `${d.confidence}%`,
                backgroundColor: d.confidence >= 70 ? '#10b981' : d.confidence >= 40 ? '#f59e0b' : '#ef4444' }]} />
            </View>
            <Text style={styles.confPct}>{d.confidence}%</Text>
          </View>

          <Text style={styles.explanation}>{d.explanation}</Text>

          <View style={styles.metaRow}>
            <Text style={styles.metaChip}>{TIER_LABEL[d.recommended_tier]}</Text>
            <Text style={[styles.metaChip, { color: d.safe_to_drive ? '#10b981' : '#ef4444' }]}>
              {d.safe_to_drive ? '✅ Safe to drive' : '⛔ Do not drive'}
            </Text>
          </View>

          {d.parts_needed.length > 0 && (
            <>
              <Text style={styles.partsTitle}>Parts you may need</Text>
              {d.parts_needed.map((p, i) => (
                <View key={i} style={styles.partRow}>
                  <Text style={styles.partName}>{p.name}</Text>
                  <TouchableOpacity
                    onPress={() => Linking.openURL(
                      `https://www.amazon.com/s?k=${encodeURIComponent(p.search_term)}+auto+parts`)}
                  >
                    <Text style={styles.partLink}>Find →</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </>
          )}

          <Text style={styles.disclaimer}>
            This is an AI estimate, not a guaranteed diagnosis. A mechanic will confirm the actual issue.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  content: { padding: 20, paddingBottom: 48 },
  title: { fontSize: 24, fontWeight: '800', color: '#f1f5f9', marginBottom: 6 },
  subtitle: { fontSize: 14, color: '#94a3b8', marginBottom: 20, lineHeight: 20 },
  vehicleRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  input: {
    backgroundColor: '#1e293b', borderRadius: 10, padding: 14, color: '#f1f5f9',
    fontSize: 15, borderWidth: 1, borderColor: '#334155',
  },
  small: { flex: 1 },
  textarea: { height: 120, textAlignVertical: 'top', marginBottom: 14 },
  btn: { backgroundColor: '#1a56db', borderRadius: 12, padding: 16, alignItems: 'center' },
  btnDisabled: { backgroundColor: '#334155' },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  result: { marginTop: 24, backgroundColor: '#1e293b', borderRadius: 14, padding: 18 },
  resultHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 },
  problem: { flex: 1, fontSize: 18, fontWeight: '700', color: '#f1f5f9' },
  sevBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  sevText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  confRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 16 },
  confLabel: { color: '#94a3b8', fontSize: 13, width: 72 },
  confBarBg: { flex: 1, height: 8, backgroundColor: '#0f172a', borderRadius: 4, overflow: 'hidden' },
  confBarFill: { height: 8, borderRadius: 4 },
  confPct: { color: '#f1f5f9', fontWeight: '700', fontSize: 13, width: 40, textAlign: 'right' },
  explanation: { color: '#cbd5e1', fontSize: 14, lineHeight: 21, marginTop: 14 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 14 },
  metaChip: { color: '#94a3b8', fontSize: 13, fontWeight: '600' },
  partsTitle: { color: '#f1f5f9', fontSize: 15, fontWeight: '700', marginTop: 20, marginBottom: 8 },
  partRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#334155',
  },
  partName: { color: '#e2e8f0', fontSize: 14, flex: 1 },
  partLink: { color: '#f59e0b', fontWeight: '700', fontSize: 14 },
  disclaimer: { color: '#64748b', fontSize: 12, marginTop: 18, lineHeight: 17, fontStyle: 'italic' },
});
