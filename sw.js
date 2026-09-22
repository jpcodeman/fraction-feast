const CACHE = 'fraction-feast-v5';
const ASSETS = [
  './', './index.html', './css/styles.css', './js/game.js', './js/audio.js',
  './manifest.webmanifest', './assets/welcome.png', './icons/icon.svg', './icons/icon-192.png',
  './icons/icon-512.png', './icons/icon-512-maskable.png', './icons/apple-touch-icon.png',
  './sprites/chef-girl.svg', './sprites/truck.svg'
];
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
      if (response && response.status === 200 && new URL(event.request.url).origin === self.location.origin) {
        caches.open(CACHE).then(c => c.put(event.request, response.clone()));
      }
      return response;
    }).catch(() => event.request.mode === 'navigate' ? caches.match('./index.html') : undefined))
  );
});
