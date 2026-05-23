const CACHE = "7min-v10.4";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./exercises.js",
  "./workouts.js",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./exercises/hampelmann.png",
  "./exercises/wandsitzen.png",
  "./exercises/liegestuetze.png",
  "./exercises/kniebeugen.png",
  "./exercises/bauchpressen.png",
  "./exercises/auf-den-stuhl-steigen.png",
  "./exercises/trizeps-dips.png",
  "./exercises/ausfallschritte.png",
  "./exercises/hoher-kniehebelauf.png",
  "./exercises/seitlicher-unterarmstuetz.png",
  "./exercises/liegestuetze-rotation.png",
  "./exercises/unterarmstuetz.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  event.respondWith(
    caches.match(req).then((cached) => {
      return (
        cached ||
        fetch(req)
          .then((res) => {
            if (!res || res.status !== 200 || res.type !== "basic") return res;
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
            return res;
          })
          .catch(() => cached)
      );
    })
  );
});
