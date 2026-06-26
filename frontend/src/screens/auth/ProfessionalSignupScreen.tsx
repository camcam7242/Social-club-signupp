import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { authExtApi } from '../../services/api';
import * as SecureStore from 'expo-secure-store';

const SERVICE_TYPES = [
  'Oil Change', 'Tire Service', 'Battery', 'Brakes',
  'Engine Diagnostics', 'AC Repair', 'Transmission',
  'Electrical', 'Suspension', 'Exhaust', 'General Repair',
];

const STEPS = ['Account', 'Business', 'Services', 'Done'];

export default function ProfessionalSignupScreen() {
  const router = useRouter();
  const { loadUser } = useAuthStore();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // Step 0 — Account
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [phone, setPhone] = useState('');

  // Step 1 — Business
  const [businessName, setBusinessName] = useState('');
  const [bio, setBio] = useState('');
  const [radius, setRadius] = useState('25');

  // Step 2 — Services
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  const toggleService = (s: string) =>
    setSelectedServices(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s]);

  const nextStep = () => {
    if (step === 0) {
      if (!email.trim()) return Alert.alert('Required', 'Enter your email');
      if (password.length < 8) return Alert.alert('Required', 'Password must be at least 8 characters');
      if (password !== confirm) return Alert.alert('Error', 'Passwords do not match');
    }
    if (step === 1) {
      if (!businessName.trim()) return Alert.alert('Required', 'Enter your business name');
    }
    if (step < 2) { setStep(s => s + 1); return; }
    handleSubmit();
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const { data } = await authExtApi.registerProfessional({
        email: email.trim(),
        password,
        phone: phone.trim(),
        business_name: businessName.trim(),
        bio: bio.trim(),
        service_radius_km: parseInt(radius) || 25,
      });
      await SecureStore.setItemAsync('accessToken', data.accessToken);
      await SecureStore.setItemAsync('refreshToken', data.refreshToken);
      await loadUser();
      setStep(3);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const progressPct = ((step) / (STEPS.length - 1)) * 100;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">

        {step < 3 && (
          <View style={styles.header}>
            <TouchableOpacity onPress={() => step > 0 ? setStep(s => s - 1) : router.back()} style={styles.backBtn}>
              <Text style={styles.backArrow}>←</Text>
            </TouchableOpacity>
            <Text style={styles.stepLabel}>{STEPS[step]} · Step {step + 1} of 3</Text>
          </View>
        )}

        {/* Progress bar */}
        {step < 3 && (
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
          </View>
        )}

        {/* ── Step 0: Account ── */}
        {step === 0 && (
          <View style={styles.stepContent}>
            <Text style={styles.title}>Create Your Pro Account</Text>
            <Text style={styles.subtitle}>Join as a professional mechanic and start earning.</Text>

            <Text style={styles.label}>Email Address *</Text>
            <TextInput style={styles.input} placeholder="your@email.com" value={email}
              onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />

            <Text style={styles.label}>Phone Number</Text>
            <TextInput style={styles.input} placeholder="+1 (555) 000-0000" value={phone}
              onChangeText={setPhone} keyboardType="phone-pad" />

            <Text style={styles.label}>Password *</Text>
            <TextInput style={styles.input} placeholder="At least 8 characters" value={password}
              onChangeText={setPassword} secureTextEntry />

            <Text style={styles.label}>Confirm Password *</Text>
            <TextInput style={styles.input} placeholder="Repeat password" value={confirm}
              onChangeText={setConfirm} secureTextEntry />
          </View>
        )}

        {/* ── Step 1: Business ── */}
        {step === 1 && (
          <View style={styles.stepContent}>
            <Text style={styles.title}>Your Business</Text>
            <Text style={styles.subtitle}>Tell customers about your mobile mechanic business.</Text>

            <Text style={styles.label}>Business / Trade Name *</Text>
            <TextInput style={styles.input} placeholder="e.g. Mike's Mobile Auto" value={businessName}
              onChangeText={setBusinessName} />

            <Text style={styles.label}>Bio</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              placeholder="Years of experience, specialties, certifications (ASE, etc.)..."
              value={bio}
              onChangeText={setBio}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <Text style={styles.label}>Service Radius</Text>
            <View style={styles.radiusRow}>
              {['10', '25', '50', '75'].map(r => (
                <TouchableOpacity
                  key={r}
                  style={[styles.radiusChip, radius === r && styles.radiusChipActive]}
                  onPress={() => setRadius(r)}
                >
                  <Text style={[styles.radiusChipText, radius === r && styles.radiusChipTextActive]}>
                    {r} km
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                📋 After signing up, upload your ASE certifications and insurance documents in your profile. An admin will verify your account before you can accept jobs.
              </Text>
            </View>
          </View>
        )}

        {/* ── Step 2: Services ── */}
        {step === 2 && (
          <View style={styles.stepContent}>
            <Text style={styles.title}>What Do You Offer?</Text>
            <Text style={styles.subtitle}>Select the services you provide. You can update this anytime.</Text>

            <View style={styles.servicesGrid}>
              {SERVICE_TYPES.map(s => (
                <TouchableOpacity
                  key={s}
                  style={[styles.serviceChip, selectedServices.includes(s) && styles.serviceChipActive]}
                  onPress={() => toggleService(s)}
                >
                  <Text style={[styles.serviceChipText, selectedServices.includes(s) && styles.serviceChipTextActive]}>
                    {selectedServices.includes(s) ? '✓ ' : ''}{s}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* ── Step 3: Done ── */}
        {step === 3 && (
          <View style={styles.doneContent}>
            <View style={styles.doneIcon}>
              <Text style={styles.doneEmoji}>🔧</Text>
            </View>
            <Text style={styles.doneTitle}>You're In!</Text>
            <Text style={styles.doneSubtitle}>
              Your professional account has been created. An admin will review and verify your account — usually within 24 hours.
            </Text>
            <View style={styles.doneSteps}>
              {[
                { icon: '📄', text: 'Upload your insurance & ASE certs in Profile' },
                { icon: '✅', text: 'Wait for admin verification (24h)' },
                { icon: '🟢', text: 'Toggle Online in Dashboard to start accepting jobs' },
              ].map(({ icon, text }) => (
                <View key={text} style={styles.doneStep}>
                  <Text style={styles.doneStepIcon}>{icon}</Text>
                  <Text style={styles.doneStepText}>{text}</Text>
                </View>
              ))}
            </View>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => router.replace('/(tabs)')}>
              <Text style={styles.primaryBtnText}>Go to Dashboard</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Navigation button */}
        {step < 3 && (
          <View style={styles.footer}>
            <TouchableOpacity style={styles.primaryBtn} onPress={nextStep} disabled={loading}>
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.primaryBtnText}>{step === 2 ? 'Create Account' : 'Continue →'}</Text>
              }
            </TouchableOpacity>

            {step === 0 && (
              <TouchableOpacity onPress={() => router.back()} style={styles.linkBtn}>
                <Text style={styles.linkBtnText}>Already have an account? Sign in</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 56, paddingHorizontal: 20, paddingBottom: 8 },
  backBtn: { marginRight: 12 },
  backArrow: { fontSize: 26, color: '#374151' },
  stepLabel: { fontSize: 13, color: '#9ca3af', fontWeight: '500' },
  progressTrack: { height: 4, backgroundColor: '#f3f4f6', marginHorizontal: 20, borderRadius: 2, marginBottom: 24 },
  progressFill: { height: 4, backgroundColor: '#1a56db', borderRadius: 2 },
  stepContent: { paddingHorizontal: 24 },
  title: { fontSize: 26, fontWeight: '800', color: '#111', marginBottom: 8 },
  subtitle: { fontSize: 15, color: '#6b7280', lineHeight: 22, marginBottom: 28 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 8 },
  input: {
    borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 12,
    padding: 15, fontSize: 15, marginBottom: 6, backgroundColor: '#f9fafb',
  },
  textarea: { minHeight: 100 },
  radiusRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap', marginBottom: 20 },
  radiusChip: {
    paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20,
    borderWidth: 1.5, borderColor: '#e5e7eb', backgroundColor: '#fff',
  },
  radiusChipActive: { borderColor: '#1a56db', backgroundColor: '#eff6ff' },
  radiusChipText: { color: '#6b7280', fontWeight: '500' },
  radiusChipTextActive: { color: '#1a56db', fontWeight: '700' },
  infoBox: { backgroundColor: '#fffbeb', borderRadius: 12, padding: 14, marginTop: 8 },
  infoText: { color: '#92400e', fontSize: 13, lineHeight: 20 },
  servicesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  serviceChip: {
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20,
    borderWidth: 1.5, borderColor: '#e5e7eb', backgroundColor: '#fff',
  },
  serviceChipActive: { borderColor: '#1a56db', backgroundColor: '#eff6ff' },
  serviceChipText: { color: '#6b7280', fontSize: 14 },
  serviceChipTextActive: { color: '#1a56db', fontWeight: '600' },
  doneContent: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  doneIcon: {
    width: 100, height: 100, borderRadius: 50, backgroundColor: '#eff6ff',
    alignItems: 'center', justifyContent: 'center', marginBottom: 24,
  },
  doneEmoji: { fontSize: 48 },
  doneTitle: { fontSize: 30, fontWeight: '800', color: '#111', marginBottom: 12 },
  doneSubtitle: { fontSize: 15, color: '#6b7280', textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  doneSteps: { alignSelf: 'stretch', gap: 12, marginBottom: 32 },
  doneStep: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#f9fafb', borderRadius: 12, padding: 14 },
  doneStepIcon: { fontSize: 22 },
  doneStepText: { flex: 1, fontSize: 14, color: '#374151' },
  footer: { padding: 24, paddingTop: 16 },
  primaryBtn: {
    backgroundColor: '#1a56db', borderRadius: 14, padding: 17, alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  linkBtn: { alignItems: 'center', marginTop: 18 },
  linkBtnText: { color: '#1a56db', fontSize: 15 },
});
