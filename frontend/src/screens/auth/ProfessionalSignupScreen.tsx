import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { authExtApi } from '../../services/api';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DRAFT_KEY = 'pro_signup_draft';

const SERVICE_TYPES = [
  'Oil Change', 'Tire Service', 'Battery', 'Brakes',
  'Locksmith', 'Engine Diagnostics', 'AC Repair', 'Transmission',
  'Electrical', 'Suspension', 'Exhaust', 'Diesel Repair',
  'Diesel Diagnostic', 'General Repair',
];

const STEPS = ['Account', 'Business', 'Tier', 'Services', 'Done'];

const TIERS = [
  {
    id: 'basic',
    label: '🔧 Basic Technician',
    subtitle: 'No certification required',
    desc: 'Flat tire, oil change, battery, brakes, wipers, air filter, jump start',
    color: '#10b981',
  },
  {
    id: 'certified',
    label: '🏅 Certified Mechanic',
    subtitle: 'ASE or equivalent certification',
    desc: 'Everything in Basic + engine diagnostics, AC, transmission, suspension, electrical',
    color: '#1a56db',
  },
  {
    id: 'master',
    label: '⭐ Master Technician',
    subtitle: 'Master ASE or manufacturer cert',
    desc: 'All job types — no restrictions',
    color: '#f59e0b',
  },
];

