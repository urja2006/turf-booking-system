-- ================================================================
-- TURFBOOK SEED DATA (18 REALISTIC TURFS + SPORTS + REVIEWS)
-- ================================================================

-- 1. INSERT SPORTS
INSERT INTO sports (id, name, icon, description) VALUES
('football', 'Football', '⚽', 'FIFA standard artificial turf pitches for 5v5, 7v7 and 11v11 matches'),
('cricket', 'Cricket', '🏏', 'Full-size pitch with lush outfield and practice nets'),
('box_cricket', 'Box Cricket', '🏏', 'Enclosed turf arena with boundary nets, ideal for 6v6 to 8v8 gully cricket'),
('futsal', 'Futsal', '🥅', 'Fast-paced indoor & outdoor turf specially cushioned for high traction'),
('badminton', 'Badminton', '🏸', 'BWF approved synthetic wooden and rubberised courts with anti-glare lights'),
('basketball', 'Basketball', '🏀', 'Standard polyurethane surfaced courts with acrylic backboards'),
('volleyball', 'Volleyball', '🏐', 'Sand and cushioned turf courts with international height net setups'),
('tennis', 'Tennis', '🎾', 'Synthetic hard court with tournament grade acrylic surfacing')
ON CONFLICT (id) DO NOTHING;

