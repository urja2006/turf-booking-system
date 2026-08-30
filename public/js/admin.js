// ================================================================
// TURFBOOK — ADMIN DASHBOARD & ANALYTICS CLIENT
// ================================================================

let bookingsChartInstance = null;
let sportsChartInstance = null;
let allAdminTurfs = [];

document.addEventListener('DOMContentLoaded', () => {
    // Admin Role Guard
    if (!isAdmin()) {
        window.location.href = 'admin-login.html';
        return;
    }

    initAdminDashboard();
});

async function initAdminDashboard() {
    renderAdminUserNav();
    await loadAdminStats();
    await loadAdminTurfs();
    await loadAdminBookings();
    await loadAdminUsers();
    await loadAdminSports();

    setupAddTurfForm();
    setupAddSportForm();
}

function renderAdminUserNav() {
    const user = getUser();
    if (user && document.getElementById('admin-profile-name')) {
        document.getElementById('admin-profile-name').textContent = user.full_name;
    }
}

/**
 * Load Analytics & Render Chart.js Graphs
 */
async function loadAdminStats() {
    try {
        const token = getToken();
        const res = await fetch('/api/admin/stats', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        if (!data.success) return;

        const s = data.stats;
        document.getElementById('admin-total-users').textContent = s.totalUsers;
        document.getElementById('admin-total-turfs').textContent = s.totalTurfs;
        document.getElementById('admin-total-bookings').textContent = s.totalBookings;
        document.getElementById('admin-today-bookings').textContent = s.todayBookingsCount;
        document.getElementById('admin-total-revenue').textContent = formatCurrency(s.totalRevenue);
        document.getElementById('admin-today-revenue').textContent = formatCurrency(s.todayRevenue);
        document.getElementById('admin-pending-bookings').textContent = s.pendingBookings;
        document.getElementById('admin-top-turf').textContent = s.mostBookedTurf ? s.mostBookedTurf.name : 'N/A';

        // Render Chart.js
        renderAdminCharts(data.chartData);

    } catch (err) {
        console.error('Admin stats error:', err);
    }
}

function renderAdminCharts(chartData) {
    if (!chartData || !window.Chart) return;

    // 1. 7-Day Bookings Line Chart
    const trendCtx = document.getElementById('bookingsTrendChart')?.getContext('2d');
    if (trendCtx) {
        if (bookingsChartInstance) bookingsChartInstance.destroy();

        bookingsChartInstance = new Chart(trendCtx, {
            type: 'line',
            data: {
                labels: chartData.labels,
                datasets: [{
                    label: 'Bookings',
                    data: chartData.bookingsTrend,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.12)',
                    fill: true,
                    tension: 0.35,
                    pointBackgroundColor: '#047857',
                    pointRadius: 5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, ticks: { precision: 0 } }
                }
            }
        });
    }

    // 2. Sports Popularity Doughnut Chart
    const sportsCtx = document.getElementById('sportsDoughnutChart')?.getContext('2d');
    if (sportsCtx) {
        if (sportsChartInstance) sportsChartInstance.destroy();

        sportsChartInstance = new Chart(sportsCtx, {
            type: 'doughnut',
            data: {
                labels: chartData.sportsLabels,
                datasets: [{
                    data: chartData.sportsCounts,
                    backgroundColor: [
                        '#10b981', '#3b82f6', '#f59e0b', '#ef4444',
                        '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom', labels: { boxWidth: 12 } }
                }
            }
        });
    }
}

/**
 * Turf Management Table & Actions
 */
async function loadAdminTurfs() {
    try {
        const token = getToken();
        const res = await fetch('/api/admin/turfs', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        if (data.success) {
            allAdminTurfs = data.turfs;
            renderAdminTurfsTable(allAdminTurfs);
        }
    } catch (err) {
        console.error('Admin turfs error:', err);
    }
}

function renderAdminTurfsTable(turfs) {
    const container = document.getElementById('admin-turfs-table-body');
    if (!container) return;

    container.innerHTML = turfs.map(turf => `
        <tr>
            <td>
                <div class="d-flex align-items-center gap-2">
                    <img src="${turf.image_url}" class="rounded" width="45" height="35" style="object-fit: cover;">
                    <div>
                        <div class="fw-bold">${turf.name}</div>
                        <small class="text-muted">${turf.city}, ${turf.state}</small>
                    </div>
                </div>
            </td>
            <td class="fw-bold text-success">${formatCurrency(turf.price_per_hour)}/hr</td>
            <td>⭐ ${turf.rating} <span class="text-muted">(${turf.reviews_count})</span></td>
            <td>
                ${(turf.sports || []).map(s => `<span class="badge bg-light text-dark border me-1">${s}</span>`).join('')}
            </td>
            <td>
                <span class="badge ${turf.status === 'active' ? 'bg-success' : 'bg-secondary'}">${turf.status}</span>
            </td>
            <td>
                <div class="d-flex gap-1">
                    <button class="btn btn-sm btn-outline-primary" onclick="openEditTurfModal('${turf.id}')"><i class="bi bi-pencil"></i></button>
                    <button class="btn btn-sm btn-outline-danger" onclick="handleDeactivateTurf('${turf.id}')"><i class="bi bi-trash"></i></button>
                </div>
            </td>
        </tr>
    `).join('');
}

function setupAddTurfForm() {
    const form = document.getElementById('admin-add-turf-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.disabled = true;

        try {
            const name = document.getElementById('turf-form-name').value;
            const city = document.getElementById('turf-form-city').value;
            const address = document.getElementById('turf-form-address').value;
            const price = document.getElementById('turf-form-price').value;
            const lat = document.getElementById('turf-form-lat').value;
            const lng = document.getElementById('turf-form-lng').value;
            const img = document.getElementById('turf-form-img').value;
            const desc = document.getElementById('turf-form-desc').value;

            // Checked sports
            const checkedSports = Array.from(form.querySelectorAll('.turf-form-sport:checked')).map(cb => cb.value);

            const token = getToken();
            const res = await fetch('/api/admin/turfs', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name,
                    city,
                    address,
                    price_per_hour: price,
                    latitude: lat,
                    longitude: lng,
                    image_url: img,
                    description: desc,
                    sports: checkedSports.length > 0 ? checkedSports : ['football']
                })
            });

            const data = await res.json();
            if (data.success) {
                showToast(data.message, 'success');
                const modalEl = document.getElementById('addTurfModal');
                const bsModal = bootstrap.Modal.getInstance(modalEl);
                if (bsModal) bsModal.hide();
                form.reset();
                await loadAdminTurfs();
                await loadAdminStats();
            } else {
                showToast(data.message || 'Failed to add turf.', 'error');
            }
        } catch (err) {
            console.error('Add turf error:', err);
        } finally {
            submitBtn.disabled = false;
        }
    });
}