export default function ProfessionalSignupScreen() {
  const router = useRouter();
  const { loadUser } = useAuthStore();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [draftLoaded, setDraftLoaded] = useState(false);

  // Step 0 — Account
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [phone, setPhone] = useState('');

  // Step 1 — Business
  const [businessName, setBusinessName] = useState('');
  const [bio, setBio] = useState('');
  const [radius, setRadius] = useState('25');

  // Step 2 — Tier
  const [tier, setTier] = useState('basic');

  // Step 3 — Services
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [hasGarage, setHasGarage] = useState(false);

  // Restore draft on mount
  useEffect(() => {
    AsyncStorage.getItem(DRAFT_KEY).then(raw => {
      if (raw) {
        try {
          const d = JSON.parse(raw);
          if (d.step !== undefined && d.step < 3) setStep(d.step);
          if (d.email) setEmail(d.email);
          if (d.phone) setPhone(d.phone);
          if (d.businessName) setBusinessName(d.businessName);
          if (d.bio) setBio(d.bio);
          if (d.radius) setRadius(d.radius);
          if (d.tier) setTier(d.tier);
          if (d.selectedServices) setSelectedServices(d.selectedServices);
        } catch {}
      }
      setDraftLoaded(true);
    });
  }, []);

  // Persist draft whenever any field changes (skip passwords for security)
  const saveDraft = useCallback(() => {
    AsyncStorage.setItem(DRAFT_KEY, JSON.stringify({
      step, email, phone, businessName, bio, radius, tier, selectedServices,
    }));
  }, [step, email, phone, businessName, bio, radius, selectedServices]);

  useEffect(() => {
    if (draftLoaded && step < 3) saveDraft();
  }, [step, email, phone, businessName, bio, radius, selectedServices, draftLoaded]);

  const clearDraft = () => AsyncStorage.removeItem(DRAFT_KEY);

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
    if (step < 3) { setStep(s => s + 1); return; }
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
        tier,
        specialties: selectedServices,
        has_garage: hasGarage,
      });
      await SecureStore.setItemAsync('accessToken', data.accessToken);
      await SecureStore.setItemAsync('refreshToken', data.refreshToken);
      await loadUser();
      await clearDraft();
      setStep(3);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const progressPct = (step / 4) * 100;

  if (!draftLoaded) return <ActivityIndicator style={{ flex: 1 }} />;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">

        {step < 3 && (
          <View style={styles.header}>
            <TouchableOpacity onPress={() => step > 0 ? setStep(s => s - 1) : router.back()} style={styles.backBtn}>
              <Text style={styles.backArrow}>←</Text>
            </TouchableOpacity>
            <Text style={styles.stepLabel}>{STEPS[step]} · Step {step + 1} of 4</Text>
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

        {/* ── Step 2: Tier ── */}
        {step === 2 && (
          <View style={styles.stepContent}>
            <Text style={styles.title}>Your Skill Level</Text>
            <Text style={styles.subtitle}>Choose the tier that matches your experience. You'll only see jobs you're qualified for.</Text>

            {TIERS.map(t => (
              <TouchableOpacity
                key={t.id}
                style={[styles.tierCard, tier === t.id && { borderColor: t.color, backgroundColor: '#1e293b' }]}
                onPress={() => setTier(t.id)}
              >
                <View style={styles.tierHeader}>
                  <Text style={[styles.tierLabel, tier === t.id && { color: t.color }]}>{t.label}</Text>
                  {tier === t.id && <Text style={[styles.tierCheck, { color: t.color }]}>✓</Text>}
                </View>
                <Text style={styles.tierSubtitle}>{t.subtitle}</Text>
                <Text style={styles.tierDesc}>{t.desc}</Text>
              </TouchableOpacity>
            ))}

            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                📋 Certified and Master tiers require you to upload proof of certification in your profile. Admin will verify before unlocking those job types.
              </Text>
            </View>
          </View>
        )}

        {/* ── Step 3: Services ── */}
        {step === 3 && (
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

            <TouchableOpacity
              style={[styles.garageToggle, hasGarage && styles.garageToggleActive]}
              onPress={() => setHasGarage(g => !g)}
            >
              <Text style={styles.garageIcon}>{hasGarage ? '✅' : '🏚️'}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.garageTitle}>I have a garage / heavy equipment</Text>
                <Text style={styles.garageSub}>
                  Unlocks big jobs like transmission rebuilds. Requires a garage, trailer lift, or transmission jack.
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Step 4: Done ── */}
        {step === 4 && (
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
            <TouchableOpacity style={styles.promoBtn} onPress={() => router.push('/promo')}>
              <Text style={styles.promoBtnText}>🔑 Have a Promo Code?</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Navigation button */}
        {step < 4 && (
          <View style={styles.footer}>
            <TouchableOpacity style={styles.primaryBtn} onPress={nextStep} disabled={loading}>
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.primaryBtnText}>{step === 3 ? 'Create Account' : 'Continue →'}</Text>
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
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 56, paddingHorizontal: 20, paddingBottom: 8 },
  backBtn: { marginRight: 12 },
  backArrow: { fontSize: 26, color: '#cbd5e1' },
  stepLabel: { fontSize: 13, color: '#64748b', fontWeight: '500' },
  progressTrack: { height: 4, backgroundColor: '#0f172a', marginHorizontal: 20, borderRadius: 2, marginBottom: 24 },
  progressFill: { height: 4, backgroundColor: '#1a56db', borderRadius: 2 },
  stepContent: { paddingHorizontal: 24 },
  title: { fontSize: 26, fontWeight: '800', color: '#f1f5f9', marginBottom: 8 },
  subtitle: { fontSize: 15, color: '#94a3b8', lineHeight: 22, marginBottom: 28 },
  label: { fontSize: 13, fontWeight: '600', color: '#cbd5e1', marginBottom: 6, marginTop: 8 },
  input: {
    borderWidth: 1.5, borderColor: '#334155', borderRadius: 12,
    padding: 15, fontSize: 15, marginBottom: 6, backgroundColor: '#0f172a',
  },
  textarea: { minHeight: 100 },
  radiusRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap', marginBottom: 20 },
  radiusChip: {
    paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20,
    borderWidth: 1.5, borderColor: '#334155', backgroundColor: '#0f172a',
  },
  radiusChipActive: { borderColor: '#1a56db', backgroundColor: '#1e3a5f' },
  radiusChipText: { color: '#94a3b8', fontWeight: '500' },
  radiusChipTextActive: { color: '#1a56db', fontWeight: '700' },
  infoBox: { backgroundColor: '#1e293b', borderRadius: 12, padding: 14, marginTop: 8 },
  infoText: { color: '#94a3b8', fontSize: 13, lineHeight: 20 },
  tierCard: {
    borderWidth: 1.5, borderColor: '#334155', borderRadius: 14,
    padding: 16, marginBottom: 12, backgroundColor: '#0f172a',
  },
  tierHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  tierLabel: { fontSize: 16, fontWeight: '700', color: '#f1f5f9' },
  tierCheck: { fontSize: 18, fontWeight: '700' },
  tierSubtitle: { fontSize: 12, color: '#64748b', marginBottom: 6, fontWeight: '500' },
  tierDesc: { fontSize: 13, color: '#94a3b8', lineHeight: 18 },
  servicesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  garageToggle: {
    flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 20,
    backgroundColor: '#1e293b', borderRadius: 12, padding: 14,
    borderWidth: 1.5, borderColor: '#334155',
  },
  garageToggleActive: { borderColor: '#10b981', backgroundColor: '#123c2e' },
  garageIcon: { fontSize: 24 },
  garageTitle: { color: '#f1f5f9', fontWeight: '700', fontSize: 14 },
  garageSub: { color: '#94a3b8', fontSize: 12, marginTop: 2, lineHeight: 16 },
  serviceChip: {
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20,
    borderWidth: 1.5, borderColor: '#334155', backgroundColor: '#0f172a',
  },
  serviceChipActive: { borderColor: '#1a56db', backgroundColor: '#1e3a5f' },
  serviceChipText: { color: '#94a3b8', fontSize: 14 },
  serviceChipTextActive: { color: '#1a56db', fontWeight: '600' },
  doneContent: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  doneIcon: {
    width: 100, height: 100, borderRadius: 50, backgroundColor: '#1e3a5f',
    alignItems: 'center', justifyContent: 'center', marginBottom: 24,
  },
  doneEmoji: { fontSize: 48 },
  doneTitle: { fontSize: 30, fontWeight: '800', color: '#f1f5f9', marginBottom: 12 },
  doneSubtitle: { fontSize: 15, color: '#94a3b8', textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  doneSteps: { alignSelf: 'stretch', gap: 12, marginBottom: 32 },
  doneStep: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#0f172a', borderRadius: 12, padding: 14 },
  doneStepIcon: { fontSize: 22 },
  doneStepText: { flex: 1, fontSize: 14, color: '#cbd5e1' },
  footer: { padding: 24, paddingTop: 16 },
  primaryBtn: {
    backgroundColor: '#1a56db', borderRadius: 14, padding: 17, alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  linkBtn: { alignItems: 'center', marginTop: 18 },
  linkBtnText: { color: '#1a56db', fontSize: 15 },
  promoBtn: { alignItems: 'center', marginTop: 14, padding: 10 },
  promoBtnText: { color: '#1a56db', fontSize: 15, fontWeight: '600' },
});
