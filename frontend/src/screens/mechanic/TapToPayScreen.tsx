import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function TapToPayScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Tap to Pay coming soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', alignItems: 'center', justifyContent: 'center' },
  text: { color: '#fff', fontSize: 18 },
});
