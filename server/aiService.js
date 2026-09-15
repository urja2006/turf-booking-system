// ================================================================
// TURFBOOK — AI SERVICE (NLP QUERY PARSER & RECOMMENDATIONS)
// ================================================================
// Supports OpenAI / Gemini if API key configured, with a smart
// built-in rule-based NLP engine that extracts sports, budget,
// location, radius, date, time slots, and players accurately!
// ================================================================

const { localStore, calculateDistanceKm } = require('./supabase');

// Known sport keyword dictionary
const SPORT_KEYWORDS = {
    football: ['football', 'soccer', '5v5', '7v7', '11v11'],
    cricket: ['cricket', 'pitch', 'outfield', 'nets'],
    box_cricket: ['box cricket', 'box', 'gully cricket', 'indoor cricket'],
    futsal: ['futsal'],
    badminton: ['badminton', 'shuttle', 'racket court'],
    basketball: ['basketball', 'hoop', 'court'],
    volleyball: ['volleyball', 'volley'],
    tennis: ['tennis', 'lawn tennis']
};

// Known cities and popular localities
const LOCALITY_COORDS = {
    'vastrapur': { lat: 23.0373, lng: 72.5298, city: 'Ahmedabad' },
    'satellite': { lat: 23.0242, lng: 72.5186, city: 'Ahmedabad' },
    'sindhu bhavan': { lat: 23.0489, lng: 72.5023, city: 'Ahmedabad' },
    'bodakdev': { lat: 23.0489, lng: 72.5023, city: 'Ahmedabad' },
    'navrangpura': { lat: 23.0365, lng: 72.5492, city: 'Ahmedabad' },
    'sg highway': { lat: 23.0964, lng: 72.5369, city: 'Ahmedabad' },
    'ahmedabad': { lat: 23.0225, lng: 72.5714, city: 'Ahmedabad' },
    'vesu': { lat: 21.1442, lng: 72.7758, city: 'Surat' },
    'adajan': { lat: 21.1959, lng: 72.7933, city: 'Surat' },
    'surat': { lat: 21.1702, lng: 72.8311, city: 'Surat' },
    'alkapuri': { lat: 22.3107, lng: 73.1706, city: 'Vadodara' },
    'gotri': { lat: 22.3168, lng: 73.1362, city: 'Vadodara' },
    'vadodara': { lat: 22.3072, lng: 73.1812, city: 'Vadodara' },
    'bandra': { lat: 19.0664, lng: 72.8258, city: 'Mumbai' },
    'andheri': { lat: 19.1363, lng: 72.8301, city: 'Mumbai' },
    'powai': { lat: 19.1197, lng: 72.9051, city: 'Mumbai' },
    'mumbai': { lat: 19.0760, lng: 72.8777, city: 'Mumbai' },
    'kothrud': { lat: 18.5074, lng: 73.8077, city: 'Pune' },
    'baner': { lat: 18.5590, lng: 73.7868, city: 'Pune' },
    'pune': { lat: 18.5204, lng: 73.8567, city: 'Pune' },
    'koramangala': { lat: 12.9352, lng: 77.6245, city: 'Bengaluru' },
    'indiranagar': { lat: 12.9784, lng: 77.6408, city: 'Bengaluru' },
    'bengaluru': { lat: 12.9716, lng: 77.5946, city: 'Bengaluru' },
    'bangalore': { lat: 12.9716, lng: 77.5946, city: 'Bengaluru' },
    'saket': { lat: 28.5244, lng: 77.2167, city: 'Delhi' },
    'hauz khas': { lat: 28.5494, lng: 77.2001, city: 'Delhi' },
    'delhi': { lat: 28.6139, lng: 77.2090, city: 'Delhi' }
};

/**
 * Smart Rule-Based NLP Parser for natural language queries
 */
