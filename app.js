/**
 * ACWS: African & Caribbean Wedding Show
 * Client Application Logic & State Management
 * Modeled after Asian Bridal Fest UK interaction architecture
 * Event Date: Sunday, 7th March 2027 · St John's Church, Hyde Park, London
 */

document.addEventListener('DOMContentLoaded', () => {
  initCountdownTimer();
  initNavigation();
  initVenueMap();
  initModalDialogs();
  initFormsAndValidation();
});

/* ==========================================================================
   1. LIVE COUNTDOWN TIMER (March 7, 2027, 12:00 PM GMT)
   ========================================================================== */
function initCountdownTimer() {
  const targetDate = new Date('2027-03-07T12:00:00Z').getTime();

  const daysEl = document.getElementById('timer-days');
  const hoursEl = document.getElementById('timer-hours');
  const minutesEl = document.getElementById('timer-minutes');
  const secondsEl = document.getElementById('timer-seconds');

  if (!daysEl || !hoursEl || !minutesEl || !secondsEl) return;

  function updateTimer() {
    const now = new Date().getTime();
    const distance = targetDate - now;

    if (distance <= 0) {
      daysEl.textContent = '00';
      hoursEl.textContent = '00';
      minutesEl.textContent = '00';
      secondsEl.textContent = '00';
      return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    daysEl.textContent = String(days).padStart(2, '0');
    hoursEl.textContent = String(hours).padStart(2, '0');
    minutesEl.textContent = String(minutes).padStart(2, '0');
    secondsEl.textContent = String(seconds).padStart(2, '0');
  }

  updateTimer();
  setInterval(updateTimer, 1000);
}

/* ==========================================================================
   2. STICKY NAVIGATION & MOBILE DRAWER
   ========================================================================== */
function initNavigation() {
  const header = document.querySelector('.header');
  const toggleBtn = document.getElementById('navToggle');
  const nav = document.getElementById('primaryNav');

  if (header) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 40) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    }, { passive: true });
  }

  if (toggleBtn && nav) {
    const closeMenu = () => {
      toggleBtn.setAttribute('aria-expanded', 'false');
      nav.classList.remove('open');
      document.body.classList.remove('menu-open');
      toggleBtn.textContent = '☰';
    };

    toggleBtn.addEventListener('click', () => {
      const isExpanded = toggleBtn.getAttribute('aria-expanded') === 'true';
      toggleBtn.setAttribute('aria-expanded', String(!isExpanded));
      nav.classList.toggle('open');
      document.body.classList.toggle('menu-open', !isExpanded);
      toggleBtn.textContent = isExpanded ? '☰' : '✕';
    });

    // Close mobile drawer when clicking navigation links
    nav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', closeMenu);
    });

    // Close on Escape key
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && nav.classList.contains('open')) {
        closeMenu();
      }
    });
  }
}

/* ==========================================================================
   3. CLICK-TO-LOAD VENUE MAP (Privacy & Fast Loading)
   ========================================================================== */
function initVenueMap() {
  const mapContainer = document.getElementById('venueMap');
  if (!mapContainer) return;

  mapContainer.addEventListener('click', (e) => {
    if (!e.target.closest('[data-load-map]')) return;

    const iframe = document.createElement('iframe');
    iframe.src = mapContainer.dataset.src;
    iframe.title = "Map showing St John's Church, Hyde Park Crescent, London W2 2QD";
    iframe.loading = 'lazy';
    iframe.referrerPolicy = 'no-referrer-when-downgrade';
    iframe.allowFullscreen = true;

    mapContainer.appendChild(iframe);
    mapContainer.classList.remove('is-idle');
    mapContainer.classList.add('is-loaded');
  });
}

/* ==========================================================================
   4. MODAL DIALOGS (Attendee Tickets & Exhibitor Stand Application)
   ========================================================================== */
let attendeeModal, vendorModal;

