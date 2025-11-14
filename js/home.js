// ========================================
// HOME PAGE ANIMATIONS & INTERACTIONS
// ========================================

class HomeAnimations {
    constructor() {
        this.init();
    }

    init() {
        this.setupIntersectionObserver();
        this.animateStats();
        this.setupSVGGradient();
        this.setupParallax();
        this.handleAuthButtons();
    }

    // Intersection Observer for scroll animations
    setupIntersectionObserver() {
        const options = {
            root: null,
            rootMargin: '0px',
            threshold: 0.1
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                }
            });
        }, options);

        // Observe feature cards
        const featureCards = document.querySelectorAll('.feature-card');
        featureCards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(30px)';
            card.style.transition = `all 0.6s ease ${index * 0.1}s`;
            observer.observe(card);
        });

        // Observe stat boxes
        const statBoxes = document.querySelectorAll('.stat-box');
        statBoxes.forEach((box, index) => {
            box.style.opacity = '0';
            box.style.transform = 'translateY(30px)';
            box.style.transition = `all 0.6s ease ${index * 0.1}s`;
            observer.observe(box);
        });

        // Animate in class
        const style = document.createElement('style');
        style.textContent = `
            .animate-in {
                opacity: 1 !important;
                transform: translateY(0) !important;
            }
        `;
        document.head.appendChild(style);
    }

    // Animate statistics counter
    animateStats() {
        const statNumbers = document.querySelectorAll('.stat-number');
        
        const animateValue = (element, start, end, duration) => {
            const range = end - start;
            const increment = range / (duration / 16); // 60fps
            let current = start;
            
            const timer = setInterval(() => {
                current += increment;
                if (current >= end) {
                    current = end;
                    clearInterval(timer);
                }
                
                const value = Math.floor(current);
                const target = element.dataset.target;
                
                // Format based on the target value
                if (target.includes('.')) {
                    element.textContent = current.toFixed(1);
                } else if (target >= 90 && target <= 100) {
                    element.textContent = value + '%';
                } else if (target <= 30) {
                    element.textContent = value + '%';
                } else if (target <= 48) {
                    element.textContent = value + 'h';
                } else {
                    element.textContent = value + '+';
                }
            }, 16);
        };

        // Intersection Observer for stats
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const target = parseInt(entry.target.dataset.target);
                    animateValue(entry.target, 0, target, 2000);
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });

        statNumbers.forEach(stat => observer.observe(stat));
    }

    // Setup SVG gradient for circle progress
    setupSVGGradient() {
        const svg = document.querySelector('.circle-progress svg');
        if (!svg) return;

        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
        gradient.setAttribute('id', 'gradient');
        gradient.setAttribute('x1', '0%');
        gradient.setAttribute('y1', '0%');
        gradient.setAttribute('x2', '100%');
        gradient.setAttribute('y2', '100%');

        const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        stop1.setAttribute('offset', '0%');
        stop1.setAttribute('stop-color', '#1e90ff');

        const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        stop2.setAttribute('offset', '100%');
        stop2.setAttribute('stop-color', '#00c3ff');

        gradient.appendChild(stop1);
        gradient.appendChild(stop2);
        defs.appendChild(gradient);
        svg.insertBefore(defs, svg.firstChild);
    }

    // Parallax effect on mouse move
    setupParallax() {
        const hero = document.querySelector('.hero');
        const dashboardCards = document.querySelectorAll('.dashboard-card');
        const energyCircle = document.querySelector('.energy-circle');
        
        if (!hero) return;

        hero.addEventListener('mousemove', (e) => {
            const { clientX, clientY } = e;
            const { innerWidth, innerHeight } = window;
            
            const xPos = (clientX / innerWidth - 0.5) * 2;
            const yPos = (clientY / innerHeight - 0.5) * 2;

            // Move cards
            dashboardCards.forEach((card, index) => {
                const speed = (index + 1) * 5;
                const x = xPos * speed;
                const y = yPos * speed;
                card.style.transform = `translate(${x}px, ${y}px)`;
            });

            // Parallax move for energy circle (no continuous rotation)
            if (energyCircle) {
                const moveX = xPos * 8; // subtle horizontal movement
                const moveY = yPos * 6; // subtle vertical movement
                energyCircle.style.transform = `translate(${moveX}px, ${moveY}px)`;
            }
        });

        // Reset on mouse leave
        hero.addEventListener('mouseleave', () => {
            dashboardCards.forEach(card => {
                card.style.transform = 'translate(0, 0)';
            });
            if (energyCircle) {
                energyCircle.style.transform = 'none';
            }
        });
    }

    // Handle auth buttons visibility
    handleAuthButtons() {
        const token = localStorage.getItem('watt_e_token');
        const isLoggedIn = !!token;

        const publicButtons = document.querySelectorAll('[data-public-only]');
        const authButtons = document.querySelectorAll('[data-auth-only]');

        if (isLoggedIn) {
            publicButtons.forEach(btn => btn.style.display = 'none');
            authButtons.forEach(btn => btn.style.display = 'inline-flex');
        } else {
            publicButtons.forEach(btn => btn.style.display = 'inline-flex');
            authButtons.forEach(btn => btn.style.display = 'none');
        }
    }
}

