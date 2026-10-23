const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (reduceMotion) document.documentElement.classList.add('reduce');
document.documentElement.classList.add('js');

// Grey placeholder stays visible until real photos are added to assets/images
document.querySelectorAll('.media img').forEach((img) => {
  const markMissing = () => img.classList.add('missing');
  if (img.complete && img.naturalWidth === 0) markMissing();
  img.addEventListener('error', markMissing);
});

// Count-up numbers
function countUp(el) {
  const target = Number(el.dataset.count);
  const suffix = el.dataset.suffix || '';
  if (reduceMotion) { el.textContent = target + suffix; return; }
  const duration = 1300;
  const t0 = performance.now();
  const step = (now) => {
    const t = Math.min(1, (now - t0) / duration);
    el.textContent = Math.round(target * (1 - Math.pow(1 - t, 3))) + suffix;
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

// Scroll reveal, staggered within each group of siblings
const revealEls = [...document.querySelectorAll('[data-reveal]')];
revealEls.forEach((el) => {
  const group = [...el.parentElement.children].filter((c) => c.hasAttribute('data-reveal'));
  el.style.setProperty('--delay', `${group.indexOf(el) * 90}ms`);
});

if ('IntersectionObserver' in window && !reduceMotion) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('in');
      entry.target.querySelectorAll('[data-count]').forEach(countUp);
      io.unobserve(entry.target);
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
  revealEls.forEach((el) => io.observe(el));
} else {
  revealEls.forEach((el) => el.classList.add('in'));
}

// Stacking scroll: later sections sit on top, and each section that fits on
// one screen pins at the top so the next one slides up over it
const sections = [...document.querySelectorAll('main > section')];
function layoutStack() {
  const vh = window.innerHeight;
  sections.forEach((section, i) => {
    section.style.zIndex = String(i + 1);
    // only the hero pins; About slides over it and later sections scroll normally
    section.classList.toggle('stack', i === 0 && section.offsetHeight <= vh + 1);
  });
}
layoutStack();
window.addEventListener('resize', layoutStack);
window.addEventListener('load', layoutStack);

// About: while the pinned About screen is held, grow the team photo from its
// frame to cover the whole screen, fading the heading and button out
const missionTrack = document.querySelector('.mission-track');
const missionScreen = missionTrack.querySelector('.mission');
const missionFrame = missionTrack.querySelector('.mission-frame');
const missionMedia = missionTrack.querySelector('.mission-media');
const missionFade = [...missionScreen.querySelectorAll('.mission-title, .btn')];
const teamLabels = [...missionMedia.querySelectorAll('.team-labels li')];
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const lerp = (a, b, t) => a + (b - a) * t;

function updateMission() {
  const vh = window.innerHeight;
  // the pinned screen stops at the white gap at the bottom of the track
  const travel = missionTrack.offsetHeight - parseFloat(getComputedStyle(missionTrack).paddingBottom) - vh;
  const scrolled = -missionTrack.getBoundingClientRect().top;
  // fully grown at 80% of the way through, then held briefly before moving on
  const t = ease(Math.min(1, Math.max(0, scrolled / (travel * 0.8))));
  const p = reduceMotion ? 0 : t;

  // frame position relative to the pinned screen (the screen is a .container,
  // so the full-screen target starts left of it by the page gutter)
  const screenRect = missionScreen.getBoundingClientRect();
  const frame = missionFrame.getBoundingClientRect();
  const start = { top: frame.top - screenRect.top, left: frame.left - screenRect.left, width: frame.width, height: frame.height };
  const end = { top: 0, left: -screenRect.left, width: window.innerWidth, height: vh };

  missionMedia.style.setProperty('--m-top', lerp(start.top, end.top, p) + 'px');
  missionMedia.style.setProperty('--m-left', lerp(start.left, end.left, p) + 'px');
  missionMedia.style.setProperty('--m-width', lerp(start.width, end.width, p) + 'px');
  missionMedia.style.setProperty('--m-height', lerp(start.height, end.height, p) + 'px');
  missionFade.forEach((el) => { el.style.opacity = p > 0 ? String(Math.max(0, 1 - p * 2.5)) : ''; });

  // names appear once the photo fills the screen; each label is pinned to its
  // spot on the photo, following the same cover-crop the image uses
  const w = lerp(start.width, end.width, p);
  const h = lerp(start.height, end.height, p);
  const img = missionMedia.querySelector('img');
  const ratio = (img.naturalWidth && img.naturalHeight) ? img.naturalWidth / img.naturalHeight : 1500 / 841;
  const scale = Math.max(w / ratio, h);
  const rw = scale * ratio;
  const rh = scale;
  teamLabels.forEach((label) => {
    const x = Number(label.dataset.x) * rw - (rw - w) / 2;
    const y = Number(label.dataset.y) * rh - (rh - h) / 2;
    label.style.left = x + 'px';
    label.style.top = y + 'px';
    // hide a name whose person is cropped off the edge (e.g. on phones)
    label.classList.toggle('off', x < 60 || x > w - 60);
  });
  missionMedia.classList.toggle('full', t >= 0.98);
}
let missionTicking = false;
const onMissionScroll = () => {
  if (missionTicking) return;
  missionTicking = true;
  requestAnimationFrame(() => { updateMission(); missionTicking = false; });
};
window.addEventListener('scroll', onMissionScroll, { passive: true });
window.addEventListener('resize', updateMission);
window.addEventListener('load', updateMission);
updateMission();

// Header: menu toggle on phones, smooth jumps to sections, white logo over
// the navy section, and highlight the link for the section on screen
const header = document.getElementById('site-header');
const navLinks = document.getElementById('nav-links');
const menuBtn = header.querySelector('.nav-menu-btn');
const setMenu = (open) => {
  menuBtn.setAttribute('aria-expanded', String(open));
  menuBtn.textContent = open ? 'Close' : 'Menu';
  navLinks.classList.toggle('open', open);
};
menuBtn.addEventListener('click', () => setMenu(menuBtn.getAttribute('aria-expanded') !== 'true'));
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
document.addEventListener('click', (e) => { if (!header.contains(e.target)) setMenu(false); });

// Pinned sections report their stuck position, so measure where each one
// starts in the page by adding up the heights of the sections before it
const sectionStart = (target) => {
  let y = 0;
  for (const section of sections) {
    if (section === target) return y;
    y += section.offsetHeight;
  }
  return y;
};
document.querySelectorAll('a[href^="#"]').forEach((link) => {
  const href = link.getAttribute('href');
  if (href.length < 2) return;
  const target = document.querySelector(href);
  if (!target || !sections.includes(target)) return;
  link.addEventListener('click', (e) => {
    e.preventDefault();
    setMenu(false);
    window.scrollTo({ top: sectionStart(target), behavior: reduceMotion ? 'auto' : 'smooth' });
    history.replaceState(null, '', link.getAttribute('href'));
  });
});

const navAnchors = [...navLinks.querySelectorAll('a')];
function updateHeader() {
  const probe = header.offsetHeight / 2;
  // the section drawn under the header is the last one whose top has reached it
  let current = sections[0];
  sections.forEach((section) => { if (section.getBoundingClientRect().top <= probe) current = section; });
  header.classList.toggle('on-dark', current.classList.contains('book') || current.classList.contains('hero'));
  navAnchors.forEach((a) => a.setAttribute('aria-current', String(a.getAttribute('href') === '#' + current.id)));
}
window.addEventListener('scroll', updateHeader, { passive: true });
window.addEventListener('resize', updateHeader);
updateHeader();

// Hero video: pause/play button; start paused for visitors who ask for less motion
const heroVideo = document.querySelector('.hero-video video');
const videoToggle = document.querySelector('.video-toggle');
if (heroVideo && videoToggle) {
  const setPaused = (paused) => {
    if (paused) heroVideo.pause(); else heroVideo.play().catch(() => {});
    videoToggle.classList.toggle('paused', paused);
    videoToggle.setAttribute('aria-label', paused ? 'Play background video' : 'Pause background video');
  };
  videoToggle.addEventListener('click', () => setPaused(!heroVideo.paused));
  if (reduceMotion) { heroVideo.removeAttribute('autoplay'); setPaused(true); }
}

// Services: while the pinned screen is held, open one service at a time and
// slide each photo up over the previous one, in step with the list
const svcTrack = document.querySelector('.services-track');
if (svcTrack) {
  const svcItems = [...svcTrack.querySelectorAll('.svc-item')];
  const svcImages = [...svcTrack.querySelectorAll('.svc-media')];
  const svcSteps = svcItems.length - 1;
  const svcDwell = (f) => { const x = Math.min(1, Math.max(0, (f - 0.25) / 0.5)); return x * x * (3 - 2 * x); };
  const svcTravel = () => svcTrack.offsetHeight - window.innerHeight;

  // clicking a service title scrolls to the point where it is open
  svcItems.forEach((item, i) => {
    item.querySelector('.svc-title').addEventListener('click', () => {
      if (reduceMotion) return;
      const top = sectionStart(svcTrack) + svcTravel() * (i / svcSteps) + 1;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });

  if (!reduceMotion) {
    let svcTicking = false;
    const updateServices = () => {
      const progress = Math.min(1, Math.max(0, -svcTrack.getBoundingClientRect().top / svcTravel()));
      const raw = progress * svcSteps;
      const step = Math.min(svcSteps, Math.floor(raw));
      const pos = step + (step < svcSteps ? svcDwell(raw - step) : 0);
      const active = Math.round(pos);
      svcItems.forEach((item, i) => item.classList.toggle('is-active', i === active));
      svcImages.forEach((fig, i) => {
        // photo i slides up from the bottom as the list moves from i-1 to i
        const shown = i === 0 ? 1 : Math.min(1, Math.max(0, pos - (i - 1)));
        fig.style.clipPath = `inset(${((1 - shown) * 100).toFixed(2)}% 0 0 0)`;
        fig.classList.toggle('is-active', i === active);
      });
      svcTicking = false;
    };
    window.addEventListener('scroll', () => {
      if (svcTicking) return;
      svcTicking = true;
      requestAnimationFrame(updateServices);
    }, { passive: true });
    window.addEventListener('resize', updateServices);
    updateServices();
  }
}

// Technology: while the pinned screen is held, move the list up one item at a
// time; the item at the top is the active one and the image swaps to match
const techTrack = document.querySelector('.tech-track');
if (techTrack && !reduceMotion) {
  const techItems = [...techTrack.querySelectorAll('.tech-list li')];
  const techList = techTrack.querySelector('.tech-list');
  const techImages = [...techTrack.querySelectorAll('.tech-media')];
  const steps = techItems.length - 1;
  // each item rests for a moment before the next one slides up
  const dwell = (f) => { const x = Math.min(1, Math.max(0, (f - 0.3) / 0.4)); return x * x * (3 - 2 * x); };

  let techTicking = false;
  const updateTech = () => {
    const travel = techTrack.offsetHeight - window.innerHeight;
    const progress = Math.min(1, Math.max(0, -techTrack.getBoundingClientRect().top / travel));
    const raw = progress * steps;
    const step = Math.min(steps, Math.floor(raw));
    const pos = step + (step < steps ? dwell(raw - step) : 0);
    const itemH = techItems[0].offsetHeight;

    techList.style.transform = `translateY(${-pos * itemH}px)`;
    techItems.forEach((item, i) => {
      const d = i - pos;
      // items above the top fade away; the active one is solid; the rest wait, faded
      const opacity = d < 0 ? Math.max(0, 1 + d * 1.6) : 1 - Math.min(1, d) * 0.65;
      item.style.opacity = opacity.toFixed(3);
    });
    const active = Math.round(pos);
    techImages.forEach((img, i) => img.classList.toggle('is-active', i === active));
    techTicking = false;
  };
  window.addEventListener('scroll', () => {
    if (techTicking) return;
    techTicking = true;
    requestAnimationFrame(updateTech);
  }, { passive: true });
  window.addEventListener('resize', updateTech);
  updateTech();
}

// Booking form: client-side validation only. Connect it to a form service
// (e.g. Formspree, Netlify Forms) or the clinic's booking system to receive requests.
const form = document.getElementById('book-form');
if (form) {
  const status = form.querySelector('.form-status');
  const submit = form.querySelector('[type="submit"]');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    status.className = 'form-status';
    let firstInvalid = null;
    form.querySelectorAll('[required]').forEach((field) => {
      const valid = field.checkValidity();
      field.classList.toggle('invalid', !valid);
      field.setAttribute('aria-invalid', String(!valid));
      if (!valid && !firstInvalid) firstInvalid = field;
    });

    if (firstInvalid) {
      status.textContent = 'Please add your name, a valid email and a treatment.';
      status.classList.add('error');
      firstInvalid.focus();
      return;
    }

    submit.disabled = true;
    submit.textContent = 'Sending…';
    setTimeout(() => {
      const first = form.elements.name.value.trim().split(' ')[0];
      status.textContent = `Thank you, ${first}! We'll contact you shortly to confirm your appointment.`;
      form.reset();
      submit.disabled = false;
      submit.textContent = 'Book appointment';
    }, 700);
  });

  form.addEventListener('change', (e) => {
    if (e.target.classList.contains('invalid') && e.target.checkValidity()) {
      e.target.classList.remove('invalid');
      e.target.setAttribute('aria-invalid', 'false');
    }
  });
}
