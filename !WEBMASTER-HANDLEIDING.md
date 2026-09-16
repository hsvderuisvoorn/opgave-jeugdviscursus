# Handleiding – Opgave jeugdviscursus HSV De Ruisvoorn

Dit is een **stap-voor-stap-beginnerhandleiding**. Je hebt geen
kennis van programmeren nodig. Volg de stappen in de volgorde
die hieronder staat, en lees rustig. Alles is opgezet zodat het
**los staat van de vangstregistratie** – dit is een eigen, aparte
webapp met een eigen internetadres.

Handig om te weten:
- Je kind meldt zich aan via een link die je straks zelf deelt.
- De aanmeldingen komen binnen in een **Google Sheet** (spreadsheet),
  zodat je ze makkelijk bijhoudt, sorteert en (als Excel) downloadt.
- Het aanmeldformulier werkt **ook zonder internet** op je telefoon:
  de aanmelding wordt bewaard en later automatisch verstuurd.

---

## Deel A – De webapp online zetten (eenmalig, ± 10 minuten)

Hier maak je een eigen plek op GitHub aan waar het formulier komt
te wonen, en zet je de "online-knop" aan. Eerst moet je dit
bestand naar GitHub sturen.

### Stap A1 – Een eigen opslagplaats (repo) aanmaken op GitHub

1. Open een webbrowser en ga naar <https://github.com>.
   Log in met het account van de vereniging
   (dat is het account met de gebruikersnaam `hsvderuisvoorn`).
2. Klik rechtsboven op het **`+`**-teken (naast je profielfoto).
3. Kies **"New repository"** (nieuwe opslagplaats).
4. Bij **Repository name** typ je: `opgave-jeugdviscursus`
5. **Belangrijk:** zet het bolletje op "**Public**".
6. Zet **NIET** een vinkje bij "Add a README file".
   (Wij hebben al bestanden; die komen zo mee.)
7. Laat de rest staan en klik op de groene knop
   **"Create repository"**.

> Je hebt nu een lege opslagplaats op GitHub. Het adres ervan
> eindigt op `.../opgave-jeugdviscursus`. Houd dit tabblad open.

### Stap A2 – De bestanden naar GitHub sturen (eerste keer)

Open nu **PowerShell** (klik op Start, typ "powershell",
klik op "PowerShell"). Dan plak je dit en druk je op Enter:

```powershell
Set-Location "C:\Users\Paul\Documents\Default Project\opgave-jeugdviscursus"
```

Daarna plak je deze regel en druk je op Enter:

```powershell
git remote add origin https://github.com/hsvderuisvoorn/opgave-jeugdviscursus.git
```

> Dit gebeurt er: "koppel deze bestanden aan de lege plek op GitHub".
> Bij de volgende vragen hoef je alleen door te kijken. Git vraagt
> misschien om inloggen; log dan in met het verenigingsaccount.

Dan stuur je de bestanden weg:

```powershell
git push -u origin main
```

> Kleine kans dat het per direct lukt en je klaar bent met deel A.
> Zie anders de groene of rode melding die hieronder staat.

**Mogelijke meldingen:**
- `main` wordt gepusht / "written" → gelukt! Ga naar **Stap A3**.
- "could not read Username" of een inlogvenster dat vraagt om
  *Username* / *Password* → vul daar je verenigingsaccountnaam en
  een **personal access token** in (geen wachtwoord). Hoe je zo'n
  token maakt staat in **Extra tip 1** onderaan deze handleiding.

### Stap A3 – De online-knop (GitHub Pages) aanzetten

1. Ga terug naar het browser-tabblad van je nieuwe opslagplaats
   (`github.com/hsvderuisvoorn/opgave-jeugdviscursus`).
   Ververs even (`F5`) — nu zie je de bestanden staan
   (`opgave.html`, `index.html`, `style.css`, enz.).
2. Klik in het lint bovenin op **"Settings"** (instellingen).
   (Ligt onderaan als je op je telefoon kijkt.)
3. In het linkermenu (onder "Code and automation") klik je op
   **"Pages"**.
4. Bij **"Source"** (bron) staat een keuzemenu. Kies **"Deploy from
   a branch"** (kiezen uit een tak) als dat nog niet klaar staat.
5. Kies bij het eerste keuzemenu **`main`** en bij het tweede
   **`/ (root)`**, en klik op de knop **"Save"**.
6. Er komt een melding "Your site is published" met een adres dat
   eindigt op `.../opgave-jeugdviscursus/`.
