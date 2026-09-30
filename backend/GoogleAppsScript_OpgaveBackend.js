/* ============================================================
   BACKEND (webapp) - Opgave jeugdviscursus HSV De Ruisvoorn
   ------------------------------------------------------------
   ALGEMEEN: dit is het éénpuntige, schone bestand.
   - Zet HET in het Apps Script-project dat gekoppeld zit aan de
     nieuwe spreadsheet "Aanmeldingen jeugdviscursus".
   - De web-app slaat uitsluitend aanmeldingen op. De meldingsmail
     verstuurt een APART TIMER-PROJECT (bestand
     "TIMER-NOTIFICATIE.js"); dat staat in een eigen project van
     deruisvoornhelden@gmail.com. Waarom? Omdat het club-domein
     (hsvderuisvoorn.nl) op Microsoft draait met een streng
     spambeleid (SPF/DMARC): mails "van paul@hsvderuisvoorn.nl"
     worden daardoor in quarantaine gezet, terwijl mails vanaf een
     gewoon Gmail-account altijd aankomen.

   HOE INSTALLEREN? (eenmalig, in 4 stappen)
   1. Drive > map "Opgave jeugdcursus" > Nieuw > Google Spreadsheets
      > hernoem: "Aanmeldingen jeugdviscursus".
   2. Open die sheet > Extensies > Apps Script > kies/kopieer de
      projectnaam door deze te klikken; vervang ALLE code door DIT
      bestand > Ctrl+S.
   3. Implementeren > Nieuwe implementatie > Web-app >
      Uitvoeren als: Ik  |  Toegang: Iedereen > Implementeren.
   4. Kopieer de /exec-URL en zet die in opgave.js (BACKEND_URL).
   GEEN TRIGGER NODIG HIER: dit project verstuurt geen mail.
   ============================================================ */

/* ------------------------------------------------------------
   Ontvangt het formulier en zet de aanmelding als rij in de
   spreadsheet (tabblad "Aanmeldingen").
   ------------------------------------------------------------ */
