// ================================================================
// TURFBOOK — AI ASSISTANT WIDGET & RECOMMENDATIONS ENGINE
// ================================================================

// Built-in client turf dataset fallback for offline / file:// mode
const CLIENT_SEED_TURFS = [
    {
        id: 'turf_ahd_01',
        name: 'Kick Arena Sports Hub',
        address: 'Opposite Alpha One Mall, Vastrapur',
        city: 'Ahmedabad',
        latitude: 23.0373,
        longitude: 72.5298,
        image_url: 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800&auto=format&fit=crop&q=80',
        price_per_hour: 800,
        rating: 4.8,
        sports: ['football', 'box_cricket', 'futsal']
    },
    {
        id: 'turf_ahd_02',
        name: 'Satellite Smash & Goal Arena',
        address: 'Near Star Bazaar, Satellite',
        city: 'Ahmedabad',
        latitude: 23.0242,
        longitude: 72.5186,
        image_url: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&auto=format&fit=crop&q=80',
        price_per_hour: 900,
        rating: 4.7,
        sports: ['football', 'box_cricket', 'badminton']
    },
    {
        id: 'turf_ahd_03',
        name: 'Sindhu Bhavan Champions Turf',
        address: 'Sindhu Bhavan Road, Bodakdev',
        city: 'Ahmedabad',
        latitude: 23.0489,
        longitude: 72.5023,
        image_url: 'https://images.unsplash.com/photo-1518604666860-9ed391f76460?w=800&auto=format&fit=crop&q=80',
        price_per_hour: 1200,
        rating: 4.9,
        sports: ['football', 'box_cricket', 'basketball']
    },
    {
        id: 'turf_ahd_04',
        name: 'Navrangpura Urban Turf & Box',
        address: 'Near Gujarat University, Navrangpura',
        city: 'Ahmedabad',
        latitude: 23.0365,
        longitude: 72.5492,
        image_url: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&auto=format&fit=crop&q=80',
        price_per_hour: 750,
        rating: 4.5,
        sports: ['football', 'box_cricket', 'volleyball']
    },
    {
        id: 'turf_sur_01',
        name: 'Vesu Striker Turf Complex',
        address: 'VIP Road, Vesu',
        city: 'Surat',
        latitude: 21.1442,
        longitude: 72.7758,
        image_url: 'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=800&auto=format&fit=crop&q=80',
        price_per_hour: 950,
        rating: 4.8,
        sports: ['football', 'box_cricket']
    },
    {
        id: 'turf_mum_01',
        name: 'Bandra SeaView Turf & Skydeck',
        address: 'Carter Road, Bandra West',
        city: 'Mumbai',
        latitude: 19.0664,
        longitude: 72.8258,
        image_url: 'https://images.unsplash.com/photo-1551958219-acbc608c6377?w=800&auto=format&fit=crop&q=80',
        price_per_hour: 1600,
        rating: 4.9,
        sports: ['football', 'box_cricket', 'futsal']
    },
    {
        id: 'turf_blr_01',
        name: 'Koramangala Playfield Arena',
        address: '100ft Road, Koramangala',
        city: 'Bengaluru',
        latitude: 12.9352,
        longitude: 77.6245,
        image_url: 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800&auto=format&fit=crop&q=80',
        price_per_hour: 1250,
        rating: 4.8,
        sports: ['football', 'box_cricket', 'futsal']
    }
];

document.addEventListener('DOMContentLoaded', () => {
    initAiWidget();
    loadAiHomepageRecommendations();
});

