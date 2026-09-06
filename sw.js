/* Face Builder service worker — offline-first cache. */
const CACHE = 'facebuilder-v3';

const SHELL = [
  '.',
  'index.html',
  'css/styles.css',
  'js/app.js',
  'manifest.webmanifest',
  'assets/config.json',
  'icons/favicon.svg',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-maskable-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(SHELL);
    // Pull the asset list out of config.json and cache every option image.
    try {
      const cfg = await (await fetch('assets/config.json', { cache: 'no-cache' })).json();
      const urls = new Set();
      for (const feat of Object.values(cfg.features || {})) {
        for (const opt of feat.options || []) {
          if (opt.src) urls.add(opt.src);
        }
      }
      await cache.addAll([...urls]);
    } catch (e) {
      // Asset precache is best-effort; runtime caching will still fill gaps.
    }
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
    self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Navigation requests: network first, fall back to cached shell.
  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        return await fetch(request);
      } catch {
        const cache = await caches.open(CACHE);
        return (await cache.match('index.html')) || (await cache.match('.'));
      }
    })());
    return;
  }

  // Everything else: cache first, then network (and populate cache).
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const hit = await cache.match(request);
    if (hit) return hit;
    try {
      const res = await fetch(request);
      if (res && res.ok) cache.put(request, res.clone());
      return res;
    } catch (e) {
      return hit || Response.error();
    }
  })());
});
