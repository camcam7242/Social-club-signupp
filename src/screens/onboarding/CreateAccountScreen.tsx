import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/types';
import { TopBar } from '@/components/TopBar';
import { PrimaryBtn } from '@/components/PrimaryBtn';
import { colors, typography, spacing, radius } from '@/theme/tokens';
import { signUpWithEmail } from '@/lib/auth';

type Props = NativeStackScreenProps<RootStackParamList, 'CreateAccount'>;

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

export function CreateAccountScreen({ navigation }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const isValid = name.length > 1 && email.includes('@') && password.length >= 8;

  async function handleContinue() {
    setLoading(true);
    try {
      await signUpWithEmail(name.trim(), email.trim().toLowerCase(), password);
      navigation.navigate('CheckEmail', { email: email.trim().toLowerCase(), mode: 'signup' });
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Could not create account. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <TopBar title="Create account" onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Create your account</Text>
          <View style={styles.fields}>
            <Field
              label="Full name"
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              autoComplete="name"
              autoCapitalize="words"
            />
            <Field
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="you@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
            <Field
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="8+ characters"
              secureTextEntry
              autoComplete="new-password"
            />
          </View>
          <PrimaryBtn label="Continue" onPress={handleContinue} disabled={!isValid} loading={loading} />
          <Text style={styles.terms}>
            By continuing you agree to Glamr's{' '}
            <Text style={styles.link} onPress={() => navigation.navigate('TermsOfService')}>Terms of Service</Text> and{' '}
            <Text style={styles.link} onPress={() => navigation.navigate('PrivacyPolicy')}>Privacy Policy</Text>.
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
  terms: { ...typography.caption, color: colors.muted, textAlign: 'center', lineHeight: 18 },
  link: { color: colors.blue },
});
