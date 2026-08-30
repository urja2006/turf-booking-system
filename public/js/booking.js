// ================================================================
// TURFBOOK — BOOKING ENGINE & CHECKOUT WORKFLOW
// ================================================================

let bookingTurf = null;
let selectedSportId = null;
let selectedDate = null;
let selectedSlot = null;
let selectedDuration = 1;
let selectedPlayers = 10;
let selectedPaymentMethod = 'Pay at Venue';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Enforce Authentication Guard immediately
    if (!isAuthenticated()) {
        requireAuthOrRedirect(window.location.href, 'Please login to continue with your booking.');
        return;
    }

    initBookingPage();
});

async function initBookingPage() {
    const urlParams = new URLSearchParams(window.location.search);
    const turfId = urlParams.get('id');

    if (!turfId) {
        showToast('No turf selected for booking.', 'warning');
        setTimeout(() => window.location.href = 'turfs.html', 1200);
        return;
    }

    // Set Date input constraints (Min: Today, Max: Today + 30 Days)
    const dateInput = document.getElementById('booking-date-input');
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const maxDate = new Date(today);
    maxDate.setDate(today.getDate() + 30);
    const maxDateStr = maxDate.toISOString().split('T')[0];

    if (dateInput) {
        dateInput.min = todayStr;
        dateInput.max = maxDateStr;
        dateInput.value = todayStr;
        selectedDate = todayStr;

        dateInput.addEventListener('change', (e) => {
            selectedDate = e.target.value;
            selectedSlot = null; // Reset slot on date change
            updateOrderSummary();
            loadAvailableSlots();
        });
    }

    // Duration & Players listeners
    const durationSelect = document.getElementById('booking-duration-select');
    if (durationSelect) {
        durationSelect.addEventListener('change', (e) => {
            selectedDuration = parseInt(e.target.value, 10) || 1;
            updateOrderSummary();
        });
    }

    const playersInput = document.getElementById('booking-players-input');
    if (playersInput) {
        playersInput.addEventListener('input', (e) => {
            selectedPlayers = parseInt(e.target.value, 10) || 10;
            updateOrderSummary();
        });
    }

    // Payment radio listeners
    const paymentRadios = document.querySelectorAll('input[name="payment_method"]');
    paymentRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            selectedPaymentMethod = e.target.value;
            const demoOnlineBox = document.getElementById('demo-online-payment-card');
            if (demoOnlineBox) {
                if (selectedPaymentMethod === 'Demo Online Payment') {
                    demoOnlineBox.classList.remove('d-none');
                } else {
                    demoOnlineBox.classList.add('d-none');
                }
            }
        });
    });

    // Confirm booking button
    const confirmBtn = document.getElementById('proceed-booking-btn');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', handleProceedBooking);
    }

    await loadTurfForBooking(turfId);
}

async function loadTurfForBooking(turfId) {
    try {
        const turfUrl = typeof getApiUrl === 'function' ? getApiUrl(`/api/turfs/${turfId}`) : `/api/turfs/${turfId}`;
        const res = await fetch(turfUrl);
        const data = await res.json();

        if (!data.success || !data.turf) {
            showToast('Turf not found.', 'error');
            return;
        }

        bookingTurf = data.turf;

        // Render Turf Quick Header
        document.getElementById('book-turf-name').textContent = bookingTurf.name;
        document.getElementById('book-turf-location').textContent = `${bookingTurf.address}, ${bookingTurf.city}`;
        document.getElementById('book-turf-img').src = bookingTurf.image_url;

        // Populate Sports Selection Pills
        renderSportsSelector(bookingTurf.sports_details || []);

        // Initial slots load
        await loadAvailableSlots();

    } catch (err) {
        console.error('Booking turf load error:', err);
        showToast('Failed to load turf information.', 'error');
    }
}

function renderSportsSelector(sportsList) {
    const container = document.getElementById('sports-selector-container');
    if (!container) return;

    if (!sportsList || sportsList.length === 0) {
        container.innerHTML = `<p class="text-muted">No sports configured.</p>`;
        return;
    }

    // Default to first sport
    selectedSportId = sportsList[0].id;

    container.innerHTML = sportsList.map((sport, index) => `
        <div class="col-6 col-md-3 mb-2">
            <div class="sport-select-card p-3 rounded-3 border text-center ${index === 0 ? 'selected-sport' : ''}" 
                 data-sport-id="${sport.id}" data-price="${sport.price_per_hour}"
                 onclick="handleSportSelect('${sport.id}', this)">
                <div class="fs-2 mb-1">${sport.icon}</div>
                <h6 class="fw-bold mb-0">${sport.name}</h6>
                <small class="text-success fw-bold">${formatCurrency(sport.price_per_hour)}/hr</small>
            </div>
        </div>
    `).join('');

    updateOrderSummary();
}

function handleSportSelect(sportId, element) {
    selectedSportId = sportId;
    document.querySelectorAll('.sport-select-card').forEach(el => el.classList.remove('selected-sport'));
    element.classList.add('selected-sport');
    updateOrderSummary();
}

/**
 * Load Dynamic 1-Hour Time Slots from Backend
 */
