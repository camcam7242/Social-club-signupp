import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TextInput,
  KeyboardAvoidingView, Platform, ScrollView, Alert, TouchableOpacity,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/types';
import { TopBar } from '@/components/TopBar';
import { PrimaryBtn } from '@/components/PrimaryBtn';
import { colors, typography, spacing, radius } from '@/theme/tokens';
import { signInWithEmail, getAuthStep } from '@/lib/auth';

type Props = NativeStackScreenProps<RootStackParamList, 'SignIn'>;

function Field({ label, ...props }: React.ComponentProps<typeof TextInput> & { label: string }) {
  return (
    <View style={field.wrap}>
      <Text style={field.label}>{label}</Text>
      <TextInput style={field.input} placeholderTextColor={colors.muted} {...props} />
    </View>
  );
}

const field = StyleSheet.create({
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

export function SignInScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const isValid = email.includes('@') && password.length >= 6;

  async function handleSignIn() {
    setLoading(true);
    try {
      const user = await signInWithEmail(email.trim().toLowerCase(), password);
      const step = await getAuthStep(user.id);
      if (step === 'email_pending') {
        navigation.navigate('CheckEmail', { email: email.trim().toLowerCase(), mode: 'signup' });
      } else if (step === 'profile_incomplete' || step === 'verified') {
        navigation.navigate('ChooseRole', { userId: user.id });
      } else {
        navigation.navigate('ClientHome');
      }
    } catch (err: any) {
      Alert.alert('Sign in failed', err.message ?? 'Check your email and password.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <TopBar title="Sign in" onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Welcome back</Text>
          <View style={styles.fields}>
            <Field label="Email" value={email} onChangeText={setEmail} placeholder="you@email.com" keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
            <Field label="Password" value={password} onChangeText={setPassword} placeholder="Your password" secureTextEntry autoComplete="current-password" />
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
            <Text style={styles.forgot}>Forgot password?</Text>
          </TouchableOpacity>
          <PrimaryBtn label="Sign in" onPress={handleSignIn} disabled={!isValid} loading={loading} />
          <Text style={styles.bottom}>
            Don't have an account?{' '}
            <Text style={styles.link} onPress={() => navigation.navigate('CreateAccount')}>Create one</Text>
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  container: { paddingHorizontal: spacing.screenH, paddingTop: 8, paddingBottom: 40, gap: 24 },
  title: { ...typography.sectionH, color: colors.ink },
  fields: { gap: 16 },
  forgot: { ...typography.bodyMed, color: colors.blue, textAlign: 'right', marginTop: -8 },
  bottom: { ...typography.body, color: colors.muted, textAlign: 'center' },
  link: { color: colors.blue, fontWeight: '600' },
});
