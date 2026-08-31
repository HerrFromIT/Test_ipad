# n8n: E-Mail-Entwurf per Telegram

Import: `email-entwurf-telegram.json`

## Beispiel-Nachricht

```
/email
an: bewerbung@vema-eg.de
betreff: Bewerbung als Senior PHP Entwickler
---
Sehr geehrte Damen und Herren,

anbei meine Bewerbungsunterlagen.

Mit freundlichen Grüßen
Max Mustermann
```

PDF als Dokument an dieselbe Nachricht hängen (Anhang-Node im Workflow ggf. erweitern).

## Credentials

- Telegram Bot (BotFather)
- Gmail OAuth2 in n8n
