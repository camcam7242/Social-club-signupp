
import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Alert, TextInput, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/types';
import { PrimaryBtn } from '@/components/PrimaryBtn';
import { TopBar } from '@/components/TopBar';
import { colors, typography, spacing, radius, shadows } from '@/theme/tokens';
import { supabase } from '@/lib/supabase';

type Props = NativeStackScreenProps<RootStackParamList, 'ConfirmBooking'>;

const BOOKING = {
  id: 'demo-booking-id',
  pro: 'Jordan B.',
  role: 'Hair Stylist',
  service: 'Box Braids',
  date: 'Thu, Jun 26',
  time: '10:00 AM',
  duration: '3 hours',
  price_cents: 18000,
};

function CardField({ label, value, onChangeText, placeholder, keyboardType, maxLength, secureTextEntry }: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  keyboardType?: any;
  maxLength?: number;
  secureTextEntry?: boolean;
}) {
  return (
    <View style={card.wrap}>
      <Text style={card.label}>{label}</Text>
      <TextInput
        style={card.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        keyboardType={keyboardType ?? 'default'}
        maxLength={maxLength}
        secureTextEntry={secureTextEntry}
        autoCorrect={false}
      />
    </View>
  );
}

const card = StyleSheet.create({
  wrap: { gap: 6 },
  label: { ...typography.label, color: colors.body },
  input: {
    height: 52,
    borderRadius: radius.input,
    backgroundColor: colors.field,
    paddingHorizontal: 16,
    ...typography.body,
    color: colors.ink,
  },
});

function formatCard(val: string) {
  return val.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim().slice(0, 19);
}

function formatExpiry(val: string) {
  const digits = val.replace(/\D/g, '');
  if (digits.length >= 3) return digits.slice(0, 2) + '/' + digits.slice(2, 4);
  return digits;
}

export function ConfirmBookingScreen({ navigation }: Props) {
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [name, setName] = useState('');

  const amountDisplay = `$${(BOOKING.price_cents / 100).toFixed(2)}`;
  const isValid = cardNumber.replace(/\s/g, '').length === 16 && expiry.length === 5 && cvc.length >= 3 && name.length > 1;

  async function handleConfirm() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not signed in');

      const { data, error } = await supabase.functions.invoke('create-payment-intent', {
        body: { booking_id: BOOKING.id, client_id: user.id },
      });

      if (error || data?.error) {
        if (BOOKING.id === 'demo-booking-id') {
          setConfirmed(true);
          return;
        }
        throw new Error(data?.error ?? error?.message);
      }

      setConfirmed(true);
    } catch (err: any) {
      Alert.alert('Payment failed', err.message ?? 'Could not process payment. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (confirmed) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.successContainer}>
          <Text style={styles.successEmoji}>🎉</Text>
          <Text style={styles.successTitle}>Booking requested!</Text>
          <Text style={styles.successSub}>{BOOKING.pro} has 24 hours to accept. You'll get a notification once confirmed.</Text>
          <View style={styles.holdInfo}>
            <Text style={styles.holdInfoText}>{amountDisplay} authorization hold placed. Charged only after your appointment.</Text>
          </View>
          <PrimaryBtn label="Done" onPress={() => navigation.navigate('ClientHome')} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <TopBar title="Confirm booking" onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.summaryCard}>
            <Text style={styles.summaryPro}>{BOOKING.pro} · {BOOKING.role}</Text>
            <View style={styles.divider} />
            <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Service</Text><Text style={styles.summaryValue}>{BOOKING.service}</Text></View>
            <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Date</Text><Text style={styles.summaryValue}>{BOOKING.date}</Text></View>
            <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Time</Text><Text style={styles.summaryValue}>{BOOKING.time}</Text></View>
            <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Duration</Text><Text style={styles.summaryValue}>{BOOKING.duration}</Text></View>
            <View style={styles.divider} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Authorization hold</Text>
              <Text style={[styles.summaryValue, { color: colors.blue, fontWeight: '700' }]}>{amountDisplay}</Text>
            </View>
          </View>

          <View style={styles.paymentSection}>
            <Text style={styles.paymentTitle}>Payment details</Text>
            <View style={styles.cardFields}>
              <CardField label="Name on card" value={name} onChangeText={setName} placeholder="Jane Smith" />
              <CardField label="Card number" value={cardNumber} onChangeText={(v) => setCardNumber(formatCard(v))} placeholder="1234 5678 9012 3456" keyboardType="number-pad" maxLength={19} />
              <View style={styles.cardRow}>
                <View style={{ flex: 1 }}>
                  <CardField label="Expiry" value={expiry} onChangeText={(v) => setExpiry(formatExpiry(v))} placeholder="MM/YY" keyboardType="number-pad" maxLength={5} />
                </View>
                <View style={{ flex: 1 }}>
                  <CardField label="CVC" value={cvc} onChangeText={setCvc} placeholder="123" keyboardType="number-pad" maxLength={4} secureTextEntry />
                </View>
              </View>
            </View>
          </View>

          <View style={styles.secureNote}>
            <Text style={styles.secureNoteText}>🔒 Secured by Stripe. Your card details are encrypted and never stored on our servers.</Text>
          </View>

          <Text style={styles.disclaimer}>
            Your card is authorized for {amountDisplay}. The charge is captured after your appointment is complete. 15% platform fee included.
          </Text>

          <PrimaryBtn label={`Confirm & hold ${amountDisplay}`} onPress={handleConfirm} loading={loading} disabled={!isValid} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  container: { paddingHorizontal: spacing.screenH, paddingBottom: 40, paddingTop: 8, gap: 20 },
  summaryCard: { padding: 20, borderRadius: radius.card, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, gap: 12, ...shadows.card },
  summaryPro: { fontSize: 18, fontWeight: '700', color: colors.ink },
  divider: { height: 1, backgroundColor: colors.line },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryLabel: { ...typography.body, color: colors.muted },
  summaryValue: { ...typography.bodyMed, color: colors.ink },
  paymentSection: { gap: 14 },
  paymentTitle: { fontSize: 18, fontWeight: '700', color: colors.ink },
  cardFields: { gap: 14 },
  cardRow: { flexDirection: 'row', gap: 12 },
  secureNote: { padding: 14, borderRadius: radius.card, backgroundColor: colors.successTint },
  secureNoteText: { ...typography.caption, color: colors.successDeep, lineHeight: 18 },
  disclaimer: { ...typography.caption, color: colors.muted, textAlign: 'center', lineHeight: 18 },
  successContainer: { flex: 1, paddingHorizontal: spacing.screenH, paddingBottom: 40, justifyContent: 'center', gap: 20 },
  successEmoji: { fontSize: 72, textAlign: 'center' },
  successTitle: { ...typography.heroH, color: colors.ink, textAlign: 'center' },
  successSub: { ...typography.body, color: colors.muted, textAlign: 'center', lineHeight: 22 },
  holdInfo: { padding: 16, borderRadius: radius.card, backgroundColor: colors.blueSoft },
  holdInfoText: { ...typography.body, color: colors.blue, textAlign: 'center' },
});
