/* GlucoCompte — fonctionnement hors connexion. Le numéro de version change à chaque publication. */
const VERSION = '20261107063544';
const CACHE = `glucocompte-${VERSION}`;
const CORE = ['./', './index.html', './manifest.webmanifest', './data/foods.json', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then(async (c) => {
      await c.addAll(CORE);
      // Built JS/CSS files are listed in assets.json at build time.
      try {
        const list = await (await fetch('./assets.json', { cache: 'no-store' })).json();
        await c.addAll(list);
      } catch (_) {}
    }),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return; // Open Food Facts : réseau
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(
      (hit) =>
        hit ||
        fetch(e.request)
          .then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(CACHE).then((c) => c.put(e.request, copy));
            }
            return res;
          })
          .catch(() => caches.match('./index.html')),
    ),
  );
});
