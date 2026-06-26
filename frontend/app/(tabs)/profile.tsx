import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useAuthStore } from '../../src/store/authStore';

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();

  const handleLogout = () =>
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);

  return (
    <View style={styles.container}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{user?.email[0].toUpperCase()}</Text>
      </View>
      <Text style={styles.email}>{user?.email}</Text>
      <Text style={styles.role}>{user?.role}</Text>
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9fafb', padding: 24 },
  avatar: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: '#1a56db',
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  avatarText: { color: '#fff', fontSize: 32, fontWeight: '700' },
  email: { fontSize: 18, fontWeight: '600', color: '#111', marginBottom: 4 },
  role: { fontSize: 14, color: '#6b7280', textTransform: 'capitalize', marginBottom: 40 },
  logoutBtn: {
    borderWidth: 1.5, borderColor: '#ef4444', borderRadius: 12,
    paddingVertical: 12, paddingHorizontal: 40,
  },
  logoutText: { color: '#ef4444', fontWeight: '600', fontSize: 15 },
});
