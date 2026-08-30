// ================================================================
// TURFBOOK — TURFS & SPORTS ROUTES
// ================================================================

const express = require('express');
const router = express.Router();
const { localStore, calculateDistanceKm, isSupabaseConfigured, supabaseClient } = require('../supabase');
const { requireAuth, optionalAuth } = require('../middleware/auth');

/**
 * GET /api/sports
 * List all available sports
 */
router.get('/sports', (req, res) => {
    return res.json({
        success: true,
        sports: localStore.sports
    });
});

/**
 * GET /api/turfs
 * Search, filter and sort turfs with geolocation distance calculation
 */
router.get('/', optionalAuth, (req, res) => {
    try {
        let {
            search,
            city,
            sport,
            min_price,
            max_price,
            rating,
            facilities,
            lat,
            lng,
            radius = 50,
            sort = 'rating_desc'
        } = req.query;

        let results = localStore.turfs.filter(t => t.status === 'active');

        // Geocoding coords
        const userLat = lat ? parseFloat(lat) : null;
        const userLng = lng ? parseFloat(lng) : null;
        const searchRadius = radius ? parseFloat(radius) : 50;

        // Calculate distance for all turfs if user coordinates provided
        if (userLat && userLng) {
            results = results.map(t => ({
                ...t,
                distance: calculateDistanceKm(userLat, userLng, t.latitude, t.longitude)
            }));

            // Filter by radius
            if (searchRadius && !isNaN(searchRadius)) {
                results = results.filter(t => t.distance !== null && t.distance <= searchRadius);
            }
        } else {
            results = results.map(t => ({ ...t, distance: null }));
        }

        // Filter by Search Query (Name, Address, City)
        if (search && search.trim() !== '') {
            const q = search.trim().toLowerCase();
            results = results.filter(t => 
                t.name.toLowerCase().includes(q) ||
                t.address.toLowerCase().includes(q) ||
                t.city.toLowerCase().includes(q) ||
                (t.description && t.description.toLowerCase().includes(q))
            );
        }

        // Filter by City
        if (city && city.trim() !== '' && city.toLowerCase() !== 'all') {
            const c = city.trim().toLowerCase();
            results = results.filter(t => t.city.toLowerCase() === c);
        }

        // Filter by Sport
        if (sport && sport.trim() !== '' && sport.toLowerCase() !== 'all') {
            const s = sport.trim().toLowerCase();
            results = results.filter(t => t.sports && t.sports.includes(s));
        }

        // Filter by Price Range
        if (min_price) {
            const minP = parseFloat(min_price);
            results = results.filter(t => {
                const price = (sport && t.sport_prices && t.sport_prices[sport]) || t.price_per_hour;
                return price >= minP;
            });
        }
        if (max_price) {
            const maxP = parseFloat(max_price);
            results = results.filter(t => {
                const price = (sport && t.sport_prices && t.sport_prices[sport]) || t.price_per_hour;
                return price <= maxP;
            });
        }

        // Filter by Minimum Rating
        if (rating) {
            const minRating = parseFloat(rating);
            results = results.filter(t => (t.rating || 0) >= minRating);
        }

        // Filter by Facilities (comma-separated e.g. 'Parking,Flood Lights')
        if (facilities) {
            const reqFacilities = facilities.split(',').map(f => f.trim().toLowerCase());
            results = results.filter(t => {
                const turfFacs = (t.facilities || []).map(f => f.toLowerCase());
                return reqFacilities.every(rf => turfFacs.includes(rf));
            });
        }

        // Check user favorites if user is authenticated
        const userFavorites = req.user 
            ? localStore.favorites.filter(f => f.user_id === req.user.id).map(f => f.turf_id)
            : [];

        results = results.map(t => ({
            ...t,
            is_favorite: userFavorites.includes(t.id)
        }));

        // Sorting Logic
        if (sort === 'nearest' && userLat && userLng) {
            results.sort((a, b) => (a.distance || 9999) - (b.distance || 9999));
        } else if (sort === 'price_asc') {
            results.sort((a, b) => a.price_per_hour - b.price_per_hour);
        } else if (sort === 'price_desc') {
            results.sort((a, b) => b.price_per_hour - a.price_per_hour);
        } else if (sort === 'popular') {
            results.sort((a, b) => (b.reviews_count || 0) - (a.reviews_count || 0));
        } else {
            // Default: highest rated
            results.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        }

        return res.json({
            success: true,
            total: results.length,
            userLocation: (userLat && userLng) ? { lat: userLat, lng: userLng } : null,
            turfs: results
        });
    } catch (err) {
        console.error('Turfs search error:', err);
        return res.status(500).json({ success: false, message: 'Failed to retrieve turfs.' });
    }
});

