# n8n: Telegram → Bewerbungs-Ordner → Playwright-Bot

## Ablauf

```
Du (Telegram)
  /bewerben https://www.php-entwickler.de/job/...
  Firma GmbH | Senior PHP Entwickler
  [+ PDF Lebenslauf]
        ↓
n8n: Ordner data/applications/<id>/ + meta.json
        ↓
n8n: npm run apply:one -- <ordner>
        ↓
Bot: Formular absenden ODER E-Mail-Entwurf (mailto)
        ↓
n8n: Gmail-Draft (falls mailto) + Telegram-Status
```

## Telegram-Befehl

```
/bewerben https://www.php-entwickler.de/job/senior-backend-developer-php-heinersreuth-162463
VEMA | Senior Backend Developer - PHP
```

Lebenslauf als Dokument an dieselbe Nachricht hängen (optional).  
Ohne Anhang erwartet der Bot bereits `lebenslauf.pdf` im Ordner (z. B. aus einem Vorlagen-Ordner kopiert).

## Setup in n8n

1. Workflow importieren: `n8n/bewerbung-telegram.json`
2. Credentials:
   - **Telegram Bot** (BotFather Token)
   - **Gmail OAuth** (nur für mailto-Fälle wie VEMA)
3. Environment in n8n setzen:
   - `BEWERBUNG_BOT_ROOT=/pfad/zu/bewerbungs-bot`
   - `PHP_ENTWICKLER_PASSWORD=...`
   - `GET_IN_IT_PASSWORD=...`
4. Auf dem Host: `npm install && npm run install:browsers` im Bot-Ordner
5. Workflow aktivieren

## Was passiert bei der VEMA-Beispielstelle?

| Schritt | Ergebnis |
|---------|----------|
| php-entwickler.de Job | Weiterleitung auf `karriere.vema-eg.de` |
| Karriereseite | **Kein Formular**, nur `mailto:bewerbung@vema-eg.de` |
| Bot | Schreibt `emailDraft` in `result.json` |
| n8n | Legt Gmail-Entwurf an (Betreff + Text + Hinweis auf Anhänge) |
| Du | Entwurf prüfen, PDFs anhängen falls nötig, absenden |

## Manuell ohne Telegram

```bash
# Ordner anlegen, PDFs rein, meta.json ausfüllen
cp -r data/applications/_beispiel-vema-senior-backend-php data/applications/vema-senior-backend-php
# PDFs ablegen, dann:
npm run apply:dry -- --folder data/applications/vema-senior-backend-php
```

## Tipps

- Vorlagen-Ordner mit Standard-PDFs: per n8n `cp` nach neuem Bewerbungs-Ordner kopieren
- Für Personio/Softgarden/Join: Domain-Profile in `src/lib/domain-profiles.ts` pflegen
- Neue Seite: `npm run inspect -- <url>` → Felder sehen → Selektoren ergänzen
