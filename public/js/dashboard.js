// ================================================================
// TURFBOOK — USER DASHBOARD & BOOKINGS MANAGER
// ================================================================

document.addEventListener('DOMContentLoaded', () => {
    if (!isAuthenticated()) {
        requireAuthOrRedirect('dashboard.html', 'Please login to access your dashboard.');
        return;
    }

    initDashboard();
});

async function initDashboard() {
    renderUserProfileHeader();
    await loadUserBookings();
    await loadUserFavorites();
    setupProfileForm();

    // Check hash for direct tab switching (e.g. #favorites or #bookings)
    if (window.location.hash === '#favorites') {
        const favTabBtn = document.getElementById('tab-favorites-btn');
        if (favTabBtn) new bootstrap.Tab(favTabBtn).show();
    } else if (window.location.hash === '#bookings') {
        const bookTabBtn = document.getElementById('tab-bookings-btn');
        if (bookTabBtn) new bootstrap.Tab(bookTabBtn).show();
    }
}

function renderUserProfileHeader() {
    const user = getUser();
    if (!user) return;

    const nameEl = document.getElementById('dash-user-name');
    const emailEl = document.getElementById('dash-user-email');
    const avatarEl = document.getElementById('dash-user-avatar');

    if (nameEl) nameEl.textContent = user.full_name;
    if (emailEl) emailEl.textContent = user.email;
    if (avatarEl) avatarEl.src = user.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.full_name)}`;

    // Prefill profile edit inputs
    const editName = document.getElementById('profile-name-input');
    const editPhone = document.getElementById('profile-phone-input');
    if (editName) editName.value = user.full_name;
    if (editPhone) editPhone.value = user.phone || '';
}

/**
 * Load User Bookings and Compute Overview Metrics
 */
async function loadUserBookings() {
    try {
        const token = getToken();
        const bookingsUrl = typeof getApiUrl === 'function' ? getApiUrl('/api/bookings/my-bookings') : '/api/bookings/my-bookings';
        const res = await fetch(bookingsUrl, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        if (!data.success) {
            showToast('Failed to load bookings.', 'error');
            return;
        }

        const allBookings = data.all || [];
        const upcomingBookings = data.upcoming || [];
        const completedBookings = allBookings.filter(b => b.status === 'completed' || (b.status === 'confirmed' && b.booking_date < new Date().toISOString().split('T')[0]));
        const totalSpent = allBookings
            .filter(b => b.status !== 'cancelled')
            .reduce((sum, b) => sum + (b.total_amount || 0), 0);

        // Update Overview Cards
        document.getElementById('stat-upcoming-count').textContent = upcomingBookings.length;
        document.getElementById('stat-completed-count').textContent = completedBookings.length;
        document.getElementById('stat-total-spent').textContent = formatCurrency(totalSpent);

        // Render Upcoming Bookings
        renderUpcomingBookings(upcomingBookings);

        // Render All / History Bookings
        renderBookingHistory(allBookings);

    } catch (err) {
        console.error('User bookings error:', err);
    }
}

function renderUpcomingBookings(upcoming) {
    const container = document.getElementById('upcoming-bookings-container');
    if (!container) return;

    if (upcoming.length === 0) {
        container.innerHTML = `
            <div class="card border-0 shadow-sm p-4 text-center">
                <div class="fs-1 mb-2">🏟️</div>
                <h5 class="fw-bold text-secondary">No Upcoming Bookings</h5>
                <p class="text-muted small mb-3">You don't have any scheduled turf games right now.</p>
                <div><a href="turfs.html" class="btn btn-primary-turf btn-sm">Find & Book a Turf</a></div>
            </div>
        `;
        return;
    }

    container.innerHTML = upcoming.map(b => `
        <div class="card border-0 shadow-sm mb-3 overflow-hidden">
            <div class="row g-0 align-items-center">
                <div class="col-md-3">
                    <img src="${b.turf_image}" class="img-fluid h-100 w-100" style="min-height: 140px; object-fit: cover;" alt="${b.turf_name}">
                </div>
                <div class="col-md-9 p-3">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <div>
                            <span class="badge bg-success mb-1">Confirmed</span>
                            <span class="text-muted small ms-2">Ref: <strong>${b.booking_reference}</strong></span>
                            <h5 class="fw-bold text-secondary mb-0">${b.turf_name}</h5>
                        </div>
                        <span class="fs-5 fw-extrabold text-success">${formatCurrency(b.total_amount)}</span>
                    </div>
                    <div class="row text-muted small mb-3">
                        <div class="col-sm-6"><i class="bi bi-calendar-event me-1 text-primary"></i>${formatDate(b.booking_date)} (${b.start_time} - ${b.end_time})</div>
                        <div class="col-sm-6"><i class="bi bi-trophy me-1 text-warning"></i>${b.sport_name} • ${b.players} Players</div>
                    </div>
                    <div class="d-flex justify-content-between align-items-center pt-2 border-top">
                        <span class="text-muted small"><i class="bi bi-credit-card me-1"></i>${b.payment_method}</span>
                        <div class="d-flex gap-2">
                            <a href="turf-details.html?id=${b.turf_id}" class="btn btn-outline-secondary btn-sm">View Turf</a>
                            <button onclick="handleCancelBookingClick('${b.id}', '${b.turf_name}', '${formatDate(b.booking_date)}')" class="btn btn-outline-danger btn-sm">
                                Cancel Booking
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

