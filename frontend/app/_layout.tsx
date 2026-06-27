import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StripeProvider } from '@stripe/stripe-react-native';
import { StripeTerminalProvider } from '@stripe/stripe-terminal-react-native';
import { useAuthStore } from '../src/store/authStore';
import { useSocketStore } from '../src/store/socketStore';
import { usePushNotifications } from '../src/hooks/usePushNotifications';
import { api } from '../src/services/api';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

const STRIPE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';

async function fetchTokenProvider(): Promise<string> {
  try {
    const { data } = await api.post('/terminal/connection-token');
    return data.secret;
  } catch {
    return '';
  }
}

export default function RootLayout() {
  const loadUser = useAuthStore((s) => s.loadUser);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { connect, disconnect } = useSocketStore();

  usePushNotifications();

  useEffect(() => { loadUser(); }, []);

  useEffect(() => {
    if (isAuthenticated) connect();
    else disconnect();
  }, [isAuthenticated]);

  return (
    <StripeProvider
      publishableKey={STRIPE_KEY}
      merchantIdentifier="merchant.com.mechanicmarketplace"
      urlScheme="mechanic-marketplace"
    >
      <StripeTerminalProvider logLevel="verbose" tokenProvider={fetchTokenProvider}>
      <QueryClientProvider client={queryClient}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="requests/[id]" options={{ headerShown: true, title: 'Request Details' }} />
          <Stack.Screen name="jobs/[id]" options={{ headerShown: true, title: 'Job Status' }} />
          <Stack.Screen name="track/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="pay/[jobId]" options={{ headerShown: true, title: 'Payment' }} />
          <Stack.Screen name="review/[jobId]" options={{ headerShown: true, title: 'Leave a Review' }} />
          <Stack.Screen name="tap-pay/[jobId]" options={{ headerShown: false }} />
          <Stack.Screen name="chat/[jobId]" options={{ headerShown: true, title: 'Chat' }} />
          <Stack.Screen name="mechanic-docs" options={{ headerShown: true, title: 'My Documents' }} />
          <Stack.Screen name="availability" options={{ headerShown: true, title: 'Availability' }} />
          <Stack.Screen name="earnings" options={{ headerShown: true, title: 'Earnings' }} />
          <Stack.Screen name="receipt/[jobId]" options={{ headerShown: true, title: 'Receipt' }} />
          <Stack.Screen name="promo" options={{ headerShown: true, title: 'Promo Code' }} />
        </Stack>
      </QueryClientProvider>
      </StripeTerminalProvider>
    </StripeProvider>
  );
}
