export type UserRole = 'pro' | 'client';
export type BookingStatus = 'requested' | 'accepted' | 'declined' | 'completed' | 'cancelled';
export type DepositMode = 'full' | 'partial' | 'none';

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  created_at: string;
}

export interface ProProfile {
  id: string;
  user_id: string;
  business_name: string;
  bio?: string;
  location: string;
  specialties: string[];
  rating: number;
  review_count: number;
  is_verified: boolean;
  deposit_mode: DepositMode;
  stripe_account_id?: string;
  subscription_active: boolean;
  created_at: string;
}

export interface Service {
  id: string;
  pro_id: string;
  name: string;
  duration_minutes: number;
  price_cents: number;
  is_active: boolean;
}

export interface Availability {
  id: string;
  pro_id: string;
  day_of_week: number; // 0=Mon, 6=Sun
  start_time: string;  // HH:MM
  end_time: string;
  is_active: boolean;
}

export interface PortfolioPhoto {
  id: string;
  pro_id: string;
  storage_path: string;
  url: string;
  created_at: string;
}

export interface Booking {
  id: string;
  client_id: string;
  pro_id: string;
  service_id: string;
  status: BookingStatus;
  scheduled_at: string;
  duration_minutes: number;
  price_cents: number;
  deposit_amount_cents: number;
  stripe_payment_intent_id?: string;
  stripe_charge_id?: string;
  tip_cents: number;
  cancellation_reason?: string;
  cancelled_at?: string;
  created_at: string;
}

export interface Review {
  id: string;
  booking_id: string;
  reviewer_id: string;
  reviewee_id: string;
  rating: number;
  comment?: string;
  created_at: string;
}

export interface Message {
  id: string;
  booking_id: string;
  sender_id: string;
  text: string;
  created_at: string;
}

export interface LoyaltyConfig {
  id: string;
  pro_id: string;
  visits_required: number;
  reward_description: string;
  is_active: boolean;
}

export interface LoyaltyProgress {
  id: string;
  client_id: string;
  pro_id: string;
  visit_count: number;
  reward_redeemed: boolean;
}

export interface Referral {
  id: string;
  referrer_id: string;
  referee_id?: string;
  code: string;
  credit_cents: number;
  redeemed: boolean;
  created_at: string;
}

export interface ClientReputation {
  id: string;
  client_id: string;
  reliability_score: number;
  payment_score: number;
  no_show_count: number;
  total_bookings: number;
}
