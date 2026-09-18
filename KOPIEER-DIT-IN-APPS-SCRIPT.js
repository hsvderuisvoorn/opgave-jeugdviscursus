/* ============================================================================
   BACKEND - Google Apps Script
   "Opgave jeugdviscursus HSV De Ruisvoorn"

   ------------------------------------------------------------
   WAT DIT DOET
   ------------------------------------------------------------
   Elke inzending van het aanmeldingsformulier (opgave.html) komt
   als POST binnen en wordt als een rij in een Google Sheet gezet.
   Je houdt de aanmeldingen dus gewoon bij in een spreadsheet.

   ------------------------------------------------------------
   INSTALLEREN (eenmalig, duurt ca. 2 minuten)
   ------------------------------------------------------------
   1. Ga naar https://script.google.com  en kies
      "Nieuw project" (of open een bestaand project).
   2. Vervang alle code in de editor door DIT volledige bestand.
   3. Geef het project een naam, bijv. "OpgaveJeugdviscursusBackend".
   4. Klik op "Implementeren" > "Nieuwe implementatie".
   5. Kies type  "Web-app".
   6. Voer uit als:  "Ik"  (belangrijk: niet "Gebruiker die de app
      opent", anders werkt het niet).
   7. Wie heeft toegang:  "Iedereen"  (ook anoniem, zonder inlog).
   8. Klik op "Implementeren" en kopieer de Web-app-URL
      (eindigt op .../exec).
   9. Plak die URL in opgave.js op de regel:
        var BACKEND_URL = "https://script.google.com/.../exec";
   Klaar. Vanaf nu komen aanmeldingen in je sheet terecht.

   OPTIONEEL (aanbevolen):
   - Open de spreadsheet die je aan Apps Script hebt gekoppeld
     (of maak er direct een naartoe met createSpreadsheet uit de
     doPost-code hieronder) en kijk of het blad "Aanmeldingen"
     bestaat met de kolomkoppen van hieronder.
   ============================================================================ */

function doPost(e) {
  var antwoord = maakAntwoord;
  var json = {};

  try {
    if (e && e.postData && e.postData.contents) {
      json = JSON.parse(e.postData.contents);
    }
  } catch (err) {
    json = {};
  }

  var werkmappen = koppelSpreadsheet();
  var blad = werkmappen.blad;
  var nieuwGemaakt = werkmappen.nieuwGemaakt;

  var rij = [
    new Date(),                                   /* A: datum/tijd opgave      */
    json.voornaamKind        || "",               /* B: voornaam kind          */
    json.achternaamKind      || "",               /* C: achternaam kind        */
    json.geboorteDatumKind   || "",               /* D: geboortedatum kind     */
    json.adres               || "",               /* E: adres                  */
    json.postcode            || "",               /* F: postcode               */
    json.woonplaats          || "",               /* G: woonplaats             */
    json.naamOuder           || "",               /* H: naam ouder/verzorger   */
    json.telefoonOuder       || "",               /* I: telefoon ouder         */
    json.emailOuder          || "",               /* J: e-mail ouder           */
    json.lid                 || "",               /* K: lid vereniging?        */
    json.lidnummer           || "",               /* L: lidmaatschapsnr        */
    json.eerderGevist        || "",               /* M: eerder gevist?         */
    json.eersteKeer          || "",               /* N: eerste keer cursus?    */
    json.allergie            || "",               /* O: allergie keuze         */
    json.allergieDetails     || "",               /* P: toelichting allergie   */
    json.opmerking           || "",               /* Q: opmerkingen            */
    json.fotoGemaakt         || "",               /* R: foto's mogen?          */
    json.avgAkkoord        === true ? "ja" : "nee", /* S: AVG-akkoord         */
    json.whatsappGroep       || "",               /* whatsapp-groep keuze     */
    json.datumAanmelding     || ""                /* T: datum opgave (ISO)     */
  ];

  if (nieuwGemaakt) {
    /* eenmalig kolommen aanbrengen = zelfde volgorde als rij[] */
    blad.getRange(1, 1, 1, rij.length)
        .setValues([[
          "Datum", "Voornaam kind", "Achternaam kind", "Geboortedatum",
          "Adres", "Postcode", "Woonplaats", "Naam ouder/verzorger",
          "Telefoon", "E-mail", "Lid vereniging", "Lidmaatschapsnr",
          "Eerder gevist", "Eerste keer cursus", "Allergie",
          "Toelichting allergie", "Opmerkingen", "Foto's toegestaan",
          "AVG-akkoord", "Whatsapp-groep", "Datum opgave (ISO)"
        ]])
        .setFontWeight("bold")
        .setBackground("#1b5e20")
        .setFontColor("#ffffff");
  }

  blad.appendRow(rij);

  return ContentService.createTextOutput(
    JSON.stringify({
      ok: true,
      rij: rij.length,
      rij_id: json.wachtrijId || null
    })
  ).setMimeType(ContentService.MimeType.JSON);
}

/* ------------------------------------------------------------
   Koppelt / maakt de spreadsheet en het blad "Aanmeldingen".
   Returned { blad, nieuwGemaakt }.
   ------------------------------------------------------------ */
function koppelSpreadsheet() {
  var bestand;

  try {
    bestand = SpreadsheetApp.getActiveSpreadsheet();
  } catch (err) {
    bestand = null;
  }

  if (!bestand) {
    /* geen gekoppelde spreadsheet: maak er een bij de webapp */
    bestand = SpreadsheetApp.create("Aanmeldingen jeugdviscursus");
  }

  var blad = bestand.getSheetByName("Aanmeldingen");
  var nieuwGemaakt = false;

  if (!blad) {
    blad = bestand.insertSheet("Aanmeldingen");
    nieuwGemaakt = true;
  }

  return {
    blad: blad,
    nieuwGemaakt: nieuwGemaakt
  };
}

/* ------------------------------------------------------------
   Eenvoudige hulpfunctie voor mogelijke helpers hieronder.
   ------------------------------------------------------------ */
function maakAntwoord(ok, bericht) {
  return ContentService.createTextOutput(
    JSON.stringify({ ok: ok, bericht: bericht })
  ).setMimeType(ContentService.MimeType.JSON);
}