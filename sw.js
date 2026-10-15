// Offline cache. Bump VERSION whenever you change files so her phone picks up the update.
const VERSION = "bloom-v5";
const FILES = ["./", "index.html", "css/base.css", "css/theme.css", "js/main.js", "js/core.js", "js/engine.js", "js/plan.js", "js/figures.js", "js/config.js", "js/workouts.js", "js/cycle.js", "js/cycle-ui.js", "js/faith.js", "js/bible.js", "css/faith.css", "manifest.json", "icons/icon-180.png", "icons/icon-192.png"];
self.addEventListener("install", (e) => { e.waitUntil(caches.open(VERSION).then((c) => c.addAll(FILES))); self.skipWaiting(); });
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith("bloom-") && k !== VERSION).map((k) => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  // Bible text never changes: serve it from its own cache (kept across app updates) so it works offline
  if (new URL(e.request.url).pathname.includes("/bible/")) {
    e.respondWith(caches.open("bible-v1").then((c) => c.match(e.request).then((hit) => hit || fetch(e.request).then((res) => { if (res.ok) c.put(e.request, res.clone()); return res; }))));
    return;
  }
  e.respondWith(fetch(e.request).then((res) => { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(e.request, copy)); return res; }).catch(() => caches.match(e.request)));
});