async function handleDeactivateTurf(turfId) {
    if (!confirm('Are you sure you want to deactivate this turf?')) return;

    try {
        const token = getToken();
        const res = await fetch(`/api/admin/turfs/${turfId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
            showToast(data.message, 'info');
            await loadAdminTurfs();
            await loadAdminStats();
        }
    } catch (err) {
        console.error('Deactivate turf error:', err);
    }
}

/**
 * Booking Management Table & Status Controls
 */
async function loadAdminBookings() {
    try {
        const token = getToken();
        const res = await fetch('/api/admin/bookings', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        if (data.success) {
            renderAdminBookingsTable(data.bookings || []);
        }
    } catch (err) {
        console.error('Admin bookings error:', err);
    }
}

function renderAdminBookingsTable(bookings) {
    const container = document.getElementById('admin-bookings-table-body');
    if (!container) return;

    container.innerHTML = bookings.map(b => `
        <tr>
            <td class="fw-bold">${b.booking_reference}</td>
            <td>
                <div>${b.user_name}</div>
                <small class="text-muted">${b.user_email}</small>
            </td>
            <td>
                <div class="fw-semibold">${b.turf_name}</div>
                <small class="text-muted">${b.sport_name}</small>
            </td>
            <td>
                <div>${formatDate(b.booking_date)}</div>
                <small class="text-muted">${b.start_time} - ${b.end_time}</small>
            </td>
            <td class="fw-bold text-success">${formatCurrency(b.total_amount)}</td>
            <td>
                <span class="badge ${getBookingBadgeClass(b.status)}">${b.status}</span>
            </td>
            <td>
                <select class="form-select form-select-sm" onchange="handleUpdateBookingStatus('${b.id}', this.value)">
                    <option value="confirmed" ${b.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
                    <option value="completed" ${b.status === 'completed' ? 'selected' : ''}>Completed</option>
                    <option value="cancelled" ${b.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                    <option value="pending" ${b.status === 'pending' ? 'selected' : ''}>Pending</option>
                </select>
            </td>
        </tr>
    `).join('');
}

async function handleUpdateBookingStatus(bookingId, newStatus) {
    try {
        const token = getToken();
        const res = await fetch(`/api/admin/bookings/${bookingId}/status`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: newStatus })
        });
        const data = await res.json();
        if (data.success) {
            showToast(data.message, 'success');
            await loadAdminStats();
        }
    } catch (err) {
        console.error('Update booking status error:', err);
    }
}

/**
 * User Management Table & Toggle
 */
async function loadAdminUsers() {
    try {
        const token = getToken();
        const res = await fetch('/api/admin/users', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        if (data.success) {
            renderAdminUsersTable(data.users || []);
        }
    } catch (err) {
        console.error('Admin users error:', err);
    }
}

function renderAdminUsersTable(users) {
    const container = document.getElementById('admin-users-table-body');
    if (!container) return;

    container.innerHTML = users.map(u => `
        <tr>
            <td>
                <div class="d-flex align-items-center gap-2">
                    <img src="${u.avatar_url}" class="rounded-circle" width="35" height="35">
                    <div>
                        <div class="fw-bold">${u.full_name}</div>
                        <small class="text-muted">${u.email}</small>
                    </div>
                </div>
            </td>
            <td>${u.phone || '—'}</td>
            <td><span class="badge bg-light text-dark border">${u.bookings_count} bookings</span></td>
            <td class="fw-bold">${formatCurrency(u.total_spent)}</td>
            <td>
                <span class="badge ${u.is_active ? 'bg-success' : 'bg-danger'}">${u.is_active ? 'Active' : 'Deactivated'}</span>
            </td>
            <td>
                <button class="btn btn-sm ${u.is_active ? 'btn-outline-danger' : 'btn-outline-success'}" 
                        onclick="handleToggleUserStatus('${u.id}')">
                    ${u.is_active ? 'Deactivate' : 'Activate'}
                </button>
            </td>
        </tr>
    `).join('');
}

async function handleToggleUserStatus(userId) {
    try {
        const token = getToken();
        const res = await fetch(`/api/admin/users/${userId}/toggle-status`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
            showToast(data.message, 'info');
            await loadAdminUsers();
            await loadAdminStats();
        }
    } catch (err) {
        console.error('Toggle user error:', err);
    }
}

/**
 * Sports Management
 */
async function loadAdminSports() {
    try {
        const res = await fetch('/api/turfs/sports');
        const data = await res.json();

        if (data.success && document.getElementById('admin-sports-table-body')) {
            document.getElementById('admin-sports-table-body').innerHTML = data.sports.map(s => `
                <tr>
                    <td class="fs-4">${s.icon}</td>
                    <td class="fw-bold">${s.name}</td>
                    <td class="text-muted small">${s.id}</td>
                    <td class="text-muted small">${s.description || '—'}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-danger" onclick="handleDeleteSport('${s.id}')"><i class="bi bi-trash"></i></button>
                    </td>
                </tr>
            `).join('');
        }
    } catch (err) {
        console.error('Admin sports error:', err);
    }
}

function setupAddSportForm() {
    const form = document.getElementById('admin-add-sport-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('sport-form-name').value;
        const icon = document.getElementById('sport-form-icon').value;
        const desc = document.getElementById('sport-form-desc').value;

        try {
            const token = getToken();
            const res = await fetch('/api/admin/sports', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ id: name.toLowerCase().replace(/\s+/g, '_'), name, icon, description: desc })
            });
            const data = await res.json();
            if (data.success) {
                showToast('Sport added successfully.', 'success');
                form.reset();
                await loadAdminSports();
            } else {
                showToast(data.message, 'error');
            }
        } catch (err) {
            console.error('Add sport error:', err);
        }
    });
}

async function handleDeleteSport(sportId) {
    if (!confirm('Remove this sport?')) return;
    try {
        const token = getToken();
        const res = await fetch(`/api/admin/sports/${sportId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
            showToast(data.message, 'info');
            await loadAdminSports();
        }
    } catch (err) {
        console.error('Delete sport error:', err);
    }
}

function getBookingBadgeClass(status) {
    if (status === 'confirmed') return 'bg-success';
    if (status === 'completed') return 'bg-primary';
    if (status === 'cancelled') return 'bg-danger';
    return 'bg-warning text-dark';
}
