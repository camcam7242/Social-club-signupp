import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TextInput,
  KeyboardAvoidingView, Platform, TouchableOpacity,
  Modal, FlatList, Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/types';
import { TopBar } from '@/components/TopBar';
import { PrimaryBtn } from '@/components/PrimaryBtn';
import { colors, typography, spacing, radius } from '@/theme/tokens';
import { sendPhoneOtp } from '@/lib/auth';

type Props = NativeStackScreenProps<RootStackParamList, 'EnterPhone'>;

const COUNTRIES = [
  { code: 'US', flag: '🇺🇸', dial: '+1', name: 'United States' },
  { code: 'CA', flag: '🇨🇦', dial: '+1', name: 'Canada' },
  { code: 'GB', flag: '🇬🇧', dial: '+44', name: 'United Kingdom' },
  { code: 'NG', flag: '🇳🇬', dial: '+234', name: 'Nigeria' },
  { code: 'GH', flag: '🇬🇭', dial: '+233', name: 'Ghana' },
  { code: 'JM', flag: '🇯🇲', dial: '+1876', name: 'Jamaica' },
  { code: 'TT', flag: '🇹🇹', dial: '+1868', name: 'Trinidad & Tobago' },
  { code: 'BB', flag: '🇧🇧', dial: '+1246', name: 'Barbados' },
  { code: 'FR', flag: '🇫🇷', dial: '+33', name: 'France' },
  { code: 'DE', flag: '🇩🇪', dial: '+49', name: 'Germany' },
  { code: 'AU', flag: '🇦🇺', dial: '+61', name: 'Australia' },
  { code: 'MX', flag: '🇲🇽', dial: '+52', name: 'Mexico' },
  { code: 'BR', flag: '🇧🇷', dial: '+55', name: 'Brazil' },
  { code: 'IN', flag: '🇮🇳', dial: '+91', name: 'India' },
  { code: 'ZA', flag: '🇿🇦', dial: '+27', name: 'South Africa' },
];

export function EnterPhoneScreen({ navigation, route }: Props) {
  const { userId } = route.params;
  const [country, setCountry] = useState(COUNTRIES[0]);
  const [phone, setPhone] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const digits = phone.replace(/\D/g, '');
  const isValid = digits.length >= 7;
  const fullPhone = `${country.dial}${digits}`;

  async function handleSend() {
    setLoading(true);
    try {
      await sendPhoneOtp(userId, fullPhone);
      navigation.navigate('VerifyPhone', { userId, phone: fullPhone });
    } catch (err: any) {
      Alert.alert('Could not send code', err.message ?? 'Please check the number and try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <TopBar title="Add your phone" onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>What's your number?</Text>
            <Text style={styles.sub}>We'll send a verification code. Standard rates may apply.</Text>
          </View>
          <View style={styles.inputRow}>
            <TouchableOpacity style={styles.countryBtn} onPress={() => setShowPicker(true)} activeOpacity={0.8}>
              <Text style={styles.flag}>{country.flag}</Text>
              <Text style={styles.dial}>{country.dial}</Text>
              <Text style={styles.chevron}>▾</Text>
            </TouchableOpacity>
            <TextInput
              style={styles.phoneInput}
              value={phone}
              onChangeText={setPhone}
              placeholder="(555) 000-0000"
              placeholderTextColor={colors.muted}
              keyboardType="phone-pad"
              autoFocus
              maxLength={15}
            />
          </View>
          <PrimaryBtn label="Send code" onPress={handleSend} disabled={!isValid} loading={loading} />
        </View>
      </KeyboardAvoidingView>
      <Modal visible={showPicker} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select country</Text>
            <TouchableOpacity onPress={() => setShowPicker(false)}>
              <Text style={styles.modalClose}>Done</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={COUNTRIES}
            keyExtractor={c => c.code}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.countryRow, item.code === country.code && styles.countryRowSelected]}
                onPress={() => { setCountry(item); setShowPicker(false); }}
              >
                <Text style={styles.countryFlag}>{item.flag}</Text>
                <Text style={styles.countryName}>{item.name}</Text>
                <Text style={styles.countryDial}>{item.dial}</Text>
              </TouchableOpacity>
            )}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  container: { flex: 1, paddingHorizontal: spacing.screenH, paddingTop: 8, paddingBottom: 40, gap: 28 },
  header: { gap: 8 },
  title: { ...typography.sectionH, color: colors.ink },
  sub: { ...typography.body, color: colors.muted },
  inputRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  countryBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 52, paddingHorizontal: 14, borderRadius: radius.input, backgroundColor: colors.field, borderWidth: 1, borderColor: colors.line },
  flag: { fontSize: 20 },
  dial: { ...typography.bodyMed, color: colors.ink },
  chevron: { color: colors.muted, fontSize: 12 },
  phoneInput: { flex: 1, height: 52, borderRadius: radius.input, backgroundColor: colors.field, paddingHorizontal: 16, ...typography.body, color: colors.ink, borderWidth: 1, borderColor: colors.line, fontSize: 17 },
  modal: { flex: 1, backgroundColor: colors.white },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.screenH, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.line },
  modalTitle: { fontSize: 18, fontWeight: '700', color: colors.ink },
  modalClose: { ...typography.bodyMed, color: colors.blue },
  countryRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.screenH, paddingVertical: 14, gap: 12, borderBottomWidth: 1, borderBottomColor: colors.line },
  countryRowSelected: { backgroundColor: colors.blueSoft },
  countryFlag: { fontSize: 22 },
  countryName: { flex: 1, ...typography.body, color: colors.ink },
  countryDial: { ...typography.body, color: colors.muted },
});
