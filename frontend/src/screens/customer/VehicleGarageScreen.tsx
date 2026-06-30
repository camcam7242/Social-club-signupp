import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Alert, Modal, TextInput, ActivityIndicator,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vehicleApi } from '../../services/api';
import { Vehicle } from '../../types';

const CURRENT_YEAR = new Date().getFullYear();

export default function VehicleGarageScreen() {
  const qc = useQueryClient();
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState({ year: '', make: '', model: '', trim: '', vin: '', mileage: '' });

  const { data: vehicles = [], isLoading } = useQuery<Vehicle[]>({
    queryKey: ['vehicles'],
    queryFn: async () => (await vehicleApi.list()).data,
  });

  const addMutation = useMutation({
    mutationFn: () => vehicleApi.create({ ...form, year: parseInt(form.year), mileage: form.mileage ? parseInt(form.mileage) : undefined }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vehicles'] });
      setModalVisible(false);
      setForm({ year: '', make: '', model: '', trim: '', vin: '', mileage: '' });
    },
    onError: (err: any) => Alert.alert('Error', err.response?.data?.error || 'Failed to add vehicle'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => vehicleApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vehicles'] }),
  });

  const handleAdd = () => {
    const year = parseInt(form.year);
    if (!year || year < 1980 || year > CURRENT_YEAR + 1) {
      return Alert.alert('Error', `Year must be between 1980 and ${CURRENT_YEAR + 1}`);
    }
    if (!form.make || !form.model) return Alert.alert('Error', 'Make and model are required');
    addMutation.mutate();
  };

  const renderVehicle = ({ item }: { item: Vehicle }) => (
    <View style={styles.card}>
      <View style={{ flex: 1 }}>
        <Text style={styles.vehicleName}>{item.year} {item.make} {item.model}</Text>
        {item.trim && <Text style={styles.vehicleDetail}>{item.trim}</Text>}
        {item.mileage && <Text style={styles.vehicleDetail}>{item.mileage.toLocaleString()} miles</Text>}
        {item.vin && <Text style={styles.vehicleDetail}>VIN: {item.vin}</Text>}
      </View>
      <TouchableOpacity onPress={() => Alert.alert('Delete', 'Remove this vehicle?', [
        { text: 'Cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate(item.id) },
      ])}>
        <Text style={styles.deleteBtn}>Remove</Text>
      </TouchableOpacity>
    </View>
  );

  if (isLoading) return <ActivityIndicator style={{ flex: 1 }} />;

  return (
    <View style={styles.container}>
      <FlatList
        data={vehicles}
        keyExtractor={(v) => v.id}
        renderItem={renderVehicle}
        ListEmptyComponent={<Text style={styles.empty}>No vehicles yet. Add one below.</Text>}
        contentContainerStyle={{ padding: 16 }}
      />

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Text style={styles.fabText}>+ Add Vehicle</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <Text style={styles.modalTitle}>Add Vehicle</Text>
          {[
            { key: 'year', placeholder: 'Year (e.g. 2020)', keyboard: 'numeric' as const },
            { key: 'make', placeholder: 'Make (e.g. Toyota)' },
            { key: 'model', placeholder: 'Model (e.g. Camry)' },
            { key: 'trim', placeholder: 'Trim (optional, e.g. LE)' },
            { key: 'vin', placeholder: 'VIN (optional)' },
            { key: 'mileage', placeholder: 'Mileage (optional)', keyboard: 'numeric' as const },
          ].map(({ key, placeholder, keyboard }) => (
            <TextInput
              key={key}
              style={styles.input}
              placeholder={placeholder}
              value={form[key as keyof typeof form]}
              onChangeText={(v) => setForm((f) => ({ ...f, [key]: v }))}
              keyboardType={keyboard}
            />
          ))}
          <TouchableOpacity style={styles.button} onPress={handleAdd} disabled={addMutation.isPending}>
            {addMutation.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Add Vehicle</Text>}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.cancel}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  card: {
    backgroundColor: '#0f172a', borderRadius: 12, padding: 16,
    marginBottom: 12, flexDirection: 'row', alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  vehicleName: { fontSize: 17, fontWeight: '600', color: '#f1f5f9' },
  vehicleDetail: { fontSize: 13, color: '#94a3b8', marginTop: 2 },
  deleteBtn: { color: '#ef4444', fontSize: 14, fontWeight: '500' },
  empty: { textAlign: 'center', color: '#64748b', marginTop: 60, fontSize: 15 },
  fab: {
    margin: 16, backgroundColor: '#1a56db', borderRadius: 12,
    padding: 16, alignItems: 'center',
  },
  fabText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  modal: { flex: 1, padding: 24, backgroundColor: '#0f172a' },
  modalTitle: { fontSize: 22, fontWeight: '700', marginBottom: 24, marginTop: 16 },
  input: {
    borderWidth: 1, borderColor: '#334155', borderRadius: 12,
    padding: 14, fontSize: 15, marginBottom: 12, backgroundColor: '#0f172a',
  },
  button: { backgroundColor: '#1a56db', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  cancel: { alignItems: 'center', marginTop: 16 },
  cancelText: { color: '#94a3b8', fontSize: 15 },
});