function renderBookingHistory(allBookings) {
    const container = document.getElementById('history-bookings-container');
    if (!container) return;

    if (allBookings.length === 0) {
        container.innerHTML = `<div class="text-center py-4 text-muted">No booking history available.</div>`;
        return;
    }

    container.innerHTML = `
        <div class="table-responsive">
            <table class="table table-hover align-middle">
                <thead class="table-light">
                    <tr>
                        <th>Booking ID</th>
                        <th>Turf & Sport</th>
                        <th>Date & Time</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    ${allBookings.map(b => {
                        let statusBadge = '<span class="badge bg-success">Confirmed</span>';
                        if (b.status === 'completed') statusBadge = '<span class="badge bg-primary">Completed</span>';
                        if (b.status === 'cancelled') statusBadge = '<span class="badge bg-danger">Cancelled</span>';
                        if (b.status === 'pending') statusBadge = '<span class="badge bg-warning text-dark">Pending</span>';

                        return `
                            <tr>
                                <td class="fw-semibold text-secondary">${b.booking_reference}</td>
                                <td>
                                    <div class="fw-bold">${b.turf_name}</div>
                                    <small class="text-muted">${b.sport_name}</small>
                                </td>
                                <td>
                                    <div>${formatDate(b.booking_date)}</div>
                                    <small class="text-muted">${b.start_time}</small>
                                </td>
                                <td class="fw-bold">${formatCurrency(b.total_amount)}</td>
                                <td>${statusBadge}</td>
                                <td>
                                    ${b.status !== 'cancelled' ? `
                                        <a href="turf-details.html?id=${b.turf_id}#reviews" class="btn btn-sm btn-outline-turf py-0 px-2">Review</a>
                                    ` : '<span class="text-muted small">—</span>'}
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
    `;
}

/**
 * Load Favorites Tab
 */
async function loadUserFavorites() {
    try {
        const token = getToken();
        const favUrl = typeof getApiUrl === 'function' ? getApiUrl('/api/favorites') : '/api/favorites';
        const res = await fetch(favUrl, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        if (data.success) {
            const countEl = document.getElementById('stat-favorites-count');
            if (countEl) countEl.textContent = data.total;

            renderFavoritesGrid(data.turfs || []);
        }
    } catch (err) {
        console.error('User favorites error:', err);
    }
}

function renderFavoritesGrid(turfs) {
    const container = document.getElementById('favorites-grid-container');
    if (!container) return;

    if (turfs.length === 0) {
        container.innerHTML = `
            <div class="col-12 text-center py-5">
                <div class="fs-1 mb-2">❤️</div>
                <h5 class="fw-bold text-secondary">No Favorites Saved Yet</h5>
                <p class="text-muted small mb-3">Click the heart icon on any turf card to save it here for quick access.</p>
                <a href="turfs.html" class="btn btn-outline-turf btn-sm">Explore Turfs</a>
            </div>
        `;
        return;
    }

    container.innerHTML = turfs.map(turf => `
        <div class="col-md-6 col-lg-4 mb-4">
            <div class="turf-card">
                <div class="turf-img-wrapper">
                    <img src="${turf.image_url}" class="turf-img" alt="${turf.name}">
                    <button class="turf-fav-btn active" onclick="handleRemoveFavorite('${turf.id}', this)">
                        <i class="bi bi-heart-fill text-danger"></i>
                    </button>
                </div>
                <div class="turf-body">
                    <h5 class="turf-title">${turf.name}</h5>
                    <div class="turf-address"><i class="bi bi-geo-alt text-danger"></i> ${turf.address}, ${turf.city}</div>
                    <div class="turf-footer">
                        <span class="turf-price-val">${formatCurrency(turf.price_per_hour)}<span>/hr</span></span>
                        <a href="booking.html?id=${turf.id}" class="btn btn-sm btn-primary-turf">Book Now</a>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

async function handleRemoveFavorite(turfId, btnEl) {
    try {
        const token = getToken();
        const delFavUrl = typeof getApiUrl === 'function' ? getApiUrl(`/api/favorites/${turfId}`) : `/api/favorites/${turfId}`;
        await fetch(delFavUrl, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        showToast('Removed from favorites', 'info');
        await loadUserFavorites();
    } catch (err) {
        console.error('Remove favorite error:', err);
    }
}

/**
 * Handle Booking Cancellation
 */
async function handleCancelBookingClick(bookingId, turfName, dateStr) {
    if (!confirm(`Are you sure you want to cancel your booking for ${turfName} on ${dateStr}?`)) {
        return;
    }

    try {
        const token = getToken();
        const cancelUrl = typeof getApiUrl === 'function' ? getApiUrl(`/api/bookings/${bookingId}/cancel`) : `/api/bookings/${bookingId}/cancel`;
        const res = await fetch(cancelUrl, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        const data = await res.json();

        if (data.success) {
            showToast(data.message, 'success');
            await loadUserBookings();
        } else {
            showToast(data.message || 'Failed to cancel booking.', 'error');
        }
    } catch (err) {
        console.error('Cancel booking error:', err);
        showToast('Network error while cancelling.', 'error');
    }
}

/**
 * Setup Profile Edit Form
 */
function setupProfileForm() {
    const form = document.getElementById('profile-edit-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fullName = document.getElementById('profile-name-input').value;
        const phone = document.getElementById('profile-phone-input').value;

        try {
            const token = getToken();
            const profUrl = typeof getApiUrl === 'function' ? getApiUrl('/api/auth/profile') : '/api/auth/profile';
            const res = await fetch(profUrl, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ full_name: fullName, phone })
            });
            const data = await res.json();

            if (data.success) {
                setAuth(token, data.user);
                showToast('Profile updated successfully.', 'success');
                renderUserProfileHeader();
            } else {
                showToast(data.message || 'Failed to update profile.', 'error');
            }
        } catch (err) {
            console.error('Update profile error:', err);
        }
    });
}
