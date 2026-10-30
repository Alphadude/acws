/**
 * ACWS — User Location Capture Service
 * Captures geographic coordinates (latitude & longitude) for attendees and vendors.
 * Implements a hybrid strategy:
 *   1. Non-blocking IP-based geolocation as a silent baseline (city, region, country, approx lat/long).
 *   2. HTML5 Geolocation API (navigator.geolocation) for opt-in high-precision device GPS.
 *   3. Session caching to avoid redundant requests.
 *   4. Zero-friction failure handling (never blocks form submission if offline or blocked).
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof exports === 'object') {
    module.exports = factory();
  } else {
    root.ACWSLocationService = factory();
  }
}(typeof self !== 'undefined' ? self : this, function() {
  'use strict';

  const CACHE_KEY = 'acws_user_location_cache';
  let cachedLocation = null;
  let ipLookupPromise = null;

  // Restore cached location from sessionStorage if available
  try {
    const stored = sessionStorage.getItem(CACHE_KEY);
    if (stored) {
      cachedLocation = JSON.parse(stored);
    }
  } catch (e) {
    // SessionStorage may be restricted in private browsing
  }

  /**
   * Internal helper to persist cached location
   */
  function saveToCache(data) {
    cachedLocation = Object.assign({}, cachedLocation || {}, data, {
      updatedAt: new Date().toISOString()
    });
    try {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify(cachedLocation));
    } catch (e) {
      // Ignore storage errors
    }
    return cachedLocation;
  }

  /**
   * Fetch approximate location via IP geolocation APIs with timeout & fallback
   */
  async function fetchIpLocation(timeoutMs = 4000) {
    if (cachedLocation && cachedLocation.latitude && cachedLocation.longitude) {
      return cachedLocation;
    }

    const endpoints = [
      {
        url: 'https://ipapi.co/json/',
        parse: (d) => ({
          latitude: typeof d.latitude === 'number' ? d.latitude : parseFloat(d.latitude),
          longitude: typeof d.longitude === 'number' ? d.longitude : parseFloat(d.longitude),
          city: d.city || '',
          region: d.region || '',
          country: d.country_name || d.country || '',
          countryCode: d.country_code || '',
          postal: d.postal || '',
          ip: d.ip || '',
          source: 'ip'
        })
      },
      {
        url: 'https://ipwho.is/',
        parse: (d) => ({
          latitude: typeof d.latitude === 'number' ? d.latitude : parseFloat(d.latitude),
          longitude: typeof d.longitude === 'number' ? d.longitude : parseFloat(d.longitude),
          city: d.city || '',
          region: d.region || '',
          country: d.country || '',
          countryCode: d.country_code || '',
          postal: d.postal || '',
          ip: d.ip || '',
          source: 'ip'
        })
      }
    ];

    for (const ep of endpoints) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);

        const response = await fetch(ep.url, {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
          signal: controller.signal
        });
        clearTimeout(timer);

        if (!response.ok) continue;
        const data = await response.json();
        const parsed = ep.parse(data);

        if (!isNaN(parsed.latitude) && !isNaN(parsed.longitude)) {
          return saveToCache(parsed);
        }
      } catch (err) {
        // Silently try next endpoint
      }
    }

    return cachedLocation || null;
  }

  /**
   * Request high-precision device GPS location via browser Geolocation API
   */
  function requestDeviceLocation(timeoutMs = 8000) {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve({
          success: false,
          error: 'Geolocation is not supported by your browser.'
        });
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = pos.coords;
          const gpsData = {
            latitude: Number(coords.latitude.toFixed(6)),
            longitude: Number(coords.longitude.toFixed(6)),
            accuracy: coords.accuracy ? Math.round(coords.accuracy) : null,
            altitude: coords.altitude || null,
            heading: coords.heading || null,
            speed: coords.speed || null,
            source: 'gps',
            timestamp: pos.timestamp || Date.now()
          };
          const merged = saveToCache(gpsData);
          resolve({
            success: true,
            location: merged
          });
        },
        (err) => {
          let errorMsg = 'Unable to retrieve your location.';
          if (err.code === 1) { // PERMISSION_DENIED
            errorMsg = 'Location access was denied.';
          } else if (err.code === 2) { // POSITION_UNAVAILABLE
            errorMsg = 'Location information is currently unavailable.';
          } else if (err.code === 3) { // TIMEOUT
            errorMsg = 'Location request timed out.';
          }
          resolve({
            success: false,
            error: errorMsg,
            code: err.code
          });
        },
        {
          enableHighAccuracy: true,
          timeout: timeoutMs,
          maximumAge: 120000 // Cache for 2 mins
        }
      );
    });
  }

  /**
   * Auto-start background IP lookup immediately
   */
  function init() {
    if (!ipLookupPromise && (!cachedLocation || !cachedLocation.latitude)) {
      ipLookupPromise = fetchIpLocation().catch(() => null);
    }
  }

  // Trigger init on DOM load or script evaluation
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  }

  /**
   * Get the best currently known location payload.
   * If not ready, awaits the background IP lookup up to maxWaitMs.
   */
  async function getLocation(maxWaitMs = 2500) {
    if (cachedLocation && cachedLocation.latitude != null) {
      return cachedLocation;
    }

    if (ipLookupPromise) {
      const waitPromise = new Promise(resolve => setTimeout(() => resolve(cachedLocation || null), maxWaitMs));
      return await Promise.race([ipLookupPromise, waitPromise]);
    }

    return cachedLocation || null;
  }

  /**
   * Helper to attach a "Detect My Location" button handler with status UI
   * @param {HTMLElement|string} btnEl - Button or selector
   * @param {HTMLElement|string} statusEl - Element to render live feedback
   * @param {Function} onDetected - Callback receiving the location object
   */
  function attachLocationButton(btnEl, statusEl, onDetected) {
    const btn = typeof btnEl === 'string' ? document.querySelector(btnEl) : btnEl;
    const status = typeof statusEl === 'string' ? document.querySelector(statusEl) : statusEl;
    if (!btn) return;

    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      const originalHtml = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = '<span>⏳</span> Detecting...';
      if (status) {
        status.style.display = 'block';
        status.textContent = 'Detecting location via GPS/Network...';
        status.style.color = 'var(--gold-600, #8A6A1C)';
      }

      const res = await requestDeviceLocation();
      btn.disabled = false;
      btn.innerHTML = originalHtml;

      if (res.success && res.location) {
        if (status) {
          const loc = res.location;
          const label = loc.city ? `${loc.city}, ${loc.country || ''}` : `${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)}`;
          status.textContent = `✓ Location detected: ${label} (±${loc.accuracy || 10}m)`;
          status.style.color = '#0E6251';
        }
        if (typeof onDetected === 'function') {
          onDetected(res.location);
        }
      } else {
        // Fallback to IP location if GPS failed or was denied
        const fallback = await getLocation(1000);
        if (fallback && fallback.latitude != null) {
          if (status) {
            status.textContent = `ℹ️ Using approximate region (${fallback.city || fallback.country || 'Detected'}).`;
            status.style.color = 'var(--mocha-400, #666)';
          }
          if (typeof onDetected === 'function') {
            onDetected(fallback);
          }
        } else if (status) {
          status.textContent = res.error || 'Could not detect location. You can still proceed.';
          status.style.color = '#B83226';
        }
      }
    });
  }

  return {
    init,
    getLocation,
    requestDeviceLocation,
    fetchIpLocation,
    saveToCache,
    attachLocationButton,
    getCurrentCached: () => cachedLocation
  };
}));

