// ================================================================
// TURFBOOK — ADMIN DASHBOARD & MANAGEMENT ROUTES
// ================================================================

const express = require('express');
const router = express.Router();
const { localStore, calculateDistanceKm } = require('../supabase');
const { requireAdmin } = require('../middleware/auth');

// Protect all admin endpoints
router.use(requireAdmin);

/**
 * GET /api/admin/stats
 * Overview analytics, metrics and chart data for Admin Dashboard
 */
router.get('/stats', (req, res) => {
    try {
        const todayStr = new Date().toISOString().split('T')[0];

        const totalUsers = localStore.profiles.filter(p => p.role === 'user').length;
        const totalTurfs = localStore.turfs.length;
        const activeTurfs = localStore.turfs.filter(t => t.status === 'active').length;
        const totalBookings = localStore.bookings.length;

        // Today's Bookings
        const todayBookings = localStore.bookings.filter(b => b.booking_date === todayStr);

        // Revenue Calculation (Excluding cancelled)
        const confirmedBookings = localStore.bookings.filter(b => b.status !== 'cancelled');
        const totalRevenue = confirmedBookings.reduce((sum, b) => sum + (b.total_amount || 0), 0);
        const todayRevenue = todayBookings
            .filter(b => b.status !== 'cancelled')
            .reduce((sum, b) => sum + (b.total_amount || 0), 0);

        // Pending Bookings
        const pendingBookings = localStore.bookings.filter(b => b.status === 'pending').length;

        // Most Booked Turf
        const turfBookingCounts = {};
        localStore.bookings.forEach(b => {
            turfBookingCounts[b.turf_id] = (turfBookingCounts[b.turf_id] || 0) + 1;
        });
        const topTurfId = Object.keys(turfBookingCounts).reduce((a, b) => turfBookingCounts[a] > turfBookingCounts[b] ? a : b, null);
        const mostBookedTurf = topTurfId ? localStore.turfs.find(t => t.id === topTurfId) : null;

        // Popular Sports Breakdown
        const sportStats = {};
        localStore.sports.forEach(s => { sportStats[s.id] = { name: s.name, count: 0 }; });
        localStore.bookings.forEach(b => {
            if (b.sport_id && sportStats[b.sport_id]) {
                sportStats[b.sport_id].count++;
            }
        });

        // 7-day Booking Trend for Chart.js
        const last7DaysLabels = [];
        const last7DaysCounts = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date(Date.now() - i * 86400000);
            const dateString = d.toISOString().split('T')[0];
            const displayLabel = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
            last7DaysLabels.push(displayLabel);

            const countForDay = localStore.bookings.filter(b => b.booking_date === dateString).length;
            last7DaysCounts.push(countForDay);
        }

        return res.json({
            success: true,
            stats: {
                totalUsers,
                totalTurfs,
                activeTurfs,
                totalBookings,
                todayBookingsCount: todayBookings.length,
                totalRevenue,
                todayRevenue,
                pendingBookings,
                mostBookedTurf: mostBookedTurf ? { name: mostBookedTurf.name, count: turfBookingCounts[topTurfId] } : { name: 'Kick Arena', count: 0 },
                sportsPopularity: Object.values(sportStats)
            },
            chartData: {
                labels: last7DaysLabels,
                bookingsTrend: last7DaysCounts,
                sportsLabels: Object.values(sportStats).map(s => s.name),
                sportsCounts: Object.values(sportStats).map(s => s.count)
            }
        });
    } catch (err) {
        console.error('Admin stats error:', err);
        return res.status(500).json({ success: false, message: 'Failed to compute admin statistics.' });
    }
});

/**
 * GET /api/admin/turfs
 * Retrieve all turfs for admin
 */
router.get('/turfs', (req, res) => {
    return res.json({
        success: true,
        total: localStore.turfs.length,
        turfs: localStore.turfs
    });
});

/**
 * POST /api/admin/turfs
 * Add a new turf
 */
