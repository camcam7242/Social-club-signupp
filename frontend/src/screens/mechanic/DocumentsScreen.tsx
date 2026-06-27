import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert,
  ScrollView, ActivityIndicator, Modal,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { documentApi } from '../../services/api';

const DOC_TYPES = [
  { key: 'insurance', label: '🛡️ Insurance Certificate' },
  { key: 'ase_cert', label: '🏅 ASE Certification' },
  { key: 'license', label: '🪪 Driver\'s License' },
  { key: 'other', label: '📄 Other Document' },
];

interface Doc {
  id: string;
  doc_type: string;
  file_url: string;
  file_name: string;
  uploaded_at: string;
}

export default function DocumentsScreen() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [selectedType, setSelectedType] = useState('insurance');
  const [uploading, setUploading] = useState(false);

  const { data: docs = [], isLoading } = useQuery<Doc[]>({
    queryKey: ['mechanic-docs'],
    queryFn: async () => (await documentApi.list()).data,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => documentApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mechanic-docs'] }),
    onError: () => Alert.alert('Error', 'Failed to delete document'),
  });

  const pickAndUpload = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: false,
      quality: 0.8,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    setUploading(true);
    try {
      const fileName = asset.fileName || asset.uri.split('/').pop() || 'document';
      // In production, upload to S3 and get back a URL. For now, use the local URI.
      await documentApi.upload(selectedType, asset.uri, fileName);
      await qc.invalidateQueries({ queryKey: ['mechanic-docs'] });
      setShowModal(false);
      Alert.alert('Uploaded', 'Document saved successfully.');
    } catch {
      Alert.alert('Error', 'Failed to upload document. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const docTypeLabel = (key: string) => DOC_TYPES.find(d => d.key === key)?.label || key;

  if (isLoading) return <ActivityIndicator style={{ flex: 1 }} />;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>📋 Verification Required</Text>
        <Text style={styles.infoText}>
          Upload your insurance certificate and ASE certifications. An admin will review and verify your account — usually within 24 hours.
        </Text>
      </View>

      <TouchableOpacity style={styles.uploadBtn} onPress={() => setShowModal(true)}>
        <Text style={styles.uploadBtnText}>+ Upload Document</Text>
      </TouchableOpacity>

      {docs.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📂</Text>
          <Text style={styles.emptyTitle}>No documents yet</Text>
          <Text style={styles.emptyText}>Upload your insurance and certifications to get verified faster.</Text>
        </View>
      )}

      {docs.map((doc) => (
        <View key={doc.id} style={styles.docCard}>
          <View style={styles.docRow}>
            <View style={styles.docInfo}>
              <Text style={styles.docType}>{docTypeLabel(doc.doc_type)}</Text>
              <Text style={styles.docName} numberOfLines={1}>{doc.file_name}</Text>
              <Text style={styles.docDate}>
                Uploaded {new Date(doc.uploaded_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => Alert.alert('Delete Document', 'Remove this document?', [
                { text: 'Cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate(doc.id) },
              ])}
              style={styles.deleteBtn}
            >
              <Text style={styles.deleteBtnText}>🗑️</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}

      {/* Upload Modal */}
      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Upload Document</Text>
            <Text style={styles.modalLabel}>Document Type</Text>
            {DOC_TYPES.map((dt) => (
              <TouchableOpacity
                key={dt.key}
                style={[styles.typeOption, selectedType === dt.key && styles.typeOptionActive]}
                onPress={() => setSelectedType(dt.key)}
              >
                <Text style={[styles.typeOptionText, selectedType === dt.key && styles.typeOptionTextActive]}>
                  {dt.label}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.pickBtn} onPress={pickAndUpload} disabled={uploading}>
              {uploading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.pickBtnText}>Choose File & Upload</Text>
              }
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowModal(false)} style={styles.cancelLink}>
              <Text style={styles.cancelLinkText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  infoBox: { backgroundColor: '#fffbeb', borderRadius: 12, padding: 14, marginBottom: 16 },
  infoTitle: { fontSize: 14, fontWeight: '700', color: '#92400e', marginBottom: 6 },
  infoText: { fontSize: 13, color: '#92400e', lineHeight: 19 },
  uploadBtn: {
    backgroundColor: '#1a56db', borderRadius: 12, padding: 15,
    alignItems: 'center', marginBottom: 20,
  },
  uploadBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  emptyState: { alignItems: 'center', paddingVertical: 48 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#374151', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#9ca3af', textAlign: 'center', lineHeight: 20 },
  docCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 10,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  docRow: { flexDirection: 'row', alignItems: 'center' },
  docInfo: { flex: 1 },
  docType: { fontSize: 14, fontWeight: '700', color: '#111', marginBottom: 3 },
  docName: { fontSize: 13, color: '#6b7280', marginBottom: 3 },
  docDate: { fontSize: 11, color: '#9ca3af' },
  deleteBtn: { padding: 8 },
  deleteBtnText: { fontSize: 20 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#111', marginBottom: 16 },
  modalLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 10 },
  typeOption: {
    borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 10,
    padding: 12, marginBottom: 8,
  },
  typeOptionActive: { borderColor: '#1a56db', backgroundColor: '#eff6ff' },
  typeOptionText: { fontSize: 14, color: '#6b7280' },
  typeOptionTextActive: { color: '#1a56db', fontWeight: '600' },
  pickBtn: { backgroundColor: '#1a56db', borderRadius: 12, padding: 15, alignItems: 'center', marginTop: 8 },
  pickBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  cancelLink: { alignItems: 'center', marginTop: 14 },
  cancelLinkText: { color: '#6b7280', fontSize: 14 },
});
