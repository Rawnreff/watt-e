// ========================================
// ABOUT PAGE ANIMATIONS
// ========================================

// Animate statistics counter (same as home.js)
function animateStats() {
    const statNumbers = document.querySelectorAll('.stat-number');
    
    if (statNumbers.length === 0) return;
    
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

// Animate stat cards appearing from bottom sequentially
function setupStatCardAnimation() {
    const statCards = document.querySelectorAll('.stat-card');
    
    if (statCards.length === 0) return;
    
    // Add CSS for animate-in class
    const style = document.createElement('style');
    style.textContent = `
        .stat-card.animate-in {
            opacity: 1 !important;
            transform: translateY(0) !important;
        }
    `;
    document.head.appendChild(style);
    
    // Set initial state for all stat cards
    statCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(50px)';
        card.style.transition = `all 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) ${index * 0.15}s`;
    });
    
    // Intersection Observer to trigger animation
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
                observer.unobserve(entry.target);
            }
        });
    }, { 
        root: null,
        rootMargin: '0px',
        threshold: 0.2
    });
    
    // Observe each stat card
    statCards.forEach(card => observer.observe(card));
}

// Animate overview section with interactive effects
function setupOverviewAnimations() {
    const overviewSection = document.querySelector('.overview-section');
    if (!overviewSection) return;

    // Set initial state for all animated elements
    const title = overviewSection.querySelector('.overview-text h2');
    const description = overviewSection.querySelector('.overview-description');
    const features = overviewSection.querySelectorAll('.overview-feature');
    const visualCards = overviewSection.querySelectorAll('.visual-card');

    // Set initial opacity to 0
    if (title) title.style.opacity = '0';
    if (description) description.style.opacity = '0';
    features.forEach(feature => feature.style.opacity = '0');
    visualCards.forEach(card => card.style.opacity = '0');

    // Add CSS animations
    const style = document.createElement('style');
    style.textContent = `
        .overview-section {
            position: relative;
            overflow: hidden;
        }

        .overview-text h2.animate-in {
            animation: fadeInUp 0.8s ease forwards;
        }

        .overview-description.animate-in {
            animation: fadeInUp 0.8s ease 0.2s forwards;
        }

        .overview-feature.animate-in {
            animation: fadeInLeft 0.8s ease forwards;
        }

        .visual-card.animate-in {
            animation: fadeInRight 0.8s ease forwards;
        }

        .visual-card.highlight.animate-in {
            animation: fadeInRight 0.8s ease forwards, pulse 2s ease-in-out 0.8s infinite;
        }

        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        @keyframes fadeInLeft {
            from {
                opacity: 0;
                transform: translateX(-30px);
            }
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }

        @keyframes fadeInRight {
            from {
                opacity: 0;
                transform: translateX(30px);
            }
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }

        @keyframes float {
            0%, 100% {
                transform: translateY(0px);
            }
            50% {
                transform: translateY(-10px);
            }
        }

        @keyframes pulse {
            0%, 100% {
                box-shadow: 0 10px 30px rgba(30, 144, 255, 0.3);
            }
            50% {
                box-shadow: 0 15px 40px rgba(30, 144, 255, 0.5);
            }
        }

        @keyframes pulseShadow {
            0%, 100% {
                box-shadow: 0 10px 30px rgba(30, 144, 255, 0.3);
            }
            50% {
                box-shadow: 0 15px 40px rgba(30, 144, 255, 0.5);
            }
        }

        .overview-feature .feature-icon {
            animation: float 3s ease-in-out infinite;
        }

        .overview-feature:nth-child(1) .feature-icon {
            animation-delay: 0s;
        }

        .overview-feature:nth-child(2) .feature-icon {
            animation-delay: 0.5s;
        }

        .overview-feature:nth-child(3) .feature-icon {
            animation-delay: 1s;
        }

        .visual-card.highlight.animate-in {
            animation: fadeInRight 0.8s ease forwards;
            opacity: 1 !important;
        }

        .visual-card.highlight.pulse-active {
            animation: fadeInRight 0.8s ease forwards, pulseShadow 2s ease-in-out infinite;
        }

        .visual-icon {
            transition: transform 0.3s ease;
        }

        .visual-card:hover .visual-icon {
            transform: scale(1.1) rotate(5deg);
        }

        .overview-feature:hover .feature-icon {
            transform: scale(1.1) rotate(-5deg);
        }
    `;
    document.head.appendChild(style);

    // Function to trigger animations
    function triggerAnimations() {
        // Animate title
        if (title) {
            setTimeout(() => title.classList.add('animate-in'), 100);
        }

        // Animate description
        if (description) {
            setTimeout(() => description.classList.add('animate-in'), 300);
        }

        // Animate features with stagger
        features.forEach((feature, index) => {
            setTimeout(() => {
                feature.classList.add('animate-in');
            }, 500 + (index * 200));
        });

        // Animate visual cards with stagger
        visualCards.forEach((card, index) => {
            setTimeout(() => {
                card.classList.add('animate-in');
                // Add pulse animation to highlight card after fadeInRight completes
                if (card.classList.contains('highlight')) {
                    setTimeout(() => {
                        card.classList.add('pulse-active');
                    }, 1000); // After fadeInRight animation completes (0.8s) + small delay for smooth transition
                }
            }, 600 + (index * 200));
        });
    }

    // Check if section is already visible on load
    const checkInitialVisibility = () => {
        const rect = overviewSection.getBoundingClientRect();
        const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
        return isVisible;
    };

    // Intersection Observer for overview section
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                triggerAnimations();
                observer.unobserve(overviewSection);
            }
        });
    }, { 
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    });

    // Use requestAnimationFrame to ensure DOM is fully rendered
    requestAnimationFrame(() => {
        // Check initial visibility and trigger if needed
        const isVisible = checkInitialVisibility();
        if (isVisible) {
            // Section is already visible, trigger animations immediately
            setTimeout(triggerAnimations, 200);
        } else {
            // Section not visible yet, use Intersection Observer
            observer.observe(overviewSection);
            
            // Fallback: if observer doesn't trigger after 2 seconds, check again
            setTimeout(() => {
                if (checkInitialVisibility()) {
                    triggerAnimations();
                    observer.unobserve(overviewSection);
                }
            }, 2000);
        }
    });

    // Add interactive hover effects with ripple
    setupRippleEffects();
    
    // Add parallax effect on mouse move
    setupParallaxEffect();
    
    // Add number counting animation for visual cards
    setupVisualCardNumbers();
}