async function loadAvailableSlots() {
    const container = document.getElementById('slots-grid-container');
    if (!container || !bookingTurf || !selectedDate) return;

    container.innerHTML = `
        <div class="text-center py-4 col-12">
            <div class="spinner-border text-success spinner-border-sm me-2"></div>
            <span class="text-muted">Checking available time slots for ${formatDate(selectedDate)}...</span>
        </div>
    `;

    try {
        const slotsUrl = typeof getApiUrl === 'function' 
            ? getApiUrl(`/api/bookings/available-slots?turf_id=${bookingTurf.id}&date=${selectedDate}`) 
            : `/api/bookings/available-slots?turf_id=${bookingTurf.id}&date=${selectedDate}`;
        const res = await fetch(slotsUrl);
        const data = await res.json();

        if (!data.success || !data.slots) {
            container.innerHTML = `<p class="text-danger">Failed to load slots.</p>`;
            return;
        }

        renderSlotsGrid(data.slots);

    } catch (err) {
        console.error('Slots load error:', err);
        container.innerHTML = `<p class="text-danger">Error connecting to server.</p>`;
    }
}

function renderSlotsGrid(slots) {
    const container = document.getElementById('slots-grid-container');
    if (!container) return;

    container.innerHTML = slots.map(slot => `
        <div class="slot-pill ${slot.is_available ? '' : 'booked'} ${selectedSlot && selectedSlot.start_time === slot.start_time ? 'selected' : ''}"
             onclick="${slot.is_available ? `handleSlotSelect('${slot.start_time}', '${slot.end_time}', this)` : ''}">
            <span class="slot-time">${slot.start_time}</span>
            <span class="slot-status-text ${slot.is_available ? 'text-success' : 'text-danger'}">
                ${slot.is_available ? '● Available' : '✕ Booked'}
            </span>
        </div>
    `).join('');
}

function handleSlotSelect(startTime, endTime, element) {
    selectedSlot = { start_time: startTime, end_time: endTime };
    document.querySelectorAll('.slot-pill').forEach(el => el.classList.remove('selected'));
    element.classList.add('selected');
    updateOrderSummary();
}

/**
 * Update Sidebar Booking Summary
 */
function updateOrderSummary() {
    if (!bookingTurf) return;

    const basePrice = (bookingTurf.sport_prices && bookingTurf.sport_prices[selectedSportId]) || bookingTurf.price_per_hour;
    const amount = basePrice * selectedDuration;
    const platformFee = 40;
    const totalAmount = amount + platformFee;

    document.getElementById('summary-sport').textContent = (selectedSportId || 'Football').replace('_', ' ').toUpperCase();
    document.getElementById('summary-date').textContent = formatDate(selectedDate) || 'Select Date';
    document.getElementById('summary-time').textContent = selectedSlot ? `${selectedSlot.start_time} - ${selectedSlot.end_time}` : 'Select Time Slot';
    document.getElementById('summary-duration').textContent = `${selectedDuration} Hour${selectedDuration > 1 ? 's' : ''}`;
    document.getElementById('summary-players').textContent = `${selectedPlayers} Players`;

    document.getElementById('summary-price').textContent = formatCurrency(amount);
    document.getElementById('summary-fee').textContent = formatCurrency(platformFee);
    document.getElementById('summary-total').textContent = formatCurrency(totalAmount);

    const proceedBtn = document.getElementById('proceed-booking-btn');
    if (proceedBtn) {
        proceedBtn.disabled = !selectedSlot;
        if (!selectedSlot) {
            proceedBtn.textContent = 'Please Select a Time Slot';
        } else {
            proceedBtn.textContent = `Confirm Booking (${formatCurrency(totalAmount)})`;
        }
    }
}

/**
 * Handle Final Booking Submission
 */
async function handleProceedBooking() {
    if (!selectedSlot) {
        showToast('Please select an available time slot.', 'warning');
        return;
    }

    const proceedBtn = document.getElementById('proceed-booking-btn');
    const originalText = proceedBtn.innerHTML;

    try {
        proceedBtn.disabled = true;
        proceedBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>Confirming booking...`;

        const token = getToken();
        const payload = {
            turf_id: bookingTurf.id,
            sport_id: selectedSportId,
            booking_date: selectedDate,
            start_time: selectedSlot.start_time,
            end_time: selectedSlot.end_time,
            duration: selectedDuration,
            players: selectedPlayers,
            payment_method: selectedPaymentMethod
        };

        const bookUrl = typeof getApiUrl === 'function' ? getApiUrl('/api/bookings') : '/api/bookings';
        const res = await fetch(bookUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (!data.success) {
            // Handle Double-Booking Conflict specifically
            if (res.status === 409) {
                showToast(data.message, 'error', 6000);
                await loadAvailableSlots(); // Refresh grid to show slot as booked
            } else {
                showToast(data.message || 'Failed to book slot.', 'error');
            }
            proceedBtn.disabled = false;
            proceedBtn.innerHTML = originalText;
            return;
        }

        // Show Success Confirmation Modal
        renderBookingSuccessModal(data.booking);

    } catch (err) {
        console.error('Booking submission error:', err);
        showToast('Network error during booking.', 'error');
        proceedBtn.disabled = false;
        proceedBtn.innerHTML = originalText;
    }
}

function renderBookingSuccessModal(booking) {
    const modalEl = document.getElementById('bookingSuccessModal');
    if (!modalEl) return;

    document.getElementById('success-booking-ref').textContent = booking.booking_reference;
    document.getElementById('success-turf-name').textContent = booking.turf_name;
    document.getElementById('success-sport-name').textContent = booking.sport_name;
    document.getElementById('success-date-time').textContent = `${formatDate(booking.booking_date)} • ${booking.start_time}`;
    document.getElementById('success-total-paid').textContent = formatCurrency(booking.total_amount);
    document.getElementById('success-payment-method').textContent = booking.payment_method;

    const bsModal = new bootstrap.Modal(modalEl, { backdrop: 'static', keyboard: false });
    bsModal.show();
}
