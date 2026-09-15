// ================================================================
// TURFBOOK — MULTI-TIER GEOLOCATION & PLACE GEOCODING SERVICE
// ================================================================

const INDIAN_CITIES_COORDS = {
    'ahmedabad': { lat: 23.0225, lng: 72.5714, name: 'Ahmedabad, Gujarat' },
    'vastrapur': { lat: 23.0373, lng: 72.5298, name: 'Vastrapur, Ahmedabad' },
    'satellite': { lat: 23.0242, lng: 72.5186, name: 'Satellite, Ahmedabad' },
    'bodakdev': { lat: 23.0489, lng: 72.5023, name: 'Bodakdev, Ahmedabad' },
    'sindhu bhavan': { lat: 23.0489, lng: 72.5023, name: 'Sindhu Bhavan Road, Ahmedabad' },
    'navrangpura': { lat: 23.0365, lng: 72.5492, name: 'Navrangpura, Ahmedabad' },
    'surat': { lat: 21.1702, lng: 72.8311, name: 'Surat, Gujarat' },
    'vesu': { lat: 21.1442, lng: 72.7758, name: 'Vesu, Surat' },
    'adajan': { lat: 21.1959, lng: 72.7933, name: 'Adajan, Surat' },
    'vadodara': { lat: 22.3072, lng: 73.1812, name: 'Vadodara, Gujarat' },
    'alkapuri': { lat: 22.3107, lng: 73.1706, name: 'Alkapuri, Vadodara' },
    'gotri': { lat: 22.3168, lng: 73.1362, name: 'Gotri, Vadodara' },
    'mumbai': { lat: 19.0760, lng: 72.8777, name: 'Mumbai, Maharashtra' },
    'bandra': { lat: 19.0664, lng: 72.8258, name: 'Bandra, Mumbai' },
    'andheri': { lat: 19.1363, lng: 72.8301, name: 'Andheri, Mumbai' },
    'powai': { lat: 19.1197, lng: 72.9051, name: 'Powai, Mumbai' },
    'pune': { lat: 18.5204, lng: 73.8567, name: 'Pune, Maharashtra' },
    'kothrud': { lat: 18.5074, lng: 73.8077, name: 'Kothrud, Pune' },
    'baner': { lat: 18.5590, lng: 73.7868, name: 'Baner, Pune' },
    'bengaluru': { lat: 12.9716, lng: 77.5946, name: 'Bengaluru, Karnataka' },
    'koramangala': { lat: 12.9352, lng: 77.6245, name: 'Koramangala, Bengaluru' },
    'indiranagar': { lat: 12.9784, lng: 77.6408, name: 'Indiranagar, Bengaluru' },
    'delhi': { lat: 28.6139, lng: 77.2090, name: 'Delhi, NCR' },
    'saket': { lat: 28.5244, lng: 77.2167, name: 'Saket, Delhi' },
    'hauz khas': { lat: 28.5494, lng: 77.2001, name: 'Hauz Khas, Delhi' }
};

/**
 * Multi-Tier Location Detection:
 * Tier 1: Fast Browser Geolocation (Wi-Fi / Cell / GPS)
 * Tier 2: IP-based Geolocation fallback (ipapi / ipwho)
 * Tier 3: Default Preset City (Ahmedabad)
 */
async function requestCurrentLocation() {
    // 1. Try Browser Geolocation first
    try {
        const browserLoc = await getBrowserCoordinates();
        if (browserLoc && browserLoc.lat && browserLoc.lng) {
            // Reverse geocode to get city/area name if possible
            const resolvedName = await reverseGeocode(browserLoc.lat, browserLoc.lng) || 'Your Current Location';
            const locData = {
                lat: Number(browserLoc.lat.toFixed(4)),
                lng: Number(browserLoc.lng.toFixed(4)),
                name: resolvedName,
                isGPS: true,
                source: 'Browser Geolocation'
            };
            saveUserLocation(locData);
            return locData;
        }
    } catch (browserErr) {
        console.warn('Browser GPS detection failed, falling back to IP Geolocation:', browserErr.message);
    }

    // 2. Fallback to IP-based Geolocation
    try {
        const ipLoc = await getIpLocation();
        if (ipLoc && ipLoc.lat && ipLoc.lng) {
            const locData = {
                lat: Number(ipLoc.lat.toFixed(4)),
                lng: Number(ipLoc.lng.toFixed(4)),
                name: ipLoc.city ? `${ipLoc.city}, ${ipLoc.region || 'India'}` : 'Your Approximate Location',
                isGPS: false,
                source: 'IP Geolocation'
            };
            saveUserLocation(locData);
            return locData;
        }
    } catch (ipErr) {
        console.warn('IP Geolocation fallback failed:', ipErr.message);
    }

    // 3. Fallback to default preset (Ahmedabad Center)
    const defaultLoc = {
        lat: 23.0225,
        lng: 72.5714,
        name: 'Ahmedabad, Gujarat (Default)',
        isGPS: false,
        source: 'Default Location'
    };
    saveUserLocation(defaultLoc);
    return defaultLoc;
}

/**
 * Helper: Promise wrapper around navigator.geolocation with fallback options
 */
