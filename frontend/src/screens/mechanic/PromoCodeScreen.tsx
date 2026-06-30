import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '../../services/api';

export default function PromoCodeScreen() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [redeemed, setRedeemed] = useState(false);
  const [promoInfo, setPromoInfo] = useState<{ description: string; type: string } | null>(null);

  const handleRedeem = async () => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return Alert.alert('Enter a code', 'Please enter your promo code first.');
    setLoading(true);
    try {
      const { data } = await api.post('/promo/redeem', { code: trimmed });
      setPromoInfo(data);
      setRedeemed(true);
    } catch (err: any) {
      Alert.alert('Invalid Code', err.response?.data?.error || 'This code is not valid or has expired.');
    } finally {
      setLoading(false);
    }
  };

  if (redeemed && promoInfo) {
    return (
      <View style={styles.successContainer}>
        <View style={styles.successIcon}><Text style={styles.successEmoji}>🎉</Text></View>
        <Text style={styles.successTitle}>Code Activated!</Text>
        <Text style={styles.successDesc}>{promoInfo.description}</Text>
        {promoInfo.type === 'free_access' && (
          <View style={styles.benefitCard}>
            <Text style={styles.benefitTitle}>Your Beta Perks</Text>
            <View style={styles.benefitRow}><Text style={styles.benefitDot}>✓</Text><Text style={styles.benefitText}>Free platform access during beta</Text></View>
            <View style={styles.benefitRow}><Text style={styles.benefitDot}>✓</Text><Text style={styles.benefitText}>Priority support from our team</Text></View>
            <View style={styles.benefitRow}><Text style={styles.benefitDot}>✓</Text><Text style={styles.benefitText}>Shape the app with your feedback</Text></View>
            <View style={styles.benefitRow}><Text style={styles.benefitDot}>✓</Text><Text style={styles.benefitText}>Early access to new features</Text></View>
          </View>
        )}
        <TouchableOpacity style={styles.primaryBtn} onPress={() => router.replace('/(tabs)')}>
          <Text style={styles.primaryBtnText}>Go to Dashboard →</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.inner}>
        <Text style={styles.headerEmoji}>🔑</Text>
        <Text style={styles.title}>Have a Promo Code?</Text>
        <Text style={styles.subtitle}>
          If you received an early access code, enter it here to unlock free beta access.
        </Text>

        <TextInput
          style={styles.input}
          value={code}
          onChangeText={(t) => setCode(t.toUpperCase())}
          placeholder="e.g. MECH-A3F7-2024"
          placeholderTextColor="#9ca3af"
          autoCapitalize="characters"
          autoCorrect={false}
          returnKeyType="done"
          onSubmitEditing={handleRedeem}
        />

        <TouchableOpacity
          style={[styles.redeemBtn, !code.trim() && styles.redeemBtnDisabled]}
          onPress={handleRedeem}
          disabled={loading || !code.trim()}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.redeemBtnText}>Activate Code</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()} style={styles.skipBtn}>
          <Text style={styles.skipBtnText}>Skip — I don't have a code</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  inner: { flex: 1, padding: 28, justifyContent: 'center' },
  headerEmoji: { fontSize: 52, textAlign: 'center', marginBottom: 16 },
  title: { fontSize: 28, fontWeight: '800', color: '#f1f5f9', textAlign: 'center', marginBottom: 10 },
  subtitle: { fontSize: 15, color: '#94a3b8', textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  input: {
    borderWidth: 2, borderColor: '#1a56db', borderRadius: 14,
    padding: 16, fontSize: 20, color: '#f1f5f9', textAlign: 'center',
    letterSpacing: 2, fontWeight: '700', marginBottom: 16, backgroundColor: '#f0f7ff',
  },
  redeemBtn: { backgroundColor: '#1a56db', borderRadius: 14, padding: 17, alignItems: 'center', marginBottom: 12 },
  redeemBtnDisabled: { backgroundColor: '#93c5fd' },
  redeemBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  skipBtn: { alignItems: 'center', padding: 12 },
  skipBtnText: { color: '#64748b', fontSize: 14 },
  successContainer: { flex: 1, backgroundColor: '#0f172a', padding: 28, justifyContent: 'center', alignItems: 'center' },
  successIcon: {
    width: 100, height: 100, borderRadius: 50, backgroundColor: '#f0fdf4',
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  successEmoji: { fontSize: 48 },
  successTitle: { fontSize: 30, fontWeight: '800', color: '#f1f5f9', marginBottom: 10 },
  successDesc: { fontSize: 15, color: '#94a3b8', textAlign: 'center', marginBottom: 24, lineHeight: 22 },
  benefitCard: {
    backgroundColor: '#f0fdf4', borderRadius: 14, padding: 20,
    alignSelf: 'stretch', marginBottom: 28,
  },
  benefitTitle: { fontSize: 15, fontWeight: '700', color: '#166534', marginBottom: 12 },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  benefitDot: { color: '#10b981', fontWeight: '700', fontSize: 16 },
  benefitText: { fontSize: 14, color: '#cbd5e1' },
  primaryBtn: { backgroundColor: '#1a56db', borderRadius: 14, padding: 17, alignItems: 'center', alignSelf: 'stretch' },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
