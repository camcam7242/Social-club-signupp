import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { authExtApi } from '../../services/api';

type Step = 'email' | 'reset' | 'done';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendReset = async () => {
    if (!email.trim()) return Alert.alert('Error', 'Please enter your email address');
    setLoading(true);
    try {
      await authExtApi.forgotPassword(email.trim());
      setStep('reset');
    } catch {
      // Always show the same message to avoid enumeration
      setStep('reset');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!token.trim()) return Alert.alert('Error', 'Please enter the reset code');
    if (password.length < 8) return Alert.alert('Error', 'Password must be at least 8 characters');
    if (password !== confirm) return Alert.alert('Error', 'Passwords do not match');
    setLoading(true);
    try {
      await authExtApi.resetPassword(token.trim(), password);
      setStep('done');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || 'Invalid or expired code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

      {step === 'email' && (
        <View style={styles.inner}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Forgot Password?</Text>
          <Text style={styles.subtitle}>Enter your email and we'll send you a reset link.</Text>

          <TextInput
            style={styles.input}
            placeholder="Email address"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoFocus
          />

          <TouchableOpacity style={styles.primaryBtn} onPress={handleSendReset} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Send Reset Link</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.back()}>
            <Text style={styles.secondaryBtnText}>Back to Sign In</Text>
          </TouchableOpacity>
        </View>
      )}

      {step === 'reset' && (
        <View style={styles.inner}>
          <Text style={styles.title}>Check Your Email</Text>
          <Text style={styles.subtitle}>
            We sent a reset code to <Text style={styles.emailHighlight}>{email}</Text>.
            Enter it below along with your new password.
          </Text>

          <Text style={styles.label}>Reset Code</Text>
          <TextInput
            style={styles.input}
            placeholder="Paste code from email"
            value={token}
            onChangeText={setToken}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.label}>New Password</Text>
          <TextInput
            style={styles.input}
            placeholder="At least 8 characters"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <Text style={styles.label}>Confirm Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Repeat new password"
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry
          />

          <TouchableOpacity style={styles.primaryBtn} onPress={handleReset} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Reset Password</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryBtn} onPress={() => setStep('email')}>
            <Text style={styles.secondaryBtnText}>Resend Code</Text>
          </TouchableOpacity>
        </View>
      )}

      {step === 'done' && (
        <View style={styles.inner}>
          <View style={styles.successCircle}>
            <Text style={styles.successCheck}>✓</Text>
          </View>
          <Text style={styles.title}>Password Reset!</Text>
          <Text style={styles.subtitle}>Your password has been updated. You can now sign in with your new password.</Text>

          <TouchableOpacity style={styles.primaryBtn} onPress={() => router.replace('/(auth)/login')}>
            <Text style={styles.primaryBtnText}>Sign In Now</Text>
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  inner: { flex: 1, padding: 24, justifyContent: 'center' },
  backBtn: { position: 'absolute', top: 56, left: 24 },
  backArrow: { fontSize: 28, color: '#cbd5e1' },
  title: { fontSize: 28, fontWeight: '800', color: '#f1f5f9', marginBottom: 10 },
  subtitle: { fontSize: 15, color: '#94a3b8', lineHeight: 22, marginBottom: 32 },
  emailHighlight: { color: '#1a56db', fontWeight: '600' },
  label: { fontSize: 13, fontWeight: '600', color: '#cbd5e1', marginBottom: 6, marginTop: 4 },
  input: {
    borderWidth: 1.5, borderColor: '#334155', borderRadius: 12,
    padding: 15, fontSize: 15, marginBottom: 14, backgroundColor: '#0f172a',
  },
  primaryBtn: {
    backgroundColor: '#1a56db', borderRadius: 14,
    padding: 16, alignItems: 'center', marginTop: 8,
  },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  secondaryBtn: { alignItems: 'center', marginTop: 18 },
  secondaryBtnText: { color: '#1a56db', fontSize: 15 },
  successCircle: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: '#10b981',
    alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 24,
  },
  successCheck: { color: '#fff', fontSize: 40, fontWeight: '700' },
});
