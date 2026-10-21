'use strict';

/* Bump this name when you change the list of cached files. */
var CACHE = 'ryanto-v1';

/* Only these files of your own site are ever cached. */
var FILES = [
  './',
  'index.html',
  'styles.css',
  'app.js',
  'manifest.webmanifest',
  'icon-192.png',
  'icon-512.png',
  'apple-touch-icon.png',
  'offline.html'
];

function abs(p) { return new URL(p, self.registration.scope).href; }
var INDEX = abs('./');
var OFFLINE = abs('offline.html');
var ALLOWED = FILES.map(abs).concat(abs('index.html'));

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE).then(function (cache) {
      return cache.addAll(FILES.map(function (p) { return new Request(abs(p), { cache: 'reload' }); }));
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

function cacheable(res) {
  return res && res.status === 200 && res.type === 'basic' &&
    !/no-store/i.test(res.headers.get('Cache-Control') || '');
}

self.addEventListener('fetch', function (event) {
  var req = event.request;

  /* Ignore anything that is not a plain GET: form posts, payments and API calls never pass through here. */
  if (req.method !== 'GET') return;

  var url = new URL(req.url);

  /* Ignore every other website completely (Google Fonts, Maps, Unsplash, WhatsApp, UPI and so on). */
  if (url.origin !== self.location.origin) return;

  var isPage = req.mode === 'navigate';
  var key = isPage ? INDEX : url.origin + url.pathname;

  /* Ignore any of your own paths that are not in the list above. */
  if (!isPage && ALLOWED.indexOf(key) < 0) return;
  if (isPage && url.pathname !== new URL(INDEX).pathname && url.pathname !== new URL(abs('index.html')).pathname) return;

  event.respondWith(
    fetch(req).then(function (res) {
      if (cacheable(res)) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(key, copy); });
      }
      return res;
    }).catch(function () {
      return caches.match(key).then(function (hit) {
        if (hit) return hit;
        if (isPage) return caches.match(OFFLINE);
        return Response.error();
      });
    })
  );
});
