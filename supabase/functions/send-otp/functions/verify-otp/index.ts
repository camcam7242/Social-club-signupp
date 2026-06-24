import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const { user_id, phone, code } = await req.json();
    if (!user_id || !phone || !code) throw new Error('user_id, phone, and code are required');
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: otp, error } = await supabase.from('phone_otps').select('*').eq('user_id', user_id).eq('phone', phone).single();
    if (error || !otp) throw new Error('No OTP found. Please request a new code.');
    await supabase.from('phone_otps').update({ attempts: otp.attempts + 1 }).eq('id', otp.id);
    if (otp.attempts >= 5) { await supabase.from('phone_otps').delete().eq('id', otp.id); throw new Error('Too many attempts. Please request a new code.'); }
    if (new Date(otp.expires_at) < new Date()) { await supabase.from('phone_otps').delete().eq('id', otp.id); throw new Error('Code expired. Please request a new one.'); }
    if (otp.code !== code) throw new Error('Incorrect code. Please try again.');
    await supabase.from('phone_otps').delete().eq('id', otp.id);
    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
