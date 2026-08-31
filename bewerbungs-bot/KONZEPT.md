# Konzept, Grenzen und Steuerung des Formular-Bots

Diese Seite beschreibt ausführlich, **was der Formular-Bot kann und was nicht**, wie er zu deinem Wunsch passt („alles vorbereiten, Bot füllt aus und sendet ab“) und wie du ihn steuerst. Lies sie ganz durch, bevor du entscheidest, wie du weitermachst.

---

## Dein Zielbild

```
Du: Firma wählen + Unterlagen fertig (PDF, Texte, Antworten)
        ↓
Bot: Ordner lesen → Seite öffnen → Formular ausfüllen → ABSENDEN
        ↓
Du: nichts mehr tun (außer ggf. Fehler nachziehen)
```

**Wichtig:** Der Bot soll **nichts erfinden** — nur deine vorbereiteten Daten übernehmen.  
Das ist der richtige Ansatz und technisch der einfachere Teil.

---

## Kurzantwort: Ist das möglich?

| Deine Anforderung | Möglich? | Realistisch? |
|-------------------|----------|--------------|
| Du bereitest alles vor, Bot liest nur deine Dateien | Ja | Sehr gut |
| Bot füllt Formulare mit deinen Daten | Ja | Gut, wenn Formular bekannt ist |
| Bot sendet automatisch ab (ohne dass du klickst) | Ja | Nur wo kein starker Bot-Schutz |
| **Jede** beliebige Karriereseite, ohne Vorarbeit | Nein | Zu unterschiedlich |
| php-entwickler.de + get-in-it **vollautomatisch für alle Jobs** | Teilweise | Siehe Abschnitt „Deine Portale“ |

**Ehrliche Einschätzung:**  
**60–85 % Automatisierung** ist realistisch, wenn du vor allem über **dieselben Jobportale und ATS-Systeme** gehst (Personio, Softgarden, Join, manche Partner auf php-entwickler.de).  
**100 % Zero-Touch für alle Firmen im Internet** ist praktisch **nicht** zuverlässig.

Dieser Bot ist ein **Werkzeug zum Automatisieren**, kein fertiger „alle Bewerbungen meines Lebens“-Autopilot.

---

## Warum nicht „einfach überall“?

Das Problem ist **nicht** deine Vorbereitung — die ist ideal.  
Das Problem ist die **Webseite des Arbeitgebers**:

1. **Jede Seite anders** — andere Felder, Schritte, Pflichtfelder
2. **Weiterleitung** — php-entwickler.de schickt dich oft auf die **Firmenseite** (nicht ein einheitliches Formular)
3. **Kein Formular** — manche Stellen nur `mailto:` (E-Mail), z. B. VEMA: kein Webformular, nur „Jetzt bewerben“ → E-Mail
4. **CAPTCHA / Login** — blockiert Vollautomatik
5. **Mehrstufige Formulare** — Session-Timeout, wenn zu langsam
6. **Individuelle Fragen** — nur ok, wenn **deine Antwort schon in den Daten** steht

Der Bot muss also pro Seite (oder pro Portal-Typ) wissen: **Welches Feld = welche deiner Infos?**

---

## Deine Portale konkret

### php-entwickler.de

| Weg | Was passiert | Automatisierbar? |
|-----|--------------|------------------|
| **Partner-Firma** | Ein-Klick-Bewerbung auf php-entwickler.de | Sehr gut (Login + gespeichertes Profil) |
| **Alle anderen** | Weiterleitung auf **Karriereseite des Arbeitgebers** | Pro Domain Regeln/Selektoren nötig |
| **mailto-Ende** (z. B. VEMA) | Kein Formular, nur E-Mail-Adresse | Formular absenden **unmöglich** — nur E-Mail-Entwurf oder E-Mail senden |

### get-in-it

- **Kein klassisches „pro Stelle bewerben“**
- Du legst **ein Profil** an; Firmen kontaktieren **dich**
- Bot-Aufgabe: **Profil pflegen** (Skills, Lebenslauf), nicht viele Formulare pro Woche

