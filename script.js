// =====================================================================
// Portfolio script.
// Content lives in data/projects.json and data/site-data.json,
// so adding a project / job / paper never needs a change in this file.
// =====================================================================
'use strict';

const root = document.documentElement;
const RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const FINE = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const esc = (s = '') => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// ---------------------------------------------------------------------
// Page transitions: a five-bar curtain wipes over the page, the action
// happens underneath, then the curtain leaves.
// ---------------------------------------------------------------------
const curtain = $('#curtain');
let busy = false;

function enterPage() {
    if (!curtain || !root.classList.contains('js-enter')) return;
    curtain.classList.add('leave');
    requestAnimationFrame(() => requestAnimationFrame(() => {
        root.classList.remove('js-enter');
        root.classList.add('ready');
        setTimeout(() => curtain.classList.remove('leave'), 1100);
    }));
}

function wipeThen(action, { leave = true } = {}) {
    if (!curtain || RM) { action(); return; }
    if (busy) return;
    busy = true;
    curtain.classList.remove('leave');
    curtain.classList.add('cover');
    setTimeout(() => {
        action();
        if (!leave) return;
        requestAnimationFrame(() => {
            curtain.classList.remove('cover');
            curtain.classList.add('leave');
            setTimeout(() => { curtain.classList.remove('leave'); busy = false; }, 1000);
        });
    }, 650);
}

const normPath = p => p.replace(/index\.html$/, '');

document.addEventListener('click', e => {
    const a = e.target.closest('a[href]');
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (a.target === '_blank' || a.hasAttribute('download')) return;
    let url;
    try { url = new URL(a.href, location.href); } catch (_) { return; }
    if (!/^(https?|file):$/.test(url.protocol) || url.origin !== location.origin) return;

    // close the mobile menu if it is open
    const menu = $('#navbarSupportedContent');
    if (menu && menu.classList.contains('show') && window.bootstrap) bootstrap.Collapse.getOrCreateInstance(menu).hide();

    const samePage = normPath(url.pathname) === normPath(location.pathname);
    if (samePage && url.hash) {
        const target = document.getElementById(url.hash.slice(1));
        if (!target) return;
        e.preventDefault();
        wipeThen(() => {
            window.scrollTo(0, target.getBoundingClientRect().top + window.scrollY);
            history.pushState(null, '', url.hash);
        });
    } else if (!samePage) {
        e.preventDefault();
        wipeThen(() => { location.href = url.href; }, { leave: false });
    }
});

window.addEventListener('pageshow', e => {
    if (e.persisted && curtain) { curtain.className = 'curtain'; root.classList.remove('js-enter'); root.classList.add('ready'); busy = false; }
});

// ---------------------------------------------------------------------
// Loader: robot arm + a solver converging
// ---------------------------------------------------------------------
const PHASES = [[0, 'Importing geometry'], [18, 'Generating mesh'], [42, 'Applying loads'], [66, 'Solving'], [96, 'Converged']];

function runLoader() {
    const loader = $('#loader');
    if (!loader || root.dataset.loader !== '1') { root.classList.add('ready'); return; }

    const mesh = $('#mesh');
    let cells = '';
    for (let i = 0; i < 11; i++) cells += `<rect class="s-cell" style="--i:${i}" x="${17 + i * 26}" y="188" width="23" height="14" rx="2"/>`;
    mesh.innerHTML = cells;

    const fill = $('#loader-fill'), pctEl = $('#loader-pct'), phase = $('#loader-phase'), res = $('#loader-res'), curve = $('#loader-curve');
    const MIN = RM ? 700 : 2900;
    let start = performance.now(), loaded = document.readyState === 'complete', finished = false;
    window.addEventListener('load', () => { loaded = true; });

    const finish = () => {
        if (finished) return;
        finished = true;
        loader.classList.add('hide');
        setTimeout(() => { root.classList.remove('loading'); root.classList.add('ready'); }, RM ? 0 : 450);
        setTimeout(() => loader.remove(), 1100);
    };
    $('#loader-skip').addEventListener('click', () => { loaded = true; start = performance.now() - MIN; });

    (function frame(now) {
        if (finished) return;
        const t = clamp((now - start) / MIN, 0, 1);
        const eased = 1 - Math.pow(1 - t, 2.2);
        const pct = (loaded || t < 1) ? Math.min(eased * 100, loaded ? 100 : 94) : 94;
        fill.style.width = pct + '%';
        pctEl.textContent = Math.round(pct) + '%';
        for (const [from, label] of PHASES) if (pct >= from) phase.textContent = label;
        res.textContent = '1e-' + (1 + Math.floor(pct / 16.5));
        curve.style.strokeDashoffset = 100 - pct;
        if (pct >= 99.5) { setTimeout(finish, 350); return; }
        requestAnimationFrame(frame);
    })(performance.now());
}

