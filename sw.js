/*
    INFLATE - service worker

    Lets browsers install the game as an app and keeps a copy of the game
    files on the device, so the installed app opens fast and works offline.

    AFTER EVERY NEW BUILD: change VERSION below (inflate-v1 -> inflate-v2 ...).
    Players then get the new files instead of the old saved copy.

    Strategy: network first, saved copy as fallback. When online, players
    always get the newest files (and the saved copy is refreshed); when
    offline, the saved copy is used.
*/
var VERSION = 'inflate-v3';
var FILES = [
    './',
    'index.html',
    'play.html',
    'manifest.json',
    'icon.svg',
    'icon-192.png',
    'icon-512.png',
    'game.js',
    'game.data',
    'love.js',
    'love.wasm'
];

self.addEventListener('install', function (event) {
    event.waitUntil(
        caches.open(VERSION)
            .then(function (cache) { return cache.addAll(FILES); })
            .then(function () { return self.skipWaiting(); })
    );
});

// throw away saved copies from older versions
self.addEventListener('activate', function (event) {
    event.waitUntil(
        caches.keys().then(function (keys) {
            return Promise.all(keys.map(function (k) {
                if (k !== VERSION) return caches.delete(k);
            }));
        }).then(function () { return self.clients.claim(); })
    );
});

self.addEventListener('fetch', function (event) {
    var req = event.request;
    if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
    event.respondWith(
        fetch(req).then(function (res) {
            if (res && res.ok) {
                var copy = res.clone();
                caches.open(VERSION).then(function (cache) { cache.put(req, copy); });
            }
            return res;
        }).catch(function () {
            return caches.match(req, { ignoreSearch: true });
        })
    );
});
