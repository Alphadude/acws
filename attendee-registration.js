/**
 * ACWS — Attendee & Couple Registration Logic
 * Handles interactive ticket selection, conditional validation for intending couples,
 * multi-select pills, UK GDPR consent compliance, dynamic attendee pass badge generation,
 * QR code embedding, and one-click pass receipt image download.
 */

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('attendee-registration-form');
  if (!form) return;

  const nameInput = document.getElementById('att-full-name');
  const emailInput = document.getElementById('att-email');
  const phoneInput = document.getElementById('att-phone');
  const instagramInput = document.getElementById('att-instagram');
  const attendeeTypeSelect = document.getElementById('att-type');
  const timeframeSelect = document.getElementById('att-timeframe');
  const locationSelect = document.getElementById('att-location');
  const discoverySelect = document.getElementById('att-discovery');
  const consentPrivacy = document.getElementById('reg-consent-privacy');

  // Preload clean pass badge background template
  const passTemplateImg = new Image();
  passTemplateImg.crossOrigin = 'anonymous';
  passTemplateImg.src = 'assets/img/attendee-pass-clean.png';

  let currentAttendeePassData = null;

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

  // --- Location Service Integration ---
  const locStatusEl = document.getElementById('att-location-status');
  const locDetectBtn = document.getElementById('btn-detect-att-location');

  if (window.ACWSLocationService) {
    window.ACWSLocationService.init();

    window.ACWSLocationService.getLocation(3000).then(loc => {
      if (loc && loc.latitude != null && locStatusEl) {
        const place = loc.city ? `${loc.city}, ${loc.country || ''}` : `${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)}`;
        locStatusEl.textContent = `✓ ${place} (approx. IP)`;
        locStatusEl.style.color = '#0E6251';
      } else if (locStatusEl) {
        locStatusEl.textContent = 'Approximate region will be recorded on submission';
      }
    });

    if (locDetectBtn) {
      window.ACWSLocationService.attachLocationButton(locDetectBtn, locStatusEl, () => {});
    }
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

  if (nameInput) {
    nameInput.addEventListener('input', () => clearError('err-full-name'));
  }

  if (emailInput) {
    emailInput.addEventListener('input', () => clearError('err-email'));
  }

  if (phoneInput) {
    phoneInput.addEventListener('input', () => clearError('err-phone'));
  }

  if (instagramInput) {
    instagramInput.addEventListener('input', () => clearError('err-instagram'));
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

  // --- 4. Pass Canvas Rendering & Generation Logic ---
  async function renderPassToCanvas(canvas, data) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = 576;
    const height = 864;
    canvas.width = width;
    canvas.height = height;

    // Ensure template image is loaded
    if (!passTemplateImg.complete || passTemplateImg.naturalWidth === 0) {
      await new Promise(resolve => {
        passTemplateImg.onload = resolve;
        passTemplateImg.onerror = resolve;
        setTimeout(resolve, 1500);
      });
    }

    if (passTemplateImg.naturalWidth > 0) {
      ctx.drawImage(passTemplateImg, 0, 0, width, height);
    } else {
      // Fallback background rendering
      ctx.fillStyle = '#262525';
      ctx.fillRect(0, 0, width, height);

      // Title
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '800 44px -apple-system, BlinkMacSystemFont, "SF Pro Display", "Space Grotesk", sans-serif';
      ctx.fillText('ACWS 2027', 34, 120);

      // Vertical ATTENDEE text
      ctx.save();
      ctx.translate(515, 432);
      ctx.rotate(Math.PI / 2);
      ctx.font = '900 68px -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('ATTENDEE', 0, 0);
      ctx.restore();
    }

    // Always cleanly wipe the dynamic contact area to the exact card background (#262525)
    ctx.fillStyle = '#262525';
    ctx.fillRect(30, 137, 415, 243);

    // 1. Draw Full Name
    const fullName = (data.fullName || 'Attendee').trim();
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    let nameFontSize = 42;
    ctx.font = `800 ${nameFontSize}px -apple-system, BlinkMacSystemFont, "SF Pro Display", "Space Grotesk", sans-serif`;
    while (ctx.measureText(fullName).width > 380 && nameFontSize > 20) {
      nameFontSize -= 2;
      ctx.font = `800 ${nameFontSize}px -apple-system, BlinkMacSystemFont, "SF Pro Display", "Space Grotesk", sans-serif`;
    }
    ctx.fillText(fullName, 36, 172);

    // 2. Draw Email
    const email = (data.email || '').trim();
    ctx.fillStyle = '#F5F5F5';
    let emailFontSize = 24;
    ctx.font = `400 ${emailFontSize}px "Playfair Display", "Cormorant Garamond", Georgia, serif`;
    while (ctx.measureText(email).width > 380 && emailFontSize > 14) {
      emailFontSize -= 1;
      ctx.font = `400 ${emailFontSize}px "Playfair Display", "Cormorant Garamond", Georgia, serif`;
    }
    ctx.fillText(email, 36, 235);

    // 3. Draw Phone Number
    const phone = (data.phone || '').trim();
    ctx.fillStyle = '#F5F5F5';
    ctx.font = '400 24px "Playfair Display", "Cormorant Garamond", Georgia, serif';
    ctx.fillText(phone, 36, 281);

    // 4. Draw Instagram Handle
    let instagram = (data.instagram || '').trim();
    if (instagram && !instagram.startsWith('@') && !instagram.startsWith('http')) {
      instagram = '@' + instagram;
    }
    ctx.fillStyle = '#F5F5F5';
    ctx.font = '400 24px "Playfair Display", "Cormorant Garamond", Georgia, serif';
    ctx.fillText(instagram, 36, 334);

    // 5. Solid White Container Box (x: 48, y: 392, w: 368, h: 448)
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(48, 392, 368, 448);

    // 6. Generate and Draw QR Code inside white box
    const refCode = data.refCode || 'ACWS-2027-ATT';
    const qrData = `https://africancaribbeanweddingshow.co.uk/verify?ref=${encodeURIComponent(refCode)}&name=${encodeURIComponent(fullName)}`;

    if (window.QRCode) {
      try {
        const qr = new window.QRCode(null, {
          text: qrData,
          typeNumber: 0,
          correctLevel: window.QRCode.CorrectLevel.M,
          colorDark: '#1E1E1E',
          colorLight: '#FFFFFF'
        });

        const qrSize = 290;
        const qrX = Math.round(48 + (368 - qrSize) / 2); // 87
        const qrY = 412;
        qr.drawToCanvas(ctx, qrX, qrY, qrSize, qrSize);
      } catch (qrErr) {
        console.warn('QR code generation error:', qrErr);
      }
    }

    // 7. Verification details underneath QR code in white box
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';

    ctx.fillStyle = '#1E1E1E';
    ctx.font = '700 15px "SF Mono", Menlo, Consolas, monospace';
    ctx.fillText(refCode, 48 + 368 / 2, 735);

    ctx.fillStyle = '#8A6A1C';
    ctx.font = '700 12px -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif';
    const ticketTypeStr = ((data.ticketType || 'General Admission').toUpperCase()) + ' PASS';
    ctx.fillText(ticketTypeStr, 48 + 368 / 2, 762);

    ctx.fillStyle = '#777777';
    ctx.font = '500 11px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText('Official Entry Pass · Present at Gate', 48 + 368 / 2, 786);
  }

  function downloadCanvasAsImage(canvas, filename) {
    if (!canvas) return;
    if (canvas.toBlob) {
      canvas.toBlob(blob => {
        if (!blob) {
          fallbackDownload();
          return;
        }
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          a.remove();
          URL.revokeObjectURL(url);
        }, 1000);
      }, 'image/png');
    } else {
      fallbackDownload();
    }

    function fallbackDownload() {
      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
    }
  }

  // --- 5. Form Submission Handler ---
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
    const fullName = nameInput ? nameInput.value.trim() : '';
    if (!fullName || fullName.length < 2) {
      markError('err-full-name', 'att-full-name', 'Please provide your full name.');
    }

    // 2. Email Address
    const email = emailInput ? emailInput.value.trim() : '';
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailPattern.test(email)) {
      markError('err-email', 'att-email', 'Please provide a valid email address.');
    }

    // 3. Phone Number (Required)
    const phone = phoneInput ? phoneInput.value.trim() : '';
    if (!phone || phone.length < 7) {
      markError('err-phone', 'att-phone', 'Please provide a valid phone or WhatsApp number.');
    }

    // 4. Instagram Handle (Optional)
    let instagram = instagramInput ? instagramInput.value.trim() : '';
    if (instagram && !instagram.startsWith('@') && !instagram.startsWith('http')) {
      instagram = '@' + instagram;
    }

    // 5. Attendee Type
    const attendeeType = attendeeTypeSelect.value;
    if (!attendeeType) {
      markError('err-attendee-type', 'att-type', 'Please select what best describes you.');
    }

    const isCouple = isIntendingCouple(attendeeType);

    // 6. Planned Wedding Timeframe (Required for couples)
    const weddingTimeframe = timeframeSelect.value;
    if (isCouple && !weddingTimeframe) {
      markError('err-timeframe', 'att-timeframe', 'Please select your planned wedding timeframe.');
    }

    // 7. Planned Wedding Location (Required for couples)
    const weddingLocation = locationSelect.value;
    if (isCouple && !weddingLocation) {
      markError('err-location', 'att-location', 'Where are you planning to hold your wedding? Please select a location.');
    }

    // 8. Optional: Wedding Budget
    const weddingBudget = document.getElementById('att-budget')?.value || 'Not specified';

    // 9. Services Needed (Required for couples)
    const servicesNeeded = Array.from(document.querySelectorAll('input[name="servicesNeeded"]:checked')).map(el => el.value);
    if (isCouple && servicesNeeded.length === 0) {
      isValid = false;
      setError('err-services', 'Please select at least one wedding service you are looking for.');
      if (!firstErrorElement) firstErrorElement = document.getElementById('services-group');
    }

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

    // --- 6. Form Submission with Backend Integration ---
    const submitBtn = document.getElementById('btn-submit-attendee');
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Reserving Your Passes...';

    const marketingConsent = document.getElementById('reg-consent-marketing').checked;
    const partnerConsent = document.getElementById('reg-consent-partners').checked;
    const ticketType = ticketChecked.value;
    const ticketPrice = ticketChecked.getAttribute('data-price') || '£20';

    // Capture user location snapshot
    let locationData = null;
    if (window.ACWSLocationService) {
      locationData = await window.ACWSLocationService.getLocation(1500).catch(() => null);
    }

    // Capture user device diagnostics
    const deviceInfo = window.ACWSDeviceDetector ? window.ACWSDeviceDetector.getDeviceInfo() : null;

    const submissionPayload = {
      fullName,
      email,
      phone,
      instagram: instagram || 'None provided',
      locationData: (locationData && locationData.latitude != null) ? {
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        accuracy: locationData.accuracy || null,
        city: locationData.city || '',
        region: locationData.region || '',
        country: locationData.country || '',
        countryCode: locationData.countryCode || '',
        source: locationData.source || 'ip',
        capturedAt: new Date().toISOString()
      } : null,
      deviceInfo: deviceInfo || null,
      attendeeType,
      weddingTimeframe: weddingTimeframe || '',
      weddingLocation: weddingLocation || '',
      weddingBudget: weddingBudget || 'Not specified',
      guestCount: 'Not specified',
      servicesNeeded,
      culturalInfluences: [],
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
      let response = await fetch(`${API_BASE}/attendees`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(submissionPayload)
      });

      // Defensive handling: if backend strict validator rejects extra contact, location, or device fields, retry cleanly
      if (!response.ok && (submissionPayload.phone || submissionPayload.instagram || submissionPayload.locationData || submissionPayload.deviceInfo)) {
        const testJson = await response.clone().json().catch(() => null);
        const errMsg = testJson && (testJson.message || JSON.stringify(testJson.errors || ''));
        if (errMsg && (errMsg.includes('phone') || errMsg.includes('instagram') || errMsg.includes('locationData') || errMsg.includes('deviceInfo'))) {
          const fallbackPayload = { ...submissionPayload };
          if (errMsg.includes('phone')) delete fallbackPayload.phone;
          if (errMsg.includes('instagram')) delete fallbackPayload.instagram;
          if (errMsg.includes('locationData')) delete fallbackPayload.locationData;
          if (errMsg.includes('deviceInfo')) delete fallbackPayload.deviceInfo;
          response = await fetch(`${API_BASE}/attendees`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify(fallbackPayload)
          });
        }
      }

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

      // Populate summary receipt with live data
      document.getElementById('receipt-ref').textContent = refCode;
      document.getElementById('rec-full-name').textContent = fullName;
      document.getElementById('rec-email').textContent = email;
      if (document.getElementById('rec-phone')) {
        document.getElementById('rec-phone').textContent = phone;
      }
      if (document.getElementById('rec-instagram')) {
        document.getElementById('rec-instagram').textContent = instagram || 'None provided';
      }
      document.getElementById('rec-type').textContent = attendeeType;
      document.getElementById('rec-ticket-type').textContent = `${ticketType} (${ticketPrice})`;
      document.getElementById('rec-timeframe').textContent = weddingTimeframe || 'Not applicable';
      document.getElementById('rec-location').textContent = weddingLocation || 'Not applicable';
      document.getElementById('rec-budget').textContent = weddingBudget;
      document.getElementById('rec-services').textContent = servicesNeeded.length ? servicesNeeded.join(', ') : 'None selected';
      document.getElementById('rec-marketing').textContent = marketingConsent ? 'Granted (Email updates)' : 'Declined';
      document.getElementById('rec-partners').textContent = partnerConsent ? 'Granted (Partner offers)' : 'Declined';
      document.getElementById('rec-timestamp').textContent = submissionDate;

      const recGeoOrigin = document.getElementById('rec-geo-origin');
      if (recGeoOrigin) {
        if (locationData && locationData.latitude != null) {
          const place = locationData.city ? `${locationData.city}, ${locationData.country || ''}` : `${locationData.latitude.toFixed(4)}, ${locationData.longitude.toFixed(4)}`;
          const badge = (locationData.source || 'ip').toUpperCase();
          recGeoOrigin.textContent = `${place} (Lat: ${locationData.latitude.toFixed(4)}, Long: ${locationData.longitude.toFixed(4)}) [${badge}]`;
        } else {
          recGeoOrigin.textContent = 'Not specified';
        }
      }

      const recDeviceEl = document.getElementById('rec-device-info');
      if (recDeviceEl) {
        recDeviceEl.textContent = deviceInfo ? deviceInfo.summary : 'Desktop';
      }

      // Store pass data and render pass onto canvas
      currentAttendeePassData = {
        fullName,
        email,
        phone,
        instagram,
        attendeeType,
        ticketType,
        refCode,
        registeredAt: submissionDate
      };

      const passCanvas = document.getElementById('attendee-pass-canvas');
      if (passCanvas) {
        await renderPassToCanvas(passCanvas, currentAttendeePassData);
      }

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

  // --- 7. Save Pass Receipt (Download Badge) Button Listener ---
  const savePassBtn = document.getElementById('btn-save-pass-receipt');
  if (savePassBtn) {
    savePassBtn.addEventListener('click', async () => {
      if (!currentAttendeePassData) {
        // Fallback to reading DOM values if currentAttendeePassData is unset
        currentAttendeePassData = {
          fullName: document.getElementById('rec-full-name')?.textContent || 'Attendee',
          email: document.getElementById('rec-email')?.textContent || '',
          phone: document.getElementById('rec-phone')?.textContent || '',
          instagram: document.getElementById('rec-instagram')?.textContent === 'None provided' ? '' : (document.getElementById('rec-instagram')?.textContent || ''),
          refCode: document.getElementById('receipt-ref')?.textContent || 'ACWS-2027-ATT-PASS',
          ticketType: document.getElementById('rec-ticket-type')?.textContent?.split(' ')[0] || 'General Admission'
        };
      }

      const passCanvas = document.getElementById('attendee-pass-canvas');
      if (!passCanvas) return;

      const origText = savePassBtn.innerHTML;
      savePassBtn.disabled = true;
      savePassBtn.innerHTML = '<span>⏳</span> <strong>Generating Pass...</strong>';

      try {
        await renderPassToCanvas(passCanvas, currentAttendeePassData);
        const safeRef = (currentAttendeePassData.refCode || 'PASS').replace(/[^a-zA-Z0-9_-]/g, '_');
        const filename = `ACWS-2027-Pass-${safeRef}.png`;
        downloadCanvasAsImage(passCanvas, filename);
        showToast('Pass Downloaded', `Saved your pass receipt: ${filename}`);
      } catch (err) {
        console.error('Download pass error:', err);
        showToast('Download Error', 'Could not save pass receipt image. Please try again.', true);
      } finally {
        savePassBtn.disabled = false;
        savePassBtn.innerHTML = origText;
      }
    });
  }
});
