import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert,
  ActivityIndicator, Dimensions, ScrollView, Modal,
} from 'react-native';
import MapView, { Marker, Circle, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { mechanicApi } from '../../services/api';
import { Mechanic } from '../../types';

const { width, height } = Dimensions.get('window');

interface NearbyMechanic extends Mechanic {
  distance_km: number;
  email: string;
  business_name?: string;
}

export default function MechanicMapScreen() {
  const router = useRouter();
  const mapRef = useRef<MapView>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locating, setLocating] = useState(true);
  const [selected, setSelected] = useState<NearbyMechanic | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission needed', 'Location access is required to find nearby mechanics.');
          return;
        }
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setUserLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      } catch {
        Alert.alert('Error', 'Could not get your location.');
      } finally {
        setLocating(false);
      }
    })();
  }, []);

  const { data: mechanics = [], isLoading, refetch } = useQuery<NearbyMechanic[]>({
    queryKey: ['nearby-mechanics', userLocation?.latitude, userLocation?.longitude],
    queryFn: async () =>
      (await mechanicApi.nearby(userLocation!.latitude, userLocation!.longitude, 50)).data,
    enabled: !!userLocation,
    refetchInterval: 30_000,
  });

  const centerOnUser = () => {
    if (!userLocation || !mapRef.current) return;
    mapRef.current.animateToRegion({
      ...userLocation,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    }, 600);
  };

  if (locating) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1a56db" />
        <Text style={styles.locatingText}>Finding your location...</Text>
      </View>
    );
  }

  if (!userLocation) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Location unavailable.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: 0.08,
          longitudeDelta: 0.08,
        }}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {/* Search radius ring */}
        <Circle
          center={userLocation}
          radius={25000}
          strokeColor="rgba(26,86,219,0.2)"
          fillColor="rgba(26,86,219,0.05)"
          strokeWidth={1}
        />

        {/* Mechanic markers */}
        {mechanics.map((m) => (
          m.current_lat && m.current_lng ? (
            <Marker
              key={m.id}
              coordinate={{ latitude: Number(m.current_lat), longitude: Number(m.current_lng) }}
              onPress={() => setSelected(m)}
              anchor={{ x: 0.5, y: 0.5 }}
            >
              <View style={styles.mechanicMarker}>
                <Text style={styles.mechanicMarkerIcon}>🔧</Text>
              </View>
            </Marker>
          ) : null
        ))}
      </MapView>

      {/* Top bar */}
      <View style={styles.topBar}>
        <View style={styles.countPill}>
          {isLoading
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={styles.countPillText}>{mechanics.length} mechanic{mechanics.length !== 1 ? 's' : ''} nearby</Text>
          }
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={() => refetch()}>
          <Text style={styles.refreshBtnText}>↻</Text>
        </TouchableOpacity>
      </View>

      {/* Center on me button */}
      <TouchableOpacity style={styles.myLocationBtn} onPress={centerOnUser}>
        <Text style={styles.myLocationIcon}>◎</Text>
      </TouchableOpacity>

      {/* Request button */}
      <TouchableOpacity style={styles.requestBtn} onPress={() => router.push('/(tabs)/new-request')}>
        <Text style={styles.requestBtnText}>+ Request a Mechanic</Text>
      </TouchableOpacity>

      {/* Mechanic detail sheet */}
      <Modal
        visible={!!selected}
        transparent
        animationType="slide"
        onRequestClose={() => setSelected(null)}
      >
        <TouchableOpacity style={styles.modalBackdrop} onPress={() => setSelected(null)} />
        {selected && (
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <View style={styles.mechanicAvatar}>
                <Text style={styles.mechanicAvatarText}>🔧</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sheetName}>
                  {selected.business_name || selected.email?.split('@')[0]}
                </Text>
                <View style={styles.ratingRow}>
                  <Text style={styles.star}>★</Text>
                  <Text style={styles.ratingText}>
                    {Number(selected.rating).toFixed(1)} · {selected.review_count} review{selected.review_count !== 1 ? 's' : ''}
                  </Text>
                </View>
              </View>
              <View style={styles.distancePill}>
                <Text style={styles.distanceText}>{Number(selected.distance_km).toFixed(1)} km</Text>
              </View>
            </View>

            <View style={styles.sheetStats}>
              <View style={styles.sheetStat}>
                <Text style={styles.sheetStatValue}>{selected.service_radius_km} km</Text>
                <Text style={styles.sheetStatLabel}>Radius</Text>
              </View>
              <View style={styles.sheetStatDivider} />
              <View style={styles.sheetStat}>
                <Text style={styles.sheetStatValue}>{selected.review_count}</Text>
                <Text style={styles.sheetStatLabel}>Jobs Done</Text>
              </View>
              <View style={styles.sheetStatDivider} />
              <View style={styles.sheetStat}>
                <Text style={[styles.sheetStatValue, { color: '#10b981' }]}>Online</Text>
                <Text style={styles.sheetStatLabel}>Status</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.sheetRequestBtn}
              onPress={() => {
                setSelected(null);
                router.push('/(tabs)/new-request');
              }}
            >
              <Text style={styles.sheetRequestBtnText}>Request This Mechanic</Text>
            </TouchableOpacity>
          </View>
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { width, height },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' },
  locatingText: { marginTop: 12, color: '#94a3b8', fontSize: 15 },
  errorText: { color: '#ef4444', fontSize: 15 },
  mechanicMarker: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#1a56db', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 4, elevation: 5,
    borderWidth: 2, borderColor: '#fff',
  },
  mechanicMarkerIcon: { fontSize: 18 },
  topBar: {
    position: 'absolute', top: 56, left: 16, right: 16,
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  countPill: {
    flex: 1, backgroundColor: '#1a56db', borderRadius: 20,
    paddingVertical: 10, paddingHorizontal: 16,
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 6, elevation: 4,
  },
  countPillText: { color: '#fff', fontWeight: '600', fontSize: 14, textAlign: 'center' },
  refreshBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#0f172a',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 6, elevation: 4,
  },
  refreshBtnText: { fontSize: 22, color: '#1a56db' },
  myLocationBtn: {
    position: 'absolute', bottom: 120, right: 16,
    width: 48, height: 48, borderRadius: 24, backgroundColor: '#0f172a',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 6, elevation: 4,
  },
  myLocationIcon: { fontSize: 22, color: '#1a56db' },
  requestBtn: {
    position: 'absolute', bottom: 56, left: 16, right: 16,
    backgroundColor: '#1a56db', borderRadius: 14, padding: 18,
    alignItems: 'center',
    shadowColor: '#1a56db', shadowOpacity: 0.4, shadowRadius: 10, elevation: 8,
  },
  requestBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  modalBackdrop: { flex: 1 },
  sheet: {
    backgroundColor: '#0f172a', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, paddingBottom: 36,
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 20, elevation: 20,
  },
  sheetHandle: {
    width: 40, height: 4, backgroundColor: '#e5e7eb',
    borderRadius: 2, alignSelf: 'center', marginBottom: 16,
  },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  mechanicAvatar: {
    width: 52, height: 52, borderRadius: 26, backgroundColor: '#1e3a5f',
    alignItems: 'center', justifyContent: 'center',
  },
  mechanicAvatarText: { fontSize: 24 },
  sheetName: { fontSize: 17, fontWeight: '700', color: '#f1f5f9' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  star: { color: '#f59e0b', fontSize: 14 },
  ratingText: { fontSize: 13, color: '#94a3b8' },
  distancePill: { backgroundColor: '#f0fdf4', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
  distanceText: { color: '#10b981', fontWeight: '600', fontSize: 13 },
  sheetStats: {
    flexDirection: 'row', backgroundColor: '#0f172a', borderRadius: 14,
    padding: 16, marginBottom: 20,
  },
  sheetStat: { flex: 1, alignItems: 'center' },
  sheetStatValue: { fontSize: 18, fontWeight: '700', color: '#f1f5f9' },
  sheetStatLabel: { fontSize: 12, color: '#64748b', marginTop: 4 },
  sheetStatDivider: { width: 1, backgroundColor: '#e5e7eb' },
  sheetRequestBtn: {
    backgroundColor: '#1a56db', borderRadius: 14, padding: 16, alignItems: 'center',
  },
  sheetRequestBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
