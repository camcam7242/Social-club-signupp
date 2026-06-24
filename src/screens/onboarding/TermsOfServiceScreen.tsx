import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/types';
import { TopBar } from '@/components/TopBar';
import { colors, typography, spacing } from '@/theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'TermsOfService'>;

function Section({ title, children }: { title: string; children: string }) {
  return (
    <View style={s.section}>
      <Text style={s.heading}>{title}</Text>
      <Text style={s.body}>{children}</Text>
    </View>
  );
}

export function TermsOfServiceScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={s.safe}>
      <TopBar title="Terms of Service" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={s.container}>
        <Text style={s.updated}>Last updated: June 2025</Text>

        <Section title="1. Acceptance of Terms">
          {'By creating an account or using Glamr, you agree to these Terms of Service. If you do not agree, please do not use our services.'}
        </Section>

        <Section title="2. Description of Service">
          {'Glamr is a marketplace that connects beauty and wellness professionals ("Pros") with clients seeking services. Glamr facilitates bookings and payments but is not responsible for the quality of services provided by Pros.'}
        </Section>

        <Section title="3. Account Registration">
          {'You must be 18 years or older to create an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account.'}
        </Section>

        <Section title="4. Bookings and Payments">
          {'When you book a service, you agree to pay the stated price. Glamr processes payments on behalf of Pros. Cancellation policies are set by individual Pros and are shown before you confirm a booking.'}
        </Section>

        <Section title="5. Pro Responsibilities">
          {'Pros are independent contractors, not employees of Glamr. Pros are responsible for the accuracy of their listings, their availability, and the quality of services they provide. Pros must comply with all applicable laws and hold any required licenses.'}
        </Section>

        <Section title="6. Prohibited Conduct">
          {'You agree not to:\n• Provide false information\n• Use the platform for any illegal purpose\n• Harass or harm other users\n• Attempt to circumvent our payment system\n• Create multiple accounts to manipulate reviews'}
        </Section>

        <Section title="7. Reviews">
          {'Reviews must be honest and based on your actual experience. Glamr reserves the right to remove reviews that violate our guidelines.'}
        </Section>

        <Section title="8. Limitation of Liability">
          {'Glamr is not liable for any damages arising from your use of the platform, including damages related to services provided by Pros. Our total liability shall not exceed the amount you paid in the 12 months preceding the claim.'}
        </Section>

        <Section title="9. Termination">
          {'You may delete your account at any time. Glamr may suspend or terminate your account for violations of these terms. Upon termination, your right to use the service ceases immediately.'}
        </Section>

        <Section title="10. Changes to Terms">
          {'We may modify these terms at any time. Continued use of the app after changes constitutes acceptance of the new terms.'}
        </Section>

        <Section title="11. Contact">
          {'For questions about these terms, contact us at:\nsupport@glamrapp.com'}
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