function initAiWidget() {
    // Inject Floating Action Button & Chat Drawer into DOM if not present
    if (!document.getElementById('ai-fab-container')) {
        const aiWrapper = document.createElement('div');
        aiWrapper.id = 'ai-fab-container';
        aiWrapper.innerHTML = `
            <!-- Floating AI Button -->
            <button class="ai-fab-btn" onclick="toggleAiDrawer()" title="Ask TurfBook AI Assistant">
                <i class="bi bi-robot"></i>
            </button>

            <!-- AI Chat Drawer -->
            <div class="ai-chat-drawer hidden" id="ai-chat-drawer">
                <div class="ai-chat-header">
                    <div class="d-flex align-items-center gap-2">
                        <div class="bg-success rounded-circle p-1 d-flex align-items-center justify-content-center" style="width: 28px; height: 28px;">
                            <i class="bi bi-robot text-white small"></i>
                        </div>
                        <div>
                            <h6 class="mb-0 fw-bold">TurfBook AI Assistant</h6>
                            <small class="text-white-50" style="font-size: 0.75rem;">Instant natural language booking</small>
                        </div>
                    </div>
                    <button class="btn-close btn-close-white btn-sm" onclick="toggleAiDrawer(false)"></button>
                </div>

                <div class="ai-chat-body" id="ai-chat-messages">
                    <div class="ai-msg bot">
                        👋 Hi! I'm your AI Turf Assistant. Tell me what you're looking for!
                        <br><br>
                        <em>Examples:</em>
                        <ul class="mb-0 ps-3 mt-1 small">
                            <li>"Football turf near me under ₹1000"</li>
                            <li>"Cricket turf in Vastrapur tomorrow evening"</li>
                            <li>"Need turf for 10 players in Mumbai"</li>
                        </ul>
                    </div>

                    <div class="ai-quick-chips">
                        <span class="ai-chip" onclick="sendQuickAiPrompt('Football turf under ₹1000')">⚽ Football under ₹1000</span>
                        <span class="ai-chip" onclick="sendQuickAiPrompt('Cricket turf in Ahmedabad')">🏏 Cricket in Ahmedabad</span>
                        <span class="ai-chip" onclick="sendQuickAiPrompt('Turfs near Vastrapur')">📍 Near Vastrapur</span>
                        <span class="ai-chip" onclick="sendQuickAiPrompt('Turf tomorrow evening for 10 people')">⏰ Tomorrow Evening</span>
                    </div>
                </div>

                <div class="ai-chat-footer">
                    <form id="ai-chat-form" onsubmit="handleAiChatSubmit(event)" class="d-flex gap-2">
                        <input type="text" id="ai-chat-input" class="form-control form-control-sm" 
                               placeholder="Ask anything (e.g. Football turf under ₹1000)..." autocomplete="off" required>
                        <button type="submit" class="btn btn-primary-turf btn-sm px-3" id="ai-send-btn">
                            <i class="bi bi-send-fill"></i>
                        </button>
                    </form>
                </div>
            </div>
        `;
        document.body.appendChild(aiWrapper);
    }
}

function toggleAiDrawer(forceOpen = null) {
    const drawer = document.getElementById('ai-chat-drawer');
    if (!drawer) return;

    if (forceOpen === true) {
        drawer.classList.remove('hidden');
    } else if (forceOpen === false) {
        drawer.classList.add('hidden');
    } else {
        drawer.classList.toggle('hidden');
    }

    if (!drawer.classList.contains('hidden')) {
        setTimeout(() => {
            document.getElementById('ai-chat-input')?.focus();
        }, 150);
    }
}

function sendQuickAiPrompt(promptText) {
    const input = document.getElementById('ai-chat-input');
    if (input) {
        input.value = promptText;
        handleAiChatSubmit(new Event('submit'));
    }
}

async function handleAiChatSubmit(e) {
    e.preventDefault();
    const input = document.getElementById('ai-chat-input');
    const sendBtn = document.getElementById('ai-send-btn');
    const messagesContainer = document.getElementById('ai-chat-messages');

    if (!input || !input.value.trim()) return;

    const userQuery = input.value.trim();
    input.value = '';

    // Append User Message Bubble
    appendChatMessage('user', userQuery);

    // Append Typing Indicator
    const typingId = 'ai-typing-' + Date.now();
    const typingBubble = document.createElement('div');
    typingBubble.className = 'ai-msg bot';
    typingBubble.id = typingId;
    typingBubble.innerHTML = `<span class="spinner-grow spinner-grow-sm text-success me-1"></span>Thinking & searching turfs...`;
    messagesContainer.appendChild(typingBubble);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    try {
        const savedLoc = getSavedLocation();
        const payload = { query: userQuery };
        if (savedLoc && savedLoc.lat && savedLoc.lng) {
            payload.lat = savedLoc.lat;
            payload.lng = savedLoc.lng;
        }

        const token = getToken();
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const apiUrl = typeof getApiUrl === 'function' ? getApiUrl('/api/ai/query') : '/api/ai/query';

        const res = await fetch(apiUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload)
        });
        const data = await res.json();

        // Remove typing indicator
        document.getElementById(typingId)?.remove();

        if (data.success) {
            renderAiResponse(data.aiMessage, data.turfs || []);
        } else {
            // Fallback to local client NLP
            runClientSideAiFallback(userQuery);
        }

    } catch (err) {
        console.warn('Backend AI fetch failed, using instant client-side AI engine:', err);
        document.getElementById(typingId)?.remove();
        runClientSideAiFallback(userQuery);
    }
}

