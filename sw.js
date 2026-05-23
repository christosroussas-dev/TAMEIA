// Service worker για το ΤΑΜΕΙΟ (PWA) — minimal, network-first.
// Πάντα προσπαθεί δίκτυο πρώτα (φρέσκα δεδομένα). Κρατάει cache ΜΟΝΟ same-origin (HTML/εικονίδια)
// ως offline fallback. Τα αιτήματα Firebase/CDN (cross-origin) περνούν κατευθείαν, χωρίς cache.
const CACHE = 'tameio-v1';

self.addEventListener('install', function(e){ self.skipWaiting(); });
self.addEventListener('activate', function(e){ e.waitUntil(self.clients.claim()); });

self.addEventListener('fetch', function(e){
  var url;
  try { url = new URL(e.request.url); } catch(err){ return; }
  // Μόνο same-origin GET περνάει από εδώ· οτιδήποτε άλλο (Firebase, gstatic, cdnjs, POST) → default
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return;
  e.respondWith(
    fetch(e.request).then(function(res){
      var copy = res.clone();
      caches.open(CACHE).then(function(c){ c.put(e.request, copy); }).catch(function(){});
      return res;
    }).catch(function(){ return caches.match(e.request); })
  );
});
