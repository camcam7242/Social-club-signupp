import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14?target=deno';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2023-10-16' });
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const PLATFORM_FEE_PCT = 0.15;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { booking_id, client_id } = await req.json();
    if (!booking_id || !client_id) throw new Error('booking_id and client_id are required');

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: booking, error: bookingErr } = await supabase
      .from('bookings')
      .select(`
        id, price_cents, deposit_amount_cents, deposit_mode,
        pro_profiles!inner(stripe_account_id, user_id),
        services!inner(name)
      `)
      .eq('id', booking_id)
      .eq('client_id', client_id)
      .single();

    if (bookingErr || !booking) throw new Error('Booking not found');

    const stripeAccountId = (booking as any).pro_profiles?.stripe_account_id;
    if (!stripeAccountId) throw new Error('Pro has not connected their bank account yet');

    const amount = booking.deposit_amount_cents > 0
      ? booking.deposit_amount_cents
      : booking.price_cents;

    const platformFee = Math.round(amount * PLATFORM_FEE_PCT);

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      payment_method_types: ['card'],
      capture_method: 'manual',
      application_fee_amount: platformFee,
      transfer_data: { destination: stripeAccountId },
      metadata: { booking_id, client_id },
      description: `Glamr booking – ${(booking as any).services?.name}`,
    });

    await supabase.from('bookings')
      .update({ stripe_payment_intent_id: paymentIntent.id })
      .eq('id', booking_id);

    return new Response(JSON.stringify({
      client_secret: paymentIntent.client_secret,
      amount,
      platform_fee: platformFee,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
