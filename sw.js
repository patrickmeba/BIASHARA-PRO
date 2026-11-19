// BIASHARA PRO : réseau d'abord, copie en mémoire seulement si hors connexion
const C="biashara-v3";
self.addEventListener("install",e=>self.skipWaiting());
self.addEventListener("activate",e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(n=>n!==C).map(n=>caches.delete(n)))).then(()=>self.clients.claim())));
self.addEventListener("fetch",e=>{const r=e.request;if(r.method!=="GET"||new URL(r.url).origin!==location.origin)return;
e.respondWith(fetch(r).then(x=>{const c=x.clone();caches.open(C).then(h=>h.put(r,c)).catch(()=>{});return x}).catch(()=>caches.match(r)))});