function initModalDialogs() {
  attendeeModal = document.getElementById('attendee-modal');
  vendorModal = document.getElementById('vendor-modal');

  // Trigger buttons: Attendee Modal
  document.querySelectorAll('.open-attendee-modal').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const tier = btn.getAttribute('data-tier');
      openAttendeeModal(tier);
    });
  });

  // Trigger buttons: Vendor Modal
  document.querySelectorAll('.open-vendor-modal').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openVendorModal();
    });
  });

  // Close buttons with [data-close-modal]
  document.querySelectorAll('[data-close-modal]').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-close-modal');
      const dialog = document.getElementById(targetId);
      if (dialog && typeof dialog.close === 'function') {
        dialog.close();
      }
    });
  });

  // Click outside to close
  [attendeeModal, vendorModal].forEach(dialog => {
    if (dialog) {
      dialog.addEventListener('click', (e) => {
        if (e.target === dialog && typeof dialog.close === 'function') {
          dialog.close();
        }
      });
    }
  });
}

function openAttendeeModal(tier = null) {
  if (!attendeeModal) return;

  if (tier) {
    const tierSelect = document.getElementById('att-ticket-type');
    if (tierSelect) {
      tierSelect.value = tier;
    }
  }

  if (typeof attendeeModal.showModal === 'function') {
    attendeeModal.showModal();
  } else {
    attendeeModal.setAttribute('open', '');
  }

  const firstInput = document.getElementById('att-full-name');
  if (firstInput) firstInput.focus();
}

function openVendorModal() {
  if (!vendorModal) return;

  if (typeof vendorModal.showModal === 'function') {
    vendorModal.showModal();
  } else {
    vendorModal.setAttribute('open', '');
  }

  const firstInput = document.getElementById('vnd-business-name');
  if (firstInput) firstInput.focus();
}

/* ==========================================================================
   5. FORM VALIDATION & CONFIRMATION
   ========================================================================== */
function initFormsAndValidation() {
  const attendeeForm = document.getElementById('attendee-form');
  if (attendeeForm) {
    attendeeForm.addEventListener('submit', handleAttendeeSubmit);
  }

  const vendorForm = document.getElementById('vendor-form');
  if (vendorForm) {
    vendorForm.addEventListener('submit', handleVendorSubmit);
  }
}

function handleAttendeeSubmit(e) {
  e.preventDefault();
  const form = e.target;
  let isValid = true;

  clearErrors(['att-full-name', 'att-email', 'att-phone', 'att-ticket-type']);

  const nameInput = document.getElementById('att-full-name');
  const emailInput = document.getElementById('att-email');
  const phoneInput = document.getElementById('att-phone');
  const ticketInput = document.getElementById('att-ticket-type');

  if (!nameInput.value.trim()) {
    showFieldError('att-full-name', 'Please provide your full name');
    isValid = false;
  }

  if (!isValidEmail(emailInput.value.trim())) {
    showFieldError('att-email', 'Please enter a valid email address');
    isValid = false;
  }

  if (!phoneInput.value.trim() || phoneInput.value.trim().length < 7) {
    showFieldError('att-phone', 'Please enter a valid contact phone number');
    isValid = false;
  }

  if (!ticketInput.value) {
    showFieldError('att-ticket-type', 'Please select your ticket package');
    isValid = false;
  }

  if (!isValid) return;

  const registrantName = nameInput.value.trim();
  const ticketChoice = ticketInput.options[ticketInput.selectedIndex].text;
  const registrantEmail = emailInput.value.trim();

  // Capture user location snapshot
  const locationData = window.ACWSLocationService ? window.ACWSLocationService.getCurrentCached() : null;
  // Capture user device diagnostics
  const deviceInfo = window.ACWSDeviceDetector ? window.ACWSDeviceDetector.getDeviceInfo() : null;

  try {
    const existing = JSON.parse(localStorage.getItem('acws_attendee_modal_registrations') || '[]');
    existing.push({
      fullName: registrantName,
      email: registrantEmail,
      phone: phoneInput.value.trim(),
      ticketType: ticketChoice,
      locationData: locationData && locationData.latitude != null ? {
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        city: locationData.city || '',
        country: locationData.country || '',
        source: locationData.source || 'ip'
      } : null,
      deviceInfo: deviceInfo || null,
      submittedAt: new Date().toISOString()
    });
    localStorage.setItem('acws_attendee_modal_registrations', JSON.stringify(existing));
  } catch (err) {
    // Storage unavailable
  }

  form.reset();
  if (attendeeModal && typeof attendeeModal.close === 'function') {
    attendeeModal.close();
  }

  showToast(
    '🎉 Ticket Registration Confirmed',
    `Thank you, ${registrantName}! Your reservation for ${ticketChoice} at St John's Church has been recorded. Confirmation sent to ${registrantEmail}.`
  );
}