function doPost(e) {
  var json = {};
  try {
    if (e && e.postData && e.postData.contents) {
      json = JSON.parse(e.postData.contents);
    }
  } catch (fout) {
    json = {};
  }

  var blad = koppelSpreadsheet().blad;
  blad.appendRow([
    naarDagMaandJaar(new Date()),              /* A datum opgave (dd-mm-jjjj)    */
    json.voornaamKind      || "",                 /* B voornaam kind        */
    json.achternaamKind    || "",                 /* C achternaam kind      */
    nlDatum(json.geboorteDatumKind),           /* D geboortedatum (dd-mm-jjjj)  */
    json.adres             || "",                 /* E adres                */
    json.postcode          || "",                 /* F postcode             */
    json.woonplaats        || "",                 /* G woonplaats           */
    json.naamOuder         || "",                 /* H ouder/verzorger      */
    json.telefoonOuder     || "",                 /* I telefoon ouder       */
    json.emailOuder        || "",                 /* J e-mail ouder         */
    json.lid               || "",                 /* K lid vereniging?      */
    json.lidnummer         || "",                 /* L lidmaatschapsnr      */
    json.eerderGevist      || "",                 /* M eerder gevist?       */
    json.eersteKeer        || "",                 /* N eerste keer cursus?  */
    json.allergie          || "",                 /* O allergie keuze       */
    json.allergieDetails   || "",                 /* P toelichting allergie */
    json.opmerking         || "",                 /* Q opmerkingen          */
    json.fotoGemaakt       || "",                 /* R foto's mogen?        */
    json.avgAkkoord      === true ? "ja" : "nee", /* S AVG-akkoord          */
    json.whatsappGroep     || "",                 /* T whatsapp-groep       */
    nlDatum(json.datumAanmelding),                 /* U datum opgave (dd-mm-jjjj)  */
    "",                                            /* V mail verstuurd (timer vult) */
    leeftijdTekst(json.geboorteDatumKind,
                  json.datumAanmelding)            /* W leeftijd bij aanmelding   */
  ]);

  opmaakToepassen(blad);

  return ContentService.createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ------------------------------------------------------------
   Opmaak van de sheet (handmatig draaien): ► verfraaiOpgaveSheet
   ------------------------------------------------------------ */
function verfraaiOpgaveSheet() {
  var blad = koppelSpreadsheet().blad;
  verwijderKolommenXYZ(blad);
  opmaakToepassen(blad);
}

/* ------------------------------------------------------------
   Verwijdert oude/lege kolommen X, Y en Z (24 t/m laatste) uit het
   tabblad 'Aanmeldingen'. Eenmalig handmatig draaien; staat ook
   vooraan verfraaiOpgaveSheet zodat een nieuw opgemaakte sheet
   netjes eindigt bij Leeftijd (W).
   ------------------------------------------------------------ */
function verwijderKolommenXYZ(blad) {
  var laatste = blad.getLastColumn();
  if (laatste >= 24) {
    blad.deleteColumns(24, laatste - 23);
    Logger.log("Extra kolommen vanaf X verwijderd (had " + laatste + " kolommen).");
  }
}

/* Zet consistente opmaak op de hele sheet: groene/witte koptekst,
   eerste rij bevroren, randen en tekst omslaan voor de lange
   kolommen; kolombreedtes passen zich automatisch aan de tekst aan.
   Kan gerust vaker draaien. */
function opmaakToepassen(blad) {
  blad.setRowHeight(1, 24);
  blad.setFrozenRows(1);

  var kop = blad.getRange(1, 1, 1, 23);
  kop.setFontWeight("bold")
     .setBackground("#1b5e20")
     .setFontColor("#ffffff")
     .setFontFamily("Arial")
     .setFontSize(10)
     .setHorizontalAlignment("center")
     .setVerticalAlignment("middle")
     .setBorder(true, true, true, true, true, true,
                "#cfd8dc", SpreadsheetApp.BorderStyle.SOLID);

  var laatste = blad.getLastRow();
  if (laatste >= 2) {
    var data = blad.getRange(2, 1, laatste - 1, 23);
    data.setFontFamily("Arial")
        .setFontSize(10)
        .setVerticalAlignment("middle")
        .setBorder(true, true, true, true, true, true,
                   "#e0e0e0", SpreadsheetApp.BorderStyle.SOLID);
    /* tekst omslaan voor de lange kolommen: E=adres, P=toelichting,
       Q=opmerkingen, V=mailstatus */
    for (var k = 0; k < [5, 16, 17, 22].length; k++) {
      blad.getRange(2, [5, 16, 17, 22][k], laatste - 1, 1).setWrap(true);
    }
    fitKolombreedtes(blad, laatste);
  } else {
    fitKolombreedtes(blad, 1);
  }
}

/* Pas kolombreedtes aan de langste tekst in elke kolom aan (kop rij
   en alle rijen eronder). Kolommen met tekst-omslaan mogen niet
   eindeloos uitrekken; die krijgen een max-breedte. */
function fitKolombreedtes(blad, laatste) {
  if (laatste < 1) laatste = 1;
  var kopRij = blad.getRange(1, 1, 1, 23).getValues()[0];
  var waarden = laatste >= 2 ? blad.getRange(2, 1, laatste - 1, 23).getValues() : [];
  var omslaan = [5, 16, 17, 22];              /* E, P, Q en V */
  var maxPerKolom = {
    1: 10,                                    /* A datum: compact                  */
    22: 16,                                   /* V mailstatus: compact             */
    10: 34                                    /* J e-mail: niet eindeloos breed    */
  };
  var limietNormaal = 45;
  var limietWrap = 30;
  for (var c = 0; c < 23; c++) {
    var kolom = c + 1;
    var langste = String(kopRij[c] || "").length;
    for (var r = 0; r < waarden.length; r++) {
      var regels = String(waarden[r][c] || "").split("\n");
      for (var z = 0; z < regels.length; z++) {
        if (regels[z].length > langste) langste = regels[z].length;
      }
    }
    var limiet = maxPerKolom[kolom];
    if (!limiet) limiet = omslaan.indexOf(kolom) !== -1 ? limietWrap : limietNormaal;
    var tekens = Math.min(limiet, langste);
    blad.setColumnWidth(c + 1, Math.ceil(tekens * 8.5) + 12);
  }
}

/* ------------------------------------------------------------
   Koppelt een spreadsheet en gebruikt (of maakt) het tabblad
   "Aanmeldingen" met kolomkoppen (t/m "Mail verstuurd", dat de
   timer gebruikt).
   ------------------------------------------------------------ */
function koppelSpreadsheet() {
  var bestand;
  try {
    bestand = SpreadsheetApp.getActiveSpreadsheet();
  } catch (fout) {
    bestand = null;
  }

  if (!bestand) {
    bestand = SpreadsheetApp.create("Aanmeldingen jeugdviscursus");
    verplaatsNaarMap(bestand, "Opgave jeugdcursus");
  }

  var blad = bestand.getSheetByName("Aanmeldingen");
  var nieuwGemaakt = false;

  if (!blad) {
    blad = bestand.insertSheet("Aanmeldingen");
    nieuwGemaakt = true;
  }

  if (nieuwGemaakt || blad.getLastRow() === 0) {
    var koppen = [
      "Datum", "Voornaam kind", "Achternaam kind", "Geboortedatum",
      "Adres", "Postcode", "Woonplaats", "Naam ouder/verzorger",
      "Telefoon", "E-mail", "Lid vereniging", "Lidmaatschapsnr",
      "Eerder gevist", "Eerste keer cursus", "Allergie",
      "Toelichting allergie", "Opmerkingen", "Foto's toegestaan",
      "AVG-akkoord", "Whatsapp-groep", "Datum opgave", "Mail verstuurd",
      "Leeftijd"
    ];
    blad.getRange(1, 1, 1, koppen.length)
        .setValues([koppen])
        .setFontWeight("bold")
        .setBackground("#1b5e20")
        .setFontColor("#ffffff");
    opmaakToepassen(blad);
  }

  if (blad.getLastColumn() < 22) {
    blad.getRange(1, 22).setValue("Mail verstuurd");
  }
  if (blad.getLastColumn() < 23) {
    blad.getRange(1, 23).setValue("Leeftijd");
  }
  /* bestaande sheet: nog oude kop 'Datum opgave (ISO)' hernoemen */
  if (String(blad.getRange(1, 21).getValue()) === "Datum opgave (ISO)") {
    blad.getRange(1, 21).setValue("Datum opgave");
  }

  return { blad: blad, nieuwGemaakt: nieuwGemaakt };
}

/* ------------------------------------------------------------
   Zet een nieuwe spreadsheet in de opgegeven map op de Drive.
   ------------------------------------------------------------ */
function verplaatsNaarMap(bestand, mapNaam) {
  var gids = DriveApp.getFileById(bestand.getId());
  var zoeker = DriveApp.getFoldersByName(mapNaam);
  if (!zoeker.hasNext()) {
    DriveApp.createFolder(mapNaam);
    zoeker = DriveApp.getFoldersByName(mapNaam);
  }
  gids.moveTo(zoeker.next());
}

/* ------------------------------------------------------------
   Bevestigingspagina als iemand de /exec-URL in een browser
   opent (geen formulier, alleen "backend actief").
   ------------------------------------------------------------ */
function doGet() {
  return ContentService.createTextOutput("Backend opgave jeugdviscursus: actief.")
    .setMimeType(ContentService.MimeType.TEXT);
}

/* ------------------------------------------------------------
   Zet "jjjj-mm-dd" (radioformaat/ISO) om naar "dd-mm-jjjj".
   ------------------------------------------------------------ */
function nlDatum(waarde) {
  var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(waarde || "").trim());
  if (!m) return waarde || "";
  return m[3] + "-" + m[2] + "-" + m[1];
}

