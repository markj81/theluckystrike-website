// Portfolio Scripts

document.addEventListener('DOMContentLoaded', () => {
    initMobileMenu();
    initThemeToggle();
    initScrollAnimations();
    initTestimonialCarousel();
});

// Testimonial Carousel
function initTestimonialCarousel() {
    const track = document.querySelector('.testimonial-carousel-track');
    if (!track) return;

    const testimonials = [
        {
            quote: "Mark is a fantastic leader with a clear sense of direction and a natural ability to motivate the people around him.",
            name: "Kate Lakey",
            role: "Software Engineer",
            company: "HackerOne",
            photo: "images/kate.jpeg"
        },
        {
            quote: "I had the pleasure of working with Mark at HackerOne. As an Engineering leader, Mark is like your best Claude SKILL.MD in product design and design leadership.",
            name: "Bert Sinnema",
            role: "VP of Engineering",
            company: "Eye Security",
            photo: "images/bert.jpg"
        },
        {
            quote: "Mark played a big role in my growth as a product designer. He challenged me, supported me, and ultimately promoted me to Senior Product Designer.",
            name: "Elliot Nolten",
            role: "Design Manager",
            company: "IKEA",
            photo: "images/elliot.jpeg"
        },
        {
            quote: "Mark is a kind and deeply empathetic manager who leads with clarity and care. He has intentionally created a supportive and psychologically safe environment.",
            name: "Joohye Jubilo",
            role: "Staff Product Designer",
            company: "HackerOne",
            photo: "images/joohye.jpeg"
        },
        {
            quote: "Mark is a transformational design leader who fundamentally elevated how design operated at our company.",
            name: "Vlad Osypov",
            role: "Senior Software Engineering Manager",
            company: "HackerOne",
            photo: "images/vlad.jpeg"
        },
        {
            quote: "Mark has a rare ability to balance strategic thinking with genuine care for his team. He leads with empathy and intention.",
            name: "Camilo Sanchez",
            role: "Senior Product Designer",
            company: "HackerOne",
            photo: "images/camilo.jpeg"
        },
        {
            quote: "Mark brought a great level of care, energy, and intentionality to his work. He is always invested in his team's success.",
            name: "Nathalia Coutinho",
            role: "Senior Software Engineer",
            company: "Eye Security",
            photo: "images/nathalia.jpeg"
        },
        {
            quote: "Mark has an exceptional ability to keep teams unblocked and moving forward, even across time zones.",
            name: "Courtney Bregar",
            role: "Principal Product Designer",
            company: "HackerOne",
            photo: "images/courtney.jpeg"
        },
        {
            quote: "Mark combines design depth, leadership, creativity, and just the right amount of mischief. I'd work with him again in a heartbeat.",
            name: "Esther Wolting",
            role: "Senior Engineering Manager",
            company: "HackerOne",
            photo: "images/esther.jpg"
        }
    ];

    // Shuffle testimonials
    const shuffled = testimonials.sort(() => Math.random() - 0.5);

    // Create three sets for seamless infinite loop
    const allTestimonials = [...shuffled, ...shuffled, ...shuffled];

    // Build HTML
    allTestimonials.forEach(t => {
        const card = document.createElement('div');
        card.className = 'testimonial-carousel-card';
        card.innerHTML = `
            <blockquote class="testimonial-carousel-quote">"${t.quote}"</blockquote>
            <div class="testimonial-carousel-author">
                <img src="${t.photo}" alt="${t.name}" class="testimonial-carousel-photo">
                <div class="testimonial-carousel-info">
                    <span class="testimonial-carousel-name">${t.name}</span>
                    <span class="testimonial-carousel-role">${t.role}${t.company ? ', ' + t.company : ''}</span>
                </div>
            </div>
        `;
        track.appendChild(card);
    });
}

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
            // Longer animation on larger screens for smoother transition
            const isLargeScreen = window.innerWidth > 768;
            const duration = isLargeScreen ? '1.2s' : '0.4s';
            const delay = isLargeScreen ? 1150 : 380;
            const resetDelay = isLargeScreen ? 1250 : 450;

            blob.style.animation = `liquidExpand ${duration} cubic-bezier(0.4, 0, 0.2, 1) forwards`;

            // Switch theme after animation completes
            setTimeout(() => {
                if (newTheme === 'dark') {
                    document.documentElement.setAttribute('data-theme', 'dark');
                } else {
                    document.documentElement.removeAttribute('data-theme');
                }
                localStorage.setItem('theme', newTheme);
                syncToggles();
            }, delay);

            // Reset blob for next time
            setTimeout(() => {
                blob.style.animation = 'none';
            }, resetDelay);
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
    initMackerelEasterEgg();
});

// Modal - Press M to open
function initMackerelEasterEgg() {
    document.addEventListener('keydown', (e) => {
        if (e.key === 'm' || e.key === 'M') {
            openModal();
        }
    });
}

function openModal() {
    const modal = document.getElementById('modal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal() {
    const modal = document.getElementById('modal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// Initialize modal close handlers
document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('modal');
    if (!modal) return;

    // Close on X button
    modal.querySelector('.modal-close').addEventListener('click', closeModal);

    // Close on Cancel button
    modal.querySelector('.modal-btn-cancel').addEventListener('click', closeModal);

    // Close on OK button
    modal.querySelector('.modal-btn-ok').addEventListener('click', closeModal);

    // Close on overlay click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeModal();
        }
    });
}););
