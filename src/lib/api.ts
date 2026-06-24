import { supabase } from './supabase';
import { ProProfile, Booking, Service } from './database.types';

export async function getProProfile(userId: string) {
  const { data, error } = await supabase
    .from('pro_profiles')
    .select('*, services(*), portfolio_photos(*)')
    .eq('user_id', userId)
    .single();
  if (error) throw error;
  return data;
}

export async function searchPros(opts: {
  specialties?: string[];
  maxDistanceKm?: number;
  minRating?: number;
  maxPriceCents?: number;
}) {
  let query = supabase
    .from('pro_profiles')
    .select('*, services(price_cents)')
    .eq('subscription_active', true);

  if (opts.specialties?.length) {
    query = query.overlaps('specialties', opts.specialties);
  }
  if (opts.minRating) {
    query = query.gte('rating', opts.minRating);
  }

  const { data, error } = await query.order('rating', { ascending: false }).limit(50);
  if (error) throw error;
  return data;
}

export async function createBooking(booking: Omit<Booking, 'id' | 'created_at' | 'status'>) {
  const { data, error } = await supabase
    .from('bookings')
    .insert({ ...booking, status: 'requested' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getBookingsForClient(clientId: string) {
  const { data, error } = await supabase
    .from('bookings')
    .select('*, pro_profiles(business_name, location, user_id), services(name, duration_minutes)')
    .eq('client_id', clientId)
    .order('scheduled_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function getBookingsForPro(proId: string) {
  const { data, error } = await supabase
    .from('bookings')
    .select('*, profiles(full_name, avatar_url), services(name, duration_minutes)')
    .eq('pro_id', proId)
    .order('scheduled_at', { ascending: true });
  if (error) throw error;
  return data;
}

export async function updateBookingStatus(bookingId: string, status: Booking['status']) {
  const { data, error } = await supabase
    .from('bookings')
    .update({ status })
    .eq('id', bookingId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getMessages(bookingId: string) {
  const { data, error } = await supabase
    .from('messages')
    .select('*, profiles(full_name, avatar_url)')
    .eq('booking_id', bookingId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data;
}

export function subscribeToMessages(bookingId: string, callback: (msg: any) => void) {
  return supabase
    .channel(`messages:${bookingId}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `booking_id=eq.${bookingId}`,
    }, payload => callback(payload.new))
    .subscribe();
}

export async function upsertProProfile(userId: string, profile: Partial<ProProfile>) {
  const { data, error } = await supabase
    .from('pro_profiles')
    .upsert({ user_id: userId, ...profile })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function upsertServices(proId: string, services: { name: string; duration_minutes: number; price_cents: number }[]) {
  await supabase.from('services').update({ is_active: false }).eq('pro_id', proId);
  const { data, error } = await supabase
    .from('services')
    .insert(services.map(s => ({ ...s, pro_id: proId, is_active: true })))
    .select();
  if (error) throw error;
  return data;
}

export async function submitReview(review: { booking_id: string; reviewer_id: string; reviewee_id: string; rating: number; comment?: string }) {
  const { data, error } = await supabase
    .from('reviews')
    .insert(review)
    .select()
    .single();
  if (error) throw error;
  return data;
}
