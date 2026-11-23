# Blueprint · Produktionsvorbereitung

Web-Version des Genius-Master-Templates „Blueprint“ (Word-Vorlage) – zum gemeinsamen Befüllen, Freigeben und Ablegen als PDF.

## Funktionen

- **Übersicht (`index.php`)**: Index aller Blueprints mit Status (in Bearbeitung / freigegeben), Beteiligten, Fortschritt, Stand, Suche, Filter, Duplizieren (als Vorlage) und Löschen (nur Entwürfe, Sicherung in `data/_papierkorb`).
- **Editor (`edit.php`)**: das Dokument im Layout des Master-Templates (Kopf mit Projekttitel und Genius-Logo, Autor/Stand/Artikel/Art.-Nr., Produktbild + Artikel Info, Orderscreen-Angebote mit automatischer Ersparnis, Key Question, Produktübersicht, Fragen Moderator, Einspieler mit MAZen/Grafiken/Vorher-Nachher, Studio, EDIT/Nachbearbeitung, Notizen).
- **Namens-Markierung**: Jede Person gibt einmal Namen und Farbe an (gespeichert im Browser). Jeder Bereich, jedes Angebot, jede MAZ und Grafik bekommt beim Speichern den Namen, Datum/Uhrzeit und die Farbe der Person. Die Markierungen lassen sich ein- und ausblenden. Der **Verlauf** zeigt, wer wann was geändert hat.
- **Mehrere Personen gleichzeitig**: Jeder Bereich wird einzeln gespeichert (automatisch nach kurzer Pause). Alle 8 Sekunden werden Änderungen anderer übernommen. Ändern zwei Personen gleichzeitig denselben Bereich, erscheint ein Hinweis mit der Wahl „Version von X laden“ oder „Meine Version speichern“.
- **Medien**: Bilder, Videos, PDFs und andere Dateien per Drag & Drop oder Klick hochladen – direkt in die Bereiche oder in einzelne MAZen, Grafiken und Angebote. Videos sind abspielbar.
- **Text-Formatierung**: fett, kursiv, unterstrichen, Listen, Pfeil, gelber Textmarker, Links. Text aus Word lässt sich einfügen (Formatierung wird bereinigt).
- **Freigabe**: Der Button „Freigeben“ prüft die Pflichtbereiche, erzeugt ein PDF im Layout des Master-Templates (Kopfzeile mit Titel und Logo, „Seite | n“, Freigabe-Vermerk, Videos als Standbild mit Play-Symbol), legt es auf dem Server ab und **sperrt die Eingabe** – auch serverseitig. Die Freigabe kann mit Begründung (optional mit PIN) aufgehoben werden; bei erneuter Freigabe entsteht Version 2, 3 … Alle PDF-Versionen bleiben im Verlauf abrufbar.
- **PDF-Vorschau** jederzeit möglich, ohne freizugeben.

## Installation

Voraussetzung: PHP 8.0 oder neuer mit den Erweiterungen `dom`, `fileinfo`, `mbstring`, `iconv` (sind meist Standard). Keine Datenbank, kein Composer.

1. Den Ordner `blueprint/` auf den Webserver kopieren.
2. Der Webserver braucht Schreibrechte auf `blueprint/data/`.
3. **Zugriffsschutz**: Die Anwendung hat keine eigene Anmeldung. Bitte nur im Intranet betreiben oder den Ordner per Server-Passwort schützen (z. B. `.htaccess` mit Basic Auth).
4. `data/.htaccess` sperrt den direkten Zugriff auf die Daten unter Apache. Bei **nginx** zusätzlich eintragen:
   ```nginx
   location ^~ /blueprint/data/ { deny all; }
   ```
5. **Große Uploads** (Videos): `upload_max_filesize` und `post_max_size` müssen groß genug sein. `blueprint/.htaccess` (mod_php) und `blueprint/.user.ini` (PHP-FPM) setzen 1 GB; bei nginx außerdem `client_max_body_size 1100m;`.

Einstellungen (Zeitzone, max. Upload-Größe, PIN zum Aufheben der Freigabe) stehen in `config.php`.

Zum lokalen Ausprobieren: `php -S localhost:8000` im Repository-Ordner starten und `http://localhost:8000/blueprint/` öffnen.

## Aufbau

| Datei | Zweck |
|---|---|
| `schema.json` | Bereiche und Felder des Templates – hier lassen sich Felder ergänzen oder umbenennen |
| `index.php` | Übersicht |
| `edit.php` | Editor / Ansicht |
| `api.php` | Speichern, Upload, Freigabe, Aufheben, Löschen |
| `file.php` | liefert Medien und PDFs aus (mit Range-Support zum Spulen in Videos) |
| `lib.php` | Speicherung (JSON-Dateien mit Dateisperre), Bereinigung der Eingaben |
| `assets/` | Styles, Skripte, Logo; `vendor/html2pdf.bundle.min.js` (MIT) für die PDF-Erzeugung |
| `data/<id>/` | `blueprint.json`, `media/` (Uploads), `pdf/` (freigegebene Versionen) – nicht im Git |

### Hinweise

- Das PDF wird im Browser der freigebenden Person erzeugt (Bilder als Raster, Texte daher nicht durchsuchbar). Sehr lange Blueprints werden mit etwas geringerer Auflösung gerendert.
- Gelöschte Medien bleiben bis zum Aufräumen in `data/<id>/media/`; `api.php?action=cleanup` (POST mit `id`) entfernt nicht mehr verwendete Dateien.
