/* ============================================================
   Aanmelding jeugdviscursus - opgave.js
   ------------------------------------------------------------
   Verzamelt het ingevulde formulier en verstuurt het naar de
   Google Apps Script-backend (BACKEND_URL).

   OFFLINE-WACHTRIJ:
   - Als de backend niet bereikbaar is, wordt de aanmelding
     lokaal bewaard (localStorage, sleutel "wachtrijOpgave").
   - Zodra internet terugkeert (online-gebeurtenis) of bij een
     latere verstuurdruk wordt de wachtrij automatisch
     doorverstuurd.

   LET OP (aan het eind van dit bestand):
   - BACKEND_URL op de waarde van jouw gepubliceerde Apps
     Script-webapp zetten; tot die tijd wordt elke aanmelding
     alleen in de offline-wachtrij bewaard. Dat is veilig: er
     kan niets verloren gaan, alleen (nog) niet verzonden.
   ============================================================ */

"use strict";

/* ============================================================
   BELANGRIJK — CURSUSJAAR (elk jaar op slechts ÉÉN plek aanpassen)
   Hieronder staat op regel 24 het jaartal van de cursus.
   Dit jaartal wordt automatisch getoond in de paginatitel en
   in de grote kop (H1) van opgave.html. Verander alleen deze
   regel, en overal verschijnt het nieuwe jaartal vanzelf.
   ============================================================ */
var CURSUSJAAR = "2027";

/* ============================================================
   LEEFTIJDSGRENS (automatisch gebaseerd op CURSUSJAAR - 14)
   Regel: het kind mag op 1 januari van het cursusjaar nog
   GEEN 14 jaar zijn. De grens met het jaar wordt dus berekend
   uit CURSUSJAAR; u hoeft hier niets aan te passen.
   ============================================================ */
function controleerLeeftijd() {
  var veld = document.getElementById("geboorteDatumKind");
  var melding = document.getElementById("leeftijdMelding");
  if (!veld) { return true; }
  var datum = veld.value;
  if (!datum) { if (melding) { melding.hidden = true; } return true; }
  var grens = (parseInt(CURSUSJAAR, 10) - 14) + "-01-01";
  var teOud = datum <= grens;
  if (melding) { melding.hidden = !teOud; }
  if (teOud && veld) { veld.focus(); }
  return !teOud;
}


var BACKEND_URL = "https://script.google.com/macros/s/AKfycbwYSbUYsT3qT_nU3Lm107WEf9D4eAjmg6XVHzNn9_LdKZ1-gj3Lfa3Vf2V_SyKilyE0/exec";

var WACHTRIJ_SLEUTEL = "wachtrijOpgave";

/* ------------------------------------------------------------
   Wachtrij (offline-opslag)
   ------------------------------------------------------------ */
function haalWachtrij() {
  try {
    var ruw = localStorage.getItem(WACHTRIJ_SLEUTEL);
    return ruw ? JSON.parse(ruw) : [];
  } catch (e) {
    return [];
  }
}

function bewaarWachtrij(rij) {
  try {
    localStorage.setItem(WACHTRIJ_SLEUTEL, JSON.stringify(rij));
  } catch (e) { /* opslag niet beschikbaar (privacy-modus) */ }
}

/* ------------------------------------------------------------
   Statusmelding tonen
   ------------------------------------------------------------ */
function toonStatus(tekst, soort) {
  var el = document.getElementById("statusTekst");
  if (!el) { return; }
  el.textContent = tekst;
  el.className = "status-veld zichtbaar";
  if (soort === "ok")   { el.classList.add("status-ok"); }
  if (soort === "fout") { el.classList.add("status-fout"); }
  if (soort === "info") { el.classList.add("status-info"); }
}

/* ------------------------------------------------------------
   Bedanktpagina tonen na een succesvolle verzending
   ------------------------------------------------------------ */
function toonBedanktPagina() {
  var form = document.getElementById("opgaveForm");
  var sectie = document.getElementById("bedanktPagina");
  if (sectie) { sectie.hidden = false; }
  if (form)   { form.hidden = true;  }
  window.scrollTo(0, 0);
}

