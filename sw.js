/* ============================================================
   Aanmelding jeugdviscursus - sw.js (service worker)
   ------------------------------------------------------------
   Zorgt dat het aanmeldformulier offline beschikbaar blijft:
   de pagina en alle bijbehorende app-bestanden worden gecachet
   zodra de app voor het eerst geladen wordt. Bij elke wijziging
   van de bestanden deze CACHE-NAAM opvoeren (nieuwe versie).

   CACHE-NAAM: v20-20261003
   ============================================================ */

"use strict";

var CACHE_NAAM = "opgave-jeugdviscursus-v20";

var PRECACHE = [
  "./",
  "./index.html",
  "./opgave.html",
  "./opgave.js",
  "./style.css",
  "./manifest.json",
  "./logo.png"
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE_NAAM)
      .then(function (cache) {
        return cache.addAll(PRECACHE);
      })
      .then(function () {
        return self.skipWaiting();
      })
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys()
      .then(function (namen) {
        return Promise.all(
          namen
            .filter(function (n) { return n !== CACHE_NAAM; })
            .map(function (n) { return caches.delete(n); })
        );
      })
      .then(function () {
        return self.clients.claim();
      })
  );
});

self.addEventListener("fetch", function (event) {
  if (event.request.method !== "GET") { return; }
  var isPagina = event.request.mode === "navigate";
  if (isPagina) {
    event.respondWith(
      fetch(event.request)
        .then(function (respons) {
          var kopie = respons.clone();
          caches.open(CACHE_NAAM).then(function (cache) {
            cache.put(event.request, kopie);
          });
          return respons;
        })
        .catch(function () {
          return caches.match(event.request);
        })
    );
  } else {
    event.respondWith(
      caches.match(event.request)
        .then(function (inCache) {
          if (inCache) { return inCache; }
          return fetch(event.request);
        })
    );
  }
});