/**
 * Robust Client-Side NLP Fallback Parser
 */
function runClientSideAiFallback(queryText) {
    const text = (queryText || '').toLowerCase();
    
    // 1. Detect Sport
    let detectedSport = null;
    if (text.includes('football') || text.includes('soccer') || text.includes('5v5') || text.includes('7v7')) detectedSport = 'football';
    else if (text.includes('box cricket') || text.includes('box')) detectedSport = 'box_cricket';
    else if (text.includes('cricket')) detectedSport = 'cricket';
    else if (text.includes('badminton')) detectedSport = 'badminton';
    else if (text.includes('futsal')) detectedSport = 'futsal';
    else if (text.includes('basketball')) detectedSport = 'basketball';
    else if (text.includes('volleyball')) detectedSport = 'volleyball';
    else if (text.includes('tennis')) detectedSport = 'tennis';

    // 2. Detect Budget
    let maxPrice = null;
    const priceMatch = text.match(/(?:under|below|less than|within|budget)\s*(?:₹|rs\.?|inr)?\s*(\d{3,5})/i) ||
                       text.match(/(?:₹|rs\.?|inr)\s*(\d{3,5})/i);
    if (priceMatch && priceMatch[1]) {
        maxPrice = parseInt(priceMatch[1], 10);
    }

    // 3. Detect City / Area
    let searchLocation = null;
    const localities = ['vastrapur', 'satellite', 'sindhu bhavan', 'bodakdev', 'navrangpura', 'ahmedabad', 'surat', 'mumbai', 'pune', 'bengaluru', 'delhi'];
    for (const loc of localities) {
        if (text.includes(loc)) {
            searchLocation = loc.toUpperCase();
            break;
        }
    }

    // Filter available turfs
    let matchingTurfs = (typeof allFetchedTurfs !== 'undefined' && allFetchedTurfs.length > 0) 
        ? [...allFetchedTurfs] 
        : [...CLIENT_SEED_TURFS];

    if (detectedSport) {
        matchingTurfs = matchingTurfs.filter(t => t.sports && t.sports.includes(detectedSport));
    }
    if (maxPrice) {
        matchingTurfs = matchingTurfs.filter(t => t.price_per_hour <= maxPrice);
    }
    if (searchLocation) {
        matchingTurfs = matchingTurfs.filter(t => 
            t.city.toUpperCase().includes(searchLocation) || 
            t.address.toUpperCase().includes(searchLocation)
        );
    }

    // Sort by rating desc
    matchingTurfs.sort((a, b) => b.rating - a.rating);

    let msg = `I found ${matchingTurfs.length} turf${matchingTurfs.length === 1 ? '' : 's'}`;
    const tags = [];
    if (detectedSport) tags.push(`for ${detectedSport.replace('_', ' ')}`);
    if (maxPrice) tags.push(`under ₹${maxPrice}/hr`);
    if (searchLocation) tags.push(`in ${searchLocation}`);

    if (tags.length > 0) msg += ` matching ${tags.join(', ')}.`;
    else msg += ` matching your request.`;

    if (matchingTurfs.length === 0) {
        msg = `I couldn't find any turfs strictly matching all your criteria. Showing top available arenas instead:`;
        matchingTurfs = CLIENT_SEED_TURFS.slice(0, 3);
    }

    renderAiResponse(msg, matchingTurfs.slice(0, 4));
}

