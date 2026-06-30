import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert, Platform,
} from 'react-native';
import {
  useStripe,
  useApplePay,
  ApplePayButton,
  isPlatformPaySupported,
  usePlatformPay,
  PlatformPayButton,
  PlatformPay,
} from '@stripe/stripe-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { jobApi, paymentApi } from '../../services/api';

export default function PaymentScreen() {
  const { jobId } = useLocalSearchParams<{ jobId: string }>();
  const router = useRouter();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const { isPlatformPaySupported: nativePaySupported, confirmPlatformPayPayment } = usePlatformPay();

  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [platformPayReady, setPlatformPayReady] = useState(false);

  const { data: job } = useQuery({
    queryKey: ['job', jobId],
    queryFn: async () => (await jobApi.get(jobId)).data,
  });

  useEffect(() => {
    (async () => {
      try {
        const { data } = await paymentApi.createIntent(jobId);
        setClientSecret(data.clientSecret);

        // Init Stripe payment sheet (covers cards + Apple Pay + Google Pay)
        const { error } = await initPaymentSheet({
          merchantDisplayName: 'Mechanic Marketplace',
          paymentIntentClientSecret: data.clientSecret,
          applePay: {
            merchantCountryCode: 'US',
          },
          googlePay: {
            merchantCountryCode: 'US',
            testEnv: process.env.NODE_ENV !== 'production',
          },
          style: 'automatic',
          defaultBillingDetails: {},
        });

        if (error) throw new Error(error.message);

        const supported = await nativePaySupported({
          googlePay: { testEnv: true },
        });
        setPlatformPayReady(supported);
      } catch (err: any) {
        Alert.alert('Error', err.message || 'Could not load payment');
      } finally {
        setLoading(false);
      }
    })();
  }, [jobId]);

  const handleApplePay = async () => {
    if (!clientSecret || !job) return;
    setPaying(true);
    try {
      const amount = Math.round(parseFloat(job.price) * 100);
      const { error } = await confirmPlatformPayPayment(clientSecret, {
        applePay: {
          cartItems: [
            {
              label: job.service_type || 'Vehicle Service',
              amount: (amount / 100).toFixed(2),
              paymentType: PlatformPay.PaymentType.Final,
            },
            {
              label: 'Platform Fee (15%)',
              amount: ((amount * 0.15) / 100).toFixed(2),
              paymentType: PlatformPay.PaymentType.Final,
            },
          ],
          merchantCountryCode: 'US',
          currencyCode: 'USD',
          requiredBillingContactFields: [],
        },
      });

      if (error) {
        if (error.code !== 'Canceled') {
          Alert.alert('Payment Failed', error.message);
        }
        return;
      }

      onPaymentSuccess();
    } finally {
      setPaying(false);
    }
  };

  const handlePaymentSheet = async () => {
    setPaying(true);
    try {
      const { error } = await presentPaymentSheet();
      if (error) {
        if (error.code !== 'Canceled') {
          Alert.alert('Payment Failed', error.message);
        }
        return;
      }
      onPaymentSuccess();
    } finally {
      setPaying(false);
    }
  };

  const onPaymentSuccess = () => {
    router.replace(`/review/${jobId}`);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1a56db" />
        <Text style={styles.loadingText}>Preparing payment...</Text>
      </View>
    );
  }

  const amount = job ? parseFloat(job.price) : 0;
  const fee = amount * 0.15;
  const total = amount;

  return (
    <View style={styles.container}>
      {/* Receipt summary */}
      <View style={styles.receipt}>
        <Text style={styles.receiptTitle}>Payment Summary</Text>

        <View style={styles.receiptRow}>
          <Text style={styles.receiptLabel}>{job?.service_type || 'Service'}</Text>
          <Text style={styles.receiptValue}>${amount.toFixed(2)}</Text>
        </View>
        <View style={styles.receiptRow}>
          <Text style={styles.receiptLabel}>
            {job?.year} {job?.make} {job?.model}
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.receiptRow}>
          <Text style={styles.receiptTotalLabel}>Total</Text>
          <Text style={styles.receiptTotal}>${total.toFixed(2)}</Text>
        </View>
      </View>

      {/* Apple Pay / Google Pay native button */}
      {platformPayReady && (
        <View style={styles.nativePayContainer}>
          <PlatformPayButton
            onPress={handleApplePay}
            type={
              Platform.OS === 'ios'
                ? PlatformPay.ButtonType.Pay
                : PlatformPay.ButtonType.Pay
            }
            appearance={
              Platform.OS === 'ios'
                ? PlatformPay.ButtonStyle.Black
                : PlatformPay.ButtonStyle.Black
            }
            borderRadius={14}
            style={styles.platformPayBtn}
            disabled={paying}
          />
          <View style={styles.orRow}>
            <View style={styles.orLine} />
            <Text style={styles.orText}>or pay another way</Text>
            <View style={styles.orLine} />
          </View>
        </View>
      )}

      {/* Card / other methods */}
      <TouchableOpacity
        style={[styles.cardBtn, paying && styles.cardBtnDisabled]}
        onPress={handlePaymentSheet}
        disabled={paying}
      >
        {paying
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.cardBtnText}>💳  Pay with Card</Text>
        }
      </TouchableOpacity>

      <Text style={styles.secureNote}>🔒  Payments secured by Stripe</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', padding: 20 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' },
  loadingText: { marginTop: 12, color: '#94a3b8', fontSize: 15 },
  receipt: {
    backgroundColor: '#0f172a', borderRadius: 16, padding: 20, marginBottom: 24,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 3,
  },
  receiptTitle: { fontSize: 16, fontWeight: '700', color: '#f1f5f9', marginBottom: 16 },
  receiptRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  receiptLabel: { fontSize: 15, color: '#cbd5e1' },
  receiptValue: { fontSize: 15, color: '#cbd5e1', fontWeight: '500' },
  divider: { height: 1, backgroundColor: '#e5e7eb', marginVertical: 12 },
  receiptTotalLabel: { fontSize: 17, fontWeight: '700', color: '#f1f5f9' },
  receiptTotal: { fontSize: 22, fontWeight: '800', color: '#1a56db' },
  nativePayContainer: { marginBottom: 12 },
  platformPayBtn: { width: '100%', height: 56 },
  orRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 16, marginBottom: 4 },
  orLine: { flex: 1, height: 1, backgroundColor: '#e5e7eb' },
  orText: { color: '#64748b', fontSize: 13 },
  cardBtn: {
    backgroundColor: '#1a56db', borderRadius: 14, padding: 18,
    alignItems: 'center', marginTop: 8,
  },
  cardBtnDisabled: { backgroundColor: '#93c5fd' },
  cardBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  secureNote: { textAlign: 'center', color: '#64748b', fontSize: 13, marginTop: 20 },
});