-- 2. INSERT DEMO PROFILES (Admin & User)
-- Password for admin: admin123 (bcrypt: $2a$10$w8T0MhD1Qo5FqJ6kXm9.reS7N4K4sOaOQkC7z3XwZ/P5I8eWc5l2O or simulated in backend)
-- Password for user: user123
INSERT INTO profiles (id, email, full_name, phone, role, avatar_url, is_active) VALUES
('a0000000-0000-0000-0000-000000000001', 'admin@turfbook.com', 'System Administrator', '+91 9876543210', 'admin', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', true),
('u0000000-0000-0000-0000-000000000001', 'user@turfbook.com', 'Rahul Sharma', '+91 9898989898', 'user', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150', true)
ON CONFLICT (email) DO NOTHING;

-- 3. INSERT 18 REALISTIC TURFS
INSERT INTO turfs (id, name, description, address, city, state, latitude, longitude, image_url, price_per_hour, opening_time, closing_time, rating, reviews_count, facilities, contact_phone, contact_email, status) VALUES
-- AHMEDABAD
('turf_ahd_01', 'Kick Arena Sports Hub', 'State-of-the-art FIFA certified turf with floodlights, dugout seating and locker rooms.', 'Opposite Alpha One Mall, Vastrapur', 'Ahmedabad', 'Gujarat', 23.0373, 72.5298, 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800&auto=format&fit=crop&q=80', 800, '06:00 AM', '12:00 AM', 4.8, 128, ARRAY['Parking', 'Washroom', 'Flood Lights', 'Drinking Water', 'Changing Room', 'Seating', 'Canteen'], '+91 7940012345', 'vastrapur@kickarena.com', 'active'),

('turf_ahd_02', 'Satellite Smash & Goal Arena', 'Premium multi-sport facility featuring 2 box cricket pitches and 1 standard 7v7 football turf.', 'Near Star Bazaar, Jodhpur Cross Road, Satellite', 'Ahmedabad', 'Gujarat', 23.0242, 72.5186, 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&auto=format&fit=crop&q=80', 900, '06:00 AM', '11:30 PM', 4.7, 94, ARRAY['Parking', 'Washroom', 'Flood Lights', 'Drinking Water', 'Equipment Rental'], '+91 7940023456', 'info@satellitesports.in', 'active'),

('turf_ahd_03', 'Sindhu Bhavan Champions Turf', 'Ultra-modern sports arena located on SBR. High-density imported turf with professional LED lighting.', 'Beside Taj Skyline, Sindhu Bhavan Road, Bodakdev', 'Ahmedabad', 'Gujarat', 23.0489, 72.5023, 'https://images.unsplash.com/photo-1518604666860-9ed391f76460?w=800&auto=format&fit=crop&q=80', 1200, '05:30 AM', '01:00 AM', 4.9, 210, ARRAY['Valet Parking', 'Washroom', 'Changing Room', 'Flood Lights', 'Canteen', 'Wi-Fi', 'First Aid'], '+91 7940034567', 'contact@sbchampions.com', 'active'),

('turf_ahd_04', 'Navrangpura Urban Turf & Box', 'Central city turf popular for college and corporate tournaments. Well maintained pitch & nets.', 'Near Gujarat University, Navrangpura', 'Ahmedabad', 'Gujarat', 23.0365, 72.5492, 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&auto=format&fit=crop&q=80', 750, '06:00 AM', '11:00 PM', 4.5, 82, ARRAY['Parking', 'Washroom', 'Flood Lights', 'Drinking Water', 'Equipment Rental'], '+91 7940045678', 'urban@navrangturf.com', 'active'),

('turf_ahd_05', 'SG Highway PowerPlay Arena', 'Spacious double turf ground with high ceiling netting, pavilion view and beverage lounge.', 'Near Gota Flyover, SG Highway', 'Ahmedabad', 'Gujarat', 23.0964, 72.5369, 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&auto=format&fit=crop&q=80', 850, '06:00 AM', '12:00 AM', 4.6, 65, ARRAY['Parking', 'Washroom', 'Flood Lights', 'Lounge', 'Seating', 'Canteen'], '+91 7940056789', 'powerplay@sghighway.in', 'active'),

-- SURAT
('turf_sur_01', 'Vesu Striker Turf Complex', 'Surat premier rooftop turf arena with scenic skyline views and bouncy cushion surface.', 'VIP Road, Near Rahul Raj Mall, Vesu', 'Surat', 'Gujarat', 21.1442, 72.7758, 'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=800&auto=format&fit=crop&q=80', 950, '06:00 AM', '12:30 AM', 4.8, 142, ARRAY['Parking', 'Washroom', 'Flood Lights', 'Changing Room', 'Wi-Fi'], '+91 2614001122', 'vesu@strikers.in', 'active'),

('turf_sur_02', 'Adajan Riverfront Sports Arena', 'Riverside sports park offering football pitch, badminton court and dedicated cricket bowling nets.', 'Near LP Savani Road, Adajan', 'Surat', 'Gujarat', 21.1959, 72.7933, 'https://images.unsplash.com/photo-1459865264687-595d652de67e?w=800&auto=format&fit=crop&q=80', 700, '06:00 AM', '11:00 PM', 4.4, 78, ARRAY['Parking', 'Washroom', 'Flood Lights', 'Drinking Water', 'Equipment Rental'], '+91 2614002233', 'adajan@riverfrontturf.com', 'active'),

-- VADODARA
('turf_bdq_01', 'Alkapuri Legends Turf Club', 'Centrally located luxury turf with 40mm monofilament grass and electronic scoreboard.', 'RC Dutt Road, Alkapuri', 'Vadodara', 'Gujarat', 22.3107, 73.1706, 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&auto=format&fit=crop&q=80', 800, '06:00 AM', '11:30 PM', 4.7, 115, ARRAY['Parking', 'Washroom', 'Flood Lights', 'Scoreboard', 'Locker Room'], '+91 2654003344', 'alkapuri@legendsturf.com', 'active'),

('turf_bdq_02', 'Gotri Grand Slam Arena', 'Massive sports facility with 2 multi-purpose turfs, basketball court and table tennis zone.', 'Near Sevasi Canal Road, Gotri', 'Vadodara', 'Gujarat', 22.3168, 73.1362, 'https://images.unsplash.com/photo-1526232761682-d26e03ac148e?w=800&auto=format&fit=crop&q=80', 650, '06:00 AM', '11:00 PM', 4.5, 59, ARRAY['Parking', 'Washroom', 'Flood Lights', 'Drinking Water', 'Cafeteria'], '+91 2654004455', 'gotri@grandslam.in', 'active'),

-- MUMBAI
('turf_mum_01', 'Bandra SeaView Turf & Skydeck', 'Iconic rooftop turf with cool Arabian sea breeze, pro turf shock-pads and music sound system.', 'Carter Road Promenade, Bandra West', 'Mumbai', 'Maharashtra', 19.0664, 72.8258, 'https://images.unsplash.com/photo-1551958219-acbc608c6377?w=800&auto=format&fit=crop&q=80', 1600, '06:00 AM', '01:00 AM', 4.9, 340, ARRAY['Valet Parking', 'Washroom', 'Changing Room', 'Flood Lights', 'Sound System', 'Cafe'], '+91 2240019988', 'bandra@skyturf.in', 'active'),

('turf_mum_02', 'Andheri Kickoff Arena', 'High energy turf with dual pitch configuration. Shock-absorbent rubber infill for knee safety.', 'Near Infiniti Mall, Link Road, Andheri West', 'Mumbai', 'Maharashtra', 19.1363, 72.8301, 'https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?w=800&auto=format&fit=crop&q=80', 1400, '06:00 AM', '12:30 AM', 4.7, 195, ARRAY['Parking', 'Washroom', 'Flood Lights', 'Drinking Water', 'Equipment Rental'], '+91 2240028877', 'andheri@kickoff.com', 'active'),

('turf_mum_03', 'Powai Lakeside Sports Hub', 'Picturesque arena next to Powai Lake with European turf carpeting and high boundary netting.', 'Hiranandani Gardens, Powai', 'Mumbai', 'Maharashtra', 19.1197, 72.9051, 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800&auto=format&fit=crop&q=80', 1300, '06:00 AM', '11:30 PM', 4.8, 160, ARRAY['Parking', 'Washroom', 'Flood Lights', 'Changing Room', 'Canteen'], '+91 2240037766', 'powai@lakesidesports.in', 'active'),

-- PUNE
('turf_pun_01', 'Kothrud Goalzone Turf Park', 'Popular college turf with synthetic all-weather grass, perimeter safety netting, and pro referees on demand.', 'Near MIT College, Paud Road, Kothrud', 'Pune', 'Maharashtra', 18.5074, 73.8077, 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?w=800&auto=format&fit=crop&q=80', 850, '06:00 AM', '11:30 PM', 4.6, 110, ARRAY['Parking', 'Washroom', 'Flood Lights', 'Equipment Rental', 'First Aid'], '+91 2040015544', 'kothrud@goalzone.in', 'active'),

('turf_pun_02', 'Baner High-Performance Arena', 'Olympic level 50mm diamond turf with advanced shock-pads. Best for football leagues and box cricket.', 'Balewadi High Street, Baner', 'Pune', 'Maharashtra', 18.5590, 73.7868, 'https://images.unsplash.com/photo-1543351611-58f69d7c1781?w=800&auto=format&fit=crop&q=80', 1100, '05:30 AM', '12:00 AM', 4.8, 175, ARRAY['Parking', 'Washroom', 'Flood Lights', 'Changing Room', 'Wi-Fi', 'Sports Cafe'], '+91 2040026655', 'baner@highperformance.com', 'active'),

-- BENGALURU
('turf_blr_01', 'Koramangala Playfield Arena', 'Bangalore tech corridor top-rated sports ground with floodlit turf, showers, and tournament hosting.', '100ft Road, 4th Block, Koramangala', 'Bengaluru', 'Karnataka', 12.9352, 77.6245, 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800&auto=format&fit=crop&q=80', 1250, '06:00 AM', '01:00 AM', 4.8, 280, ARRAY['Parking', 'Washroom', 'Showers', 'Flood Lights', 'Changing Room', 'Lounge'], '+91 8040018899', 'koramangala@playfield.in', 'active'),

('turf_blr_02', 'Indiranagar Urban Turf & Court', 'Multi-sport turf arena with 2 synthetic courts and chill lounge for post-match hangouts.', '12th Main Road, HAL 2nd Stage, Indiranagar', 'Bengaluru', 'Karnataka', 12.9784, 77.6408, 'https://images.unsplash.com/photo-1520342868574-5fa3804e551c?w=800&auto=format&fit=crop&q=80', 1350, '06:00 AM', '12:00 AM', 4.9, 220, ARRAY['Parking', 'Washroom', 'Flood Lights', 'Cafe', 'Sound System'], '+91 8040029900', 'indiranagar@urbanturf.com', 'active'),

-- DELHI
('turf_del_01', 'Saket Elite Sports Ground', 'Sprawling athletic facility with 9v9 turf, box cricket arena and floodlit basketball court.', 'Press Enclave Road, Saket', 'Delhi', 'Delhi', 28.5244, 77.2167, 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&auto=format&fit=crop&q=80', 1500, '05:30 AM', '12:30 AM', 4.8, 190, ARRAY['Valet Parking', 'Washroom', 'Changing Room', 'Flood Lights', 'Cafe', 'First Aid'], '+91 1140014433', 'saket@elitesports.in', 'active'),

('turf_del_02', 'Hauz Khas Green Turf Arena', 'Eco-friendly green turf tucked near HKV with premium imported artificial grass and mist cooling.', 'Near Deer Park, Hauz Khas', 'Delhi', 'Delhi', 28.5494, 77.2001, 'https://images.unsplash.com/photo-1518604666860-9ed391f76460?w=800&auto=format&fit=crop&q=80', 1400, '06:00 AM', '12:00 AM', 4.7, 145, ARRAY['Parking', 'Washroom', 'Flood Lights', 'Misting System', 'Drinking Water'], '+91 1140025544', 'hk@greenturf.com', 'active')
ON CONFLICT (id) DO NOTHING;

-- 4. LINK TURFS WITH SPORTS & CUSTOM PRICING
INSERT INTO turf_sports (turf_id, sport_id, price_per_hour) VALUES
-- Ahmedabad Turfs
('turf_ahd_01', 'football', 800),
('turf_ahd_01', 'box_cricket', 750),
('turf_ahd_01', 'futsal', 700),
('turf_ahd_02', 'football', 900),
('turf_ahd_02', 'box_cricket', 850),
('turf_ahd_02', 'badminton', 450),
('turf_ahd_03', 'football', 1200),
('turf_ahd_03', 'box_cricket', 1100),
('turf_ahd_03', 'basketball', 600),
('turf_ahd_04', 'football', 750),
('turf_ahd_04', 'box_cricket', 700),
('turf_ahd_04', 'volleyball', 500),
('turf_ahd_05', 'cricket', 1200),
('turf_ahd_05', 'box_cricket', 850),
('turf_ahd_05', 'football', 850),
-- Surat
('turf_sur_01', 'football', 950),
('turf_sur_01', 'box_cricket', 900),
('turf_sur_02', 'football', 700),
('turf_sur_02', 'badminton', 400),
('turf_sur_02', 'cricket', 900),
-- Vadodara
('turf_bdq_01', 'football', 800),
('turf_bdq_01', 'box_cricket', 750),
('turf_bdq_01', 'tennis', 600),
('turf_bdq_02', 'football', 650),
('turf_bdq_02', 'basketball', 500),
('turf_bdq_02', 'badminton', 350),
-- Mumbai
('turf_mum_01', 'football', 1600),
('turf_mum_01', 'box_cricket', 1500),
('turf_mum_01', 'futsal', 1300),
('turf_mum_02', 'football', 1400),
('turf_mum_02', 'box_cricket', 1300),
('turf_mum_03', 'football', 1300),
('turf_mum_03', 'cricket', 1500),
('turf_mum_03', 'badminton', 600),
-- Pune
('turf_pun_01', 'football', 850),
('turf_pun_01', 'box_cricket', 800),
('turf_pun_02', 'football', 1100),
('turf_pun_02', 'box_cricket', 1000),
('turf_pun_02', 'basketball', 650),
-- Bengaluru
('turf_blr_01', 'football', 1250),
('turf_blr_01', 'box_cricket', 1200),
('turf_blr_01', 'futsal', 1000),
('turf_blr_02', 'football', 1350),
('turf_blr_02', 'badminton', 550),
('turf_blr_02', 'tennis', 800),
-- Delhi
('turf_del_01', 'football', 1500),
('turf_del_01', 'cricket', 1800),
('turf_del_01', 'basketball', 700),
('turf_del_02', 'football', 1400),
('turf_del_02', 'box_cricket', 1300)
ON CONFLICT (turf_id, sport_id) DO NOTHING;

-- 5. INITIAL SEED REVIEWS
INSERT INTO reviews (id, user_id, turf_id, rating, comment, created_at) VALUES
('r0000000-0000-0000-0000-000000000001', 'u0000000-0000-0000-0000-000000000001', 'turf_ahd_01', 5, 'Exceptional turf quality! The LED floodlights are bright with no dark spots. Highly recommended for night games.', now() - INTERVAL '3 days'),
('r0000000-0000-0000-0000-000000000002', 'u0000000-0000-0000-0000-000000000001', 'turf_ahd_03', 5, 'Best turf on Sindhu Bhavan Road. The cafe has great energy drinks and locker rooms are spotless.', now() - INTERVAL '5 days'),
('r0000000-0000-0000-0000-000000000003', 'u0000000-0000-0000-0000-000000000001', 'turf_mum_01', 5, 'Playing next to Carter Road with ocean breeze is unbeatable. Truly a premier vibe.', now() - INTERVAL '7 days')
ON CONFLICT DO NOTHING;

-- 6. SAMPLE PAST BOOKING
INSERT INTO bookings (id, booking_reference, user_id, turf_id, sport_id, booking_date, start_time, end_time, duration, players, amount, platform_fee, total_amount, payment_method, payment_status, status, created_at) VALUES
('b0000000-0000-0000-0000-000000000001', 'TB-20260825-1001', 'u0000000-0000-0000-0000-000000000001', 'turf_ahd_01', 'football', CURRENT_DATE - 5, '07:00 PM', '08:00 PM', 1, 10, 800, 40, 840, 'Pay at Venue', 'paid', 'completed', now() - INTERVAL '5 days'),
('b0000000-0000-0000-0000-000000000002', 'TB-20260828-1002', 'u0000000-0000-0000-0000-000000000001', 'turf_ahd_03', 'box_cricket', CURRENT_DATE + 2, '08:00 PM', '09:00 PM', 1, 12, 1100, 40, 1140, 'Demo Online Payment', 'paid', 'confirmed', now() - INTERVAL '1 day')
ON CONFLICT (id) DO NOTHING;
