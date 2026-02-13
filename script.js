// ========================================
// SWISS EDITORIAL PORTFOLIO
// ========================================

// Shuffle company credentials on page load
function shuffleCredentials() {
    const container = document.querySelector('.hero-credentials');
    if (!container) return;

    const companies = container.dataset.companies.split(',');
    const shuffled = companies.sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 4);

    container.innerHTML = selected.map(company =>
        `<span class="credential">${company}</span>`
    ).join('');
}

document.addEventListener('DOMContentLoaded', () => {
    initMobileMenu();
    initScrollAnimations();
    initCounterAnimation();
    initSmoothScroll();
    initActiveNavLink();
    initHeroAnimations();
    initTestimonialsAnimation();
    shuffleCredentials();
});

// ========================================
// MOBILE MENU
// ========================================
function initMobileMenu() {
    const toggle = document.querySelector('.nav-toggle');
    const menu = document.querySelector('.mobile-menu');
    const links = document.querySelectorAll('.mobile-link');

    if (!toggle || !menu) return;

    toggle.addEventListener('click', () => {
        toggle.classList.toggle('active');
        menu.classList.toggle('active');
        document.body.style.overflow = menu.classList.contains('active') ? 'hidden' : '';
    });

    links.forEach(link => {
        link.addEventListener('click', () => {
            toggle.classList.remove('active');
            menu.classList.remove('active');
            document.body.style.overflow = '';
        });
    });
}

// ========================================
// SCROLL ANIMATIONS (Intersection Observer)
// ========================================
function initScrollAnimations() {
    const revealElements = document.querySelectorAll(
        '.section-header, .about-content, .teaching-grid, ' +
        '.experience-content, .philosophy-content, .contact-content, ' +
        '.stat-card, .teaching-card, .principle, .client-item'
    );

    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                // Add staggered delay for grid items
                const delay = index * 50;
                entry.target.style.transitionDelay = `${delay}ms`;
                entry.target.classList.add('revealed');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    revealElements.forEach(el => {
        el.classList.add('reveal-once');
        observer.observe(el);
    });

    // Add CSS for reveal animations
    const style = document.createElement('style');
    style.textContent = `
        .reveal-once {
            opacity: 0;
            transform: translateY(30px);
            transition: opacity 0.8s cubic-bezier(0.215, 0.61, 0.355, 1),
                        transform 0.8s cubic-bezier(0.215, 0.61, 0.355, 1);
        }
        .reveal-once.revealed {
            opacity: 1;
            transform: translateY(0);
        }
    `;
    document.head.appendChild(style);
}

// ========================================
// COUNTER ANIMATION
// ========================================
function initCounterAnimation() {
    const counters = document.querySelectorAll('.stat-number[data-target]');
    let animated = false;

    const animateCounter = (counter) => {
        const target = parseInt(counter.dataset.target);
        const duration = 2000;
        const step = target / (duration / 16);
        let current = 0;

        const updateCounter = () => {
            current += step;
            if (current < target) {
                counter.textContent = Math.floor(current);
                requestAnimationFrame(updateCounter);
            } else {
                counter.textContent = target;
            }
        };

        updateCounter();
    };

    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !animated) {
                animated = true;
                counters.forEach(counter => animateCounter(counter));
            }
        });
    }, { threshold: 0.5 });

    const statsGrid = document.querySelector('.stats-grid');
    if (statsGrid) {
        counterObserver.observe(statsGrid);
    }
}

// ========================================
// SMOOTH SCROLL
// ========================================
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const target = document.querySelector(targetId);
            if (target) {
                const navHeight = document.querySelector('.nav').offsetHeight;
                const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - navHeight;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// ========================================
// ACTIVE NAV LINK
// ========================================
function initActiveNavLink() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-links a:not(.nav-cta)');

    const observerOptions = {
        root: null,
        rootMargin: '-50% 0px -50% 0px',
        threshold: 0
    };

    const navObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute('id');
                navLinks.forEach(link => {
                    link.style.color = '';
                    if (link.getAttribute('href') === `#${id}`) {
                        link.style.color = 'var(--color-text)';
                    }
                });
            }
        });
    }, observerOptions);

    sections.forEach(section => navObserver.observe(section));
}

// ========================================
// HERO ANIMATIONS
// ========================================
function initHeroAnimations() {
    // Parallax effect for hero credentials
    const heroRight = document.querySelector('.hero-right');
    const credentials = document.querySelector('.hero-credentials');

    if (heroRight && credentials) {
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            const heroHeight = document.querySelector('.hero').offsetHeight;

            if (scrolled < heroHeight) {
                credentials.style.transform = `translateY(${scrolled * 0.1}px)`;
                credentials.style.opacity = 1 - (scrolled / heroHeight);
            }
        });
    }
}

// ========================================
// TESTIMONIALS ANIMATION
// ========================================
function initTestimonialsAnimation() {
    const testimonialCards = document.querySelectorAll('.testimonial-card');

    if (!testimonialCards.length) return;

    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                entry.target.style.transitionDelay = `${index * 50}ms`;
                entry.target.classList.add('revealed');
            }
        });
    }, observerOptions);

    testimonialCards.forEach(card => {
        observer.observe(card);
    });
}

// ========================================
// TESTIMONIALS ANIMATION
// ========================================
function initTestimonialsAnimation() {
    const cards = document.querySelectorAll('.testimonial-card');

    if (cards.length === 0) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                entry.target.style.transitionDelay = `${index * 50}ms`;
                entry.target.classList.add('revealed');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    cards.forEach(card => observer.observe(card));
}

// ========================================
// NAV BACKGROUND ON SCROLL
// ========================================
window.addEventListener('scroll', () => {
    const nav = document.querySelector('.nav');
    const scrolled = window.pageYOffset;

    if (scrolled > 100) {
        nav.style.boxShadow = '0 2px 30px rgba(0, 0, 0, 0.05)';
        nav.style.background = 'rgba(248, 246, 243, 0.95)';
    } else {
        nav.style.boxShadow = 'none';
        nav.style.background = 'rgba(248, 246, 243, 0.85)';
    }
});
// ========================================
// SHUFFLE CREDENTIALS
// ========================================
function shuffleCredentials() {
    const container = document.querySelector('.hero-credentials');
    if (!container) return;

    const companies = container.dataset.companies.split(',');
    const shuffled = companies.sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 4);

    container.innerHTML = selected.map(company =>
        `<span class="credential">${company}</span>`
    ).join('');
}