/* ------------------------------------------------------------
   Verzoek naar de backend sturen (Ã©Ã©n aanmelding)
   ------------------------------------------------------------ */
function verstuurAanmelding(aanmelding) {
  if (!BACKEND_URL) {
    return Promise.reject(new Error("BACKEND_URL_LEEG"));
  }
  return fetch(BACKEND_URL, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(aanmelding)
  }).then(function () {
    return "verstuurd";
  });
}

/* ------------------------------------------------------------
   Wachtrij doorsturen (zoveel mogelijk)
   ------------------------------------------------------------ */
function verstuurWachtrij() {
  var rij = haalWachtrij();
  if (!rij.length) { return Promise.resolve(0); }
  var beloften = rij.map(function (item) {
    return verstuurAanmelding(item).then(function () {
      /* geslaagd -> uit de wachtrij halen */
      var overig = haalWachtrij().filter(function (x) {
        return x.wachtrijId !== item.wachtrijId;
      });
      bewaarWachtrij(overig);
      return 1;
    }).catch(function () {
      return 0; /* niet gelukt, blijft in de wachtrij */
    });
  });
  return Promise.all(beloften).then(function (resultaten) {
    var geslaagd = resultaten.reduce(function (a, b) { return a + b; }, 0);
    if (geslaagd > 0 && !haalWachtrij().length) {
      toonStatus("Je aanmelding" + (geslaagd > 1 ? "en" : "") +
        " is verstuurd: Bedankt voor de aanmelding! Uw aanmelding is in goede orde ontvangen en zal worden verwerkt door onze jeugdafdeling. Let op: dit betekent niet automatisch dat uw kind ook daadwerkelijk kan deelnemen aan de jeugdviscursus. Zodra alle opgaves verwerkt zijn hoort u van ons of de deelname is bevestigd. Heeft u in de tussentijd vragen stuur die dan naar secretariaat@hsvderuisvoorn.nl", "ok");
      resetFormulier();
    }
    return geslaagd;
  });
}

/* ------------------------------------------------------------
   Formulier leegmaken na succesvol verzenden
   ------------------------------------------------------------ */
function resetFormulier() {
  var form = document.getElementById("opgaveForm");
  if (form) { form.reset(); }
}

/* ------------------------------------------------------------
   Uitlezen + versturen van het formulier
   ------------------------------------------------------------ */
function verzamelAanmelding() {
  function waarde(id) {
    var el = document.getElementById(id);
    return el ? el.value.trim() : "";
  }
  function radioWaarde(naam) {
    var r = document.querySelector('input[name="' + naam + '"]:checked');
    return r ? r.value : "";
  }
  function checkbox(id) {
    var el = document.getElementById(id);
    return el ? el.checked : false;
  }

  return {
    type: "aanmelding-jeugdviscursus",
    voornaamKind:   waarde("voornaamKind"),
    achternaamKind: waarde("achternaamKind"),
    geboorteDatumKind: waarde("geboorteDatumKind"),
    adres:          waarde("adres"),
    postcode:       waarde("postcode"),
    woonplaats:     waarde("woonplaats"),
    naamOuder:      waarde("naamOuder"),
    telefoonOuder:  waarde("telefoonOuder"),
    emailOuder:     waarde("emailOuder"),
    lid:            radioWaarde("lid"),
    lidnummer:      waarde("lidnummer"),
    eerderGevist:   radioWaarde("eerderGevist"),
    eersteKeer:     radioWaarde("eersteKeer"),
    allergie:       radioWaarde("allergie"),
    allergieDetails: waarde("allergieDetails"),
    opmerking:      waarde("opmerking"),
    fotoGemaakt:    radioWaarde("fotoGemaakt"),
    avgAkkoord:     checkbox("avgAkkoord"),
    whatsappGroep:  radioWaarde("whatsappGroep"),
    datumAanmelding: new Date().toISOString()
  };
}

