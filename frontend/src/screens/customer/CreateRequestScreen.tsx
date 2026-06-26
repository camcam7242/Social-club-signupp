import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useQuery, useMutation } from '@tanstack/react-query';
import { vehicleApi, requestApi } from '../../services/api';
import { Vehicle } from '../../types';

const SERVICE_TYPES = [
  'Oil Change', 'Tire Change', 'Battery Replacement',
  'Brake Service', 'Engine Diagnostics', 'AC Repair',
  'Transmission', 'Other',
];

export default function CreateRequestScreen() {
  const router = useRouter();
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [serviceType, setServiceType] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState<{ lat: number; lng: number; address?: string } | null>(null);
  const [locating, setLocating] = useState(false);

  const { data: vehicles = [] } = useQuery<Vehicle[]>({
    queryKey: ['vehicles'],
    queryFn: async () => (await vehicleApi.list()).data,
  });

  const submitMutation = useMutation({
    mutationFn: () => requestApi.create({
      vehicle_id: selectedVehicle!.id,
      service_type: serviceType,
      description,
      location_lat: location!.lat,
      location_lng: location!.lng,
      location_address: location!.address,
    }),
    onSuccess: () => {
      Alert.alert('Success', 'Your service request has been submitted. Mechanics will send quotes shortly.');
      router.back();
    },
    onError: (err: any) => Alert.alert('Error', err.response?.data?.error || 'Failed to submit request'),
  });

  const getLocation = async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') throw new Error('Permission denied');
      const loc = await Location.getCurrentPositionAsync({});
      const [geo] = await Location.reverseGeocodeAsync(loc.coords);
      const address = [geo.street, geo.city, geo.region].filter(Boolean).join(', ');
      setLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude, address });
    } catch {
      Alert.alert('Error', 'Could not get your location');
    } finally {
      setLocating(false);
    }
  };

  const handleSubmit = () => {
    if (!selectedVehicle) return Alert.alert('Error', 'Select a vehicle');
    if (!serviceType) return Alert.alert('Error', 'Select a service type');
    if (!description.trim()) return Alert.alert('Error', 'Describe the issue');
    if (!location) return Alert.alert('Error', 'Set your location');
    submitMutation.mutate();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.section}>Vehicle</Text>
      {vehicles.map((v) => (
        <TouchableOpacity
          key={v.id}
          style={[styles.option, selectedVehicle?.id === v.id && styles.optionActive]}
          onPress={() => setSelectedVehicle(v)}
        >
          <Text style={[styles.optionText, selectedVehicle?.id === v.id && styles.optionTextActive]}>
            {v.year} {v.make} {v.model}
          </Text>
        </TouchableOpacity>
      ))}
      {vehicles.length === 0 && (
        <TouchableOpacity onPress={() => router.push('/vehicles')}>
          <Text style={styles.addLink}>+ Add a vehicle first</Text>
        </TouchableOpacity>
      )}

      <Text style={styles.section}>Service Type</Text>
      <View style={styles.grid}>
        {SERVICE_TYPES.map((s) => (
          <TouchableOpacity
            key={s}
            style={[styles.chip, serviceType === s && styles.chipActive]}
            onPress={() => setServiceType(s)}
          >
            <Text style={[styles.chipText, serviceType === s && styles.chipTextActive]}>{s}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.section}>Describe the Issue</Text>
      <TextInput
        style={styles.textarea}
        placeholder="Describe what's happening with your vehicle..."
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
      />

      <Text style={styles.section}>Location</Text>
      <TouchableOpacity style={styles.locationBtn} onPress={getLocation} disabled={locating}>
        {locating ? (
          <ActivityIndicator color="#1a56db" />
        ) : (
          <Text style={styles.locationBtnText}>
            {location ? `📍 ${location.address || `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`}` : '📍 Use My Location'}
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitMutation.isPending}>
        {submitMutation.isPending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitBtnText}>Submit Request</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  section: { fontSize: 16, fontWeight: '700', color: '#111', marginTop: 20, marginBottom: 10 },
  option: {
    padding: 14, borderRadius: 10, borderWidth: 2, borderColor: '#e5e7eb',
    marginBottom: 8, backgroundColor: '#fff',
  },
  optionActive: { borderColor: '#1a56db', backgroundColor: '#eff6ff' },
  optionText: { fontSize: 15, color: '#374151' },
  optionTextActive: { color: '#1a56db', fontWeight: '600' },
  addLink: { color: '#1a56db', fontSize: 15, marginBottom: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1.5, borderColor: '#d1d5db', backgroundColor: '#fff',
  },
  chipActive: { borderColor: '#1a56db', backgroundColor: '#eff6ff' },
  chipText: { fontSize: 13, color: '#374151' },
  chipTextActive: { color: '#1a56db', fontWeight: '600' },
  textarea: {
    borderWidth: 1, borderColor: '#d1d5db', borderRadius: 12,
    padding: 14, fontSize: 15, backgroundColor: '#fff', minHeight: 100,
  },
  locationBtn: {
    borderWidth: 1.5, borderColor: '#1a56db', borderRadius: 12,
    padding: 14, alignItems: 'center', backgroundColor: '#eff6ff',
  },
  locationBtnText: { color: '#1a56db', fontSize: 15, fontWeight: '500' },
  submitBtn: {
    backgroundColor: '#1a56db', borderRadius: 12,
    padding: 16, alignItems: 'center', marginTop: 24, marginBottom: 40,
  },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
