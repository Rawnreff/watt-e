class AuthManager {
    constructor() {
        this.api = apiClient;
        this.currentUser = null;
        this.initEventListeners();
        this.checkAuthStatus();
        this.loadUserData();
    }

    initEventListeners() {
        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Register form
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        }

        // Logout buttons (attach only if not already attached by another module)
        const logoutBtnProfile = document.getElementById('logoutBtnProfile');
        if (logoutBtnProfile && !logoutBtnProfile.dataset.logoutAttached) {
            logoutBtnProfile.addEventListener('click', () => this.handleLogout());
            logoutBtnProfile.dataset.logoutAttached = 'true';
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const credentials = {
            email: formData.get('email'),
            password: formData.get('password')
        };

        try {
            const loadingBtn = e.target.querySelector('button[type="submit"]');
            const originalText = loadingBtn.textContent;
            loadingBtn.innerHTML = '<i class="ri-loader-4-line spin"></i> Masuk...';
            loadingBtn.disabled = true;

            const result = await this.api.login(credentials);
            
            this.api.setToken(result.token);
            this.currentUser = result.user;
            
            // Save user data to localStorage for consistency
            localStorage.setItem('watt_e_user', JSON.stringify(result.user));
            
            this.showNotification('Login berhasil!', 'success');
            
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);

        } catch (error) {
            this.showNotification(error.message || 'Login gagal', 'error');
        } finally {
            const loadingBtn = e.target.querySelector('button[type="submit"]');
            if (loadingBtn) {
                loadingBtn.textContent = 'Masuk';
                loadingBtn.disabled = false;
            }
        }
    }

    async handleRegister(e) {
        // Check terms checkbox BEFORE preventing default
        const agreeTerms = document.getElementById('agreeTerms');
        if (agreeTerms && !agreeTerms.checked) {
            // Prevent form submission
            e.preventDefault();
            
            // Try to focus the checkbox
            try {
                agreeTerms.focus();
            } catch (err) {
                // If focus fails, scroll to checkbox container
                const container = document.querySelector('.checkbox-container');
                if (container) {
                    container.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
            
            // Visual feedback: red highlight + ripple on the checkbox
            try {
                const agreeTermsInput = document.getElementById('agreeTerms');
                const checkmark = agreeTermsInput ? agreeTermsInput.nextElementSibling : null;
                const container = agreeTermsInput ? agreeTermsInput.closest('.checkbox-container') : null;
                
                if (checkmark && container) {
                    // Add error class to checkmark and container
                    checkmark.classList.add('error');
                    container.classList.add('error', 'shake');
                    
                    // Create ripple effect
                    const ripple = document.createElement('span');
                    ripple.className = 'check-ripple';
                    checkmark.appendChild(ripple);
                    
                    // Force layout reflow to ensure animation starts
                    // eslint-disable-next-line no-unused-expressions
                    ripple.offsetWidth;
                    
                    // Start ripple animation
                    ripple.classList.add('animate');
                    
                    // Remove ripple after animation completes (600ms)
                    setTimeout(() => {
                        if (ripple.parentNode) {
                            ripple.remove();
                        }
                    }, 650);
                    
                    // Remove shake animation after it completes (340ms)
                    setTimeout(() => {
                        container.classList.remove('shake');
                    }, 400);
                    
                    // Remove error state after 1 second (1000ms) to return to normal color
                    setTimeout(() => {
                        checkmark.classList.remove('error');
                        container.classList.remove('error');
                    }, 1000);
                }
            } catch (err) {
                console.error('Error showing checkbox validation feedback:', err);
            }

            // Show alert
            if (typeof showAlert === 'function') {
                showAlert({ 
                    title: 'Persetujuan Diperlukan', 
                    message: 'Silakan setujui Syarat & Ketentuan dan Kebijakan Privasi sebelum mendaftar.', 
                    confirmText: 'Mengerti' 
                });
            } else {
                alert('Silakan setujui Syarat & Ketentuan dan Kebijakan Privasi sebelum mendaftar.');
            }
            return;
        }

        // Prevent default form submission (all validations passed)
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const userData = {
            name: formData.get('name'),
            email: formData.get('email'),
            password: formData.get('password'),
            golongan_pln: formData.get('golongan_pln')
        };

        try {
            const loadingBtn = e.target.querySelector('button[type="submit"]');
            const originalText = loadingBtn.textContent;
            loadingBtn.innerHTML = '<i class="ri-loader-4-line spin"></i> Mendaftar...';
            loadingBtn.disabled = true;

            const result = await this.api.register(userData);
            
            this.api.setToken(result.token);
            this.currentUser = result.user;
            
            // Save user data to localStorage for consistency
            localStorage.setItem('watt_e_user', JSON.stringify(result.user));
            
            this.showNotification('Pendaftaran berhasil!', 'success');
            
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);

        } catch (error) {
            this.showNotification(error.message || 'Pendaftaran gagal', 'error');
        } finally {
            const loadingBtn = e.target.querySelector('button[type="submit"]');
            if (loadingBtn) {
                loadingBtn.textContent = 'Daftar Sekarang';
                loadingBtn.disabled = false;
            }
        }
    }

    handleLogout() {
        // use styled confirm modal
        showConfirm({
            title: 'Logout',
            message: 'Apakah Anda yakin ingin logout?',
            confirmText: 'Logout',
            cancelText: 'Batal'
        }).then((confirmed) => {
            if (!confirmed) return;
            this.api.removeToken();
            localStorage.removeItem('watt_e_user');
            this.currentUser = null;
            this.showNotification('Logout berhasil', 'success');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 900);
        });
    }

    async loadUserData() {
        const token = this.api.token;
        const savedUser = localStorage.getItem('watt_e_user');
        
        if (token && savedUser) {
            try {
                // Verify token is still valid by making API call
                const result = await this.api.getCurrentUser();
                this.currentUser = result.user;
                localStorage.setItem('watt_e_user', JSON.stringify(result.user));
            } catch (error) {
                // Token might be expired, clear everything
                this.api.removeToken();
                localStorage.removeItem('watt_e_user');
                this.currentUser = null;
            }
        } else if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
        }
        
        // Update UI based on auth status
        this.updateUI();
    }

    checkAuthStatus() {
        const token = this.api.token;
        const currentPage = window.location.pathname.split('/').pop();
        
        const authPages = ['login.html', 'register.html'];
        const protectedPages = ['dashboard.html', 'profile.html', 'predict.html'];

        if (token && authPages.includes(currentPage)) {
            // If logged in and trying to access auth pages, redirect to dashboard
            window.location.href = 'dashboard.html';
        } else if (!token && protectedPages.includes(currentPage)) {
            // If not logged in and trying to access protected pages, redirect to login
            window.location.href = 'login.html';
        }
    }

    updateUI() {
        this.updateNavbar();
        this.updateProtectedContent();
    }

    updateNavbar() {
        const navMenu = document.getElementById('navMenu');
        if (!navMenu) return;

        if (this.isLoggedIn()) {
            this.showAuthenticatedNavbar(navMenu);
        } else {
            this.showPublicNavbar(navMenu);
        }
    }

    showAuthenticatedNavbar(navMenu) {
        // Add authenticated class to reduce gap
        navMenu.classList.add('authenticated');

        // Hide auth links
        const authLinks = navMenu.querySelectorAll('a[href="login.html"], a[href="register.html"]');
        authLinks.forEach(link => link.style.display = 'none');

        // Show protected links (except profile - we'll use user menu instead)
        const dashboardLink = navMenu.querySelector('a[href="dashboard.html"]');
        const predictLink = navMenu.querySelector('a[href="predict.html"]');
        const profileLink = navMenu.querySelector('a[href="profile.html"]');
        
        if (dashboardLink) dashboardLink.style.display = 'flex';
        if (predictLink) predictLink.style.display = 'flex';
        // Hide profile link - user menu will handle navigation
        if (profileLink) profileLink.style.display = 'none';

        // Update or create user menu as clickable link
        let userMenu = navMenu.querySelector('.user-menu');
        if (!userMenu) {
            userMenu = document.createElement('a');
            userMenu.className = 'user-menu';
            userMenu.href = 'profile.html';
            navMenu.appendChild(userMenu);
        } else {
            // Convert existing div to anchor if needed
            if (userMenu.tagName !== 'A') {
                const newUserMenu = document.createElement('a');
                newUserMenu.className = 'user-menu';
                newUserMenu.href = 'profile.html';
                newUserMenu.innerHTML = userMenu.innerHTML;
                userMenu.replaceWith(newUserMenu);
                userMenu = newUserMenu;
            } else {
                userMenu.href = 'profile.html';
            }
        }

        const userName = this.currentUser?.name?.split(' ')[0] || 'User';
        userMenu.innerHTML = `
            <div class="user-avatar">
                <i class="ri-user-line"></i>
            </div>
            <span>${userName}</span>
        `;

        // Add active class if on profile page
        const currentPage = window.location.pathname.split('/').pop();
        if (currentPage === 'profile.html') {
            userMenu.classList.add('active');
        } else {
            userMenu.classList.remove('active');
        }
    }

    showPublicNavbar(navMenu) {
        // Remove authenticated class
        navMenu.classList.remove('authenticated');

        // Show auth links
        const authLinks = navMenu.querySelectorAll('a[href="login.html"], a[href="register.html"]');
        authLinks.forEach(link => link.style.display = 'flex');

        // Hide protected links
        const protectedLinks = navMenu.querySelectorAll('a[href="dashboard.html"], a[href="predict.html"], a[href="profile.html"]');
        protectedLinks.forEach(link => link.style.display = 'none');

        // Remove user menu
        const userMenu = navMenu.querySelector('.user-menu');
        if (userMenu) {
            userMenu.remove();
        }
    }

    updateProtectedContent() {
        // Update content that should only be visible to logged in users
        const protectedElements = document.querySelectorAll('[data-auth-only]');
        protectedElements.forEach(element => {
            if (this.isLoggedIn()) {
                element.style.display = element.dataset.authDisplay || 'block';
            } else {
                element.style.display = 'none';
            }
        });

        // Update content that should only be visible to public users
        const publicElements = document.querySelectorAll('[data-public-only]');
        publicElements.forEach(element => {
            if (!this.isLoggedIn()) {
                element.style.display = element.dataset.publicDisplay || 'block';
            } else {
                element.style.display = 'none';
            }
        });
    }

    isLoggedIn() {
        return !!(this.api.token && this.currentUser);
    }

    getCurrentUser() {
        return this.currentUser;
    }

    showNotification(message, type = 'info') {
        // Remove existing notifications
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="ri-${type === 'success' ? 'check' : type === 'error' ? 'close' : 'information'}-line"></i>
                <span>${message}</span>
            </div>
        `;

        // Add notification styles if not exists
        if (!document.querySelector('#notification-styles')) {
            const styles = document.createElement('style');
            styles.id = 'notification-styles';
            styles.textContent = `
                .notification {
                    position: fixed;
                    top: 100px;
                    right: 20px;
                    background: white;
                    padding: 1rem 1.5rem;
                    border-radius: 12px;
                    box-shadow: 0 10px 25px rgba(0,0,0,0.15);
                    border-left: 4px solid #1e90ff;
                    z-index: 10000;
                    animation: slideIn 0.3s ease;
                }
                .notification-success { border-left-color: #00cc66; }
                .notification-error { border-left-color: #ff4444; }
                .notification-warning { border-left-color: #ffaa00; }
                .notification-content {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }
                .spin {
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(styles);
        }

        document.body.appendChild(notification);

        // Auto remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Quick navbar update function - runs immediately to prevent flash
function quickNavbarUpdate() {
    const navMenu = document.getElementById('navMenu');
    if (!navMenu) return;

    const token = localStorage.getItem('watt_e_token');
    const savedUser = localStorage.getItem('watt_e_user');
    const isLoggedIn = !!(token && savedUser);

    if (isLoggedIn) {
        // Add authenticated class
        navMenu.classList.add('authenticated');
        
        // Hide auth links
        const authLinks = navMenu.querySelectorAll('a[href="login.html"], a[href="register.html"]');
        authLinks.forEach(link => link.style.display = 'none');

        // Show protected links (except profile)
        const dashboardLink = navMenu.querySelector('a[href="dashboard.html"]');
        const predictLink = navMenu.querySelector('a[href="predict.html"]');
        const profileLink = navMenu.querySelector('a[href="profile.html"]');
        
        if (dashboardLink) dashboardLink.style.display = 'flex';
        if (predictLink) predictLink.style.display = 'flex';
        if (profileLink) profileLink.style.display = 'none';

        // Create or update user menu
        let userMenu = navMenu.querySelector('.user-menu');
        if (!userMenu) {
            userMenu = document.createElement('a');
            userMenu.className = 'user-menu';
            userMenu.href = 'profile.html';
            navMenu.appendChild(userMenu);
        } else if (userMenu.tagName !== 'A') {
            const newUserMenu = document.createElement('a');
            newUserMenu.className = 'user-menu';
            newUserMenu.href = 'profile.html';
            newUserMenu.innerHTML = userMenu.innerHTML;
            userMenu.replaceWith(newUserMenu);
            userMenu = newUserMenu;
        } else {
            userMenu.href = 'profile.html';
        }

        try {
            const user = JSON.parse(savedUser);
            const userName = user?.name?.split(' ')[0] || 'User';
            userMenu.innerHTML = `
                <div class="user-avatar">
                    <i class="ri-user-line"></i>
                </div>
                <span>${userName}</span>
            `;

            // Add active class if on profile page
            const currentPage = window.location.pathname.split('/').pop();
            if (currentPage === 'profile.html') {
                userMenu.classList.add('active');
            }
        } catch (e) {
            // If parsing fails, use default
            userMenu.innerHTML = `
                <div class="user-avatar">
                    <i class="ri-user-line"></i>
                </div>
                <span>User</span>
            `;
        }
    } else {
        // Remove authenticated class
        navMenu.classList.remove('authenticated');
        
        // Show auth links
        const authLinks = navMenu.querySelectorAll('a[href="login.html"], a[href="register.html"]');
        authLinks.forEach(link => link.style.display = 'flex');

        // Hide protected links
        const protectedLinks = navMenu.querySelectorAll('a[href="dashboard.html"], a[href="predict.html"], a[href="profile.html"]');
        protectedLinks.forEach(link => link.style.display = 'none');

        // Remove user menu
        const userMenu = navMenu.querySelector('.user-menu');
        if (userMenu) {
            userMenu.remove();
        }
    }
}

// Run immediately if DOM is already loaded, otherwise wait
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', quickNavbarUpdate);
} else {
    quickNavbarUpdate();
}

// Initialize auth manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.authManager = new AuthManager();
});