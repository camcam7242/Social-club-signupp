export type UserRole = 'customer' | 'mechanic' | 'admin';

export interface User {
  id: string;
  email: string;
  phone?: string;
  role: UserRole;
  email_verified: boolean;
}

export interface Vehicle {
  id: string;
  user_id: string;
  year: number;
  make: string;
  model: string;
  trim?: string;
  vin?: string;
  mileage?: number;
}

export interface Mechanic {
  id: string;
  user_id: string;
  business_name?: string;
  bio?: string;
  verified: boolean;
  is_available: boolean;
  rating: number;
  review_count: number;
  service_radius_km: number;
  current_lat?: number;
  current_lng?: number;
  distance_km?: number;
}

export type RequestStatus = 'open' | 'quoted' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';

export interface ServiceRequest {
  id: string;
  customer_id: string;
  vehicle_id: string;
  service_type: string;
  description: string;
  location_lat: number;
  location_lng: number;
  location_address?: string;
  status: RequestStatus;
  year?: number;
  make?: string;
  model?: string;
  quotes?: Quote[];
  media?: RequestMedia[];
  created_at: string;
}

export interface RequestMedia {
  id: string;
  file_url: string;
  media_type: 'image' | 'video';
}

export type QuoteStatus = 'pending' | 'accepted' | 'rejected' | 'expired';

export interface Quote {
  id: string;
  request_id: string;
  mechanic_id: string;
  price: number;
  estimated_duration_hours?: number;
  notes?: string;
  status: QuoteStatus;
  expires_at: string;
}

export type JobStatus = 'scheduled' | 'en_route' | 'arrived' | 'in_progress' | 'completed' | 'cancelled';

export interface Job {
  id: string;
  request_id: string;
  mechanic_id: string;
  customer_id: string;
  status: JobStatus;
  started_at?: string;
  completed_at?: string;
}
