import { supabase } from './supabase';

export type AuthStep = 'phone_pending' | 'verified' | 'profile_incomplete' | 'complete';

export async function signUpWithEmail(name: string, email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: name } },
  });
  if (error) throw error;
  if (!data.user) throw new Error('No user returned');

  await supabase.from('profiles').upsert({
    id: data.user.id,
    full_name: name,
    auth_step: 'phone_pending' as AuthStep,
  });

  return data.user;
}

export async function sendPhoneOtp(userId: string, phone: string) {
  const { data, error } = await supabase.functions.invoke('send-otp', {
    body: { user_id: userId, phone },
  });
  if (error) throw error;
  return data;
}

export async function verifyPhoneOtp(userId: string, phone: string, code: string) {
  const { data, error } = await supabase.functions.invoke('verify-otp', {
    body: { user_id: userId, phone, code },
  });
  if (error) throw error;

  await supabase.from('profiles').update({
    phone,
    phone_verified: true,
    auth_step: 'verified' as AuthStep,
  }).eq('id', userId);

  return data;
}

export async function saveRole(userId: string, role: 'pro' | 'client') {
  const { error } = await supabase.from('profiles').update({
    role,
    auth_step: 'profile_incomplete' as AuthStep,
  }).eq('id', userId);
  if (error) throw error;
}

export async function getAuthStep(userId: string): Promise<AuthStep> {
  const { data, error } = await supabase
    .from('profiles')
    .select('auth_step')
    .eq('id', userId)
    .single();
  if (error) return 'phone_pending';
  return (data?.auth_step as AuthStep) ?? 'phone_pending';
}

export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return data;
}
