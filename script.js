// Portfolio Scripts

document.addEventListener('DOMContentLoaded', () => {
    initMobileMenu();
    initThemeToggle();
    initScrollAnimations();
});

// Mobile Menu
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

// Theme Toggle with Liquid Blend Effect
function initThemeToggle() {
    const toggles = document.querySelectorAll('.theme-toggle');
    if (!toggles.length) return;

    // Check for saved theme
    const savedTheme = localStorage.getItem('theme') || 'dark';
    if (savedTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
    }

    // Sync all toggles to reflect current state
    function syncToggles() {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        toggles.forEach(toggle => {
            toggle.classList.toggle('dark', isDark);
        });
    }
    syncToggles();

    toggles.forEach(toggle => {
        toggle.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            const blob = document.querySelector('.liquid-blob');
            const overlay = document.querySelector('.theme-liquid-overlay');

            if (!blob || !overlay) return;

            // Set blob color based on target theme
            const blobColor = newTheme === 'dark' ? '#0D0D0D' : '#FAFAF9';

            // Position blob at center-top to cover nav bar
            blob.style.left = '50%';
            blob.style.top = '15%';
            blob.style.background = blobColor;

            // Reset animation
            blob.style.animation = 'none';
            blob.offsetHeight; // Force reflow
            blob.style.animation = 'liquidExpand 0.3s cubic-bezier(0.22, 1, 0.36, 1) forwards';

            // Switch theme after animation completes
            setTimeout(() => {
                if (newTheme === 'dark') {
                    document.documentElement.setAttribute('data-theme', 'dark');
                } else {
                    document.documentElement.removeAttribute('data-theme');
                }
                localStorage.setItem('theme', newTheme);
                syncToggles();
            }, 280);

            // Reset blob for next time
            setTimeout(() => {
                blob.style.animation = 'none';
            }, 350);
        });
    });
}

// Nav scroll effect
window.addEventListener('scroll', () => {
    const nav = document.querySelector('.nav');
    if (!nav) return;

    if (window.scrollY > 50) {
        nav.classList.add('scrolled');
    } else {
        nav.classList.remove('scrolled');
    }
});

// Scroll Animations
function initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                // Add staggered delay based on index
                setTimeout(() => {
                    entry.target.classList.add('visible');
                }, index * 100);
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.animate-on-scroll').forEach(el => {
        observer.observe(el);
    });
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    initMobileMenu();
    initThemeToggle();
    initScrollAnimations();
});
