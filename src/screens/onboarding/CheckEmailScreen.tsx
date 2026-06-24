import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/types';
import { colors, typography, spacing } from '@/theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'CheckEmail'>;

function EnvelopeIcon() {
  return (
    <View style={icon.wrap}>
      <View style={icon.body}>
        <View style={icon.flap} />
      </View>
    </View>
  );
}

const icon = StyleSheet.create({
  wrap: { width: 80, height: 80, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.blueSoft, borderRadius: 40 },
  body: { width: 44, height: 30, borderRadius: 4, backgroundColor: colors.blue, alignItems: 'center', justifyContent: 'flex-start', overflow: 'hidden' },
  flap: { width: 0, height: 0, borderLeftWidth: 22, borderRightWidth: 22, borderTopWidth: 16, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: colors.blueInk },
});

export function CheckEmailScreen({ route, navigation }: Props) {
  const { email, mode } = route.params;
  const isSignup = mode === 'signup';

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.content}>
          <EnvelopeIcon />
          <Text style={styles.title}>
            {isSignup ? 'Verify your email' : 'Check your email'}
          </Text>
          <Text style={styles.body}>
            {isSignup
              ? `We sent a verification link to\n${email}\n\nOpen it to activate your account, then come back here to continue.`
              : `We sent a password reset link to\n${email}\n\nOpen it to set a new password.`
            }
          </Text>
          {isSignup && (
            <Text style={styles.note}>
              Can't find it? Check your spam folder.
            </Text>
          )}
        </View>
        <View style={styles.actions}>
          {isSignup ? (
            <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate('SignIn')}>
              <Text style={styles.btnText}>I verified my email — Sign in</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate('SignIn')}>
              <Text style={styles.btnText}>Back to sign in</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => navigation.navigate('Welcome')}>
            <Text style={styles.secondary}>Go back to start</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  container: { flex: 1, paddingHorizontal: spacing.screenH, paddingBottom: 40, justifyContent: 'space-between' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20 },
  title: { ...typography.sectionH, color: colors.ink, textAlign: 'center' },
  body: { ...typography.body, color: colors.body, textAlign: 'center', lineHeight: 24 },
  note: { ...typography.caption, color: colors.muted, textAlign: 'center' },
  actions: { gap: 16 },
  btn: { height: 56, borderRadius: 15, backgroundColor: colors.blue, alignItems: 'center', justifyContent: 'center' },
  btnText: { ...typography.bodyMed, color: colors.white },
  secondary: { ...typography.body, color: colors.muted, textAlign: 'center' },
});