/**
 * GET /api/turfs/:id
 * Get complete turf details with sports, prices, facilities, and reviews
 */
router.get('/:id', optionalAuth, (req, res) => {
    try {
        const { id } = req.params;
        const { lat, lng } = req.query;

        const turf = localStore.turfs.find(t => t.id === id);
        if (!turf) {
            return res.status(404).json({ success: false, message: 'Turf not found.' });
        }

        let distance = null;
        if (lat && lng) {
            distance = calculateDistanceKm(parseFloat(lat), parseFloat(lng), turf.latitude, turf.longitude);
        }

        // Get reviews
        const reviews = localStore.reviews
            .filter(r => r.turf_id === id)
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        // Sports details
        const sportsDetails = (turf.sports || []).map(sportId => {
            const sportObj = localStore.sports.find(s => s.id === sportId) || { name: sportId, icon: '⚽' };
            const price = (turf.sport_prices && turf.sport_prices[sportId]) || turf.price_per_hour;
            return {
                id: sportId,
                name: sportObj.name,
                icon: sportObj.icon,
                description: sportObj.description,
                price_per_hour: price
            };
        });

        // Check if saved as favorite
        const isFavorite = req.user 
            ? localStore.favorites.some(f => f.user_id === req.user.id && f.turf_id === id)
            : false;

        return res.json({
            success: true,
            turf: {
                ...turf,
                distance,
                sports_details: sportsDetails,
                is_favorite: isFavorite,
                reviews
            }
        });
    } catch (err) {
        console.error('Turf details error:', err);
        return res.status(500).json({ success: false, message: 'Failed to load turf details.' });
    }
});

/**
 * POST /api/turfs/:id/reviews
 * Submit rating and review for a turf (Authenticated users only)
 */
router.post('/:id/reviews', requireAuth, (req, res) => {
    try {
        const { id } = req.params;
        const { rating, comment, booking_id } = req.body;

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ success: false, message: 'Please provide a valid rating between 1 and 5 stars.' });
        }

        if (!comment || comment.trim().length < 5) {
            return res.status(400).json({ success: false, message: 'Please write a review comment (minimum 5 characters).' });
        }

        const turf = localStore.turfs.find(t => t.id === id);
        if (!turf) {
            return res.status(404).json({ success: false, message: 'Turf not found.' });
        }

        // Prevent duplicate review for the same booking if booking_id provided
        if (booking_id) {
            const existingReview = localStore.reviews.find(r => r.booking_id === booking_id && r.user_id === req.user.id);
            if (existingReview) {
                return res.status(400).json({ success: false, message: 'You have already reviewed this booking.' });
            }
        }

        const newReview = {
            id: 'r' + Math.random().toString(36).substr(2, 9) + '-' + Date.now(),
            user_id: req.user.id,
            user_name: req.user.full_name,
            turf_id: id,
            booking_id: booking_id || null,
            rating: parseInt(rating, 10),
            comment: comment.trim(),
            created_at: new Date().toISOString()
        };

        localStore.reviews.push(newReview);

        // Recalculate turf average rating
        const turfReviews = localStore.reviews.filter(r => r.turf_id === id);
        const avgRating = turfReviews.reduce((sum, r) => sum + r.rating, 0) / turfReviews.length;
        turf.rating = Number(avgRating.toFixed(1));
        turf.reviews_count = turfReviews.length;

        return res.status(201).json({
            success: true,
            message: 'Thank you! Your review has been submitted.',
            review: newReview,
            turf_rating: turf.rating,
            reviews_count: turf.reviews_count
        });
    } catch (err) {
        console.error('Review submit error:', err);
        return res.status(500).json({ success: false, message: 'Failed to submit review.' });
    }
});

module.exports = router;