function getBrowserCoordinates() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation not supported by browser.'));
            return;
        }

        // Try standard low-power/Wi-Fi positioning first (faster and works reliably on laptops)
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                resolve({
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude
                });
            },
            (err) => {
                // If standard fails and wasn't a hard permission denial, attempt high accuracy
                if (err.code !== err.PERMISSION_DENIED) {
                    navigator.geolocation.getCurrentPosition(
                        (pos2) => {
                            resolve({
                                lat: pos2.coords.latitude,
                                lng: pos2.coords.longitude
                            });
                        },
                        (err2) => {
                            reject(err2);
                        },
                        { enableHighAccuracy: true, timeout: 5000, maximumAge: 300000 }
                    );
                } else {
                    reject(err);
                }
            },
            { enableHighAccuracy: false, timeout: 4000, maximumAge: 300000 }
        );
    });
}

/**
 * Helper: Free IP-based Geolocation service
 */
async function getIpLocation() {
    try {
        // Try ipapi.co
        const res = await fetch('https://ipapi.co/json/', { timeout: 3000 });
        if (res.ok) {
            const data = await res.json();
            if (data.latitude && data.longitude) {
                return {
                    lat: parseFloat(data.latitude),
                    lng: parseFloat(data.longitude),
                    city: data.city,
                    region: data.region
                };
            }
        }
    } catch (e) {
        // Try alternative ipwho.is
        try {
            const res2 = await fetch('https://ipwho.is/');
            if (res2.ok) {
                const data2 = await res2.json();
                if (data2.success && data2.latitude && data2.longitude) {
                    return {
                        lat: parseFloat(data2.latitude),
                        lng: parseFloat(data2.longitude),
                        city: data2.city,
                        region: data2.region
                    };
                }
            }
        } catch (e2) {
            // failed
        }
    }
    return null;
}

/**
 * Reverse Geocode coordinates to city/area name
 */
async function reverseGeocode(lat, lng) {
    // 1. Check known local presets closest to coordinates
    let closestCity = null;
    let minDistance = 99999;

    for (const [key, coords] of Object.entries(INDIAN_CITIES_COORDS)) {
        const d = calculateDistance(lat, lng, coords.lat, coords.lng);
        if (d < minDistance) {
            minDistance = d;
            closestCity = coords.name;
        }
    }

    if (minDistance <= 15 && closestCity) {
        return closestCity;
    }

    // 2. OpenStreetMap reverse lookup
    try {
        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14&addressdetails=1`;
        const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
        if (res.ok) {
            const data = await res.json();
            if (data && data.address) {
                const sub = data.address.suburb || data.address.neighbourhood || data.address.residential || '';
                const city = data.address.city || data.address.state_district || data.address.state || '';
                return sub ? `${sub}, ${city}` : city || closestCity || 'Your Location';
            }
        }
    } catch (err) {
        // Ignore
    }

    return closestCity || 'Your Location';
}

/**
 * Geocode place search query (e.g. "Vastrapur", "Mumbai", "Bandra")
 */
async function geocodePlace(query) {
    if (!query || query.trim() === '') return null;
    const cleanQ = query.trim().toLowerCase();

    // 1. Check verified local preset database
    for (const [key, coords] of Object.entries(INDIAN_CITIES_COORDS)) {
        if (cleanQ.includes(key) || key.includes(cleanQ)) {
            const locData = {
                lat: coords.lat,
                lng: coords.lng,
                name: coords.name,
                isGPS: false,
                source: 'Preset Locality'
            };
            saveUserLocation(locData);
            return locData;
        }
    }

    // 2. Fallback to OpenStreetMap Nominatim Geocoder
    try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ', India')}&limit=1`;
        const res = await fetch(url);
        const data = await res.json();

        if (data && data.length > 0) {
            const locData = {
                lat: parseFloat(data[0].lat),
                lng: parseFloat(data[0].lon),
                name: data[0].display_name.split(',')[0],
                isGPS: false,
                source: 'OpenStreetMap Geocoder'
            };
            saveUserLocation(locData);
            return locData;
        }
    } catch (err) {
        console.warn('Nominatim geocode failed, using Ahmedabad fallback:', err);
    }

    // Default fallback to Ahmedabad
    const locData = {
        lat: 23.0225,
        lng: 72.5714,
        name: query,
        isGPS: false,
        source: 'Fallback City'
    };
    saveUserLocation(locData);
    return locData;
}

/**
 * Save user location to storage & dispatch custom event
 */
function saveUserLocation(locData) {
    localStorage.setItem(STORAGE_LOC_KEY, JSON.stringify(locData));
    window.dispatchEvent(new CustomEvent('turfbook:locationChanged', { detail: locData }));
}

/**
 * Get saved user location or default to Ahmedabad
 */
function getSavedLocation() {
    const raw = localStorage.getItem(STORAGE_LOC_KEY);
    try {
        if (raw) return JSON.parse(raw);
    } catch (e) {
        // ignore
    }
    // Default location so distance calculations always work out of the box
    return {
        lat: 23.0225,
        lng: 72.5714,
        name: 'Ahmedabad, Gujarat',
        isGPS: false
    };
}

/**
 * Calculate distance helper
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Number((R * c).toFixed(1));
}
