// ==========================================================
// Our Nebula – Shared Script (every page)
// ==========================================================

// ---------- SETTINGS (edit these) ----------
const CONFIG = {
    // Where the "Get in Touch" messages go. The address is stored encoded (base64) so bots
    // that scan the page for "@" can't pick it up. To change it: btoa("you@gmail.com") in the browser console.
    contactEmailB64: "b3VybmVidWxhYUBnbWFpbC5jb20=",
    // Better: after FormSubmit sends its first activation mail it also gives you a random form ID.
    // Paste that ID here and the real address is never used on the site at all.
    formAlias: "",
    cooldownSeconds: 30        // minimum time between messages from one visitor
};
const contactTarget = () => CONFIG.formAlias || atob(CONFIG.contactEmailB64);

(function () {
    'use strict';

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isTouch = window.matchMedia('(hover: none)').matches;

    const $  = (s, c = document) => c.querySelector(s);
    const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
    const throttle = (fn, ms = 100) => { let l = 0; return function (...a) { const n = Date.now(); if (n - l >= ms) { l = n; fn.apply(this, a); } }; };
    const raf = fn => { let q = false; return (...a) => { if (q) return; q = true; requestAnimationFrame(() => { q = false; fn(...a); }); }; };
    const debounce = (fn, ms = 250) => { let t; return function (...a) { clearTimeout(t); t = setTimeout(() => fn.apply(this, a), ms); }; };

    // ---------- Toasts ----------
    function toast(msg, type = 'ok', ms = 4200) {
        let wrap = $('.toast-wrap');
        if (!wrap) { wrap = document.createElement('div'); wrap.className = 'toast-wrap'; document.body.appendChild(wrap); }
        const t = document.createElement('div');
        t.className = 'toast' + (type === 'error' ? ' error' : '');
        t.textContent = msg;
        wrap.appendChild(t);
        setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 450); }, ms);
    }

    // ---------- Preloader + page transitions ----------
    function initPreloader() {
        const pre = $('.preloader');
        const hide = () => pre && pre.classList.add('hide');
        window.addEventListener('load', () => setTimeout(hide, 150));
        setTimeout(hide, 1500);
        // restore page when coming back via browser history
        window.addEventListener('pageshow', e => { const w = $('.page-wipe'); if (w) w.classList.remove('on'); if (e.persisted) hide(); });
    }

    function initPageTransitions() {
        const wipe = $('.page-wipe');
        if (!wipe || reduceMotion) return;
        document.addEventListener('click', e => {
            const a = e.target.closest('a[href]');
            if (!a || e.metaKey || e.ctrlKey || e.shiftKey || a.target === '_blank' || a.hasAttribute('download')) return;
            const url = new URL(a.href, location.href);
            if (url.origin !== location.origin && location.protocol !== 'file:') return;
            const samePage = url.pathname === location.pathname;
            if (samePage) return;                       // anchors on the same page: smooth scroll instead
            if (!/\.html?$|\/$/.test(url.pathname)) return;
            e.preventDefault();
            wipe.classList.add('on');
            setTimeout(() => { location.href = url.href; }, 360);
        });
    }

    // ---------- Navbar ----------
    function initNavbar() {
        const navbar = $('.navbar'), burger = $('#hamburger'), menu = $('#mobileMenu');
        const close = () => { menu.classList.remove('open'); burger.classList.remove('open'); document.body.style.overflow = ''; };
        burger.addEventListener('click', () => {
            const open = menu.classList.toggle('open');
            burger.classList.toggle('open', open);
            document.body.style.overflow = open ? 'hidden' : '';
        });
        $$('a', menu).forEach(a => a.addEventListener('click', close));
        document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
        window.addEventListener('resize', debounce(() => { if (innerWidth > 992) close(); }));

        const page = ((location.pathname.split('/').pop() || 'index').toLowerCase()).replace(/\.html$/, '');
        $$('.nav-links a, .mobile-menu a').forEach(a => {
            if ((a.getAttribute('href') || '').toLowerCase().replace(/\.html$/, '') === page) a.classList.add('active');
        });

        const onScroll = () => navbar.classList.toggle('shrunk', scrollY > 60);
        addEventListener('scroll', throttle(onScroll, 80), { passive: true });
        onScroll();

        // Scroll-spy: highlight "Contact" while the contact section is on screen (home page)
        const contact = $('#contact');
        if (contact && 'IntersectionObserver' in window) {
            const links = $$('.nav-links a, .mobile-menu a');
            const home = links.filter(a => a.getAttribute('href') === 'index.html');
            const cl = links.filter(a => a.getAttribute('href') === 'index.html#contact');
            new IntersectionObserver(es => es.forEach(e => {
                if (e.isIntersecting) { home.forEach(a => a.classList.remove('active')); cl.forEach(a => a.classList.add('active')); }
                else { cl.forEach(a => a.classList.remove('active')); if (scrollY < contact.offsetTop) home.forEach(a => a.classList.add('active')); }
            }), { threshold: 0.35 }).observe(contact);
        }
    }

    // ---------- Scroll UI ----------
    function initScrollUI() {
        const bar = document.createElement('div'); bar.className = 'scroll-progress'; document.body.appendChild(bar);
        const top = document.createElement('button'); top.className = 'scroll-top'; top.textContent = '↑'; top.setAttribute('aria-label', 'Scroll to top');
        document.body.appendChild(top);
        top.addEventListener('click', () => scrollTo({ top: 0, behavior: 'smooth' }));
        const update = () => {
            const h = document.documentElement.scrollHeight - innerHeight;
            bar.style.width = (h > 0 ? scrollY / h * 100 : 0) + '%';
            top.classList.toggle('show', scrollY > 400);
        };
        addEventListener('scroll', raf(update), { passive: true });
        update();
    }

    function initSmoothAnchors() {
        $$('a[href*="#"]').forEach(a => {
            a.addEventListener('click', e => {
                const url = new URL(a.href, location.href);
                if (url.pathname !== location.pathname || !url.hash) return;
                const t = document.getElementById(url.hash.slice(1));
                if (t) { e.preventDefault(); t.scrollIntoView({ behavior: 'smooth', block: 'start' }); history.replaceState(null, '', url.hash); }
            });
        });
    }

    // ---------- Reveal + split-words ----------
    function initSplitWords() {
        $$('[data-split]').forEach(el => {
            let i = 0;
            // walk the text, keep tags like <p> and <span class="hl"> intact, wrap every word
            const walk = node => {
                Array.from(node.childNodes).forEach(n => {
                    if (n.nodeType === 3) {
                        const parts = n.textContent.split(/(\s+)/);
                        const frag = document.createDocumentFragment();
                        parts.forEach(w => {
                            if (!w) return;
                            if (/^\s+$/.test(w)) { frag.append(' '); return; }
                            const s = document.createElement('span');
                            s.className = 'word'; s.textContent = w;
                            s.style.transitionDelay = (i++ * 35) + 'ms';
                            frag.append(s);
                        });
                        n.replaceWith(frag);
                    } else if (n.nodeType === 1) walk(n);
                });
            };
            walk(el);
            el.classList.add('reveal-words');
        });
    }

    function initReveal() {
        const items = $$('.reveal, .reveal-words');
        if (!('IntersectionObserver' in window) || reduceMotion) {
            items.forEach(el => el.classList.add('visible', 'words-in')); return;
        }
        $$('.grid').forEach(g => $$('.reveal', g).forEach((el, i) => { el.style.transitionDelay = (i * 110) + 'ms'; }));
        const io = new IntersectionObserver((es, obs) => es.forEach(e => {
            if (!e.isIntersecting) return;
            e.target.classList.add('visible', 'words-in');
            setTimeout(() => { e.target.style.transitionDelay = ''; }, 1400);
            obs.unobserve(e.target);
        }), { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
        items.forEach(el => io.observe(el));
    }

    // ---------- Parallax (scroll + mouse) ----------
    function initParallax() {
        const hero = $('.hero'), inner = $('.hero-inner');
        let bg = null;
        if (hero) { bg = document.createElement('div'); bg.className = 'hero-bg'; hero.prepend(bg); }
        if (reduceMotion || !hero) return;
        addEventListener('scroll', raf(() => {
            const y = scrollY;
            if (y > innerHeight * 1.2) return;
            bg.style.transform = `translate3d(0, ${y * 0.25}px, 0)`;
            if (inner) { inner.style.transform = `translate3d(0, ${y * 0.12}px, 0)`; inner.style.opacity = Math.max(0, 1 - y / (innerHeight * 0.9)); }
        }), { passive: true });
    }

    // ---------- Typing ----------
    function initTyping() {
        $$('[data-typing]').forEach(el => {
            const full = el.getAttribute('data-typing');
            if (reduceMotion) { el.textContent = full; return; }
            el.textContent = '';
            const c = document.createElement('span'); c.className = 'typing-cursor'; el.appendChild(c);
            let i = 0;
            setTimeout(function tick() {
                if (i < full.length) { c.before(document.createTextNode(full[i++])); setTimeout(tick, 70 + Math.random() * 70); }
            }, 450);
        });
    }

    // ---------- Counters ----------
    function initCounters() {
        const els = $$('[data-count]'); if (!els.length) return;
        const run = el => {
            const target = parseFloat(el.dataset.count), suffix = el.dataset.suffix || '';
            if (reduceMotion) { el.textContent = target + suffix; return; }
            const t0 = performance.now(), dur = 1800;
            (function step(now) {
                const p = Math.min((now - t0) / dur, 1);
                el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))) + suffix;
                if (p < 1) requestAnimationFrame(step);
            })(t0);
        };
        const io = new IntersectionObserver((es, o) => es.forEach(e => { if (e.isIntersecting) { run(e.target); o.unobserve(e.target); } }), { threshold: 0.6 });
        els.forEach(e => io.observe(e));
    }

    // ---------- Card spotlight + tilt ----------
    function initCards() {
        $$('.card').forEach(card => {
            const tilt = !isTouch && !reduceMotion && card.classList.contains('tilt');
            let rect = null, sy = 0, ex = 0, ey = 0, queued = false;
            const apply = () => {
                queued = false; if (!rect) return;
                const x = ex - rect.left, y = ey - (rect.top - (scrollY - sy));
                card.style.setProperty('--mx', x + 'px'); card.style.setProperty('--my', y + 'px');
                if (tilt) {
                    const rx = ((rect.height / 2 - y) / (rect.height / 2)) * 6;
                    const ry = ((x - rect.width / 2) / (rect.width / 2)) * 6;
                    card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-8px) scale(1.02)`;
                }
            };
            card.addEventListener('mouseenter', () => { rect = card.getBoundingClientRect(); sy = scrollY; card.classList.add('tilting'); });
            card.addEventListener('mousemove', e => { ex = e.clientX; ey = e.clientY; if (!queued) { queued = true; requestAnimationFrame(apply); } }, { passive: true });
            card.addEventListener('mouseleave', () => { rect = null; card.classList.remove('tilting'); if (tilt) card.style.transform = ''; });
        });
    }

    // ---------- Buttons: magnetic + ripple ----------
    function initButtons() {
        $$('.btn, .chip, .dl-btn').forEach(btn => {
            if (!isTouch && !reduceMotion && btn.classList.contains('btn')) {
                let r = null, ex = 0, ey = 0, q = false;
                btn.addEventListener('mouseenter', () => { r = btn.getBoundingClientRect(); });
                btn.addEventListener('mousemove', e => {
                    ex = e.clientX; ey = e.clientY;
                    if (q || !r) return; q = true;
                    requestAnimationFrame(() => { q = false; if (r) btn.style.transform = `translate(${(ex - r.left - r.width / 2) * 0.22}px, ${(ey - r.top - r.height / 2) * 0.32}px)`; });
                }, { passive: true });
                btn.addEventListener('mouseleave', () => { r = null; btn.style.transform = ''; });
            }
            btn.addEventListener('click', e => {
                const r = btn.getBoundingClientRect(), size = Math.max(r.width, r.height);
                const rp = document.createElement('span');
                rp.style.cssText = `position:absolute;border-radius:50%;pointer-events:none;background:rgba(255,255,255,.45);width:${size}px;height:${size}px;left:${e.clientX - r.left - size / 2}px;top:${e.clientY - r.top - size / 2}px;transform:scale(0);opacity:1;transition:transform .6s,opacity .6s`;
                if (getComputedStyle(btn).position === 'static') btn.style.position = 'relative';
                btn.style.overflow = 'hidden';
                btn.appendChild(rp);
                requestAnimationFrame(() => { rp.style.transform = 'scale(2.6)'; rp.style.opacity = '0'; });
                setTimeout(() => rp.remove(), 650);
            });
        });
    }

    // ---------- Gallery (reads data/gallery.json – edited from the Pages CMS admin) ----------
    const CATEGORY_LABELS = { nebula: 'Nebula', galaxy: 'Galaxy', moon: 'Moon', planet: 'Planet', milkyway: 'Milky Way', sky: 'Night Sky', sun: 'Sun', other: 'Other' };
    const make = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
    const slugify = s => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'photo';
    // keep only relative paths or http(s) links; "/assets/x.jpg" becomes "assets/x.jpg" so it works on project sites too
    const safePath = p => { p = String(p || '').trim().replace(/^\/+/, ''); return /^[a-z][a-z0-9+.-]*:/i.test(p) && !/^https?:/i.test(p) ? '' : p; };
    const fmtDate = d => {
        if (!d) return '';
        const dt = new Date(String(d).length <= 10 ? d + 'T00:00:00' : d);
        return isNaN(dt) ? String(d) : dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    };
    const metaItems = p => [['Target', p.target], ['Gear', p.gear], ['Date', fmtDate(p.date)]].filter(([, v]) => v && String(v).trim());
    const catLabel = c => CATEGORY_LABELS[c] || (c.charAt(0).toUpperCase() + c.slice(1));

    let galleryPromise = null;
    function loadGallery() {
        if (!galleryPromise) galleryPromise = fetch('data/gallery.json', { cache: 'no-cache' })
            .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
            .then(data => (Array.isArray(data) ? data : (data && data.photos) || [])
                .map((p, i) => ({ ...p, _i: i, image: safePath(p && p.image), image_4k: safePath(p && p.image_4k) }))
                .filter(p => p.image)
                .sort((a, b) => {                         // newest date first; photos without a date keep file order
                    const da = Date.parse(a.date), db = Date.parse(b.date);
                    if (!isNaN(da) && !isNaN(db)) return (db - da) || (a._i - b._i);
                    if (!isNaN(da)) return -1; if (!isNaN(db)) return 1; return a._i - b._i;
                }));
        return galleryPromise;
    }

    function galleryCard(p) {
        const title = p.title || p.target || 'Untitled', cat = p.category || 'other', name = slugify(title);
        const ext = (p.image.match(/\.[a-z0-9]+$/i) || ['.jpg'])[0];
        const fig = make('figure', 'card media-card tilt reveal');
        fig.setAttribute('data-lightbox', '');
        Object.assign(fig.dataset, { cat, caption: title, orig: p.image, k4: p.image_4k || '', name, meta: metaItems(p).map(([k, v]) => `${k}: ${v}`).join('  ·  ') });

        const wrap = make('div', 'img-wrap'), img = make('img'); img.src = p.image; img.alt = title; img.dataset.fallback = '🌌';
        const overlay = make('div', 'overlay'), row = make('div', 'dl-row');
        const dl = (href, file, label, cls) => { const a = make('a', 'dl-btn' + (cls ? ' ' + cls : ''), label); a.href = href; a.download = file; return a; };
        row.append(dl(p.image, `our-nebula-${name}${ext}`, p.image_4k ? '⬇ ORIGINAL' : '⬇ DOWNLOAD'));
        if (p.image_4k) row.append(dl(p.image_4k, `our-nebula-${name}-4k${(p.image_4k.match(/\.[a-z0-9]+$/i) || ['.jpg'])[0]}`, '⬇ 4K', 'k4'));
        overlay.append(make('span', 'tag', catLabel(cat)), row);
        wrap.append(img, overlay);

        const cap = make('figcaption', 'media-caption'), meta = make('div', 'cap-meta');
        cap.append(make('span', 'cap-title', title));
        metaItems(p).forEach(([k, v]) => { const s = make('span'); s.append(make('b', null, k), document.createTextNode(v)); meta.append(s); });
        if (meta.children.length) cap.append(meta);
        fig.append(wrap, cap);
        return fig;
    }

    function previewCard(p) {
        const title = p.title || p.target || 'Untitled';
        const a = make('a', 'card media-card tilt reveal'); a.href = 'gallery.html';
        const wrap = make('div', 'img-wrap'), img = make('img'); img.src = p.image; img.alt = title; img.dataset.fallback = '🌌';
        wrap.append(img); a.append(wrap, make('div', 'media-caption', title));
        return a;
    }

    async function initGallery() {
        const grid = $('#galleryGrid'), preview = $('[data-gallery-preview]');
        if (!grid && !preview) return;
        let list;
        try { list = await loadGallery(); }
        catch (e) {
            const msg = make('p', 'note', 'The photos could not be loaded right now. (If you opened this file straight from your computer, run it through a local web server instead – see README.)');
            (grid || preview).replaceChildren(msg); return;
        }
        if (!list.length) { (grid || preview).replaceChildren(make('p', 'note', 'No photos yet – check back soon.')); return; }
        if (grid) {
            grid.replaceChildren(...list.map(galleryCard));
            const bar = $('.filters');
            if (bar) {
                const order = Object.keys(CATEGORY_LABELS);
                const cats = [...new Set(list.map(p => p.category || 'other'))].sort((a, b) => (order.indexOf(a) + 99) % 99 - (order.indexOf(b) + 99) % 99);
                const chip = (f, label, on) => { const c = make('button', 'chip' + (on ? ' active' : ''), label); c.dataset.filter = f; return c; };
                bar.replaceChildren(chip('all', 'All', true), ...cats.map(c => chip(c, catLabel(c))));
            }
        }
        if (preview) preview.replaceChildren(...list.slice(0, 3).map(previewCard));
    }

    // ---------- Starfield ----------
    function initStars() {
        if (reduceMotion) return;
        const cv = document.createElement('canvas'); cv.className = 'star-canvas'; document.body.appendChild(cv);
        const ctx = cv.getContext('2d');
        let stars = [], shooting = [], last = 0;
        const mouse = { x: -9999, y: -9999 };
        const resize = () => {
            cv.width = innerWidth; cv.height = innerHeight;
            const n = innerWidth < 768 ? 80 : 120;
            stars = Array.from({ length: n }, () => ({
                x: Math.random() * cv.width, y: Math.random() * cv.height, r: Math.random() * 1.6 + 0.4,
                vx: (Math.random() - 0.5) * 0.25, vy: (Math.random() - 0.5) * 0.25,
                a: Math.random() * 0.5 + 0.4, tw: Math.random() * 0.02 + 0.005, ph: Math.random() * 6.28
            }));
        };
        addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });
        addEventListener('resize', debounce(resize)); resize();
        setInterval(() => {
            if (document.hidden || Math.random() > 0.7) return;
            shooting.push({ x: Math.random() * cv.width * 0.8, y: Math.random() * cv.height * 0.4, len: 120 + Math.random() * 80, sp: 9 + Math.random() * 6, life: 1 });
        }, 4000);
        // ~40fps, paused when the tab is hidden; speeds are scaled by elapsed time so motion stays the same
        (function draw(t) {
            requestAnimationFrame(draw);
            if (document.hidden) return;
            const dt = t - last; if (dt < 24) return; last = t;
            const k = Math.min(dt, 64) / 16.67;
            ctx.clearRect(0, 0, cv.width, cv.height);
            ctx.fillStyle = '#fff';
            for (const s of stars) {
                s.x += s.vx * k; s.y += s.vy * k;
                if (s.x < 0) s.x = cv.width; if (s.x > cv.width) s.x = 0;
                if (s.y < 0) s.y = cv.height; if (s.y > cv.height) s.y = 0;
                const dx = s.x - mouse.x, dy = s.y - mouse.y, d2 = dx * dx + dy * dy;
                if (d2 < 14000) { const d = Math.sqrt(d2) || 1, f = (118 - d) / 118 * 1.4 * k; s.x += dx / d * f; s.y += dy / d * f; }
                ctx.globalAlpha = s.a * (0.6 + 0.4 * Math.sin(t * s.tw + s.ph));
                ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.283); ctx.fill();
            }
            ctx.globalAlpha = 1;
            shooting = shooting.filter(m => m.life > 0);
            for (const m of shooting) {
                const g = ctx.createLinearGradient(m.x, m.y, m.x - m.len, m.y - m.len * 0.45);
                g.addColorStop(0, `rgba(154,205,50,${m.life})`); g.addColorStop(1, 'rgba(154,205,50,0)');
                ctx.strokeStyle = g; ctx.lineWidth = 2;
                ctx.beginPath(); ctx.moveTo(m.x, m.y); ctx.lineTo(m.x - m.len, m.y - m.len * 0.45); ctx.stroke();
                m.x += m.sp * k; m.y += m.sp * 0.45 * k; m.life -= 0.014 * k;
            }
        })(0);
    }

    // ---------- Cursor ----------
    function initCursor() {
        if (isTouch || reduceMotion) return;
        const glow = document.createElement('div'); glow.className = 'custom-cursor';
        const dot = document.createElement('div'); dot.className = 'cursor-dot';
        document.body.append(glow, dot);
        let mx = -100, my = -100, gx = -100, gy = -100, scale = 1, running = false;
        const loop = () => {
            gx += (mx - gx) * 0.22; gy += (my - gy) * 0.22;
            glow.style.transform = `translate3d(${gx}px, ${gy}px, 0) translate(-50%, -50%) scale(${scale})`;
            if (Math.abs(mx - gx) > 0.3 || Math.abs(my - gy) > 0.3) requestAnimationFrame(loop); else running = false;   // stops when idle
        };
        const kick = () => { if (!running) { running = true; requestAnimationFrame(loop); } };
        addEventListener('mousemove', e => {
            mx = e.clientX; my = e.clientY;
            dot.style.transform = `translate3d(${mx}px, ${my}px, 0) translate(-50%, -50%)`;
            kick();
        }, { passive: true });
        document.addEventListener('mouseover', e => {
            const big = !!e.target.closest('a, button, .media-card, .hamburger, .chip');
            glow.classList.toggle('big', big); scale = big ? 2.3 : 1; kick();
        }, { passive: true });
    }

    // ---------- Images ----------
    function initImages() {
        $$('img').forEach(img => {
            img.loading = 'lazy';
            img.style.opacity = '0';
            img.style.transition = 'opacity .8s ease, transform .7s cubic-bezier(.2,.7,.2,1)';
            const show = () => { img.style.opacity = '1'; };
            if (img.complete && img.naturalWidth > 0) show();
            img.addEventListener('load', show);
            img.addEventListener('error', () => {
                const fb = document.createElement('div');
                fb.className = 'img-fallback'; fb.textContent = img.dataset.fallback || '✦';
                const ov = $('.overlay', img.parentNode);
                img.replaceWith(fb);
                if (ov) fb.after(ov);
            });
        });
    }

    // ---------- Gallery: filter ----------
    function initFilter() {
        const chips = $$('.chip[data-filter]'); if (!chips.length) return;
        const cards = $$('#galleryGrid .media-card');
        chips.forEach(chip => chip.addEventListener('click', () => {
            chips.forEach(c => c.classList.toggle('active', c === chip));
            const f = chip.dataset.filter; let i = 0;
            cards.forEach(card => {
                const match = f === 'all' || card.dataset.cat === f;
                card.style.display = match ? '' : 'none';
                card.classList.remove('pop');
                if (match) {
                    card.classList.add('visible');
                    card.style.transitionDelay = '';
                    void card.offsetWidth;
                    card.style.animationDelay = (i++ * 70) + 'ms';
                    card.classList.add('pop');
                }
            });
        }));
    }

    // ---------- Lightbox with downloads ----------
    function initLightbox() {
        const all = $$('[data-lightbox]'); if (!all.length) return;
        const lb = document.createElement('div'); lb.className = 'lightbox';
        lb.innerHTML = '<button class="lb-btn lb-close" aria-label="Close">✕</button><button class="lb-btn lb-prev" aria-label="Previous">‹</button><img alt="">' +
            '<div class="lb-meta"><div class="lightbox-caption"></div><div class="lb-info"></div><div class="lb-count"></div>' +
            '<div class="lb-dl"><a class="dl-btn" data-o>⬇ ORIGINAL</a><a class="dl-btn k4" data-k>⬇ 4K</a></div></div>' +
            '<button class="lb-btn lb-next" aria-label="Next">›</button>';
        document.body.appendChild(lb);
        const img = $('img', lb), cap = $('.lightbox-caption', lb), info = $('.lb-info', lb), cnt = $('.lb-count', lb), ob = $('[data-o]', lb), kb = $('[data-k]', lb);
        let list = all, idx = 0;
        const visible = () => all.filter(el => el.style.display !== 'none');
        const show = i => {
            idx = (i + list.length) % list.length;
            const el = list[idx];
            img.style.opacity = '0';
            setTimeout(() => { img.src = el.dataset.orig; img.style.opacity = '1'; }, 120);
            cap.textContent = el.dataset.caption;
            info.textContent = el.dataset.meta || '';
            cnt.textContent = `${idx + 1} / ${list.length}`;
            const ext = (el.dataset.orig.match(/\.[a-z0-9]+$/i) || ['.jpg'])[0], k4 = el.dataset.k4;
            ob.href = el.dataset.orig; ob.download = `our-nebula-${el.dataset.name}${ext}`;
            ob.textContent = k4 ? '⬇ ORIGINAL' : '⬇ DOWNLOAD';
            kb.style.display = k4 ? '' : 'none';
            if (k4) { kb.href = k4; kb.download = `our-nebula-${el.dataset.name}-4k${(k4.match(/\.[a-z0-9]+$/i) || ['.jpg'])[0]}`; }
        };
        const open = el => { list = visible(); show(list.indexOf(el)); lb.classList.add('open'); document.body.style.overflow = 'hidden'; };
        const close = () => { lb.classList.remove('open'); document.body.style.overflow = ''; };
        all.forEach(el => el.addEventListener('click', e => { if (e.target.closest('.dl-btn')) return; open(el); }));
        $('.lb-close', lb).addEventListener('click', close);
        $('.lb-prev', lb).addEventListener('click', () => show(idx - 1));
        $('.lb-next', lb).addEventListener('click', () => show(idx + 1));
        lb.addEventListener('click', e => { if (e.target === lb) close(); });
        document.addEventListener('keydown', e => {
            if (!lb.classList.contains('open')) return;
            if (e.key === 'Escape') close(); if (e.key === 'ArrowLeft') show(idx - 1); if (e.key === 'ArrowRight') show(idx + 1);
        });
        let sx = 0;
        lb.addEventListener('touchstart', e => { sx = e.touches[0].clientX; }, { passive: true });
        lb.addEventListener('touchend', e => { const d = e.changedTouches[0].clientX - sx; if (Math.abs(d) > 50) show(idx + (d < 0 ? 1 : -1)); });
        $$('.dl-btn', lb).forEach(b => b.addEventListener('click', () => toast('Download started ⬇')));
        $$('#galleryGrid .dl-btn').forEach(b => b.addEventListener('click', () => toast('Download started ⬇')));
    }

    // ---------- Contact form ----------
    function initContact() {
        const form = $('#contactForm'); if (!form) return;
        const email = $('#cEmail'), msg = $('#cMessage'), count = $('#cCount'), btn = $('#cSubmit'), ok = $('#cSuccess');
        const label = $('.btn-label', btn);
        const openedAt = Date.now();
        msg.addEventListener('input', () => { count.textContent = `${msg.value.length} / 1000`; msg.parentNode.classList.remove('invalid'); });
        email.addEventListener('input', () => email.parentNode.classList.remove('invalid'));
        $('#cAgain').addEventListener('click', () => ok.classList.remove('show'));

        form.addEventListener('submit', async e => {
            e.preventDefault();
            const okEmail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim());
            const okMsg = msg.value.trim().length >= 5;
            email.parentNode.classList.toggle('invalid', !okEmail);
            msg.parentNode.classList.toggle('invalid', !okMsg);
            if (!okEmail) return toast('Please enter a valid email address.', 'error');
            if (!okMsg) return toast('Please write a short message (at least 5 characters).', 'error');
            if (form.elements._honey.value) return;                      // bot trap
            if (Date.now() - openedAt < 2500) return toast('Take a moment to write your message first :)', 'error');

            const last = parseInt(localStorage.getItem('on_last_msg') || '0', 10);
            const wait = CONFIG.cooldownSeconds * 1000 - (Date.now() - last);
            if (wait > 0) return toast(`Please wait ${Math.ceil(wait / 1000)}s before sending another message.`, 'error');
            

            btn.classList.add('loading'); label.textContent = 'SENDING…';
            try {
                const res = await fetch('https://formsubmit.co/ajax/' + encodeURIComponent(contactTarget()), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                    body: JSON.stringify({
                        email: email.value.trim(), message: msg.value.trim(),
                        _subject: 'New message from Our Nebula', _template: 'table', _captcha: 'false'
                    })
                });
                const data = await res.json().catch(() => ({}));
                if (!res.ok || data.success === 'false' || data.success === false) throw new Error(data.message || 'Request failed');
                localStorage.setItem('on_last_msg', String(Date.now()));
                form.reset(); count.textContent = '0 / 1000';
                ok.classList.add('show');
            } catch (err) {
                toast('Could not send online. Opening your email app instead…', 'error', 5500);
                setTimeout(() => { location.href = 'mailto:' + atob(CONFIG.contactEmailB64) + '?subject=' + encodeURIComponent('Message from Our Nebula') + '&body=' + encodeURIComponent(msg.value.trim() + '\n\n— ' + email.value.trim()); }, 1200);
            } finally {
                btn.classList.remove('loading'); label.textContent = 'SEND MESSAGE';
            }
        });
    }

    function initYear() { $$('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); }); }

    // ---------- Boot ----------
    initPreloader();
    document.addEventListener('DOMContentLoaded', async () => {
        await initGallery();            // builds gallery/preview cards before animations & lightbox are wired
        initNavbar(); initScrollUI(); initSmoothAnchors(); initPageTransitions();
        initImages(); initSplitWords(); initReveal(); initParallax(); initTyping(); initCounters();
        initCards(); initButtons(); initStars(); initCursor();
        initFilter(); initLightbox(); initContact(); initYear();
        console.log('%c🌌 Welcome to Our Nebula 🌌', 'color:#9acd32;font-size:18px;font-weight:bold');
    });
})();
