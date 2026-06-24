import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { colors, typography, spacing, radius, shadows } from '@/theme/tokens';
import { Avatar } from '@/components/Avatar';

const TODAY_APPTS = [
  { id: '1', time: '10:00 AM', client: 'Aaliyah M.', service: 'Box Braids', price: '$180', isNew: true },
  { id: '2', time: '1:30 PM', client: 'Denise T.', service: 'Silk Press', price: '$95', isNew: false },
  { id: '3', time: '4:00 PM', client: 'Keisha R.', service: 'Touch-up', price: '$65', isNew: true },
];

export function ProHomeScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good morning 👋</Text>
            <Text style={styles.name}>Jordan</Text>
          </View>
          <Avatar name="Jordan B" size={44} />
        </View>

        {/* Earnings card */}
        <View style={styles.earningsCard}>
          <Text style={styles.earningsLabel}>THIS WEEK</Text>
          <Text style={styles.earningsAmount}>$640.00</Text>
          <Text style={styles.earningsSub}>3 appointments remaining today</Text>
        </View>

        {/* Booking requests banner */}
        <View style={styles.requestsBanner}>
          <Text style={styles.requestsText}>📬 2 new booking requests</Text>
          <Text style={styles.requestsAction}>Review →</Text>
        </View>

        {/* Today's appointments */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today</Text>
          <View style={styles.apptList}>
            {TODAY_APPTS.map(a => (
              <View key={a.id} style={styles.apptRow}>
                <Text style={styles.apptTime}>{a.time}</Text>
                <Avatar name={a.client} size={38} />
                <View style={styles.apptInfo}>
                  <View style={styles.apptNameRow}>
                    <Text style={styles.apptClient}>{a.client}</Text>
                    {a.isNew && <View style={styles.newTag}><Text style={styles.newTagText}>NEW</Text></View>}
                  </View>
                  <Text style={styles.apptService}>{a.service}</Text>
                </View>
                <Text style={styles.apptPrice}>{a.price}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  scroll: { paddingHorizontal: spacing.screenH, paddingBottom: 40, gap: 20, paddingTop: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greeting: { ...typography.label, color: colors.muted, textTransform: 'uppercase' },
  name: { fontSize: 26, fontWeight: '800', color: colors.ink },
  earningsCard: {
    padding: 24,
    borderRadius: radius.large,
    backgroundColor: colors.blue,
    gap: 4,
    ...shadows.btn,
  },
  earningsLabel: { ...typography.labelUpper, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase' },
  earningsAmount: { fontSize: 40, fontWeight: '800', color: colors.white, letterSpacing: -1 },
  earningsSub: { ...typography.body, color: 'rgba(255,255,255,0.8)' },
  requestsBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: radius.card,
    backgroundColor: colors.orangeSoft,
    borderWidth: 1,
    borderColor: '#FFD4BC',
  },
  requestsText: { ...typography.bodyMed, color: colors.ink },
  requestsAction: { ...typography.bodyMed, color: colors.orange },
  section: { gap: 12 },
  sectionTitle: { ...typography.sectionH, fontSize: 20, color: colors.ink },
  apptList: { gap: 12 },
  apptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: radius.card,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    gap: 12,
    ...shadows.card,
  },
  apptTime: { ...typography.caption, color: colors.muted, width: 60 },
  apptInfo: { flex: 1, gap: 2 },
  apptNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  apptClient: { ...typography.bodyMed, color: colors.ink },
  apptService: { ...typography.caption, color: colors.muted },
  apptPrice: { ...typography.bodyMed, color: colors.ink },
  newTag: { backgroundColor: colors.blueSoft, paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.pill },
  newTagText: { ...typography.labelUpper, color: colors.blue, fontSize: 10 },
});