/* ------------------------------------------------------------
   Zet een datum (Date, ISO-tekenreeks of dd-mm-jjjj) om naar een
   losse datum in dd-mm-jjjj. Gebruikt de tijdzone van het project,
   zodat de datum ook 's avonds/’s winters klopt.
   ------------------------------------------------------------ */
function naarDagMaandJaar(waarde) {
  if (waarde instanceof Date && !isNaN(waarde.getTime())) {
    return Utilities.formatDate(waarde, Session.getScriptTimeZone(), "dd-MM-yyyy");
  }
  return nlDatum(waarde);
}

/* ------------------------------------------------------------
   Leeftijd (in jaren) op het moment van aanmelding.
   ------------------------------------------------------------ */
function leeftijdTekst(geboorte, aanmelding) {
  var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(geboorte || "").trim());
  if (!m) return "";
  var g = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  var nu = new Date();
  if (aanmelding) {
    var a;
    if (aanmelding instanceof Date) {
      a = aanmelding;
    } else {
      var iso = isoVan(aanmelding);
      a = iso ? new Date(iso + "T00:00:00") : new Date(aanmelding);
    }
    if (!isNaN(a.getTime())) nu = a;
  }
  var lft = nu.getFullYear() - g.getFullYear();
  var mnd = nu.getMonth() - g.getMonth();
  if (mnd < 0 || (mnd === 0 && nu.getDate() < g.getDate())) lft--;
  if (lft < 0) lft = 0;
  return lft > 0 ? lft + " jaar" : "";
}