**Fazit:** Mit nur diesen zwei Portalen bekommst du **nicht** überall „Formular ausfüllen und absenden“ — nur dort, wo wirklich ein Formular existiert.

---

## Was dieser Bot **kann** (Stand heute)

### Dein Teil (Vorbereitung)

1. Pro Bewerbung ein **Ordner**, z. B. `data/applications/firma-stelle/`
2. Darin: `lebenslauf.pdf`, `anschreiben.pdf`, ggf. Zeugnisse
3. **`meta.json`** mit festen Infos:
   - Stellen-URL (`jobUrl` oder `applyUrl`)
   - Firma, Position
   - fertige Texte (`motivation`, Gehalt, Startdatum …)
   - optional: `formSelectors` (HTML-Felder), wenn die Seite neu/unbekannt ist

Der Bot **denkt nichts aus** — er liest nur `meta.json`, PDFs und zentrale `data/profile.json` (Name, E-Mail, Telefon …).

### Bot-Teil (automatisch)

1. Ordner einlesen
2. Je nach `portal` / URL:
   - **php-entwickler:** Job öffnen → „Bewerben“ → Portal **oder** externe Seite
   - **Bekannte Domain** (z. B. Personio): Felder füllen → **Submit**
   - **Nur mailto:** kein Formular → E-Mail-Entwurf in `result.json` (nicht „Formular absenden“)
3. Ergebnis: Ordner nach `done/` oder `failed/`
4. Optional: Telegram/n8n startet den Lauf

### Was **noch nicht** „fertig ohne Aufwand“ ist

- Nicht jede Firmenseite ist vorkonfiguriert
- Login bei php-entwickler + Passwörter als Umgebungsvariablen
- CAPTCHA, 2FA, „Konto anlegen“ pro Firma
- Garantie, dass **jede** Bewerbung beim ersten Mal durchgeht

---

## Passt das zu „ich habe keine Zeit“?

**Ja, für den automatisierbaren Teil:**

- Du investierst Zeit **einmal** in Vorbereitung (Ordner, Texte, URLs).
- Du investierst **einmal pro neuer Domain** Zeit (z. B. `npm run inspect -- <url>`, Selektoren ergänzen).
- Danach: Bot starten → viele gleichartige Bewerbungen **ohne** jedes Formular von Hand.

**Nein**, wenn du erwartest:

- 50 völlig verschiedene Firmenseiten
- null Konfiguration
- immer Submit ohne je einen Fehler zu sehen

---

## So steuerst du den Bot (Schritt für Schritt)

### 1. Stammdaten einmalig pflegen

Datei: `data/profile.json`

- Name, E-Mail, Telefon, Adresse
- Standardantworten (Gehalt, Startdatum …)
- Portal-Logins (Passwörter über Umgebungsvariablen, nicht in Git committen)

### 2. Pro Bewerbung einen Ordner anlegen

```
data/applications/mein-firma-job/
  meta.json
  lebenslauf.pdf
  anschreiben.pdf
  zeugnisse/          (optional)
```

Ordner **ohne** `_`-Prefix am Anfang = wird vom Bot als `pending` verarbeitet.  
Beispiele mit `_` (z. B. `_beispiel-vema-…`) sind nur Vorlagen.

### 3. `meta.json` ausfüllen

Pflichtfelder:

| Feld | Bedeutung |
|------|-----------|
| `id` | Eindeutige ID |
| `portal` | `php_entwickler` oder `get_in_it` |
| `jobUrl` | Link zur Stelle auf php-entwickler.de |
| `applyUrl` | Optional: direkte Karriereseite (überspringt Portal-Klick) |
| `files.cv` | Dateiname des Lebenslaufs im Ordner |
| `answers.motivation` | Fertiger Anschreiben-Text |

### 4. Erst testen (Dry-Run)

```bash
cd bewerbungs-bot
npm run apply:dry
# oder eine Bewerbung:
npm run apply:one -- data/applications/mein-firma-job
```

Dry-Run = **nichts wird wirklich abgesendet**, du siehst nur, was der Bot tun würde.

### 5. Wirklich absenden

```bash
npm run apply
```

