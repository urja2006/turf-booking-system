// ================================================================
// TURFBOOK — COMMON CLIENT UTILITIES & NAVIGATION
// ================================================================

const STORAGE_TOKEN_KEY = 'turfbook_auth_token';
const STORAGE_USER_KEY = 'turfbook_user_data';
const STORAGE_LOC_KEY = 'turfbook_user_location';

/**
 * Universal API Base URL Resolver
 */
function getApiUrl(path) {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    const cleanPath = path.startsWith('/') ? path : '/' + path;

    // If opened directly from file system (file:///...)
    if (window.location.protocol === 'file:') {
        return 'http://localhost:5000' + cleanPath;
    }

    // If running on local dev static server (e.g. Live Server on port 5500 or 3000)
    if ((window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && window.location.port && window.location.port !== '5000') {
        return 'http://localhost:5000' + cleanPath;
    }

    // In production (Vercel, custom domain) or on port 5000, use relative path
    return cleanPath;
}

/**
 * Authentication Storage Helpers
 */
function getToken() {
    return localStorage.getItem(STORAGE_TOKEN_KEY);
}

function getUser() {
    const raw = localStorage.getItem(STORAGE_USER_KEY);
    try {
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

function setAuth(token, user) {
    localStorage.setItem(STORAGE_TOKEN_KEY, token);
    localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(user));
    renderNavbar();
}

function clearAuth() {
    localStorage.removeItem(STORAGE_TOKEN_KEY);
    localStorage.removeItem(STORAGE_USER_KEY);
    renderNavbar();
}

function isAuthenticated() {
    return Boolean(getToken() && getUser());
}

function isAdmin() {
    const user = getUser();
    return Boolean(user && user.role === 'admin');
}

/**
 * Toast Notification Engine
 */
function showToast(message, type = 'success', duration = 4000) {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `turf-toast ${type}`;

    let icon = 'bi-check-circle-fill text-success';
    if (type === 'error') icon = 'bi-exclamation-triangle-fill text-danger';
    if (type === 'warning') icon = 'bi-info-circle-fill text-warning';

    toast.innerHTML = `
        <div class="d-flex align-items-center gap-2">
            <i class="bi ${icon} fs-5"></i>
            <span class="fs-6 fw-semibold">${message}</span>
        </div>
        <button type="button" class="btn-close btn-sm" onclick="this.parentElement.remove()"></button>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

/**
 * Formatting Helpers
 */
function formatCurrency(amount) {
    return '₹' + Number(amount || 0).toLocaleString('en-IN');
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

/**
 * Authentication Guard & Redirect
 */
function requireAuthOrRedirect(intendedUrl = window.location.href, customMsg = 'Please login to continue with your booking.') {
    if (!isAuthenticated()) {
        sessionStorage.setItem('redirect_after_login', intendedUrl);
        sessionStorage.setItem('login_notice', customMsg);
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

/**
 * Global Header / Navbar Renderer
 */
function renderNavbar() {
    const navContainer = document.getElementById('main-navbar-container');
    if (!navContainer) return;

    const user = getUser();
    const isAuthed = isAuthenticated();
    const currentPath = window.location.pathname;

    let authLinksHtml = '';
    if (isAuthed) {
        if (user.role === 'admin') {
            authLinksHtml = `
                <li class="nav-item dropdown">
                    <a class="nav-link dropdown-toggle d-flex align-items-center gap-2 text-white fw-bold" href="#" role="button" data-bs-toggle="dropdown">
                        <span class="badge bg-danger">ADMIN</span>
                        <span>${user.full_name}</span>
                    </a>
                    <ul class="dropdown-menu dropdown-menu-end shadow border-0">
                        <li><a class="dropdown-item" href="admin.html"><i class="bi bi-speedometer2 me-2"></i>Admin Dashboard</a></li>
                        <li><hr class="dropdown-divider"></li>
                        <li><a class="dropdown-item text-danger" href="#" onclick="handleLogout()"><i class="bi bi-box-arrow-right me-2"></i>Logout</a></li>
                    </ul>
                </li>
            `;
        } else {
            authLinksHtml = `
                <li class="nav-item dropdown">
                    <a class="nav-link dropdown-toggle d-flex align-items-center gap-2 text-white fw-semibold" href="#" role="button" data-bs-toggle="dropdown">
                        <img src="${user.avatar_url || 'https://api.dicebear.com/7.x/initials/svg?seed=' + user.full_name}" class="rounded-circle" width="28" height="28" alt="avatar">
                        <span>Hi, ${user.full_name.split(' ')[0]} 👋</span>
                    </a>
                    <ul class="dropdown-menu dropdown-menu-end shadow border-0">
                        <li><a class="dropdown-item" href="dashboard.html"><i class="bi bi-grid-fill me-2 text-primary"></i>My Dashboard</a></li>
                        <li><a class="dropdown-item" href="dashboard.html#bookings"><i class="bi bi-calendar-check me-2 text-success"></i>My Bookings</a></li>
                        <li><a class="dropdown-item" href="dashboard.html#favorites"><i class="bi bi-heart me-2 text-danger"></i>Favorites</a></li>
                        <li><hr class="dropdown-divider"></li>
                        <li><a class="dropdown-item text-danger" href="#" onclick="handleLogout()"><i class="bi bi-box-arrow-right me-2"></i>Logout</a></li>
                    </ul>
                </li>
            `;
        }
    } else {
        authLinksHtml = `
            <li class="nav-item">
                <a class="btn btn-outline-light btn-sm px-3 me-2 fw-semibold" href="login.html">Login</a>
            </li>
            <li class="nav-item">
                <a class="btn btn-primary-turf btn-sm px-3 fw-semibold" href="login.html?tab=register">Register</a>
            </li>
        `;
    }

    navContainer.innerHTML = `
        <nav class="navbar navbar-expand-lg navbar-dark navbar-turf fixed-top">
            <div class="container">
                <a class="navbar-brand" href="index.html">
                    <span>🏟️ TURF<span class="text-success">BOOK</span></span>
                    <span class="brand-badge">AI</span>
                </a>
                <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarMain">
                    <span class="navbar-toggler-icon"></span>
                </button>
                <div class="collapse navbar-collapse" id="navbarMain">
                    <ul class="navbar-nav me-auto mb-2 mb-lg-0 ms-lg-4">
                        <li class="nav-item">
                            <a class="nav-link ${currentPath.includes('index') || currentPath === '/' ? 'active' : ''}" href="index.html">Home</a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link ${currentPath.includes('turfs') ? 'active' : ''}" href="turfs.html">Find Turfs</a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" href="turfs.html?sport=football">Sports</a>
                        </li>
                        ${isAuthed ? `
                            <li class="nav-item">
                                <a class="nav-link ${currentPath.includes('dashboard') ? 'active' : ''}" href="dashboard.html">Bookings</a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link" href="dashboard.html#favorites">Favorites</a>
                            </li>
                        ` : ''}
                        <li class="nav-item">
                            <a class="nav-link text-warning fw-semibold" href="#" onclick="toggleAiDrawer(true)"><i class="bi bi-robot me-1"></i>AI Assistant</a>
                        </li>
                    </ul>
                    <ul class="navbar-nav align-items-center gap-2">
                        ${authLinksHtml}
                    </ul>
                </div>
            </div>
        </nav>
        <div style="height: 70px;"></div>
    `;
}

function handleLogout() {
    clearAuth();
    showToast('You have been logged out successfully.', 'info');
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 800);
}

// Initial setup on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    renderNavbar();

    // Check if there was a login notice
    const notice = sessionStorage.getItem('login_notice');
    if (notice && window.location.pathname.includes('login')) {
        showToast(notice, 'warning', 6000);
        sessionStorage.removeItem('login_notice');
    }
});
