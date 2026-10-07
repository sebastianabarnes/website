/* Sebastian Barnes — site script (no dependencies) */

/* ---- Klaviyo settings -------------------------------------------------
   Both values are public and safe to ship in the page.
   PUBLIC_KEY: Klaviyo → Settings → API keys → Public API key (6 chars)
   LIST_ID:    Klaviyo → Lists & segments → your newsletter list → the ID in the URL
   ----------------------------------------------------------------------- */
const KLAVIYO = {
  PUBLIC_KEY: 'TdbedK',
  LIST_ID: 'XRnPF2',
  REVISION: '2024-10-15',
  CONTACT_METRIC: 'Contact Form Submitted',
};

/* ---- Mobile nav ---- */
(function () {
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.getElementById('site-nav');
  if (!toggle || !nav) return;

  function setOpen(open) {
    nav.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }
  toggle.addEventListener('click', function () {
    setOpen(toggle.getAttribute('aria-expanded') !== 'true');
  });
  nav.addEventListener('click', function (e) {
    if (e.target.closest('a')) setOpen(false);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') setOpen(false);
  });
  window.matchMedia('(min-width: 761px)').addEventListener('change', function (mq) {
    if (mq.matches) setOpen(false);
  });
})();

/* ---- Footer year ---- */
document.getElementById('year').textContent = new Date().getFullYear();

/* ---- Newsletter form → Klaviyo ---- */
(function () {
  const form = document.getElementById('newsletter-form');
  if (!form) return;
  const success = document.querySelector('.form-success');
  const errorEl = form.querySelector('.form-error');
  const submitBtn = form.querySelector('button[type="submit"]');
  const loadedAt = Date.now();

  function showSuccess() {
    form.hidden = true;
    success.hidden = false;
  }
  function showError(msg) {
    errorEl.textContent = msg;
    errorEl.hidden = false;
  }

  success.querySelector('[data-reset]').addEventListener('click', function () {
    form.reset();
    errorEl.hidden = true;
    success.hidden = true;
    form.hidden = false;
  });

  function klaviyo(path, data) {
    return fetch('https://a.klaviyo.com/client/' + path + '/?company_id=' + KLAVIYO.PUBLIC_KEY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', revision: KLAVIYO.REVISION },
      body: JSON.stringify({ data: data }),
    }).then(function (res) {
      if (!res.ok) throw new Error('Klaviyo ' + path + ' returned ' + res.status);
    });
  }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    errorEl.hidden = true;

    // Bot checks: filled honeypot or a submit under 2s → pretend success, send nothing.
    if (form.website.value || Date.now() - loadedAt < 2000) {
      showSuccess();
      return;
    }

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    if (!KLAVIYO.PUBLIC_KEY || !KLAVIYO.LIST_ID) {
      showError('The newsletter signup isn’t connected yet. Please check back soon.');
      console.warn('Klaviyo PUBLIC_KEY is not set in js/main.js');
      return;
    }

    const profile = {
      type: 'profile',
      attributes: {
        email: form.email.value.trim(),
      },
    };

    submitBtn.disabled = true;
    submitBtn.textContent = 'Subscribing…';
    try {
      await klaviyo('subscriptions', {
        type: 'subscription',
        attributes: { profile: { data: profile } },
        relationships: { list: { data: { type: 'list', id: KLAVIYO.LIST_ID } } },
      });
      showSuccess();
    } catch (err) {
      console.error(err);
      showError('Something went wrong subscribing. Please try again in a moment.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Subscribe';
    }
  });
})();
