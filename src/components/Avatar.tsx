import React, { useState } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { colors } from '@/theme/tokens';

const ACCENT_COLORS = [colors.blue, colors.avatarOrange, colors.avatarPurple, colors.avatarTeal, colors.avatarPink];

function colorForName(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return ACCENT_COLORS[Math.abs(hash) % ACCENT_COLORS.length];
}

interface Props {
  name: string;
  src?: string;
  size?: number;
  radius?: number;
}

export function Avatar({ name, src, size = 44, radius }: Props) {
  const [imgError, setImgError] = useState(false);
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const bg = colorForName(name);
  const br = radius ?? size / 2;

  return (
    <View style={[styles.wrap, { width: size, height: size, borderRadius: br, backgroundColor: bg }]}>
      {src && !imgError ? (
        <Image source={{ uri: src }} style={[styles.img, { borderRadius: br }]} onError={() => setImgError(true)} />
      ) : (
        <Text style={[styles.initials, { fontSize: size * 0.36 }]}>{initials}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  img: { width: '100%', height: '100%' },
  initials: { color: '#fff', fontWeight: '700' },
});
