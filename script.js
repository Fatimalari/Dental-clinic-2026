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

// Header border once the page scrolls
const header = document.querySelector('.site-header');
const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 8);
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// Fade content in as it enters the viewport
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
    .querySelectorAll('.service-card, .feature, .quote, .team-card, .post-card, .service-row, .float-card, .value, .step, .contact-item')
    .forEach((el) => { el.classList.add('reveal'); observer.observe(el); });
}

// Simple client-side validation. Forms don't send anywhere yet: connect them to
// a backend such as Formspree, Netlify Forms or your practice-management system.
function handleForm(form, successMessage) {
  if (!form) return;
  const status = form.querySelector('.form-status');

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
      status.textContent = 'Please check the highlighted fields.';
      status.classList.add('error');
      firstInvalid.focus();
      return;
    }

    status.textContent = successMessage(form);
    status.classList.add('success');
    form.reset();
  });

  form.addEventListener('input', (e) => {
    if (e.target.classList.contains('invalid') && e.target.checkValidity()) {
      e.target.classList.remove('invalid');
      e.target.setAttribute('aria-invalid', 'false');
    }
  });
}

const booking = document.getElementById('book');
if (booking && booking.elements.date) {
  booking.elements.date.min = new Date().toISOString().split('T')[0];
}
handleForm(booking, (f) => {
  const first = f.elements.name.value.trim().split(' ')[0];
  return `Thanks, ${first}! We'll be in touch within one business day to confirm your appointment.`;
});
handleForm(document.getElementById('newsletter-form'), () => "You're subscribed. Watch your inbox for smile tips!");

// Blog category filter
const filters = document.querySelectorAll('.filter-btn');
filters.forEach((btn) => {
  btn.addEventListener('click', () => {
    const category = btn.dataset.filter;
    filters.forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
    document.querySelectorAll('.post-card[data-category]').forEach((card) => {
      card.hidden = category !== 'all' && card.dataset.category !== category;
    });
  });
});

document.querySelectorAll('.year').forEach((el) => { el.textContent = new Date().getFullYear(); });
