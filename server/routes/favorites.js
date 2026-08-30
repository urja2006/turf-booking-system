// ================================================================
// TURFBOOK — FAVORITES ROUTES
// ================================================================

const express = require('express');
const router = express.Router();
const { localStore, calculateDistanceKm } = require('../supabase');
const { requireAuth } = require('../middleware/auth');

/**
 * GET /api/favorites
 * List all saved favorite turfs for the user
 */
router.get('/', requireAuth, (req, res) => {
    try {
        const { lat, lng } = req.query;
        const userLat = lat ? parseFloat(lat) : null;
        const userLng = lng ? parseFloat(lng) : null;

        const userFavs = localStore.favorites.filter(f => f.user_id === req.user.id);
        const favoriteTurfIds = userFavs.map(f => f.turf_id);

        const turfs = localStore.turfs
            .filter(t => favoriteTurfIds.includes(t.id))
            .map(t => {
                let distance = null;
                if (userLat && userLng) {
                    distance = calculateDistanceKm(userLat, userLng, t.latitude, t.longitude);
                }
                return {
                    ...t,
                    distance,
                    is_favorite: true
                };
            });

        return res.json({
            success: true,
            total: turfs.length,
            turfs
        });
    } catch (err) {
        console.error('Get favorites error:', err);
        return res.status(500).json({ success: false, message: 'Failed to retrieve favorites.' });
    }
});

/**
 * POST /api/favorites/:turfId
 * Add or toggle favorite
 */
router.post('/:turfId', requireAuth, (req, res) => {
    try {
        const { turfId } = req.params;
        const turf = localStore.turfs.find(t => t.id === turfId);

        if (!turf) {
            return res.status(404).json({ success: false, message: 'Turf not found.' });
        }

        const existingIndex = localStore.favorites.findIndex(
            f => f.user_id === req.user.id && f.turf_id === turfId
        );

        let isFavorite = false;
        if (existingIndex >= 0) {
            // Remove favorite
            localStore.favorites.splice(existingIndex, 1);
            isFavorite = false;
        } else {
            // Add favorite
            localStore.favorites.push({
                id: 'f' + Math.random().toString(36).substr(2, 9) + '-' + Date.now(),
                user_id: req.user.id,
                turf_id: turfId,
                created_at: new Date().toISOString()
            });
            isFavorite = true;
        }

        return res.json({
            success: true,
            is_favorite: isFavorite,
            message: isFavorite ? 'Added to favorites ❤️' : 'Removed from favorites'
        });
    } catch (err) {
        console.error('Toggle favorite error:', err);
        return res.status(500).json({ success: false, message: 'Failed to update favorites.' });
    }
});

/**
 * DELETE /api/favorites/:turfId
 * Remove from favorites
 */
router.delete('/:turfId', requireAuth, (req, res) => {
    try {
        const { turfId } = req.params;
        const existingIndex = localStore.favorites.findIndex(
            f => f.user_id === req.user.id && f.turf_id === turfId
        );

        if (existingIndex >= 0) {
            localStore.favorites.splice(existingIndex, 1);
        }

        return res.json({
            success: true,
            message: 'Removed from favorites'
        });
    } catch (err) {
        console.error('Delete favorite error:', err);
        return res.status(500).json({ success: false, message: 'Failed to remove favorite.' });
    }
});

module.exports = router;
