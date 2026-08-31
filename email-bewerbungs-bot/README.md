# E-Mail-Bewerbungs-Bot (n8n + Telegram)

**Zweck:** Bewerbungsunterlagen (Lebenslauf, Anschreiben, Zeugnisse) und Anschreiben-Text per Telegram senden → Bot legt **Gmail-Entwürfe** an. Du prüfst und sendest manuell ab.

Dieser Bot ist für **klassische E-Mail-Bewerbungen** gedacht — nicht für Online-Formulare. Für Formulare siehe [`../bewerbungs-bot/`](../bewerbungs-bot/).

## Ablauf

```
Telegram: PDFs + Empfänger + Betreff + Text
        ↓
n8n: Gmail-Entwurf mit Anhängen
        ↓
Du: Entwurf prüfen → Absenden
```

## Telegram-Nutzung (geplant)

```
/email
an: bewerbung@firma.de
betreff: Bewerbung als PHP Entwickler
---
Sehr geehrte Damen und Herren,
...
```
+ PDFs als Dokumente anhängen

## Ordnerstruktur (optional, lokal)

```
vorlagen/
  lebenslauf.pdf
  anschreiben-standard.pdf
  zeugnisse/
entwuerfe/
  2026-08-firma-xyz/    # Log / Kopien (optional)
```

## n8n einrichten

1. Workflow importieren: `n8n/email-entwurf-telegram.json`
2. Credentials: **Telegram Bot**, **Gmail OAuth**
3. Workflow aktivieren

## Unterschied zum Formular-Bot

| | E-Mail-Bot | Formular-Bot |
|---|------------|--------------|
| Ausgabe | Gmail-Entwurf | Formular ausgefüllt / mailto erkannt |
| Technik | nur n8n | n8n + Playwright |
| Typische Quelle | E-Mail-Adresse in Stellenanzeige | php-entwickler.de, Karriereseiten |

Beide Bots können parallel laufen — je nach Stelle den passenden wählen.
