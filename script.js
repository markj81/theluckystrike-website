// Portfolio Scripts

document.addEventListener('DOMContentLoaded', () => {
    initMobileMenu();
    initScrollAnimations();
    initTestimonialCarousel();
    initSpotifyCarousel();
    initScrollSpy();
    initMackerelEasterEgg();
    initModalHandlers();
    initHeroCanvas();
    initThemeToggle();
    initContactCopy();
});

// Copy-to-clipboard contact row. Progressive enhancement: only
// intercepts when the Clipboard API is available; otherwise the
// mailto: href is left to behave normally.
function initContactCopy() {
    const link = document.querySelector('.contact-copy');
    if (!link || !navigator.clipboard || !navigator.clipboard.writeText) return;

    const email = link.dataset.copy;
    const label = link.querySelector('.link-label');
    const arrow = link.querySelector('.link-arrow');
    const status = document.getElementById('copy-status');
    const labelText = label.textContent;
    const arrowText = arrow.textContent;
    let resetId = null;

    link.addEventListener('click', async (e) => {
        e.preventDefault();
        try {
            await navigator.clipboard.writeText(email);
        } catch (err) {
            // Clipboard blocked (rare) — fall back to opening the mail client
            window.location.href = link.getAttribute('href');
            return;
        }
        link.classList.add('copied');
        label.textContent = 'Copied';
        arrow.textContent = '✓';
        if (status) status.textContent = `${email} copied to clipboard`;

        clearTimeout(resetId);
        resetId = setTimeout(() => {
            link.classList.remove('copied');
            label.textContent = labelText;
            arrow.textContent = arrowText;
            if (status) status.textContent = '';
        }, 1800);
    });
}

// Theme toggle — initial theme is applied by the inline head
// script (localStorage, falling back to prefers-color-scheme);
// this wires the buttons and persists the choice.
function initThemeToggle() {
    const buttons = document.querySelectorAll('.theme-toggle');
    if (!buttons.length) return;

    const sync = () => {
        const light = document.documentElement.dataset.theme === 'light';
        buttons.forEach(b => {
            b.setAttribute('aria-pressed', light);
            b.setAttribute('aria-label', light ? 'Switch to dark theme' : 'Switch to light theme');
        });
    };

    buttons.forEach(b => b.addEventListener('click', () => {
        const next = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
        document.documentElement.dataset.theme = next;
        try { localStorage.setItem('theme', next); } catch (e) { /* private mode */ }
        sync();
    }));

    sync();
}

