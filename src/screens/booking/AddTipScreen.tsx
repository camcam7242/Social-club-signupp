import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, TextInput } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/types';
import { TopBar } from '@/components/TopBar';
import { PrimaryBtn } from '@/components/PrimaryBtn';
import { colors, typography, spacing, radius, shadows } from '@/theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'AddTip'>;

const SERVICE_TOTAL = 180;
const TIP_PCTS = [15, 20, 25];

export function AddTipScreen({ navigation }: Props) {
  const [selected, setSelected] = useState<number | null>(20);
  const [custom, setCustom] = useState('');

  const tipAmount = custom ? parseFloat(custom) || 0 : selected ? (SERVICE_TOTAL * selected / 100) : 0;

  return (
    <SafeAreaView style={styles.safe}>
      <TopBar title="Add a tip" onBack={() => navigation.goBack()} />
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>How was Jordan?</Text>
          <Text style={styles.sub}>Tips go 100% to your stylist.</Text>
        </View>

        <View style={styles.pctRow}>
          {TIP_PCTS.map(pct => (
            <TouchableOpacity key={pct} style={[styles.pctCard, selected === pct && !custom && styles.pctCardSelected]} onPress={() => { setSelected(pct); setCustom(''); }}>
              <Text style={[styles.pctLabel, selected === pct && !custom && styles.pctLabelSelected]}>{pct}%</Text>
              <Text style={[styles.pctAmt, selected === pct && !custom && styles.pctAmtSelected]}>${(SERVICE_TOTAL * pct / 100).toFixed(0)}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.customRow}>
          <Text style={styles.customLabel}>Custom</Text>
          <View style={styles.customInput}>
            <Text style={styles.dollarSign}>$</Text>
            <TextInput value={custom} onChangeText={v => { setCustom(v); setSelected(null); }} keyboardType="numeric" placeholder="0.00" placeholderTextColor={colors.muted} style={styles.customField} />
          </View>
        </View>

        {tipAmount > 0 && (
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tip total</Text>
            <Text style={styles.totalAmt}>${tipAmount.toFixed(2)}</Text>
          </View>
        )}

        <PrimaryBtn label={tipAmount > 0 ? `Send $${tipAmount.toFixed(2)} tip` : 'Skip tip'} onPress={() => navigation.navigate('RatePro')} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  container: { flex: 1, paddingHorizontal: spacing.screenH, paddingBottom: 40, gap: 24, paddingTop: 8 },
  header: { gap: 6 },
  title: { ...typography.sectionH, color: colors.ink },
  sub: { ...typography.body, color: colors.muted },
  pctRow: { flexDirection: 'row', gap: 12 },
  pctCard: { flex: 1, paddingVertical: 20, borderRadius: radius.card, backgroundColor: colors.field, alignItems: 'center', gap: 4, borderWidth: 1.5, borderColor: colors.line },
  pctCardSelected: { backgroundColor: colors.blueSoft, borderColor: colors.blue, ...shadows.card },
  pctLabel: { fontSize: 22, fontWeight: '800', color: colors.ink },
  pctLabelSelected: { color: colors.blue },
  pctAmt: { ...typography.body, color: colors.muted },
  pctAmtSelected: { color: colors.blue },
  customRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: radius.card, backgroundColor: colors.field },
  customLabel: { ...typography.bodyMed, color: colors.body },
  customInput: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dollarSign: { fontSize: 18, color: colors.ink, fontWeight: '700' },
  customField: { fontSize: 18, fontWeight: '700', color: colors.ink, minWidth: 60, textAlign: 'right' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: radius.card, backgroundColor: colors.successTint },
  totalLabel: { ...typography.bodyMed, color: colors.successDeep },
  totalAmt: { fontSize: 20, fontWeight: '800', color: colors.success },
});
