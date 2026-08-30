// ================================================================
// TURFBOOK — TURF DETAILS, GALLERY, REVIEWS & INTERACTIVE MAP
// ================================================================

let currentTurf = null;
let turfDetailMap = null;

document.addEventListener('DOMContentLoaded', () => {
    initTurfDetailPage();
});

async function initTurfDetailPage() {
    const urlParams = new URLSearchParams(window.location.search);
    const turfId = urlParams.get('id');

    if (!turfId) {
        showToast('No turf selected. Redirecting...', 'warning');
        setTimeout(() => window.location.href = 'turfs.html', 1500);
        return;
    }

    await loadTurfDetails(turfId);
}

async function loadTurfDetails(turfId) {
    try {
        const savedLoc = getSavedLocation();
        const headers = {};
        const token = getToken();
        if (token) headers['Authorization'] = `Bearer ${token}`;

        let queryUrl = typeof getApiUrl === 'function' ? getApiUrl(`/api/turfs/${turfId}`) : `/api/turfs/${turfId}`;
        if (savedLoc && savedLoc.lat && savedLoc.lng) {
            queryUrl += (queryUrl.includes('?') ? '&' : '?') + `lat=${savedLoc.lat}&lng=${savedLoc.lng}`;
        }

        const res = await fetch(queryUrl, { headers });
        const data = await res.json();

        if (!data.success || !data.turf) {
            showToast(data.message || 'Turf details not found.', 'error');
            return;
        }

        currentTurf = data.turf;
        renderTurfDetailsView(currentTurf);
        initTurfDetailMap(currentTurf);
        setupReviewForm(currentTurf);

    } catch (err) {
        console.error('Turf details load error:', err);
        showToast('Failed to load turf details.', 'error');
    }
}

function renderTurfDetailsView(turf) {
    document.title = `${turf.name} — TurfBook`;

    // Title & Info
    document.getElementById('detail-turf-name').textContent = turf.name;
    document.getElementById('detail-turf-address').textContent = `${turf.address}, ${turf.city}, ${turf.state}`;
    document.getElementById('detail-turf-rating').textContent = turf.rating;
    document.getElementById('detail-reviews-count').textContent = `(${turf.reviews_count || 0} reviews)`;
    document.getElementById('detail-turf-description').textContent = turf.description;
    document.getElementById('detail-timings').textContent = `${turf.opening_time} - ${turf.closing_time}`;
    document.getElementById('detail-contact-phone').textContent = turf.contact_phone || '+91 9876543210';
    document.getElementById('detail-contact-email').textContent = turf.contact_email || 'contact@turfbook.com';

    // Distance badge
    const distanceBadge = document.getElementById('detail-distance-badge');
    if (distanceBadge) {
        if (turf.distance !== null && turf.distance !== undefined) {
            distanceBadge.innerHTML = `<i class="bi bi-geo-alt-fill text-danger me-1"></i>${turf.distance} km from your search location`;
            distanceBadge.classList.remove('d-none');
        } else {
            distanceBadge.classList.add('d-none');
        }
    }

    // Favorite Button State
    const favBtn = document.getElementById('detail-fav-btn');
    if (favBtn) {
        favBtn.classList.toggle('active', Boolean(turf.is_favorite));
        favBtn.innerHTML = turf.is_favorite 
            ? `<i class="bi bi-heart-fill text-danger me-1"></i>Saved in Favorites`
            : `<i class="bi bi-heart me-1"></i>Add to Favorites`;
        favBtn.onclick = () => handleDetailFavoriteToggle(turf.id);
    }

    // Gallery / Hero Image
    const heroImg = document.getElementById('detail-hero-img');
    if (heroImg) {
        heroImg.src = turf.image_url;
    }

    const thumbnailsContainer = document.getElementById('detail-gallery-thumbnails');
    if (thumbnailsContainer && turf.gallery && turf.gallery.length > 1) {
        thumbnailsContainer.innerHTML = turf.gallery.map((imgUrl, index) => `
            <img src="${imgUrl}" class="rounded border ${index === 0 ? 'border-success border-2' : ''}" 
                 style="width: 80px; height: 60px; object-fit: cover; cursor: pointer;"
                 onclick="switchHeroImage('${imgUrl}', this)">
        `).join('');
    }

    // Available Sports & Pricing Grid
    const sportsContainer = document.getElementById('detail-sports-container');
    if (sportsContainer && turf.sports_details) {
        sportsContainer.innerHTML = turf.sports_details.map(sport => `
            <div class="col-6 col-md-4 mb-3">
                <div class="card h-100 border-0 bg-light rounded-3 p-3 text-center shadow-sm">
                    <div class="fs-2 mb-1">${sport.icon}</div>
                    <h6 class="fw-bold mb-1 text-secondary">${sport.name}</h6>
                    <div class="text-success fw-extrabold fs-5">${formatCurrency(sport.price_per_hour)}<span class="fs-6 text-muted font-normal">/hr</span></div>
                </div>
            </div>
        `).join('');
    }

    // Facilities Badges
    const facilitiesContainer = document.getElementById('detail-facilities-container');
    if (facilitiesContainer) {
        facilitiesContainer.innerHTML = (turf.facilities || ['Parking', 'Washroom', 'Flood Lights']).map(fac => `
            <div class="col-6 col-md-4 mb-2">
                <div class="d-flex align-items-center gap-2 p-2 bg-white rounded border">
                    <i class="bi bi-check-circle-fill text-success"></i>
                    <span class="fw-semibold text-secondary small">${fac}</span>
                </div>
            </div>
        `).join('');
    }

    // Sticky Booking Card Price & CTA
    const stickyPrice = document.getElementById('detail-sticky-price');
    if (stickyPrice) {
        stickyPrice.textContent = formatCurrency(turf.price_per_hour);
    }

    const bookNowBtn = document.getElementById('detail-book-btn');
    if (bookNowBtn) {
        bookNowBtn.onclick = () => {
            if (!isAuthenticated()) {
                requireAuthOrRedirect(`booking.html?id=${turf.id}`, 'Please login to continue with your booking.');
                return;
            }
            window.location.href = `booking.html?id=${turf.id}`;
        };
    }

    // Render Customer Reviews
    renderReviewsList(turf.reviews || []);
}