// Hero flow field — generative ink trails drawn on canvas.
// Particles follow a slowly morphing noise field; the cursor stirs
// a vortex into it. Pauses off-screen and honors reduced motion.
function initHeroCanvas() {
    const canvas = document.querySelector('.hero-canvas');
    if (!canvas) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const ctx = canvas.getContext('2d');
    const hero = canvas.closest('.hero');
    let w = 0, h = 0;
    let particles = [];
    let raf = null;
    let inView = false;
    let t = Math.random() * 1000;
    const mouse = { x: -9999, y: -9999 };
    const TAU = Math.PI * 2;

    // Trail palette follows the active theme
    let inkStroke, acidStroke;
    function refreshPalette() {
        const light = document.documentElement.dataset.theme === 'light';
        inkStroke = light ? 'rgba(11, 11, 9, 0.06)' : 'rgba(236, 233, 223, 0.05)';
        acidStroke = light ? 'rgba(94, 122, 12, 0.18)' : 'rgba(200, 245, 66, 0.14)';
        if (w && h) ctx.clearRect(0, 0, w, h); // drop old-theme trails
    }
    refreshPalette();
    new MutationObserver(refreshPalette)
        .observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    // Tiny value noise (permutation-based, smooth interpolation)
    const perm = new Uint8Array(512);
    {
        const p = Uint8Array.from({ length: 256 }, (_, i) => i);
        for (let i = 255; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [p[i], p[j]] = [p[j], p[i]];
        }
        for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
    }
    const fade = v => v * v * (3 - 2 * v);
    const lerp = (a, b, v) => a + (b - a) * v;
    function noise2(x, y) {
        const X = Math.floor(x) & 255, Y = Math.floor(y) & 255;
        x -= Math.floor(x); y -= Math.floor(y);
        const u = fade(x), v = fade(y);
        const a = perm[X + perm[Y]], b = perm[X + 1 + perm[Y]];
        const c = perm[X + perm[Y + 1]], d = perm[X + 1 + perm[Y + 1]];
        return lerp(lerp(a, b, u), lerp(c, d, u), v) / 255; // 0..1
    }

    function spawn(p) {
        p.x = p.px = Math.random() * w;
        p.y = p.py = Math.random() * h;
        p.life = 140 + Math.random() * 260;
        p.speed = 0.45 + Math.random() * 0.95;
        p.acid = Math.random() < 0.08;
        return p;
    }

    function resize() {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        w = hero.clientWidth;
        h = hero.clientHeight;
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.lineCap = 'round';
        const target = Math.max(110, Math.min(420, Math.round((w * h) / (w < 768 ? 7000 : 4300))));
        particles = Array.from({ length: target }, () => spawn({}));
    }

    function frame() {
        t += 0.0016;

        // Fade existing trails toward transparent (keeps glows beneath visible)
        ctx.globalCompositeOperation = 'destination-out';
        ctx.fillStyle = 'rgba(0, 0, 0, 0.09)';
        ctx.fillRect(0, 0, w, h);
        ctx.globalCompositeOperation = 'source-over';

        const s = 0.0015;
        for (const p of particles) {
            const angle = noise2(p.x * s + t, p.y * s - t * 0.6) * TAU * 2;
            let vx = Math.cos(angle) * p.speed;
            let vy = Math.sin(angle) * p.speed;

            // Cursor vortex: swirl + gentle push within 180px
            const dx = p.x - mouse.x, dy = p.y - mouse.y;
            const d2 = dx * dx + dy * dy;
            if (d2 < 32400) {
                const d = Math.sqrt(d2) || 1;
                const f = (1 - d / 180) * 2.2;
                vx += (-dy / d) * f + (dx / d) * f * 0.35;
                vy += (dx / d) * f + (dy / d) * f * 0.35;
            }

            p.px = p.x; p.py = p.y;
            p.x += vx; p.y += vy;
            p.life--;

            if (p.life <= 0 || p.x < -8 || p.x > w + 8 || p.y < -8 || p.y > h + 8) {
                spawn(p);
                continue;
            }

            ctx.strokeStyle = p.acid ? acidStroke : inkStroke;
            ctx.lineWidth = p.acid ? 1.2 : 0.8;
            ctx.beginPath();
            ctx.moveTo(p.px, p.py);
            ctx.lineTo(p.x, p.y);
            ctx.stroke();
        }

        raf = requestAnimationFrame(frame);
    }

    function start() {
        if (!raf && inView && !document.hidden) raf = requestAnimationFrame(frame);
    }
    function stop() {
        if (raf) { cancelAnimationFrame(raf); raf = null; }
    }

    new IntersectionObserver(([entry]) => {
        inView = entry.isIntersecting;
        inView ? start() : stop();
    }).observe(hero);

    document.addEventListener('visibilitychange', () => {
        document.hidden ? stop() : start();
    });

    hero.addEventListener('pointermove', (e) => {
        const rect = canvas.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
    });
    hero.addEventListener('pointerleave', () => {
        mouse.x = -9999; mouse.y = -9999;
    });

    window.addEventListener('resize', resize);
    resize();
}

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
            <blockquote class="testimonial-carousel-quote">“${t.quote}”</blockquote>
            <div class="testimonial-carousel-author">
                <img src="${t.photo}" alt="${t.name}" class="testimonial-carousel-photo" loading="lazy">
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
        // Clone and append duplicate set (decorative — hide from AT)
        const clones = cards.map(c => c.cloneNode(true));
        clones.forEach(c => {
            c.setAttribute('aria-hidden', 'true');
            c.querySelectorAll('a, button').forEach(el => el.tabIndex = -1);
            track.appendChild(c);
        });
        // The loop point is the left edge of the first clone = right edge of last original card
        // Use getBoundingClientRect relative to track to get pixel-perfect offset
        const trackLeft = track.getBoundingClientRect().left;
        const firstCloneLeft = clones[0].getBoundingClientRect().left;
        const oneSetWidth = firstCloneLeft - trackLeft;
        track.style.setProperty('--one-set-width', `${oneSetWidth}px`);
        track.style.animation = 'carousel-scroll 80s linear infinite';
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
        const isActive = toggle.classList.toggle('active');
        menu.classList.toggle('active');
        // Update ARIA states
        toggle.setAttribute('aria-expanded', isActive);
        menu.setAttribute('aria-hidden', !isActive);
        document.body.style.overflow = isActive ? 'hidden' : '';
    });

    links.forEach(link => {
        link.addEventListener('click', () => {
            toggle.classList.remove('active');
            menu.classList.remove('active');
            toggle.setAttribute('aria-expanded', 'false');
            menu.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
        });
    });

    const closeBtn = document.querySelector('.mobile-menu-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            toggle.classList.remove('active');
            menu.classList.remove('active');
            toggle.setAttribute('aria-expanded', 'false');
            menu.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
        });
    }
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
        const tag = e.target.tagName.toLowerCase();
        const isInput = tag === 'input' || tag === 'textarea' || e.target.isContentEditable;
        if (!isInput && (e.key === 'm' || e.key === 'M')) {
            openModal();
        }
    });
}

