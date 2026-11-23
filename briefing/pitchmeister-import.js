/* ==========================================================================
   Genius Studios · Briefing-Übergabe für den Pitch-Meister
   --------------------------------------------------------------------------
   Liest die Übergabe-Datei der Master-Briefing-App („An Pitch-Meister senden“),
   prüft Format und SHA-256-Prüfsumme, ordnet sie über die Projekt-ID einem
   Pitch-Meister-Projekt zu und zeigt das Briefing schreibgeschützt an.

   Abhängigkeitsfrei, kein Build. Zum Einbinden in eine einzelne HTML-Datei
   (z. B. ein claude.ai-Artifact) den Inhalt dieser Datei inline in ein
   <script> kopieren. Formatbeschreibung: UEBERGABE.md
   ========================================================================== */
(function (root) {
  "use strict";

  var FORMAT = "gs-briefing-handover";
  var SCHEMA = "gs-master-briefing";
  var ID_RE = /^GS-\d{4}-[2-9A-HJKMNP-Z]{6}$/;

  /* ---------- SHA-256 (WebCrypto, mit JS-Ersatz für http-Seiten ohne crypto.subtle) ---------- */
  function sha256js(str) {
    var b = new TextEncoder().encode(str), K = [], H = [];
    var frac = function (x) { return ((x - Math.floor(x)) * 4294967296) | 0; };
    for (var n = 2, c = 0; c < 64; n++) {
      var p = true;
      for (var d = 2; d * d <= n; d++) if (n % d === 0) { p = false; break; }
      if (p) { if (c < 8) H[c] = frac(Math.pow(n, 1 / 2)); K[c++] = frac(Math.pow(n, 1 / 3)); }
    }
    var l = b.length, bl = ((l + 9 + 63) >> 6) << 6, m = new Uint8Array(bl); m.set(b); m[l] = 0x80;
    var dv = new DataView(m.buffer); dv.setUint32(bl - 4, (l * 8) >>> 0); dv.setUint32(bl - 8, Math.floor(l / 536870912));
    var w = new Int32Array(64);
    for (var o = 0; o < bl; o += 64) {
      for (var i = 0; i < 16; i++) w[i] = dv.getInt32(o + i * 4);
      for (i = 16; i < 64; i++) {
        var a0 = w[i - 15], d0 = w[i - 2];
        w[i] = (w[i - 16] + ((a0 >>> 7 | a0 << 25) ^ (a0 >>> 18 | a0 << 14) ^ (a0 >>> 3)) + w[i - 7] + ((d0 >>> 17 | d0 << 15) ^ (d0 >>> 19 | d0 << 13) ^ (d0 >>> 10))) | 0;
      }
      var A = H[0], B = H[1], C = H[2], D = H[3], E = H[4], F = H[5], G = H[6], Hh = H[7];
      for (i = 0; i < 64; i++) {
        var t1 = (Hh + ((E >>> 6 | E << 26) ^ (E >>> 11 | E << 21) ^ (E >>> 25 | E << 7)) + ((E & F) ^ (~E & G)) + K[i] + w[i]) | 0;
        var t2 = (((A >>> 2 | A << 30) ^ (A >>> 13 | A << 19) ^ (A >>> 22 | A << 10)) + ((A & B) ^ (A & C) ^ (B & C))) | 0;
        Hh = G; G = F; F = E; E = (D + t1) | 0; D = C; C = B; B = A; A = (t1 + t2) | 0;
      }
      H[0] = (H[0] + A) | 0; H[1] = (H[1] + B) | 0; H[2] = (H[2] + C) | 0; H[3] = (H[3] + D) | 0;
      H[4] = (H[4] + E) | 0; H[5] = (H[5] + F) | 0; H[6] = (H[6] + G) | 0; H[7] = (H[7] + Hh) | 0;
    }
    return H.map(function (x) { return (x >>> 0).toString(16).padStart(8, "0"); }).join("");
  }
  function sha256Hex(str) {
    try {
      if (root.crypto && root.crypto.subtle) {
        return root.crypto.subtle.digest("SHA-256", new TextEncoder().encode(str)).then(function (h) {
          return Array.from(new Uint8Array(h), function (x) { return x.toString(16).padStart(2, "0"); }).join("");
        }, function () { return sha256js(str); });
      }
    } catch (e) { /* fällt auf JS zurück */ }
    return Promise.resolve(sha256js(str));
  }

  /* ---------- Prüfen ---------- */
  function fail(msg) { return { ok: false, error: msg }; }
  function isStr(x) { return typeof x === "string"; }

  /** Datei-Text prüfen. Ergebnis: {ok:true, pkg, payload} oder {ok:false, error}. */
  function parse(text) {
    var pkg;
    try { pkg = JSON.parse(text); } catch (e) { return Promise.resolve(fail("Die Datei ist kein gültiges JSON.")); }
    if (!pkg || pkg.format !== FORMAT) return Promise.resolve(fail("Das ist keine Briefing-Übergabe. Bitte die Datei „Uebergabe_Pitch-Meister_….json“ aus der Master-Briefing-App wählen."));
    if (pkg.version !== 1) return Promise.resolve(fail("Diese Übergabe hat Version " + pkg.version + ". Der Pitch-Meister kennt nur Version 1."));
    var p = pkg.payload;
    if (!p || p.schema !== SCHEMA || !isStr(p.projectId) || !ID_RE.test(p.projectId) || !isStr(p.produkt) || !p.produkt.trim() || !isStr(p.finalizedAt) || !p.data || !Array.isArray(p.view))
      return Promise.resolve(fail("Die Übergabe ist unvollständig (Projekt-ID, Produktname oder Inhalt fehlen)."));
    if (!isStr(pkg.checksum) || pkg.checksum.indexOf("sha256:") !== 0) return Promise.resolve(fail("Die Übergabe hat keine Prüfsumme."));
    return sha256Hex(JSON.stringify(p)).then(function (hex) {
      if ("sha256:" + hex !== pkg.checksum) return fail("Die Prüfsumme stimmt nicht. Die Datei wurde nach dem Senden verändert und wird deshalb nicht übernommen.");
      return { ok: true, pkg: pkg, payload: p };
    });
  }

  /* ---------- Zuordnen ---------- */
  function deepFreeze(o) { if (o && typeof o === "object" && !Object.isFrozen(o)) { Object.freeze(o); Object.keys(o).forEach(function (k) { deepFreeze(o[k]); }); } return o; }
  function norm(s) { return String(s || "").trim().toLowerCase().replace(/\s+/g, " "); }

  /**
   * Übernimmt eine geprüfte Übergabe in die Projektliste des Pitch-Meisters.
   *   projects     – Array der Pitch-Meister-Projekte (wird verändert)
   *   pkg          – Ergebnis von parse(...).pkg
   *   opts.user    – Name des angemeldeten Benutzers (für importedBy)
   *   opts.createProject(title) – legt ein neues, leeres Pitch-Meister-Projekt an und gibt es zurück
   * Zuordnung: 1. gleiche Projekt-ID (project.gsProjectId),
   *            2. sonst ein Projekt mit gleichem Titel wie der Produktname, das noch keine Projekt-ID hat,
   *            3. sonst neues Projekt mit dem Produktnamen als Titel.
   * Ein Projekt mit finalem Briefing wird nie überschrieben.
   * Ergebnis: {ok:true, project, created, matchedBy} oder {ok:false, error, project}
   */
  function attach(projects, pkg, opts) {
    opts = opts || {};
    var p = pkg.payload;
    var byId = projects.filter(function (x) { return x && x.gsProjectId === p.projectId; })[0];
    if (byId && byId.briefing) {
      return { ok: false, project: byId, error: "Für Projekt-ID " + p.projectId + " („" + byId.title + "“) ist bereits ein finales Briefing hinterlegt (übergeben am " + fmt(byId.briefing.finalizedAt) + "). Es kann nicht überschrieben werden. Für Änderungen in der Briefing-App „Kopie mit neuer ID bearbeiten“ wählen." };
    }
    var project = byId, matchedBy = byId ? "id" : null, created = false;
    if (!project) {
      project = projects.filter(function (x) { return x && !x.gsProjectId && !x.briefing && norm(x.title) === norm(p.produkt); })[0];
      if (project) matchedBy = "name";
    }
    if (!project) {
      if (typeof opts.createProject !== "function") throw new Error("opts.createProject fehlt");
      project = opts.createProject(p.produkt.trim());
      created = true; matchedBy = "new";
    }
    project.gsProjectId = p.projectId;
    project.briefing = deepFreeze({
      format: FORMAT, version: 1, checksum: pkg.checksum,
      projectId: p.projectId, produkt: p.produkt, finalizedAt: p.finalizedAt,
      importedAt: new Date().toISOString(), importedBy: opts.user || "",
      payload: JSON.parse(JSON.stringify(p))
    });
    return { ok: true, project: project, created: created, matchedBy: matchedBy };
  }

  /** Prüft ein gespeichertes Briefing erneut (z. B. bei jedem Öffnen). Promise<boolean> */
  function verify(briefing) {
    if (!briefing || !briefing.payload || !isStr(briefing.checksum)) return Promise.resolve(false);
    return sha256Hex(JSON.stringify(briefing.payload)).then(function (hex) { return "sha256:" + hex === briefing.checksum; });
  }

  /* ---------- Anzeige (schreibgeschützt) ---------- */
  function fmt(iso) {
    var d = new Date(iso); if (isNaN(d)) return String(iso || "");
    return d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" }) + ", " + d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }) + " Uhr";
  }
  function h(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }

  var CSS = [
    ".gsb{display:flex;flex-direction:column;gap:16px}",
    ".gsb-head{display:flex;flex-wrap:wrap;gap:10px 16px;align-items:center;justify-content:space-between;padding:16px 18px;border-radius:16px;border:1px solid rgba(63,207,142,.45);background:rgba(63,207,142,.1)}",
    ".gsb-head.bad{border-color:rgba(220,39,81,.6);background:rgba(220,39,81,.12)}",
    ".gsb-final{font-family:Montserrat,system-ui,sans-serif;font-weight:800;font-size:12px;letter-spacing:.16em;text-transform:uppercase;padding:4px 10px;border-radius:999px;background:#3fcf8e;color:#04170c}",
    ".gsb-head.bad .gsb-final{background:#dc2751;color:#fff}",
    ".gsb-meta{display:flex;flex-wrap:wrap;gap:6px 18px;font-size:13.5px;opacity:.85}",
    ".gsb-meta b{font-variant-numeric:tabular-nums}",
    ".gsb-sec{border:1px solid rgba(127,127,140,.25);border-radius:16px;padding:18px}",
    ".gsb-sec h2{display:flex;gap:12px;align-items:baseline;margin:0 0 12px;font-family:Montserrat,system-ui,sans-serif;font-weight:800;font-size:16px}",
    ".gsb-sec h2 span{color:#3483eb;font-weight:900}",
    ".gsb-sec h3{margin:14px 0 6px;font-family:Montserrat,system-ui,sans-serif;font-weight:700;font-size:11.5px;letter-spacing:.12em;text-transform:uppercase;opacity:.75}",
    ".gsb-f{display:grid;grid-template-columns:minmax(120px,220px) minmax(0,1fr);gap:4px 16px;padding:7px 0;border-bottom:1px solid rgba(127,127,140,.18)}",
    ".gsb-f dt{opacity:.7;font-size:13.5px}.gsb-f dd{margin:0;white-space:pre-wrap;overflow-wrap:anywhere}",
    ".gsb-note{font-size:13.5px;padding:8px 12px;border-left:3px solid #dc2751;background:rgba(220,39,81,.08);border-radius:8px}",
    ".gsb ul{margin:4px 0 0;padding-left:20px}",
    ".gsb-tw{overflow-x:auto}.gsb table{border-collapse:collapse;width:100%;font-size:13.5px;min-width:520px}",
    ".gsb th,.gsb td{text-align:left;vertical-align:top;padding:7px 9px;border-bottom:1px solid rgba(127,127,140,.2)}",
    ".gsb th{font-size:11.5px;text-transform:uppercase;letter-spacing:.06em;opacity:.75}",
    "@media (max-width:640px){.gsb-f{grid-template-columns:1fr}}"
  ].join("\n");

  /** Rendert ein gespeichertes Briefing schreibgeschützt in container. */
  function renderInto(container, briefing) {
    container.textContent = "";
    if (!document.getElementById("gsb-style")) { var st = h("style"); st.id = "gsb-style"; st.textContent = CSS; document.head.appendChild(st); }
    var wrap = h("div", "gsb");
    var head = h("div", "gsb-head");
    var left = h("div"); left.appendChild(h("span", "gsb-final", "Final · schreibgeschützt"));
    var meta = h("div", "gsb-meta");
    [["Projekt-ID", briefing.projectId], ["Produkt", briefing.produkt], ["Übergeben", fmt(briefing.finalizedAt)], ["Importiert", fmt(briefing.importedAt) + (briefing.importedBy ? " von " + briefing.importedBy : "")]].forEach(function (r) {
      var s = h("span"); s.appendChild(document.createTextNode(r[0] + ": ")); s.appendChild(h("b", null, r[1])); meta.appendChild(s);
    });
    var check = h("span", null, "Prüfsumme wird geprüft …"); meta.appendChild(check);
    head.appendChild(left); head.appendChild(meta); wrap.appendChild(head);
    verify(briefing).then(function (ok) {
      check.textContent = ok ? "Prüfsumme bestätigt" : "Achtung: Prüfsumme stimmt nicht, gespeicherte Daten wurden verändert";
      if (!ok) head.classList.add("bad");
    });
    (briefing.payload.view || []).forEach(function (sec) {
      var s = h("section", "gsb-sec");
      var t = h("h2"); t.appendChild(h("span", null, sec.num)); t.appendChild(document.createTextNode(sec.title)); s.appendChild(t);
      (sec.items || []).forEach(function (it) {
        if (it.type === "heading") s.appendChild(h("h3", null, it.text));
        else if (it.type === "note") s.appendChild(h("div", "gsb-note", it.text));
        else if (it.type === "field") { var dl = h("dl", "gsb-f"); dl.appendChild(h("dt", null, it.label)); dl.appendChild(h("dd", null, it.value || "—")); s.appendChild(dl); }
        else if (it.type === "list") {
          var dl2 = h("dl", "gsb-f"); dl2.appendChild(h("dt", null, it.label)); var dd = h("dd");
          if (it.values && it.values.length) { var ul = h("ul"); it.values.forEach(function (x) { ul.appendChild(h("li", null, x)); }); dd.appendChild(ul); } else dd.textContent = "—";
          dl2.appendChild(dd); s.appendChild(dl2);
        } else if (it.type === "table") {
          if (it.label) s.appendChild(h("h3", null, it.label));
          var tw = h("div", "gsb-tw"), tb = h("table"), tr = h("tr");
          it.columns.forEach(function (c) { tr.appendChild(h("th", null, c)); });
          var thead = h("thead"); thead.appendChild(tr); tb.appendChild(thead);
          var tbody = h("tbody");
          (it.rows.length ? it.rows : [[]]).forEach(function (row) {
            var r = h("tr");
            if (!row.length) { var td = h("td", null, "Keine Einträge"); td.colSpan = it.columns.length; r.appendChild(td); }
            row.forEach(function (c) { r.appendChild(h("td", null, c || "—")); });
            tbody.appendChild(r);
          });
          tb.appendChild(tbody); tw.appendChild(tb); s.appendChild(tw);
        }
      });
      wrap.appendChild(s);
    });
    container.appendChild(wrap);
    return wrap;
  }

  root.GSBriefingHandover = { FORMAT: FORMAT, ID_RE: ID_RE, parse: parse, attach: attach, verify: verify, renderInto: renderInto, sha256Hex: sha256Hex, sha256js: sha256js };
})(typeof window !== "undefined" ? window : globalThis);
