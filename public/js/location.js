// ================================================================
// TURFBOOK — GEOLOCATION & PLACE GEOCODING SERVICE
// ================================================================

const INDIAN_CITIES_COORDS = {
    'ahmedabad': { lat: 23.0225, lng: 72.5714, name: 'Ahmedabad, Gujarat' },
    'vastrapur': { lat: 23.0373, lng: 72.5298, name: 'Vastrapur, Ahmedabad' },
    'satellite': { lat: 23.0242, lng: 72.5186, name: 'Satellite, Ahmedabad' },
    'bodakdev': { lat: 23.0489, lng: 72.5023, name: 'Bodakdev, Ahmedabad' },
    'navrangpura': { lat: 23.0365, lng: 72.5492, name: 'Navrangpura, Ahmedabad' },
    'surat': { lat: 21.1702, lng: 72.8311, name: 'Surat, Gujarat' },
    'vesu': { lat: 21.1442, lng: 72.7758, name: 'Vesu, Surat' },
    'adajan': { lat: 21.1959, lng: 72.7933, name: 'Adajan, Surat' },
    'vadodara': { lat: 22.3072, lng: 73.1812, name: 'Vadodara, Gujarat' },
    'alkapuri': { lat: 22.3107, lng: 73.1706, name: 'Alkapuri, Vadodara' },
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
 * Request GPS Current Location from Browser
 */
function requestCurrentLocation() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation is not supported by your browser.'));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const locData = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    name: 'Current GPS Location',
                    isGPS: true
                };
                localStorage.setItem(STORAGE_LOC_KEY, JSON.stringify(locData));
                resolve(locData);
            },
            (error) => {
                let msg = 'Unable to retrieve your location.';
                if (error.code === error.PERMISSION_DENIED) {
                    msg = 'Location access was denied. You can search by city or area instead.';
                } else if (error.code === error.POSITION_UNAVAILABLE) {
                    msg = 'Location information is currently unavailable.';
                } else if (error.code === error.TIMEOUT) {
                    msg = 'Location request timed out.';
                }
                reject(new Error(msg));
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
        );
    });
}

/**
 * Geocode a place/city query using local lookup + Nominatim fallback
 */
async function geocodePlace(query) {
    if (!query || query.trim() === '') return null;
    const cleanQ = query.trim().toLowerCase();

    // 1. Check known local presets
    for (const [key, coords] of Object.entries(INDIAN_CITIES_COORDS)) {
        if (cleanQ.includes(key) || key.includes(cleanQ)) {
            const locData = {
                lat: coords.lat,
                lng: coords.lng,
                name: coords.name,
                isGPS: false
            };
            localStorage.setItem(STORAGE_LOC_KEY, JSON.stringify(locData));
            return locData;
        }
    }

    // 2. Fallback to OpenStreetMap Nominatim API
    try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ', India')}&limit=1`;
        const res = await fetch(url);
        const data = await res.json();

        if (data && data.length > 0) {
            const locData = {
                lat: parseFloat(data[0].lat),
                lng: parseFloat(data[0].lon),
                name: data[0].display_name.split(',')[0],
                isGPS: false
            };
            localStorage.setItem(STORAGE_LOC_KEY, JSON.stringify(locData));
            return locData;
        }
    } catch (err) {
        console.warn('Nominatim geocode failed, using Ahmedabad center fallback:', err);
    }

    // Default fallback to Ahmedabad
    return {
        lat: 23.0225,
        lng: 72.5714,
        name: query,
        isGPS: false
    };
}

/**
 * Get Saved User Location from Storage
 */
function getSavedLocation() {
    const raw = localStorage.getItem(STORAGE_LOC_KEY);
    try {
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}
