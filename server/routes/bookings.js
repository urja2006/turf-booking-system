// ================================================================
// TURFBOOK — BOOKINGS & SLOTS AVAILABILITY ROUTES
// ================================================================

const express = require('express');
const router = express.Router();
const { localStore, isSupabaseConfigured, supabaseClient } = require('../supabase');
const { requireAuth } = require('../middleware/auth');

// Standard 1-hour time slots definition
const ALL_TIME_SLOTS = [
    { start: '06:00 AM', end: '07:00 AM' },
    { start: '07:00 AM', end: '08:00 AM' },
    { start: '08:00 AM', end: '09:00 AM' },
    { start: '09:00 AM', end: '10:00 AM' },
    { start: '10:00 AM', end: '11:00 AM' },
    { start: '11:00 AM', end: '12:00 PM' },
    { start: '12:00 PM', end: '01:00 PM' },
    { start: '01:00 PM', end: '02:00 PM' },
    { start: '02:00 PM', end: '03:00 PM' },
    { start: '03:00 PM', end: '04:00 PM' },
    { start: '04:00 PM', end: '05:00 PM' },
    { start: '05:00 PM', end: '06:00 PM' },
    { start: '06:00 PM', end: '07:00 PM' },
    { start: '07:00 PM', end: '08:00 PM' },
    { start: '08:00 PM', end: '09:00 PM' },
    { start: '09:00 PM', end: '10:00 PM' },
    { start: '10:00 PM', end: '11:00 PM' },
    { start: '11:00 PM', end: '12:00 AM' }
];

/**
 * GET /api/bookings/available-slots
 * Fetch all available vs booked slots for a given turf and date
 */
router.get('/available-slots', (req, res) => {
    try {
        const { turf_id, date } = req.query;

        if (!turf_id || !date) {
            return res.status(400).json({ success: false, message: 'turf_id and date query parameters are required.' });
        }

        const turf = localStore.turfs.find(t => t.id === turf_id);
        if (!turf) {
            return res.status(404).json({ success: false, message: 'Turf not found.' });
        }

        // Find all active bookings for this turf on this date
        const existingBookings = localStore.bookings.filter(b => 
            b.turf_id === turf_id && 
            b.booking_date === date && 
            b.status !== 'cancelled'
        );

        const bookedStartTimes = new Set(existingBookings.map(b => b.start_time));

        // Format slots with availability
        const slots = ALL_TIME_SLOTS.map(slot => ({
            slot_id: `${date}_${slot.start.replace(/\s+/g, '')}`,
            start_time: slot.start,
            end_time: slot.end,
            formatted: `${slot.start} - ${slot.end}`,
            is_available: !bookedStartTimes.has(slot.start)
        }));

        return res.json({
            success: true,
            turf_id,
            date,
            slots
        });
    } catch (err) {
        console.error('Available slots error:', err);
        return res.status(500).json({ success: false, message: 'Failed to fetch available slots.' });
    }
});

/**
 * POST /api/bookings
 * Create a new booking with double-booking prevention & validation
 */
