import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ibatfcevlsduezikhnay.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_f-53AavTk-TaqTtGMzrj9w_7p_D9NIv';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