router.post('/turfs', (req, res) => {
    try {
        const {
            name,
            description,
            address,
            city,
            state,
            latitude,
            longitude,
            price_per_hour,
            opening_time = '06:00 AM',
            closing_time = '11:00 PM',
            facilities = [],
            sports = ['football'],
            sport_prices = {},
            image_url,
            contact_phone,
            contact_email,
            status = 'active'
        } = req.body;

        if (!name || !address || !city || !price_per_hour) {
            return res.status(400).json({ success: false, message: 'Name, address, city, and base price per hour are required.' });
        }

        const newTurfId = 'turf_custom_' + Date.now();
        const newTurf = {
            id: newTurfId,
            name: name.trim(),
            description: description || 'Premium multi-sport turf facility.',
            address: address.trim(),
            city: city.trim(),
            state: state || 'Gujarat',
            latitude: latitude ? parseFloat(latitude) : 23.0225,
            longitude: longitude ? parseFloat(longitude) : 72.5714,
            image_url: image_url || 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800&auto=format&fit=crop&q=80',
            gallery: [image_url || 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800&auto=format&fit=crop&q=80'],
            price_per_hour: parseFloat(price_per_hour),
            opening_time,
            closing_time,
            rating: 5.0,
            reviews_count: 0,
            facilities: Array.isArray(facilities) ? facilities : ['Parking', 'Washroom', 'Flood Lights'],
            sports: Array.isArray(sports) ? sports : ['football'],
            sport_prices: sport_prices || { football: parseFloat(price_per_hour) },
            contact_phone: contact_phone || '+91 9876543210',
            contact_email: contact_email || 'info@turfbook.com',
            status,
            created_at: new Date().toISOString()
        };

        localStore.turfs.unshift(newTurf);

        return res.status(201).json({
            success: true,
            message: 'New turf created successfully.',
            turf: newTurf
        });
    } catch (err) {
        console.error('Admin create turf error:', err);
        return res.status(500).json({ success: false, message: 'Failed to create turf.' });
    }
});

/**
 * PUT /api/admin/turfs/:id
 * Update an existing turf
 */
router.put('/turfs/:id', (req, res) => {
    try {
        const { id } = req.params;
        const turf = localStore.turfs.find(t => t.id === id);

        if (!turf) {
            return res.status(404).json({ success: false, message: 'Turf not found.' });
        }

        const updateData = req.body;
        if (updateData.name) turf.name = updateData.name.trim();
        if (updateData.description !== undefined) turf.description = updateData.description;
        if (updateData.address) turf.address = updateData.address.trim();
        if (updateData.city) turf.city = updateData.city.trim();
        if (updateData.state) turf.state = updateData.state.trim();
        if (updateData.latitude) turf.latitude = parseFloat(updateData.latitude);
        if (updateData.longitude) turf.longitude = parseFloat(updateData.longitude);
        if (updateData.price_per_hour) turf.price_per_hour = parseFloat(updateData.price_per_hour);
        if (updateData.opening_time) turf.opening_time = updateData.opening_time;
        if (updateData.closing_time) turf.closing_time = updateData.closing_time;
        if (updateData.image_url) turf.image_url = updateData.image_url;
        if (updateData.facilities) turf.facilities = Array.isArray(updateData.facilities) ? updateData.facilities : turf.facilities;
        if (updateData.sports) turf.sports = Array.isArray(updateData.sports) ? updateData.sports : turf.sports;
        if (updateData.sport_prices) turf.sport_prices = updateData.sport_prices;
        if (updateData.contact_phone) turf.contact_phone = updateData.contact_phone;
        if (updateData.contact_email) turf.contact_email = updateData.contact_email;
        if (updateData.status) turf.status = updateData.status;

        return res.json({
            success: true,
            message: 'Turf updated successfully.',
            turf
        });
    } catch (err) {
        console.error('Admin edit turf error:', err);
        return res.status(500).json({ success: false, message: 'Failed to update turf.' });
    }
});

/**
 * DELETE /api/admin/turfs/:id
 * Toggle status or remove turf
 */
router.delete('/turfs/:id', (req, res) => {
    try {
        const { id } = req.params;
        const index = localStore.turfs.findIndex(t => t.id === id);

        if (index === -1) {
            return res.status(404).json({ success: false, message: 'Turf not found.' });
        }

        // Soft delete / toggle
        localStore.turfs[index].status = 'inactive';

        return res.json({
            success: true,
            message: 'Turf marked as inactive.'
        });
    } catch (err) {
        console.error('Admin delete turf error:', err);
        return res.status(500).json({ success: false, message: 'Failed to deactivate turf.' });
    }
});

/**
 * GET /api/admin/bookings
 * View and filter all system bookings
 */
router.get('/bookings', (req, res) => {
    try {
        const { search, status, date, turf_id } = req.query;

        let results = [...localStore.bookings];

        if (search) {
            const q = search.toLowerCase();
            results = results.filter(b => 
                b.booking_reference.toLowerCase().includes(q) ||
                (b.user_name && b.user_name.toLowerCase().includes(q)) ||
                (b.user_email && b.user_email.toLowerCase().includes(q)) ||
                b.turf_name.toLowerCase().includes(q)
            );
        }

        if (status && status !== 'all') {
            results = results.filter(b => b.status === status);
        }

        if (date) {
            results = results.filter(b => b.booking_date === date);
        }

        if (turf_id && turf_id !== 'all') {
            results = results.filter(b => b.turf_id === turf_id);
        }

        results.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        return res.json({
            success: true,
            total: results.length,
            bookings: results
        });
    } catch (err) {
        console.error('Admin bookings error:', err);
        return res.status(500).json({ success: false, message: 'Failed to fetch bookings.' });
    }
});

/**
 * PUT /api/admin/bookings/:id/status
 * Approve, complete, reject or cancel booking
 */
router.put('/bookings/:id/status', (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const booking = localStore.bookings.find(b => b.id === id);
        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found.' });
        }

        const validStatuses = ['confirmed', 'completed', 'cancelled', 'pending'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid booking status.' });
        }

        booking.status = status;
        if (status === 'completed') booking.payment_status = 'paid';
        if (status === 'cancelled') booking.payment_status = 'cancelled';

        return res.json({
            success: true,
            message: `Booking status updated to ${status}.`,
            booking
        });
    } catch (err) {
        console.error('Admin booking status update error:', err);
        return res.status(500).json({ success: false, message: 'Failed to update booking status.' });
    }
});

