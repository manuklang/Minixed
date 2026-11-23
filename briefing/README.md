# Genius Studios Master-Briefing – PDF-Generator

Eine Webseite mit Eingabemasken für das *Produkt- & Kampagnen-Master-Briefing*. Am Ende entsteht ein gesetztes A4-PDF im Corporate Design von Genius Studios.

## Benutzung
1. `index.html` im Browser öffnen oder auf einen beliebigen Webserver legen, z. B. GitHub Pages oder neben `index.php`.
2. Felder ausfüllen. Tabellen (Spezifikationen, Boni, Kundenstimmen, Einwände, Kampagnen) lassen sich um beliebig viele Zeilen erweitern.
3. Auf **PDF erstellen** klicken.

- Eingaben werden automatisch im Browser gespeichert (localStorage).
- **Entwurf sichern** / **Entwurf öffnen** (.json): zum Weitergeben im Team.
- **Beispiel laden** füllt alle Felder mit fiktiven Beispieldaten.

## Design
- CI nach genius-studios.de: Anthrazit `#282834`, Schwarz, Weiß, Blau `#3483EB` / `#1665CD`, Rot `#DC2751`; Montserrat (Überschriften) und Hind (Text).
- Liquid-Glass-Optik nur auf der Bedienebene (Kopfleiste, Navigation, Buttons, Hinweise), die Formularflächen sind bewusst massiv und gut lesbar.
- Das PDF bettet Logo und Schriften ein (Titelband in Anthrazit, Logo in der Kopfzeile, Firmenfußzeile).

## Bearbeiten
`index.html` wird erzeugt und nicht direkt bearbeitet. Änderungen gehören in `template.html`, danach:

```
python3 build.py
```

Das Skript bettet `assets/` (Logo hell/dunkel, Montserrat- und Hind-Schriften als WOFF, SIL Open Font License) als Base64 ein.

## Technik
Eine einzelne HTML-Datei ohne Server. Das PDF wird mit [pdfmake](https://pdfmake.github.io/) 0.2.10 (von cdnjs) direkt im Browser erzeugt. Es werden keine Daten an einen Server gesendet.
