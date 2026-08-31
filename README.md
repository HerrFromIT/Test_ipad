# Bewerbungs-Bots (Übersicht)

In diesem Repository liegen **zwei getrennte Bots** für unterschiedliche Bewerbungswege. Beide bleiben erhalten und können unabhängig weiterentwickelt werden.

| Bot | Ordner | Zweck |
|-----|--------|-------|
| **E-Mail-Bot** | [`email-bewerbungs-bot/`](email-bewerbungs-bot/) | PDFs + Anschreiben per Telegram → **Gmail-Entwürfe** (klassische E-Mail-Bewerbungen) |
| **Formular-Bot** | [`bewerbungs-bot/`](bewerbungs-bot/) | Ordner mit Unterlagen → **Webformulare** auf php-entwickler.de / Arbeitgeber-Seiten (Playwright) — **[Konzept & Grenzen](bewerbungs-bot/KONZEPT.md)** |

## Wann welcher Bot?

- **E-Mail-Bot:** Arbeitgeber will Bewerbung per E-Mail (`bewerbung@…`, Anhang PDF).
- **Formular-Bot:** Online-Formular auf Karriereseite oder php-entwickler.de (inkl. Ein-Klick + Weiterleitung).

Beide können über **Telegram** angestoßen werden; die n8n-Workflows sind getrennt importierbar.

## Schnellstart

```bash
# E-Mail-Entwürfe (n8n)
# → email-bewerbungs-bot/n8n/email-entwurf-telegram.json importieren

# Formular-Bewerbungen (Playwright)
cd bewerbungs-bot
npm install && npm run install:browsers
npm run apply:dry
```

## Git / Branches

- **`main`** — beide Bots (aktueller Stand)
- Ältere Experimente bleiben in der Git-Historie erhalten

## Portale

- php-entwickler.de, get-in-it (Formular-Bot)
- Beliebige E-Mail-Adressen (E-Mail-Bot)
