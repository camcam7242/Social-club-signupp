import React from 'react';
import { ScrollView, Text, StyleSheet } from 'react-native';

export default function TermsScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Terms of Service</Text>
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
    heading: '1. Acceptance of Terms',
    body: 'By downloading, installing, accessing, or using the MechMarket mobile application ("App"), you agree to be legally bound by these Terms of Service. If you do not agree, do not use the App.',
  },
  {
    heading: '2. Description of Service',
    body: 'MechMarket is a technology platform connecting customers seeking automotive services with independent service providers ("Mechanics"). MechMarket does NOT provide automotive repair services. All Mechanics are independent contractors, not employees or agents of MechMarket.',
  },
  {
    heading: '3. Eligibility',
    body: 'You must be at least 18 years of age and have legal authority to enter a binding contract. Mechanics must hold all required licenses and certifications for services they offer.',
  },
  {
    heading: '4. Platform Fee',
    body: 'MechMarket charges a 15% platform fee on all completed transactions, automatically deducted before payout to the Mechanic. All payments are processed securely through Stripe, Inc.',
  },
  {
    heading: '5. Taxes',
    body: 'Mechanics are solely responsible for reporting and paying all applicable taxes on income earned through the platform. MechMarket will issue IRS Form 1099-K to Mechanics earning $600 or more per calendar year.',
  },
  {
    heading: '6. Refunds & Disputes',
    body: 'Refunds may be issued at MechMarket\'s sole discretion if a Mechanic fails to show, a service is not completed as agreed, or documented vehicle damage occurs. Disputes must be reported to support@mechmarket.app within 72 hours of the service date with your booking ID and supporting documentation.',
  },
  {
    heading: '7. Five-Strike Policy',
    body: 'A review rating of 1 or 2 stars constitutes a strike. Upon receiving 5 strikes, a Mechanic\'s account will be suspended for 90 days. After 90 days, the account may be reinstated with a clean record.',
  },
  {
    heading: '8. Independent Contractors',
    body: 'Mechanics are independent contractors. Nothing in these Terms creates an employment, partnership, joint venture, or agency relationship between MechMarket and any Mechanic. Mechanics are solely responsible for maintaining adequate insurance coverage.',
  },
  {
    heading: '9. Disclaimer of Warranties',
    body: 'THE APP IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. MECHMARKET DOES NOT WARRANT THE QUALITY, SAFETY, OR LEGALITY OF SERVICES PROVIDED BY MECHANICS, NOR THAT THE APP WILL BE UNINTERRUPTED OR ERROR-FREE.',
  },
  {
    heading: '10. Limitation of Liability',
    body: 'TO THE MAXIMUM EXTENT PERMITTED BY LAW, MECHMARKET SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING DAMAGE TO YOUR VEHICLE OR PERSONAL INJURY. OUR MAXIMUM LIABILITY IS LIMITED TO THE AMOUNT YOU PAID FOR THE SPECIFIC SERVICE IN QUESTION.',
  },
  {
    heading: '11. Indemnification',
    body: 'You agree to defend, indemnify, and hold harmless MechMarket and its officers, directors, employees, and agents from any claims, liabilities, damages, or expenses arising from your use of the App, violation of these Terms, or violation of any law or third-party rights.',
  },
  {
    heading: '12. Arbitration & Class Action Waiver',
    body: 'ANY DISPUTE ARISING FROM THESE TERMS SHALL BE RESOLVED BY BINDING ARBITRATION, NOT IN COURT. YOU WAIVE YOUR RIGHT TO PARTICIPATE IN A CLASS ACTION LAWSUIT OR CLASS-WIDE ARBITRATION. All claims must be brought individually.',
  },
  {
    heading: '13. Governing Law',
    body: 'These Terms are governed by the laws of the state in which MechMarket is incorporated, without regard to its conflict of law provisions.',
  },
  {
    heading: '14. Contact',
    body: 'For questions or support, contact us at support@mechmarket.app.',
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
