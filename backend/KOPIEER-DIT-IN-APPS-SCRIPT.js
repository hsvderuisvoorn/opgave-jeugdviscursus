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
    new Date(),                                   /* A datum/tijd opgave    */
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
    json.datumAanmelding   || "",                  /* U datum opgave (ISO)       */
    leeftijdTekst(json.geboorteDatumKind,
                  json.datumAanmelding)            /* V leeftijd bij aanmelding  */
  ]);

  return ContentService.createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
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
      "AVG-akkoord", "Whatsapp-groep", "Datum opgave (ISO)", "Mail verstuurd",
      "Leeftijd"
    ];
    blad.getRange(1, 1, 1, koppen.length)
        .setValues([koppen])
        .setFontWeight("bold")
        .setBackground("#1b5e20")
        .setFontColor("#ffffff");
  }

  if (blad.getLastColumn() < 22) {
    blad.getRange(1, 22).setValue("Mail verstuurd");
  }
  if (blad.getLastColumn() < 23) {
    blad.getRange(1, 23).setValue("Leeftijd");
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
  var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(waarde || "").trim());
  if (!m) return waarde || "";
  return m[3] + "-" + m[2] + "-" + m[1];
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
    var a = new Date(aanmelding);
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
    var iso = isoVan(waarden[r][3]);
    if (iso) {
      waarden[r][3] = nlDatum(iso);
      if (!waarden[r][22]) {
        waarden[r][22] = leeftijdTekst(iso, waarden[r][20] || "");
      }
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