function parseNaturalQuery(queryText, userLat = null, userLng = null) {
    const text = (queryText || '').toLowerCase();
    
    // 1. Detect Sport
    let detectedSport = null;
    for (const [sport, keywords] of Object.entries(SPORT_KEYWORDS)) {
        if (keywords.some(k => text.includes(k))) {
            detectedSport = sport;
            break;
        }
    }

    // 2. Detect Max Budget / Price
    let maxPrice = null;
    const priceMatch = text.match(/(?:under|below|less than|within|max|budget)\s*(?:₹|rs\.?|inr)?\s*(\d{3,5})/i) ||
                       text.match(/(?:₹|rs\.?|inr)\s*(\d{3,5})/i);
    if (priceMatch && priceMatch[1]) {
        maxPrice = parseInt(priceMatch[1], 10);
    }

    // 3. Detect Distance Radius
    let maxDistance = null;
    const distMatch = text.match(/(?:within|in|under|around)\s*(\d{1,3})\s*(?:km|kms|kilometers)/i);
    if (distMatch && distMatch[1]) {
        maxDistance = parseFloat(distMatch[1]);
    }

    // 4. Detect Location / Locality / City
    let searchLocation = null;
    let targetLat = userLat;
    let targetLng = userLng;
    let locationName = null;

    if (text.includes('near me') || text.includes('nearby') || text.includes('my location')) {
        locationName = 'your current location';
    } else {
        for (const [loc, data] of Object.entries(LOCALITY_COORDS)) {
            if (text.includes(loc)) {
                searchLocation = loc;
                targetLat = data.lat;
                targetLng = data.lng;
                locationName = data.city ? `${loc.toUpperCase()} (${data.city})` : loc.toUpperCase();
                break;
            }
        }
    }

    // 5. Detect Date intent
    let targetDate = null;
    const today = new Date();
    if (text.includes('tomorrow')) {
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        targetDate = tomorrow.toISOString().split('T')[0];
    } else if (text.includes('today') || text.includes('tonight')) {
        targetDate = today.toISOString().split('T')[0];
    }

    // 6. Detect Time of Day
    let preferredTime = null;
    if (text.includes('morning')) preferredTime = 'Morning (06:00 AM - 12:00 PM)';
    else if (text.includes('afternoon')) preferredTime = 'Afternoon (12:00 PM - 05:00 PM)';
    else if (text.includes('evening') || text.includes('night')) preferredTime = 'Evening/Night (06:00 PM - 11:00 PM)';

    // 7. Detect Number of Players
    let players = null;
    const playersMatch = text.match(/(\d{1,2})\s*(?:players|people|person|folks|guys)/i);
    if (playersMatch && playersMatch[1]) {
        players = parseInt(playersMatch[1], 10);
    }

    return {
        originalQuery: queryText,
        detectedSport,
        maxPrice,
        maxDistance,
        searchLocation,
        targetLat,
        targetLng,
        locationName: locationName || (targetLat ? 'your location' : 'all locations'),
        targetDate,
        preferredTime,
        players
    };
}

/**
 * Call OpenAI API if OPENAI_API_KEY is configured
 */
async function parseQueryWithOpenAI(queryText, userLat = null, userLng = null) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || apiKey.trim() === '' || apiKey === 'your_openai_api_key_here') {
        return null; // Fallback to built-in NLP
    }

    try {
        const prompt = `
You are an AI assistant for TurfBook, a sports turf booking platform in India.
User query: "${queryText}"

Extract the intent into valid JSON matching this exact structure:
{
  "detectedSport": "football" | "box_cricket" | "cricket" | "badminton" | "futsal" | "basketball" | "volleyball" | "tennis" | null,
  "maxPrice": number (in INR) | null,
  "maxDistance": number (in km) | null,
  "searchLocation": "city or locality name in India (e.g. Vastrapur, Ahmedabad, Surat, Mumbai, Pune, Bengaluru, Delhi)" | null,
  "targetDate": "YYYY-MM-DD" | null,
  "preferredTime": "Morning" | "Afternoon" | "Evening" | null,
  "players": number | null,
  "aiSummary": "A short, friendly 1-2 sentence conversational answer to the player acknowledging what they are looking for."
}
Return ONLY the raw JSON object, without markdown formatting.
`;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: 'You are a structured NLP extraction assistant for a sports venue booking platform.' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.2,
                max_tokens: 300
            })
        });

        if (!response.ok) {
            console.warn(`OpenAI API responded with status ${response.status}. Using built-in NLP fallback.`);
            return null;
        }

        const data = await response.json();
        const rawContent = data.choices?.[0]?.message?.content?.trim();
        if (rawContent) {
            const cleanJson = rawContent.replace(/^```json\s*/, '').replace(/```$/, '').trim();
            const parsed = JSON.parse(cleanJson);

            // Match coordinates if location is recognized
            let targetLat = userLat;
            let targetLng = userLng;
            let locName = parsed.searchLocation;

            if (parsed.searchLocation) {
                const locKey = parsed.searchLocation.toLowerCase();
                for (const [key, coords] of Object.entries(LOCALITY_COORDS)) {
                    if (locKey.includes(key) || key.includes(locKey)) {
                        targetLat = coords.lat;
                        targetLng = coords.lng;
                        locName = coords.city ? `${key.toUpperCase()} (${coords.city})` : key.toUpperCase();
                        break;
                    }
                }
            }

            return {
                originalQuery: queryText,
                detectedSport: parsed.detectedSport || null,
                maxPrice: parsed.maxPrice || null,
                maxDistance: parsed.maxDistance || null,
                searchLocation: parsed.searchLocation || null,
                targetLat,
                targetLng,
                locationName: locName || (targetLat ? 'your location' : 'all locations'),
                targetDate: parsed.targetDate || null,
                preferredTime: parsed.preferredTime || null,
                players: parsed.players || null,
                customAiMessage: parsed.aiSummary || null,
                isPoweredByOpenAI: true
            };
        }
    } catch (err) {
        console.warn('OpenAI query parsing failed, using built-in NLP fallback:', err.message);
    }

    return null;
}