/* ------------------------------------------------------------
   Eénmalig: corrigeer bestaande rijen in de sheet.
   1) Geboortedatum (kolom D) omzetten naar dd-mm-jjjj.
   2) Leeftijd (kolom W) invullen voor rijen zonder waarde.
   Draai dit handmatig via het dropdown-menuletje ► in de
   Apps Script-editor (functie: fixeerOpgaveData) of via een
   trigger; het kan gerust meerdere keren.
   ------------------------------------------------------------ */
function fixeerOpgaveData() {
  var blad = koppelSpreadsheet().blad;
  var laatste = blad.getLastRow();
  if (laatste < 2) return;
  var waarden = blad.getRange(2, 1, laatste - 1, 23).getValues();
  for (var r = 0; r < waarden.length; r++) {
    waarden[r][0] = naarDagMaandJaar(waarden[r][0]);
    var iso = isoVan(waarden[r][3]);
    if (iso) {
      waarden[r][3] = nlDatum(iso);
      if (!waarden[r][22]) {
        waarden[r][22] = leeftijdTekst(iso, waarden[r][20] || "");
      }
    }
    /* oudere rijen hadden de leeftijd per abuis in kolom V (mailstatus); ruimen op */
    if (/^\d+\s*jaar$/.test(String(waarden[r][21] || ""))) {
      waarden[r][21] = "";
    }
    /* kolom U: datum opgave als losse datum in dd-mm-jjjj (was ISO-datum/-tijdstip) */
    var u0 = String(waarden[r][20] || "").trim();
    if (u0) {
      waarden[r][20] = nlDatum(u0);
    }
  }
  blad.getRange(2, 1, waarden.length, 23).setValues(waarden);
}

/* ------------------------------------------------------------
   Haalt "jjjj-mm-dd" uit een Date, een ISO-tekenreeks of een
   dd-mm-jjjj-tekenreeks. Geeft "" terug als het niet herkend.
   ------------------------------------------------------------ */
function isoVan(waarde) {
  if (waarde instanceof Date && !isNaN(waarde.getTime())) {
    return Utilities.formatDate(waarde, "GMT+0200", "yyyy-MM-dd");
  }
  var s = String(waarde || "").trim();
  var m1 = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (m1) return m1[1] + "-" + m1[2] + "-" + m1[3];
  var m2 = /^(\d{2})-(\d{2})-(\d{4})$/.exec(s);
  if (m2) return m2[3] + "-" + m2[2] + "-" + m2[1];
  return "";
}