7. Wacht **1 tot 2 minuten** (GitHub heeft even nodig).
   Open daarna dat adres en voeg aan het eind toe:
   `opgave.html`

   Zo: `https://hsvderuisvoorn.github.io/opgave-jeugdviscursus/opgave.html`

**Dat is het aanmeldformulier, en het is nu online.** Deeladres A
is klaar! Je kunt dit adres alvast uitproberen op je telefoon.

---

## Deel B – Aanmeldingen ontvangen in Google Sheets (± 15 minuten)

Op dit moment werkt het formulier, maar worden de aanmeldingen
nog niet ergens bewaard (ze staan netjes in een wachtrij op de
telefoon van de aanmelders). Nu koppel je er een "brievenbus" aan:
de aanmeldingen komen dan als rijen in een Google Sheet.

### Stap B1 – Het "brievenbus-bestand" openen in Google Apps Script

1. Open <https://script.google.com> en log in met hetzelfde
   verenigingsaccount.
2. Klik linksboven op **"Nieuw project"** (of op het `+`-teken
   om een nieuw project te starten).
3. Geef het project een naam, bijvoorbeeld: `Opgave jeugdviscursus`
   (klik daarvoor bovenaan op de naam "Untitled project").
4. In het grote witte venster staat nu voorbeeld-code.
   **Wis die hele code weg** (Ctrl+A, dan Delete).
5. Open nu op je computer dit bestand:
   `backend\GoogleAppsScript_OpgaveBackend.js` (in de map
   `opgave-jeugdviscursus`). Open het met WordPad of Notepad
   (rechtermuisknop → Openen met).
6. Kopieer de **hele inhoud** (Ctrl+A, Ctrl+C) en plak die in
   het witte venster van Apps Script (Ctrl+V).
7. Klik op de knop **"Opslaan"** (het schijfje, of Ctrl+S).

### Stap B2 – De "brievenbus" als web-app klaarzetten

1. Klik rechtsboven op de blauwe knop **"Implementeren"**
   (soms staat er "Nieuwe implementatie").
2. Kies **"Web-app"**.
3. Bij **"Beschrijving"** mag je iets zetten, bijvoorbeeld
   "brievenbus opgave jeugdviscursus".
4. **Heel belangrijk**, twee keuzes:
   - "**Voer uit als:**" → **Ik** (dus: `hsvderuisvoorn`, NIET
     "Wie de app opent")
   - "**Wie heeft toegang:**" → **Iedereen** (ook anoniem)
5. Klik op **"Implementeren"** (of "Nieuwe implementatie" →
   knop onderaan).
6. Er verschijnt nu een adres dat eindigt op **`/exec`** en een
   autorisatievenster: klik op **"Autoriseren"** of "Permissions",
   kies je account en klik op "Toestaan" (Allow).
7. Kopieer dat `/exec`-adres. Het ziet er zo uit:
   `https://script.google.com/macros/s/XXXXXX/exec`
   Bewaar het even veilig (plak in Kladblok of in de mail naar
   jezelf). Dit is **jouw geheime brievenbusadres**.

> Deze `/exec`-link is privé-informatie; deel hem niet op de
> website. Alleen het formulier gebruikt hem.

### Stap B3 – De link aan het formulier geven

1. Open op je computer het bestand `opgave.js` (in de map
   `opgave-jeugdviscursus`) met WordPad/Notepad.
2. Zoek de regel bovenaan die er zo uitziet:
   ```
   var BACKEND_URL = "";
   ```
3. Verander die regel in (plak jouw `/exec`-adres tussen de
   aanhalingstekens):
   ```
   var BACKEND_URL = "https://script.google.com/macros/s/XXXXXX/exec";
   ```
4. Sla het bestand op (Ctrl+S).

> Als je dit op een apparaat bekijkt dat de app al eens geopend
> heeft, haal dan even het browservenster helemaal weg en open
> het adres opnieuw. Zo laadt het altijd de nieuwe regel.

### Stap B4 – Nieuwe versie naar GitHub sturen

Omdat je `opgave.js` hebt veranderd, stuur je het nog even op
(anders gaat de oude versie online):

Open PowerShell, plak dit en druk op Enter:

```powershell
Set-Location "C:\Users\Paul\Documents\Default Project\opgave-jeugdviscursus"
git add -A
git commit -m "Backend-adres gekoppeld"
git push
```

> Ter controle: open het formulieradres uit Deel A nog eens en
> verstuur een proefaanmelding. Kijk daarna in je Google Sheet
> (zie Stap B5) of er een rij is bijgekomen.

