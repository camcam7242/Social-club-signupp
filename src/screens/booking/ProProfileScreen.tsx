import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/types';
import { TopBar } from '@/components/TopBar';
import { PrimaryBtn } from '@/components/PrimaryBtn';
import { Avatar } from '@/components/Avatar';
import { colors, typography, spacing, radius, shadows } from '@/theme/tokens';
import { Dimensions } from 'react-native';

type Props = NativeStackScreenProps<RootStackParamList, 'ProProfile'>;

const W = Dimensions.get('window').width;
const TILE = (W - spacing.screenH * 2 - 8) / 3;

const SERVICES = [
  { name: 'Box Braids', duration: '3 hr', price: '$180' },
  { name: 'Silk Press', duration: '1.5 hr', price: '$95' },
  { name: 'Loc Retwist', duration: '2 hr', price: '$120' },
];

export function ProProfileScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.safe}>
      <TopBar onBack={() => navigation.goBack()} right={
        <TouchableOpacity hitSlop={8}><Text style={styles.heartIcon}>♡</Text></TouchableOpacity>
      } />
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        {/* Cover */}
        <View style={styles.cover} />

        {/* Profile header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarWrap}>
            <Avatar name="Jordan B" size={72} radius={20} />
          </View>
          <View style={styles.profileInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.proName}>Jordan B.</Text>
              <View style={styles.verifiedBadge}><Text style={styles.verifiedText}>✓ Verified</Text></View>
            </View>
            <Text style={styles.proRole}>Hair Stylist · Brooklyn, NY</Text>
            <View style={styles.metaRow}>
              <Text style={styles.rating}>★ 4.9</Text>
              <Text style={styles.metaDot}>·</Text>
              <Text style={styles.reviews}>128 reviews</Text>
              <Text style={styles.metaDot}>·</Text>
              <Text style={styles.distance}>0.4 mi</Text>
            </View>
          </View>
        </View>

        {/* Work grid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Portfolio</Text>
          <View style={styles.workGrid}>
            {Array.from({ length: 6 }).map((_, i) => (
              <View key={i} style={[styles.workTile, { backgroundColor: [colors.blue, colors.avatarPurple, colors.avatarTeal, colors.avatarOrange, colors.avatarPink, '#10B981'][i] }]} />
            ))}
          </View>
        </View>

        {/* Services */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Services</Text>
          <View style={styles.servicesList}>
            {SERVICES.map((s, i) => (
              <View key={i} style={styles.serviceRow}>
                <View>
                  <Text style={styles.serviceName}>{s.name}</Text>
                  <Text style={styles.serviceDuration}>{s.duration}</Text>
                </View>
                <Text style={styles.servicePrice}>{s.price}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Floating book button */}
      <View style={styles.bookBar}>
        <PrimaryBtn label="Book now" onPress={() => navigation.navigate('PickTime')} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  cover: { height: 200, backgroundColor: colors.blueSoft },
  profileHeader: { flexDirection: 'row', paddingHorizontal: spacing.screenH, paddingTop: 12, gap: 14, alignItems: 'flex-start' },
  avatarWrap: { marginTop: -36, borderWidth: 3, borderColor: colors.white, borderRadius: 22 },
  profileInfo: { flex: 1, gap: 4, paddingTop: 4 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  proName: { fontSize: 20, fontWeight: '800', color: colors.ink },
  verifiedBadge: { backgroundColor: colors.blueSoft, paddingHorizontal: 10, paddingVertical: 3, borderRadius: radius.pill },
  verifiedText: { ...typography.caption, color: colors.blue, fontWeight: '700' },
  proRole: { ...typography.body, color: colors.muted },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rating: { ...typography.label, color: colors.orange },
  metaDot: { color: colors.muted },
  reviews: { ...typography.caption, color: colors.muted },
  distance: { ...typography.caption, color: colors.blue },
  section: { paddingHorizontal: spacing.screenH, paddingTop: 24, gap: 14 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.ink },
  workGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  workTile: { width: TILE, height: TILE, borderRadius: radius.input },
  servicesList: { gap: 0 },
  serviceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.line },
  serviceName: { ...typography.bodyMed, color: colors.ink },
  serviceDuration: { ...typography.caption, color: colors.muted, marginTop: 2 },
  servicePrice: { ...typography.bodyMed, color: colors.ink },
  bookBar: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: spacing.screenH, paddingBottom: 32, backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.line },
  heartIcon: { fontSize: 24, color: colors.ink },
});
