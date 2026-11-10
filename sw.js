// Keeps the app's files on the phone so it opens without internet.
// Bump VERSION whenever a file changes, so phones pick up the new one.
const VERSION = "planty-11";
const FILES = [
  "./", "index.html", "style.css", "icons.js", "species.js", "legacy.js", "config.js", "lib/qrcode.js", "store.js", "sync.js", "sky.js", "meter.js", "app.js",
  "manifest.webmanifest", "fonts/VT323-Regular.ttf",
  "art/tree_cutout.png", "art/icon-192.png", "art/icon-512.png",
];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET" || new URL(e.request.url).origin !== location.origin) return;   // the cloud is never cached
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(hit => hit || fetch(e.request)));
});
