# Pitch-Meister 2.0

Infomercial-Storyboard und Projekttool mit Auswertung, Webzugriff und Exportfunktionen.
Umgesetzt nach der Präsentation „PITCH-MEISTER 2.0“ (Genius GmbH) als Web-App statt FileMaker.

## Starten

`index.html` im Browser öffnen (Chrome, Safari, Edge, Firefox; auch auf dem iPad). Es braucht weder Installation noch Server.
Für den Zugriff im Team die Datei auf einen beliebigen Webserver legen.

## Funktionen (gemäß Präsentation)

| Bereich | Inhalt |
|---|---|
| **Login** | Benutzer mit Rolle; jede Änderung wird mit Benutzer und Zeitpunkt in der Projekt-History protokolliert |
| **Projekte** | Übersicht mit Titel, Showdauer, Studio, Drehtermin und Benutzern; Laufzeit gegen Zieldauer; duplizieren und löschen |
| **Projekt-Details** | Strategisches Konzept, Hosts & Kontakt, Benutzerzuordnung, eigene Szenen- und Rezeptkategorien, History der Änderungen |
| **Set-Design** | Set-Bilder mit Bildunterschrift, Spezifikationen, Farbpalette |
| **Angebot** | Übersicht und Preis, Bestandteile mit Bild, Größe/Spezifikation (optional) und Beschreibung |
| **Sales-Points** | Generelle und produktbezogene Sales-Points, mit Anzeige, in welchen Szenen sie verwendet werden |
| **Storyboard** | Segment-Übersicht mit Timings und Kategorien, Zeitleiste, Szenenboard mit Drag & Drop |
| **Thumbnails** | Szenenboard zeigt immer ein Vorschaubild: eigenes Thumbnail → hochgeladenes Bild → automatisch erzeugtes Standbild aus hochgeladenem Video (auch nachträglich, oder „Bild als Thumbnail“ an beliebiger Stelle) → YouTube-Vorschau → Standard-Thumbnails für YouTube, Vimeo, Video-, Datei- und Web-Links → aus dem Szeneninhalt generiert (Baustein-Farbe, Name, Text/VO, Produktbild) |
| **Szenen-Seite** | Bezeichnung, Dauer, Segment, Bild/Clip, Produkte in der Szene, Kategorien, Rezept an/aus mit Kategorie, Beschreibung, Sales-Points, Text/VO, Rezept und Zutaten, Animationen, Kommentare |
| **Dispo** | Pro Projekt: Titel, Location mit Karten-Link, Termine (Aufbau- und Drehtage), Team intern/extern mit Position, Einsatztagen und Kontakt; pro Tag Ablauf mit Uhrzeit, To Do, Bemerkung und verknüpfter Storyboard-Szene, Hinweise (Fahrgemeinschaften usw.) und Checkliste; Anfahrt & Parken mit Lageplan; eigenes Druck-/PDF-Layout. Crew mit Telefon und E-Mail; **Crew-Briefing per Mail** an das ganze Team (optional BCC) oder persönlich pro Person (nur die eigenen Einsatztage); **PDF-Download** der Dispo (ganz oder persönlich); **Kalender**: Google- und Outlook-Links pro Tag sowie `.ics`-Datei für Apple Kalender/Outlook |
| **Dramaturgie** | Pro Szene ein Baustein (Hook/Opening, Problem, Produkt-Demo, Testimonial, Benefits/RTBs, Angebot, CTA, Close); Dramaturgie-Check im Storyboard mit fehlenden Bausteinen, Zeit pro Baustein in der Analyse |
| **Hook-Varianten** | Mehrere Openings pro Szene mit Hook-Typ (Neuheit, Preisanker, Dringlichkeit, FOMO …) und Zielgruppe; Auswertung nach Typ |
| **Cutdowns** | Digital-Verwertung pro Szene (Format, Länge, Seitenverhältnis, Zielgruppe, Status); Übersicht mit Filtern, Schnittliste als CSV und Export-Layout |
| **Shots on Goal** | Dispo zeigt pro Drehtag automatisch, welche Hook-Varianten und Hochformat-Absicherungen gedreht werden müssen; Standard-Varianten per Klick in die Checkliste; auch im Crew-Briefing und PDF |
| **Claim-Freigabe** | Sales-Points mit Status (offen / in Prüfung / freigegeben / abgelehnt) und Beleg; Warnung bei nicht freigegebenen Claims in Szenen; Claim-Freigabeliste als Export |
| **Zielgruppen** | Personas in den Projekt-Details; Zuordnung zu Sales-Points, Hooks und Cutdowns; Abdeckung in der Analyse |
| **Moodboard** | Bilder, Videos und Audio hochladen (auch per Drag & Drop oder Einfügen) oder verlinken; Links werden erkannt (YouTube mit Vorschaubild, Vimeo, Spotify, MP3/MP4, Bilder, Websites); eigenes Vorschaubild für Links; Gruppen und Filter |
| **Animationen** | Vorschau (Bild/Video), Beschreibung, mit Szenen verknüpft |
| **B-Rolls** | Erweiterbare Liste mit Status und Szenenbezug |
| **Post-Shooting** | Missing Scenes und Nachdrehs mit Priorität |
| **Notizen & Inspiration** | Notizen, Links, Clips, Bilder |
| **Analyse** | Pro Segment und Total, als Zahl, Prozentwert und Diagramm: Sales-Point-Verteilung, Kategorien, Rezeptkategorien, Produktnutzung, zeitliche Aufschlüsselung |
| **Export** | Druck/PDF mit den Layouts Storyboard, Kitchen-Crew, Stage-Crew, Einkaufsliste, Sales-Points pro Szene, B-Rolls/Post-Shooting und Analyse; Szenenliste als CSV (Excel); Projekt- und Komplett-Backup als JSON mit Import |

## Daten

Die Daten liegen im `localStorage` des Browsers, hochgeladene Bilder, Videos und Audio in IndexedDB. Das heißt: pro Browser bzw. Gerät getrennt, und der Benutzer-Login ist eine
Zuordnung, keine echte Authentifizierung. Ein Austausch zwischen Geräten läuft über *Export → Projekt JSON / Komplett-Backup*
und *Projekte → JSON importieren*. Bilder werden beim Hochladen auf max. 1600 px verkleinert, Video und Audio sind auf 200 MB pro Datei begrenzt.
JSON-Exporte enthalten die Medien eingebettet.

Für echten Mehrbenutzerbetrieb über das Web (gemeinsame Datenbank, Server-Login) wäre der nächste Schritt ein Backend.
Das Datenmodell ist dafür bereits als JSON vorhanden.