function verstuurFormulier(e) {
  e.preventDefault();
  var form = document.getElementById("opgaveForm");

  /* HTML5-validatie + extra controle (nets onbetrouwbaar?) */
  if (!form.checkValidity()) {
    toonStatus("Er zijn nog verplichte velden niet (goed) ingevuld. De formulieren met een rode rand kan je verbeteren.", "fout");
    form.reportValidity();
    return;
  }

  if (!controleerLeeftijd()) {
    toonStatus("Opgave is niet mogelijk: dit kind is op 1 januari van het jaar van deelname al 14 jaar. Het kind mag op 1 januari van het cursusjaar nog geen 14 jaar zijn.", "fout");
    return;
  }

  var aanmelding = verzamelAanmelding();

  if (!BACKEND_URL) {
    /* Nog geen backend ingesteld -> bewaren in wachtrij */
    aanmelding.wachtrijId = "op-" + Date.now() + "-" +
      Math.random().toString(36).slice(2, 8);
    bewaarWachtrij(haalWachtrij().concat([aanmelding]));
    toonStatus("Je aanmelding is bewaard. Zodra de backend is ingesteld wordt hij automatisch verstuurd.", "info");
    return;
  }

  toonStatus("Aanmelding wordt verstuurd...", "info");
  verstuurAanmelding(aanmelding).then(function () {
    toonBedanktPagina();
    resetFormulier();
  }).catch(function () {
    aanmelding.wachtrijId = "op-" + Date.now() + "-" +
      Math.random().toString(36).slice(2, 8);
    bewaarWachtrij(haalWachtrij().concat([aanmelding]));
    toonStatus("Geen verbinding (of de backend is nog niet ingesteld). De aanmelding is bewaard en wordt later automatisch verstuurd.", "info");
  });
}

/* ------------------------------------------------------------
   Koppel klaarzetten: velden tonen/verbergen + online-herstel
   ------------------------------------------------------------ */
function koppelKlaarzetten() {
  var form = document.getElementById("opgaveForm");
  if (!form) { return; }
  form.addEventListener("submit", verstuurFormulier);
  form.noValidate = true;

  /* leeftijdscontrole direct bij het verlaten van het geboortedatumveld */
  var gebDatumVeld = document.getElementById("geboorteDatumKind");
  if (gebDatumVeld) {
    gebDatumVeld.addEventListener("blur", function () {
      controleerLeeftijd();
    });
    gebDatumVeld.addEventListener("change", function () {
      controleerLeeftijd();
    });
  }

  /* lid = ja -> lidnummer tonen */
  var lidGroep = document.getElementById("lidGroep");
  var lidJN    = document.querySelector('input[name="lid"]');
  function toonLidnummer() {
    var gekozen = document.querySelector('input[name="lid"]:checked');
    if (lidGroep) { lidGroep.hidden = !(gekozen && gekozen.value === "ja"); }
  }
  if (lidJN) {
    document.querySelectorAll('input[name="lid"]').forEach(function (r) {
      r.addEventListener("change", toonLidnummer);
    });
  }

  /* allergie = ja/dieet -> details tonen en verplicht maken */
  var allergieGroep = document.getElementById("allergieGroep");
  var allergieDetails = document.getElementById("allergieDetails");
  function toonAllergie() {
    var gekozen = document.querySelector('input[name="allergie"]:checked');
    var verplicht = !!(gekozen && gekozen.value !== "geen");
    if (allergieGroep) { allergieGroep.hidden = !verplicht; }
    if (allergieDetails) { allergieDetails.required = verplicht; }
  }
  document.querySelectorAll('input[name="allergie"]').forEach(function (r) {
    r.addEventListener("change", toonAllergie);
  });

  /*FotoGemaakt = ja -> foto-akkoord checkbox tonen */
  var fotoGroep = document.getElementById("fotoGroep");
  function toonFoto() {
    var gekozen = document.querySelector('input[name="fotoGemaakt"]:checked');
    if (fotoGroep) { fotoGroep.hidden = !(gekozen && gekozen.value === "ja"); }
  }
  document.querySelectorAll('input[name="fotoGemaakt"]').forEach(function (r) {
    r.addEventListener("change", toonFoto);
  });

  /* online -> wachtrij leegpompen */
  if ("ononline" in window) {
    window.addEventListener("online", function () {
      if (haalWachtrij().length) {
        verstuurWachtrij();
      }
    });
  }
}

document.addEventListener("DOMContentLoaded", koppelKlaarzetten);
