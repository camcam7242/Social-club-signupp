import React from 'react';
import { ScrollView, Text, StyleSheet } from 'react-native';

export default function PrivacyScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Privacy Policy</Text>
      <Text style={styles.updated}>Last Updated: July 2, 2026</Text>

      {SECTIONS.map((s, i) => (
        <React.Fragment key={i}>
          <Text style={styles.heading}>{s.heading}</Text>
          <Text style={styles.body}>{s.body}</Text>
        </React.Fragment>
      ))}
    </ScrollView>
  );
}

const SECTIONS = [
  {
    heading: '1. Introduction',
    body: 'Curbly is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your personal information when you use the App. By using the App, you consent to the practices described here.',
  },
  {
    heading: '2. Information We Collect',
    body: 'We collect: account info (name, email, phone, password); vehicle info; payment info (processed by Stripe — we do not store full card numbers); mechanic certifications and ID; in-app chat messages; reviews and ratings; real-time GPS location; device identifiers; usage and navigation data; and push notification tokens.',
  },
  {
    heading: '3. How We Use Your Information',
    body: 'We use your information to: match Customers with Mechanics; process payments and payouts; provide live job tracking via GPS; manage your account; detect fraud and enforce our policies; send push notifications about bookings, payments, and account alerts; provide customer support; comply with IRS 1099-K reporting requirements; and improve the App.',
  },
  {
    heading: '4. How We Share Your Information',
    body: 'We do NOT sell your personal information. We share it only with: other users (limited profile and location data needed to complete jobs); service providers (Stripe, Google Maps, AWS, Expo, Supabase) bound by confidentiality agreements; law enforcement when legally required; and successor companies in a merger or acquisition.',
  },
  {
    heading: '5. Location Data',
    body: 'Location data is essential to Curbly. Customer location is shared with the assigned Mechanic for navigation. Mechanic location is shared with the Customer during an active job. We do not sell location data. Disabling location permissions will prevent the App from functioning.',
  },
  {
    heading: '6. Data Retention',
    body: 'Account data is retained until deletion plus 3 years. Transaction records are retained for 7 years for tax and legal compliance. Chat messages are retained for 1 year after job completion. Location history is deleted after 90 days.',
  },
  {
    heading: '7. Data Security',
    body: 'We use HTTPS/TLS encryption, bcrypt password hashing, JWT authentication, and Stripe\'s PCI-DSS compliant payment processing. No method of data transmission or storage is 100% secure. We will notify you of any breach affecting your rights as required by law.',
  },
  {
    heading: '8. Children\'s Privacy',
    body: 'The App is not directed to children under 18. We do not knowingly collect information from children under 18. If you believe we have collected such information, contact support@curbly.app immediately.',
  },
  {
    heading: '9. Your Rights',
    body: 'You may access and update your account info in the App settings. You may request account deletion by contacting support@curbly.app. You may opt out of marketing communications at any time. You cannot opt out of transactional communications (payment receipts, job updates).',
  },
  {
    heading: '10. California Residents (CCPA)',
    body: 'California residents have the right to know what personal information we collect, request deletion, and opt out of sale (we do not sell personal information). To exercise CCPA rights, email support@curbly.app with subject "CCPA Request."',
  },
  {
    heading: '11. European Users (GDPR)',
    body: 'EEA, UK, and Swiss residents have rights to access, rectify, erase, restrict, and port their data, and to object to processing. To exercise GDPR rights, email support@curbly.app. You may also lodge a complaint with your local data protection authority.',
  },
  {
    heading: '12. Changes to This Policy',
    body: 'We may update this policy at any time. We will notify you of material changes via the App or email. Continued use after changes take effect constitutes acceptance of the revised policy.',
  },
  {
    heading: '13. Contact Us',
    body: 'For privacy questions or requests, email support@curbly.app with subject "Privacy Request." We will respond within 30 days.',
  },
];

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  content: { padding: 20, paddingBottom: 48 },
  title: { fontSize: 22, fontWeight: '700', color: '#f1f5f9', marginBottom: 4 },
  updated: { fontSize: 12, color: '#64748b', marginBottom: 24 },
  heading: { fontSize: 15, fontWeight: '700', color: '#f1f5f9', marginTop: 20, marginBottom: 6 },
  body: { fontSize: 13, color: '#94a3b8', lineHeight: 20 },
});