### Stap B5 – De aanmeldingen bekijken (Google Sheet)

- De eerste keer dat iemand zich aanmeldt, maakt het systeem
  automatisch een spreadsheet en een blad "Aanmeldingen" aan.
- Open daarvoor <https://sheets.google.com> met hetzelfde account.
  Je ziet daar dan een bestand met een naam als
  "Aanmeldingen jeugdviscursus" (of de spreadsheet die je zelf
  eerder aan het project koppelde). Klik erop.
- Elke aanmelding staat als één rij: links de datum, daarna alle
  gegevens die het kind heeft ingevuld (naam, geboortedatum,
  ouder, telefoon, e-mail, enz.).
- Je kunt het bestand als gewoon Excel-bestand downloaden:
  **Bestand → Downloaden → Microsoft Excel (.xlsx)**.

> Tip: zet "Bestand → Delen" van dat blad zo dat alleen jij het
> ziet (privé). De brievenbus kan er wel in schrijven, dat is
> veilig geregeld.

---

## Deel C – De link gebruiken op de website en per e-mail

Nu is alles werkend. Deel het aanmeldadres:

```
https://hsvderuisvoorn.github.io/opgave-jeugdviscursus/opgave.html
```

- Op de **website** van de vereniging: zet deze link achter een
  knop of tekst als "Meld je kind aan voor de jeugdviscursus".
- Per **e-mail**: plak dezelfde link in het bericht aan de leden.
- De aanmelder vult het formulier in. Werkt hij offline (bijv.
  in een bos), dan wordt de aanmelding bewaard en automatisch
  verzonden zodra er weer verbinding is. Er gaat dus nooit een
  aanmelding verloren.

---

## Controlelijst (als iets nog niet werkt)

| Symptoom                                     | Wat je moet doen                                                                                     |
|----------------------------------------------|------------------------------------------------------------------------------------------------------|
| Link opent een foutpagina (404)              | Hebben de bestanden wel op GitHub gestaan? Check Stap A2/push en wacht 1-2 min na Pages-aan.         |
| Formulier opent maar stuurt niet rond        | BACKEND_URL in opgave.js heeft nog geen `/exec`-adres. Doe Stap B2 t/m B3.                           |
| "Er is iets misgegaan" bij verzenden         | Voer uit als = "Ik" én toegang = "Iedereen" (Stap B2, punt 4). Check ook of de URL op `/exec` eindigt. |
| Geen rijen in het blad na een proefaanmelding| Kijk in sheets.google.com of juist in de spreadsheet die strikt gekoppeld is; vers ververs.          |
| Of niets: het werkt offline op de telefoon   | Dat is normaal. Zodra internet terug is, wordt de aanmelding automatisch verstuurd.                  |

---

## Extra tip 1 – Een "personal access token" maken (alleen als Git erom vraagt)

Als Git vraagt om *Username* en *Password* bij het pushen:

1. Ga naar <https://github.com/settings/tokens> (ingelogd).
2. Klik op **"Generate new token"** → **"Generate new token (classic)"**.
3. Geef het een naam (bijv. "lokaal bestuur").
4. Zet een vinkje bij **`repo`** (alle vinkjes onder "repo").
5. Scroll naar beneden, klik **"Generate token"**.
6. Kopieer de lange code (die met `ghp_...`) — die zie je maar één keer.
7. Bij de *Password*/-vraag van Git plak je deze code.
   (Bewaar hem niet in bestanden die mee op GitHub komen.)

> Liever geen persoonlijke token bijhouden? Je kunt ook gewoon
> GitHub Desktop installeren (<https://desktop.github.com>) — dat
> regelt het inloggen voor je, en dan vind je de knop "Push origin"
> gewoon in het venster. Dit is voor veel mensen het makkelijkst:
> je hoeft dan geen enkele commandoregel te typen.

---

## Extra tip 2 – Verborgen onderhoudskaarten

Dit bestand (`!WEBMASTER-HANDLEIDING.md`) wordt niet meegezet
naar GitHub — het is alleen voor jouw ogen. Bewaar het dus goed
op je computer. Als je later de verenigingswebsite beheert, weet
je met deze handleiding precies hoe alles in elkaar zit en hoe je
hem na verloop van tijd (opnieuw) online kunt zetten.

---

Alles is nu klaar voor jou. Neem de tijd, volg de delen A → B → C
in die volgorde, en test tussendoor steeds met een proefaanmelding.
Succes, en veel plezier met de jeugdviscursus!
