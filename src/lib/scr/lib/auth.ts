import { supabase } from './supabase';

export type AuthStep = 'email_pending' | 'verified' | 'profile_incomplete' | 'complete';

export async function signUpWithEmail(name: string, email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: name },
      emailRedirectTo: 'glamr://auth/callback',
    },
  });
  if (error) throw error;
  if (!data.user) throw new Error('No user returned');

  await supabase.from('profiles').upsert({
    id: data.user.id,
    full_name: name,
    email,
    auth_step: 'email_pending' as AuthStep,
  });

  return data.user;
}

export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.user;
}

export async function sendPasswordReset(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: 'glamr://auth/reset',
  });
  if (error) throw error;
}

export async function saveRole(userId: string, role: 'pro' | 'client') {
  const { error } = await supabase.from('profiles').update({
    role,
    auth_step: 'profile_incomplete' as AuthStep,
  }).eq('id', userId);
  if (error) throw error;
}

export async function deleteAccount(userId: string) {
  const { error } = await supabase.functions.invoke('delete-account', {
    body: { user_id: userId },
  });
  if (error) throw error;
  await supabase.auth.signOut();
}

export async function getAuthStep(userId: string): Promise<AuthStep> {
  const { data, error } = await supabase
    .from('profiles')
    .select('auth_step')
    .eq('id', userId)
    .single();
  if (error) return 'email_pending';
  return (data?.auth_step as AuthStep) ?? 'email_pending';
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
