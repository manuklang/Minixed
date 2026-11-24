# Genius Studios Master-Briefing – PDF-Generator

Eine Webseite mit Eingabemasken für das *Produkt- & Kampagnen-Master-Briefing*. Am Ende entsteht ein gesetztes A4-PDF im Corporate Design von Genius Studios.

## Benutzung
1. `index.html` im Browser öffnen oder auf einen beliebigen Webserver legen, z. B. GitHub Pages oder neben `index.php`.
2. Felder ausfüllen. Tabellen (Spezifikationen, Boni, Kundenstimmen, Einwände, Kampagnen) lassen sich um beliebig viele Zeilen erweitern.
3. Auf **PDF erstellen** klicken.

- Eingaben werden automatisch im Browser gespeichert (localStorage).
- **Entwurf sichern** / **Entwurf öffnen** (.json): zum Weitergeben im Team.
- **Beispiel laden** füllt alle Felder mit fiktiven Beispieldaten.
- Jedes Briefing hat eine automatisch vergebene **Projekt-ID** (z. B. `GS-2026-7K4Q9M`), sichtbar oben, im PDF und in der Übergabe.
- Sind alle Felder ausgefüllt, erscheint **An Pitch-Meister senden**. Es erzeugt eine versiegelte Übergabe-Datei. Danach ist das Briefing schreibgeschützt.
- **Archiv** (unten auf der Seite und im Menü): alle final übergebenen Briefings mit Link zum finalen PDF und zur Übergabe-Datei, durchsuchbar.
  Als claude.ai-Artifact ein gemeinsames Team-Archiv (Datenbank der Seite, PDFs als Dateien der Seite), als eigenständige Datei ein lokales Archiv in diesem Browser (IndexedDB).
  Details und Einbau in den Pitch-Meister: [UEBERGABE.md](UEBERGABE.md), Modul: `pitchmeister-import.js`.

## Design
- Logo, Firmendaten und PDF-Gestaltung nach genius-studios.de: Anthrazit `#282834`, Schwarz, Weiß, Blau `#3483EB` / `#1665CD`, Rot `#DC2751`; Montserrat (Überschriften) und Hind (Text).
- Oberfläche im Stil der shadcn/ui-Vorlage „Solaris“: dieselben Design-Tokens (Hintergrund `#0A0A0A`, Karten `#171717`, Primär-Blau `#0065FC`, Radius 0,625 rem), Schrift Geist, Lucide-Icons, schwebende Navbar, Hero mit Lichtkegel und App-Fenster mit Sidebar, Kennzahl-Karten und Cards. Ohne React/Tailwind-Build nachgebaut, damit die App eine einzelne Datei ohne Server bleibt.
- Responsiv von 320 px bis Desktop: Unter 960 px stecken die Nebenaktionen und die Abschnitts-Navigation in einem **Menü**, die Kopfleiste bleibt einzeilig.
- Das PDF bettet Logo und Schriften ein (Titelband in Anthrazit, Logo in der Kopfzeile, Firmenfußzeile).

## Bearbeiten
`index.html` wird erzeugt und nicht direkt bearbeitet. Änderungen gehören in `template.html`, danach:

```
python3 build.py
```

Das Skript bettet `assets/` (Logo hell/dunkel, Montserrat- und Hind-Schriften als WOFF, SIL Open Font License) als Base64 ein.

## Technik
Eine einzelne HTML-Datei ohne Server. Das PDF wird mit [pdfmake](https://pdfmake.github.io/) 0.2.10 (von cdnjs) direkt im Browser erzeugt. Es werden keine Daten an einen Server gesendet.
