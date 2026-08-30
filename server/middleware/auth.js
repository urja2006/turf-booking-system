// ================================================================
// TURFBOOK — AUTHENTICATION & AUTHORIZATION MIDDLEWARE
// ================================================================

const jwt = require('jsonwebtoken');
const { localStore, isSupabaseConfigured, supabaseClient } = require('../supabase');

const JWT_SECRET = process.env.JWT_SECRET || 'turfbook_development_jwt_secret_token_12345';

/**
 * Helper to extract user profile from token payload
 */
async function resolveUserFromToken(token) {
    if (!token) return null;

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Find profile in store
        if (isSupabaseConfigured && supabaseClient) {
            const { data, error } = await supabaseClient
                .from('profiles')
                .select('*')
                .eq('id', decoded.id)
                .single();
            if (data && !error && data.is_active) return data;
        }

        // Check in local fallback store
        const localUser = localStore.profiles.find(p => p.id === decoded.id);
        if (localUser && localUser.is_active) {
            return {
                id: localUser.id,
                email: localUser.email,
                full_name: localUser.full_name,
                phone: localUser.phone,
                role: localUser.role,
                avatar_url: localUser.avatar_url,
                is_active: localUser.is_active
            };
        }

        return null;
    } catch (err) {
        return null;
    }
}

/**
 * Strict authentication guard for protected user actions (booking, canceling, favorites)
 */
async function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required. Please login to continue with your booking.'
        });
    }

    const user = await resolveUserFromToken(token);
    if (!user) {
        return res.status(401).json({
            success: false,
            message: 'Invalid or expired session. Please login again.'
        });
    }

    req.user = user;
    next();
}

/**
 * Optional authentication: Attaches user if token is present, does not reject guests
 */
async function optionalAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    if (token) {
        req.user = await resolveUserFromToken(token);
    } else {
        req.user = null;
    }
    next();
}

/**
 * Strict Admin guard: Verifies role is specifically 'admin'
 */
async function requireAdmin(req, res, next) {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Admin authentication required.'
        });
    }

    const user = await resolveUserFromToken(token);
    if (!user || user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Administrator privileges required.'
        });
    }

    req.user = user;
    next();
}

module.exports = {
    requireAuth,
    optionalAuth,
    requireAdmin,
    JWT_SECRET
};
