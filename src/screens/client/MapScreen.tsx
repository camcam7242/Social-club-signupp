import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity,
  Animated, Dimensions, Platform, ActivityIndicator,
} from 'react-native';
import MapView, { Marker, Circle, PROVIDER_DEFAULT } from 'react-native-maps';
import * as Location from 'expo-location';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/types';
import { Avatar } from '@/components/Avatar';
import { colors, typography, radius, shadows, spacing } from '@/theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'Map'>;

type NearbyPro = {
  id: string;
  name: string;
  role: string;
  rating: number;
  price: string;
  distance: string;
  lat: number;
  lng: number;
};

const MOCK_PROS: NearbyPro[] = [
  { id: '1', name: 'Jordan B.', role: 'Hair Stylist', rating: 4.9, price: 'from $85', distance: '0.4 mi', lat: 0, lng: 0 },
  { id: '2', name: 'Aaliyah M.', role: 'Nail Tech', rating: 4.8, price: 'from $55', distance: '0.7 mi', lat: 0, lng: 0.006 },
  { id: '3', name: 'Marcus T.', role: 'Barber', rating: 5.0, price: 'from $40', distance: '1.1 mi', lat: -0.007, lng: 0.003 },
  { id: '4', name: 'Sofia R.', role: 'Esthetician', rating: 4.7, price: 'from $90', distance: '1.4 mi', lat: 0.005, lng: -0.005 },
];

export function MapScreen({ navigation }: Props) {
  const mapRef = useRef<MapView>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState(false);
  const [selectedPro, setSelectedPro] = useState<NearbyPro | null>(null);
  const [pros, setPros] = useState<NearbyPro[]>([]);
  const cardAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError(true);
        const fallback = { lat: 40.7128, lng: -74.006 };
        setUserLocation(fallback);
        setPros(MOCK_PROS.map((p) => ({ ...p, lat: fallback.lat + p.lat, lng: fallback.lng + p.lng })));
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = loc.coords;
      setUserLocation({ lat: latitude, lng: longitude });
      setPros(MOCK_PROS.map(p => ({ ...p, lat: latitude + p.lat, lng: longitude + p.lng })));
    })();
  }, []);

  function selectPro(pro: NearbyPro) {
    setSelectedPro(pro);
    Animated.spring(cardAnim, { toValue: 1, useNativeDriver: true, tension: 60, friction: 9 }).start();
    mapRef.current?.animateToRegion({
      latitude: pro.lat - 0.003,
      longitude: pro.lng,
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
    }, 400);
  }

  function deselectPro() {
    Animated.timing(cardAnim, { toValue: 0, duration: 180, useNativeDriver: true }).start(() => setSelectedPro(null));
  }

  const cardTranslate = cardAnim.interpolate({ inputRange: [0, 1], outputRange: [200, 0] });

  if (!userLocation) {
    return (
      <SafeAreaView style={styles.loading}>
        <ActivityIndicator size="large" color={colors.blue} />
        <Text style={styles.loadingText}>Finding your location…</Text>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={{
          latitude: userLocation.lat,
          longitude: userLocation.lng,
          latitudeDelta: 0.03,
          longitudeDelta: 0.03,
        }}
        showsUserLocation
        showsMyLocationButton={false}
        onPress={deselectPro}
      >
        <Circle
          center={{ latitude: userLocation.lat, longitude: userLocation.lng }}
          radius={2000}
          fillColor="rgba(45,108,246,0.06)"
          strokeColor="rgba(45,108,246,0.25)"
          strokeWidth={1}
        />
        {pros.map(pro => (
          <Marker
            key={pro.id}
            coordinate={{ latitude: pro.lat, longitude: pro.lng }}
            onPress={() => selectPro(pro)}
          >
            <View style={[styles.pin, selectedPro?.id === pro.id && styles.pinSelected]}>
              <Text style={[styles.pinText, selectedPro?.id === pro.id && styles.pinTextSelected]}>
                {pro.role.split(' ')[0]}
              </Text>
            </View>
          </Marker>
        ))}
      </MapView>

      <SafeAreaView style={styles.topBar} pointerEvents="box-none">
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <View style={styles.titlePill}>
          <Text style={styles.titlePillText}>Pros near you</Text>
        </View>
        <View style={{ width: 44 }} />
      </SafeAreaView>

      {locationError && (
        <View style={styles.locationBanner}>
          <Text style={styles.locationBannerText}>Location unavailable — showing demo pins</Text>
        </View>
      )}

      {selectedPro && (
        <Animated.View style={[styles.card, { transform: [{ translateY: cardTranslate }] }]}>
          <TouchableOpacity style={styles.cardInner} activeOpacity={0.92} onPress={() => navigation.navigate('ProProfile')}>
            <Avatar name={selectedPro.name} size={56} radius={16} />
            <View style={styles.cardInfo}>
              <Text style={styles.cardName}>{selectedPro.name}</Text>
              <Text style={styles.cardRole}>{selectedPro.role}</Text>
              <View style={styles.cardMeta}>
                <Text style={styles.cardRating}>★ {selectedPro.rating}</Text>
                <Text style={styles.cardDot}>·</Text>
                <Text style={styles.cardPrice}>{selectedPro.price}</Text>
                <Text style={styles.cardDot}>·</Text>
                <Text style={styles.cardDist}>{selectedPro.distance}</Text>
              </View>
            </View>
            <View style={styles.bookBadge}>
              <Text style={styles.bookBadgeText}>Book</Text>
            </View>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white, gap: 16 },
  loadingText: { ...typography.body, color: colors.muted },
  topBar: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.screenH,
    paddingTop: Platform.OS === 'android' ? 40 : 0,
    paddingBottom: 8,
  },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', ...shadows.card },
  backArrow: { fontSize: 20, color: colors.ink },
  titlePill: { backgroundColor: colors.white, paddingHorizontal: 18, paddingVertical: 10, borderRadius: radius.pill, ...shadows.card },
  titlePillText: { ...typography.bodyMed, color: colors.ink },
  locationBanner: { position: 'absolute', top: 100, left: spacing.screenH, right: spacing.screenH, backgroundColor: colors.orangeSoft, borderRadius: radius.input, paddingHorizontal: 14, paddingVertical: 8, alignItems: 'center' },
  locationBannerText: { ...typography.caption, color: colors.warning },
  pin: { backgroundColor: colors.white, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 2, borderColor: colors.blue, ...shadows.card },
  pinSelected: { backgroundColor: colors.blue },
  pinText: { ...typography.caption, color: colors.blue, fontWeight: '700' },
  pinTextSelected: { color: colors.white },
  card: { position: 'absolute', bottom: 40, left: spacing.screenH, right: spacing.screenH, backgroundColor: colors.white, borderRadius: radius.card, ...shadows.card },
  cardInner: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14 },
  cardInfo: { flex: 1, gap: 3 },
  cardName: { ...typography.bodyMed, color: colors.ink, fontSize: 16 },
  cardRole: { ...typography.caption, color: colors.muted },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  cardRating: { ...typography.label, color: colors.orange, fontSize: 12 },
  cardDot: { color: colors.muted, fontSize: 12 },
  cardPrice: { ...typography.caption, color: colors.muted },
  cardDist: { ...typography.caption, color: colors.blue, fontWeight: '600' },
  bookBadge: { backgroundColor: colors.blue, paddingHorizontal: 16, paddingVertical: 8, borderRadius: radius.pill },
  bookBadgeText: { ...typography.label, color: colors.white },
});
