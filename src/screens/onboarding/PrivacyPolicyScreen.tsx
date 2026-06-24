import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/types';
import { TopBar } from '@/components/TopBar';
import { colors, typography, spacing } from '@/theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'PrivacyPolicy'>;

function Section({ title, children }: { title: string; children: string }) {
  return (
    <View style={s.section}>
      <Text style={s.heading}>{title}</Text>
      <Text style={s.body}>{children}</Text>
    </View>
  );
}

export function PrivacyPolicyScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={s.safe}>
      <TopBar title="Privacy Policy" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={s.container}>
        <Text style={s.updated}>Last updated: June 2025</Text>

        <Section title="1. Information We Collect">
          {'We collect information you provide directly to us, such as when you create an account, complete your profile, or contact us. This includes your name, email address, phone number, and payment information.\n\nWe also collect information automatically when you use the app, including device information, usage data, and location data (with your permission).'}
        </Section>

        <Section title="2. How We Use Your Information">
          {'We use the information we collect to:\n• Provide, maintain, and improve our services\n• Process bookings and payments\n• Send you notifications about your bookings\n• Communicate with you about products, services, and promotions\n• Monitor and analyze usage patterns\n• Detect and prevent fraudulent activity'}
        </Section>

        <Section title="3. Sharing Your Information">
          {'We share your information with:\n• Service providers (payment processors, SMS providers)\n• Other users as necessary to facilitate bookings\n• Law enforcement when required by law\n\nWe do not sell your personal information to third parties.'}
        </Section>

        <Section title="4. Data Storage and Security">
          {'Your data is stored securely using Supabase and is encrypted in transit and at rest. We retain your information as long as your account is active or as needed to provide services.'}
        </Section>

        <Section title="5. Your Rights">
          {'You have the right to:\n• Access your personal information\n• Correct inaccurate data\n• Delete your account and associated data\n• Opt out of marketing communications\n\nTo delete your account, go to Settings → Delete Account in the app.'}
        </Section>

        <Section title="6. Children's Privacy">
          {'Glamr is not directed to children under 13. We do not knowingly collect personal information from children under 13.'}
        </Section>

        <Section title="7. Changes to This Policy">
          {'We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy in the app and updating the date above.'}
        </Section>

        <Section title="8. Contact Us">
          {'If you have questions about this privacy policy, please contact us at:\nsupport@glamrapp.com'}
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  container: { paddingHorizontal: spacing.screenH, paddingTop: 8, paddingBottom: 60, gap: 8 },
  updated: { ...typography.caption, color: colors.muted, marginBottom: 8 },
  section: { gap: 8, paddingBottom: 16 },
  heading: { ...typography.bodyMed, color: colors.ink, fontSize: 16 },
  body: { ...typography.body, color: colors.body, lineHeight: 22 },
});
