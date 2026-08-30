# Bewerbungs-Bot (Playwright)

Ordner-gesteuerter Bewerbungs-Roboter für **php-entwickler.de** und **get-in-it**.

## Wichtig: Deine beiden Portale

| Portal | Was passiert wirklich? | Bot-Aufgabe |
|--------|------------------------|-------------|
| **get-in-it** | Kein Bewerbungsformular pro Stelle. Du legst ein Profil an, Firmen melden sich bei dir. | Profil pflegen + Lebenslauf hochladen |
| **php-entwickler.de** | Die meisten Jobs leiten auf die **Karriereseite des Arbeitgebers** weiter. Nur Partner-Firmen haben Ein-Klick-Bewerbung auf php-entwickler.de. | Job öffnen → erkennen ob Portal oder extern → Formular ausfüllen + absenden |

## Ordnerstruktur

```
data/
  profile.json                    # Deine Stammdaten + Portal-Logins
  applications/
    firma-senior-php/             # Eine Bewerbung = ein Ordner
      meta.json                   # URL, Portal, Antworten
      lebenslauf.pdf
      anschreiben.pdf
      zeugnisse/
        abschluss.pdf
  processing/                     # Bot arbeitet gerade
  done/                           # Erfolgreich
  failed/                         # Fehler → manuell prüfen
```

## meta.json Felder

```json
{
  "id": "eindeutige-id",
  "portal": "php_entwickler",
  "jobUrl": "https://www.php-entwickler.de/jobs/12345",
  "company": "Firma GmbH",
  "position": "Senior PHP Developer",
  "files": {
    "cv": "lebenslauf.pdf",
    "coverLetter": "anschreiben.pdf",
    "certificates": ["zeugnisse/abschluss.pdf"]
  },
  "answers": {
    "motivation": "Fertiger Anschreiben-Text...",
    "salary": "75.000 EUR",
    "startDate": "ab sofort"
  },
  "formSelectors": {
    "firstName": "#vorname",
    "email": "input[name=email]",
    "cvUpload": "input[type=file]",
    "submit": "button[type=submit]"
  }
}
```

`formSelectors` ist optional, aber **wichtig für externe Arbeitgeber-Seiten** (Weiterleitung von php-entwickler.de).

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
# Alle pending-Ordner verarbeiten (Dry-Run = nicht absenden)
npm run apply:dry

# Eine Bewerbung
npm run apply:one -- data/applications/firma-senior-php

# Wirklich absenden
npm run apply

# Browser sichtbar (zum Debuggen)
HEADLESS=false npm run apply:one -- data/applications/firma-senior-php
```

## Realistische Erwartung

- **php-entwickler Partner-Jobs**: hohe Erfolgsquote (Ein-Klick)
- **php-entwickler → externe Seite**: braucht oft `formSelectors` pro Domain
- **get-in-it**: einmaliges Profil-Setup, kein Massen-Bewerben pro Stelle

## Nächste Schritte

1. `data/profile.json` mit deinen echten Daten füllen
2. Pro Bewerbung einen Ordner unter `data/applications/` anlegen
3. Mit `--dry-run` testen, Selektoren anpassen
4. Optional: n8n-Workflow, der Telegram → Ordner anlegt → `npm run apply` startet
