// Keeps the app's files on the phone so it opens without internet, and keeps them fresh when there is internet.
// Bump VERSION whenever any file changes (that is what tells phones there is something new).
//  - Install: every file is fetched straight from the server (cache: "reload"), never from the browser's own short-lived
//    HTTP cache. (Without that, an update right after another one could save the OLD files under the NEW version.)
//  - Use: online, ask the server first (a cheap "has it changed?" check) and keep the answer; offline, use the saved copy.
const VERSION = "planty-19";
const FILES = [
  "./", "index.html", "style.css", "icons.js", "species.js", "legacy.js", "config.js", "lib/qrcode.js", "store.js", "sync.js",
  "sky.js", "meter.js", "app.js", "manifest.webmanifest", "fonts/VT323-Regular.ttf",
  "art/tree_cutout.png", "art/icon-192.png", "art/icon-512.png",
];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(VERSION)
      .then(c => Promise.allSettled(FILES.map(f => c.add(new Request(f, { cache: "reload" })))))
      .then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET" || new URL(e.request.url).origin !== location.origin) return;   // the cloud is never cached
  e.respondWith(
    fetch(e.request, { cache: "no-cache" })
      .then(res => {
        if (res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(e.request, copy)); }
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true })));
});
