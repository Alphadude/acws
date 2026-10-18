/**
 * ACWS — Exhibitor & Vendor Registration Logic
 * Handles interactive pill groups, max-3 limits, validation,
 * UK GDPR consent compliance, and confirmation receipt generation.
 */

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('vendor-registration-form');
  if (!form) return;

  // --- 1. Selection Limit Manager (Max 3 for Objectives & Discovery) ---
  function setupSelectionLimiter(groupSelector, counterId, maxCount = 3) {
    const container = document.querySelector(groupSelector);
    const counter = document.getElementById(counterId);
    if (!container || !counter) return;

    const checkboxes = container.querySelectorAll('input[type="checkbox"]');

    function update() {
      const checkedBoxes = Array.from(checkboxes).filter(cb => cb.checked);
      const count = checkedBoxes.length;

      counter.textContent = `${count} / ${maxCount} selected${count >= maxCount ? ' (Max)' : ''}`;
      if (count >= maxCount) {
        counter.style.background = 'rgba(212, 167, 60, .35)';
        counter.style.color = '#120B0F';
      } else {
        counter.style.background = 'rgba(212, 167, 60, .14)';
        counter.style.color = 'var(--gold-700)';
      }

      checkboxes.forEach(cb => {
        const label = cb.closest('.pill-choice');
        if (!cb.checked && count >= maxCount) {
          cb.disabled = true;
          if (label) label.classList.add('is-disabled');
        } else {
          cb.disabled = false;
          if (label) label.classList.remove('is-disabled');
        }
      });
    }

    checkboxes.forEach(cb => {
      cb.addEventListener('change', update);
    });

    update();
  }

  setupSelectionLimiter('#objectives-group', 'obj-counter', 3);
  setupSelectionLimiter('#discovery-group', 'disc-counter', 3);

  // --- 2. Interactive Package Card Styling ---
  const packageRadios = document.querySelectorAll('input[name="paymentTier"]');
  packageRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      clearError('err-package');
    });
  });

  // --- 3. Toast Notification Helper ---
  function showToast(title, message, isError = false) {
    const stack = document.getElementById('toast-stack');
    if (!stack) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.setAttribute('role', 'alert');
    toast.innerHTML = `
      <div class="toast-icon" style="${isError ? 'background:#FEECEB; color:#B83226;' : ''}">
        ${isError ? '⚠️' : '✓'}
      </div>
      <div class="toast-content">
        <h4>${escapeHtml(title)}</h4>
        <p>${escapeHtml(message)}</p>
      </div>
    `;

    stack.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(8px)';
      toast.style.transition = 'all .3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4500);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, m => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[m]));
  }

  // --- 4. Validation Helpers ---
  function setError(id, message) {
    const el = document.getElementById(id);
    if (el) el.textContent = message;
  }

  function clearError(id) {
    const el = document.getElementById(id);
    if (el) el.textContent = '';
  }

  function clearAllErrors() {
    document.querySelectorAll('.form-err').forEach(el => el.textContent = '');
  }

  // Live input error clear
  ['reg-business-name', 'reg-contact-name', 'reg-email', 'reg-phone', 'reg-instagram', 'reg-location'].forEach(id => {
    const input = document.getElementById(id);
    if (input) {
      input.addEventListener('input', () => {
        clearError('err-' + id.replace('reg-', ''));
      });
    }
  });

  const categorySelect = document.getElementById('reg-category');
  if (categorySelect) {
    categorySelect.addEventListener('change', () => clearError('err-category'));
  }

  const consentAdmin = document.getElementById('reg-consent-admin');
  if (consentAdmin) {
    consentAdmin.addEventListener('change', () => clearError('err-consent-admin'));
  }

  // --- 5. Form Submit Handler ---
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    clearAllErrors();

    let isValid = true;
    let firstErrorElement = null;

    function markError(id, elementId, message) {
      isValid = false;
      setError(id, message);
      if (!firstErrorElement) {
        firstErrorElement = document.getElementById(elementId);
      }
    }

    // 1. Business Name
    const businessName = document.getElementById('reg-business-name').value.trim();
    if (!businessName) {
      markError('err-business-name', 'reg-business-name', 'Please provide your business or brand name.');
    }

    // 2. Contact Person
    const contactPerson = document.getElementById('reg-contact-name').value.trim();
    if (!contactPerson) {
      markError('err-contact-name', 'reg-contact-name', 'Please provide the primary contact person.');
    }

    // 3. Business Email
    const email = document.getElementById('reg-email').value.trim();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailPattern.test(email)) {
      markError('err-email', 'reg-email', 'Please provide a valid business email address.');
    }

    // 4. Phone
    const phone = document.getElementById('reg-phone').value.trim();
    if (!phone || phone.replace(/\D/g, '').length < 7) {
      markError('err-phone', 'reg-phone', 'Please provide a valid phone or WhatsApp number.');
    }

    // 5. Instagram
    const instagram = document.getElementById('reg-instagram').value.trim();
    if (!instagram) {
      markError('err-instagram', 'reg-instagram', 'Please provide your Instagram or main social handle.');
    }

    // 6. Base Location
    const baseLocation = document.getElementById('reg-location').value.trim();
    if (!baseLocation) {
      markError('err-location', 'reg-location', 'Please state your base city/town and country.');
    }

    // 7. Service Area
    const serviceAreas = Array.from(document.querySelectorAll('input[name="serviceArea"]:checked')).map(el => el.value);
    if (serviceAreas.length === 0) {
      isValid = false;
      setError('err-service-area', 'Please select at least one service area.');
      if (!firstErrorElement) firstErrorElement = document.getElementById('service-area-group');
    }

    // 8. Category
    const category = categorySelect.value;
    if (!category) {
      markError('err-category', 'reg-category', 'Please select your primary wedding category.');
    }

    // 9. Cultural Markets Served
    const marketsServed = Array.from(document.querySelectorAll('input[name="marketsServed"]:checked')).map(el => el.value);
    if (marketsServed.length === 0) {
      isValid = false;
      setError('err-markets', 'Please select at least one cultural wedding market you serve.');
      if (!firstErrorElement) firstErrorElement = document.getElementById('markets-group');
    }

    // 10. Objectives
    const objectives = Array.from(document.querySelectorAll('input[name="objectives"]:checked')).map(el => el.value);
    if (objectives.length === 0) {
      isValid = false;
      setError('err-objectives', 'Please select 1 to 3 primary participation objectives.');
      if (!firstErrorElement) firstErrorElement = document.getElementById('objectives-group');
    }

    // 11. Discovery Channels
    const discoveryChannels = Array.from(document.querySelectorAll('input[name="discoveryChannels"]:checked')).map(el => el.value);
    if (discoveryChannels.length === 0) {
      isValid = false;
      setError('err-discovery', 'Please select 1 to 3 customer discovery channels.');
      if (!firstErrorElement) firstErrorElement = document.getElementById('discovery-group');
    }

    // 12. Package
    const packageChecked = document.querySelector('input[name="paymentTier"]:checked');
    if (!packageChecked) {
      isValid = false;
      setError('err-package', 'Please select your preferred payment tier package.');
      if (!firstErrorElement) firstErrorElement = document.getElementById('package-selector');
    }

    // 13. Required UK GDPR Privacy Consent
    if (!consentAdmin.checked) {
      isValid = false;
      setError('err-consent-admin', 'You must read and acknowledge the ACWS Privacy Notice to submit your application.');
      if (!firstErrorElement) firstErrorElement = consentAdmin;
    }

    // Scroll to first error if invalid
    if (!isValid) {
      if (firstErrorElement) {
        firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        if (typeof firstErrorElement.focus === 'function') {
          firstErrorElement.focus();
        }
      }
      showToast('Incomplete Form', 'Please review the highlighted fields to continue.', true);
      return;
    }

    // --- 6. Form Submission Success Processing ---
    const submitBtn = document.getElementById('btn-submit-registration');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Processing Application...';

    const marketingConsent = document.getElementById('reg-consent-marketing').checked;
    const website = document.getElementById('reg-website').value.trim();
    const weddingVolume = document.getElementById('reg-wedding-volume').value;
    const typicalSpend = document.getElementById('reg-typical-spend').value;
    const paymentTier = packageChecked.value;

    const refCode = 'ACWS-2027-VND-' + Math.floor(10000 + Math.random() * 90000);
    const submissionDate = new Date().toLocaleString('en-GB', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });

    const submissionData = {
      refCode,
      businessName,
      contactPerson,
      email,
      phone,
      instagram,
      website: website || 'N/A',
      baseLocation,
      serviceAreas,
      category,
      marketsServed,
      weddingVolume: weddingVolume || 'Not specified',
      typicalSpend: typicalSpend || 'Not specified',
      objectives,
      discoveryChannels,
      paymentTier,
      privacyAcknowledged: true,
      marketingConsent,
      submittedAt: submissionDate
    };

    // Save to localStorage for demo persistence
    try {
      const existing = JSON.parse(localStorage.getItem('acws_vendor_submissions') || '[]');
      existing.push(submissionData);
      localStorage.setItem('acws_vendor_submissions', JSON.stringify(existing));
    } catch (err) {
      console.warn('Storage unavailable', err);
    }

    // Populate receipt details
    document.getElementById('receipt-ref').textContent = refCode;
    document.getElementById('rec-business-name').textContent = businessName;
    document.getElementById('rec-contact-name').textContent = contactPerson;
    document.getElementById('rec-email').textContent = email;
    document.getElementById('rec-phone').textContent = phone;
    document.getElementById('rec-instagram').textContent = instagram;
    document.getElementById('rec-category').textContent = category;
    document.getElementById('rec-package').textContent = paymentTier;
    document.getElementById('rec-marketing').textContent = marketingConsent ? 'Granted (Email/SMS updates)' : 'Declined (Administrative only)';
    document.getElementById('rec-timestamp').textContent = submissionDate;

    // Transition view
    setTimeout(() => {
      form.style.display = 'none';
      const successCard = document.getElementById('submission-success');
      successCard.style.display = 'block';
      successCard.scrollIntoView({ behavior: 'smooth', block: 'start' });

      showToast('Application Submitted!', `Reference: ${refCode}. Our curation team will review within 48 hours.`);
    }, 600);
  });
});
