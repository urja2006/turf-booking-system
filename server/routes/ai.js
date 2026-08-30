// ================================================================
// TURFBOOK — AI ASSISTANT & RECOMMENDATIONS ROUTES
// ================================================================

const express = require('express');
const router = express.Router();
const { localStore } = require('../supabase');
const { optionalAuth, requireAuth } = require('../middleware/auth');
const { parseNaturalQuery, searchTurfsWithAI, getPersonalizedRecommendations } = require('../aiService');

/**
 * POST /api/ai/query
 * Process a natural language booking or search prompt
 */
router.post('/query', optionalAuth, async (req, res) => {
    try {
        const { query, lat, lng } = req.body;

        if (!query || query.trim() === '') {
            return res.status(400).json({ success: false, message: 'Please enter a search prompt or question.' });
        }

        const userLat = lat ? parseFloat(lat) : null;
        const userLng = lng ? parseFloat(lng) : null;

        // Parse query using NLP parser
        const parsed = parseNaturalQuery(query, userLat, userLng);

        // Find matching turfs
        const matches = searchTurfsWithAI(localStore.turfs, parsed);

        // Construct friendly AI response message
        let responseText = `I found ${matches.length} turf${matches.length === 1 ? '' : 's'}`;
        const criteriaParts = [];
        if (parsed.detectedSport) criteriaParts.push(`for ${parsed.detectedSport.replace('_', ' ')}`);
        if (parsed.maxPrice) criteriaParts.push(`under ₹${parsed.maxPrice}/hr`);
        if (parsed.searchLocation) criteriaParts.push(`around ${parsed.locationName}`);
        if (parsed.maxDistance) criteriaParts.push(`within ${parsed.maxDistance} km`);
        if (parsed.targetDate) criteriaParts.push(`for ${parsed.targetDate}`);
        if (parsed.preferredTime) criteriaParts.push(`during ${parsed.preferredTime}`);
        if (parsed.players) criteriaParts.push(`for ${parsed.players} players`);

        if (criteriaParts.length > 0) {
            responseText += ` matching ${criteriaParts.join(', ')}.`;
        } else {
            responseText += ` based on your request.`;
        }

        if (matches.length === 0) {
            responseText = `I couldn't find any turfs strictly matching all your criteria (${criteriaParts.join(', ')}). Try increasing your search radius or adjusting the price limit!`;
        }

        return res.json({
            success: true,
            query,
            parsed,
            aiMessage: responseText,
            totalMatches: matches.length,
            turfs: matches.slice(0, 6)
        });
    } catch (err) {
        console.error('AI Query error:', err);
        return res.status(500).json({
            success: false,
            message: 'AI Assistant temporarily unavailable. Please browse using standard filters.'
        });
    }
});

/**
 * GET /api/ai/recommendations
 * Personalized recommendations for authenticated users or top picks for guests
 */
router.get('/recommendations', optionalAuth, (req, res) => {
    try {
        const { lat, lng } = req.query;
        const userLat = lat ? parseFloat(lat) : null;
        const userLng = lng ? parseFloat(lng) : null;

        let userBookings = [];
        let userFavorites = [];

        if (req.user) {
            userBookings = localStore.bookings.filter(b => b.user_id === req.user.id);
            userFavorites = localStore.favorites.filter(f => f.user_id === req.user.id);
        }

        const data = getPersonalizedRecommendations(
            userBookings,
            userFavorites,
            localStore.turfs,
            userLat,
            userLng
        );

        return res.json({
            success: true,
            insights: data.insights,
            recommendations: data.recommendations
        });
    } catch (err) {
        console.error('AI Recommendations error:', err);
        return res.status(500).json({ success: false, message: 'Failed to generate recommendations.' });
    }
});

module.exports = router;