/**
 * GET /api/admin/users
 * List all registered users
 */
router.get('/users', (req, res) => {
    try {
        const { search } = req.query;
        let users = localStore.profiles.filter(p => p.role === 'user');

        if (search) {
            const q = search.toLowerCase();
            users = users.filter(u => 
                u.full_name.toLowerCase().includes(q) || 
                u.email.toLowerCase().includes(q) ||
                (u.phone && u.phone.includes(q))
            );
        }

        const safeUsers = users.map(u => {
            const userBookings = localStore.bookings.filter(b => b.user_id === u.id);
            const totalSpent = userBookings
                .filter(b => b.status !== 'cancelled')
                .reduce((sum, b) => sum + (b.total_amount || 0), 0);

            return {
                id: u.id,
                full_name: u.full_name,
                email: u.email,
                phone: u.phone,
                role: u.role,
                avatar_url: u.avatar_url,
                is_active: u.is_active,
                created_at: u.created_at,
                bookings_count: userBookings.length,
                total_spent: totalSpent
            };
        });

        return res.json({
            success: true,
            total: safeUsers.length,
            users: safeUsers
        });
    } catch (err) {
        console.error('Admin users error:', err);
        return res.status(500).json({ success: false, message: 'Failed to fetch users.' });
    }
});

/**
 * PUT /api/admin/users/:id/toggle-status
 * Activate or deactivate a user
 */
router.put('/users/:id/toggle-status', (req, res) => {
    try {
        const { id } = req.params;
        const user = localStore.profiles.find(p => p.id === id);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        user.is_active = !user.is_active;

        return res.json({
            success: true,
            message: `User account has been ${user.is_active ? 'activated' : 'deactivated'}.`,
            is_active: user.is_active
        });
    } catch (err) {
        console.error('Toggle user status error:', err);
        return res.status(500).json({ success: false, message: 'Failed to toggle user status.' });
    }
});

/**
 * POST /api/admin/sports
 * Add new sport
 */
router.post('/sports', (req, res) => {
    const { id, name, icon, description } = req.body;
    if (!id || !name || !icon) {
        return res.status(400).json({ success: false, message: 'ID, name, and icon are required.' });
    }

    const sportId = id.trim().toLowerCase().replace(/\s+/g, '_');
    if (localStore.sports.some(s => s.id === sportId)) {
        return res.status(400).json({ success: false, message: 'Sport already exists.' });
    }

    const newSport = { id: sportId, name: name.trim(), icon: icon.trim(), description: description || '' };
    localStore.sports.push(newSport);

    return res.status(201).json({ success: true, message: 'Sport added successfully.', sport: newSport });
});

/**
 * DELETE /api/admin/sports/:id
 * Remove sport
 */
router.delete('/sports/:id', (req, res) => {
    const { id } = req.params;
    const index = localStore.sports.findIndex(s => s.id === id);
    if (index === -1) {
        return res.status(404).json({ success: false, message: 'Sport not found.' });
    }

    localStore.sports.splice(index, 1);
    return res.json({ success: true, message: 'Sport removed successfully.' });
});

module.exports = router;
