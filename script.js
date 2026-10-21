const root = document.documentElement;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
root.classList.add('js');

// Hero entrance once fonts are ready (avoids a reflow mid-animation)
const start = () => requestAnimationFrame(() => root.classList.add('loaded'));
if (document.fonts && document.fonts.ready) {
  Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 600))]).then(start);
} else {
  start();
}

// Grey placeholder stays visible until real photos are added to assets/images
document.querySelectorAll('.media img').forEach((img) => {
  const markMissing = () => img.classList.add('missing');
  if (img.complete && img.naturalWidth === 0) markMissing();
  img.addEventListener('error', markMissing);
});

// Mobile navigation
const toggle = document.querySelector('.nav-toggle');
const menu = document.getElementById('nav-menu');
const setMenu = (open) => {
  toggle.setAttribute('aria-expanded', String(open));
  toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  menu.classList.toggle('open', open);
};
toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
menu.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

// Header shadow after scrolling
const header = document.querySelector('.site-header');

// Mission statement: split into words that light up as you scroll through it
const missionText = document.querySelector('[data-split]');
let words = [];
if (missionText && !reduceMotion) {
  missionText.setAttribute('aria-label', missionText.textContent.trim());
  missionText.innerHTML = missionText.textContent.trim().split(/\s+/)
    .map((w) => `<span class="word" aria-hidden="true">${w}</span>`).join(' ');
  words = [...missionText.querySelectorAll('.word')];
}

// Scroll-linked effects, batched into one rAF per frame
const parallax = [...document.querySelectorAll('[data-parallax]')];
let ticking = false;
function onScroll() {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    const vh = window.innerHeight;
    header.classList.toggle('scrolled', window.scrollY > 8);

    if (!reduceMotion) {
      parallax.forEach((el) => {
        const r = el.getBoundingClientRect();
        const progress = (r.top + r.height / 2 - vh / 2) / vh; // -1 .. 1 around viewport centre
        const dir = Number(el.dataset.parallax);
        const rot = getComputedStyle(el).getPropertyValue('--rot');
        el.style.transform = `translateY(${progress * (window.innerWidth < 860 ? 16 : 60) * dir}px) rotate(calc(${rot} + ${progress * 6 * dir}deg))`;
      });

      if (words.length) {
        const r = missionText.getBoundingClientRect();
        const progress = Math.min(1, Math.max(0, (vh * 0.85 - r.top) / (r.height + vh * 0.35)));
        const lit = Math.round(progress * words.length);
        words.forEach((w, i) => w.classList.toggle('on', i < lit));
      }
    }
    ticking = false;
  });
}
window.addEventListener('scroll', onScroll, { passive: true });
window.addEventListener('resize', onScroll);
onScroll();

// Count-up numbers
function countUp(el) {
  const target = parseFloat(el.dataset.count);
  const decimals = Number(el.dataset.decimals || 0);
  if (reduceMotion) { el.textContent = target.toFixed(decimals); return; }
  const duration = 1400;
  const t0 = performance.now();
  const step = (now) => {
    const t = Math.min(1, (now - t0) / duration);
    const eased = 1 - Math.pow(1 - t, 3);
    el.textContent = (target * eased).toFixed(decimals);
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

// Scroll reveal with per-group stagger
const revealEls = document.querySelectorAll('[data-reveal]');
revealEls.forEach((el) => {
  const siblings = [...el.parentElement.children].filter((c) => c.hasAttribute('data-reveal'));
  el.style.setProperty('--delay', `${(siblings.indexOf(el) % 3) * 80 + Math.floor(siblings.indexOf(el) / 3) * 40}ms`);
});

if ('IntersectionObserver' in window && !reduceMotion) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('in');
      entry.target.querySelectorAll('[data-count]').forEach(countUp);
      io.unobserve(entry.target);
    });
  }, { threshold: 0.18, rootMargin: '0px 0px -40px 0px' });
  revealEls.forEach((el) => io.observe(el));
} else {
  revealEls.forEach((el) => el.classList.add('in'));
  document.querySelectorAll('[data-count]').forEach(countUp);
}
