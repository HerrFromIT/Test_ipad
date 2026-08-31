# Bewerbungs-Bot (Playwright + n8n)

Ordner-gesteuerter Bewerbungs-Roboter für **php-entwickler.de** und **get-in-it**.

> **Ausführliche Beschreibung:** Was der Bot kann, was nicht, und wie du ihn steuerst —  
> **[KONZEPT.md](KONZEPT.md)** (zuerst lesen, wenn du entscheiden willst, ob und wie du weitermachst).

## Wichtig: Deine beiden Portale

| Portal | Was passiert wirklich? | Bot-Aufgabe |
|--------|------------------------|-------------|
| **get-in-it** | Kein Bewerbungsformular pro Stelle. Du legst ein Profil an, Firmen melden sich bei dir. | Profil pflegen + Lebenslauf hochladen |
| **php-entwickler.de** | Die meisten Jobs leiten auf die **Karriereseite des Arbeitgebers** weiter. Nur Partner-Firmen haben Ein-Klick-Bewerbung auf php-entwickler.de. | Job öffnen → erkennen ob Portal / Formular / mailto → handeln |

## Konkretes Beispiel: VEMA (php-entwickler.de)

Stelle: [Senior Backend Developer - PHP](https://www.php-entwickler.de/job/senior-backend-developer-php-heinersreuth-162463) (VEMA, Heinersreuth)

| Schritt | URL / Aktion |
|---------|----------------|
| 1. Job auf php-entwickler.de | `…/job/senior-backend-developer-php-heinersreuth-162463` |
| 2. „Jetzt bewerben“ | Weiterleitung → `https://karriere.vema-eg.de/jobs/senior-backend-developer-php/` |
| 3. Karriereseite | **Kein Formular** — nur `mailto:bewerbung@vema-eg.de` |
| 4. Bot | Domain-Profil `karriere.vema-eg.de` → E-Mail-Entwurf in `result.json` |
| 5. n8n | Gmail-Draft anlegen → Telegram benachrichtigen |

Beispiel-`meta.json`: `data/applications/_beispiel-vema-senior-backend-php/meta.json`

```bash
# Felder / mailto einer beliebigen Seite inspecten:
npm run inspect -- https://karriere.vema-eg.de/jobs/senior-backend-developer-php/
```

## Ordnerstruktur

```
data/
  profile.json
  applications/
    firma-senior-php/             # Eine Bewerbung = ein Ordner
      meta.json
      lebenslauf.pdf
      anschreiben.pdf
  processing/ | done/ | failed/
n8n/
  bewerbung-telegram.json         # Import in n8n
  README.md
```

## meta.json (php-entwickler + externe Seite)

```json
{
  "id": "vema-senior-backend-php",
  "portal": "php_entwickler",
  "jobUrl": "https://www.php-entwickler.de/job/senior-backend-developer-php-heinersreuth-162463",
  "applyUrl": "https://karriere.vema-eg.de/jobs/senior-backend-developer-php/",
  "company": "VEMA Versicherungsmakler Genossenschaft eG",
  "position": "Senior Backend Developer - PHP",
  "files": {
    "cv": "lebenslauf.pdf",
    "coverLetter": "anschreiben.pdf"
  },
  "answers": {
    "motivation": "Sehr geehrte Frau Pataki, ...",
    "salary": "nach Vereinbarung",
    "startDate": "ab sofort"
  }
}
```

- `applyUrl` gesetzt → Bot geht **direkt** auf die Arbeitgeber-Seite (ohne Portal-Login).
- Nur `jobUrl` → Bot loggt sich bei php-entwickler.de ein und klickt „Bewerben“.
- Optional `formSelectors` oder Domain-Profil in `src/lib/domain-profiles.ts`.

## Setup

```bash
cd bewerbungs-bot
npm install
npm run install:browsers

export PHP_ENTWICKLER_PASSWORD="dein-passwort"
export GET_IN_IT_PASSWORD="dein-passwort"
```

## Nutzung

```bash
npm run apply:dry
npm run apply:one -- data/applications/firma-senior-php
npm run apply
npm run inspect -- https://karriere.beispiel.de/jobs/123
```

## n8n + Telegram

Siehe [n8n/README.md](n8n/README.md). Kurz:

```
/bewerben <job-url>
Firma | Position
[+ PDF]
```

→ Ordner anlegen → Bot starten → bei mailto Gmail-Entwurf → Telegram-Status.

## Domain-Profile

Bekannte Hosts in `src/lib/domain-profiles.ts`:

- `karriere.vema-eg.de` → mailto
- `jobs.personio.de`, `softgarden.io`, `join.com` → Formular-Selektoren (Startpunkt)

Neue Seite: `npm run inspect -- <url>` → Profil ergänzen.

## Realistische Erwartung

| Szenario | Erfolgsquote |
|----------|--------------|
| php-entwickler Partner (Ein-Klick) | hoch |
| Externe Seite mit Domain-Profil (Formular) | gut |
| Externe Seite mit mailto (wie VEMA) | gut (via E-Mail-Entwurf) |
| Unbekannte externe Seite ohne Profil | oft manuell / Selektoren nachziehen |
| get-in-it | einmaliges Profil-Setup |
