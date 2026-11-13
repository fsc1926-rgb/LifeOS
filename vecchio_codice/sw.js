const CACHE_NAME = 'lifeos-v10-cache-v2';

// Risorse essenziali da salvare per l'uso 100% offline
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/localforage/1.10.0/localforage.min.js',
  'https://cdn.jsdelivr.net/npm/chart.js',
  'https://unpkg.com/html5-qrcode',
  'https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore-compat.js',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@500;700&display=swap'
];

// 1. INSTALLAZIONE: Pre-carica i file base senza bloccare se un CDN esterno tarda a rispondere
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await Promise.allSettled(
        CORE_ASSETS.map((url) =>
          fetch(url, { mode: 'cors' })
            .then((res) => {
              if (res.ok) return cache.put(url, res);
            })
            .catch(() => {})
        )
      );
    })
  );
});

// 2. ATTIVAZIONE: Elimina automaticamente le vecchie cache delle versioni precedenti (v7, v8, v9)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      )
    ).then(() => self.clients.claim())
  );
});

// 3. FETCH: Strategia Ibrida (Esclusione Firebase + Network-First per HTML + Stale-While-Revalidate per Librerie)
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Ignora richieste non-GET (es. POST di Firestore) o schemi non http/https
  if (req.method !== 'GET' || !req.url.startsWith('http')) return;

  const url = new URL(req.url);

  // CRITICO: Non intercettare mai il traffico dati di Firebase Firestore / Google APIs
  if (
    url.hostname.includes('firestore.googleapis.com') ||
    url.hostname.includes('firebaseio.com') ||
    url.hostname.includes('identitytoolkit.googleapis.com')
  ) {
    return;
  }

  // Per la pagina principale (index.html): Network-First con fallback in Cache
  if (req.mode === 'navigate' || url.pathname.endsWith('index.html') || url.pathname.endsWith('/')) {
    event.respondWith(
      fetch(req)
        .then((networkRes) => {
          const clone = networkRes.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          return networkRes;
        })
        .catch(() => caches.match('./index.html') || caches.match('./'))
    );
    return;
  }

  // Per librerie CDN, font e icone: Cache-First con aggiornamento silenzioso in background
  event.respondWith(
    caches.match(req).then((cachedRes) => {
      const fetchPromise = fetch(req)
        .then((networkRes) => {
          if (networkRes && networkRes.status === 200) {
            const clone = networkRes.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          }
          return networkRes;
        })
        .catch(() => cachedRes);

      return cachedRes || fetchPromise;
    })
  );
});
