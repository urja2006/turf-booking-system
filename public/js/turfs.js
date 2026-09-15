// ================================================================
// TURFBOOK — TURF LISTINGS, FILTERS & LEAFLET MAP VIEW
// ================================================================

let allFetchedTurfs = [];
let leafletMapInstance = null;
let leafletMarkersGroup = null;

document.addEventListener('DOMContentLoaded', () => {
    initTurfListPage();
});

async function initTurfListPage() {
    const urlParams = new URLSearchParams(window.location.search);
    
    // Sync filters from URL if provided
    const sportParam = urlParams.get('sport');
    const cityParam = urlParams.get('city');
    const searchParam = urlParams.get('search');
    const radiusParam = urlParams.get('radius');

    if (sportParam && document.getElementById('filter-sport')) {
        document.getElementById('filter-sport').value = sportParam;
    }
    if (cityParam && document.getElementById('filter-city')) {
        document.getElementById('filter-city').value = cityParam;
    }
    if (searchParam && document.getElementById('filter-search')) {
        document.getElementById('filter-search').value = searchParam;
    }
    if (radiusParam && document.getElementById('filter-radius')) {
        document.getElementById('filter-radius').value = radiusParam;
    }

    // Set up filter change listeners
    const filterInputs = document.querySelectorAll('.turf-filter-trigger');
    filterInputs.forEach(input => {
        input.addEventListener('change', () => fetchAndRenderTurfs());
    });

    const searchInput = document.getElementById('filter-search');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(() => fetchAndRenderTurfs(), 400));
    }

    const sortSelect = document.getElementById('filter-sort');
    if (sortSelect) {
        sortSelect.addEventListener('change', () => fetchAndRenderTurfs());
    }

    // Initialize Map toggle if element exists
    const toggleMapBtn = document.getElementById('toggle-map-btn');
    if (toggleMapBtn) {
        toggleMapBtn.addEventListener('click', toggleMapView);
    }

    // Listen for custom location changed events
    window.addEventListener('turfbook:locationChanged', () => {
        updateActiveLocationBanner();
        fetchAndRenderTurfs();
    });

    updateActiveLocationBanner();

    // Load and render turfs
    await fetchAndRenderTurfs();
}

/**
 * Update Location Header Banner Text
 */
function updateActiveLocationBanner() {
    const bannerEl = document.getElementById('active-location-name');
    if (!bannerEl) return;
    const loc = getSavedLocation();
    bannerEl.innerHTML = loc && loc.name 
        ? `${loc.name} ${loc.isGPS ? '<span class="badge bg-success ms-1" style="font-size: 0.65rem;">GPS Verified</span>' : ''}`
        : 'Ahmedabad, Gujarat';
}

/**
 * Handle Auto-Detect Location Click
 */
