import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/types';
import { TopBar } from '@/components/TopBar';
import { PrimaryBtn } from '@/components/PrimaryBtn';
import { Avatar } from '@/components/Avatar';
import { colors, typography, spacing, radius } from '@/theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'RatePro'>;

export function RateProScreen({ navigation }: Props) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState('');

  const display = hovered || rating;

  return (
    <SafeAreaView style={styles.safe}>
      <TopBar title="Leave a review" onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={styles.container}>
          <View style={styles.proCard}>
            <Avatar name="Jordan B" size={56} radius={16} />
            <View>
              <Text style={styles.proName}>Jordan B.</Text>
              <Text style={styles.proRole}>Hair Stylist · Box Braids</Text>
            </View>
          </View>

          <View style={styles.starsSection}>
            <Text style={styles.starsPrompt}>How was your experience?</Text>
            <View style={styles.starsRow}>
              {[1,2,3,4,5].map(n => (
                <TouchableOpacity key={n} onPress={() => setRating(n)} onPressIn={() => setHovered(n)} onPressOut={() => setHovered(0)} hitSlop={8}>
                  <Text style={[styles.star, n <= display && styles.starFilled]}>★</Text>
                </TouchableOpacity>
              ))}
            </View>
            {display > 0 && (
              <Text style={styles.ratingLabel}>{['','Poor','Fair','Good','Great','Amazing!'][display]}</Text>
            )}
          </View>

          <TextInput
            style={styles.commentBox}
            value={comment}
            onChangeText={setComment}
            placeholder="Tell others about your experience (optional)"
            placeholderTextColor={colors.muted}
            multiline
            numberOfLines={4}
          />

          <PrimaryBtn label="Submit review" onPress={() => navigation.navigate('ClientHome')} disabled={rating === 0} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  container: { flex: 1, paddingHorizontal: spacing.screenH, paddingBottom: 40, gap: 24, paddingTop: 8 },
  proCard: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: radius.card, backgroundColor: colors.field },
  proName: { fontSize: 17, fontWeight: '700', color: colors.ink },
  proRole: { ...typography.body, color: colors.muted, marginTop: 2 },
  starsSection: { alignItems: 'center', gap: 12 },
  starsPrompt: { ...typography.bodyMed, color: colors.body, fontSize: 17 },
  starsRow: { flexDirection: 'row', gap: 8 },
  star: { fontSize: 44, color: colors.line },
  starFilled: { color: colors.orange },
  ratingLabel: { ...typography.bodyMed, color: colors.orange },
  commentBox: { height: 110, borderRadius: radius.card, backgroundColor: colors.field, padding: 16, ...typography.body, color: colors.ink, textAlignVertical: 'top', borderWidth: 1, borderColor: colors.line },
});
