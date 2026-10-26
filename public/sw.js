/*
 * The Forge — service worker (Phase 8, zero-dependency PWA).
 * Strategy:
 *   - App shell + assets: cache-first with background refresh (stale-while-revalidate).
 *   - Fonts (Google): cache-first, they rarely change.
 *   - Navigations: network-first, fall back to the cached shell when offline
 *     (SPA routes like /stats have no server-side file — the shell re-renders them).
 * Version bump SW_VERSION to invalidate the old cache on deploy.
 */
const SW_VERSION = 'forge-v1';
const SHELL_CACHE = `${SW_VERSION}-shell`;
const ASSET_CACHE = `${SW_VERSION}-assets`;
const FONT_CACHE = `${SW_VERSION}-fonts`;

const SHELL_URLS = ['/', '/index.html', '/manifest.webmanifest', '/logo.png', '/logo-64.png', '/hammer-anvil.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL_URLS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => !k.startsWith(SW_VERSION))
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Google Fonts: cache-first (immutable-ish, versioned by URL).
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(
      caches.open(FONT_CACHE).then(async (cache) => {
        const hit = await cache.match(req);
        if (hit) return hit;
        try {
          const res = await fetch(req);
          if (res.ok) cache.put(req, res.clone());
          return res;
        } catch {
          return hit || Response.error();
        }
      }),
    );
    return;
  }

  // SPA navigations: network-first, cached shell offline.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          // Same-origin successful navigations refresh the shell entry.
          if (res.ok && url.origin === self.location.origin) {
            caches.open(SHELL_CACHE).then((cache) => cache.put('/index.html', res.clone()));
          }
          return res;
        })
        .catch(async () => {
          const cache = await caches.open(SHELL_CACHE);
          return (await cache.match('/index.html')) || (await cache.match('/')) || Response.error();
        }),
    );
    return;
  }

  // Hashed Vite assets + public files: stale-while-revalidate.
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.open(ASSET_CACHE).then(async (cache) => {
        const hit = await cache.match(req);
        const network = fetch(req)
          .then((res) => {
            if (res.ok) cache.put(req, res.clone());
            return res;
          })
          .catch(() => hit || Response.error());
        return hit || network;
      }),
    );
  }
});
