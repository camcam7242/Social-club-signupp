import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  ActivityIndicator, Image, Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useMutation } from '@tanstack/react-query';
import { diagnosisApi } from '../../services/api';

interface LineItem {
  item: string;
  quoted_price: string;
  typical_price: string;
  assessment: 'fair' | 'high' | 'very_high' | 'unnecessary';
}
interface QuoteCheck {
  is_quote: boolean;
  verdict: 'fair' | 'slightly_high' | 'overpriced' | 'rip_off';
  total_quoted: string;
  fair_price_range: string;
  summary: string;
  line_items: LineItem[];
  red_flags: string[];
}

const VERDICT_META: Record<string, { label: string; color: string; emoji: string }> = {
  fair: { label: 'FAIR PRICE', color: '#10b981', emoji: '✅' },
  slightly_high: { label: 'SLIGHTLY HIGH', color: '#f59e0b', emoji: '⚠️' },
  overpriced: { label: 'OVERPRICED', color: '#f97316', emoji: '🚨' },
  rip_off: { label: 'RIP-OFF', color: '#ef4444', emoji: '⛔' },
};
const ITEM_COLOR: Record<string, string> = {
  fair: '#10b981', high: '#f59e0b', very_high: '#ef4444', unnecessary: '#a855f7',
};

export default function QuoteCheckScreen() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);

  const mutation = useMutation<QuoteCheck, any, void>({
    mutationFn: async () =>
      (await diagnosisApi.checkQuote({ image_base64: imageBase64!, media_type: 'image/jpeg' })).data,
    onError: (err) =>
      Alert.alert('Error', err?.response?.data?.error || 'Could not analyze the quote.'),
  });

  const pickImage = async (fromCamera: boolean) => {
    const opts: ImagePicker.ImagePickerOptions = {
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.6,
      base64: true,
    };
    const result = fromCamera
      ? await (async () => {
          const perm = await ImagePicker.requestCameraPermissionsAsync();
          if (!perm.granted) { Alert.alert('Camera permission needed'); return null; }
          return ImagePicker.launchCameraAsync(opts);
        })()
      : await ImagePicker.launchImageLibraryAsync(opts);

    if (result && !result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      setImageBase64(result.assets[0].base64 ?? null);
      mutation.reset();
    }
  };

  const d = mutation.data;
  const verdict = d ? VERDICT_META[d.verdict] : null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>🧾 Rip-Off Check</Text>
      <Text style={styles.subtitle}>
        Snap a photo of any repair quote — from a shop or another mechanic — and find out instantly if the price is fair.
      </Text>

      <View style={styles.pickRow}>
        <TouchableOpacity style={styles.pickBtn} onPress={() => pickImage(true)}>
          <Text style={styles.pickIcon}>📷</Text>
          <Text style={styles.pickText}>Take Photo</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.pickBtn} onPress={() => pickImage(false)}>
          <Text style={styles.pickIcon}>🖼️</Text>
          <Text style={styles.pickText}>Choose Photo</Text>
        </TouchableOpacity>
      </View>

      {imageUri && (
        <Image source={{ uri: imageUri }} style={styles.preview} resizeMode="contain" />
      )}

      {imageBase64 && !d && (
        <TouchableOpacity
          style={[styles.checkBtn, mutation.isPending && styles.btnDisabled]}
          onPress={() => mutation.mutate()}
          disabled={mutation.isPending}
        >
          {mutation.isPending
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.checkBtnText}>Am I Being Ripped Off?</Text>}
        </TouchableOpacity>
      )}
      {mutation.isPending && (
        <Text style={styles.analyzing}>Reading the quote and checking prices…</Text>
      )}

      {d && !d.is_quote && (
        <View style={styles.result}>
          <Text style={styles.summary}>{d.summary || "That photo doesn't look like a repair quote. Try a clearer shot of the estimate or invoice."}</Text>
        </View>
      )}

      {d && d.is_quote && verdict && (
        <View style={styles.result}>
          <View style={[styles.verdictBanner, { backgroundColor: verdict.color }]}>
            <Text style={styles.verdictText}>{verdict.emoji} {verdict.label}</Text>
          </View>

          <View style={styles.priceRow}>
            <View style={styles.priceBox}>
              <Text style={styles.priceLabel}>They quoted</Text>
              <Text style={styles.priceValue}>{d.total_quoted}</Text>
            </View>
            <View style={styles.priceBox}>
              <Text style={styles.priceLabel}>Fair range</Text>
              <Text style={[styles.priceValue, { color: '#10b981' }]}>{d.fair_price_range}</Text>
            </View>
          </View>

          <Text style={styles.summary}>{d.summary}</Text>

          {d.line_items.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Line-by-line breakdown</Text>
              {d.line_items.map((li, i) => (
                <View key={i} style={styles.lineItem}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.liName}>{li.item}</Text>
                    <Text style={styles.liTypical}>Typical: {li.typical_price}</Text>
                  </View>
                  <Text style={[styles.liPrice, { color: ITEM_COLOR[li.assessment] }]}>
                    {li.quoted_price}
                  </Text>
                </View>
              ))}
            </>
          )}

          {d.red_flags.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>🚩 Red flags</Text>
              {d.red_flags.map((f, i) => (
                <Text key={i} style={styles.redFlag}>• {f}</Text>
              ))}
            </>
          )}

          <Text style={styles.disclaimer}>
            AI estimate based on typical US market rates — prices vary by region and vehicle. Get a quote from a MechMarket mechanic to compare.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  content: { padding: 20, paddingBottom: 48 },
  title: { fontSize: 24, fontWeight: '800', color: '#f1f5f9', marginBottom: 6 },
  subtitle: { fontSize: 14, color: '#94a3b8', marginBottom: 20, lineHeight: 20 },
  pickRow: { flexDirection: 'row', gap: 12 },
  pickBtn: {
    flex: 1, backgroundColor: '#1e293b', borderRadius: 12, padding: 18,
    alignItems: 'center', borderWidth: 1, borderColor: '#334155',
  },
  pickIcon: { fontSize: 28, marginBottom: 6 },
  pickText: { color: '#f1f5f9', fontWeight: '600', fontSize: 14 },
  preview: { width: '100%', height: 260, borderRadius: 12, marginTop: 16, backgroundColor: '#1e293b' },
  checkBtn: { backgroundColor: '#ef4444', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 16 },
  btnDisabled: { opacity: 0.6 },
  checkBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  analyzing: { color: '#94a3b8', textAlign: 'center', marginTop: 10, fontSize: 13 },
  result: { marginTop: 20, backgroundColor: '#1e293b', borderRadius: 14, padding: 18 },
  verdictBanner: { borderRadius: 10, padding: 14, alignItems: 'center', marginBottom: 16 },
  verdictText: { color: '#fff', fontWeight: '900', fontSize: 18, letterSpacing: 1 },
  priceRow: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  priceBox: { flex: 1, backgroundColor: '#0f172a', borderRadius: 10, padding: 12, alignItems: 'center' },
  priceLabel: { color: '#64748b', fontSize: 12, marginBottom: 4 },
  priceValue: { color: '#f1f5f9', fontSize: 18, fontWeight: '800' },
  summary: { color: '#cbd5e1', fontSize: 14, lineHeight: 21 },
  sectionTitle: { color: '#f1f5f9', fontSize: 15, fontWeight: '700', marginTop: 20, marginBottom: 8 },
  lineItem: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: '#334155', gap: 10,
  },
  liName: { color: '#e2e8f0', fontSize: 14, fontWeight: '600' },
  liTypical: { color: '#64748b', fontSize: 12, marginTop: 2 },
  liPrice: { fontSize: 15, fontWeight: '800' },
  redFlag: { color: '#fca5a5', fontSize: 13, lineHeight: 20, marginBottom: 4 },
  disclaimer: { color: '#64748b', fontSize: 12, marginTop: 18, lineHeight: 17, fontStyle: 'italic' },
});
