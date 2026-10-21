// Mobile navigation
const toggle = document.querySelector('.nav-toggle');
const menu = document.getElementById('nav-menu');

toggle.addEventListener('click', () => {
  const open = toggle.getAttribute('aria-expanded') === 'true';
  toggle.setAttribute('aria-expanded', String(!open));
  toggle.setAttribute('aria-label', open ? 'Open menu' : 'Close menu');
  menu.classList.toggle('open', !open);
});

menu.addEventListener('click', (e) => {
  if (e.target.closest('a')) {
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open menu');
    menu.classList.remove('open');
  }
});

// Header shadow once the page scrolls
const header = document.querySelector('.site-header');
const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 8);
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// Fade sections in as they enter the viewport
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  document
    .querySelectorAll('.service-card, .stat-tile, .team-card, .review, .contact-card, .booking-form')
    .forEach((el) => { el.classList.add('reveal'); observer.observe(el); });
}

// Booking form: client-side validation only. Connect to a real backend
// (e.g. Formspree, Netlify Forms, or your practice-management system) to receive requests.
const form = document.getElementById('booking-form');
const status = form.querySelector('.form-status');
const dateInput = form.elements.date;
dateInput.min = new Date().toISOString().split('T')[0];

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
    status.textContent = 'Please fill in the highlighted fields.';
    status.classList.add('error');
    firstInvalid.focus();
    return;
  }

  const name = form.elements.name.value.trim().split(' ')[0];
  status.textContent = `Thanks, ${name}! We'll be in touch within one business day to confirm your appointment.`;
  status.classList.add('success');
  form.reset();
});

form.addEventListener('input', (e) => {
  if (e.target.classList.contains('invalid') && e.target.checkValidity()) {
    e.target.classList.remove('invalid');
    e.target.setAttribute('aria-invalid', 'false');
  }
});

document.getElementById('year').textContent = new Date().getFullYear();
