/* ============================================================
   BACKEND - Opgave jeugdviscursus HSV De Ruisvoorn (nieuw)
   ------------------------------------------------------------
   WAT DIT DOET
   - doPost:  elke formulier-aanmelding komt als rij in de
              gekoppelde spreadsheet terecht.
   - Timer:   de eigen functie 'verstuurOnverzondenMails' stuurt
              per nieuwe aanmelding een meldingsmail naar de club.
              De web-app zelf stuurt géén mail: een anonieme
              aanroep is daar niet toe geautoriseerd, daarom
              gebeurt het mailen via een timer die onder jouw
              eigen account draait.
   - Kolom U ("Mail verstuurd") toont per rij de afhandeling:
        'ja'      = mail verzonden
        FOUT-tekst = zichtbare foutmelding (zo is een probleem
                     meteen te zien en op te lossen)
        (leeg)    = nog niet door de timer verwerkt

   MELDINGSADRESSEN
   Wijzig hieronder de lijst als de mail naar andere adressen moet
   gaan. Voorbeeld:
     var MELDINGADRESSEN = ["ledenadministratie@hsvderuisvoorn.nl"];

   INSTALLEREN (eenmalig)
   1. Koppel dit bestand aan de spreadsheet "Aanmeldingen
      jeugdviscursus": open die sheet -> Extensies > Apps Script
      -> vervang alle code door DIT bestand -> Ctrl+S.
   2. Implementeren > Nieuwe implementatie > Web-app >
      Uitvoeren als: Ik  |  Toegang: Iedereen.
   3. Zet de /exec-URL in opgave.js (BACKEND_URL).
   4. Maak EEN timer: links het klok-icoon > + Add Trigger >
      functie: verstuurOnverzondenMails > Time-driven >
      Minutes timer > Every 5 minutes > Save.
   ============================================================ */

var MELDINGADRESSEN = [
  "secretariaat@hsvderuisvoorn.nl",
  "ledenadministratie@hsvderuisvoorn.nl"
];

/* ------------------------------------------------------------
   Ontvangt het formulier en zet de aanmelding in de sheet.
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
   Koppelt een spreadsheet en gebruikt (of maakt) tabblad
   "Aanmeldingen" met kolomkoppen.
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
    blad.getRange(1, blad.getLastColumn() + 1).setValue("Mail verstuurd");
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
   TIMER-FUNCTIE: verstuurt alle nog onverzonden meldingen.
   Zet deze op een timer (elke 5 minuten). Per rij komt in
   kolom U te staan: "ja" (verzonden) of de foutmelding.
   ------------------------------------------------------------ */
function verstuurOnverzondenMails() {
  var blad = koppelSpreadsheet().blad;
  var data = blad.getDataRange().getValues();

  for (var i = 1; i < data.length; i++) {
    var r = data[i];
    if (String(r[21]) === "ja") continue;   /* kolom V: al verzonden */

    try {
      var kind = escHtml([r[1], r[2]].join(" ").trim()) || "onbekend kind";
      var gebDatum = datumAlsTekst(r[3]);
      var opgDatum = datumAlsTekst(r[20]);
      if (MELDINGADRESSEN.length > 0) {
        var tekst =
          "Er is een nieuwe opgave voor de jeugdviscursus geregistreerd.\n\n" +
          "Kind: " + kind + "\n" +
          "Geboortedatum: " + gebDatum + "\n" +
          "Ouder/verzorger: " + r[7] + "\n" +
          "Telefoon: " + r[8] + "\n" +
          "E-mail: " + r[9] + "\n" +
          "Woonplaats: " + r[6] + "\n" +
          "Opgegeven op: " + opgDatum + "\n" +
          "\nAlle aanmeldingen staan in de spreadsheet 'Opgaves jeugdVIScursus' (tabblad Aanmeldingen).";
        for (var a = 0; a < MELDINGADRESSEN.length; a++) {
          MailApp.sendEmail({
            to: MELDINGADRESSEN[a],
            subject: "Nieuwe opgave jeugdviscursus: " + kind,
            body: tekst
          });
        }
      }
      blad.getRange(i + 1, 22).setValue("ja");
    } catch (fout) {
      blad.getRange(i + 1, 22).setValue("FOUT: " + fout);
    }
  }
}

function datumAlsTekst(w) {
  if (w instanceof Date) {
    return Utilities.formatDate(w, "GMT+0200", "dd-MM-yyyy");
  }
  return String(w || "");
}

function escHtml(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/* ------------------------------------------------------------
   Kleine bevestigingspagina als iemand de /exec-URL in een
   browser opent (geen formulier, alleen "backend werkt").
   ------------------------------------------------------------ */
function doGet() {
  return ContentService.createTextOutput("Backend opgave jeugdviscursus: actief.")
    .setMimeType(ContentService.MimeType.TEXT);
}