router.post('/', requireAuth, async (req, res) => {
    try {
        const {
            turf_id,
            sport_id,
            booking_date,
            start_time,
            end_time,
            duration = 1,
            players = 10,
            payment_method = 'Pay at Venue'
        } = req.body;

        // 1. Validation of required inputs
        if (!turf_id || !sport_id || !booking_date || !start_time) {
            return res.status(400).json({
                success: false,
                message: 'Incomplete booking details. Please select turf, sport, date, and time slot.'
            });
        }

        // 2. Validate past date
        const todayStr = new Date().toISOString().split('T')[0];
        if (booking_date < todayStr) {
            return res.status(400).json({
                success: false,
                message: 'Cannot book slots for a past date.'
            });
        }

        // 3. Turf existence check
        const turf = localStore.turfs.find(t => t.id === turf_id);
        if (!turf || turf.status !== 'active') {
            return res.status(400).json({
                success: false,
                message: 'Selected turf is currently unavailable for booking.'
            });
        }

        // 4. Validate sport availability at turf
        if (!turf.sports.includes(sport_id)) {
            return res.status(400).json({
                success: false,
                message: 'Selected sport is not available at this turf arena.'
            });
        }

        // 5. CRITICAL: Prevent Double Booking
        const isAlreadyBooked = localStore.bookings.some(b => 
            b.turf_id === turf_id && 
            b.booking_date === booking_date && 
            b.start_time === start_time && 
            b.status !== 'cancelled'
        );

        if (isAlreadyBooked) {
            return res.status(409).json({
                success: false,
                message: `The slot ${start_time} on ${booking_date} has just been booked by someone else. Please choose another slot.`
            });
        }

        // 6. Pricing Calculation
        const pricePerHour = (turf.sport_prices && turf.sport_prices[sport_id]) || turf.price_per_hour;
        const durHours = parseInt(duration, 10) || 1;
        const amount = pricePerHour * durHours;
        const platformFee = 40;
        const totalAmount = amount + platformFee;

        // 7. Generate unique booking reference (e.g. TB-20260831-4821)
        const dateCode = booking_date.replace(/-/g, '');
        const randomDigits = Math.floor(1000 + Math.random() * 9000);
        const bookingReference = `TB-${dateCode}-${randomDigits}`;
        const newBookingId = 'b' + Math.random().toString(36).substr(2, 9) + '-' + Date.now();

        // 8. Find sport details
        const sportObj = localStore.sports.find(s => s.id === sport_id) || { name: sport_id };

        const newBooking = {
            id: newBookingId,
            booking_reference: bookingReference,
            user_id: req.user.id,
            user_name: req.user.full_name,
            user_email: req.user.email,
            turf_id: turf.id,
            turf_name: turf.name,
            turf_image: turf.image_url,
            turf_address: `${turf.address}, ${turf.city}`,
            sport_id: sport_id,
            sport_name: sportObj.name,
            booking_date: booking_date,
            start_time: start_time,
            end_time: end_time || (start_time.includes('PM') ? 'Next Hour' : 'Next Hour'),
            duration: durHours,
            players: parseInt(players, 10) || 10,
            amount: amount,
            platform_fee: platformFee,
            total_amount: totalAmount,
            payment_method: payment_method,
            payment_status: payment_method === 'Demo Online Payment' ? 'paid' : 'pending',
            status: 'confirmed',
            created_at: new Date().toISOString()
        };

        // Save to local store
        localStore.bookings.unshift(newBooking);

        // Also sync to Supabase if configured
        if (isSupabaseConfigured && supabaseClient) {
            try {
                await supabaseClient.from('bookings').insert([{
                    id: newBooking.id,
                    booking_reference: newBooking.booking_reference,
                    user_id: newBooking.user_id,
                    turf_id: newBooking.turf_id,
                    sport_id: newBooking.sport_id,
                    booking_date: newBooking.booking_date,
                    start_time: newBooking.start_time,
                    end_time: newBooking.end_time,
                    duration: newBooking.duration,
                    players: newBooking.players,
                    amount: newBooking.amount,
                    platform_fee: newBooking.platform_fee,
                    total_amount: newBooking.total_amount,
                    payment_method: newBooking.payment_method,
                    payment_status: newBooking.payment_status,
                    status: newBooking.status
                }]);
            } catch (err) {
                console.warn('Supabase booking sync note:', err.message);
            }
        }

        return res.status(201).json({
            success: true,
            message: '🎉 Your turf has been successfully booked!',
            booking: newBooking
        });
    } catch (err) {
        console.error('Booking creation error:', err);
        return res.status(500).json({ success: false, message: 'An error occurred while creating your booking.' });
    }
});

/**
 * GET /api/bookings/my-bookings
 * Retrieve all bookings for the logged-in user
 */
router.get('/my-bookings', requireAuth, (req, res) => {
    try {
        const userBookings = localStore.bookings
            .filter(b => b.user_id === req.user.id)
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        const todayStr = new Date().toISOString().split('T')[0];

        // Split into upcoming and past/completed
        const upcoming = userBookings.filter(b => b.booking_date >= todayStr && b.status === 'confirmed');
        const past = userBookings.filter(b => b.booking_date < todayStr || b.status !== 'confirmed');

        return res.json({
            success: true,
            total: userBookings.length,
            upcoming,
            past,
            all: userBookings
        });
    } catch (err) {
        console.error('My bookings error:', err);
        return res.status(500).json({ success: false, message: 'Failed to fetch your bookings.' });
    }
});

/**
 * PUT /api/bookings/:id/cancel
 * Cancel an eligible upcoming booking
 */
router.put('/:id/cancel', requireAuth, (req, res) => {
    try {
        const { id } = req.params;
        const booking = localStore.bookings.find(b => b.id === id);

        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found.' });
        }

        // Verify ownership
        if (booking.user_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Unauthorized to cancel this booking.' });
        }

        if (booking.status === 'cancelled') {
            return res.status(400).json({ success: false, message: 'This booking is already cancelled.' });
        }

        booking.status = 'cancelled';
        booking.payment_status = booking.payment_method === 'Demo Online Payment' ? 'refunded' : 'cancelled';

        return res.json({
            success: true,
            message: 'Booking cancelled successfully. Refund initiated if prepaid.',
            booking
        });
    } catch (err) {
        console.error('Cancel booking error:', err);
        return res.status(500).json({ success: false, message: 'Failed to cancel booking.' });
    }
});

module.exports = router;
