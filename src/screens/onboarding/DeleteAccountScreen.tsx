import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, Alert, TouchableOpacity,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/types';
import { TopBar } from '@/components/TopBar';
import { colors, typography, spacing, radius } from '@/theme/tokens';
import { deleteAccount } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

type Props = NativeStackScreenProps<RootStackParamList, 'DeleteAccount'>;

export function DeleteAccountScreen({ navigation }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    Alert.alert(
      'Delete account',
      'This will permanently delete your account and all your data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete permanently',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const { data: { user } } = await supabase.auth.getUser();
              if (!user) throw new Error('Not signed in');
              await deleteAccount(user.id);
              navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] });
            } catch (err: any) {
              Alert.alert('Error', err.message ?? 'Could not delete account. Please contact support.');
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <TopBar title="Delete account" onBack={() => navigation.goBack()} />
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.iconWrap}>
            <Text style={styles.iconText}>⚠️</Text>
          </View>
          <Text style={styles.title}>Delete your account</Text>
          <Text style={styles.body}>
            Deleting your account is permanent and cannot be undone. All of your data will be removed, including:
          </Text>
          <View style={styles.list}>
            {[
              'Your profile and account information',
              'All bookings and appointments',
              'Messages and chat history',
              'Reviews and ratings',
              'Payment history',
            ].map((item) => (
              <View key={item} style={styles.listItem}>
                <View style={styles.bullet} />
                <Text style={styles.listText}>{item}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.note}>
            If you have any active bookings, please cancel them before deleting your account.
          </Text>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.deleteBtn, loading && styles.deleteBtnDisabled]}
            onPress={handleDelete}
            disabled={loading}
          >
            <Text style={styles.deleteBtnText}>
              {loading ? 'Deleting...' : 'Delete my account'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.cancel}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  container: { flex: 1, paddingHorizontal: spacing.screenH, paddingBottom: 40, justifyContent: 'space-between' },
  content: { paddingTop: 16, gap: 16 },
  iconWrap: { alignItems: 'center', paddingVertical: 8 },
  iconText: { fontSize: 48 },
  title: { ...typography.sectionH, color: colors.ink, textAlign: 'center' },
  body: { ...typography.body, color: colors.body, lineHeight: 22 },
  list: { gap: 10, paddingLeft: 4 },
  listItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  bullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.danger, marginTop: 7 },
  listText: { ...typography.body, color: colors.body, flex: 1, lineHeight: 22 },
  note: { ...typography.caption, color: colors.muted, lineHeight: 18, fontStyle: 'italic' },
  actions: { gap: 16 },
  deleteBtn: { height: 56, borderRadius: radius.btn, backgroundColor: colors.danger, alignItems: 'center', justifyContent: 'center' },
  deleteBtnDisabled: { opacity: 0.5 },
  deleteBtnText: { ...typography.bodyMed, color: colors.white },
  cancel: { ...typography.body, color: colors.muted, textAlign: 'center' },
});
