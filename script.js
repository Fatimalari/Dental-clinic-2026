const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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
    section.classList.toggle('stack', section.offsetHeight <= vh + 1);
  });
}
layoutStack();
window.addEventListener('resize', layoutStack);
window.addEventListener('load', layoutStack);

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
  header.classList.toggle('on-dark', current.classList.contains('book'));
  navAnchors.forEach((a) => a.setAttribute('aria-current', String(a.getAttribute('href') === '#' + current.id)));
}
window.addEventListener('scroll', updateHeader, { passive: true });
window.addEventListener('resize', updateHeader);
updateHeader();

// Technology list: underline slides to the hovered / selected item
const techList = document.querySelector('.tech-list');
if (techList) {
  const buttons = [...techList.querySelectorAll('button')];
  const indicator = techList.querySelector('.tech-indicator');
  const moveTo = (btn) => {
    const li = btn.parentElement;
    indicator.style.transform = `translateY(${li.offsetTop + li.offsetHeight - 1}px)`;
  };
  const active = () => buttons.find((b) => b.getAttribute('aria-pressed') === 'true') || buttons[0];

  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      buttons.forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
      moveTo(btn);
    });
    btn.addEventListener('mouseenter', () => moveTo(btn));
    btn.addEventListener('focus', () => moveTo(btn));
  });
  techList.addEventListener('mouseleave', () => moveTo(active()));
  window.addEventListener('resize', () => moveTo(active()));
  moveTo(active());
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