function renderAiResponse(messageText, turfsList) {
    let botResponseHtml = `<div>${messageText}</div>`;

    if (turfsList && turfsList.length > 0) {
        botResponseHtml += `
            <div class="mt-2 d-flex flex-column gap-2">
                ${turfsList.map(t => `
                    <div class="card border p-2 bg-white shadow-sm rounded-3">
                        <div class="d-flex align-items-center gap-2 mb-1">
                            <img src="${t.image_url}" class="rounded" style="width: 45px; height: 40px; object-fit: cover;">
                            <div class="overflow-hidden">
                                <div class="fw-bold small text-truncate">${t.name}</div>
                                <div class="text-muted" style="font-size: 0.72rem;">⭐ ${t.rating} • ${t.city} ${t.distance ? `(${t.distance} km)` : ''}</div>
                            </div>
                        </div>
                        <div class="d-flex justify-content-between align-items-center pt-1 border-top" style="font-size: 0.75rem;">
                            <span class="fw-bold text-success">${formatCurrency(t.price_per_hour)}/hr</span>
                            <div class="d-flex gap-1">
                                <a href="turf-details.html?id=${t.id}" class="btn btn-outline-secondary btn-sm py-0 px-2" style="font-size: 0.7rem;">View</a>
                                <button onclick="handleBookNowClick('${t.id}')" class="btn btn-primary-turf btn-sm py-0 px-2" style="font-size: 0.7rem;">Book</button>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    appendChatMessage('bot', botResponseHtml);
}

function appendChatMessage(sender, htmlContent) {
    const container = document.getElementById('ai-chat-messages');
    if (!container) return;

    const msgEl = document.createElement('div');
    msgEl.className = `ai-msg ${sender}`;
    msgEl.innerHTML = htmlContent;
    container.appendChild(msgEl);
    container.scrollTop = container.scrollHeight;
}

/**
 * Homepage "AI Recommended For You" Loader
 */
async function loadAiHomepageRecommendations() {
    const container = document.getElementById('ai-recommendations-container');
    if (!container) return;

    try {
        const savedLoc = getSavedLocation();
        let queryUrl = typeof getApiUrl === 'function' ? getApiUrl('/api/ai/recommendations') : '/api/ai/recommendations';
        if (savedLoc && savedLoc.lat && savedLoc.lng) {
            queryUrl += `?lat=${savedLoc.lat}&lng=${savedLoc.lng}`;
        }

        const token = getToken();
        const headers = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(queryUrl, { headers });
        const data = await res.json();

        if (data.success && data.recommendations && data.recommendations.length > 0) {
            const insightBox = document.getElementById('ai-insight-text');
            if (insightBox && data.insights) {
                insightBox.textContent = data.insights.message;
            }

            renderRecommendationCards(data.recommendations);
        } else {
            renderRecommendationCards(CLIENT_SEED_TURFS.slice(0, 4));
        }
    } catch (err) {
        console.warn('AI recommendation load note, using seed turfs:', err);
        renderRecommendationCards(CLIENT_SEED_TURFS.slice(0, 4));
    }
}

function renderRecommendationCards(turfs) {
    const container = document.getElementById('ai-recommendations-container');
    if (!container) return;

    container.innerHTML = turfs.map(turf => `
        <div class="col-md-6 col-lg-3 mb-3">
            <div class="turf-card border-success border-1 shadow-sm">
                <div class="turf-img-wrapper" style="height: 150px;">
                    <img src="${turf.image_url}" class="turf-img" alt="${turf.name}">
                    <div class="badge bg-dark bg-opacity-75 position-absolute top-0 start-0 m-2">
                        🤖 ${turf.matchScore || 96}% Match
                    </div>
                </div>
                <div class="p-3 d-flex flex-column flex-grow-1">
                    <h6 class="fw-bold mb-1">${turf.name}</h6>
                    <p class="text-muted small mb-2 text-truncate">${turf.address}, ${turf.city}</p>
                    <div class="small text-success fw-semibold mb-2" style="font-size: 0.76rem;">
                        ✨ ${turf.recommendationReason || 'Top recommended venue for your play style'}
                    </div>
                    <div class="mt-auto pt-2 border-top d-flex justify-content-between align-items-center">
                        <span class="fw-bold text-success">${formatCurrency(turf.price_per_hour)}/hr</span>
                        <a href="turf-details.html?id=${turf.id}" class="btn btn-sm btn-primary-turf">Book</a>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}