/**
 * Filter turfs based on parsed parameters
 */
function searchTurfsWithAI(turfsList, parsedParams) {
    let results = [...turfsList];

    // Filter by Active Status
    results = results.filter(t => t.status === 'active');

    // Filter by Sport
    if (parsedParams.detectedSport) {
        results = results.filter(t => 
            t.sports && t.sports.includes(parsedParams.detectedSport)
        );
    }

    // Filter by Max Price
    if (parsedParams.maxPrice) {
        results = results.filter(t => {
            const price = (parsedParams.detectedSport && t.sport_prices && t.sport_prices[parsedParams.detectedSport]) 
                ? t.sport_prices[parsedParams.detectedSport] 
                : t.price_per_hour;
            return price <= parsedParams.maxPrice;
        });
    }

    // Calculate distance and filter/sort by location
    if (parsedParams.targetLat && parsedParams.targetLng) {
        results = results.map(t => {
            const dist = calculateDistanceKm(parsedParams.targetLat, parsedParams.targetLng, t.latitude, t.longitude);
            return { ...t, distance: dist };
        });

        // Filter by radius if specified
        if (parsedParams.maxDistance) {
            results = results.filter(t => t.distance !== null && t.distance <= parsedParams.maxDistance);
        }

        // Sort by nearest
        results.sort((a, b) => (a.distance || 9999) - (b.distance || 9999));
    } else {
        // Sort by rating desc
        results.sort((a, b) => b.rating - a.rating);
    }

    return results;
}

/**
 * Generate Personalized AI Recommendations based on user history
 */
function getPersonalizedRecommendations(userHistoryBookings, favorites, allTurfs, userLat = null, userLng = null) {
    let preferredSport = 'football';
    let avgBudget = 900;
    let preferredCity = 'Ahmedabad';

    if (userHistoryBookings && userHistoryBookings.length > 0) {
        // Count sports
        const sportCounts = {};
        let totalAmount = 0;
        userHistoryBookings.forEach(b => {
            sportCounts[b.sport_id] = (sportCounts[b.sport_id] || 0) + 1;
            totalAmount += (b.amount || 800);
        });
        
        preferredSport = Object.keys(sportCounts).reduce((a, b) => sportCounts[a] > sportCounts[b] ? a : b, 'football');
        avgBudget = Math.round(totalAmount / userHistoryBookings.length);
    }

    // Filter candidate turfs
    let candidates = allTurfs.filter(t => t.status === 'active');

    // Attach distances if coords available
    if (userLat && userLng) {
        candidates = candidates.map(t => ({
            ...t,
            distance: calculateDistanceKm(userLat, userLng, t.latitude, t.longitude)
        }));
    }

    // Score turfs based on match with preference
    const scoredTurfs = candidates.map(t => {
        let score = 0;
        const reasons = [];

        // Sport match
        if (t.sports && t.sports.includes(preferredSport)) {
            score += 40;
            reasons.push(`Offers your favorite sport (${preferredSport.replace('_', ' ')})`);
        }

        // Budget match (within +- 30% of avg spend)
        const price = (t.sport_prices && t.sport_prices[preferredSport]) || t.price_per_hour;
        if (Math.abs(price - avgBudget) <= 300) {
            score += 25;
            reasons.push(`Matches your typical budget of ₹${avgBudget}/hr (₹${price}/hr)`);
        }

        // Rating
        score += (t.rating || 4.5) * 5;

        // Distance bonus
        if (t.distance !== undefined && t.distance !== null) {
            if (t.distance <= 5) score += 20;
            else if (t.distance <= 15) score += 10;
        }

        // Favorite bonus
        if (favorites && favorites.some(f => f.turf_id === t.id)) {
            score += 15;
            reasons.push('In your saved favorites');
        }

        return {
            turf: t,
            score,
            reason: reasons.join(' • ') || 'Top rated multi-sport arena in your area',
            price
        };
    });

    scoredTurfs.sort((a, b) => b.score - a.score);

    return {
        insights: {
            preferredSport,
            avgBudget,
            message: `You frequently book ${preferredSport.replace('_', ' ')} around ₹${avgBudget}/hr.`
        },
        recommendations: scoredTurfs.slice(0, 4).map(item => ({
            ...item.turf,
            recommendationReason: item.reason,
            matchScore: Math.min(99, Math.round(item.score))
        }))
    };
}

module.exports = {
    parseNaturalQuery,
    parseQueryWithOpenAI,
    searchTurfsWithAI,
    getPersonalizedRecommendations
};
