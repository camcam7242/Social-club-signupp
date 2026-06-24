import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/types';
import { TopBar } from '@/components/TopBar';
import { PrimaryBtn } from '@/components/PrimaryBtn';
import { colors, typography, spacing, radius } from '@/theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'BusinessDetails'>;

function Field({ label, multiline, ...props }: React.ComponentProps<typeof TextInput> & { label: string }) {
  return (
    <View style={field.wrap}>
      <Text style={field.label}>{label}</Text>
      <TextInput
        style={[field.input, multiline && field.multiline]}
        placeholderTextColor={colors.muted}
        multiline={multiline}
        {...props}
      />
    </View>
  );
}

const field = StyleSheet.create({
  wrap: { gap: 6 },
  label: { ...typography.label, color: colors.body },
  input: { height: 52, borderRadius: radius.input, backgroundColor: colors.field, paddingHorizontal: 16, ...typography.body, color: colors.ink },
  multiline: { height: 100, paddingTop: 14, paddingBottom: 14, textAlignVertical: 'top' },
});

export function BusinessDetailsScreen({ navigation }: Props) {
  const [bizName, setBizName] = useState('');
  const [location, setLocation] = useState('');
  const [bio, setBio] = useState('');

  return (
    <SafeAreaView style={styles.safe}>
      <TopBar title="Business details" onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Tell clients about your business</Text>
          <View style={styles.fields}>
            <Field label="Business name" value={bizName} onChangeText={setBizName} placeholder="e.g. Cuts by Jordan" />
            <Field label="Location / neighborhood" value={location} onChangeText={setLocation} placeholder="e.g. Brooklyn, NY" />
            <Field label="Bio" value={bio} onChangeText={setBio} placeholder="What makes your services unique?" multiline />
          </View>
          <PrimaryBtn label="Continue" onPress={() => navigation.navigate('ServicesAndPricing')} disabled={!bizName || !location} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  container: { paddingHorizontal: spacing.screenH, paddingTop: 8, paddingBottom: 40, gap: 24 },
  title: { ...typography.sectionH, color: colors.ink },
  fields: { gap: 16 },
});
