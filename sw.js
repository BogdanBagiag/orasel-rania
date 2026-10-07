/* Orășelul Rania – service worker (aplicație instalabilă) */
const VER = 'rania-v1-pets';
const SHELL = ['./', './index.html', './3d.html', './manifest.webmanifest', './manifest-3d.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png'];
const CDN = ['cdnjs.cloudflare.com', 'cdn.jsdelivr.net', 'fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VER).then(c => Promise.all(SHELL.map(u => c.add(u).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VER).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
const store = (req, res) => { if (res && (res.ok || res.type === 'opaque')) { const c = res.clone(); caches.open(VER).then(ch => ch.put(req, c)).catch(() => {}); } return res; };

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // pagini HTML: întâi rețeaua (ca să primești mereu versiunea nouă), apoi memoria locală dacă ești offline
  if (url.origin === location.origin && (req.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname.endsWith('/'))) {
    e.respondWith(fetch(req).then(res => store(req, res)).catch(() => caches.match(req).then(r => r || caches.match('./index.html'))));
    return;
  }
  // fișiere proprii (iconițe, manifest): din memorie, reîmprospătate în fundal
  if (url.origin === location.origin) {
    e.respondWith(caches.match(req).then(hit => { const net = fetch(req).then(res => store(req, res)).catch(() => hit); return hit || net; }));
    return;
  }
  // biblioteci și fonturi de pe CDN: din memorie
  if (CDN.includes(url.hostname)) {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => store(req, res))));
  }
});
