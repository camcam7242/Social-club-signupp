import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const isCustomer = user?.role === 'customer';
  const isMechanic = user?.role === 'mechanic';

  const handleLogout = () =>
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{user?.email[0].toUpperCase()}</Text>
      </View>
      <Text style={styles.email}>{user?.email}</Text>
      <Text style={styles.role}>{user?.role}</Text>

      <View style={styles.menuSection}>
        {isCustomer && (
          <>
            <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/diagnosis')}>
              <Text style={styles.menuIcon}>🔍</Text>
              <Text style={styles.menuText}>AI Diagnosis</Text>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/my-mechanics')}>
              <Text style={styles.menuIcon}>❤️</Text>
              <Text style={styles.menuText}>My Mechanics</Text>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>
          </>
        )}
        {isMechanic && (
          <>
            <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/mechanic-docs')}>
              <Text style={styles.menuIcon}>📄</Text>
              <Text style={styles.menuText}>My Documents & Certs</Text>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/availability')}>
              <Text style={styles.menuIcon}>📅</Text>
              <Text style={styles.menuText}>Availability</Text>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/earnings')}>
              <Text style={styles.menuIcon}>💰</Text>
              <Text style={styles.menuText}>Earnings</Text>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>
          </>
        )}
        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/promo')}>
          <Text style={styles.menuIcon}>🔑</Text>
          <Text style={styles.menuText}>Promo Code</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/legal/terms')}>
          <Text style={styles.menuIcon}>📋</Text>
          <Text style={styles.menuText}>Terms of Service</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/legal/privacy')}>
          <Text style={styles.menuIcon}>🔒</Text>
          <Text style={styles.menuText}>Privacy Policy</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  content: { alignItems: 'center', padding: 24, paddingTop: 48 },
  avatar: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: '#1a56db',
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  avatarText: { color: '#fff', fontSize: 32, fontWeight: '700' },
  email: { fontSize: 18, fontWeight: '600', color: '#f1f5f9', marginBottom: 4 },
  role: { fontSize: 14, color: '#94a3b8', textTransform: 'capitalize', marginBottom: 32 },
  menuSection: { alignSelf: 'stretch', marginBottom: 32 },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#1e293b', borderRadius: 12, padding: 16, marginBottom: 8,
  },
  menuIcon: { fontSize: 20 },
  menuText: { flex: 1, fontSize: 15, fontWeight: '500', color: '#f1f5f9' },
  menuArrow: { fontSize: 22, color: '#64748b' },
  logoutBtn: {
    borderWidth: 1.5, borderColor: '#ef4444', borderRadius: 12,
    paddingVertical: 12, paddingHorizontal: 40,
  },
  logoutText: { color: '#ef4444', fontWeight: '600', fontSize: 15 },
});
