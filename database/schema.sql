-- ================================================================
-- TURFBOOK DATABASE SCHEMA (SUPABASE POSTGRESQL)
-- ================================================================

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE (Linked with Supabase Auth or standalone)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. SPORTS TABLE
CREATE TABLE IF NOT EXISTS sports (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    icon TEXT NOT NULL,
    description TEXT
);

-- 3. TURFS TABLE
CREATE TABLE IF NOT EXISTS turfs (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    image_url TEXT,
    price_per_hour NUMERIC NOT NULL,
    opening_time TEXT DEFAULT '06:00 AM',
    closing_time TEXT DEFAULT '11:00 PM',
    rating NUMERIC DEFAULT 4.5,
    reviews_count INT DEFAULT 0,
    facilities TEXT[] DEFAULT ARRAY['Parking', 'Washroom', 'Flood Lights', 'Drinking Water'],
    contact_phone TEXT,
    contact_email TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. TURF_SPORTS (Many-to-Many relationship between Turfs & Sports with custom pricing)
CREATE TABLE IF NOT EXISTS turf_sports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    turf_id TEXT REFERENCES turfs(id) ON DELETE CASCADE,
    sport_id TEXT REFERENCES sports(id) ON DELETE CASCADE,
    price_per_hour NUMERIC NOT NULL,
    UNIQUE(turf_id, sport_id)
);

-- 5. BOOKINGS TABLE
CREATE TABLE IF NOT EXISTS bookings (
    id TEXT PRIMARY KEY,
    booking_reference TEXT UNIQUE NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    turf_id TEXT REFERENCES turfs(id) ON DELETE CASCADE,
    sport_id TEXT REFERENCES sports(id) ON DELETE SET NULL,
    booking_date DATE NOT NULL,
    start_time TEXT NOT NULL, -- e.g. '07:00 PM'
    end_time TEXT NOT NULL,   -- e.g. '08:00 PM'
    duration INT DEFAULT 1,   -- in hours
    players INT DEFAULT 10,
    amount NUMERIC NOT NULL,
    platform_fee NUMERIC DEFAULT 40,
    total_amount NUMERIC NOT NULL,
    payment_method TEXT DEFAULT 'Pay at Venue' CHECK (payment_method IN ('Pay at Venue', 'Demo Online Payment')),
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
    status TEXT DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'completed', 'cancelled', 'pending')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. FAVORITES TABLE
CREATE TABLE IF NOT EXISTS favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    turf_id TEXT REFERENCES turfs(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, turf_id)
);

-- 7. REVIEWS TABLE
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    turf_id TEXT REFERENCES turfs(id) ON DELETE CASCADE,
    booking_id TEXT REFERENCES bookings(id) ON DELETE SET NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ================================================================
-- INDEXES FOR FAST QUERYING & LOCATION SEARCH
-- ================================================================
CREATE INDEX IF NOT EXISTS idx_turfs_city ON turfs(city);
CREATE INDEX IF NOT EXISTS idx_turfs_coords ON turfs(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_bookings_date_slot ON bookings(turf_id, booking_date, start_time, status);
CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);

-- ================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ================================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE turfs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sports ENABLE ROW LEVEL SECURITY;
ALTER TABLE turf_sports ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Public can read turfs, sports, turf_sports, reviews
CREATE POLICY "Public can view turfs" ON turfs FOR SELECT USING (true);
CREATE POLICY "Public can view sports" ON sports FOR SELECT USING (true);
CREATE POLICY "Public can view turf_sports" ON turf_sports FOR SELECT USING (true);
CREATE POLICY "Public can view reviews" ON reviews FOR SELECT USING (true);

-- Authenticated Users RLS
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own bookings" ON bookings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own bookings" ON bookings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can cancel own bookings" ON bookings FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own favorites" ON favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage favorites" ON favorites FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can insert reviews" ON reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
