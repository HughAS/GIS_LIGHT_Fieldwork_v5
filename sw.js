// ═══════════════════════════════════════════════════════════════
// Tweed Forum Field — Service Worker
// Bump CACHE_VER when deploying a new version of the app so
// old cached files are replaced on next visit.
// ═══════════════════════════════════════════════════════════════

const CACHE_VER  = 'tweed-field-v8';
const CDN_CACHE  = 'tweed-cdn-v8';

// App shell — files that must be available offline
const SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
];

// CDN origins we want to cache after first load
const CDN_HOSTS = [
  'cdnjs.cloudflare.com',
];
// JSZip, Leaflet, PDF.js all served from cdnjs — covered above

// ── Install: pre-cache the app shell ────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VER)
      .then(cache => cache.addAll(SHELL))
      .then(() => self.skipWaiting())   // activate immediately
  );
});

// ── Activate: purge old caches ───────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_VER && k !== CDN_CACHE)
          .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())   // take control immediately
  );
});

// ── Fetch strategy ───────────────────────────────────────────
self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);

  // Only handle GET requests
  if (req.method !== 'GET') return;

  // ── CDN resources: cache-first (they are versioned URLs so safe) ──
  if (CDN_HOSTS.includes(url.hostname)) {
    event.respondWith(
      caches.open(CDN_CACHE).then(cache =>
        cache.match(req).then(cached => {
          if (cached) return cached;
          return fetch(req).then(response => {
            if (response.ok) cache.put(req, response.clone());
            return response;
          });
        })
      )
    );
    return;
  }

  // ── WMS / tile requests: network-only (always fresh, large) ──
  if (url.pathname.includes('/service') || url.pathname.includes('/tile')) {
    return; // let browser handle normally
  }

  // ── App shell (same origin): cache-first, network fallback ──
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(req).then(cached => {
        // Background revalidation (stale-while-revalidate)
        const networkFetch = fetch(req).then(response => {
          if (response.ok) {
            caches.open(CACHE_VER).then(c => c.put(req, response.clone()));
          }
          return response;
        }).catch(() => null);
        return cached || networkFetch;
      })
    );
  }
});

// ── Message: force update ────────────────────────────────────
// Send { type: 'SKIP_WAITING' } from the app to force a new SW
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