Der Bot verschiebt Ordner: `applications/` → `processing/` → `done/` oder `failed/`.  
Ergebnis steht in `result.json` im jeweiligen Ordner.

### 6. Unbekannte Seite analysieren

```bash
npm run inspect -- https://karriere.beispiel.de/jobs/123
```

Zeigt: Formularfelder, `mailto`-Links, Screenshot.  
Dann entweder `formSelectors` in `meta.json` oder Eintrag in `src/lib/domain-profiles.ts`.

### 7. Optional: Telegram/n8n

Siehe [n8n/README.md](n8n/README.md) — Befehl `/bewerben <url>` legt Ordner an und startet den Bot.

---

## Ordner-Workflow (Status)

```
data/applications/<dein-ordner>/     ← du legst an (pending)
        ↓
data/processing/<dein-ordner>/       ← Bot arbeitet
        ↓
data/done/<dein-ordner>/             ← erfolgreich (+ result.json)
   oder
data/failed/<dein-ordner>/           ← Fehler → du prüfst manuell
```

---

## Realistische Erwartung (Tabelle)

| Szenario | Erfolgsquote | Dein Aufwand |
|----------|--------------|--------------|
| php-entwickler Partner (Ein-Klick) | hoch | gering |
| Externe Seite mit Domain-Profil (Formular) | gut | einmalig pro Domain |
| Externe Seite mit mailto (wie VEMA) | gut (E-Mail-Entwurf) | kein Formular möglich |
| Unbekannte externe Seite ohne Profil | oft manuell | `inspect` + Selektoren |
| get-in-it | einmaliges Profil-Setup | kein Massen-Formular |

---

## Mögliche Wege für die Zukunft

Wenn du später weiterbauen willst, sind das die sinnvollen Richtungen:

### Variante A — Dein Modell (empfohlen)

- Ordner pro Bewerbung, alles vorbereitet
- Batch: alle `pending`-Ordner abarbeiten
- Bot: **ausfüllen + absenden**
- `failed/` nur für Ausnahmen
- Domain-Bibliothek wächst mit der Zeit

### Variante B — Nur php-entwickler Partner-Jobs

- Höchste Erfolgsquote, wenig Wartung
- Nur ein Teil der Stellen auf php-entwickler.de

### Variante C — Hybrid (praktisch)

| Situation | Tool |
|-----------|------|
| Webformular | **Formular-Bot** (dieses Projekt) |
| Nur E-Mail / mailto | **E-Mail-Bot** (`../email-bewerbungs-bot/`) |
| get-in-it | einmal Profil pflegen |

Beide Bots können parallel existieren — je nach Stelle den passenden wählen.

### Variante D — Externe Dienste

- Browser-Erweiterungen: viel Autofill, wenig echtes Vollauto-Submit
- KI-Browser-Agenten: experimentell, fehleranfällig beim Absenden

Für „alles vorbereitet, nur ausfüllen und senden“ ist **eigener Bot + Domain-Profile** meist kontrollierbarer.

---

## Wenn du „weiterbauen“ sagst — grober Fahrplan

1. Feste Ordnerstruktur + Pflichtfelder in `meta.json` dokumentieren
2. Batch-Modus: alle `pending/`-Ordner nacheinander, **mit Absenden**
3. Domain-Profile für deine häufigsten Ziele (aus php-entwickler-Weiterleitungen)
4. Klare Trennung: Formular vs. E-Mail vs. get-in-it Profil
5. Telegram/n8n: „Bewerbungen starten“ + nur Fehler melden

---

## Zusammenfassung in einem Satz

Dein Wunsch ist **machbar als teilautomatischer Bewerbungs-Roboter mit von dir vorbereiteten Ordnern** — **nicht** als garantiert vollautomatisches System für jede Karriereseite ohne je nachzupflegen.

---

## Siehe auch

- [README.md](README.md) — Setup und Kurzreferenz
- [n8n/README.md](n8n/README.md) — Telegram-Anbindung
- [../email-bewerbungs-bot/README.md](../email-bewerbungs-bot/README.md) — E-Mail-Entwürfe (anderer Bot)
- [../README.md](../README.md) — Übersicht beider Bots im Repository
