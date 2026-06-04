// OS A320 Duty Planner – Service Worker
// Cache-first strategy: works fully offline after first load

const CACHE  = 'os-duty-v1';
const ASSETS = [
  './aua_a320_duty_roster.html',
  './manifest.json',
  'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;500;600&family=IBM+Plex+Sans:wght@300;400;500&display=swap',
];

// ── Install: pre-cache core assets ──
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => {
      // Cache local assets strictly; fonts best-effort
      return cache.addAll(['./aua_a320_duty_roster.html','./manifest.json'])
        .then(() => cache.add('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;500;600&family=IBM+Plex+Sans:wght@300;400;500&display=swap').catch(()=>{}));
    })
  );
  self.skipWaiting();
});

// ── Activate: clear old caches ──
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── Fetch: cache-first, network fallback ──
self.addEventListener('fetch', e => {
  // Only handle GET requests
  if (e.request.method !== 'GET') return;

  // For SimBrief links – always network (never cache, just open browser)
  if (e.request.url.includes('simbrief.com') || e.request.url.includes('dispatch.simbrief')) return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(response => {
        // Cache valid responses (not opaque unless font CDN)
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, clone));
        }
        return response;
      }).catch(() => {
        // Offline fallback: serve the app shell
        if (e.request.destination === 'document') {
          return caches.match('./aua_a320_duty_roster.html');
        }
      });
    })
  );
});