let lastFocusedElement = null;

function openModal() {
    const modal = document.getElementById('modal');
    if (modal) {
        lastFocusedElement = document.activeElement;
        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        modal.querySelector('.modal-close').focus();
    }
}

function closeModal() {
    const modal = document.getElementById('modal');
    if (modal) {
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        if (lastFocusedElement) {
            lastFocusedElement.focus();
            lastFocusedElement = null;
        }
    }
}

function closeModal2() {
    const modal2 = document.getElementById('modal-2');
    if (modal2) {
        modal2.classList.remove('active');
        modal2.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        if (lastFocusedElement) {
            lastFocusedElement.focus();
            lastFocusedElement = null;
        }
    }
}

function openModal2() {
    closeModal();
    const modal2 = document.getElementById('modal-2');
    if (modal2) {
        modal2.classList.add('active');
        modal2.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        modal2.querySelector('.modal-2-close').focus();
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

        // Measure then clone for seamless loop (decorative — hide from AT)
        requestAnimationFrame(() => {
            const cards = Array.from(track.children);
            const clones = cards.map(c => c.cloneNode(true));
            clones.forEach(c => {
                c.setAttribute('aria-hidden', 'true');
                c.tabIndex = -1;
                c.querySelectorAll('a, button').forEach(el => el.tabIndex = -1);
                track.appendChild(c);
            });

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

    const img = document.createElement('img');
    img.src = album.image;
    img.alt = album.name;
    img.className = 'spotify-album-art';
    img.loading = 'lazy';

    const info = document.createElement('div');
    info.className = 'spotify-album-info';

    const nameSpan = document.createElement('span');
    nameSpan.className = 'spotify-album-name';
    nameSpan.textContent = album.name;

    const artistSpan = document.createElement('span');
    artistSpan.className = 'spotify-album-artist';
    artistSpan.textContent = album.artist;

    info.appendChild(nameSpan);
    info.appendChild(artistSpan);
    a.appendChild(img);
    a.appendChild(info);
    return a;
}