// Add ripple effect on click/hover
function setupRippleEffects() {
    const visualCards = document.querySelectorAll('.visual-card');
    const featureIcons = document.querySelectorAll('.overview-feature .feature-icon');

    visualCards.forEach(card => {
        card.addEventListener('mouseenter', function(e) {
            createRipple(e, this);
        });
    });

    featureIcons.forEach(icon => {
        icon.addEventListener('mouseenter', function(e) {
            createRipple(e, this);
        });
    });
}

function createRipple(e, element) {
    const ripple = document.createElement('span');
    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    ripple.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        background: rgba(30, 144, 255, 0.3);
        left: ${x}px;
        top: ${y}px;
        transform: scale(0);
        animation: ripple 0.6s ease-out;
        pointer-events: none;
        z-index: 0;
    `;

    if (element.style.position !== 'relative' && element.style.position !== 'absolute') {
        element.style.position = 'relative';
    }
    element.style.overflow = 'hidden';

    element.appendChild(ripple);

    setTimeout(() => ripple.remove(), 600);
}

// Add ripple animation
const rippleStyle = document.createElement('style');
rippleStyle.textContent = `
    @keyframes ripple {
        to {
            transform: scale(2);
            opacity: 0;
        }
    }
`;
document.head.appendChild(rippleStyle);

// Parallax effect on mouse move (subtle, only when not hovering)
function setupParallaxEffect() {
    const overviewSection = document.querySelector('.overview-section');
    if (!overviewSection) return;

    const visualCards = document.querySelectorAll('.visual-card');
    const featureIcons = document.querySelectorAll('.overview-feature .feature-icon');
    let isHovering = false;

    // Track hover state
    visualCards.forEach(card => {
        card.addEventListener('mouseenter', () => { isHovering = true; });
        card.addEventListener('mouseleave', () => { isHovering = false; });
    });

    overviewSection.addEventListener('mousemove', (e) => {
        if (isHovering) return; // Skip parallax when hovering
        
        const rect = overviewSection.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
        const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;

        // Subtle parallax for visual cards (only when not hovering)
        visualCards.forEach((card, index) => {
            if (!card.matches(':hover')) {
                const speed = (index + 1) * 2;
                card.style.setProperty('--parallax-x', `${x * speed}px`);
                card.style.setProperty('--parallax-y', `${y * speed}px`);
            }
        });

        // Subtle parallax for feature icons
        featureIcons.forEach((icon, index) => {
            const speed = (index + 1) * 1.5;
            icon.style.setProperty('--parallax-x', `${x * speed}px`);
            icon.style.setProperty('--parallax-y', `${y * speed}px`);
        });
    });

    overviewSection.addEventListener('mouseleave', () => {
        visualCards.forEach(card => {
            card.style.removeProperty('--parallax-x');
            card.style.removeProperty('--parallax-y');
        });
        featureIcons.forEach(icon => {
            icon.style.removeProperty('--parallax-x');
            icon.style.removeProperty('--parallax-y');
        });
        isHovering = false;
    });
}

// Animate numbers in visual cards
function setupVisualCardNumbers() {
    const visualNumbers = document.querySelectorAll('.visual-card .visual-number');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const element = entry.target;
                const text = element.textContent.trim();
                
                // Extract number and suffix
                const match = text.match(/(\d+)([%+]*)/);
                if (match) {
                    const target = parseInt(match[1]);
                    const suffix = match[2] || '';
                    animateNumber(element, 0, target, 1500, suffix);
                }
                observer.unobserve(element);
            }
        });
    }, { threshold: 0.5 });

    visualNumbers.forEach(num => observer.observe(num));
}

function animateNumber(element, start, end, duration, suffix) {
    const range = end - start;
    const increment = range / (duration / 16);
    let current = start;

    const timer = setInterval(() => {
        current += increment;
        if (current >= end) {
            current = end;
            clearInterval(timer);
        }
        element.textContent = Math.floor(current) + suffix;
    }, 16);
}

// Initialize animations when DOM is ready
function initAboutAnimations() {
    animateStats();
    setupStatCardAnimation();
    setupOverviewAnimations();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAboutAnimations);
} else {
    initAboutAnimations();
}

