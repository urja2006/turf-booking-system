// ================================================================
// TURFBOOK — SUPABASE CLIENT & IN-MEMORY FALLBACK ADAPTER
// ================================================================
// This module provides a unified database interface.
// If valid SUPABASE_URL and SUPABASE_ANON_KEY are present in .env,
// it uses the real Supabase PostgreSQL cloud backend.
// Otherwise, it automatically falls back to an in-memory mock store
// pre-seeded with 18 realistic turfs so the app is instantly runnable!
// ================================================================

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const isSupabaseConfigured = Boolean(
    supabaseUrl && 
    supabaseAnonKey && 
    supabaseUrl.startsWith('https://') && 
    !supabaseUrl.includes('your-project')
);

let supabaseClient = null;
let supabaseAdmin = null;

if (isSupabaseConfigured) {
    try {
        supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
        if (supabaseServiceKey && !supabaseServiceKey.includes('your-supabase')) {
            supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
        } else {
            supabaseAdmin = supabaseClient;
        }
        console.log('✅ Supabase connected successfully to:', supabaseUrl);
    } catch (err) {
        console.warn('⚠️ Supabase init warning, falling back to in-memory store:', err.message);
    }
} else {
    console.log('ℹ️ Running in Local In-Memory Fallback Mode (No Supabase keys detected in .env). Everything works out of the box!');
}

