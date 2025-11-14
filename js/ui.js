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

// Global scroll progress bar initializer (applies to most pages)
function initGlobalScrollProgress() {
    // avoid duplicate progress bars
    if (document.getElementById('globalProgressBar')) return;

    const progressBar = document.createElement('div');
    progressBar.id = 'globalProgressBar';
    progressBar.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        height: 3px;
        background: linear-gradient(90deg, #1e90ff, #00c3ff);
        width: 0%;
        z-index: 10000;
        transition: width 0.12s linear;
    `;
    document.body.appendChild(progressBar);

    function update() {
        const doc = document.documentElement;
        const windowHeight = doc.scrollHeight - doc.clientHeight;
        const scrolled = windowHeight > 0 ? (window.scrollY / windowHeight) * 100 : 0;
        progressBar.style.width = scrolled + '%';
    }

    window.addEventListener('scroll', update, { passive: true });
    // update on load/resize to set initial state
    window.addEventListener('resize', update);
    update();
}

// Apply the global progress bar on all pages except login/register
document.addEventListener('DOMContentLoaded', () => {
    const page = window.location.pathname.split('/').pop() || 'index.html';
    if (page !== 'login.html' && page !== 'register.html') {
        try {
            initGlobalScrollProgress();
        } catch (e) {
            console.error('Failed to initialize global scroll progress', e);
        }
    }
});

// Cursor follower: creates a small dot + soft halo that follows the pointer smoothly
function initCursorFollower() {
    // Disable on touch devices or if already initialized
    if (typeof window === 'undefined') return;
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) return;
    if (document.getElementById('cursorDot')) return;

    const dot = document.createElement('div');
    dot.id = 'cursorDot';
    dot.className = 'cursor-dot';

    const halo = document.createElement('div');
    halo.id = 'cursorHalo';
    halo.className = 'cursor-follower';

    document.body.appendChild(halo);
    document.body.appendChild(dot);

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let posX = mouseX;
    let posY = mouseY;

    const ease = 0.18;

    function onMove(e) {
        mouseX = e.clientX;
        mouseY = e.clientY;
        dot.style.opacity = '1';
        halo.style.opacity = '1';
    }

    function update() {
        posX += (mouseX - posX) * ease;
        posY += (mouseY - posY) * ease;

        dot.style.transform = `translate(${posX}px, ${posY}px) translate(-50%, -50%)`;
        halo.style.transform = `translate(${posX}px, ${posY}px) translate(-50%, -50%)`;
        requestAnimationFrame(update);
    }

    // Interactive element hover states
    function addHoverListeners() {
        const selectors = ['a', 'button', '.btn', 'input', 'textarea', 'select', '.nav-link', '.feature-card'];
        const elems = document.querySelectorAll(selectors.join(','));
        elems.forEach(el => {
            el.addEventListener('mouseenter', () => {
                document.documentElement.classList.add('cursor-hover');
            });
            el.addEventListener('mouseleave', () => {
                document.documentElement.classList.remove('cursor-hover');
            });
        });
    }

    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('touchstart', () => {
        // remove follower on first touch to avoid stuck visuals
        dot.remove();
        halo.remove();
    }, { passive: true });

    // Click / pointer press animation: briefly add a class to trigger CSS animation
    let clickTimeout = null;
    function onPointerDown(e) {
        try {
            // make minimal checks in case elements were removed
            if (!dot || !halo) return;
            document.documentElement.classList.add('cursor-click');
            dot.classList.add('cursor-clicked');
            halo.classList.add('cursor-clicked');

            // create ripple at pointer location for extra visual feedback
            try {
                const ripple = document.createElement('div');
                ripple.className = 'cursor-ripple';
                // position it at the pointer
                const x = (e.touches && e.touches[0]) ? e.touches[0].clientX : e.clientX;
                const y = (e.touches && e.touches[0]) ? e.touches[0].clientY : e.clientY;
                ripple.style.left = x + 'px';
                ripple.style.top = y + 'px';

                // stronger ripple for interactive targets
                if (e.target && e.target.closest && e.target.closest('a, button, .btn, .feature-card, .nav-link')) {
                    ripple.classList.add('ripple-strong');
                }

                document.body.appendChild(ripple);
                // force reflow then animate
                // eslint-disable-next-line no-unused-expressions
                ripple.offsetWidth;
                ripple.classList.add('animate');

                setTimeout(() => {
                    ripple.remove();
                }, 520);
            } catch (rErr) {
                // ignore ripple errors
                console.warn('ripple creation failed', rErr);
            }

            if (clickTimeout) clearTimeout(clickTimeout);
            clickTimeout = setTimeout(() => {
                document.documentElement.classList.remove('cursor-click');
                if (dot) dot.classList.remove('cursor-clicked');
                if (halo) halo.classList.remove('cursor-clicked');
                clickTimeout = null;
            }, 360);
        } catch (err) {
            // swallow errors to avoid breaking page
            console.error('cursor click handler error', err);
        }
    }

    function onPointerUp() {
        if (clickTimeout) {
            clearTimeout(clickTimeout);
            clickTimeout = null;
        }
        document.documentElement.classList.remove('cursor-click');
        if (dot) dot.classList.remove('cursor-clicked');
        if (halo) halo.classList.remove('cursor-clicked');
    }

    window.addEventListener('pointerdown', onPointerDown, { passive: true });
    window.addEventListener('pointerup', onPointerUp, { passive: true });

    addHoverListeners();
    update();
}

// Initialize cursor follower on pages where it makes sense
document.addEventListener('DOMContentLoaded', () => {
    try {
        initCursorFollower();
    } catch (e) {
        console.error('Failed to initialize cursor follower', e);
    }
});