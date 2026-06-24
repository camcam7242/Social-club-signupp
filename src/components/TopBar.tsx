import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography } from '@/theme/tokens';

interface Props {
  title?: string;
  onBack?: () => void;
  right?: React.ReactNode;
}

export function TopBar({ title, onBack, right }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingTop: insets.top + 12 }]}>
      <View style={styles.left}>
        {onBack && (
          <TouchableOpacity onPress={onBack} style={styles.backBtn} hitSlop={8}>
            <Text style={styles.chevron}>‹</Text>
          </TouchableOpacity>
        )}
      </View>
      <Text style={styles.title}>{title ?? ''}</Text>
      <View style={styles.right}>{right ?? null}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12, backgroundColor: colors.white },
  left: { width: 44, alignItems: 'flex-start' },
  right: { width: 44, alignItems: 'flex-end' },
  title: { flex: 1, textAlign: 'center', ...typography.screenTitle, fontSize: 17 },
  backBtn: { padding: 4 },
  chevron: { fontSize: 30, color: colors.ink, lineHeight: 32, marginTop: -2 },
});
