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

   ROBUUSTHEID
   - LockService: voorkomt dat twee runs tegelijk draaien.
   - De hele run wordt bij een tijdelijke fout nog 2× opnieuw
     geprobeerd (4 seconden wachten) voordat er wordt gemeld.
   - Per rij wordt de mail met maximaal 3 pogingen verstuurd.
   - Elke fout wordt gelogd (Uitvoeringen) en in de sheet gezet;
     onverwerkte rijen worden bij de volgende run opnieuw geprobeerd.
   - Fouten die ook na de herpogingen blijven bestaan, worden
     opnieuw opgeworpen zodat je het als melding blijft zien.

   INSTALLEREN (eenmalig)
   1. Log in als deruisvoornhelden@gmail.com.
   2. Ga naar https://script.google.com > Nieuw project.
   3. Vervang alle code door DIT bestand > Ctrl+S.
   4. Klok-icoon > + Add Trigger > functie
      verstuurOnverzondenMails > Time-driven > Every 5 minutes.
   5. Toestemming geven (> Toestaan). Klaar.

   UPDATE NA EERDERE INSTALLATIE:
   - Open het bestaande project, vervang alle code door de nieuwe
     versie en sla op (Ctrl+S). Trigger en rechten blijven staan.
   ============================================================ */

var MELDINGADRESSEN = [
  "secretariaat@hsvderuisvoorn.nl"
];

var SLUITLEUTEL = "verstuurOnverzondenMails.lock";

function verstuurOnverzondenMails() {
  var lock = LockService.getScriptLock();
  try {
    if (!lock.tryLock(30000)) {
      Logger.log("Vorige run draaide nog - deze run overgeslagen");
      return;
    }
    voerUitMetRetry();
  } catch (e) {
    Logger.log("FATAAL: " + e.message);
    try { Logger.log(e.stack); } catch (negeren) {}
    throw e;
  } finally {
    try { lock.releaseLock(); } catch (negeren) {}
  }
}

/* Probeert de hele run tot 3× bij een fout aan het begin
   (bijv. tijdelijke Google-serverfout bij het openen van de
   sheet); pas daarna wordt de fout doorgegeven. */
function voerUitMetRetry() {
  var maxPogingen = 3;
  for (var p = 1; p <= maxPogingen; p++) {
    try {
      verwerkOnverzondenMails();
      return;
    } catch (fout) {
      if (p === maxPogingen) throw fout;
      Logger.log("Runpoging " + p + " mislukt (" + fout.message + ") - opnieuw proberen");
      Utilities.sleep(4000);
    }
  }
}

function verwerkOnverzondenMails() {
  var gevonden = vindBlad();
  var blad = gevonden.blad;
  var sheetUrl = "https://docs.google.com/spreadsheets/d/" +
                 gevonden.bestandId + "/edit";
  var data = blad.getDataRange().getValues();

  Logger.log("Start: " + data.length + " rijen, bestand " + gevonden.bestandId);

  if (blad.getLastColumn() < 22) {
    blad.getRange(1, 22).setValue("Mail verstuurd");
  }

  var verzonden = 0;
  var fouten = 0;

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
        verzendMetRetry(MELDINGADRESSEN[a], "Nieuwe opgave jeugdviscursus: " + kind, tekst);
      }
      blad.getRange(i + 1, 22).setValue("ja");
      verzonden++;
    } catch (fout) {
      fouten++;
      Logger.log("Rij " + (i + 1) + " mislukt: " + fout.message);
      blad.getRange(i + 1, 22).setValue("FOUT: " + fout.message);
    }
  }

  Logger.log("Gereed: " + verzonden + " mails verzonden, " + fouten +
             " fouten, quota rest: " + MailApp.getRemainingDailyQuota());
}

/* Stuurt een mail met maximaal 3 pogingen (opvangen van
   tijdelijke Google-serverfouten). */
function verzendMetRetry(naar, onderwerp, tekst) {
  var maxPogingen = 3;
  for (var p = 1; p <= maxPogingen; p++) {
    try {
      MailApp.sendEmail({ to: naar, subject: onderwerp, body: tekst });
      return;
    } catch (fout) {
      if (p === maxPogingen) throw fout;
      Logger.log("Mailpoging " + p + " mislukt voor " + naar + ": " + fout.message);
      Utilities.sleep(2000 * p);
    }
  }
}

/* ------------------------------------------------------------
   Vindt de spreadsheet "Aanmeldingen jeugdviscursus" en het
   tabblad "Aanmeldingen" (maakt het tabblad indien nodig).
   ------------------------------------------------------------ */
function vindBlad() {
  var kandidaten = [];
  var it = DriveApp.getFilesByName("Aanmeldingen jeugdviscursus");
  while (it.hasNext()) {
    var f = it.next();
    if (f.getMimeType() === MimeType.GOOGLE_SHEETS) {
      kandidaten.push(f);
    }
  }
  if (kandidaten.length === 0) {
    throw new Error("spreadsheet 'Aanmeldingen jeugdviscursus' niet gevonden");
  }
  var bestand = SpreadsheetApp.openById(kandidaten[0].getId());
  var blad = bestand.getSheetByName("Aanmeldingen") ||
             bestand.insertSheet("Aanmeldingen");
  return { blad: blad, bestandId: kandidaten[0].getId() };
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