async function handleDetectLocationClick(btn) {
    const origHtml = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span>Detecting...`;

    try {
        const loc = await requestCurrentLocation();
        showToast(`📍 Location set to ${loc.name} (${loc.lat.toFixed(2)}, ${loc.lng.toFixed(2)})`, 'success');
        updateActiveLocationBanner();

        // Reset city filter to all to allow radius search around GPS
        const citySelect = document.getElementById('filter-city');
        if (citySelect) citySelect.value = 'all';

        await fetchAndRenderTurfs();
    } catch (err) {
        showToast(err.message || 'Could not detect location. Selected Ahmedabad.', 'warning');
    } finally {
        btn.disabled = false;
        btn.innerHTML = origHtml;
    }
}

/**
 * Switch Active City via Dropdown or Quick Chips
 */
async function switchCityLocation(cityName) {
    const loc = await geocodePlace(cityName);
    const citySelect = document.getElementById('filter-city');
    if (citySelect) {
        citySelect.value = cityName;
    }
    updateActiveLocationBanner();
    showToast(`Switched location to ${cityName}`, 'info');
    await fetchAndRenderTurfs();
}

/**
 * Fetch Turfs from Backend with Active Filters
 */
async function fetchAndRenderTurfs() {
    const container = document.getElementById('turfs-grid-container');
    if (!container) return;

    // Show skeleton loading shimmer
    container.innerHTML = getSkeletonCardsHtml(6);

    const savedLoc = getSavedLocation();
    const sport = document.getElementById('filter-sport')?.value || 'all';
    const city = document.getElementById('filter-city')?.value || 'all';
    const search = document.getElementById('filter-search')?.value || '';
    const radius = document.getElementById('filter-radius')?.value || '50';
    const maxPrice = document.getElementById('filter-price')?.value || '';
    const rating = document.getElementById('filter-rating')?.value || '';
    const sort = document.getElementById('filter-sort')?.value || 'rating_desc';

    // Facilities checked
    const facilityCheckboxes = document.querySelectorAll('.facility-checkbox:checked');
    const facilities = Array.from(facilityCheckboxes).map(cb => cb.value).join(',');

    // Build Query
    const params = new URLSearchParams();
    if (sport && sport !== 'all') params.append('sport', sport);
    if (city && city !== 'all') params.append('city', city);
    if (search) params.append('search', search);
    if (radius) params.append('radius', radius);
    if (maxPrice) params.append('max_price', maxPrice);
    if (rating) params.append('rating', rating);
    if (facilities) params.append('facilities', facilities);
    if (sort) params.append('sort', sort);

    if (savedLoc && savedLoc.lat && savedLoc.lng) {
        params.append('lat', savedLoc.lat);
        params.append('lng', savedLoc.lng);
    }

    try {
        const headers = {};
        const token = getToken();
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const apiUrl = typeof getApiUrl === 'function' ? getApiUrl(`/api/turfs?${params.toString()}`) : `/api/turfs?${params.toString()}`;
        const res = await fetch(apiUrl, { headers });
        const data = await res.json();

        if (data.success) {
            allFetchedTurfs = data.turfs;
            renderTurfCards(allFetchedTurfs);
            updateMapMarkers(allFetchedTurfs);

            const countDisplay = document.getElementById('turf-count-display');
            if (countDisplay) {
                countDisplay.textContent = `${data.total} turf${data.total === 1 ? '' : 's'} found`;
            }
        } else {
            renderEmptyState(data.message || 'No turfs found.');
        }
    } catch (err) {
        console.error('Fetch turfs error:', err);
        renderEmptyState('Failed to load turfs. Please check your connection.');
    }
}

/**
 * Render Turf Cards to HTML Grid
 */
function renderTurfCards(turfs) {
    const container = document.getElementById('turfs-grid-container');
    if (!container) return;

    if (!turfs || turfs.length === 0) {
        renderEmptyState();
        return;
    }

    container.innerHTML = turfs.map(turf => `
        <div class="col-md-6 col-lg-4 mb-4">
            <div class="turf-card">
                <div class="turf-img-wrapper">
                    <img src="${turf.image_url}" class="turf-img" alt="${turf.name}" loading="lazy">
                    <div class="turf-badge-rating">
                        <i class="bi bi-star-fill"></i>
                        <span>${turf.rating}</span>
                        <span class="text-white-50">(${turf.reviews_count || 0})</span>
                    </div>
                    <button class="turf-fav-btn ${turf.is_favorite ? 'active' : ''}" 
                            onclick="handleToggleFavorite('${turf.id}', this)" title="Add to favorites">
                        <i class="bi ${turf.is_favorite ? 'bi-heart-fill' : 'bi-heart'}"></i>
                    </button>
                    ${turf.distance !== null && turf.distance !== undefined ? `
                        <div class="turf-distance-badge">
                            <i class="bi bi-geo-alt-fill me-1"></i>${turf.distance} km away
                        </div>
                    ` : ''}
                </div>
                <div class="turf-body">
                    <h5 class="turf-title">${turf.name}</h5>
                    <div class="turf-address">
                        <i class="bi bi-geo-alt text-danger"></i>
                        <span>${turf.address}, ${turf.city}</span>
                    </div>
                    <div class="turf-sports-pills">
                        ${(turf.sports || []).slice(0, 3).map(s => `
                            <span class="sport-pill">${getSportIcon(s)} ${s.replace('_', ' ')}</span>
                        `).join('')}
                        ${(turf.sports || []).length > 3 ? `<span class="sport-pill">+${turf.sports.length - 3}</span>` : ''}
                    </div>
                    <div class="turf-footer">
                        <div class="turf-price-box">
                            <span class="turf-price-label">Starts at</span>
                            <span class="turf-price-val">${formatCurrency(turf.price_per_hour)}<span>/hr</span></span>
                        </div>
                        <div class="d-flex gap-2">
                            <a href="turf-details.html?id=${turf.id}" class="btn btn-sm btn-outline-secondary px-2">Details</a>
                            <button onclick="handleBookNowClick('${turf.id}')" class="btn btn-sm btn-primary-turf px-3">
                                Book Now
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

/**
 * Handle "Book Now" click with Authentication Gate
 */
function handleBookNowClick(turfId) {
    if (!isAuthenticated()) {
        requireAuthOrRedirect(`booking.html?id=${turfId}`, 'Please login to continue with your booking.');
        return;
    }
    window.location.href = `booking.html?id=${turfId}`;
}

/**
 * Handle Favorite Toggle
 */
async function handleToggleFavorite(turfId, btnElement) {
    if (!isAuthenticated()) {
        requireAuthOrRedirect(window.location.href, 'Please login to save favorites.');
        return;
    }

    try {
        const token = getToken();
        const res = await fetch(`/api/favorites/${turfId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        const data = await res.json();

        if (data.success) {
            btnElement.classList.toggle('active', data.is_favorite);
            const icon = btnElement.querySelector('i');
            if (icon) {
                icon.className = `bi ${data.is_favorite ? 'bi-heart-fill' : 'bi-heart'}`;
            }
            showToast(data.message, 'success');
        }
    } catch (err) {
        console.error('Favorite error:', err);
    }
}

/**
 * Initialize / Toggle Leaflet Map View
 */
function toggleMapView() {
    const mapContainer = document.getElementById('map-view-wrapper');
    const gridContainer = document.getElementById('turfs-grid-container');
    const toggleBtn = document.getElementById('toggle-map-btn');

    if (!mapContainer) return;

    if (mapContainer.classList.contains('d-none')) {
        mapContainer.classList.remove('d-none');
        toggleBtn.innerHTML = `<i class="bi bi-grid me-1"></i>List View`;
        initLeafletMap();
    } else {
        mapContainer.classList.add('d-none');
        toggleBtn.innerHTML = `<i class="bi bi-map me-1"></i>Map View`;
    }
}

function initLeafletMap() {
    if (!document.getElementById('leaflet-map')) return;

    if (!leafletMapInstance) {
        leafletMapInstance = L.map('leaflet-map').setView([23.0225, 72.5714], 12);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(leafletMapInstance);

        leafletMarkersGroup = L.layerGroup().addTo(leafletMapInstance);
    }

    setTimeout(() => {
        leafletMapInstance.invalidateSize();
        updateMapMarkers(allFetchedTurfs);
    }, 200);
}

function updateMapMarkers(turfs) {
    if (!leafletMapInstance || !leafletMarkersGroup) return;

    leafletMarkersGroup.clearLayers();
    if (!turfs || turfs.length === 0) return;

    const bounds = [];

    turfs.forEach(turf => {
        if (turf.latitude && turf.longitude) {
            const marker = L.marker([turf.latitude, turf.longitude]);
            
            const popupContent = `
                <div class="turf-map-popup p-1" style="min-width: 180px;">
                    <img src="${turf.image_url}" style="width: 100%; height: 90px; object-fit: cover; border-radius: 6px; margin-bottom: 6px;">
                    <h6 class="mb-1 fw-bold">${turf.name}</h6>
                    <div class="small text-muted mb-2">⭐ ${turf.rating} • ${formatCurrency(turf.price_per_hour)}/hr</div>
                    <a href="turf-details.html?id=${turf.id}" class="btn btn-sm btn-primary-turf w-100 py-1" style="font-size: 0.8rem;">View Turf</a>
                </div>
            `;

            marker.bindPopup(popupContent);
            leafletMarkersGroup.addLayer(marker);
            bounds.push([turf.latitude, turf.longitude]);
        }
    });

    if (bounds.length > 0) {
        leafletMapInstance.fitBounds(bounds, { padding: [30, 30] });
    }
}

/**
 * Shimmer Loading and Empty State UI
 */
function getSkeletonCardsHtml(count = 6) {
    return Array(count).fill(0).map(() => `
        <div class="col-md-6 col-lg-4 mb-4">
            <div class="turf-card p-0" style="opacity: 0.7;">
                <div class="bg-secondary" style="height: 200px; animation: pulse 1.5s infinite;"></div>
                <div class="p-3">
                    <div class="bg-secondary mb-2 rounded" style="height: 20px; width: 70%; animation: pulse 1.5s infinite;"></div>
                    <div class="bg-secondary mb-3 rounded" style="height: 14px; width: 90%; animation: pulse 1.5s infinite;"></div>
                    <div class="bg-secondary rounded" style="height: 35px; animation: pulse 1.5s infinite;"></div>
                </div>
            </div>
        </div>
    `).join('');
}

function renderEmptyState(message = 'No turfs found matching your criteria.') {
    const container = document.getElementById('turfs-grid-container');
    if (!container) return;

    container.innerHTML = `
        <div class="col-12 text-center py-5">
            <div class="fs-1 mb-3">🏟️</div>
            <h4 class="fw-bold text-secondary">No Turfs Found</h4>
            <p class="text-muted max-w-md mx-auto mb-4">
                ${message} Try expanding your search distance, changing your location, or selecting another sport.
            </p>
            <button onclick="resetFilters()" class="btn btn-outline-turf">
                <i class="bi bi-arrow-counterclockwise me-1"></i>Reset All Filters
            </button>
        </div>
    `;
}

function resetFilters() {
    if (document.getElementById('filter-sport')) document.getElementById('filter-sport').value = 'all';
    if (document.getElementById('filter-city')) document.getElementById('filter-city').value = 'all';
    if (document.getElementById('filter-search')) document.getElementById('filter-search').value = '';
    if (document.getElementById('filter-radius')) document.getElementById('filter-radius').value = '50';
    if (document.getElementById('filter-price')) document.getElementById('filter-price').value = '';
    if (document.getElementById('filter-rating')) document.getElementById('filter-rating').value = '';
    document.querySelectorAll('.facility-checkbox').forEach(cb => cb.checked = false);
    fetchAndRenderTurfs();
}

function getSportIcon(sportId) {
    const icons = {
        football: '⚽',
        cricket: '🏏',
        box_cricket: '🏏',
        futsal: '🥅',
        badminton: '🏸',
        basketball: '🏀',
        volleyball: '🏐',
        tennis: '🎾'
    };
    return icons[sportId] || '🏅';
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
