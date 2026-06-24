import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TextInput,
  KeyboardAvoidingView, Platform, TouchableOpacity, Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/types';
import { TopBar } from '@/components/TopBar';
import { PrimaryBtn } from '@/components/PrimaryBtn';
import { colors, typography, spacing, radius } from '@/theme/tokens';
import { verifyPhoneOtp, sendPhoneOtp } from '@/lib/auth';

type Props = NativeStackScreenProps<RootStackParamList, 'VerifyPhone'>;

const RESEND_COOLDOWN = 60;

export function VerifyPhoneScreen({ navigation, route }: Props) {
  const { userId, phone } = route.params;
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN);
  const inputs = useRef<(TextInput | null)[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const filled = otp.every(d => d !== '');
  const maskedPhone = phone.replace(/(\+\d{1,3})(\d+)(\d{4})/, '$1 ••••• $3');

  useEffect(() => {
    startCooldown();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  function startCooldown() {
    setCooldown(RESEND_COOLDOWN);
    timerRef.current = setInterval(() => {
      setCooldown(c => {
        if (c <= 1) { clearInterval(timerRef.current!); return 0; }
        return c - 1;
      });
    }, 1000);
  }

  function handleChange(val: string, idx: number) {
    setError('');
    const digit = val.replace(/\D/g, '').slice(-1);
    const next = [...otp];
    next[idx] = digit;
    setOtp(next);
    if (digit && idx < 5) inputs.current[idx + 1]?.focus();
    if (!digit && idx > 0) inputs.current[idx - 1]?.focus();
  }

  async function handleVerify() {
    setLoading(true);
    setError('');
    try {
      await verifyPhoneOtp(userId, phone, otp.join(''));
      navigation.navigate('ChooseRole', { userId });
    } catch (err: any) {
      setError(err.message ?? 'Incorrect code. Please try again.');
      setOtp(['', '', '', '', '', '']);
      inputs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (cooldown > 0) return;
    try {
      await sendPhoneOtp(userId, phone);
      setOtp(['', '', '', '', '', '']);
      setError('');
      inputs.current[0]?.focus();
      startCooldown();
      Alert.alert('Code sent', `A new code was sent to ${maskedPhone}`);
    } catch (err: any) {
      Alert.alert('Failed to resend', err.message ?? 'Please try again.');
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <TopBar title="Verify phone" onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Enter the code</Text>
            <Text style={styles.sub}>We sent a 6-digit code to{'\n'}{maskedPhone}</Text>
          </View>
          <View style={styles.otpRow}>
            {otp.map((digit, i) => (
              <TextInput
                key={i}
                ref={el => { inputs.current[i] = el; }}
                style={[styles.otpBox, digit ? styles.otpFilled : null, error ? styles.otpError : null]}
                value={digit}
                onChangeText={v => handleChange(v, i)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
              />
            ))}
          </View>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <TouchableOpacity onPress={handleResend} disabled={cooldown > 0} style={styles.resendBtn}>
            <Text style={[styles.resendText, cooldown > 0 && styles.resendDisabled]}>
              {cooldown > 0 ? `Resend code in ${cooldown}s` : "Didn't get it? Resend code"}
            </Text>
          </TouchableOpacity>
          <PrimaryBtn label="Verify" onPress={handleVerify} disabled={!filled} loading={loading} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  container: { flex: 1, paddingHorizontal: spacing.screenH, paddingTop: 8, paddingBottom: 40, gap: 24 },
  header: { gap: 8 },
  title: { ...typography.sectionH, color: colors.ink },
  sub: { ...typography.body, color: colors.muted, lineHeight: 22 },
  otpRow: { flexDirection: 'row', gap: 10, justifyContent: 'center' },
  otpBox: { width: 48, height: 58, borderRadius: radius.input, backgroundColor: colors.field, textAlign: 'center', fontSize: 22, fontWeight: '700', color: colors.ink, borderWidth: 1.5, borderColor: colors.line },
  otpFilled: { borderColor: colors.blue, backgroundColor: colors.blueSoft },
  otpError: { borderColor: '#EF4444', backgroundColor: '#FEF2F2' },
  errorText: { ...typography.body, color: '#EF4444', textAlign: 'center' },
  resendBtn: { alignItems: 'center' },
  resendText: { ...typography.body, color: colors.blue, fontWeight: '600' },
  resendDisabled: { color: colors.muted, fontWeight: '400' },
});
