import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';

export default function LoginScreen() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim()) return Alert.alert('Required', 'Please enter your email');
    if (!password) return Alert.alert('Required', 'Please enter your password');
    setLoading(true);
    try {
      await login(email.trim(), password);
      router.replace('/(tabs)');
    } catch (err: any) {
      Alert.alert('Sign In Failed', err.response?.data?.error || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

        <View style={styles.logoArea}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoEmoji}>🔧</Text>
          </View>
          <Text style={styles.appName}>MechMarket</Text>
        </View>

        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Sign in to your account</Text>

        <Text style={styles.label}>Email Address</Text>
        <TextInput
          style={styles.input}
          placeholder="your@email.com"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Your password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="password"
        />

        <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')} style={styles.forgotRow}>
          <Text style={styles.forgotText}>Forgot password?</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.primaryBtn} onPress={handleLogin} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Sign In</Text>}
        </TouchableOpacity>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.push('/(auth)/register')}>
          <Text style={styles.secondaryBtnText}>Create Customer Account</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.proBtn} onPress={() => router.push('/(auth)/professional-signup')}>
          <Text style={styles.proBtnText}>🔧  Join as a Professional Mechanic</Text>
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 24, backgroundColor: '#fff', justifyContent: 'center' },
  logoArea: { alignItems: 'center', marginBottom: 32 },
  logoCircle: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: '#eff6ff',
    alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  logoEmoji: { fontSize: 36 },
  appName: { fontSize: 20, fontWeight: '800', color: '#1a56db' },
  title: { fontSize: 26, fontWeight: '800', color: '#111', marginBottom: 6 },
  subtitle: { fontSize: 15, color: '#6b7280', marginBottom: 28 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  input: {
    borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 12,
    padding: 15, fontSize: 15, marginBottom: 14, backgroundColor: '#f9fafb',
  },
  forgotRow: { alignItems: 'flex-end', marginBottom: 20, marginTop: -8 },
  forgotText: { color: '#1a56db', fontSize: 14, fontWeight: '500' },
  primaryBtn: {
    backgroundColor: '#1a56db', borderRadius: 14, padding: 17, alignItems: 'center', marginBottom: 20,
  },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#e5e7eb' },
  dividerText: { color: '#9ca3af', fontSize: 13 },
  secondaryBtn: {
    borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 14,
    padding: 16, alignItems: 'center', marginBottom: 12,
  },
  secondaryBtnText: { color: '#374151', fontWeight: '600', fontSize: 15 },
  proBtn: {
    borderWidth: 1.5, borderColor: '#1a56db', borderRadius: 14,
    padding: 16, alignItems: 'center', backgroundColor: '#eff6ff',
  },
  proBtnText: { color: '#1a56db', fontWeight: '700', fontSize: 15 },
});