function switchHeroImage(newSrc, thumbEl) {
    const heroImg = document.getElementById('detail-hero-img');
    if (heroImg) heroImg.src = newSrc;

    const allThumbs = document.querySelectorAll('#detail-gallery-thumbnails img');
    allThumbs.forEach(t => t.classList.remove('border-success', 'border-2'));
    thumbEl.classList.add('border-success', 'border-2');
}

/**
 * Leaflet Interactive Map on Details Page
 */
function initTurfDetailMap(turf) {
    const mapElement = document.getElementById('turf-map-view');
    if (!mapElement || !turf.latitude || !turf.longitude) return;

    if (turfDetailMap) {
        turfDetailMap.remove();
    }

    turfDetailMap = L.map('turf-map-view').setView([turf.latitude, turf.longitude], 15);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
    }).addTo(turfDetailMap);

    const marker = L.marker([turf.latitude, turf.longitude]).addTo(turfDetailMap);
    marker.bindPopup(`<b>${turf.name}</b><br>${turf.address}`).openPopup();

    // Get Directions Button
    const directionsBtn = document.getElementById('get-directions-btn');
    if (directionsBtn) {
        directionsBtn.href = `https://www.google.com/maps/dir/?api=1&destination=${turf.latitude},${turf.longitude}`;
        directionsBtn.target = '_blank';
    }
}

/**
 * Customer Reviews
 */
function renderReviewsList(reviews) {
    const container = document.getElementById('detail-reviews-list');
    if (!container) return;

    if (!reviews || reviews.length === 0) {
        container.innerHTML = `
            <div class="text-center py-4 text-muted">
                <i class="bi bi-chat-square-quote fs-2 d-block mb-2"></i>
                <p class="mb-0">No reviews yet. Be the first player to rate this turf!</p>
            </div>
        `;
        return;
    }

    container.innerHTML = reviews.map(rev => `
        <div class="border-bottom pb-3 mb-3">
            <div class="d-flex justify-content-between align-items-center mb-1">
                <div class="d-flex align-items-center gap-2">
                    <div class="bg-primary-light text-primary-dark rounded-circle d-flex align-items-center justify-content-center fw-bold" style="width: 32px; height: 32px;">
                        ${(rev.user_name || 'U').charAt(0)}
                    </div>
                    <span class="fw-bold text-secondary">${rev.user_name || 'Verified Player'}</span>
                </div>
                <div class="text-warning">
                    ${'★'.repeat(rev.rating)}${'☆'.repeat(5 - rev.rating)}
                </div>
            </div>
            <p class="text-muted small mb-1">${rev.comment}</p>
            <span class="text-black-50" style="font-size: 0.75rem;">${formatDate(rev.created_at)}</span>
        </div>
    `).join('');
}

function setupReviewForm(turf) {
    const form = document.getElementById('add-review-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!isAuthenticated()) {
            requireAuthOrRedirect(window.location.href, 'Please login to submit a review.');
            return;
        }

        const rating = form.querySelector('input[name="review-rating"]:checked')?.value || '5';
        const comment = document.getElementById('review-comment')?.value || '';

        try {
            const token = getToken();
            const revUrl = typeof getApiUrl === 'function' ? getApiUrl(`/api/turfs/${turf.id}/reviews`) : `/api/turfs/${turf.id}/reviews`;
            const res = await fetch(revUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ rating: parseInt(rating, 10), comment })
            });

            const data = await res.json();
            if (data.success) {
                showToast(data.message, 'success');
                form.reset();
                // Reload details to update review list & rating
                await loadTurfDetails(turf.id);
            } else {
                showToast(data.message || 'Failed to submit review.', 'error');
            }
        } catch (err) {
            console.error('Submit review error:', err);
            showToast('Network error while posting review.', 'error');
        }
    });
}

async function handleDetailFavoriteToggle(turfId) {
    if (!isAuthenticated()) {
        requireAuthOrRedirect(window.location.href, 'Please login to save favorites.');
        return;
    }

    try {
        const token = getToken();
        const favUrl = typeof getApiUrl === 'function' ? getApiUrl(`/api/favorites/${turfId}`) : `/api/favorites/${turfId}`;
        const res = await fetch(favUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        const data = await res.json();

        if (data.success) {
            showToast(data.message, 'success');
            await loadTurfDetails(turfId);
        }
    } catch (err) {
        console.error('Favorite toggle error:', err);
    }
}
