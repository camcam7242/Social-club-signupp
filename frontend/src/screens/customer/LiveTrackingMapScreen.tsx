import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Dimensions, Animated,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { jobApi } from '../../services/api';
import { useSocketStore } from '../../store/socketStore';

const { width, height } = Dimensions.get('window');

interface Coord { latitude: number; longitude: number }

export default function LiveTrackingMapScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const mapRef = useRef<MapView>(null);
  const { socket, joinJob } = useSocketStore();
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const [mechanicCoord, setMechanicCoord] = useState<Coord | null>(null);
  const [customerCoord, setCustomerCoord] = useState<Coord | null>(null);
  const [path, setPath] = useState<Coord[]>([]);
  const [liveStatus, setLiveStatus] = useState('');

  const { data: job, isLoading } = useQuery({
    queryKey: ['job', id],
    queryFn: async () => (await jobApi.get(id)).data,
  });

  // Pulse animation for mechanic marker
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.3, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  useEffect(() => {
    if (!id) return;
    joinJob(id);
  }, [id]);

  // Set customer location from job data
  useEffect(() => {
    if (job?.location_lat && job?.location_lng) {
      const coord = { latitude: Number(job.location_lat), longitude: Number(job.location_lng) };
      setCustomerCoord(coord);
    }
  }, [job]);

  // Listen for real-time mechanic location updates
  useEffect(() => {
    if (!socket) return;

    const onLocation = (data: { mechanicUserId: string; lat: number; lng: number }) => {
      const coord = { latitude: data.lat, longitude: data.lng };
      setMechanicCoord(coord);
      setPath((prev) => [...prev.slice(-49), coord]); // keep last 50 points

      // Animate map to show both mechanic and customer
      if (customerCoord && mapRef.current) {
        mapRef.current.fitToCoordinates([coord, customerCoord], {
          edgePadding: { top: 80, right: 40, bottom: 200, left: 40 },
          animated: true,
        });
      }
    };

    const onEnRoute = () => setLiveStatus('Your mechanic is on the way 🚗');
    const onArrived = () => setLiveStatus('Your mechanic has arrived 📍');
    const onStarted = () => setLiveStatus('Work in progress 🔧');
    const onCompleted = () => {
      setLiveStatus('Job complete! ✅');
      setTimeout(() => router.push(`/jobs/${id}`), 1500);
    };

    socket.on('mechanic_location_updated', onLocation);
    socket.on('mechanic_en_route', onEnRoute);
    socket.on('mechanic_arrived', onArrived);
    socket.on('job_started', onStarted);
    socket.on('job_completed', onCompleted);

    return () => {
      socket.off('mechanic_location_updated', onLocation);
      socket.off('mechanic_en_route', onEnRoute);
      socket.off('mechanic_arrived', onArrived);
      socket.off('job_started', onStarted);
      socket.off('job_completed', onCompleted);
    };
  }, [socket, customerCoord, id]);

  if (isLoading || !customerCoord) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1a56db" />
        <Text style={styles.loadingText}>Loading map...</Text>
      </View>
    );
  }

  const initialRegion = {
    latitude: customerCoord.latitude,
    longitude: customerCoord.longitude,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={initialRegion}
        showsUserLocation={false}
        showsTraffic={false}
      >
        {/* Customer / job location */}
        <Marker coordinate={customerCoord} anchor={{ x: 0.5, y: 0.5 }}>
          <View style={styles.customerMarker}>
            <Text style={styles.customerMarkerIcon}>🚗</Text>
          </View>
        </Marker>

        {/* Mechanic live location */}
        {mechanicCoord && (
          <Marker coordinate={mechanicCoord} anchor={{ x: 0.5, y: 0.5 }}>
            <Animated.View style={[styles.mechanicMarkerOuter, { transform: [{ scale: pulseAnim }] }]}>
              <View style={styles.mechanicMarker}>
                <Text style={styles.mechanicMarkerIcon}>🔧</Text>
              </View>
            </Animated.View>
          </Marker>
        )}

        {/* Trail polyline */}
        {path.length > 1 && (
          <Polyline
            coordinates={path}
            strokeColor="#1a56db"
            strokeWidth={3}
            lineDashPattern={[8, 4]}
          />
        )}
      </MapView>

      {/* Back button */}
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Text style={styles.backBtnText}>‹</Text>
      </TouchableOpacity>

      {/* Status bar */}
      {liveStatus ? (
        <View style={styles.statusBar}>
          <Text style={styles.statusText}>{liveStatus}</Text>
        </View>
      ) : null}

      {/* Bottom sheet */}
      <View style={styles.bottomSheet}>
        <View style={styles.sheetHandle} />

        <View style={styles.jobInfo}>
          <View>
            <Text style={styles.jobService}>{job?.service_type}</Text>
            <Text style={styles.jobVehicle}>{job?.year} {job?.make} {job?.model}</Text>
          </View>
          <View style={[
            styles.jobStatusBadge,
            { backgroundColor: job?.status === 'en_route' ? '#dbeafe' : '#dcfce7' }
          ]}>
            <Text style={[
              styles.jobStatusText,
              { color: job?.status === 'en_route' ? '#1a56db' : '#16a34a' }
            ]}>
              {job?.status?.replace('_', ' ')}
            </Text>
          </View>
        </View>

        {mechanicCoord ? (
          <View style={styles.mechanicInfo}>
            <Text style={styles.mechanicInfoIcon}>🔧</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.mechanicName}>{job?.business_name || 'Your Mechanic'}</Text>
              <Text style={styles.mechanicRating}>★ {Number(job?.mechanic_rating || 0).toFixed(1)}</Text>
            </View>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        ) : (
          <View style={styles.waitingRow}>
            <ActivityIndicator color="#1a56db" size="small" />
            <Text style={styles.waitingText}>Waiting for mechanic location...</Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.jobDetailBtn}
          onPress={() => router.push(`/jobs/${id}`)}
        >
          <Text style={styles.jobDetailBtnText}>View Job Details</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { width, height },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9fafb' },
  loadingText: { marginTop: 12, color: '#6b7280' },
  customerMarker: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2.5, borderColor: '#1a56db',
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 4, elevation: 5,
  },
  customerMarkerIcon: { fontSize: 20 },
  mechanicMarkerOuter: { alignItems: 'center', justifyContent: 'center' },
  mechanicMarker: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: '#1a56db',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#1a56db', shadowOpacity: 0.5, shadowRadius: 8, elevation: 8,
    borderWidth: 2.5, borderColor: '#fff',
  },
  mechanicMarkerIcon: { fontSize: 22 },
  backBtn: {
    position: 'absolute', top: 56, left: 16,
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 6, elevation: 6,
  },
  backBtnText: { fontSize: 26, color: '#111', marginTop: -2 },
  statusBar: {
    position: 'absolute', top: 56, left: 72, right: 16,
    backgroundColor: '#1a56db', borderRadius: 12,
    paddingVertical: 10, paddingHorizontal: 14,
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 6, elevation: 6,
  },
  statusText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  bottomSheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, paddingBottom: 36,
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 20, elevation: 20,
  },
  sheetHandle: {
    width: 40, height: 4, backgroundColor: '#e5e7eb',
    borderRadius: 2, alignSelf: 'center', marginBottom: 16,
  },
  jobInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  jobService: { fontSize: 17, fontWeight: '700', color: '#111' },
  jobVehicle: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  jobStatusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  jobStatusText: { fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
  mechanicInfo: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#f9fafb', borderRadius: 12, padding: 12, marginBottom: 16,
  },
  mechanicInfoIcon: { fontSize: 22 },
  mechanicName: { fontSize: 15, fontWeight: '600', color: '#111' },
  mechanicRating: { fontSize: 13, color: '#f59e0b', marginTop: 2 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10b981' },
  liveText: { fontSize: 11, fontWeight: '700', color: '#10b981' },
  waitingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  waitingText: { color: '#6b7280', fontSize: 14 },
  jobDetailBtn: {
    borderWidth: 1.5, borderColor: '#1a56db', borderRadius: 12,
    padding: 14, alignItems: 'center',
  },
  jobDetailBtnText: { color: '#1a56db', fontWeight: '600', fontSize: 15 },
});
