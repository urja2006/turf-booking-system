// ================================================================
// TURFBOOK — AUTHENTICATION ROUTES
// ================================================================

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { localStore, isSupabaseConfigured, supabaseClient, supabaseAdmin } = require('../supabase');
const { requireAuth, JWT_SECRET } = require('../middleware/auth');

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', async (req, res) => {
    try {
        const { email, password, full_name, phone } = req.body;

        if (!email || !password || !full_name) {
            return res.status(400).json({ success: false, message: 'Please provide full name, email, and password.' });
        }

        if (password.length < 6) {
            return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
        }

        const normalizedEmail = email.trim().toLowerCase();

        // Check if user exists in local store
        const existingLocal = localStore.profiles.find(p => p.email.toLowerCase() === normalizedEmail);
        if (existingLocal) {
            return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const newUserId = 'u' + Math.random().toString(36).substr(2, 9) + '-' + Date.now();

        const newProfile = {
            id: newUserId,
            email: normalizedEmail,
            passwordHash,
            full_name: full_name.trim(),
            phone: phone ? phone.trim() : '+91 9999999999',
            role: 'user',
            avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(full_name)}`,
            is_active: true,
            created_at: new Date().toISOString()
        };

        // Save to local store
        localStore.profiles.push(newProfile);

        // Also save to Supabase if active
        if (isSupabaseConfigured && supabaseClient) {
            try {
                await supabaseClient.from('profiles').insert([{
                    id: newProfile.id,
                    email: newProfile.email,
                    full_name: newProfile.full_name,
                    phone: newProfile.phone,
                    role: 'user',
                    avatar_url: newProfile.avatar_url,
                    is_active: true
                }]);
            } catch (err) {
                console.warn('Supabase profile sync note:', err.message);
            }
        }

        const token = jwt.sign(
            { id: newProfile.id, email: newProfile.email, role: newProfile.role },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        const safeUser = { ...newProfile };
        delete safeUser.passwordHash;

        return res.status(201).json({
            success: true,
            message: 'Registration successful! Welcome to TurfBook.',
            token,
            user: safeUser
        });
    } catch (err) {
        console.error('Registration error:', err);
        return res.status(500).json({ success: false, message: 'Server error during registration.' });
    }
});

/**
 * POST /api/auth/login
 * Standard user login
 */
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required.' });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const user = localStore.profiles.find(p => p.email.toLowerCase() === normalizedEmail);

        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid email or password.' });
        }

        if (!user.is_active) {
            return res.status(403).json({ success: false, message: 'Your account has been deactivated. Please contact support.' });
        }

        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid email or password.' });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        const safeUser = { ...user };
        delete safeUser.passwordHash;

        return res.json({
            success: true,
            message: `Welcome back, ${user.full_name}!`,
            token,
            user: safeUser
        });
    } catch (err) {
        console.error('Login error:', err);
        return res.status(500).json({ success: false, message: 'Server error during login.' });
    }
});

/**
 * POST /api/auth/admin-login
 * Dedicated secure admin login portal
 */
router.post('/admin-login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Admin credentials required.' });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const user = localStore.profiles.find(p => p.email.toLowerCase() === normalizedEmail);

        if (!user || user.role !== 'admin') {
            return res.status(401).json({ success: false, message: 'Access denied: Invalid administrator credentials.' });
        }

        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Access denied: Invalid administrator credentials.' });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, role: 'admin' },
            JWT_SECRET,
            { expiresIn: '3d' }
        );

        const safeUser = { ...user };
        delete safeUser.passwordHash;

        return res.json({
            success: true,
            message: 'Admin access granted.',
            token,
            user: safeUser
        });
    } catch (err) {
        console.error('Admin login error:', err);
        return res.status(500).json({ success: false, message: 'Server error during admin login.' });
    }
});

/**
 * GET /api/auth/me
 * Fetch authenticated user profile
 */
router.get('/me', requireAuth, (req, res) => {
    return res.json({
        success: true,
        user: req.user
    });
});

/**
 * PUT /api/auth/profile
 * Update user details
 */
router.put('/profile', requireAuth, (req, res) => {
    const { full_name, phone, avatar_url } = req.body;
    const user = localStore.profiles.find(p => p.id === req.user.id);

    if (user) {
        if (full_name) user.full_name = full_name.trim();
        if (phone) user.phone = phone.trim();
        if (avatar_url) user.avatar_url = avatar_url.trim();

        const safeUser = { ...user };
        delete safeUser.passwordHash;

        return res.json({
            success: true,
            message: 'Profile updated successfully.',
            user: safeUser
        });
    }

    return res.status(404).json({ success: false, message: 'User not found.' });
});

module.exports = router;
