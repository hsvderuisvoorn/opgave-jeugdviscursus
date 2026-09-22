/* ============================================================
   TIMER-NOTIFICATIE  -  opgave jeugdviscursus HSV De Ruisvoorn
   ------------------------------------------------------------
   DIT BESTAND HOORT IN EEN EIGEN PROJECT VAN HET GMAIL-ACCOUNT
   "deruisvoornhelden@gmail.com".

   WAT HET DOET
   - Staat als timer (elke 5 minuten) in dat account.
   - Zoekt de spreadsheet "Aanmeldingen jeugdviscursus" (jullie
     aanmeldingen-sheet) op naam op.
- Stuurt voor elke onverwerkte rij een meldingsmail naar
      secretariaat@ met een link naar de sheet, en zet in kolom V
      ("Mail verstuurd") de status: "ja" of de fouttekst.

   INSTALLEREN (eenmalig)
   1. Log in als deruisvoornhelden@gmail.com.
   2. Ga naar https://script.google.com > Nieuw project.
   3. Vervang alle code door DIT bestand > Ctrl+S.
   4. Klok-icoon > + Add Trigger > functie
      verstuurOnverzondenMails > Time-driven > Every 5 minutes.
   5. Toestemming geven (> Toestaan). Klaar.
   ============================================================ */

var MELDINGADRESSEN = [
  "secretariaat@hsvderuisvoorn.nl"
];

function verstuurOnverzondenMails() {
  var gevonden = vindBlad();
  var blad = gevonden.blad;
  var sheetUrl = "https://docs.google.com/spreadsheets/d/" +
                 gevonden.bestandId + "/edit";
  var data = blad.getDataRange().getValues();

  if (blad.getLastColumn() < 22) {
    blad.getRange(1, 22).setValue("Mail verstuurd");
  }

  for (var i = 1; i < data.length; i++) {
    var r = data[i];
    if (String(r[21]) === "ja") continue;   /* kolom V: al gemailed */

    try {
      var kind = escHtml([r[1], r[2]].join(" ").trim()) || "onbekend kind";
      var tekst =
        "Er is een nieuwe opgave voor de jeugdviscursus geregistreerd.\n\n" +
        "Kind: " + kind + "\n" +
        "Geboortedatum: " + datumAlsTekst(r[3]) + "\n" +
        "Ouder/verzorger: " + r[7] + "\n" +
        "Telefoon: " + r[8] + "\n" +
        "E-mail: " + r[9] + "\n" +
        "Woonplaats: " + r[6] + "\n" +
        "Opgegeven op: " + datumAlsTekst(r[20]) + "\n" +
        "\nDirect openen: " + sheetUrl + "\n" +
        "\nAlle aanmeldingen staan in de spreadsheet 'Aanmeldingen jeugdviscursus' (tabblad Aanmeldingen).";
      for (var a = 0; a < MELDINGADRESSEN.length; a++) {
        MailApp.sendEmail({
          to: MELDINGADRESSEN[a],
          subject: "Nieuwe opgave jeugdviscursus: " + kind,
          body: tekst
        });
      }
      blad.getRange(i + 1, 22).setValue("ja");
    } catch (fout) {
      blad.getRange(i + 1, 22).setValue("FOUT: " + fout);
    }
  }
}

/* ------------------------------------------------------------
   Vindt de spreadsheet "Aanmeldingen jeugdviscursus" en het
   tabblad "Aanmeldingen" (maakt het tabblad indien nodig).
   ------------------------------------------------------------ */
function vindBlad() {
  var hit = null;
  var it = DriveApp.getFilesByName("Aanmeldingen jeugdviscursus");
  while (it.hasNext()) {
    var f = it.next();
    if (f.getMimeType() === MimeType.GOOGLE_SHEETS) {
      hit = f;
      break;
    }
  }
  if (!hit) {
    throw new Error("spreadsheet 'Aanmeldingen jeugdviscursus' niet gevonden");
  }
  var bestand = SpreadsheetApp.openById(hit.getId());
  var blad = bestand.getSheetByName("Aanmeldingen") ||
             bestand.insertSheet("Aanmeldingen");
  return { blad: blad, bestandId: hit.getId() };
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