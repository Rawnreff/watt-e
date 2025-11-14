class UIManager {
    constructor() {
        this.initNavigation();
        this.initMobileMenu();
        this.initScrollEffects();
        this.updateNavbarAuth();
    }

    initNavigation() {
        // Highlight current page in navigation
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        const navLinks = document.querySelectorAll('.nav-link');
        
        navLinks.forEach(link => {
            const linkPage = link.getAttribute('href');
            if (linkPage === currentPage) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });

        // Update navigation based on auth status
        this.updateNavbarAuth();
    }

    initMobileMenu() {
        const navToggle = document.getElementById('navToggle');
        const navMenu = document.getElementById('navMenu');

        if (navToggle && navMenu) {
            navToggle.addEventListener('click', () => {
                navMenu.classList.toggle('active');
                navToggle.innerHTML = navMenu.classList.contains('active') 
                    ? '<i class="ri-close-line"></i>' 
                    : '<i class="ri-menu-line"></i>';
            });

            // Close mobile menu when clicking on a link
            const navLinks = navMenu.querySelectorAll('.nav-link');
            navLinks.forEach(link => {
                link.addEventListener('click', () => {
                    navMenu.classList.remove('active');
                    navToggle.innerHTML = '<i class="ri-menu-line"></i>';
                });
            });

            // Close mobile menu when clicking outside
            document.addEventListener('click', (e) => {
                if (!navMenu.contains(e.target) && !navToggle.contains(e.target)) {
                    navMenu.classList.remove('active');
                    navToggle.innerHTML = '<i class="ri-menu-line"></i>';
                }
            });
        }
    }

    initScrollEffects() {
        // Navbar scroll effect
        let lastScrollY = window.scrollY;
        const navbar = document.querySelector('.navbar');

        window.addEventListener('scroll', () => {
            if (window.scrollY > 100) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }

            // Hide/show navbar on scroll
            if (window.scrollY > lastScrollY && window.scrollY > 100) {
                navbar.style.transform = 'translateY(-100%)';
            } else {
                navbar.style.transform = 'translateY(0)';
            }

            lastScrollY = window.scrollY;
        });

        // Fade in elements on scroll
        this.initScrollAnimations();
    }

    initScrollAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, observerOptions);

        // Observe elements with fade-in class
        const fadeElements = document.querySelectorAll('.feature-card, .stat-card, .history-item');
        fadeElements.forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(20px)';
            el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(el);
        });
    }

    updateNavbarAuth() {
        const token = localStorage.getItem('watt_e_token');
        const navMenu = document.getElementById('navMenu');
        
        if (!navMenu) return;

        if (token) {
            // User is logged in - Show user menu, hide auth links
            this.showUserMenu();
        } else {
            // User is not logged in - Show auth links, hide user menu
            this.showAuthLinks();
        }
    }

    showUserMenu() {
        const navMenu = document.getElementById('navMenu');
        if (!navMenu) return;

        // Hide auth links
        const authLinks = navMenu.querySelectorAll('a[href="login.html"], a[href="register.html"]');
        authLinks.forEach(link => link.style.display = 'none');

        // Show user menu if not exists
        let userMenu = navMenu.querySelector('.user-menu');
        if (!userMenu) {
            userMenu = document.createElement('div');
            userMenu.className = 'user-menu';
            userMenu.innerHTML = `
                <div class="user-avatar" id="navUserAvatar">
                    <i class="ri-user-line"></i>
                </div>
                <span id="navUserName">User</span>
            `;
            navMenu.appendChild(userMenu);
        }

        // Load user data for navbar
        this.loadUserDataForNavbar();
    }

    showAuthLinks() {
        const navMenu = document.getElementById('navMenu');
        if (!navMenu) return;

        // Show auth links
        const authLinks = navMenu.querySelectorAll('a[href="login.html"], a[href="register.html"]');
        authLinks.forEach(link => link.style.display = 'flex');

        // Remove user menu if exists
        const userMenu = navMenu.querySelector('.user-menu');
        if (userMenu) {
            userMenu.remove();
        }

        // Hide protected pages from non-logged in users
        const protectedLinks = navMenu.querySelectorAll('a[href="dashboard.html"], a[href="predict.html"], a[href="profile.html"]');
        protectedLinks.forEach(link => link.style.display = 'none');
    }

    async loadUserDataForNavbar() {
        try {
            const token = localStorage.getItem('watt_e_token');
            if (!token) return;

            const api = window.apiClient || new ApiClient();
            const result = await api.getCurrentUser();
            const user = result.user;

            // Update navbar user info
            const userNameElement = document.getElementById('navUserName');
            const userAvatarElement = document.getElementById('navUserAvatar');

            if (userNameElement && user.name) {
                const firstName = user.name.split(' ')[0];
                userNameElement.textContent = firstName;
            }

            if (userAvatarElement) {
                // You can add user avatar logic here
                userAvatarElement.innerHTML = `<i class="ri-user-line"></i>`;
            }

        } catch (error) {
            console.error('Failed to load user data for navbar:', error);
        }
    }

    // Utility function to format numbers
    static formatNumber(num) {
        return new Intl.NumberFormat('id-ID').format(num);
    }

    // Utility function to format currency
    static formatCurrency(amount) {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    }
}

// Initialize UI manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.uiManager = new UIManager();
});