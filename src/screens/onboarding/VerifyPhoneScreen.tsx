import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/types';
import { TopBar } from '@/components/TopBar';
import { PrimaryBtn } from '@/components/PrimaryBtn';
import { colors, typography, spacing, radius } from '@/theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'VerifyPhone'>;

export function VerifyPhoneScreen({ navigation, route }: Props) {
  const { role } = route.params;
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const inputs = useRef<(TextInput | null)[]>([]);
  const filled = otp.every(d => d !== '');

  function handleChange(val: string, idx: number) {
    const digit = val.replace(/\D/g, '').slice(-1);
    const next = [...otp];
    next[idx] = digit;
    setOtp(next);
    if (digit && idx < 5) inputs.current[idx + 1]?.focus();
    if (!digit && idx > 0) inputs.current[idx - 1]?.focus();
  }

  function handleNext() {
    if (role === 'pro') navigation.navigate('Specialty');
    else navigation.navigate('ClientHome');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <TopBar title="Verify phone" onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Enter the code</Text>
            <Text style={styles.sub}>We sent a 6-digit code to your phone.</Text>
          </View>
          <View style={styles.otpRow}>
            {otp.map((digit, i) => (
              <TextInput
                key={i}
                ref={el => { inputs.current[i] = el; }}
                style={[styles.otpBox, digit ? styles.otpFilled : null]}
                value={digit}
                onChangeText={v => handleChange(v, i)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
              />
            ))}
          </View>
          <Text style={styles.resend}>
            Didn't get it?{' '}
            <Text style={styles.resendLink}>Resend code</Text>
          </Text>
          <PrimaryBtn label="Verify" onPress={handleNext} disabled={!filled} />
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
  sub: { ...typography.body, color: colors.muted },
  otpRow: { flexDirection: 'row', gap: 10, justifyContent: 'center' },
  otpBox: {
    width: 48,
    height: 58,
    borderRadius: radius.input,
    backgroundColor: colors.field,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
    color: colors.ink,
    borderWidth: 1.5,
    borderColor: colors.line,
  },
  otpFilled: { borderColor: colors.blue, backgroundColor: colors.blueSoft },
  resend: { ...typography.body, color: colors.muted, textAlign: 'center' },
  resendLink: { color: colors.blue, fontWeight: '600' },
});
