// Portfolio Scripts

document.addEventListener('DOMContentLoaded', () => {
    initMobileMenu();
    initScrollAnimations();
    initTestimonialCarousel();
    initSpotifyCarousel();
    initScrollSpy();
    initMackerelEasterEgg();
    initModalHandlers();
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

    // Build one set first, then clone it for seamless loop
    shuffled.forEach(t => {
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

    // Measure exact left offset of where clones will start, then clone and start animation
    requestAnimationFrame(() => {
        const cards = Array.from(track.children);
        // Clone and append duplicate set
        const clones = cards.map(c => c.cloneNode(true));
        clones.forEach(c => track.appendChild(c));
        // The loop point is the left edge of the first clone = right edge of last original card
        // Use getBoundingClientRect relative to track to get pixel-perfect offset
        const trackLeft = track.getBoundingClientRect().left;
        const firstCloneLeft = clones[0].getBoundingClientRect().left;
        const oneSetWidth = firstCloneLeft - trackLeft;
        track.style.setProperty('--one-set-width', `${oneSetWidth}px`);
        track.style.animation = 'carousel-scroll 54s linear infinite';
    });

    // Pause/play state
    let isPaused = false;

    function pause() {
        isPaused = true;
        track.style.animationPlayState = 'paused';
        const btn = document.querySelector('.carousel-pause-btn');
        if (btn) {
            btn.setAttribute('aria-label', 'Play carousel');
            btn.setAttribute('aria-pressed', 'true');
        }
    }

    function play() {
        isPaused = false;
        track.style.animationPlayState = 'running';
        // Also remove any hover-paused state from wrapper
        const btn = document.querySelector('.carousel-pause-btn');
        if (btn) {
            btn.setAttribute('aria-label', 'Pause carousel');
            btn.setAttribute('aria-pressed', 'false');
        }
    }

    // Pause button
    const pauseBtn = document.querySelector('.carousel-pause-btn');
    if (pauseBtn) {
        pauseBtn.addEventListener('click', () => isPaused ? play() : pause());
    }

    // Pause on focus (keyboard tab into a card)
    track.addEventListener('focusin', pause);
    track.addEventListener('focusout', (e) => {
        if (!track.contains(e.relatedTarget)) play();
    });

    // Touch: pause on touch, resume on release
    const wrapper = document.querySelector('.testimonial-carousel-wrapper');
    if (wrapper) {
        let touchStartX = 0;
        wrapper.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            pause();
        }, { passive: true });
        wrapper.addEventListener('touchend', () => {
            play();
        }, { passive: true });
    }
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

// Scroll Spy — highlights nav link for the section currently in view
function initScrollSpy() {
    const sections = ['about', 'experience', 'philosophy', 'contact'].map(id =>
        document.getElementById(id)
    ).filter(Boolean);

    const navLinks = document.querySelectorAll('.nav-links a');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                navLinks.forEach(link => {
                    const href = link.getAttribute('href');
                    const isMatch = href === `#${entry.target.id}` || href === `/#${entry.target.id}`;
                    link.classList.toggle('active', isMatch);
                });
            }
        });
    }, { rootMargin: '-40% 0px -55% 0px' });

    sections.forEach(section => observer.observe(section));
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

function closeModal2() {
    const modal2 = document.getElementById('modal-2');
    if (modal2) {
        modal2.classList.remove('active');
        document.body.style.overflow = '';
    }
}

function openModal2() {
    closeModal();
    const modal2 = document.getElementById('modal-2');
    if (modal2) {
        modal2.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

// Initialize modal close handlers
function initModalHandlers() {
    const modal = document.getElementById('modal');
    const modal2 = document.getElementById('modal-2');
    if (!modal) return;

    // Modal 1: X closes, OK/Cancel open modal 2
    modal.querySelector('.modal-close').addEventListener('click', closeModal);
    modal.querySelector('.modal-btn-cancel').addEventListener('click', openModal2);
    modal.querySelector('.modal-btn-ok').addEventListener('click', openModal2);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) openModal2();
    });

    // Modal 2: all buttons actually close
    if (modal2) {
        modal2.querySelector('.modal-2-close').addEventListener('click', closeModal2);
        modal2.querySelector('.modal-2-btn-cancel').addEventListener('click', closeModal2);
        modal2.querySelector('.modal-2-btn-ok').addEventListener('click', closeModal2);
        modal2.addEventListener('click', (e) => {
            if (e.target === modal2) closeModal2();
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (modal2 && modal2.classList.contains('active')) closeModal2();
            else if (modal.classList.contains('active')) closeModal();
        }
    });
}

// Spotify Recently Played Carousel
async function initSpotifyCarousel() {
    const track = document.querySelector('.spotify-carousel-track');
    if (!track) return;

    // Show skeletons while loading
    for (let i = 0; i < 8; i++) {
        const skeleton = document.createElement('div');
        skeleton.className = 'spotify-album-skeleton';
        skeleton.innerHTML = `
            <div class="spotify-skeleton-art"></div>
            <div class="spotify-skeleton-text"></div>
            <div class="spotify-skeleton-text short"></div>
        `;
        track.appendChild(skeleton);
    }

    try {
        const res = await fetch('/api/spotify');
        if (!res.ok) throw new Error('API error');
        const { albums } = await res.json();

        // Clear skeletons
        track.innerHTML = '';

        if (!albums || albums.length === 0) {
            track.closest('.spotify-section').style.display = 'none';
            return;
        }

        // Build first set
        albums.forEach(album => {
            track.appendChild(buildAlbumCard(album));
        });

        // Measure then clone for seamless loop
        requestAnimationFrame(() => {
            const cards = Array.from(track.children);
            const clones = cards.map(c => c.cloneNode(true));
            clones.forEach(c => track.appendChild(c));

            const trackLeft = track.getBoundingClientRect().left;
            const firstCloneLeft = clones[0].getBoundingClientRect().left;
            const setWidth = firstCloneLeft - trackLeft;
            track.style.setProperty('--spotify-set-width', `${setWidth}px`);
            track.style.animation = 'spotify-scroll 60s linear infinite';
        });

        // Pause on hover (handled by CSS on wrapper, but pause completely on focus too)
        track.addEventListener('focusin', () => {
            track.style.animationPlayState = 'paused';
        });
        track.addEventListener('focusout', (e) => {
            if (!track.contains(e.relatedTarget)) {
                track.style.animationPlayState = 'running';
            }
        });

    } catch (err) {
        // On error, hide the section silently — don't break the page
        const section = track.closest('.spotify-section');
        if (section) section.style.display = 'none';
    }
}

function buildAlbumCard(album) {
    const a = document.createElement('a');
    a.className = 'spotify-album';
    a.href = album.url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.setAttribute('aria-label', `${album.name} by ${album.artist} on Spotify`);
    a.innerHTML = `
        <img src="${album.image}" alt="${album.name}" class="spotify-album-art" loading="lazy">
        <div class="spotify-album-info">
            <span class="spotify-album-name">${album.name}</span>
            <span class="spotify-album-artist">${album.artist}</span>
        </div>
    `;
    return a;
}
