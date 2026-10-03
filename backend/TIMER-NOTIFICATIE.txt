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
     secretariaat@ met een link naar de sheet.
   - Stuurt daarnaast een bevestigingsmail naar de ouder/verzorger
     (e-mailadres in kolom J) met dezelfde tekst als de
     bedankpagina, aanhef "Beste ouders/voogd".
   - Zet in kolom V ("Mail verstuurd") de status: "ja" of de
     fouttekst.

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
   5B. (OPTIONEEL, voor de afzender "secretariaat@..."):
      Instellingen > Accounts en import > "Ander e-mailadres
      verzenden als" > voeg secretariaat@hsvderuisvoorn.nl toe en
      bevestig de code in het secretariaatsmailadres. Dan komt de
      bevestigingsmail aan de ouder écht "van" secretariaat@
      hsvderuisvoorn.nl binnen in plaats van vanuit het gmail-
      account. Zonder deze alias verstuurt het script automatisch
      via deruisvoornhelden@gmail.com met alleen de afzendernaam
      "Secretariaat HSV De Ruisvoorn".

   UPDATE NA EERDERE INSTALLATIE:
   - Open het bestaande project, vervang alle code door de nieuwe
     versie en sla op (Ctrl+S). Trigger en rechten blijven staan.
   - Vanaf deze versie wordt er óók een bevestigingsmail naar de
     ouder/verzorger gestuurd (kolom J). Rijen die al "ja" in
     kolom V hebben worden niet opnieuw gemailed.
   ============================================================ */

var MELDINGADRESSEN = [
  "secretariaat@hsvderuisvoorn.nl"
];

/* Afzender voor de bevestigingsmail aan de ouder/verzorger.
   Zet secretariaat@hsvderuisvoorn.nl als "Verzenden als"-alias in
   de Gmail-instellingen van deruisvoornhelden@gmail.com
   (Instellingen > Accounts en import > Ander e-mailadres
   verzenden als). Zonder die alias verstuurt het script de mail
   automatisch via het eigen gmail-account, met alleen de
   afzendernaam "Secretariaat HSV De Ruisvoorn". */
var AFZENDERADRES = "secretariaat@hsvderuisvoorn.nl";
var AFZENDERNAAM = "Secretariaat HSV De Ruisvoorn";

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
      var kindS = [r[1], r[2]].join(" ").trim();
      var kind = escHtml(kindS) || "onbekend kind";
      var meldingTekst =
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
        verzendMetRetry(MELDINGADRESSEN[a], "Nieuwe opgave jeugdviscursus: " + kind, meldingTekst);
      }

      /* bevestigingsmail naar de ouder/verzorger (de bedankpagina-tekst).
         Verstuurd vanaf het eigen gmail-account voor optimale bezorging.
         Antwoorden komen bij secretariaat@hsvderuisvoorn.nl binnen (Reply-To). */
      var ouderMail = String(r[9] || "").trim();
      if (ouderMail) {
        if (isGeldigEmail(ouderMail)) {
          verzendMetRetry(ouderMail,
            "Aanmelding jeugdviscursus ontvangen: " + kind,
            maakBevestiging(kindS),
            { naam: AFZENDERNAAM, replyTo: AFZENDERADRES });
        } else {
          Logger.log("Rij " + (i + 1) + ": e-mailadres ouder/verzorger overgeslagen (ongeldig): " + ouderMail);
        }
      } else {
        Logger.log("Rij " + (i + 1) + ": geen e-mailadres ouder/verzorger; bevestigingsmail overgeslagen.");
      }

      blad.getRange(i + 1, 22).setValue("ja");
      verzonden++;
    } catch (fout) {
      fouten++;
      Logger.log("Rij " + (i + 1) + " mislukt: " + fout.message);
      blad.getRange(i + 1, 22).setValue("FOUT: " + fout.message);
    }
  }

  Logger.log("Gereed: " + verzonden + " rijen verwerkt, " + fouten +
             " fouten, quota rest: " + MailApp.getRemainingDailyQuota());
}

/* Bevestigingsmail aan de ouder/verzorger: dezelfde tekst als de
   bedankpagina, met aanhef "Beste ouders/voogd". */
function maakBevestiging(kind) {
  return [
    "Beste ouders/voogd,",
    "",
    "Bedankt voor de aanmelding van " + (kind || "uw kind") + " voor de jeugdviscursus van HSV De Ruisvoorn.",
    "",
    "Uw aanmelding is in goede orde ontvangen en zal worden verwerkt door onze jeugdafdeling.",
    "",
    "Let op: dit betekent niet automatisch dat uw kind ook daadwerkelijk kan deelnemen aan de jeugdviscursus. Zodra alle opgaven verwerkt zijn, hoort u van ons of de deelname is bevestigd.",
    "",
    "Heeft u in de tussentijd vragen? Stuur die dan naar secretariaat@hsvderuisvoorn.nl.",
    "",
    "Met vriendelijke groet,",
    "HSV De Ruisvoorn"
  ].join("\n");
}

function isGeldigEmail(adres) {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(adres || "").trim());
}

/* Stuurt een mail met maximaal 3 pogingen (opvangen van
   tijdelijke Google-serverfouten). Is er een afzender optie mee
   gegeven, dan wordt GmailApp gebruikt zodat de mail écht "van"
   AFZENDERADRES lijkt te komen; zonder (of bij een niet-ingestelde)
   alias valt het script terug op het eigen gmail-account met
   alleen de afzendernaam. */
function verzendMetRetry(naar, onderwerp, tekst, vanOpties) {
  var maxPogingen = 3;
  for (var p = 1; p <= maxPogingen; p++) {
    try {
      if (vanOpties && vanOpties.adres) {
        var aliases = GmailApp.getAliases();
        if (aliases.indexOf(vanOpties.adres) !== -1) {
          GmailApp.sendEmail(naar, onderwerp, tekst, {
            from: vanOpties.adres,
            name: vanOpties.naam || "",
            replyTo: vanOpties.replyTo || vanOpties.adres
          });
        } else {
          Logger.log("Alias " + vanOpties.adres + " staat niet in deze Gmail (aliassen: " + aliases.join(", ") + "); verstuur via eigen account met afzendernaam");
          MailApp.sendEmail(naar, onderwerp, tekst, { name: vanOpties.naam || "", replyTo: vanOpties.replyTo || vanOpties.adres || "" });
        }
      } else {
        MailApp.sendEmail({ to: naar, subject: onderwerp, body: tekst });
      }
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
  var vasteId = "1ik0eHV7X4nvv4G6oIrs3Oo5BtQHiGUG7BpZoXlNDti0";
  var bestand;
  try {
    bestand = SpreadsheetApp.openById(vasteId);
  } catch (openFout) {
    bestand = null;
  }
  if (!bestand) {
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
    bestand = SpreadsheetApp.openById(kandidaten[0].getId());
  }
  var blad = bestand.getSheetByName("Aanmeldingen") ||
             bestand.insertSheet("Aanmeldingen");
  return { blad: blad, bestandId: bestand.getId() };
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