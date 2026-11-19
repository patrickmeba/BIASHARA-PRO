// BIASHARA PRO : ouverture hors ligne. Les données (ventes, stock) sont gardées par Firestore
// sur l'appareil et se synchronisent toutes seules au retour d'internet.
const V = "biashara-pro-v2";
const SHELL = ["./", "./index.html", "./icon.svg", "./icon-192.png", "./icon-512.png", "./manifest.webmanifest"];
const LIBS = [
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js",
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js",
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore-compat.js",
  "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js",
  "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@600;700;800&family=Figtree:wght@400;500;600;700&display=swap"
];
const CDN = ["www.gstatic.com", "cdnjs.cloudflare.com", "fonts.googleapis.com", "fonts.gstatic.com"];

self.addEventListener("install", e => {
  self.skipWaiting();
  e.waitUntil(caches.open(V).then(c => Promise.all([
    ...SHELL.map(u => c.add(u).catch(() => {})),
    ...LIBS.map(u => fetch(new Request(u, { mode: "no-cors" })).then(r => c.put(u, r)).catch(() => {}))
  ])));
});

self.addEventListener("activate", e => e.waitUntil(
  caches.keys().then(k => Promise.all(k.filter(x => x !== V).map(x => caches.delete(x)))).then(() => self.clients.claim())
));

self.addEventListener("fetch", e => {
  const r = e.request;
  if (r.method !== "GET") return;
  const u = new URL(r.url);

  // Bibliothèques et polices : on garde en mémoire, on réutilise sans réseau.
  if (CDN.includes(u.hostname)) {
    e.respondWith(caches.match(r).then(m => m || fetch(r).then(x => {
      const y = x.clone(); caches.open(V).then(c => c.put(r, y)).catch(() => {}); return x;
    })));
    return;
  }

  if (u.origin !== location.origin) return; // Firestore, Auth : géré par Firebase

  // Fichiers du site : réponse immédiate depuis la mémoire, mise à jour en arrière-plan.
  const nav = r.mode === "navigate";
  e.respondWith(caches.match(r, { ignoreSearch: nav }).then(m => {
    const net = fetch(r).then(x => {
      if (x && x.ok) { const y = x.clone(); caches.open(V).then(c => c.put(nav ? "./index.html" : r, y)).catch(() => {}); }
      return x;
    }).catch(() => null);
    if (m) { e.waitUntil(net); return m; }
    return net.then(x => x || caches.match("./index.html"));
  }));
});
