// ================================================================
// TURFBOOK — AUTHENTICATION CLIENT HANDLERS
// ================================================================

document.addEventListener('DOMContentLoaded', () => {
    // Check URL parameters for tab preference (e.g. ?tab=register)
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    if (tabParam === 'register') {
        switchAuthTab('register');
    }

    // 1. User Login Form
    const loginForm = document.getElementById('user-login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = loginForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.innerHTML;

            try {
                submitBtn.disabled = true;
                submitBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>Logging in...`;

                const email = document.getElementById('login-email').value;
                const password = document.getElementById('login-password').value;

                const loginUrl = typeof getApiUrl === 'function' ? getApiUrl('/api/auth/login') : '/api/auth/login';
                const response = await fetch(loginUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();

                if (!data.success) {
                    showToast(data.message || 'Login failed. Please check your credentials.', 'error');
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalBtnText;
                    return;
                }

                // Save Auth Token & User
                setAuth(data.token, data.user);
                showToast(data.message, 'success');

                // Redirect to previous intended page or dashboard
                const redirectUrl = sessionStorage.getItem('redirect_after_login');
                sessionStorage.removeItem('redirect_after_login');

                setTimeout(() => {
                    if (data.user.role === 'admin') {
                        window.location.href = 'admin.html';
                    } else if (redirectUrl) {
                        window.location.href = redirectUrl;
                    } else {
                        window.location.href = 'dashboard.html';
                    }
                }, 800);

            } catch (err) {
                console.error('Login error:', err);
                showToast('Network error occurred. Please try again.', 'error');
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
            }
        });
    }

    // 2. User Registration Form
    const registerForm = document.getElementById('user-register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = registerForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.innerHTML;

            try {
                const fullName = document.getElementById('reg-name').value;
                const email = document.getElementById('reg-email').value;
                const phone = document.getElementById('reg-phone').value;
                const password = document.getElementById('reg-password').value;
                const confirmPassword = document.getElementById('reg-confirm-password').value;

                if (password !== confirmPassword) {
                    showToast('Passwords do not match.', 'warning');
                    return;
                }

                submitBtn.disabled = true;
                submitBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>Creating account...`;

                const regUrl = typeof getApiUrl === 'function' ? getApiUrl('/api/auth/register') : '/api/auth/register';
                const response = await fetch(regUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ full_name: fullName, email, phone, password })
                });

                const data = await response.json();

                if (!data.success) {
                    showToast(data.message || 'Registration failed.', 'error');
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalBtnText;
                    return;
                }

                setAuth(data.token, data.user);
                showToast(data.message, 'success');

                const redirectUrl = sessionStorage.getItem('redirect_after_login');
                sessionStorage.removeItem('redirect_after_login');

                setTimeout(() => {
                    window.location.href = redirectUrl || 'dashboard.html';
                }, 1000);

            } catch (err) {
                console.error('Registration error:', err);
                showToast('Registration failed due to a server error.', 'error');
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
            }
        });
    }

    // 3. Admin Login Form (on admin-login.html)
    const adminLoginForm = document.getElementById('admin-login-form');
    if (adminLoginForm) {
        adminLoginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = adminLoginForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.innerHTML;

            try {
                submitBtn.disabled = true;
                submitBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>Authenticating...`;

                const email = document.getElementById('admin-email').value;
                const password = document.getElementById('admin-password').value;

                const adminUrl = typeof getApiUrl === 'function' ? getApiUrl('/api/auth/admin-login') : '/api/auth/admin-login';
                const response = await fetch(adminUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();

                if (!data.success) {
                    showToast(data.message || 'Admin authentication failed.', 'error');
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalBtnText;
                    return;
                }

                setAuth(data.token, data.user);
                showToast('Welcome to TurfBook Admin Portal', 'success');

                setTimeout(() => {
                    window.location.href = 'admin.html';
                }, 800);

            } catch (err) {
                console.error('Admin login error:', err);
                showToast('Network error during admin authentication.', 'error');
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
            }
        });
    }
});

function switchAuthTab(tab) {
    const loginTabBtn = document.getElementById('tab-login-btn');
    const regTabBtn = document.getElementById('tab-register-btn');
    const loginCard = document.getElementById('login-card-section');
    const regCard = document.getElementById('register-card-section');

    if (!loginTabBtn || !regTabBtn) return;

    if (tab === 'register') {
        loginTabBtn.classList.remove('active');
        regTabBtn.classList.add('active');
        loginCard.classList.add('d-none');
        regCard.classList.remove('d-none');
    } else {
        regTabBtn.classList.remove('active');
        loginTabBtn.classList.add('active');
        regCard.classList.add('d-none');
        loginCard.classList.remove('d-none');
    }
}
