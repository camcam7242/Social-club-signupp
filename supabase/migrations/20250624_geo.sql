-- Enable PostGIS for geo queries
create extension if not exists postgis;

-- Add location columns to pro_profiles
alter table pro_profiles
  add column if not exists lat double precision,
  add column if not exists lng double precision;

-- Spatial index for fast nearby queries
create index if not exists pro_profiles_geo
  on pro_profiles using gist (
    st_makepoint(lng, lat)::geography
  );

-- RPC: find pros within radius_meters of a point, ordered by distance
create or replace function nearby_pros(
  user_lat double precision,
  user_lng double precision,
  radius_meters int default 5000
)
returns table (
  user_id uuid,
  business_name text,
  bio text,
  location text,
  specialties text[],
  rating numeric,
  review_count int,
  is_verified boolean,
  lat double precision,
  lng double precision,
  distance_meters double precision
)
language sql stable
as $$
  select
    p.user_id,
    p.business_name,
    p.bio,
    p.location,
    p.specialties,
    p.rating,
    p.review_count,
    p.is_verified,
    p.lat,
    p.lng,
    st_distance(
      st_makepoint(p.lng, p.lat)::geography,
      st_makepoint(user_lng, user_lat)::geography
    ) as distance_meters
  from pro_profiles p
  where
    p.lat is not null
    and p.lng is not null
    and st_dwithin(
      st_makepoint(p.lng, p.lat)::geography,
      st_makepoint(user_lng, user_lat)::geography,
      radius_meters
    )
  order by distance_meters asc
  limit 50;
$$;
