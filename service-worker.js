const CACHE_NAME = "my-daily-routine-shell-v2";
const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./css/themes.css",
  "./css/style.css",
  "./css/dashboard.css",
  "./css/pages.css",
  "./css/responsive.css",
  "./css/news.css",
  "./js/pwa.js",
  "./js/utils.js",
  "./js/auth.js",
  "./js/router.js",
  "./js/dashboard.js",
  "./js/prayers.js",
  "./js/expenses.js",
  "./js/trading.js",
  "./js/calendar.js",
  "./js/analytics.js",
  "./js/profile.js",
  "./js/settings.js",
  "./js/admin.js",
  "./js/news.js",
  "./js/app.js",
  "./js/supabase-config.js",
  "./assets/images/avatar.svg",
  "./assets/images/app-icon.svg",
  "./assets/images/app-icon-192.png",
  "./assets/images/app-icon-512.png",
  "./pages/privacy.html",
  "./pages/news.html"
];
self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  // Keep the SPA navigation available offline; never cache authenticated data/API responses.
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).then(response => {
      if (response.ok) caches.open(CACHE_NAME).then(cache => cache.put("./index.html", response.clone()));
      return response;
    }).catch(() => caches.match("./index.html")));
    return;
  }
  if (url.pathname.includes("/pages/") || url.pathname.includes("/css/") || url.pathname.includes("/js/") || url.pathname.includes("/assets/")) {
    event.respondWith(caches.match(request).then(cached => cached || fetch(request).then(response => {
      if (response.ok) caches.open(CACHE_NAME).then(cache => cache.put(request, response.clone()));
      return response;
    })));
  }
});
