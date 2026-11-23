# DRTV Master-Briefing – PDF-Generator

Eine Webseite mit Eingabemasken für das *Produkt- & Kampagnen-Master-Briefing*. Am Ende entsteht ein gesetztes A4-PDF.

## Benutzung
1. `index.html` im Browser öffnen oder auf einen beliebigen Webserver legen, z. B. GitHub Pages oder neben `index.php`.
2. Felder ausfüllen. Tabellen (Spezifikationen, Boni, Kundenstimmen, Einwände, Kampagnen) lassen sich um beliebig viele Zeilen erweitern.
3. Auf **PDF erstellen** klicken.

- Eingaben werden automatisch im Browser gespeichert (localStorage).
- **Entwurf sichern (.json)** / **Entwurf öffnen**: zum Weitergeben im Team.
- **Beispiel laden** füllt alle Felder mit fiktiven Beispieldaten.

## Technik
Eine einzelne HTML-Datei ohne Build-Schritt. Das PDF wird mit [pdfmake](https://pdfmake.github.io/) 0.2.10 (von cdnjs) direkt im Browser erzeugt. Es werden keine Daten an einen Server gesendet.
