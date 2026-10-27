/**
 * ACWS — Attendee & Couple Registration Logic
 * Handles interactive ticket selection, conditional validation for intending couples,
 * multi-select pills, UK GDPR consent compliance, and confirmation pass generation.
 */

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('attendee-registration-form');
  if (!form) return;

  const attendeeTypeSelect = document.getElementById('att-type');
  const timeframeSelect = document.getElementById('att-timeframe');
  const locationSelect = document.getElementById('att-location');
  const discoverySelect = document.getElementById('att-discovery');
  const consentPrivacy = document.getElementById('reg-consent-privacy');

  // --- 1. Helper: Determine if selected attendee is an intending couple ---
  function isIntendingCouple(type) {
    if (!type) return false;
    const coupleRoles = ['Bride', 'Groom', 'Engaged Couple', 'Partner/Fiancé(e)'];
    return coupleRoles.includes(type);
  }

  function updateCoupleConditionalState() {
    const isCouple = isIntendingCouple(attendeeTypeSelect.value);
    const timeframeTag = document.getElementById('req-timeframe-tag');
    const locationTag = document.getElementById('req-location-tag');
    const servicesTag = document.getElementById('req-services-tag');
    const timeframeStar = document.getElementById('req-timeframe-star');
    const locationStar = document.getElementById('req-location-star');
    const servicesStar = document.getElementById('req-services-star');

    if (isCouple) {
      if (timeframeTag) timeframeTag.style.display = 'inline';
      if (locationTag) locationTag.style.display = 'inline';
      if (servicesTag) servicesTag.style.display = 'inline';
      if (timeframeStar) timeframeStar.style.display = 'inline';
      if (locationStar) locationStar.style.display = 'inline';
      if (servicesStar) servicesStar.style.display = 'inline';
    } else {
      if (timeframeTag) timeframeTag.style.display = 'none';
      if (locationTag) locationTag.style.display = 'none';
      if (servicesTag) servicesTag.style.display = 'none';
      if (timeframeStar) timeframeStar.style.display = 'none';
      if (locationStar) locationStar.style.display = 'none';
      if (servicesStar) servicesStar.style.display = 'none';
      clearError('err-timeframe');
      clearError('err-location');
      clearError('err-services');
    }
  }

  if (attendeeTypeSelect) {
    attendeeTypeSelect.addEventListener('change', () => {
      clearError('err-attendee-type');
      updateCoupleConditionalState();
    });
    updateCoupleConditionalState();
  }

  // --- 2. Live error clearing on inputs ---
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

  const nameInput = document.getElementById('att-full-name');
  if (nameInput) {
    nameInput.addEventListener('input', () => clearError('err-full-name'));
  }

  const emailInput = document.getElementById('att-email');
  if (emailInput) {
    emailInput.addEventListener('input', () => clearError('err-email'));
  }

  if (timeframeSelect) {
    timeframeSelect.addEventListener('change', () => clearError('err-timeframe'));
  }

  if (locationSelect) {
    locationSelect.addEventListener('change', () => clearError('err-location'));
  }

  if (discoverySelect) {
    discoverySelect.addEventListener('change', () => clearError('err-discovery'));
  }

  if (consentPrivacy) {
    consentPrivacy.addEventListener('change', () => clearError('err-consent-privacy'));
  }

  const serviceCheckboxes = document.querySelectorAll('input[name="servicesNeeded"]');
  serviceCheckboxes.forEach(cb => {
    cb.addEventListener('change', () => clearError('err-services'));
  });

  const ticketRadios = document.querySelectorAll('input[name="ticketType"]');
  ticketRadios.forEach(radio => {
    radio.addEventListener('change', () => clearError('err-ticket-type'));
  });

  // --- 3. Toast Notifications ---
  function showToast(title, message, isError = false) {
    const stack = document.getElementById('toast-stack');
    if (!stack) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.setAttribute('role', 'alert');
    toast.innerHTML = `
      <div class="toast-icon" style="${isError ? 'background:#FEECEB; color:#B83226;' : 'background:#E8F8F5; color:#0E6251;'}">
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

  // --- 4. Form Submission Handler ---
  form.addEventListener('submit', async (e) => {
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

    // 1. Full Name
    const fullName = nameInput.value.trim();
    if (!fullName || fullName.length < 2) {
      markError('err-full-name', 'att-full-name', 'Please provide your full name.');
    }

    // 2. Email Address
    const email = emailInput.value.trim();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailPattern.test(email)) {
      markError('err-email', 'att-email', 'Please provide a valid email address.');
    }

    // 3. Attendee Type
    const attendeeType = attendeeTypeSelect.value;
    if (!attendeeType) {
      markError('err-attendee-type', 'att-type', 'Please select what best describes you.');
    }

    const isCouple = isIntendingCouple(attendeeType);

    // 4. Planned Wedding Timeframe (Required for couples)
    const weddingTimeframe = timeframeSelect.value;
    if (isCouple && !weddingTimeframe) {
      markError('err-timeframe', 'att-timeframe', 'Please select your planned wedding timeframe.');
    }

    // 5. Planned Wedding Location (Required for couples)
    const weddingLocation = locationSelect.value;
    if (isCouple && !weddingLocation) {
      markError('err-location', 'att-location', 'Where are you planning to hold your wedding? Please select a location.');
    }

    // 6. Optional: Wedding Budget
    const weddingBudget = document.getElementById('att-budget').value || 'Not specified';

    // 7. Optional: Guest Count
    const guestCount = document.getElementById('att-guests').value || 'Not specified';

    // 8. Services Needed (Required for couples)
    const servicesNeeded = Array.from(document.querySelectorAll('input[name="servicesNeeded"]:checked')).map(el => el.value);
    if (isCouple && servicesNeeded.length === 0) {
      isValid = false;
      setError('err-services', 'Please select at least one wedding service you are looking for.');
      if (!firstErrorElement) firstErrorElement = document.getElementById('services-group');
    }

    // 9. Cultural Influences (Optional)
    const culturalInfluences = Array.from(document.querySelectorAll('input[name="culturalInfluences"]:checked')).map(el => el.value);

    // 10. How You Heard About ACWS (Required)
    const discoveryChannel = discoverySelect.value;
    if (!discoveryChannel) {
      markError('err-discovery', 'att-discovery', 'Please tell us how you heard about ACWS.');
    }

    // 11. Ticket Type (Required)
    const ticketChecked = document.querySelector('input[name="ticketType"]:checked');
    if (!ticketChecked) {
      isValid = false;
      setError('err-ticket-type', 'Please select a ticket type.');
      if (!firstErrorElement) firstErrorElement = document.getElementById('ticket-selector');
    }

    // 12. Required UK GDPR Privacy Consent
    if (!consentPrivacy.checked) {
      isValid = false;
      setError('err-consent-privacy', 'You must read and acknowledge the ACWS Privacy Notice to register.');
      if (!firstErrorElement) firstErrorElement = consentPrivacy;
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

    // --- 5. Form Submission with Backend Integration ---
    const submitBtn = document.getElementById('btn-submit-attendee');
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Reserving Your Passes...';

    const marketingConsent = document.getElementById('reg-consent-marketing').checked;
    const partnerConsent = document.getElementById('reg-consent-partners').checked;
    const ticketType = ticketChecked.value;
    const ticketPrice = ticketChecked.getAttribute('data-price') || '£20';

    const submissionPayload = {
      fullName,
      email,
      attendeeType,
      weddingTimeframe: weddingTimeframe || '',
      weddingLocation: weddingLocation || '',
      weddingBudget: weddingBudget || 'Not specified',
      guestCount: guestCount || 'Not specified',
      servicesNeeded,
      culturalInfluences,
      discoveryChannel: discoveryChannel || 'Instagram',
      ticketType,
      ticketPrice,
      privacyAcknowledged: true,
      marketingConsent,
      partnerConsent
    };

    // Configurable API base with default to live Render backend
    const API_BASE = window.ACWS_API_BASE || 'https://acwsbackend.onrender.com/api/v1';

    try {
      const response = await fetch(`${API_BASE}/attendees`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(submissionPayload)
      });

      const resJson = await response.json().catch(() => null);

      if (!response.ok) {
        let errorMsg = 'Failed to confirm ticket reservation. Please review your details and try again.';
        if (resJson && resJson.message) {
          errorMsg = resJson.message;
        } else if (resJson && Array.isArray(resJson.errors) && resJson.errors.length) {
          errorMsg = resJson.errors.map(e => e.message || e).join('. ');
        }
        throw new Error(errorMsg);
      }

      const responseData = (resJson && resJson.data) || {};
      const attendeeRecord = responseData.attendee || responseData;
      const refCode = responseData.refCode || attendeeRecord.refCode || ('ACWS-2027-ATT-' + Math.floor(1000 + Math.random() * 9000));
      const submissionDate = attendeeRecord.registeredAt
        ? new Date(attendeeRecord.registeredAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })
        : new Date().toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });

      // Save to localStorage as a client-side backup
      try {
        const existing = JSON.parse(localStorage.getItem('acws_attendee_registrations') || '[]');
        existing.push({
          ...submissionPayload,
          refCode,
          id: attendeeRecord._id || null,
          registeredAt: submissionDate
        });
        localStorage.setItem('acws_attendee_registrations', JSON.stringify(existing));
      } catch (storageErr) {
        console.warn('Storage unavailable', storageErr);
      }

      // Populate summary receipt with live server data
      document.getElementById('receipt-ref').textContent = refCode;
      document.getElementById('rec-full-name').textContent = fullName;
      document.getElementById('rec-email').textContent = email;
      document.getElementById('rec-type').textContent = attendeeType;
      document.getElementById('rec-ticket-type').textContent = `${ticketType} (${ticketPrice})`;
      document.getElementById('rec-timeframe').textContent = weddingTimeframe || 'Not applicable';
      document.getElementById('rec-location').textContent = weddingLocation || 'Not applicable';
      document.getElementById('rec-budget').textContent = weddingBudget;
      document.getElementById('rec-services').textContent = servicesNeeded.length ? servicesNeeded.join(', ') : 'None selected';
      document.getElementById('rec-influences').textContent = culturalInfluences.length ? culturalInfluences.join(', ') : 'None specified';
      document.getElementById('rec-marketing').textContent = marketingConsent ? 'Granted (Email updates)' : 'Declined';
      document.getElementById('rec-partners').textContent = partnerConsent ? 'Granted (Partner offers)' : 'Declined';
      document.getElementById('rec-timestamp').textContent = submissionDate;

      // Transition to success receipt view
      form.style.display = 'none';
      const successCard = document.getElementById('submission-success');
      successCard.style.display = 'block';
      successCard.scrollIntoView({ behavior: 'smooth', block: 'start' });

      showToast('Registration Confirmed!', `Pass Reference: ${refCode}`);
    } catch (err) {
      console.error('Registration error:', err);
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnText;
      showToast('Registration Issue', err.message || 'Unable to connect to the server. Please check your internet connection.', true);
    }
  });
});
