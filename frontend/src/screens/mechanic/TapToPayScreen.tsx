import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert, Animated, Easing, Platform,
} from 'react-native';
import {
  useStripeTerminal,
  Location,
  Reader,
} from '@stripe/stripe-terminal-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { api, jobApi } from '../../services/api';

type Stage =
  | 'init'
  | 'discovering'
  | 'ready'
  | 'waiting_tap'
  | 'processing'
  | 'success'
  | 'error';

export default function TapToPayScreen() {
  const { jobId } = useLocalSearchParams<{ jobId: string }>();
  const router = useRouter();

  const [stage, setStage] = useState<Stage>('init');
  const [errorMsg, setErrorMsg] = useState('');
  const [paymentIntentId, setPaymentIntentId] = useState('');
  const ripple = useState(new Animated.Value(0))[0];

  const { data: job } = useQuery({
    queryKey: ['job', jobId],
    queryFn: async () => (await jobApi.get(jobId)).data,
  });

  const {
    initialize,
    discoverReaders,
    connectLocalMobileReader,
    collectPaymentMethod,
    confirmPaymentIntent,
    cancelCollectPaymentMethod,
    connectedReader,
  } = useStripeTerminal({
    onUpdateDiscoveredReaders: async (readers: Reader.Type[]) => {
      // Tap to Pay on iPhone = local mobile reader
      const localReader = readers.find(r => r.deviceType === 'tapToPay');
      if (!localReader) return;
      const { error } = await connectLocalMobileReader({
        reader: localReader,
        locationId: localReader.locationId || '',
      });
      if (!error) setStage('ready');
    },
  });

  // Ripple animation while waiting for tap
  useEffect(() => {
    if (stage !== 'waiting_tap') return;
    const anim = Animated.loop(
      Animated.timing(ripple, {
        toValue: 1,
        duration: 1500,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      })
    );
    anim.start();
    return () => anim.stop();
  }, [stage]);

  const setup = useCallback(async () => {
    setStage('init');
    try {
      // Fetch connection token from backend
      const tokenFetcher = async () => {
        const { data } = await api.post('/terminal/connection-token');
        return data.secret;
      };

      const { error: initError } = await initialize({ fetchConnectionToken: tokenFetcher });
      if (initError) throw new Error(initError.message);

      setStage('discovering');

      const { error: discoverError } = await discoverReaders({
        discoveryMethod: 'localMobile',
        simulated: __DEV__, // use simulator in dev, real NFC in prod
      });
      if (discoverError) throw new Error(discoverError.message);
    } catch (e: any) {
      setErrorMsg(e.message || 'Setup failed');
      setStage('error');
    }
  }, []);

  useEffect(() => { setup(); }, []);

  const startPayment = async () => {
    if (!job) return;
    setStage('waiting_tap');
    try {
      // Create terminal PaymentIntent on backend
      const { data } = await api.post('/terminal/payment-intent', { jobId });
      setPaymentIntentId(data.paymentIntentId);

      // Collect payment — user taps card/phone on screen
      const { error: collectError, paymentIntent } = await collectPaymentMethod({
        paymentIntentClientSecret: data.clientSecret,
        skipTipping: true,
      });

      if (collectError) {
        if (collectError.code === 'Canceled') { setStage('ready'); return; }
        throw new Error(collectError.message);
      }

      setStage('processing');

      const { error: confirmError } = await confirmPaymentIntent({ paymentIntent: paymentIntent! });
      if (confirmError) throw new Error(confirmError.message);

      // Notify backend payment captured
      await api.post('/terminal/capture', { paymentIntentId: data.paymentIntentId, jobId });

      setStage('success');
    } catch (e: any) {
      setErrorMsg(e.message || 'Payment failed');
      setStage('error');
    }
  };

  const handleCancel = async () => {
    if (stage === 'waiting_tap') await cancelCollectPaymentMethod();
    setStage('ready');
  };

  const amount = job ? parseFloat(job.price || '0') : 0;

  const rippleScale = ripple.interpolate({ inputRange: [0, 1], outputRange: [1, 2.4] });
  const rippleOpacity = ripple.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] });

  return (
    <View style={styles.container}>
      {/* Amount */}
      <View style={styles.amountRow}>
        <Text style={styles.currency}>$</Text>
        <Text style={styles.amount}>{amount.toFixed(2)}</Text>
      </View>
      <Text style={styles.serviceLabel}>{job?.service_type} · {job?.year} {job?.make} {job?.model}</Text>

      {/* Stage content */}
      <View style={styles.stageArea}>

        {(stage === 'init' || stage === 'discovering') && (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#1a56db" />
            <Text style={styles.stageText}>
              {stage === 'init' ? 'Initialising reader...' : 'Setting up tap to pay...'}
            </Text>
          </View>
        )}

        {stage === 'ready' && (
          <View style={styles.centered}>
            <View style={styles.nfcIcon}>
              <Text style={styles.nfcEmoji}>📲</Text>
            </View>
            <Text style={styles.readyTitle}>Ready to Accept Payment</Text>
            <Text style={styles.readySubtitle}>
              Tap the button below, then ask your customer to hold their card or phone near the top of your iPhone.
            </Text>
            <TouchableOpacity style={styles.collectBtn} onPress={startPayment}>
              <Text style={styles.collectBtnText}>Collect Payment</Text>
            </TouchableOpacity>
          </View>
        )}

        {stage === 'waiting_tap' && (
          <View style={styles.centered}>
            <View style={styles.rippleContainer}>
              <Animated.View style={[
                styles.ripple,
                { transform: [{ scale: rippleScale }], opacity: rippleOpacity }
              ]} />
              <View style={styles.nfcCircle}>
                <Text style={styles.nfcCircleEmoji}>💳</Text>
              </View>
            </View>
            <Text style={styles.tapTitle}>Hold card near top of phone</Text>
            <Text style={styles.tapSubtitle}>
              Works with contactless cards, Apple Pay, and Google Pay
            </Text>
            <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}

        {stage === 'processing' && (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#1a56db" />
            <Text style={styles.stageText}>Processing payment...</Text>
          </View>
        )}

        {stage === 'success' && (
          <View style={styles.centered}>
            <View style={styles.successCircle}>
              <Text style={styles.successCheck}>✓</Text>
            </View>
            <Text style={styles.successTitle}>Payment Received!</Text>
            <Text style={styles.successAmount}>${amount.toFixed(2)}</Text>
            <Text style={styles.successSubtitle}>The customer's card was charged successfully.</Text>
            <TouchableOpacity
              style={styles.doneBtn}
              onPress={() => router.replace('/(tabs)')}
            >
              <Text style={styles.doneBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        )}

        {stage === 'error' && (
          <View style={styles.centered}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorTitle}>Payment Failed</Text>
            <Text style={styles.errorMsg}>{errorMsg}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={setup}>
              <Text style={styles.retryBtnText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {Platform.OS === 'ios' && stage === 'ready' && (
        <Text style={styles.footerNote}>
          Tap to Pay on iPhone · Powered by Stripe Terminal
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', padding: 24 },
  amountRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center', marginTop: 48 },
  currency: { fontSize: 28, color: '#94a3b8', marginTop: 10, fontWeight: '600' },
  amount: { fontSize: 72, color: '#fff', fontWeight: '800', letterSpacing: -2 },
  serviceLabel: { color: '#64748b', fontSize: 15, textAlign: 'center', marginBottom: 40 },
  stageArea: { flex: 1, justifyContent: 'center' },
  centered: { alignItems: 'center' },
  stageText: { color: '#94a3b8', fontSize: 16, marginTop: 16 },
  nfcIcon: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: '#1e293b', alignItems: 'center', justifyContent: 'center',
    marginBottom: 24,
  },
  nfcEmoji: { fontSize: 44 },
  readyTitle: { fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 12 },
  readySubtitle: { color: '#64748b', fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 32, paddingHorizontal: 16 },
  collectBtn: {
    backgroundColor: '#1a56db', borderRadius: 16, paddingVertical: 18,
    paddingHorizontal: 48,
  },
  collectBtnText: { color: '#fff', fontWeight: '700', fontSize: 17 },
  rippleContainer: { width: 160, height: 160, alignItems: 'center', justifyContent: 'center', marginBottom: 32 },
  ripple: {
    position: 'absolute', width: 120, height: 120, borderRadius: 60,
    backgroundColor: '#1a56db',
  },
  nfcCircle: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: '#1a56db', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#1a56db', shadowOpacity: 0.6, shadowRadius: 20, elevation: 12,
  },
  nfcCircleEmoji: { fontSize: 40 },
  tapTitle: { fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 10 },
  tapSubtitle: { color: '#64748b', fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 32, paddingHorizontal: 20 },
  cancelBtn: { borderWidth: 1, borderColor: '#334155', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 32 },
  cancelBtnText: { color: '#64748b', fontSize: 15 },
  successCircle: {
    width: 100, height: 100, borderRadius: 50, backgroundColor: '#10b981',
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
    shadowColor: '#10b981', shadowOpacity: 0.5, shadowRadius: 20, elevation: 12,
  },
  successCheck: { color: '#fff', fontSize: 48, fontWeight: '700' },
  successTitle: { fontSize: 26, fontWeight: '800', color: '#fff', marginBottom: 6 },
  successAmount: { fontSize: 20, color: '#10b981', fontWeight: '700', marginBottom: 10 },
  successSubtitle: { color: '#64748b', fontSize: 14, textAlign: 'center', marginBottom: 36 },
  doneBtn: { backgroundColor: '#10b981', borderRadius: 16, paddingVertical: 16, paddingHorizontal: 56 },
  doneBtnText: { color: '#fff', fontWeight: '700', fontSize: 17 },
  errorIcon: { fontSize: 52, marginBottom: 16 },
  errorTitle: { fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 8 },
  errorMsg: { color: '#94a3b8', fontSize: 14, textAlign: 'center', marginBottom: 32, paddingHorizontal: 20 },
  retryBtn: { backgroundColor: '#1e293b', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 40 },
  retryBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  footerNote: { color: '#334155', fontSize: 12, textAlign: 'center', marginBottom: 16 },
});
