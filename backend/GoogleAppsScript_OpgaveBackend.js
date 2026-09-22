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
    json.geboorteDatumKind || "",                 /* D geboortedatum        */
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
    json.datumAanmelding   || ""                  /* U datum opgave (ISO)   */
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
      "AVG-akkoord", "Whatsapp-groep", "Datum opgave (ISO)", "Mail verstuurd"
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