// ========================================
// SMOOTH SCROLL
// ========================================

function setupSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// ========================================
// FEATURE CARD HOVER EFFECT
// ========================================

function setupFeatureCardEffects() {
    const featureCards = document.querySelectorAll('.feature-card');
    
    featureCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });
}

// ========================================
// SCROLL PROGRESS INDICATOR
// ========================================

function setupScrollProgress() {
    const progressBar = document.createElement('div');
    progressBar.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        height: 3px;
        background: linear-gradient(90deg, #1e90ff, #00c3ff);
        width: 0%;
        z-index: 10000;
        transition: width 0.1s ease;
    `;
    document.body.appendChild(progressBar);

    window.addEventListener('scroll', () => {
        const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = (window.scrollY / windowHeight) * 100;
        progressBar.style.width = scrolled + '%';
    });
}

// ========================================
// DASHBOARD CARDS ANIMATION
// ========================================

function animateDashboardCards() {
    const cards = document.querySelectorAll('.dashboard-card');
    
    cards.forEach((card, index) => {
        setTimeout(() => {
            card.style.opacity = '0';
            card.style.transform = 'scale(0.8) translateY(20px)';
            
            requestAnimationFrame(() => {
                card.style.transition = 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)';
                card.style.opacity = '1';
                card.style.transform = 'scale(1) translateY(0)';
            });
        }, index * 150);
    });
}

// ========================================
// TYPED EFFECT FOR HERO TITLE
// ========================================

function setupTypedEffect() {
    const gradientText = document.querySelector('.gradient-text');
    if (!gradientText) return;

    const text = gradientText.textContent;
    gradientText.textContent = '';
    gradientText.style.display = 'inline-block';
    
    let index = 0;
    const typeSpeed = 100;

    function type() {
        if (index < text.length) {
            gradientText.textContent += text.charAt(index);
            index++;
            setTimeout(type, typeSpeed);
        }
    }

    // Start typing after a short delay
    setTimeout(type, 500);
}

// ========================================
// ENERGY CIRCLE BEHAVIOR (no continuous rotation)
// — percent will slowly and randomly increase between 75% and 90%
// ========================================
function setupEnergyCircleBehavior() {
    // easing
    function easeOutQuad(t){ return t*(2-t); }

    const circleFill = document.querySelector('.circle-fill');
    const circleValueEl = document.querySelector('.circle-value');
    if (!circleFill || !circleValueEl) return;

    // attempt to read r from the circle element; fallback to 90
    const rAttr = circleFill.getAttribute('r') || circleFill.getAttribute('data-r');
    const r = Number(rAttr) || 90;
    const circumference = 2 * Math.PI * r;

    // ensure stroke-dasharray matches circumference
    circleFill.style.strokeDasharray = String(circumference);

    // read initial pct from DOM (e.g., "78%")
    const parsedInitial = parseFloat(String(circleValueEl.textContent).replace('%',''));
    let currentPct = Number.isFinite(parsedInitial) ? parsedInitial : (75 + Math.random() * 15);
    // enforce range 75-90 for the interactive display
    currentPct = Math.max(75, Math.min(90, currentPct));

    // set immediate offset without animation
    function setOffset(p){
        const offset = circumference * (1 - (p/100));
        circleFill.style.transition = 'none';
        circleFill.style.strokeDashoffset = String(offset);
        circleValueEl.textContent = `${Math.round(p)}%`;
    }
    setOffset(currentPct);

    function animateTo(target, duration = 1600){
        target = Math.max(0, Math.min(100, target));
        const start = currentPct;
        const startTime = performance.now();
        circleFill.style.transition = `stroke-dashoffset ${duration}ms ease-out`;

        function frame(now){
            const t = Math.min(1, (now - startTime) / duration);
            const eased = easeOutQuad(t);
            const value = start + (target - start) * eased;
            const offset = circumference * (1 - (value/100));
            circleFill.style.strokeDashoffset = String(offset);
            circleValueEl.textContent = `${Math.round(value)}%`;
            if (t < 1) requestAnimationFrame(frame);
            else currentPct = target;
        }
        requestAnimationFrame(frame);
    }

    // schedule random fluctuations between 75% and 90% (can go up or down)
    function scheduleNext(){
        // much faster updates: 1s - 3.5s
        const delay = 1000 + Math.random() * 2500;
        setTimeout(() => {
            // pick a random target within [75,90]
            const min = 75;
            const max = 90;
            const target = Math.round((min + Math.random() * (max - min)) * 10) / 10;
            // animate faster: 300-900ms
            const dur = 300 + Math.random() * 600;
            animateTo(target, dur);
            scheduleNext();
        }, delay);
    }

    // small initial nudge
    if (Math.random() < 0.7) {
        animateTo(Math.min(90, currentPct + Math.random()*2), 900);
    }
    scheduleNext();
}

// ========================================
// INITIALIZE EVERYTHING
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    // Initialize main animations class
    new HomeAnimations();
    
    // Setup other features
    setupSmoothScroll();
    setupFeatureCardEffects();
    setupScrollProgress();
    animateDashboardCards();
    // energy circle behavior (no continuous rotation)
    setupEnergyCircleBehavior();
    
    // Optional: Uncomment if you want typing effect
    // setupTypedEffect();
});

// ========================================
// EASTER EGG: Konami Code
// ========================================

let konamiCode = [];
const konamiSequence = [38, 38, 40, 40, 37, 39, 37, 39, 66, 65]; // ↑↑↓↓←→←→BA

document.addEventListener('keydown', (e) => {
    konamiCode.push(e.keyCode);
    konamiCode = konamiCode.slice(-10);
    
    if (konamiCode.join(',') === konamiSequence.join(',')) {
        // Easter egg triggered!
        document.body.style.animation = 'rainbow 2s linear infinite';
        
        const style = document.createElement('style');
        style.textContent = `
            @keyframes rainbow {
                0% { filter: hue-rotate(0deg); }
                100% { filter: hue-rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
        
        setTimeout(() => {
            document.body.style.animation = '';
        }, 5000);
        
        console.log('🎉 Easter egg found! You unlocked rainbow mode!');
    }
});

// ========================================
// PERFORMANCE: Reduce animations on low-end devices
// ========================================

if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.querySelectorAll('*').forEach(el => {
        el.style.animation = 'none !important';
        el.style.transition = 'none !important';
    });
}

// ========================================
// EXPORT FOR CONSOLE DEBUGGING
// ========================================

window.homeAnimations = {
    version: '1.0.0',
    features: ['Intersection Observer', 'Parallax', 'Stats Counter', 'Smooth Scroll'],
    debug: () => console.log('Home animations loaded successfully!')
};