// -------------------------------------------------------------
// LOCAL IN-MEMORY DATA STORE (Seeded with 18 Turfs, Sports, Users)
// -------------------------------------------------------------
const localStore = {
    sports: [
        { id: 'football', name: 'Football', icon: '⚽', description: 'FIFA standard artificial turf pitches for 5v5, 7v7 and 11v11 matches' },
        { id: 'cricket', name: 'Cricket', icon: '🏏', description: 'Full-size pitch with lush outfield and practice nets' },
        { id: 'box_cricket', name: 'Box Cricket', icon: '🏏', description: 'Enclosed turf arena with boundary nets, ideal for 6v6 to 8v8 gully cricket' },
        { id: 'futsal', name: 'Futsal', icon: '🥅', description: 'Fast-paced indoor & outdoor turf specially cushioned for high traction' },
        { id: 'badminton', name: 'Badminton', icon: '🏸', description: 'BWF approved synthetic wooden and rubberised courts with anti-glare lights' },
        { id: 'basketball', name: 'Basketball', icon: '🏀', description: 'Standard polyurethane surfaced courts with acrylic backboards' },
        { id: 'volleyball', name: 'Volleyball', icon: '🏐', description: 'Sand and cushioned turf courts with international height net setups' },
        { id: 'tennis', name: 'Tennis', icon: '🎾', description: 'Synthetic hard court with tournament grade acrylic surfacing' }
    ],

    profiles: [
        {
            id: 'a0000000-0000-0000-0000-000000000001',
            email: 'admin@turfbook.com',
            passwordHash: bcrypt.hashSync('admin123', 10),
            full_name: 'System Administrator',
            phone: '+91 9876543210',
            role: 'admin',
            avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
            is_active: true,
            created_at: new Date(Date.now() - 30 * 86400000).toISOString()
        },
        {
            id: 'u0000000-0000-0000-0000-000000000001',
            email: 'user@turfbook.com',
            passwordHash: bcrypt.hashSync('user123', 10),
            full_name: 'Rahul Sharma',
            phone: '+91 9898989898',
            role: 'user',
            avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
            is_active: true,
            created_at: new Date(Date.now() - 15 * 86400000).toISOString()
        }
    ],

    turfs: [
        {
            id: 'turf_ahd_01',
            name: 'Kick Arena Sports Hub',
            description: 'State-of-the-art FIFA certified turf with floodlights, dugout seating and locker rooms.',
            address: 'Opposite Alpha One Mall, Vastrapur',
            city: 'Ahmedabad',
            state: 'Gujarat',
            latitude: 23.0373,
            longitude: 72.5298,
            image_url: 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800&auto=format&fit=crop&q=80',
            gallery: [
                'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800&auto=format&fit=crop&q=80',
                'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&auto=format&fit=crop&q=80',
                'https://images.unsplash.com/photo-1518604666860-9ed391f76460?w=800&auto=format&fit=crop&q=80'
            ],
            price_per_hour: 800,
            opening_time: '06:00 AM',
            closing_time: '12:00 AM',
            rating: 4.8,
            reviews_count: 128,
            facilities: ['Parking', 'Washroom', 'Flood Lights', 'Drinking Water', 'Changing Room', 'Seating', 'Canteen'],
            sports: ['football', 'box_cricket', 'futsal'],
            sport_prices: { football: 800, box_cricket: 750, futsal: 700 },
            contact_phone: '+91 7940012345',
            contact_email: 'vastrapur@kickarena.com',
            status: 'active',
            created_at: new Date().toISOString()
        },
        {
            id: 'turf_ahd_02',
            name: 'Satellite Smash & Goal Arena',
            description: 'Premium multi-sport facility featuring 2 box cricket pitches and 1 standard 7v7 football turf.',
            address: 'Near Star Bazaar, Jodhpur Cross Road, Satellite',
            city: 'Ahmedabad',
            state: 'Gujarat',
            latitude: 23.0242,
            longitude: 72.5186,
            image_url: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&auto=format&fit=crop&q=80',
            gallery: [
                'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&auto=format&fit=crop&q=80',
                'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&auto=format&fit=crop&q=80'
            ],
            price_per_hour: 900,
            opening_time: '06:00 AM',
            closing_time: '11:30 PM',
            rating: 4.7,
            reviews_count: 94,
            facilities: ['Parking', 'Washroom', 'Flood Lights', 'Drinking Water', 'Equipment Rental'],
            sports: ['football', 'box_cricket', 'badminton'],
            sport_prices: { football: 900, box_cricket: 850, badminton: 450 },
            contact_phone: '+91 7940023456',
            contact_email: 'info@satellitesports.in',
            status: 'active',
            created_at: new Date().toISOString()
        },
        {
            id: 'turf_ahd_03',
            name: 'Sindhu Bhavan Champions Turf',
            description: 'Ultra-modern sports arena located on SBR. High-density imported turf with professional LED lighting.',
            address: 'Beside Taj Skyline, Sindhu Bhavan Road, Bodakdev',
            city: 'Ahmedabad',
            state: 'Gujarat',
            latitude: 23.0489,
            longitude: 72.5023,
            image_url: 'https://images.unsplash.com/photo-1518604666860-9ed391f76460?w=800&auto=format&fit=crop&q=80',
            gallery: [
                'https://images.unsplash.com/photo-1518604666860-9ed391f76460?w=800&auto=format&fit=crop&q=80',
                'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800&auto=format&fit=crop&q=80'
            ],
            price_per_hour: 1200,
            opening_time: '05:30 AM',
            closing_time: '01:00 AM',
            rating: 4.9,
            reviews_count: 210,
            facilities: ['Valet Parking', 'Washroom', 'Changing Room', 'Flood Lights', 'Canteen', 'Wi-Fi', 'First Aid'],
            sports: ['football', 'box_cricket', 'basketball'],
            sport_prices: { football: 1200, box_cricket: 1100, basketball: 600 },
            contact_phone: '+91 7940034567',
            contact_email: 'contact@sbchampions.com',
            status: 'active',
            created_at: new Date().toISOString()
        },
        {
            id: 'turf_ahd_04',
            name: 'Navrangpura Urban Turf & Box',
            description: 'Central city turf popular for college and corporate tournaments. Well maintained pitch & nets.',
            address: 'Near Gujarat University, Navrangpura',
            city: 'Ahmedabad',
            state: 'Gujarat',
            latitude: 23.0365,
            longitude: 72.5492,
            image_url: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&auto=format&fit=crop&q=80',
            price_per_hour: 750,
            opening_time: '06:00 AM',
            closing_time: '11:00 PM',
            rating: 4.5,
            reviews_count: 82,
            facilities: ['Parking', 'Washroom', 'Flood Lights', 'Drinking Water', 'Equipment Rental'],
            sports: ['football', 'box_cricket', 'volleyball'],
            sport_prices: { football: 750, box_cricket: 700, volleyball: 500 },
            contact_phone: '+91 7940045678',
            contact_email: 'urban@navrangturf.com',
            status: 'active',
            created_at: new Date().toISOString()
        },
        {
            id: 'turf_ahd_05',
            name: 'SG Highway PowerPlay Arena',
            description: 'Spacious double turf ground with high ceiling netting, pavilion view and beverage lounge.',
            address: 'Near Gota Flyover, SG Highway',
            city: 'Ahmedabad',
            state: 'Gujarat',
            latitude: 23.0964,
            longitude: 72.5369,
            image_url: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&auto=format&fit=crop&q=80',
            price_per_hour: 850,
            opening_time: '06:00 AM',
            closing_time: '12:00 AM',
            rating: 4.6,
            reviews_count: 65,
            facilities: ['Parking', 'Washroom', 'Flood Lights', 'Lounge', 'Seating', 'Canteen'],
            sports: ['cricket', 'box_cricket', 'football'],
            sport_prices: { cricket: 1200, box_cricket: 850, football: 850 },
            contact_phone: '+91 7940056789',
            contact_email: 'powerplay@sghighway.in',
            status: 'active',
            created_at: new Date().toISOString()
        },
        // SURAT
        {
            id: 'turf_sur_01',
            name: 'Vesu Striker Turf Complex',
            description: 'Surat premier rooftop turf arena with scenic skyline views and bouncy cushion surface.',
            address: 'VIP Road, Near Rahul Raj Mall, Vesu',
            city: 'Surat',
            state: 'Gujarat',
            latitude: 21.1442,
            longitude: 72.7758,
            image_url: 'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=800&auto=format&fit=crop&q=80',
            price_per_hour: 950,
            opening_time: '06:00 AM',
            closing_time: '12:30 AM',
            rating: 4.8,
            reviews_count: 142,
            facilities: ['Parking', 'Washroom', 'Flood Lights', 'Changing Room', 'Wi-Fi'],
            sports: ['football', 'box_cricket'],
            sport_prices: { football: 950, box_cricket: 900 },
            contact_phone: '+91 2614001122',
            contact_email: 'vesu@strikers.in',
            status: 'active',
            created_at: new Date().toISOString()
        },
        {
            id: 'turf_sur_02',
            name: 'Adajan Riverfront Sports Arena',
            description: 'Riverside sports park offering football pitch, badminton court and dedicated cricket bowling nets.',
            address: 'Near LP Savani Road, Adajan',
            city: 'Surat',
            state: 'Gujarat',
            latitude: 21.1959,
            longitude: 72.7933,
            image_url: 'https://images.unsplash.com/photo-1459865264687-595d652de67e?w=800&auto=format&fit=crop&q=80',
            price_per_hour: 700,
            opening_time: '06:00 AM',
            closing_time: '11:00 PM',
            rating: 4.4,
            reviews_count: 78,
            facilities: ['Parking', 'Washroom', 'Flood Lights', 'Drinking Water', 'Equipment Rental'],
            sports: ['football', 'badminton', 'cricket'],
            sport_prices: { football: 700, badminton: 400, cricket: 900 },
            contact_phone: '+91 2614002233',
            contact_email: 'adajan@riverfrontturf.com',
            status: 'active',
            created_at: new Date().toISOString()
        },
        // VADODARA
        {
            id: 'turf_bdq_01',
            name: 'Alkapuri Legends Turf Club',
            description: 'Centrally located luxury turf with 40mm monofilament grass and electronic scoreboard.',
            address: 'RC Dutt Road, Alkapuri',
            city: 'Vadodara',
            state: 'Gujarat',
            latitude: 22.3107,
            longitude: 73.1706,
            image_url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&auto=format&fit=crop&q=80',
            price_per_hour: 800,
            opening_time: '06:00 AM',
            closing_time: '11:30 PM',
            rating: 4.7,
            reviews_count: 115,
            facilities: ['Parking', 'Washroom', 'Flood Lights', 'Scoreboard', 'Locker Room'],
            sports: ['football', 'box_cricket', 'tennis'],
            sport_prices: { football: 800, box_cricket: 750, tennis: 600 },
            contact_phone: '+91 2654003344',
            contact_email: 'alkapuri@legendsturf.com',
            status: 'active',
            created_at: new Date().toISOString()
        },
        {
            id: 'turf_bdq_02',
            name: 'Gotri Grand Slam Arena',
            description: 'Massive sports facility with 2 multi-purpose turfs, basketball court and table tennis zone.',
            address: 'Near Sevasi Canal Road, Gotri',
            city: 'Vadodara',
            state: 'Gujarat',
            latitude: 22.3168,
            longitude: 73.1362,
            image_url: 'https://images.unsplash.com/photo-1526232761682-d26e03ac148e?w=800&auto=format&fit=crop&q=80',
            price_per_hour: 650,
            opening_time: '06:00 AM',
            closing_time: '11:00 PM',
            rating: 4.5,
            reviews_count: 59,
            facilities: ['Parking', 'Washroom', 'Flood Lights', 'Drinking Water', 'Cafeteria'],
            sports: ['football', 'basketball', 'badminton'],
            sport_prices: { football: 650, basketball: 500, badminton: 350 },
            contact_phone: '+91 2654004455',
            contact_email: 'gotri@grandslam.in',
            status: 'active',
            created_at: new Date().toISOString()
        },
        // MUMBAI
        {
            id: 'turf_mum_01',
            name: 'Bandra SeaView Turf & Skydeck',
            description: 'Iconic rooftop turf with cool Arabian sea breeze, pro turf shock-pads and music sound system.',
            address: 'Carter Road Promenade, Bandra West',
            city: 'Mumbai',
            state: 'Maharashtra',
            latitude: 19.0664,
            longitude: 72.8258,
            image_url: 'https://images.unsplash.com/photo-1551958219-acbc608c6377?w=800&auto=format&fit=crop&q=80',
            price_per_hour: 1600,
            opening_time: '06:00 AM',
            closing_time: '01:00 AM',
            rating: 4.9,
            reviews_count: 340,
            facilities: ['Valet Parking', 'Washroom', 'Changing Room', 'Flood Lights', 'Sound System', 'Cafe'],
            sports: ['football', 'box_cricket', 'futsal'],
            sport_prices: { football: 1600, box_cricket: 1500, futsal: 1300 },
            contact_phone: '+91 2240019988',
            contact_email: 'bandra@skyturf.in',
            status: 'active',
            created_at: new Date().toISOString()
        },
        {
            id: 'turf_mum_02',
            name: 'Andheri Kickoff Arena',
            description: 'High energy turf with dual pitch configuration. Shock-absorbent rubber infill for knee safety.',
            address: 'Near Infiniti Mall, Link Road, Andheri West',
            city: 'Mumbai',
            state: 'Maharashtra',
            latitude: 19.1363,
            longitude: 72.8301,
            image_url: 'https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?w=800&auto=format&fit=crop&q=80',
            price_per_hour: 1400,
            opening_time: '06:00 AM',
            closing_time: '12:30 AM',
            rating: 4.7,
            reviews_count: 195,
            facilities: ['Parking', 'Washroom', 'Flood Lights', 'Drinking Water', 'Equipment Rental'],
            sports: ['football', 'box_cricket'],
            sport_prices: { football: 1400, box_cricket: 1300 },
            contact_phone: '+91 2240028877',
            contact_email: 'andheri@kickoff.com',
            status: 'active',
            created_at: new Date().toISOString()
        },
        {
            id: 'turf_mum_03',
            name: 'Powai Lakeside Sports Hub',
            description: 'Picturesque arena next to Powai Lake with European turf carpeting and high boundary netting.',
            address: 'Hiranandani Gardens, Powai',
            city: 'Mumbai',
            state: 'Maharashtra',
            latitude: 19.1197,
            longitude: 72.9051,
            image_url: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800&auto=format&fit=crop&q=80',
            price_per_hour: 1300,
            opening_time: '06:00 AM',
            closing_time: '11:30 PM',
            rating: 4.8,
            reviews_count: 160,
            facilities: ['Parking', 'Washroom', 'Flood Lights', 'Changing Room', 'Canteen'],
            sports: ['football', 'cricket', 'badminton'],
            sport_prices: { football: 1300, cricket: 1500, badminton: 600 },
            contact_phone: '+91 2240037766',
            contact_email: 'powai@lakesidesports.in',
            status: 'active',
            created_at: new Date().toISOString()
        },
        // PUNE
        {
            id: 'turf_pun_01',
            name: 'Kothrud Goalzone Turf Park',
            description: 'Popular college turf with synthetic all-weather grass, perimeter safety netting, and pro referees on demand.',
            address: 'Near MIT College, Paud Road, Kothrud',
            city: 'Pune',
            state: 'Maharashtra',
            latitude: 18.5074,
            longitude: 73.8077,
            image_url: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?w=800&auto=format&fit=crop&q=80',
            price_per_hour: 850,
            opening_time: '06:00 AM',
            closing_time: '11:30 PM',
            rating: 4.6,
            reviews_count: 110,
            facilities: ['Parking', 'Washroom', 'Flood Lights', 'Equipment Rental', 'First Aid'],
            sports: ['football', 'box_cricket'],
            sport_prices: { football: 850, box_cricket: 800 },
            contact_phone: '+91 2040015544',
            contact_email: 'kothrud@goalzone.in',
            status: 'active',
            created_at: new Date().toISOString()
        },
        {
            id: 'turf_pun_02',
            name: 'Baner High-Performance Arena',
            description: 'Olympic level 50mm diamond turf with advanced shock-pads. Best for football leagues and box cricket.',
            address: 'Balewadi High Street, Baner',
            city: 'Pune',
            state: 'Maharashtra',
            latitude: 18.5590,
            longitude: 73.7868,
            image_url: 'https://images.unsplash.com/photo-1543351611-58f69d7c1781?w=800&auto=format&fit=crop&q=80',
            price_per_hour: 1100,
            opening_time: '05:30 AM',
            closing_time: '12:00 AM',
            rating: 4.8,
            reviews_count: 175,
            facilities: ['Parking', 'Washroom', 'Flood Lights', 'Changing Room', 'Wi-Fi', 'Sports Cafe'],
            sports: ['football', 'box_cricket', 'basketball'],
            sport_prices: { football: 1100, box_cricket: 1000, basketball: 650 },
            contact_phone: '+91 2040026655',
            contact_email: 'baner@highperformance.com',
            status: 'active',
            created_at: new Date().toISOString()
        },
        // BENGALURU
        {
            id: 'turf_blr_01',
            name: 'Koramangala Playfield Arena',
            description: 'Bangalore tech corridor top-rated sports ground with floodlit turf, showers, and tournament hosting.',
            address: '100ft Road, 4th Block, Koramangala',
            city: 'Bengaluru',
            state: 'Karnataka',
            latitude: 12.9352,
            longitude: 77.6245,
            image_url: 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800&auto=format&fit=crop&q=80',
            price_per_hour: 1250,
            opening_time: '06:00 AM',
            closing_time: '01:00 AM',
            rating: 4.8,
            reviews_count: 280,
            facilities: ['Parking', 'Washroom', 'Showers', 'Flood Lights', 'Changing Room', 'Lounge'],
            sports: ['football', 'box_cricket', 'futsal'],
            sport_prices: { football: 1250, box_cricket: 1200, futsal: 1000 },
            contact_phone: '+91 8040018899',
            contact_email: 'koramangala@playfield.in',
            status: 'active',
            created_at: new Date().toISOString()
        },
        {
            id: 'turf_blr_02',
            name: 'Indiranagar Urban Turf & Court',
            description: 'Multi-sport turf arena with 2 synthetic courts and chill lounge for post-match hangouts.',
            address: '12th Main Road, HAL 2nd Stage, Indiranagar',
            city: 'Bengaluru',
            state: 'Karnataka',
            latitude: 12.9784,
            longitude: 77.6408,
            image_url: 'https://images.unsplash.com/photo-1520342868574-5fa3804e551c?w=800&auto=format&fit=crop&q=80',
            price_per_hour: 1350,
            opening_time: '06:00 AM',
            closing_time: '12:00 AM',
            rating: 4.9,
            reviews_count: 220,
            facilities: ['Parking', 'Washroom', 'Flood Lights', 'Cafe', 'Sound System'],
            sports: ['football', 'badminton', 'tennis'],
            sport_prices: { football: 1350, badminton: 550, tennis: 800 },
            contact_phone: '+91 8040029900',
            contact_email: 'indiranagar@urbanturf.com',
            status: 'active',
            created_at: new Date().toISOString()
        },
        // DELHI
        {
            id: 'turf_del_01',
            name: 'Saket Elite Sports Ground',
            description: 'Sprawling athletic facility with 9v9 turf, box cricket arena and floodlit basketball court.',
            address: 'Press Enclave Road, Saket',
            city: 'Delhi',
            state: 'Delhi',
            latitude: 28.5244,
            longitude: 77.2167,
            image_url: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&auto=format&fit=crop&q=80',
            price_per_hour: 1500,
            opening_time: '05:30 AM',
            closing_time: '12:30 AM',
            rating: 4.8,
            reviews_count: 190,
            facilities: ['Valet Parking', 'Washroom', 'Changing Room', 'Flood Lights', 'Cafe', 'First Aid'],
            sports: ['football', 'cricket', 'basketball'],
            sport_prices: { football: 1500, cricket: 1800, basketball: 700 },
            contact_phone: '+91 1140014433',
            contact_email: 'saket@elitesports.in',
            status: 'active',
            created_at: new Date().toISOString()
        },
        {
            id: 'turf_del_02',
            name: 'Hauz Khas Green Turf Arena',
            description: 'Eco-friendly green turf tucked near HKV with premium imported artificial grass and mist cooling.',
            address: 'Near Deer Park, Hauz Khas',
            city: 'Delhi',
            state: 'Delhi',
            latitude: 28.5494,
            longitude: 77.2001,
            image_url: 'https://images.unsplash.com/photo-1518604666860-9ed391f76460?w=800&auto=format&fit=crop&q=80',
            price_per_hour: 1400,
            opening_time: '06:00 AM',
            closing_time: '12:00 AM',
            rating: 4.7,
            reviews_count: 145,
            facilities: ['Parking', 'Washroom', 'Flood Lights', 'Misting System', 'Drinking Water'],
            sports: ['football', 'box_cricket'],
            sport_prices: { football: 1400, box_cricket: 1300 },
            contact_phone: '+91 1140025544',
            contact_email: 'hk@greenturf.com',
            status: 'active',
            created_at: new Date().toISOString()
        }
    ],

    bookings: [
        {
            id: 'b0000000-0000-0000-0000-000000000001',
            booking_reference: 'TB-20260825-1001',
            user_id: 'u0000000-0000-0000-0000-000000000001',
            user_name: 'Rahul Sharma',
            user_email: 'user@turfbook.com',
            turf_id: 'turf_ahd_01',
            turf_name: 'Kick Arena Sports Hub',
            turf_image: 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800&auto=format&fit=crop&q=80',
            turf_address: 'Opposite Alpha One Mall, Vastrapur, Ahmedabad',
            sport_id: 'football',
            sport_name: 'Football',
            booking_date: new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0],
            start_time: '07:00 PM',
            end_time: '08:00 PM',
            duration: 1,
            players: 10,
            amount: 800,
            platform_fee: 40,
            total_amount: 840,
            payment_method: 'Pay at Venue',
            payment_status: 'paid',
            status: 'completed',
            created_at: new Date(Date.now() - 5 * 86400000).toISOString()
        },
        {
            id: 'b0000000-0000-0000-0000-000000000002',
            booking_reference: 'TB-20260828-1002',
            user_id: 'u0000000-0000-0000-0000-000000000001',
            user_name: 'Rahul Sharma',
            user_email: 'user@turfbook.com',
            turf_id: 'turf_ahd_03',
            turf_name: 'Sindhu Bhavan Champions Turf',
            turf_image: 'https://images.unsplash.com/photo-1518604666860-9ed391f76460?w=800&auto=format&fit=crop&q=80',
            turf_address: 'Beside Taj Skyline, Sindhu Bhavan Road, Bodakdev, Ahmedabad',
            sport_id: 'box_cricket',
            sport_name: 'Box Cricket',
            booking_date: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
            start_time: '08:00 PM',
            end_time: '09:00 PM',
            duration: 1,
            players: 12,
            amount: 1100,
            platform_fee: 40,
            total_amount: 1140,
            payment_method: 'Demo Online Payment',
            payment_status: 'paid',
            status: 'confirmed',
            created_at: new Date(Date.now() - 86400000).toISOString()
        }
    ],

    favorites: [
        {
            id: 'f0000000-0000-0000-0000-000000000001',
            user_id: 'u0000000-0000-0000-0000-000000000001',
            turf_id: 'turf_ahd_01',
            created_at: new Date().toISOString()
        }
    ],

    reviews: [
        {
            id: 'r0000000-0000-0000-0000-000000000001',
            user_id: 'u0000000-0000-0000-0000-000000000001',
            user_name: 'Rahul Sharma',
            turf_id: 'turf_ahd_01',
            booking_id: 'b0000000-0000-0000-0000-000000000001',
            rating: 5,
            comment: 'Exceptional turf quality! The LED floodlights are bright with no dark spots. Highly recommended for night games.',
            created_at: new Date(Date.now() - 3 * 86400000).toISOString()
        },
        {
            id: 'r0000000-0000-0000-0000-000000000002',
            user_id: 'u0000000-0000-0000-0000-000000000001',
            user_name: 'Aman Patel',
            turf_id: 'turf_ahd_03',
            rating: 5,
            comment: 'Best turf on Sindhu Bhavan Road. The cafe has great energy drinks and locker rooms are spotless.',
            created_at: new Date(Date.now() - 5 * 86400000).toISOString()
        },
        {
            id: 'r0000000-0000-0000-0000-000000000003',
            user_id: 'u0000000-0000-0000-0000-000000000001',
            user_name: 'Sameer Khan',
            turf_id: 'turf_mum_01',
            rating: 5,
            comment: 'Playing next to Carter Road with ocean breeze is unbeatable. Truly a premier vibe.',
            created_at: new Date(Date.now() - 7 * 86400000).toISOString()
        }
    ]
};

// -------------------------------------------------------------
// HELPER: HAVERSINE DISTANCE FORMULA (in Kilometers)
// -------------------------------------------------------------
function calculateDistanceKm(lat1, lon1, lat2, lon2) {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Number((R * c).toFixed(1));
}

module.exports = {
    isSupabaseConfigured,
    supabaseClient,
    supabaseAdmin,
    localStore,
    calculateDistanceKm
};