// ---------------------------------------------------------------------
// Scroll UI: navbar, progress strip, hero parallax, section spy
// ---------------------------------------------------------------------
function initScrollUI() {
    const nav = $('.navbar'), bar = $('#progress'), bg = $('.hero-bg');
    let ticking = false;
    const update = () => {
        const y = window.scrollY, max = document.documentElement.scrollHeight - window.innerHeight;
        nav.classList.toggle('solid', y > 60 || root.dataset.page !== 'home');
        if (bar) bar.style.transform = `scaleX(${max > 0 ? clamp(y / max, 0, 1) : 0})`;
        if (bg && !RM && y < window.innerHeight * 1.2) bg.style.transform = `translate3d(0, ${(y * 0.22).toFixed(1)}px, 0)`;
        ticking = false;
    };
    window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    window.addEventListener('resize', update);
    update();

    if (root.dataset.page === 'home' && 'IntersectionObserver' in window) {
        const links = $$('.navbar a.nav-link');
        const byId = new Map();
        links.forEach(a => { const m = (a.getAttribute('href') || '').match(/#(.+)$/); if (m) byId.set(m[1], a); });
        const spy = new IntersectionObserver(entries => entries.forEach(en => {
            if (!en.isIntersecting) return;
            links.forEach(l => l.classList.remove('active'));
            const l = byId.get(en.target.id);
            if (l) l.classList.add('active');
        }), { rootMargin: '-45% 0px -50% 0px' });
        byId.forEach((_, id) => { const s = document.getElementById(id); if (s) spy.observe(s); });
    }
}

// ---------------------------------------------------------------------
// Reveal on scroll (wipes, not fades) + count-up numbers
// ---------------------------------------------------------------------
let revealIO, countIO;
function watch(scope = document) {
    const els = $$('[data-anim]:not(.in)', scope);
    if (!('IntersectionObserver' in window) || RM) { els.forEach(el => el.classList.add('in')); }
    else {
        revealIO = revealIO || new IntersectionObserver(es => es.forEach(en => {
            if (en.isIntersecting) { en.target.classList.add('in'); revealIO.unobserve(en.target); }
        }), { threshold: 0.12, rootMargin: '0px 0px -5% 0px' });
        els.forEach(el => revealIO.observe(el));
    }
    $$('.stat-num:not([data-done])', scope).forEach(el => {
        const target = Number(el.dataset.to) || 0;
        if (!('IntersectionObserver' in window) || RM) { el.textContent = target; el.dataset.done = 1; return; }
        countIO = countIO || new IntersectionObserver(es => es.forEach(en => {
            if (!en.isIntersecting) return;
            const node = en.target, to = Number(node.dataset.to) || 0, t0 = performance.now();
            node.dataset.done = 1; countIO.unobserve(node);
            (function tick(t) {
                const p = clamp((t - t0) / 1400, 0, 1);
                node.textContent = Math.round(to * (1 - Math.pow(1 - p, 3)));
                if (p < 1) requestAnimationFrame(tick);
            })(t0);
        }), { threshold: 0.6 });
        countIO.observe(el);
    });
}

// ---------------------------------------------------------------------
// Hero typing
// ---------------------------------------------------------------------
function startTyping(words) {
    const el = $('#typed');
    if (!el || !words.length) return;
    let w = 0, c = 0, del = false;
    (function tick() {
        const word = words[w];
        el.textContent = word.slice(0, c);
        if (!del && c === word.length) { del = true; return setTimeout(tick, 1500); }
        if (del && c === 0) { del = false; w = (w + 1) % words.length; return setTimeout(tick, 350); }
        c += del ? -1 : 1;
        setTimeout(tick, del ? 45 : 95);
    })();
}

// ---------------------------------------------------------------------
// Missing images fall back to a plain panel instead of a broken icon
// ---------------------------------------------------------------------
document.addEventListener('error', e => {
    const img = e.target;
    if (!(img instanceof HTMLImageElement) || !img.hasAttribute('data-fb')) return;
    const host = img.closest('.photo-frame, .m-tile, .p-thumb, .g-item, .pm-img');
    if (host) host.classList.add('noimg');
}, true);

// ---------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------
async function loadJSON(path) {
    const res = await fetch(path);
    if (!res.ok) throw new Error(`Could not load ${path} (${res.status})`);
    return res.json();
}
function showFatal(err) {
    document.body.insertAdjacentHTML('afterbegin',
        `<div class="fatal"><strong>Content could not be loaded.</strong> Open the site through a local server
        (for example <code>python3 -m http.server 8000</code>) instead of double-clicking the file.
        <div style="opacity:.7;margin-top:.3rem">${esc(err.message)}</div></div>`);
}

// ---------------------------------------------------------------------
// Renderers
// ---------------------------------------------------------------------
const STRIPES = ['#2a4cff', '#ff6a3d', '#e0245e', '#17b8ff'];

function renderAbout(site, projects) {
    const stats = $('#stats');
    if (stats) {
        const items = [
            [projects.length, 'Projects'],
            [site.research.length, 'Research positions'],
            [site.experience.length, 'Industry roles'],
            [site.publications.length, 'Publications']
        ];
        stats.innerHTML = items.map(([n, label]) => `<div class="stat"><b class="stat-num" data-to="${n}">0</b><span>${label}</span></div>`).join('');
    }
    const edu = $('#education');
    if (edu) edu.innerHTML = site.education.map(x => `
        <li data-anim="fade"><strong>${esc(x.degree)}</strong>
        <span>${esc(x.school)}</span>
        <span>${esc(x.period)}, ${esc(x.score)}${x.note ? '. ' + esc(x.note) : ''}</span></li>`).join('');
    const ach = $('#achievements');
    if (ach) ach.innerHTML = site.achievements.map(a => `<li data-anim="fade"><strong>${esc(a.title)}</strong><span>${esc(a.detail)}</span></li>`).join('');
    const sk = $('#skills');
    if (sk) sk.innerHTML = site.skills.map((g, i) => `
        <div data-anim="fade" style="--d:${i * 90}ms"><h4>${esc(g.group)}</h4>${g.items.map(t => `<span class="tag">${esc(t)}</span>`).join('')}</div>`).join('');
    const gal = $('#gallery');
    if (gal) gal.innerHTML = (site.gallery || []).map((g, i) => `
        <figure class="g-item" data-anim="wipe-up" style="--d:${i * 110}ms"><img src="${esc(g.src)}" alt="${esc(g.caption)}" loading="lazy" data-fb><figcaption>${esc(g.caption)}</figcaption></figure>`).join('');
}

function renderExperience(site) {
    const el = $('#timeline');
    if (!el) return;
    el.insertAdjacentHTML('beforeend', site.experience.map((x, i) => `
        <article class="l-row" data-anim="fade" style="--d:${i * 90}ms">
            <div><div class="l-when">${esc(x.period)}</div>${x.current ? '<div class="l-now">Current role</div>' : ''}</div>
            <div class="l-what"><h3>${esc(x.role)}</h3><p class="l-org">${esc(x.org)}</p><p class="l-place">${esc(x.place)}</p></div>
            <ul class="l-points">${x.points.map(p => `<li>${esc(p)}</li>`).join('')}</ul>
        </article>`).join(''));
}

function renderResearch(site) {
    const el = $('#research-grid');
    if (!el) return;
    el.innerHTML = site.research.map((r, i) => `
        <div class="col-lg-4 col-md-6" data-anim="wipe-up" style="--d:${i * 140}ms">
            <article class="r-panel" style="--stripe:${STRIPES[i % STRIPES.length]}">
                <div class="r-inst">${esc(r.institute)}</div>
                <div class="r-when">${esc(r.period)}</div>
                <h3>${esc(r.topic)}</h3>
                <p class="r-advisor">with ${esc(r.advisor)}</p>
                <ul>${r.points.map(p => `<li>${esc(p)}</li>`).join('')}</ul>
                <div>${(r.tags || []).map(t => `<span class="tag">${esc(t)}</span>`).join('')}</div>
            </article>
        </div>`).join('');
}

function renderContact(site) {
    const wrap = $('#contact-icons');
    if (!wrap) return;
    wrap.innerHTML = site.contact.links.map(l => {
        const external = /^https?:/.test(l.url);
        return `<a class="c-icon" href="${esc(l.url)}" data-label="${esc(l.label)}" aria-label="${esc(l.label)}" style="--c:${esc(l.color || '#ff6a3d')}"${external ? ' target="_blank" rel="noopener"' : ''}><i class="${esc(l.icon)}"></i></a>`;
    }).join('');
    const mail = $('#email-line');
    if (mail && site.contact.email) { mail.textContent = site.contact.email; mail.href = 'mailto:' + site.contact.email; }

    // icons pop up a little as the pointer gets near them
    if (!FINE || RM) return;
    let raf = 0, pt = null;
    const setAll = fn => $$('.c-icon', wrap).forEach(fn);
    window.addEventListener('pointermove', e => {
        pt = e;
        if (raf) return;
        raf = requestAnimationFrame(() => {
            raf = 0;
            setAll(el => {
                const r = el.getBoundingClientRect();
                const d = Math.hypot(pt.clientX - (r.left + r.width / 2), pt.clientY - (r.top + r.height / 2)) - r.width / 2;
                el.style.setProperty('--p', clamp(1 - d / 120, 0, 1).toFixed(3));
            });
        });
    }, { passive: true });
    root.addEventListener('mouseleave', () => setAll(el => el.style.setProperty('--p', 0)));
}

function renderPublications(site) {
    const el = $('#pub-list');
    if (!el) return;
    el.innerHTML = [...site.publications].sort((a, b) => b.year - a.year).map((p, i) => `
        <article class="pub" data-anim="fade" style="--d:${i * 100}ms">
            <div class="pub-year">${esc(p.year)}</div>
            <div>
                <h3>${esc(p.title)}</h3>
                <p class="pub-authors">${esc(p.authors)}</p>
                <p class="pub-venue">${esc(p.venue)}</p>
                ${p.abstract ? `<p>${esc(p.abstract)}</p>` : ''}
                <div class="pm-links">${(p.links || []).map(l => `<a class="b-ink" href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)}</a>`).join('')}</div>
            </div>
        </article>`).join('');
}

// ---- marquee ---------------------------------------------------------
function buildMarquee(el, projects, reverse) {
    if (!el) return;
    const order = projects.map((p, i) => ({ p, i }));
    if (reverse) order.reverse();
    const tile = ({ p, i }) => `
        <button class="m-tile" type="button" data-idx="${i}" aria-label="Open ${esc(p.title)}">
            <img src="${esc(p.image)}" alt="${esc(p.title)}" data-fb>
            <span class="m-cap"><b>${esc(p.title)}</b><small>${esc(p.category || '')}</small></span>
        </button>`;
    const one = order.map(tile).join('');
    el.innerHTML = `<div class="m-track">${one}</div>`;
    const track = el.firstElementChild;
    const first = track.firstElementChild;
    const gap = parseFloat(getComputedStyle(track).columnGap) || 18;
    const unit = order.length * (first.getBoundingClientRect().width + gap);
    const reps = Math.max(1, Math.ceil((window.innerWidth * 1.2) / unit));
    const half = one.repeat(reps);
    track.innerHTML = half + half;
    track.style.animationDuration = Math.max(20, (reps * unit) / 42) + 's'; // about 42px per second
    $$('.m-tile', track).slice(order.length * reps).forEach(t => { t.tabIndex = -1; t.setAttribute('aria-hidden', 'true'); });
    return track;
}

function renderMarquees(projects) {
    if (!$('#marquee-1')) return;
    buildMarquee($('#marquee-1'), projects, false);
    buildMarquee($('#marquee-2'), projects, true);
    [$('#marquee-1'), $('#marquee-2')].forEach(m => m.addEventListener('click', e => {
        const t = e.target.closest('.m-tile');
        if (t) openProject(projects, Number(t.dataset.idx));
    }));
}

// ---- projects page ---------------------------------------------------
function renderProjectsPage(projects) {
    const grid = $('#project-grid'), bar = $('#filters');
    if (!grid || !bar) return;
    const cats = ['All', ...new Set(projects.map(p => p.category).filter(Boolean))];
    bar.innerHTML = cats.map((c, i) => `<button type="button" class="f-btn${i ? '' : ' active'}" data-cat="${esc(c)}">${esc(c)}</button>`).join('');
    let shown = projects;
    const draw = cat => {
        shown = projects.filter(p => cat === 'All' || p.category === cat);
        grid.innerHTML = shown.map((p, i) => `
            <div class="col-md-6 col-lg-4" data-anim="wipe-up" style="--d:${(i % 3) * 110}ms">
                <button type="button" class="p-card" data-idx="${i}" aria-label="Open ${esc(p.title)}">
                    <span class="p-thumb"><img src="${esc(p.image)}" alt="${esc(p.title)}" loading="lazy" data-fb>${p.category ? `<span class="cat">${esc(p.category)}</span>` : ''}</span>
                    <span class="p-body"><h3>${esc(p.title)}</h3><p>${esc(p.short)}</p><span class="p-more">View details</span></span>
                </button>
            </div>`).join('');
        watch(grid);
    };
    bar.addEventListener('click', e => {
        const b = e.target.closest('.f-btn');
        if (!b) return;
        $$('.f-btn', bar).forEach(x => x.classList.remove('active'));
        b.classList.add('active');
        draw(b.dataset.cat);
    });
    grid.addEventListener('click', e => {
        const c = e.target.closest('.p-card');
        if (c) openProject(shown, Number(c.dataset.idx));
    });
    draw('All');
}

// ---- project popup (shared by the home marquee and the projects page) -
let pmEl = null, pmModal = null, pmList = [], pmIdx = 0;

function ensureModal() {
    if (pmEl) return;
    document.body.insertAdjacentHTML('beforeend', `
    <div class="modal fade" id="projectModal" tabindex="-1" aria-labelledby="pm-title" aria-hidden="true">
        <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div class="modal-content pm">
                <button type="button" class="pm-close" data-bs-dismiss="modal" aria-label="Close"><i class="fa-solid fa-xmark"></i></button>
                <div class="pm-img" id="pm-img"><img id="pm-image" alt="" data-fb></div>
                <div class="modal-body pm-body">
                    <div class="pm-cat" id="pm-cat"></div>
                    <h3 id="pm-title"></h3>
                    <div id="pm-tags"></div>
                    <p id="pm-desc" class="mt-3"></p>
                    <ul id="pm-highlights"></ul>
                    <div class="pm-links" id="pm-links"></div>
                </div>
                <div class="pm-foot">
                    <button type="button" id="pm-prev"><i class="fa-solid fa-chevron-left me-2"></i>Previous</button>
                    <span id="pm-count"></span>
                    <button type="button" id="pm-next">Next<i class="fa-solid fa-chevron-right ms-2"></i></button>
                </div>
            </div>
        </div>
    </div>`);
    pmEl = $('#projectModal');
    pmModal = new bootstrap.Modal(pmEl);
    $('#pm-prev').addEventListener('click', () => fillProject(pmIdx - 1));
    $('#pm-next').addEventListener('click', () => fillProject(pmIdx + 1));
    document.addEventListener('keydown', e => {
        if (!pmEl.classList.contains('show')) return;
        if (e.key === 'ArrowLeft') fillProject(pmIdx - 1);
        if (e.key === 'ArrowRight') fillProject(pmIdx + 1);
    });
}

function fillProject(i) {
    pmIdx = (i + pmList.length) % pmList.length;
    const p = pmList[pmIdx];
    const content = $('.pm', pmEl);
    $('#pm-img').classList.remove('noimg');
    const img = $('#pm-image');
    img.src = p.image; img.alt = p.title;
    $('#pm-cat').textContent = [p.category, p.date].filter(Boolean).join(', ');
    $('#pm-title').textContent = p.title;
    $('#pm-tags').innerHTML = (p.tags || []).map(t => `<span class="tag">${esc(t)}</span>`).join('');
    $('#pm-desc').textContent = p.description || p.short || '';
    $('#pm-highlights').innerHTML = (p.highlights || []).map(h => `<li>${esc(h)}</li>`).join('');
    $('#pm-links').innerHTML = (p.links || []).filter(l => l.url && l.url !== '#').map(l =>
        `<a class="b-ink" href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)}</a>`).join('');
    $('#pm-count').textContent = `${pmIdx + 1} of ${pmList.length}`;
    content.classList.remove('swap'); void content.offsetWidth; content.classList.add('swap');
}

function openProject(list, idx) {
    ensureModal();
    pmList = list;
    fillProject(idx);
    pmModal.show();
}

// ---------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', async () => {
    const yr = $('#year'); if (yr) yr.textContent = new Date().getFullYear();
    enterPage();
    runLoader();
    initScrollUI();
    watch();

    let words = ['simulation', 'robotics', 'deep learning', 'smart materials'];
    try {
        const [site, projects] = await Promise.all([loadJSON('data/site-data.json'), loadJSON('data/projects.json')]);
        if (site.typedWords && site.typedWords.length) words = site.typedWords;
        renderAbout(site, projects);
        renderExperience(site);
        renderResearch(site);
        renderContact(site);
        renderPublications(site);
        renderMarquees(projects);
        renderProjectsPage(projects);
        watch();
        // arriving with #section from another page: the content was not there yet, so jump now
        if (location.hash.length > 1) {
            const t = document.getElementById(decodeURIComponent(location.hash.slice(1)));
            if (t) window.scrollTo(0, t.getBoundingClientRect().top + window.scrollY);
        }
    } catch (err) {
        showFatal(err);
    }
    startTyping(words);
});
