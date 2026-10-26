/*
 * The Forge — service worker (Phase 8, zero-dependency PWA).
 * Strategy:
 *   - App shell + assets: cache-first with background refresh (stale-while-revalidate).
 *   - Fonts (Google): cache-first, they rarely change.
 *   - Navigations: network-first, fall back to the cached shell when offline
 *     (SPA routes like /stats have no server-side file — the shell re-renders them).
 * The version token is injected per build (vite.config.ts closeBundle stamp), so
 * every deploy gets fresh cache names and activate() prunes the previous
 * generation — no manual version bumps, no stale-hashed-asset baggage.
 */
const SW_VERSION = '__BUILD_ID__';
const CACHE_PREFIX = 'forge-'; // every cache we own; activate prunes within it
const SHELL_CACHE = `${CACHE_PREFIX}${SW_VERSION}-shell`;
const ASSET_CACHE = `${CACHE_PREFIX}${SW_VERSION}-assets`;
const FONT_CACHE = `${CACHE_PREFIX}${SW_VERSION}-fonts`;

const SHELL_URLS = ['/', '/index.html', '/manifest.webmanifest', '/logo.png', '/logo-64.png', '/hammer-anvil.svg'];
/* Build-injected manifest (vite.config.ts stamp) of every hashed /assets/*
   file — lazy route chunks included, names unknowable from HTML alone. */
const PRECACHE_ASSETS = __PRECACHE_ASSETS__;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then(async (cache) => {
      await cache.addAll(SHELL_URLS);
      // Precache the full asset manifest: activate() prunes the previous
      // generation, so an offline reload right after an upgrade must be able
      // to mount from THIS generation's chunk set.
      const assets = await caches.open(ASSET_CACHE);
      await Promise.all(
        PRECACHE_ASSETS.map(async (u) => {
          try {
            const r = await fetch(u);
            if (r.ok) await assets.put(u, r);
          } catch {
            /* offline environment: shell-only install is still valid */
          }
        }),
      );
      self.skipWaiting();
    }),
  );
});

self.addEventListener('activate', (event) => {
  const live = new Set([SHELL_CACHE, ASSET_CACHE, FONT_CACHE]);
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k.startsWith(CACHE_PREFIX) && !live.has(k))
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
        const hit = await cache.match(req, { ignoreVary: true });
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
            event.waitUntil(
              caches.open(SHELL_CACHE).then((cache) => cache.put('/index.html', res.clone())),
            );
          }
          return res;
        })
        .catch(async () => {
          const cache = await caches.open(SHELL_CACHE);
          const opt = { ignoreVary: true };
          return (
            (await cache.match('/index.html', opt)) ||
            (await cache.match('/', opt)) ||
            Response.error()
          );
        }),
    );
    return;
  }

  // Hashed Vite assets + public files: stale-while-revalidate.
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.open(ASSET_CACHE).then(async (cache) => {
        const hit = await cache.match(req, { ignoreVary: true });
        const network = fetch(req)
          .then((res) => {
            if (res.ok) cache.put(req, res.clone());
            return res;
          })
          .catch(() => hit || Response.error());
        if (hit) {
          // Serving the hit: keep the SW alive until the background
          // revalidate lands, or the process can die mid-cache.put (WS8).
          event.waitUntil(network);
          return hit;
        }
        return network;
      }),
    );
  }
});
