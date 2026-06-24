import React from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TextInput, TouchableOpacity,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/types';
import { colors, typography, spacing, radius, shadows } from '@/theme/tokens';
import { Avatar } from '@/components/Avatar';
import { Chip } from '@/components/Chip';

type Props = NativeStackScreenProps<RootStackParamList, 'ClientHome'>;

const FILTER_CHIPS = ['Hair', 'Barber', 'Nails', 'Skincare', 'Makeup', 'Lash & Brow', 'Massage', 'Wellness'];

const PROS = [
  { id: '1', name: 'Jordan B.', role: 'Hair Stylist', distance: '0.4 mi', rating: 4.9, price: 'from $85' },
  { id: '2', name: 'Aaliyah M.', role: 'Nail Tech', distance: '0.7 mi', rating: 4.8, price: 'from $55' },
  { id: '3', name: 'Marcus T.', role: 'Barber', distance: '1.1 mi', rating: 5.0, price: 'from $40' },
  { id: '4', name: 'Sofia R.', role: 'Esthetician', distance: '1.4 mi', rating: 4.7, price: 'from $90' },
];

export function ClientHomeScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Discover</Text>
            <Text style={styles.sub}>Beauty & wellness pros near you</Text>
          </View>
          <TouchableOpacity style={styles.mapBtn} onPress={() => navigation.navigate('Map')}>
            <Text style={styles.mapBtnIcon}>🗺</Text>
            <Text style={styles.mapBtnText}>Map</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search services, pros..."
            placeholderTextColor={colors.muted}
          />
          <TouchableOpacity style={styles.mapPill} onPress={() => navigation.navigate('Map')}>
            <Text style={styles.mapPillText}>Near me</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipsRow}
          contentContainerStyle={{ gap: 8, paddingHorizontal: spacing.screenH }}
        >
          {FILTER_CHIPS.map(c => <Chip key={c} label={c} />)}
        </ScrollView>

        <View style={styles.proList}>
          {PROS.map(pro => (
            <TouchableOpacity
              key={pro.id}
              style={styles.proRow}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('ProProfile')}
            >
              <Avatar name={pro.name} size={52} radius={14} />
              <View style={styles.proInfo}>
                <Text style={styles.proName}>{pro.name}</Text>
                <Text style={styles.proRole}>{pro.role}</Text>
                <View style={styles.proMeta}>
                  <Text style={styles.proRating}>★ {pro.rating}</Text>
                  <Text style={styles.proDot}>·</Text>
                  <Text style={styles.proPrice}>{pro.price}</Text>
                </View>
              </View>
              <View style={styles.distPill}>
                <Text style={styles.distText}>{pro.distance}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  scroll: { paddingBottom: 40, gap: 20, paddingTop: 16 },
  header: { paddingHorizontal: spacing.screenH, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  greeting: { fontSize: 28, fontWeight: '800', color: colors.ink },
  sub: { ...typography.body, color: colors.muted, marginTop: 2 },
  mapBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.blueSoft, paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill, marginTop: 4 },
  mapBtnIcon: { fontSize: 15 },
  mapBtnText: { ...typography.label, color: colors.blue },
  searchBar: { flexDirection: 'row', alignItems: 'center', marginHorizontal: spacing.screenH, backgroundColor: colors.field, borderRadius: radius.pill, paddingHorizontal: 16, height: 48, gap: 8 },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, ...typography.body, color: colors.ink },
  mapPill: { backgroundColor: colors.blue, paddingHorizontal: 12, paddingVertical: 5, borderRadius: radius.pill },
  mapPillText: { ...typography.caption, color: colors.white, fontWeight: '700' },
  chipsRow: { flexGrow: 0 },
  proList: { paddingHorizontal: spacing.screenH, gap: 12 },
  proRow: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: radius.card, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, gap: 14, ...shadows.card },
  proInfo: { flex: 1, gap: 3 },
  proName: { ...typography.bodyMed, color: colors.ink, fontSize: 16 },
  proRole: { ...typography.caption, color: colors.muted },
  proMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  proRating: { ...typography.label, color: colors.orange },
  proDot: { color: colors.muted },
  proPrice: { ...typography.caption, color: colors.muted },
  distPill: { backgroundColor: colors.blueSoft, paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill },
  distText: { ...typography.caption, color: colors.blue, fontWeight: '600' },
});
