# Briefing-Übergabe an den Pitch-Meister

Die Master-Briefing-App übergibt ein **vollständig ausgefülltes** Briefing als versiegelte Datei an den Pitch-Meister.
Dort wird es als **final** gesetzt und ist nicht mehr veränderbar.

## Ablauf

1. **Briefing-App:** Sobald alle Felder und Tabellen ausgefüllt sind, erscheint **„An Pitch-Meister senden“** (oben bei der Projekt-ID und unten im Formular).
2. Nach der Bestätigung entsteht `Uebergabe_Pitch-Meister_<Projekt-ID>_<Produkt>.json`. Ab da ist das Briefing auch in der Briefing-App schreibgeschützt.
   Für Änderungen gibt es **„Kopie mit neuer ID bearbeiten“**. Dabei entsteht ein neues Briefing mit neuer Projekt-ID.
3. **Pitch-Meister:** *Projekte → Briefing importieren*, Datei wählen. Das Briefing hängt dann schreibgeschützt am Projekt.

## Identifikation: Projekt-ID + Produktname

- Jedes Briefing bekommt automatisch eine feste **Projekt-ID** im Format `GS-<Jahr>-<6 Zeichen>`, z. B. `GS-2026-7K4Q9M`.
  Verwechselbare Zeichen (0/O, 1/I/L) kommen nicht vor.
- Zuordnung im Pitch-Meister (`attach`):
  1. Projekt mit gleicher Projekt-ID (`project.gsProjectId`)
  2. sonst ein Projekt, dessen Titel dem Produktnamen entspricht (ohne Groß/Klein, Mehrfach-Leerzeichen) und das noch keine Projekt-ID hat
  3. sonst ein **neues Projekt** mit dem Produktnamen als Titel
- Hat das Projekt schon ein finales Briefing, wird der Import **abgelehnt**. Ein finales Briefing wird nie überschrieben.

## Dateiformat (Version 1)

```json
{
  "format": "gs-briefing-handover",
  "version": 1,
  "checksum": "sha256:<hex>",
  "payload": {
    "schema": "gs-master-briefing",
    "schemaVersion": 1,
    "projectId": "GS-2026-7K4Q9M",
    "produkt": "Invictus X7",
    "finalizedAt": "2026-11-23T06:59:12.345Z",
    "data": { "f": { "<feld>": "…" }, "t": { "<tabelle>": [ { "<spalte>": "…" } ] } },
    "view": [ { "num": "01", "title": "…", "items": [ { "type": "field|list|table|heading|note", "…": "…" } ] } ]
  }
}
```

- `checksum` = SHA-256 über `JSON.stringify(payload)`, also kompakt und in der Schlüsselreihenfolge der Datei.
  Jede Änderung an der Datei macht die Prüfsumme ungültig, der Import lehnt sie dann ab.
- `data` enthält die Rohwerte für die maschinelle Weiterverarbeitung, z. B. Preise, Sales-Points oder Claims.
- `view` ist die fertige, lesbare Darstellung in Briefing-Reihenfolge. Damit kann der Pitch-Meister alles anzeigen, ohne das Briefing-Schema zu kennen.

## Einbau in den Pitch-Meister

`pitchmeister-import.js` ist abhängigkeitsfrei. Für ein Artifact den Inhalt inline in ein `<script>` kopieren. Es stellt `window.GSBriefingHandover` bereit:

| Funktion | Zweck |
|---|---|
| `parse(text)` → `Promise<{ok, pkg, payload} \| {ok:false, error}>` | Format, Pflichtangaben und Prüfsumme prüfen |
| `attach(projects, pkg, {user, createProject})` → `{ok, project, created, matchedBy} \| {ok:false, error}` | Zuordnen bzw. neues Projekt, setzt `project.gsProjectId` und `project.briefing` (eingefroren) |
| `verify(briefing)` → `Promise<boolean>` | Gespeichertes Briefing erneut prüfen |
| `renderInto(container, briefing)` | Schreibgeschützte Ansicht mit Hinweis „Final · schreibgeschützt“ und Prüfsummen-Status |

Beispiel:

```js
const r = await GSBriefingHandover.parse(await file.text());
if (!r.ok) return toast(r.error);
const a = GSBriefingHandover.attach(S.projects, r.pkg, {
  user: currentUserName(),
  createProject: title => { const p = newProject(title); S.projects.unshift(p); return p; }
});
if (!a.ok) return toast(a.error);
log('Briefing ' + a.project.gsProjectId + ' final übernommen'); save(); render();
```

Wichtig für „nicht mehr veränderbar“: Der Pitch-Meister bietet für `project.briefing` **keine** Eingabefelder an.
Beim Duplizieren eines Projekts `briefing` und `gsProjectId` nicht mitkopieren.
Beim Öffnen prüft `renderInto` die Prüfsumme erneut und zeigt sichtbar an, falls gespeicherte Daten verändert wurden.
