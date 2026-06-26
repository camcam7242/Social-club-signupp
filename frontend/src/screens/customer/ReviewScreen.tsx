import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useMutation } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { api } from '../../services/api';

export default function ReviewScreen() {
  const { jobId } = useLocalSearchParams<{ jobId: string }>();
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  const submitMutation = useMutation({
    mutationFn: () => api.post('/reviews', { job_id: jobId, rating, comment }),
    onSuccess: () => {
      Alert.alert('Thanks!', 'Your review has been submitted.', [
        { text: 'Done', onPress: () => router.replace('/(tabs)') },
      ]);
    },
    onError: (err: any) => Alert.alert('Error', err.response?.data?.error || 'Failed to submit review'),
  });

  const handleSubmit = () => {
    if (rating === 0) return Alert.alert('Error', 'Please select a star rating');
    submitMutation.mutate();
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.container}>
        <Text style={styles.title}>Rate Your Mechanic</Text>
        <Text style={styles.subtitle}>How was your experience?</Text>

        <View style={styles.starsRow}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity key={star} onPress={() => setRating(star)}>
              <Text style={[styles.star, rating >= star && styles.starActive]}>★</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.ratingLabel}>
          {rating === 0 ? 'Tap to rate' : ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent!'][rating]}
        </Text>

        <TextInput
          style={styles.textarea}
          placeholder="Share details about your experience (optional)"
          value={comment}
          onChangeText={setComment}
          multiline
          numberOfLines={5}
          textAlignVertical="top"
        />

        <TouchableOpacity
          style={[styles.submitBtn, rating === 0 && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={submitMutation.isPending || rating === 0}
        >
          {submitMutation.isPending
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.submitBtnText}>Submit Review</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.replace('/(tabs)')} style={styles.skip}>
          <Text style={styles.skipText}>Skip for now</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 24, justifyContent: 'center' },
  title: { fontSize: 26, fontWeight: '700', color: '#111', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#6b7280', textAlign: 'center', marginBottom: 32 },
  starsRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 8 },
  star: { fontSize: 44, color: '#e5e7eb' },
  starActive: { color: '#f59e0b' },
  ratingLabel: { textAlign: 'center', color: '#6b7280', fontSize: 15, marginBottom: 24, height: 20 },
  textarea: {
    borderWidth: 1, borderColor: '#d1d5db', borderRadius: 12,
    padding: 14, fontSize: 15, backgroundColor: '#f9fafb',
    minHeight: 120, marginBottom: 20,
  },
  submitBtn: { backgroundColor: '#1a56db', borderRadius: 12, padding: 16, alignItems: 'center' },
  submitBtnDisabled: { backgroundColor: '#93c5fd' },
  submitBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  skip: { alignItems: 'center', marginTop: 16 },
  skipText: { color: '#9ca3af', fontSize: 14 },
});