function handleVendorSubmit(e) {
  e.preventDefault();
  const form = e.target;
  let isValid = true;

  clearErrors(['vnd-business-name', 'vnd-category', 'vnd-contact-name', 'vnd-email', 'vnd-phone', 'vnd-booth-pref']);

  const businessInput = document.getElementById('vnd-business-name');
  const categoryInput = document.getElementById('vnd-category');
  const contactInput = document.getElementById('vnd-contact-name');
  const emailInput = document.getElementById('vnd-email');
  const phoneInput = document.getElementById('vnd-phone');
  const boothInput = document.getElementById('vnd-booth-pref');

  if (!businessInput.value.trim()) {
    showFieldError('vnd-business-name', 'Please enter your brand or business name');
    isValid = false;
  }

  if (!categoryInput.value) {
    showFieldError('vnd-category', 'Please select your vendor category');
    isValid = false;
  }

  if (!contactInput.value.trim()) {
    showFieldError('vnd-contact-name', 'Please provide a primary contact name');
    isValid = false;
  }

  if (!isValidEmail(emailInput.value.trim())) {
    showFieldError('vnd-email', 'Please enter a valid business email');
    isValid = false;
  }

  if (!phoneInput.value.trim() || phoneInput.value.trim().length < 7) {
    showFieldError('vnd-phone', 'Please enter a phone number');
    isValid = false;
  }

  if (!boothInput.value) {
    showFieldError('vnd-booth-pref', 'Please select your preferred package');
    isValid = false;
  }

  if (!isValid) return;

  const brandName = businessInput.value.trim();

  // Capture user location snapshot
  const locationData = window.ACWSLocationService ? window.ACWSLocationService.getCurrentCached() : null;
  // Capture user device diagnostics
  const deviceInfo = window.ACWSDeviceDetector ? window.ACWSDeviceDetector.getDeviceInfo() : null;

  try {
    const existing = JSON.parse(localStorage.getItem('acws_vendor_modal_applications') || '[]');
    existing.push({
      businessName: brandName,
      contactName: contactInput.value.trim(),
      email: emailInput.value.trim(),
      phone: phoneInput.value.trim(),
      category: categoryInput.value,
      package: boothInput.options[boothInput.selectedIndex].text,
      locationData: locationData && locationData.latitude != null ? {
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        city: locationData.city || '',
        country: locationData.country || '',
        source: locationData.source || 'ip'
      } : null,
      deviceInfo: deviceInfo || null,
      submittedAt: new Date().toISOString()
    });
    localStorage.setItem('acws_vendor_modal_applications', JSON.stringify(existing));
  } catch (err) {
    // Storage unavailable
  }

  form.reset();
  if (vendorModal && typeof vendorModal.close === 'function') {
    vendorModal.close();
  }

  showToast(
    '✨ Exhibitor Application Received',
    `Thank you, ${brandName}! Our curation team will review your application and respond within 48 hours.`
  );
}

/* Helpers */
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function showFieldError(fieldId, errorMsg) {
  const field = document.getElementById(fieldId);
  const errContainer = document.getElementById(`err-${fieldId}`);
  if (field) field.style.borderColor = '#E8A08F';
  if (errContainer) errContainer.textContent = errorMsg;
}

function clearErrors(fieldIds) {
  fieldIds.forEach(id => {
    const field = document.getElementById(id);
    const errContainer = document.getElementById(`err-${id}`);
    if (field) field.style.borderColor = '';
    if (errContainer) errContainer.textContent = '';
  });
}

/* ==========================================================================
   6. TOAST NOTIFICATION SYSTEM
   ========================================================================== */
function showToast(title, message) {
  const container = document.getElementById('toast-stack');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast-message';
  toast.setAttribute('role', 'alert');

  toast.innerHTML = `
    <div class="toast-icon">✦</div>
    <div class="toast-content">
      <strong>${title}</strong>
      <p>${message}</p>
    </div>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.transition = 'all 0.35s ease-out';
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => {
      if (toast.parentNode === container) {
        container.removeChild(toast);
      }
    }, 350);
  }, 5000);
}
