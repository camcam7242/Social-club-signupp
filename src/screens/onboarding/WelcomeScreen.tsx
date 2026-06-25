import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/types';
import { PrimaryBtn } from '@/components/PrimaryBtn';
import { colors, typography, spacing } from '@/theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'Welcome'>;

function Logo() {
  return (
    <View style={logo.wrap}>
      {[0,60,120,180,240,300].map((deg, i) => (
        <View key={i} style={[logo.dot, {
          transform: [{ rotate: `${deg}deg` }, { translateX: 14 }],
        }]} />
      ))}
      <View style={logo.centerDot} />
    </View>
  );
}

const logo = StyleSheet.create({
  wrap: { width: 64, height: 64, alignItems: 'center', justifyContent: 'center' },
  dot: { position: 'absolute', width: 16, height: 16, borderRadius: 8, backgroundColor: colors.blue, opacity: 0.85 },
  centerDot: { width: 18, height: 18, borderRadius: 9, backgroundColor: colors.blue },
});

export function WelcomeScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.hero}>
          <Logo />
          <Text style={styles.brand}>glamr</Text>
          <Text style={styles.tagline}>Grow your beauty &{'\n'}wellness business</Text>
          <Text style={styles.sub}>
            Connect with clients, manage bookings,{'\n'}and get paid — all in one place.
          </Text>
        </View>
        <View style={styles.actions}>
          <PrimaryBtn label="Get started" onPress={() => navigation.navigate('CreateAccount')} />
          <TouchableOpacity onPress={() => navigation.navigate('SignIn')}>
            <Text style={styles.login}>
              Already have an account?{' '}
              <Text style={styles.loginLink}>Sign in</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  container: { flex: 1, paddingHorizontal: spacing.screenH, justifyContent: 'space-between', paddingBottom: 40 },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  brand: { fontSize: 36, fontWeight: '800', color: colors.blue, letterSpacing: -1 },
  tagline: { ...typography.heroH, color: colors.ink, textAlign: 'center' },
  sub: { ...typography.body, color: colors.muted, textAlign: 'center', lineHeight: 22 },
  actions: { gap: 20 },
  login: { ...typography.body, color: colors.muted, textAlign: 'center' },
  loginLink: { color: colors.blue, fontWeight: '600' },
});
