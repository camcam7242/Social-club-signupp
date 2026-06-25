import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TextInput,
  KeyboardAvoidingView, Platform, ScrollView, Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/types';
import { TopBar } from '@/components/TopBar';
import { PrimaryBtn } from '@/components/PrimaryBtn';
import { colors, typography, spacing, radius } from '@/theme/tokens';
import { sendPasswordReset } from '@/lib/auth';

type Props = NativeStackScreenProps<RootStackParamList, 'ForgotPassword'>;

export function ForgotPasswordScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const isValid = email.includes('@') && email.includes('.');

  async function handleSend() {
    setLoading(true);
    try {
      await sendPasswordReset(email.trim().toLowerCase());
      navigation.navigate('CheckEmail', { email: email.trim().toLowerCase(), mode: 'reset' });
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Could not send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <TopBar title="Reset password" onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Forgot your password?</Text>
          <Text style={styles.sub}>Enter your email and we'll send you a link to reset your password.</Text>
          <View style={styles.fieldWrap}>
            <Text style={styles.label}>Email</Text>
            <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="you@email.com" placeholderTextColor={colors.muted} keyboardType="email-address" autoCapitalize="none" autoComplete="email" autoFocus />
          </View>
          <PrimaryBtn label="Send reset link" onPress={handleSend} disabled={!isValid} loading={loading} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  container: { paddingHorizontal: spacing.screenH, paddingTop: 8, paddingBottom: 40, gap: 24 },
  title: { ...typography.sectionH, color: colors.ink },
  sub: { ...typography.body, color: colors.muted, lineHeight: 22, marginTop: -8 },
  fieldWrap: { gap: 6 },
  label: { ...typography.label, color: colors.body },
  input: { height: 52, borderRadius: radius.input, backgroundColor: colors.field, paddingHorizontal: 16, ...typography.body, color: colors.ink },
});
