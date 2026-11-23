/* Blueprint · Genius Studios – Web-App (PHP-Version)
   Oberfläche wie das Genius-Studios-Master-Briefing. Daten, Uploads, Sperre und
   PDF-Ablage laufen über api.php / file.php. */
(function () {
'use strict';

const CFG = window.BP_CONFIG || {};
const LOGO_WHITE = 'assets/logo-white.png';
const LOGO_DARK = 'assets/logo-dark.png';

/* ============ Lucide-Icons ============ */
const ICONS = {
  filetext:'<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>',
  target:'<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
  shield:'<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
  clapper:'<path d="M20.2 6 3 11l-.9-2.4c-.3-1.1.3-2.2 1.3-2.5l13.5-4c1.1-.3 2.2.3 2.5 1.3Z"/><path d="m6.2 5.3 3.1 3.9"/><path d="m12.4 3.4 3.1 4"/><path d="M3 11h18v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/>',
  tag:'<path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r=".5" fill="currentColor"/>',
  quote:'<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M8 12a2 2 0 0 0 2-2V8H8"/><path d="M14 12a2 2 0 0 0 2-2V8h-2"/>',
  package:'<path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"/><path d="M12 22V12"/><path d="m3.3 7 7.703 4.734a2 2 0 0 0 1.994 0L20.7 7"/>',
  camera:'<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>',
  scissors:'<circle cx="6" cy="6" r="3"/><path d="M8.12 8.12 12 12"/><path d="M20 4 8.12 15.88"/><circle cx="6" cy="18" r="3"/><path d="M14.8 14.8 20 20"/>',
  note:'<path d="M15.5 3H5a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2V8.5L15.5 3Z"/><path d="M15 3v6h6"/>',
  send:'<path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"/><path d="m21.854 2.147-10.94 10.939"/>',
  copy:'<rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
  upload:'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5"/><path d="M12 3v12"/>',
  trash:'<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>',
  x:'<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  plus:'<path d="M5 12h14"/><path d="M12 5v14"/>',
  check:'<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
  dashed:'<path d="M10.1 2.18a9.93 9.93 0 0 1 3.8 0"/><path d="M17.6 3.71a9.95 9.95 0 0 1 2.69 2.7"/><path d="M21.82 10.1a9.93 9.93 0 0 1 0 3.8"/><path d="M20.29 17.6a9.95 9.95 0 0 1-2.7 2.69"/><path d="M13.9 21.82a9.94 9.94 0 0 1-3.8 0"/><path d="M6.4 20.29a9.95 9.95 0 0 1-2.69-2.7"/><path d="M2.18 13.9a9.93 9.93 0 0 1 0-3.8"/><path d="M3.71 6.4a9.95 9.95 0 0 1 2.7-2.69"/>',
  arrowright:'<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
  arrowleft:'<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',
  arrowup:'<path d="m5 12 7-7 7 7"/><path d="M12 19V5"/>',
  arrowdown:'<path d="M12 5v14"/><path d="m19 12-7 7-7-7"/>',
  lock:'<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  unlock:'<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/>',
  info:'<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
  filedown:'<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M12 18v-6"/><path d="m9 15 3 3 3-3"/>',
  listchecks:'<path d="m3 17 2 2 4-4"/><path d="m3 7 2 2 4-4"/><path d="M13 6h8"/><path d="M13 12h8"/><path d="M13 18h8"/>',
  flag:'<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><path d="M4 22v-7"/>',
  alert:'<circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/>',
  users:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  history:'<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/>',
  eye:'<path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/>',
  layers:'<path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/>',
  pen:'<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/>',
};
const ico = (n, cls = '') => `<svg class="i ${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[n] || ''}</svg>`;
function hydrateIcons(root = document) { root.querySelectorAll('i[data-icon]').forEach((n) => { n.outerHTML = ico(n.dataset.icon); }); }
hydrateIcons();

/* ============ Master-Template: Felder & Abschnitte (IDs wie schema.json) ============ */
const F = {
  titel: { type: 'text', label: 'Projekttitel', placeholder: 'z. B. IMCosmetics Platinum Lift', required: true },
  artikel: { type: 'text', label: 'Artikel', placeholder: 'z. B. IMC Platinum Lift Creme + Serum', required: true },
  artnr: { type: 'text', label: 'Art.-Nr.', placeholder: 'Artikelnummer' },
  autor: { type: 'text', label: 'Autor', placeholder: 'Kürzel oder Name' },
  produktbild: { type: 'media', label: 'Produktbild', help: 'Packshots, Verpackung, Freisteller' },
  artikelinfo: { type: 'richtext', label: 'Artikel Info', required: true, placeholder: 'Produktbeschreibung, Inhaltsstoffe & Wirkstoffe, USPs …' },
  shows: { type: 'richtext', label: 'Drehplan / Shows', short: true, placeholder: 'Wir drehen: 2 Shows (à 15, 5, 2 Min) – welche Show mit welchem Angebot?' },
  angebote: { type: 'offers', label: 'Angebote & Orderscreens', itemLabel: 'Angebot', help: 'Je Angebot: Orderscreen-Grafik, Set-Inhalt und Preise. Die Ersparnis wird automatisch berechnet.' },
  keyquestion: { type: 'richtext', label: 'Key Question', required: true, short: true, placeholder: '„Kann meine Haut sichtbar straffer wirken – ganz ohne Eingriffe?“' },
  produktmerkmale: { type: 'richtext', label: 'Produktmerkmale', placeholder: 'Hauptwirkstoffe & ihre Funktion, Studien, Hintergründe …' },
  experte: { type: 'richtext', label: 'Experte – Positionierung', short: true, placeholder: 'Wer ist die Expertin / der Experte? Werdegang, Positionierung …' },
  fragen: { type: 'richtext', label: 'Fragen an den Moderator', required: true, placeholder: '„Was braucht die Haut wirklich …?“ – eine Frage pro Zeile' },
  vorschau: { type: 'text', label: 'Vorschau-Link', placeholder: 'https://… (z. B. Drive-Ordner mit allen Einspielern)', link: true },
  mazen: { type: 'mediaList', label: 'MAZen', itemLabel: 'MAZ', itemPlaceholder: 'Dateiname / Titel, z. B. _PL_Teaser_16 Sek' },
  grafiken: { type: 'mediaList', label: 'Grafiken', itemLabel: 'Grafik', itemPlaceholder: 'Titel, z. B. Haupt USP +800%' },
  vorhernachher: { type: 'media', label: 'Vorher/Nachher-Grafiken', big: true },
  setaufbau: { type: 'richtext', label: 'Setaufbau', short: true, placeholder: 'Set, Aufkleber, Licht …' },
  props: { type: 'richtext', label: 'Props', short: true, placeholder: 'Namensschild, Produkte, Dekomuster …' },
  dresscode_mod: { type: 'text', label: 'Dresscode Moderator', placeholder: 'z. B. Elegant – Hemd und Anzug/Sakko' },
  dresscode_exp: { type: 'text', label: 'Dresscode Experte', placeholder: 'z. B. Elegant – passend zum Produkt' },
  supers: { type: 'richtext', label: 'Supers', short: true, placeholder: 'Bauchbinden / Einblendungen – tbd' },
  badges: { type: 'media', label: 'Badges', help: 'Siegel und Störer, z. B. „Made in Germany“' },
  logo: { type: 'check', label: 'Logo', placeholder: 'Ablageort', def: 'Liegt ab → \\02_Assets\\02_Images\\02_Logos', checkLabel: 'Liegt ab' },
  assets: { type: 'check', label: 'Vorhandene Assets', help: 'Orderscreens, MAZen, Grafiken', placeholder: 'Ablageort', def: 'Liegen ab → \\07_Renders\\02_Final-Renders', checkLabel: 'Liegen ab' },
  notizen: { type: 'richtext', label: 'Notizen', placeholder: 'Offene Punkte, Absprachen, To-dos …' },
};
const SECTIONS = [
  { id: 'stamm', title: 'Stammdaten', icon: 'filetext', lead: 'Projekt und Artikel – erscheint im Kopf des PDFs.', fields: [['titel', 'artikel'], ['artnr', 'autor']] },
  { id: 'produkt', title: 'Produkt', icon: 'package', fields: ['produktbild', 'artikelinfo', 'shows'] },
  { id: 'angebote', title: 'Angebote & Orderscreens', icon: 'tag', fields: ['angebote'] },
  { id: 'kq', title: 'Key Question', icon: 'target', lead: 'Die zentrale Frage, die die Show beantwortet.', fields: ['keyquestion'] },
  { id: 'uebersicht', title: 'Produktübersicht', icon: 'shield', fields: ['produktmerkmale', 'experte'] },
  { id: 'fragen', title: 'Fragen: Moderator', icon: 'quote', fields: ['fragen'] },
  { id: 'einspieler', title: 'Einspieler: MAZen & Grafiken', icon: 'clapper', fields: ['vorschau', 'mazen', 'grafiken', 'vorhernachher'] },
  { id: 'studio', title: 'Studio', icon: 'camera', fields: ['setaufbau', 'props', ['dresscode_mod', 'dresscode_exp']] },
  { id: 'edit', title: 'EDIT / Nachbearbeitung', icon: 'scissors', fields: ['supers', 'badges', ['logo', 'assets']] },
  { id: 'notizen', title: 'Notizen', icon: 'note', fields: ['notizen'] },
];
const secFields = (s) => s.fields.flat();
const COMPOSITE = { media: 1, offers: 1, mediaList: 1 };
const TOTAL = Object.keys(F).length;
const REQUIRED = Object.keys(F).filter((f) => F[f].required);

/* ============ Helfer ============ */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clone = (x) => JSON.parse(JSON.stringify(x ?? null));
const rid = () => Math.random().toString(36).slice(2, 12);
const now = () => new Date().toISOString();
const PALETTE = ['#3080FF', '#F97316', '#22C55E', '#A855F7', '#EAB308', '#14B8A6', '#EC4899', '#84CC16', '#F43F5E', '#06B6D4'];
function hashColor(s) { let h = 0; for (const ch of String(s)) h = (h * 31 + ch.codePointAt(0)) >>> 0; return PALETTE[h % PALETTE.length]; }
function tint(hex, a) { const n = parseInt(String(hex).slice(1), 16); return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`; }
function initials(n) { const p = String(n || '?').trim().split(/[\s.\-_()]+/).filter(Boolean); if (!p.length) return '?'; return (p.length === 1 ? p[0].slice(0, 2) : p[0][0] + p[p.length - 1][0]).toUpperCase(); }
const fmtD = new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
const fmtT = new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
const fmtS = new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
const date = (iso, t) => { if (!iso) return ''; const d = new Date(iso); return isNaN(d) ? '' : (t === 's' ? fmtS : t ? fmtT : fmtD).format(d); };
function ago(iso) {
  const d = new Date(iso); if (isNaN(d)) return '';
  const m = Math.round((Date.now() - d) / 60000);
  if (m < 1) return 'gerade eben'; if (m < 60) return `vor ${m} Min.`;
  const h = Math.round(m / 60); if (h < 24) return `vor ${h} Std.`;
  return date(iso);
}
function isEmpty(fid, v) {
  const t = F[fid].type;
  if (t === 'richtext') return !String(v || '').replace(/<[^>]*>|&nbsp;/g, '').trim();
  if (t === 'check') return !(v && v.checked);
  if (t in COMPOSITE) return !Array.isArray(v) || !v.length;
  return !String(v || '').trim();
}
const defaultValue = (fid) => { const t = F[fid].type; return t in COMPOSITE ? [] : t === 'check' ? { checked: false, text: F[fid].def || '' } : ''; };

/* ============ Personen (Name + Farbe, im Browser gemerkt) ============ */
const LS_USER = 'blueprint.user';
function loadUser() { try { const u = JSON.parse(localStorage.getItem(LS_USER) || 'null'); return u && u.name ? u : null; } catch (e) { return null; } }
let me = loadUser();
let users = {};
const mayWrite = () => !!me;
const personName = (n) => n || 'Jemand';
const personColor = (n) => (me && n === me.name && me.color) || (users[n] && users[n].color) || hashColor(n || '?');
const pname = (n) => esc(personName(n));
const avatar = (n) => `<span class="avatar" style="--c:${personColor(n)}" title="${esc(personName(n))}">${esc(initials(personName(n)))}</span>`;
function askUser(force) {
  if (me && !force) return Promise.resolve(me);
  return new Promise((resolve) => {
    let color = me ? me.color : null;
    const body = document.createElement('div');
    body.style.cssText = 'display:flex;flex-direction:column;gap:12px';
    body.innerHTML = `<p>Damit alle sehen, wer welchen Bereich befüllt hat, werden deine Einträge mit Namen, Datum und deiner Farbe markiert.</p>
      <div class="field"><label for="u-name">Dein Name</label><input type="text" id="u-name" maxlength="60" autocomplete="name" placeholder="z. B. Vanessa Krüger" value="${esc(me ? me.name : '')}"></div>
      <div class="field"><span class="lt" style="font-size:14px;font-weight:500">Deine Farbe</span><div class="swatches" role="radiogroup" aria-label="Farbe"></div></div>`;
    const input = $('#u-name', body), sw = $('.swatches', body);
    const paint = () => { const act = color || hashColor(input.value.trim() || '?'); sw.innerHTML = PALETTE.map((c) => `<button type="button" class="swatch" role="radio" style="--c:${c}" aria-label="Farbe ${c}" aria-checked="${c === act}" data-c="${c}"></button>`).join(''); };
    sw.addEventListener('click', (e) => { const b = e.target.closest('.swatch'); if (b) { color = b.dataset.c; paint(); } });
    input.addEventListener('input', () => { if (!color) paint(); });
    paint();
    const m = modal({ title: me ? 'Person ändern' : 'Wer arbeitet gerade?', body, dismissable: !!me, actions: [{ label: 'Speichern', cls: 'primary', onClick: () => {
      const name = input.value.trim().replace(/\s+/g, ' ');
      if (!name) { input.focus(); toast('Bitte deinen Namen angeben.', 'err'); return false; }
      me = { name, color: color || hashColor(name) };
      try { localStorage.setItem(LS_USER, JSON.stringify(me)); } catch (e) { /* privat */ }
      resolve(me);
    } }] });
    body.addEventListener('keydown', (e) => { if (e.key === 'Enter') m.submit(); });
  });
}

/* ============ Server ============ */
async function api(action, data, query) {
  const url = 'api.php?action=' + encodeURIComponent(action) + (query ? '&' + new URLSearchParams(query) : '');
  const init = { method: data ? 'POST' : 'GET', headers: {} };
  if (data) { init.body = JSON.stringify(data); init.headers['Content-Type'] = 'application/json'; }
  let res, json;
  try { res = await fetch(url, init); json = await res.json(); }
  catch (e) { const err = new Error(res ? 'Unerwartete Antwort vom Server (' + res.status + ')' : 'Keine Verbindung zum Server'); err.status = res ? res.status : 0; throw err; }
  if (!res.ok || json.ok === false) { const err = new Error(json.error || 'Fehler ' + res.status); err.status = res.status; err.payload = json; throw err; }
  return json;
}
function postForm(action, fields, onProgress) {
  return new Promise((resolve, reject) => {
    const fd = new FormData();
    for (const [k, v] of Object.entries(fields)) fd.append(k, v);
    const xhr = new XMLHttpRequest();
    xhr.open('POST', 'api.php?action=' + action);
    xhr.upload.onprogress = (e) => { if (e.lengthComputable && onProgress) onProgress(e.loaded / e.total); };
    xhr.onload = () => {
      let json = null; try { json = JSON.parse(xhr.responseText); } catch (e) { /* */ }
      if (xhr.status >= 200 && xhr.status < 300 && json && json.ok !== false) resolve(json);
      else { const err = new Error((json && json.error) || (xhr.status === 413 ? 'Datei ist zu groß für den Server' : 'Upload fehlgeschlagen (' + xhr.status + ')')); err.status = xhr.status; reject(err); }
    };
    xhr.onerror = () => reject(new Error('Keine Verbindung zum Server'));
    xhr.send(fd);
  });
}
const mediaUrl = (m, dl) => `file.php?id=${encodeURIComponent(S.cur)}&f=${encodeURIComponent(m.file)}${dl ? '&download=1' : ''}`;
const pdfUrl = (bpId, name, dl) => `file.php?id=${encodeURIComponent(bpId)}&pdf=${encodeURIComponent(name)}${dl ? '&download=1' : ''}`;

/* ============ Dialoge ============ */
function toast(msg, type) {
  let box = $('.toasts');
  if (!box) { box = document.createElement('div'); box.className = 'toasts'; box.setAttribute('role', 'status'); document.body.appendChild(box); }
  const t = document.createElement('div'); t.className = 'toast ' + (type || ''); t.textContent = msg; box.appendChild(t);
  setTimeout(() => t.remove(), type === 'err' ? 6500 : 3500);
}
function modal({ title, body, actions = [], dismissable = true, onClose }) {
  const back = document.createElement('div');
  back.className = 'modal';
  back.innerHTML = `<div class="mbox" role="dialog" aria-modal="true" aria-labelledby="m-h"><h2 id="m-h">${esc(title)}</h2><div class="mb"></div><div class="btns"></div></div>`;
  const b = $('.mb', back);
  b.style.cssText = 'display:flex;flex-direction:column;gap:12px';
  if (typeof body === 'string') b.innerHTML = body; else if (body) b.appendChild(body);
  hydrateIcons(b);
  const prev = document.activeElement;
  let closed = false;
  const close = () => { if (closed) return; closed = true; back.remove(); document.removeEventListener('keydown', onKey); if (prev && prev.focus) prev.focus(); if (onClose) onClose(); };
  const apiM = { close, body: b };
  if (dismissable) actions = [{ label: 'Abbrechen', onClick: () => true }, ...actions];
  for (const a of actions) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn ' + (a.cls || '');
    btn.innerHTML = (a.icon ? ico(a.icon) : '') + esc(a.label);
    btn.addEventListener('click', async () => { const r = await a.onClick(apiM, btn); if (r !== false) close(); });
    $('.btns', back).appendChild(btn);
    if (a.cls) apiM.submit = () => btn.click();
  }
  function onKey(e) { if (e.key === 'Escape' && dismissable) close(); }
  document.addEventListener('keydown', onKey);
  if (dismissable) back.addEventListener('mousedown', (e) => { if (e.target === back) close(); });
  document.body.appendChild(back);
  { const f = $('input:not([type=checkbox]),textarea,select', b) || $('.btns .btn:last-child', back); if (f) f.focus(); }
  return apiM;
}
function confirmBox(title, text, label, icon) {
  return new Promise((res) => modal({ title, body: `<p>${esc(text)}</p>`, actions: [{ label, icon, cls: 'danger solid', onClick: () => { res(true); } }], onClose: () => res(false) }));
}
function busy(text) {
  const el = document.createElement('div'); el.className = 'busy';
  el.innerHTML = `<div><div class="spin"></div><div class="txt">${esc(text)}</div></div>`;
  document.body.appendChild(el);
  return { set: (t) => { $('.txt', el).textContent = t; }, done: () => el.remove() };
}

/* ============ Zustand ============ */
const S = {
  list: [], listLoaded: false, listError: '', filter: 'all', q: '',
  cur: null, bp: null, rev: null, fields: {}, fieldsLoaded: false,
  base: {}, baseVal: {}, local: {},
  dirty: new Set(), timers: {}, inflight: {}, again: {}, force: {}, ver: {}, conflicts: {},
  history: [], marks: true,
};
try { S.marks = localStorage.getItem('bp.marks') !== '0'; } catch (e) { /* */ }
const editable = () => !!S.bp && S.bp.status !== 'approved' && mayWrite();
const value = (fid) => (S.fields[fid] ? S.fields[fid].value : defaultValue(fid));

/* ============ Navigationsleiste ============ */
function renderBar() {
  $('#bar').innerHTML = `
    <button type="button" class="logo" id="go-home" aria-label="Zur Übersicht"><img src="${LOGO_WHITE}" alt="Genius Studios" width="560" height="247"><span>Blueprint · Produktionsvorbereitung</span></button>
    <nav class="links" aria-label="Seite">
      <button type="button" data-go="home" ${!S.cur ? 'aria-current="page"' : ''}>Übersicht</button>
      ${S.cur ? '<button type="button" aria-current="page">Blueprint</button>' : ''}
      <button type="button" id="nav-help">So funktioniert's</button>
    </nav>
    <div class="actions">${me ? `<button type="button" class="me" id="me-chip" title="Person ändern">${avatar(me.name)}<b>${esc(me.name)}</b></button>` : '<button type="button" class="me" id="me-chip" style="padding-left:12px">Name festlegen</button>'}</div>`;
  $('#go-home').onclick = () => { location.hash = ''; };
  const h = $('[data-go="home"]'); if (h) h.onclick = () => { location.hash = ''; };
  $('#nav-help').onclick = showHelp;
  $('#me-chip').onclick = () => askUser(true).then(() => { renderBar(); if (S.cur) renderEditor(); else renderIndex(); });
}
function showHelp() {
  modal({ title: 'So funktioniert der Blueprint', dismissable: false, body: `
    <p>Der Blueprint ist die Produktionsvorbereitung für einen Dreh. Alle Beteiligten befüllen ihn gemeinsam; am Ende wird er freigegeben und als PDF abgelegt.</p>
    <div class="notice"><b>1. Anlegen</b> – „Neuer Blueprint“ in der Übersicht, oder einen bestehenden duplizieren.<br>
    <b>2. Befüllen</b> – Bereiche links in der Leiste anklicken und ausfüllen. Gespeichert wird automatisch. Jeder Bereich zeigt, wer ihn zuletzt bearbeitet hat und wann.<br>
    <b>3. Medien</b> – Bilder, Videos und PDFs per Drag &amp; Drop in den Bereich ziehen.<br>
    <b>4. Freigeben</b> – Sind alle Pflichtbereiche befüllt, unten „Freigeben &amp; PDF erzeugen“. Danach ist der Blueprint gesperrt.</div>
    <p>Arbeiten mehrere Personen gleichzeitig, siehst du Änderungen der anderen nach wenigen Sekunden. Ändern zwei denselben Bereich, erscheint ein Hinweis zur Auswahl.</p>`,
    actions: [{ label: 'Verstanden', cls: 'primary', onClick: () => true }] });
}

/* ============ Übersicht ============ */
function renderIndex() {
  const v = $('#view');
  const all = S.list;
  const draft = all.filter((d) => d.status !== 'approved').length, approved = all.length - draft;
  const term = S.q.trim().toLowerCase();
  const rows = all.filter((d) => (S.filter === 'all' || (S.filter === 'approved') === (d.status === 'approved')) && (!term || [d.titel, d.artikel, d.artnr, ...Object.keys(d.contributors || {})].join(' ').toLowerCase().includes(term)));
  const lastUpd = all[0];
  let list;
  if (!S.listLoaded) list = `<div class="empty">${S.listError ? ico('alert') : '<div class="spin"></div>'}<p>${esc(S.listError || 'Blueprints werden geladen …')}</p></div>`;
  else if (!all.length) list = `<div class="empty">${ico('layers')}<h3>Noch keine Blueprints</h3><p>Lege den ersten Blueprint an – danach befüllen alle Beteiligten ihre Bereiche.</p><button type="button" class="btn primary" data-new>${ico('plus')}Ersten Blueprint anlegen</button></div>`;
  else list = `<div class="bp-list" role="list">
      <div class="bp-head" aria-hidden="true"><span>Projekt / Artikel</span><span class="h-st">Status</span><span>Fortschritt</span><span class="h-who">Beteiligte</span><span>Stand</span><span></span></div>
      ${rows.map((d) => {
        const ap = d.status === 'approved', pct = d.percent || 0, miss = d.missingRequired || 0;
        const ids = Object.keys(d.contributors || {}).sort((a, b) => (d.contributors[b].last || '').localeCompare(d.contributors[a].last || ''));
        return `<div class="bp-row" role="listitem" tabindex="0" data-open="${esc(d.id)}" aria-label="${esc(d.titel || 'Ohne Titel')} öffnen">
          <div style="min-width:0"><div class="bp-title">${esc(d.titel || 'Ohne Titel')}</div><div class="bp-sub">${esc(d.artikel || '—')}${d.artnr ? ' · Art.-Nr. ' + esc(d.artnr) : ''}</div></div>
          <div class="c-st">${ap ? `<span class="badge ok">${ico('lock')}Freigegeben v${esc(d.approval.version)}</span>` : '<span class="badge draft">In Bearbeitung</span>'}</div>
          <div><div class="mini-prog"><div class="prog"><b style="width:${pct}%"></b></div><span>${pct}%</span></div>${!ap && miss ? `<div class="bp-meta" style="margin-top:4px">${miss} Pflichtbereich${miss > 1 ? 'e' : ''} offen</div>` : ''}</div>
          <div class="c-who"><span class="avatars">${ids.slice(0, 5).map((n) => avatar(n)).join('') || '<span class="bp-meta">—</span>'}</span></div>
          <div class="bp-meta c-nr">${esc(date(d.updatedAt))}<br>${pname(d.updatedBy)}</div>
          <div class="bp-actions">
            ${ap && d.approval.pdf ? `<a class="btn icon" href="${pdfUrl(d.id, d.approval.pdf, true)}" title="Freigegebenes PDF herunterladen" aria-label="PDF herunterladen">${ico('filedown')}</a>` : ''}
            <button type="button" class="btn icon" data-copy="${esc(d.id)}" title="Als Vorlage duplizieren" aria-label="Duplizieren">${ico('copy')}</button>
            ${!ap ? `<button type="button" class="btn icon del" data-del="${esc(d.id)}" title="Löschen" aria-label="Löschen">${ico('trash')}</button>` : ''}
            <span class="btn icon" aria-hidden="true">${ico('arrowright')}</span>
          </div></div>`;
      }).join('') || '<div class="empty" style="border:0">Keine Blueprints zu dieser Suche.</div>'}
    </div>`;
  v.innerHTML = `
    <section class="hero wrap">
      <span class="pill"><b>Team</b>Gemeinsam befüllen · mit Namen markiert · als PDF freigeben</span>
      <h1>Blueprints,<br><em>bereit für die Produktion.</em></h1>
      <p>Die Produktionsvorbereitung für jeden Dreh: Produkt, Angebote, Fragen, Einspieler, Studio und Nachbearbeitung an einem Ort. Jede Änderung trägt Name und Datum.</p>
      <div class="cta"><button type="button" class="btn primary" data-new>${ico('plus')}Neuer Blueprint</button><button type="button" class="btn" id="hero-help">${ico('info')}So funktioniert's</button></div>
    </section>
    <div class="wrap"><div class="frame">
      <div class="frame-top" aria-hidden="true"><i></i><i></i><i></i><span>genius-studios · blueprint</span></div>
      <div class="frame-in single"><main class="main">
        <div class="mainhead"><div><h2>Alle Blueprints</h2><div class="mhsub">Klicke auf einen Blueprint, um ihn zu öffnen und zu bearbeiten.</div></div>
          <button type="button" class="btn primary" data-new>${ico('plus')}Neuer Blueprint</button></div>
        <div class="kpis">
          <div class="kpi"><span class="tile">${ico('layers')}</span><div class="bx"><div class="k">Blueprints</div><div class="v">${all.length}</div><div class="s">insgesamt</div></div></div>
          <div class="kpi"><span class="tile">${ico('pen')}</span><div class="bx"><div class="k">In Bearbeitung</div><div class="v">${draft}</div><div class="s">noch nicht freigegeben</div></div></div>
          <div class="kpi"><span class="tile">${ico('lock')}</span><div class="bx"><div class="k">Freigegeben</div><div class="v">${approved}</div><div class="s">mit abgelegtem PDF</div></div></div>
          <div class="kpi"><span class="tile">${ico('history')}</span><div class="bx"><div class="k">Zuletzt geändert</div><div class="v" style="font-size:16px;line-height:1.35">${lastUpd ? esc(lastUpd.titel || 'Ohne Titel') : '—'}</div><div class="s">${lastUpd ? esc(ago(lastUpd.updatedAt)) : ''}</div></div></div>
        </div>
        ${all.length ? `<div class="toolbar"><input type="search" id="q" placeholder="Suchen nach Titel, Artikel, Art.-Nr., Person …" aria-label="Blueprints durchsuchen" value="${esc(S.q)}">
          <div class="seg" role="group" aria-label="Status filtern">${[['all', 'Alle'], ['draft', 'In Bearbeitung'], ['approved', 'Freigegeben']].map(([k, l]) => `<button type="button" data-f="${k}" aria-pressed="${S.filter === k}">${l}</button>`).join('')}</div></div>` : ''}
        ${list}
        <div class="steps">
          <div class="step"><span class="tile">${ico('plus')}</span><div><div class="n">Schritt 1</div><h3>Anlegen</h3><p>Neuen Blueprint starten oder einen bestehenden als Vorlage duplizieren.</p></div></div>
          <div class="step"><span class="tile">${ico('users')}</span><div><div class="n">Schritt 2</div><h3>Gemeinsam befüllen</h3><p>Jede Person füllt ihre Bereiche aus. Gespeichert wird automatisch, mit Name und Datum.</p></div></div>
          <div class="step"><span class="tile">${ico('send')}</span><div><div class="n">Schritt 3</div><h3>Freigeben</h3><p>Sind die Pflichtbereiche befüllt: freigeben, PDF ablegen, Eingaben sperren.</p></div></div>
        </div>
      </main></div></div></div>`;
  const q = $('#q', v);
  if (q) q.oninput = () => { S.q = q.value; const p = q.selectionStart; renderIndex(); const n = $('#q'); n.focus(); n.setSelectionRange(p, p); };
  $$('[data-f]', v).forEach((b) => b.onclick = () => { S.filter = b.dataset.f; renderIndex(); });
  $$('[data-new]', v).forEach((b) => b.onclick = () => createDialog(null));
  $('#hero-help', v).onclick = showHelp;
  $$('[data-open]', v).forEach((r) => {
    r.onclick = (e) => { if (e.target.closest('button,a')) return; location.hash = 'bp-' + r.dataset.open; };
    r.onkeydown = (e) => { if ((e.key === 'Enter' || e.key === ' ') && e.target === r) { e.preventDefault(); location.hash = 'bp-' + r.dataset.open; } };
  });
  $$('[data-copy]', v).forEach((b) => b.onclick = () => createDialog(b.dataset.copy));
  $$('[data-del]', v).forEach((b) => b.onclick = () => deleteBp(b.dataset.del));
}
let listTimer = null;
async function loadList() {
  try {
    const res = await api('list');
    S.list = res.items; users = res.users || users; S.listLoaded = true; S.listError = '';
  } catch (e) { if (!S.listLoaded) S.listError = 'Die Blueprints konnten nicht geladen werden: ' + e.message; }
  if (!S.cur) renderIndex();
}

/* ============ Anlegen / Duplizieren / Löschen ============ */
async function createDialog(copyFrom) {
  await askUser();
  renderBar();
  const src = copyFrom ? S.list.find((d) => d.id === copyFrom) : null;
  const body = document.createElement('div');
  body.style.cssText = 'display:flex;flex-direction:column;gap:12px';
  body.innerHTML = `
    <div class="field"><label for="n-title">Projekttitel <span style="color:var(--destructive)">*</span></label><input type="text" id="n-title" maxlength="200" placeholder="z. B. IMCosmetics Platinum Lift" value="${src ? esc(src.titel + ' (Kopie)') : ''}"></div>
    <div class="field"><label for="n-art">Artikel</label><input type="text" id="n-art" maxlength="200" placeholder="z. B. IMC Platinum Lift Creme + Serum" value="${src ? esc(src.artikel || '') : ''}"></div>
    <div class="field"><label for="n-nr">Art.-Nr. <span class="help" style="margin:0">optional</span></label><input type="text" id="n-nr" maxlength="60"></div>
    <div class="field"><label for="n-copy">Vorlage</label><select id="n-copy"><option value="">Leerer Blueprint</option>${S.list.map((d) => `<option value="${esc(d.id)}" ${d.id === copyFrom ? 'selected' : ''}>Kopie von: ${esc(d.titel || 'Ohne Titel')}</option>`).join('')}</select>
    <div class="help" style="margin:0">Bei einer Kopie werden Inhalte und Medien übernommen; die Markierungen laufen dann auf dich.</div></div>`;
  const m = modal({ title: copyFrom ? 'Blueprint duplizieren' : 'Neuer Blueprint', body, actions: [{ label: 'Anlegen & öffnen', icon: 'arrowright', cls: 'primary', onClick: async (_, btn) => {
    const titel = $('#n-title', body).value.trim();
    if (!titel) { $('#n-title', body).focus(); toast('Bitte einen Projekttitel angeben.', 'err'); return false; }
    btn.disabled = true;
    try {
      const res = await api('create', { user: me.name, color: me.color, titel, artikel: $('#n-art', body).value.trim(), artnr: $('#n-nr', body).value.trim(), copyFrom: $('#n-copy', body).value });
      location.hash = 'bp-' + res.id;
    } catch (e) { btn.disabled = false; toast('Anlegen fehlgeschlagen: ' + e.message, 'err'); return false; }
  } }] });
  body.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.tagName === 'INPUT') m.submit(); });
}
async function deleteBp(id) {
  const d = S.list.find((x) => x.id === id);
  await askUser();
  if (!d || !(await confirmBox('Blueprint löschen?', `„${d.titel || 'Ohne Titel'}“ wird aus der Übersicht entfernt. Eine Sicherung bleibt im Ordner data/_papierkorb auf dem Server.`, 'Löschen', 'trash'))) return;
  try { await api('delete', { id, user: me.name, color: me.color }); toast('Blueprint gelöscht.'); loadList(); }
  catch (e) { toast('Löschen fehlgeschlagen: ' + e.message, 'err'); }
}

/* ============ Editor: Rendering ============ */
const hasWho = (o) => !!(o && o.by);
function whoStyle(o) { if (!hasWho(o)) return ''; const c = personColor(o.by); return ` style="--who:${c};--who-bg:${tint(c, .12)};--who-line:${tint(c, .45)}"`; }
const whoSlot = (o) => `<span class="whoslot" title="Zuletzt bearbeitet">${hasWho(o) ? `${pname(o.by)} <span class="when">· ${esc(date(o.at, 's'))}</span>` : ''}</span>`;
function applyWho(el, o) {
  if (!el) return;
  const slot = $('.whoslot', el);
  if (!hasWho(o)) { el.classList.remove('has-who'); if (slot) slot.innerHTML = ''; return; }
  const c = personColor(o.by);
  el.classList.add('has-who');
  el.style.setProperty('--who', c); el.style.setProperty('--who-bg', tint(c, .12)); el.style.setProperty('--who-line', tint(c, .45));
  if (slot) slot.innerHTML = `${pname(o.by)} <span class="when">· ${esc(date(o.at, 's'))}</span>`;
}
const isImage = (m) => /^image\/(png|jpe?g|gif|webp|avif|bmp)$/i.test(m.mime || '');
const isVideo = (m) => /^video\//i.test(m.mime || '');
const linkify = (t) => esc(t).replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');

function miHTML(m, edit) {
  const url = mediaUrl(m);
  let inner;
  if (isImage(m)) inner = `<a class="thumb" href="${url}" target="_blank" rel="noopener" title="In voller Größe öffnen"><img src="${url}" alt="${esc(m.caption || m.name)}" loading="lazy"></a>`;
  else if (isVideo(m)) inner = `<div class="thumb"><video src="${url}#t=0.5" controls preload="metadata"></video><span class="kind">Video</span></div>`;
  else inner = `<a class="file" href="${mediaUrl(m, true)}">${ico('filetext')}<span>${esc(m.name)}</span></a>`;
  const foot = edit ? `<div class="mfoot"><input type="text" data-k="caption" value="${esc(m.caption || '')}" placeholder="Hinweis (optional)" aria-label="Hinweis zu ${esc(m.name)}"><button type="button" class="btn icon del" data-act="rm-media" title="Entfernen" aria-label="${esc(m.name)} entfernen">${ico('trash')}</button></div>` : (m.caption ? `<div class="cap">${esc(m.caption)}</div>` : '');
  return `<div class="mi${hasWho(m) ? ' has-who' : ''}" data-mid="${esc(m.id)}"${whoStyle(m)}>${whoSlot(m)}${inner}${foot}</div>`;
}
function mediaHTML(list, edit, target, o = {}) {
  const grid = `<div class="mgrid${o.big ? ' big' : ''}" data-grid="${esc(target)}">${list.map((m) => miHTML(m, edit)).join('')}</div>`;
  if (!edit) return list.length ? grid : '<div class="ro"></div>';
  const drop = `<label class="drop" data-drop="${esc(target)}"><input type="file" multiple accept="image/*,video/*,application/pdf,.zip,.psd,.ai,.mov">${ico('upload')}<span>${esc(o.dropText || 'Dateien hierher ziehen oder klicken')}<small>Bilder, Videos, PDFs und weitere Dateien · max. ${esc(CFG.maxUploadMb || 1024)} MB je Datei</small></span></label><div class="uploads" data-uploads="${esc(target)}"></div>`;
  return `<div class="media">${list.length ? grid : `<div class="mgrid" data-grid="${esc(target)}"></div>`}${drop}</div>`;
}
const rtHTML = (html, edit, key, ph, short, label) => edit
  ? `<div class="rt${short ? ' short' : ''}" contenteditable="true" data-k="${key}" data-placeholder="${esc(ph || '')}" role="textbox" aria-multiline="true" aria-label="${esc(label || '')}">${html || ''}</div>`
  : `<div class="ro">${html || ''}</div>`;
const itemTools = (i, n) => `<div class="tools"><button type="button" class="btn icon" data-act="up" title="Nach oben" aria-label="Nach oben" ${i === 0 ? 'disabled' : ''}>${ico('arrowup')}</button><button type="button" class="btn icon" data-act="down" title="Nach unten" aria-label="Nach unten" ${i === n - 1 ? 'disabled' : ''}>${ico('arrowdown')}</button><button type="button" class="btn icon del" data-act="del-item" title="Eintrag löschen" aria-label="Eintrag löschen">${ico('trash')}</button></div>`;

function parsePrice(s) { let t = String(s || '').replace(/[^\d,.-]/g, ''); if (t.includes(',')) t = t.replace(/\./g, '').replace(',', '.'); return parseFloat(t); }
function savingOf(o) { const a = parsePrice(o.uvp), b = parsePrice(o.preis); if (isNaN(a) || isNaN(b)) return null; return Math.round((a - b) * 100) / 100; }
const fmtEur = (n) => new Intl.NumberFormat('de-DE', { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 }).format(n) + ' €';
function savingHTML(o) { const s = savingOf(o); if (s === null) return '<span style="color:#737373;font-weight:400">wird berechnet</span>'; const u = parsePrice(o.uvp); const pct = u ? Math.round(s / u * 100) : 0; return `${fmtEur(s)}${pct > 0 ? ` <span style="color:var(--muted-foreground);font-weight:500;margin-left:6px">−${pct} %</span>` : ''}`; }

function controlHTML(fid, edit, v) {
  const d = F[fid];
  switch (d.type) {
    case 'text': return edit ? `<input type="text" id="f-${fid}" data-k="v" value="${esc(v)}" placeholder="${esc(d.placeholder || '')}">` : `<div class="ro">${d.link ? linkify(v) : esc(v)}</div>`;
    case 'richtext': return rtHTML(v, edit, 'v', d.placeholder, d.short, d.label);
    case 'check': return edit
      ? `<div class="check"><input type="checkbox" class="switch" data-k="checked" ${v.checked ? 'checked' : ''} aria-label="${esc(d.label)}: ${esc(d.checkLabel)}"><input type="text" data-k="text" value="${esc(v.text || '')}" placeholder="${esc(d.placeholder || '')}" aria-label="${esc(d.label)} Ablageort"></div>`
      : `<div class="check"><span class="badge ${v.checked ? 'done' : 'req'}">${v.checked ? 'Erledigt' : 'Offen'}</span><span class="ro">${esc(v.text || '')}</span></div>`;
    case 'media': return mediaHTML(v, edit, fid, { big: d.big });
    case 'mediaList': return listHTML(fid, v, edit);
    case 'offers': return offersHTML(fid, v, edit);
  }
  return '';
}
function fieldHTML(fid, edit, v = value(fid), wide) {
  const d = F[fid], m = S.fields[fid];
  const empty = isEmpty(fid, v);
  const labelTag = d.type === 'text' ? `<label for="f-${fid}">${esc(d.label)}</label>` : `<span class="lt">${esc(d.label)}</span>`;
  const state = d.required ? (empty ? '<span class="badge req">Pflicht</span>' : '<span class="badge done">Pflicht ✓</span>') : '';
  return `<div class="field${wide ? ' wide' : ''}${hasWho(m) ? ' has-who' : ''}" data-field="${fid}"${whoStyle(m)}>
    <div class="flabel">${labelTag}${state}${whoSlot(m)}</div>${d.help ? `<div class="help">${esc(d.help)}</div>` : ''}
    ${controlHTML(fid, edit, v)}</div>`;
}
function listHTML(fid, list, edit) {
  const d = F[fid];
  const items = list.map((it, i) => `<div class="item${hasWho(it) ? ' has-who' : ''}" data-iid="${esc(it.id)}"${whoStyle(it)}>
      <div class="ihead"><span class="no">${esc(d.itemLabel)} ${i + 1}</span>${whoSlot(it)}${edit ? itemTools(i, list.length) : ''}</div>
      ${edit ? `<input type="text" class="marker-title" data-k="title" value="${esc(it.title)}" placeholder="${esc(d.itemPlaceholder)}" aria-label="${esc(d.itemLabel)} ${i + 1} Titel">` : `<div><span class="ro marker-title">${esc(it.title || 'Ohne Titel')}</span></div>`}
      ${edit || (it.note && it.note.trim()) ? rtHTML(it.note, edit, 'note', 'Notiz (optional) – Länge, Einsatz, Hinweise …', true, 'Notiz') : ''}
      ${mediaHTML(it.media || [], edit, fid + '/' + it.id, { big: true, dropText: 'Video, Standbild oder Grafik hierher ziehen' })}
    </div>`).join('');
  return `<div class="rep">${items || (edit ? '' : '<div class="ro"></div>')}${edit ? `<button type="button" class="btn add small" data-act="add-item" style="align-self:flex-start">${ico('plus')}${esc(d.itemLabel)} hinzufügen</button>` : ''}</div>`;
}
function offersHTML(fid, list, edit) {
  const items = list.map((o, i) => `<div class="item${hasWho(o) ? ' has-who' : ''}" data-iid="${esc(o.id)}"${whoStyle(o)}>
      <div class="ihead"><span class="no">Angebot ${i + 1}</span>${whoSlot(o)}${edit ? itemTools(i, list.length) : ''}</div>
      <div class="offer-grid">
        <div class="field"><span class="lt" style="font-size:13px;color:var(--muted-foreground);font-weight:500">Orderscreen-Grafik</span>${mediaHTML(o.media || [], edit, fid + '/' + o.id, { dropText: 'Orderscreen hochladen' })}</div>
        <div style="display:flex;flex-direction:column;gap:12px;min-width:0">
          <div class="field"><span class="lt" style="font-size:13px;color:var(--muted-foreground);font-weight:500">Set-Inhalt</span>${rtHTML(o.set, edit, 'set', 'z. B. 1 x Platinum Lift Gesichtscreme 50ml', true, 'Set-Inhalt')}</div>
          <div class="prices">
            <div class="field"><label for="u-${esc(o.id)}">UVP</label>${edit ? `<input type="text" id="u-${esc(o.id)}" data-k="uvp" value="${esc(o.uvp)}" placeholder="129,95 €" inputmode="decimal">` : `<div class="price-ro">${esc(o.uvp || '—')}</div>`}</div>
            <div class="field"><label for="p-${esc(o.id)}">Preis</label>${edit ? `<input type="text" id="p-${esc(o.id)}" data-k="preis" value="${esc(o.preis)}" placeholder="69,95 €" inputmode="decimal">` : `<div class="price-ro">${esc(o.preis || '—')}</div>`}</div>
            <div class="field"><label>Ersparnis</label><div class="saving" data-saving>${savingHTML(o)}</div></div>
          </div>
        </div>
      </div></div>`).join('');
  return `<div class="rep">${items || (edit ? '<div class="help" style="margin:0">Noch keine Angebote angelegt.</div>' : '<div class="ro"></div>')}${edit ? `<button type="button" class="btn add small" data-act="add-item" style="align-self:flex-start">${ico('plus')}Angebot hinzufügen</button>` : ''}</div>`;
}
function secHTML(sec, i, edit) {
  return `<section class="sec" id="sec-${sec.id}" aria-labelledby="h-${sec.id}">
    <div class="sec-head"><span class="tile">${ico(sec.icon)}</span><div class="grow"><div class="eyebrow">${String(i + 1).padStart(2, '0')} / ${String(SECTIONS.length).padStart(2, '0')}</div><h2 id="h-${sec.id}">${esc(sec.title)}</h2></div><span class="cnt" data-cnt="${sec.id}"></span></div>
    ${sec.lead ? `<p class="lead">${esc(sec.lead)}</p>` : ''}
    ${sec.fields.map((f) => Array.isArray(f) ? `<div class="grid2">${f.map((x) => fieldHTML(x, edit)).join('')}</div>` : fieldHTML(f, edit)).join('')}
  </section>`;
}

/* Zähler, KPIs, Freigabe-Karte */
function liveFilled(fid) { return !isEmpty(fid, $('#form') ? readValue(fid) : value(fid)); }
function secCount(sec) { const fs = secFields(sec); return { done: fs.filter(liveFilled).length, all: fs.length, req: fs.filter((f) => F[f].required && !liveFilled(f)).length }; }
function refreshStatus() {
  if (!S.bp || !$('#form')) return;
  let done = 0;
  for (const sec of SECTIONS) {
    const c = secCount(sec); done += c.done;
    const cls = c.req ? 'cnt req' : c.done === c.all ? 'cnt full' : 'cnt';
    $$(`[data-cnt="${sec.id}"]`).forEach((el) => { el.className = cls; el.textContent = `${c.done}/${c.all}`; el.title = c.req ? `${c.req} Pflichtbereich offen` : ''; });
  }
  const pct = Math.round(done / TOTAL * 100);
  const missReq = REQUIRED.filter((f) => !liveFilled(f));
  const set = (id, h) => { const el = $(id); if (el) el.innerHTML = h; };
  set('#k-prog', `${pct} %`);
  const bar = $('#k-bar'); if (bar) bar.style.width = pct + '%';
  const nb = $('#navprog b'); if (nb) nb.style.width = pct + '%';
  set('#k-prog-s', `${done} von ${TOTAL} Bereichen befüllt`);
  set('#k-open', String(missReq.length));
  set('#k-open-s', missReq.length ? `<button type="button" class="s" data-jump="${missReq[0]}">Weiter zu: ${esc(F[missReq[0]].label)} →</button>` : 'Alle Pflichtbereiche befüllt');
  const st = $('#stand'); if (st) st.textContent = date(S.bp.updatedAt);
  $$('[data-field]').forEach((el) => {
    const fid = el.dataset.field; if (!F[fid] || !F[fid].required) return;
    const b = $('.flabel .badge', el); if (!b) return;
    const ok = liveFilled(fid); b.className = 'badge ' + (ok ? 'done' : 'req'); b.textContent = ok ? 'Pflicht ✓' : 'Pflicht';
  });
  renderSendCard();
}
function renderSendCard() {
  const el = $('#send-card'); if (!el) return;
  if (S.bp.status === 'approved') {
    const a = S.bp.approval;
    el.className = 'send-card final';
    el.innerHTML = `<div><div class="kicker">Freigabe</div><h2>Freigegeben · Version ${esc(a.version)}</h2><p>Von ${pname(a.by)} am ${esc(date(a.at, true))} Uhr. Der Blueprint ist gesperrt.${a.note ? ' Bemerkung: ' + esc(a.note) : ''}</p></div>
      <div class="bbtns">${a.pdf ? `<a class="btn primary" href="${pdfUrl(S.cur, a.pdf, true)}">${ico('filedown')}PDF herunterladen</a><a class="btn" href="${pdfUrl(S.cur, a.pdf)}" target="_blank" rel="noopener">${ico('eye')}Öffnen</a>` : ''}<button type="button" class="btn danger" id="sc-reopen">${ico('unlock')}Freigabe aufheben</button></div>`;
    $('#sc-reopen', el).onclick = reopenDialog;
  } else {
    const miss = REQUIRED.filter((f) => !liveFilled(f));
    const ready = !miss.length;
    el.className = 'send-card' + (ready ? ' ready' : '');
    el.innerHTML = `<div><div class="kicker">Letzter Schritt</div><h2>${ready ? 'Bereit zur Freigabe' : 'Freigabe'}</h2><p>${ready ? 'Alle Pflichtbereiche sind befüllt. Mit der Freigabe wird das PDF erzeugt, auf dem Server abgelegt und der Blueprint für alle gesperrt.' : `Noch ${miss.length} Pflichtbereich${miss.length > 1 ? 'e' : ''} offen. Du kannst trotzdem freigeben, wirst aber vorher gewarnt.`}</p></div>
      ${mayWrite() ? `<button type="button" class="btn ${ready ? 'light' : 'primary'}" id="sc-approve">${ico('send')}Freigeben &amp; PDF erzeugen</button>` : ''}
      <ul class="incl">${REQUIRED.map((f) => { const ok = liveFilled(f); return `<li class="${ok ? '' : 'todo'}">${ico(ok ? 'check' : 'dashed')}<button type="button" data-jump="${f}">${esc(F[f].label)}</button></li>`; }).join('')}</ul>`;
    const b = $('#sc-approve', el); if (b) b.onclick = approveDialog;
  }
}
function jumpTo(fid) {
  const el = $(`[data-field="${fid}"]`); if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  const f = $('input,[contenteditable="true"]', el); if (f) setTimeout(() => f.focus({ preventScroll: true }), 350);
}

function renderEditor() {
  const v = $('#view');
  if (!S.bp || !S.fieldsLoaded) {
    v.innerHTML = `<div class="wrap"><div class="frame top-gap"><div class="frame-in single"><main class="main"><div class="empty">${S.bp === false ? `${ico('alert')}<h3>Blueprint nicht gefunden</h3><p>Er wurde vielleicht gelöscht.</p><button type="button" class="btn" id="nf-back">${ico('arrowleft')}Zur Übersicht</button>` : '<div class="spin"></div><p>Blueprint wird geladen …</p>'}</div></main></div></div></div>`;
    const nb = $('#nf-back'); if (nb) nb.onclick = () => { location.hash = ''; };
    return;
  }
  const edit = editable();
  hideToolbar();
  S.local = {};
  for (const fid in F) { if (F[fid].type in COMPOSITE) S.local[fid] = clone(value(fid)); S.base[fid] = S.fields[fid] ? S.fields[fid].at : null; S.baseVal[fid] = clone(value(fid)); }
  const ap = S.bp.status === 'approved';
  const ids = Object.keys(S.bp.contributors || {}).sort((a, b) => (S.bp.contributors[b].last || '').localeCompare(S.bp.contributors[a].last || ''));
  const navItems = SECTIONS.map((s) => `<button type="button" class="navlink" data-sec="${s.id}">${ico(s.icon)}<span class="lab">${esc(s.title)}</span><span class="cnt" data-cnt="${s.id}"></span></button>`).join('')
    + `<button type="button" class="navlink" data-sec="send">${ico('send')}<span class="lab">Freigabe</span></button>`;
  v.innerHTML = `<div class="wrap"><div class="frame top-gap" id="app">
    <div class="frame-top" aria-hidden="true"><i></i><i></i><i></i><span>genius-studios · blueprint</span></div>
    <div class="frame-in">
      <aside class="side"><nav class="index" aria-label="Blueprint-Abschnitte">
        <button type="button" class="navlink" id="nav-back">${ico('arrowleft')}<span class="lab">Alle Blueprints</span></button>
        <div class="navhead" style="margin-top:8px">Abschnitte</div><div class="navprog" id="navprog"><b></b></div>${navItems}
        <div class="side-legend"><div class="navhead" style="padding:0">Beteiligte</div>${ids.length ? ids.map((n) => `<div class="who-chip"><i class="dot" style="--c:${personColor(n)}"></i><span>${pname(n)}</span></div>`).join('') : '<div class="help" style="margin:0">Noch niemand</div>'}
          <label class="chk" style="font-size:13px;margin-top:6px"><input type="checkbox" class="switch" id="toggle-marks" ${S.marks ? 'checked' : ''}>Markierungen zeigen</label></div>
      </nav></aside>
      <main class="main">
        <nav class="mobile-nav" aria-label="Abschnitte"><button type="button" class="navlink" data-home>${ico('arrowleft')}Übersicht</button>${navItems}</nav>
        <div class="mainhead">
          <div style="min-width:0"><h2><span id="doc-title">${esc(S.bp.titel || 'Blueprint')}</span>${ap ? `<span class="badge ok">${ico('lock')}Freigegeben v${esc(S.bp.approval.version)}</span>` : '<span class="badge draft">In Bearbeitung</span>'}</h2>
            <div class="mhsub">${esc(S.bp.artikel || '')}${S.bp.artikel ? ' · ' : ''}Stand <span id="stand">${esc(date(S.bp.updatedAt))}</span>${edit ? ' · Änderungen werden automatisch gespeichert' : ''}</div></div>
          <div class="mhbtns"><span class="save-state" id="save-state" aria-live="polite"></span>
            <button type="button" class="btn small" id="btn-history" aria-label="Verlauf">${ico('history')}<span class="lbl">Verlauf</span></button>
            <button type="button" class="btn small" id="btn-preview" aria-label="${ap ? 'PDF herunterladen' : 'PDF-Vorschau'}">${ico(ap ? 'filedown' : 'eye')}<span class="lbl">${ap ? 'PDF herunterladen' : 'PDF-Vorschau'}</span></button>
            ${edit ? `<button type="button" class="btn small primary" id="btn-approve" aria-label="Freigeben">${ico('send')}<span class="lbl">Freigeben</span></button>` : ''}</div>
        </div>
        <div class="kpis">
          <div class="kpi"><span class="tile">${ico('listchecks')}</span><div class="bx"><div class="k">Fortschritt</div><div class="v" id="k-prog"></div><div class="prog"><b id="k-bar"></b></div><div class="s" id="k-prog-s"></div></div></div>
          <div class="kpi"><span class="tile">${ico('alert')}</span><div class="bx"><div class="k">Offene Pflichtbereiche</div><div class="v" id="k-open"></div><div class="s" id="k-open-s"></div></div></div>
          <div class="kpi"><span class="tile">${ico('flag')}</span><div class="bx"><div class="k">Status</div><div class="v">${ap ? 'Freigegeben' : 'Entwurf'}</div><div class="s status ${ap ? 'on' : ''}">${ap ? `am ${esc(date(S.bp.approval.at))}` : 'wird bearbeitet'}</div></div></div>
          <div class="kpi"><span class="tile">${ico('users')}</span><div class="bx"><div class="k">Beteiligte</div><div class="v">${ids.length || '—'}</div><div class="s"><span class="avatars">${ids.slice(0, 6).map((n) => avatar(n)).join('')}</span></div></div></div>
        </div>
        ${ap ? `<div class="banner final"><span>${ico('lock')}<span>Freigegeben von ${pname(S.bp.approval.by)} am ${esc(date(S.bp.approval.at, true))} Uhr. Eingaben sind gesperrt.</span></span></div>` : ''}
        ${!mayWrite() ? `<div class="banner warn"><span>${ico('info')}<span>Bitte gib deinen Namen an, um mitzuarbeiten.</span></span><button type="button" class="btn small primary" id="b-name">Name festlegen</button></div>` : ''}
        <div class="form${S.marks ? ' marks' : ''}" id="form">${SECTIONS.map((s, i) => secHTML(s, i, edit)).join('')}</div>
        <section class="send-card" id="send-card" aria-live="polite"></section>
      </main>
    </div></div></div>`;
  $('#nav-back').onclick = () => { location.hash = ''; };
  $$('[data-home]', v).forEach((b) => b.onclick = () => { location.hash = ''; });
  $$('[data-sec]', v).forEach((b) => b.onclick = () => { const t = b.dataset.sec === 'send' ? $('#send-card') : $('#sec-' + b.dataset.sec); if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
  $('#toggle-marks').onchange = (e) => { S.marks = e.target.checked; $('#form').classList.toggle('marks', S.marks); try { localStorage.setItem('bp.marks', S.marks ? '1' : '0'); } catch (x) { /* */ } };
  $('#btn-history').onclick = openHistory;
  $('#btn-preview').onclick = previewPdf;
  const ab = $('#btn-approve'); if (ab) ab.onclick = approveDialog;
  const bn = $('#b-name'); if (bn) bn.onclick = () => askUser(true).then(() => { renderBar(); renderEditor(); });
  refreshStatus();
}
function rerenderField(fid, v) {
  const el = $(`#form [data-field="${fid}"]`); if (!el) return null;
  const val = v === undefined ? value(fid) : v;
  if (v === undefined) { S.base[fid] = S.fields[fid] ? S.fields[fid].at : null; S.baseVal[fid] = clone(val); if (F[fid].type in COMPOSITE) S.local[fid] = clone(val); }
  const tmp = document.createElement('div');
  tmp.innerHTML = fieldHTML(fid, editable(), val, el.classList.contains('wide'));
  const fresh = tmp.firstElementChild;
  el.replaceWith(fresh);
  refreshStatus();
  return fresh;
}

/* ============ Laden & Abgleich (Polling) ============ */
let pollTimer = null;
function bpFromDoc(doc) {
  const f = doc.fields || {};
  return { id: doc.id, titel: (f.titel || {}).value || '', artikel: (f.artikel || {}).value || '', status: doc.status, approval: doc.approval, approvals: doc.approvals || [], updatedAt: doc.updatedAt, updatedBy: doc.updatedBy, contributors: doc.contributors || {} };
}
function applyDoc(doc, initial) {
  const prevStatus = S.bp && S.bp.status;
  const nf = doc.fields || {};
  const changed = Object.keys(F).filter((fid) => JSON.stringify(nf[fid] || null) !== JSON.stringify(S.fields[fid] || null));
  S.bp = bpFromDoc(doc);
  S.rev = doc.rev;
  S.history = (doc.history || []).slice().reverse();
  if ($('#drawer').classList.contains('open')) paintHistory();
  if (initial || prevStatus !== S.bp.status) {
    if (!initial) toast(S.bp.status === 'approved' ? 'Der Blueprint wurde freigegeben – Eingaben sind jetzt gesperrt.' : 'Die Freigabe wurde aufgehoben – Bearbeitung wieder möglich.');
    S.fields = nf; S.fieldsLoaded = true; S.dirty.clear(); S.conflicts = {};
    renderBar(); renderEditor();
    return;
  }
  for (const fid of changed) {
    const remote = nf[fid];
    const el = $(`#form [data-field="${fid}"]`);
    const busyF = S.dirty.has(fid) || S.inflight[fid] || (el && el.contains(document.activeElement));
    if (busyF) {
      // Eigener Stand bleibt; Hinweis, wenn jemand anderes geändert hat
      if (remote && remote.by !== (me && me.name) && remote.at !== S.base[fid]) { S.fields[fid] = S.fields[fid] || remote; showConflict(fid, remote); }
      continue;
    }
    if (remote) S.fields[fid] = remote; else delete S.fields[fid];
    if (remote && remote.by === (me && me.name) && remote.at === S.base[fid]) continue;
    const fresh = rerenderField(fid);
    if (fresh && fresh.animate) fresh.animate([{ backgroundColor: 'rgba(0,101,252,.22)' }, { backgroundColor: 'rgba(0,101,252,0)' }], { duration: 1600 });
  }
  const dt = $('#doc-title'); if (dt && !S.dirty.has('titel')) dt.textContent = S.bp.titel || 'Blueprint';
  refreshStatus();
}
async function openBp(id) {
  clearInterval(pollTimer);
  Object.assign(S, { cur: id, bp: null, rev: null, fields: {}, fieldsLoaded: false, history: [], conflicts: {}, dirty: new Set() });
  renderBar(); renderEditor(); window.scrollTo(0, 0);
  try {
    const res = await api('get', null, { id });
    if (S.cur !== id) return;
    users = res.users || users;
    applyDoc(res.doc, true);
  } catch (e) {
    if (S.cur !== id) return;
    S.bp = e.status === 404 ? false : null;
    if (S.bp === null) toast('Blueprint konnte nicht geladen werden: ' + e.message, 'err');
    renderEditor(); return;
  }
  pollTimer = setInterval(() => poll(id), 5000);
}
let polling = false;
async function poll(id, force) {
  if (polling || S.cur !== id || (document.hidden && !force)) return;
  polling = true;
  try {
    const res = await api('get', null, force ? { id } : { id, since: S.rev });
    if (S.cur === id && res.changed) { users = res.users || users; applyDoc(res.doc, false); }
  } catch (e) { /* Abgleich still wiederholen */ } finally { polling = false; }
}
document.addEventListener('visibilitychange', () => { if (!document.hidden) { if (S.cur) poll(S.cur); else loadList(); } });

/* ============ Speichern ============ */
function setSaveState(kind) {
  const el = $('#save-state'); if (!el) return;
  el.className = 'save-state' + (kind === 'error' || kind === 'conflict' ? ' err' : kind === 'saved' ? ' ok' : '');
  el.innerHTML = { saving: '<span class="spin-s"></span>Speichert …', saved: ico('check') + 'Gespeichert', error: ico('alert') + 'Nicht gespeichert', conflict: ico('alert') + 'Konflikt prüfen', dirty: 'Ungespeichert …' }[kind] || '';
}
function readValue(fid) {
  const t = F[fid].type;
  if (t in COMPOSITE) return S.local[fid];
  const el = $(`#form [data-field="${fid}"]`); if (!el || !editable()) return value(fid);
  if (t === 'richtext') return $('.rt[data-k="v"]', el).innerHTML;
  if (t === 'check') return { checked: $('[data-k="checked"]', el).checked, text: $('[data-k="text"]', el).value };
  return $('[data-k="v"]', el).value;
}
function touch(fid, delay = 900) {
  S.dirty.add(fid); S.ver[fid] = (S.ver[fid] || 0) + 1;
  setSaveState('dirty');
  clearTimeout(S.timers[fid]); S.timers[fid] = setTimeout(() => save(fid), delay);
  if (fid === 'titel') { const dt = $('#doc-title'); if (dt) dt.textContent = readValue('titel') || 'Blueprint'; }
  refreshStatus();
}
function save(fid) {
  clearTimeout(S.timers[fid]);
  if (S.inflight[fid]) { S.again[fid] = true; return S.inflight[fid]; }
  if (!S.dirty.has(fid) || !editable()) return Promise.resolve();
  const id = S.cur;
  const run = (async () => {
    const ver = S.ver[fid];
    const val = clone(readValue(fid));
    setSaveState('saving');
    try {
      const res = await api('save', { id, field: fid, value: val, base: S.base[fid], user: me.name, color: me.color, force: !!S.force[fid] });
      delete S.force[fid];
      if (res.field) {
        S.fields[fid] = res.field; S.base[fid] = res.field.at; S.baseVal[fid] = clone(res.field.value);
        if (F[fid].type in COMPOSITE) mergeStamps(S.local[fid], res.field.value);
      }
      if (res.updatedAt) { S.bp.updatedAt = res.updatedAt; S.bp.updatedBy = me.name; S.bp.contributors[me.name] = { ...(S.bp.contributors[me.name] || {}), last: res.updatedAt }; }
      if (S.ver[fid] === ver) S.dirty.delete(fid);
      refreshTags(fid); clearConflict(fid); refreshStatus();
      setSaveState(S.dirty.size ? 'dirty' : 'saved');
    } catch (e) {
      if (e.status === 409 && e.payload && e.payload.field) { showConflict(fid, e.payload.field); setSaveState('conflict'); delete S.again[fid]; }
      else if (e.status === 423) { toast('Dieser Blueprint wurde inzwischen freigegeben – Eingaben sind gesperrt.', 'err'); S.dirty.clear(); poll(id, true); }
      else { setSaveState('error'); toast('Speichern fehlgeschlagen: ' + e.message, 'err'); }
    }
  })();
  S.inflight[fid] = run;
  run.finally(() => {
    if (S.inflight[fid] === run) delete S.inflight[fid];
    if (S.again[fid]) { delete S.again[fid]; S.timers[fid] = setTimeout(() => save(fid), 50); }
  });
  return run;
}
function mergeStamps(local, server) {
  if (!Array.isArray(local) || !Array.isArray(server)) return;
  const byId = Object.fromEntries(server.map((x) => [x.id, x]));
  for (const it of local) { const s = byId[it.id]; if (!s) continue; for (const k of ['by', 'at']) if (k in s) it[k] = s[k]; else delete it[k]; if (Array.isArray(it.media)) mergeStamps(it.media, s.media); }
}
function refreshTags(fid) {
  const el = $(`#form [data-field="${fid}"]`); if (!el) return;
  const m = S.fields[fid];
  applyWho(el, m);
  if (F[fid].type in COMPOSITE) {
    const stampMedia = (list, root) => (list || []).forEach((md) => applyWho($(`[data-mid="${md.id}"]`, root), md));
    const v = m ? m.value : [];
    if (F[fid].type === 'media') stampMedia(v, el);
    else v.forEach((it) => { const iel = $(`[data-iid="${it.id}"]`, el); if (!iel) return; applyWho(iel, it); });
  }
}
async function flushAll() {
  const ids = [...new Set([...S.dirty, ...Object.keys(S.inflight)])];
  await Promise.all(ids.map(save));
  await Promise.all(Object.values(S.inflight));
}
function showConflict(fid, remote) {
  const el = $(`#form [data-field="${fid}"]`); if (!el) return;
  let box = $(':scope > .conflict', el);
  if (box && S.conflicts[fid] && S.conflicts[fid].at === remote.at) return;
  S.conflicts[fid] = remote;
  if (!box) { box = document.createElement('div'); box.className = 'conflict'; $('.flabel', el).after(box); }
  box.innerHTML = `${ico('alert')}<span class="grow"><b>${pname(remote.by)}</b> hat diesen Bereich um ${esc(date(remote.at, 's'))} geändert, während du ihn bearbeitet hast.</span>
    <button type="button" class="btn xs" data-act="take-theirs">Deren Version laden</button><button type="button" class="btn xs primary" data-act="keep-mine">Meine Version speichern</button>`;
}
function clearConflict(fid) { delete S.conflicts[fid]; const b = $(`#form [data-field="${fid}"] > .conflict`); if (b) b.remove(); }

/* ============ Eingaben ============ */
const findItem = (l, id) => (l || []).find((x) => x.id === id);
function targetList(target) { const [fid, iid] = target.split('/'); if (!iid) return S.local[fid]; const it = findItem(S.local[fid], iid); if (!it.media) it.media = []; return it.media; }
const view = $('#view');
view.addEventListener('input', (e) => {
  if (!editable()) return;
  const fld = e.target.closest('#form [data-field]'); if (!fld) return;
  const fid = fld.dataset.field;
  if (F[fid].type in COMPOSITE) {
    const k = e.target.dataset.k;
    const v = e.target.isContentEditable ? e.target.innerHTML : e.target.value;
    const mEl = e.target.closest('[data-mid]'), iEl = e.target.closest('[data-iid]');
    if (mEl && k === 'caption') { const m = findItem(targetList(mEl.closest('[data-grid]').dataset.grid), mEl.dataset.mid); if (m) m.caption = v; }
    else if (iEl && k) { const it = findItem(S.local[fid], iEl.dataset.iid); if (!it) return; it[k] = v; if (k === 'uvp' || k === 'preis') $('[data-saving]', iEl).innerHTML = savingHTML(it); }
    else return;
  }
  touch(fid, e.target.type === 'checkbox' ? 50 : 900);
});
view.addEventListener('focusout', (e) => {
  const fld = e.target.closest('#form [data-field]'); if (!fld) return;
  const fid = fld.dataset.field;
  if (S.dirty.has(fid)) setTimeout(() => { if (!fld.contains(document.activeElement)) save(fid); }, 0);
});
view.addEventListener('focusin', (e) => { if (e.target.classList && e.target.classList.contains('rt')) showToolbar(e.target); });
view.addEventListener('click', async (e) => {
  const j = e.target.closest('[data-jump]'); if (j) { jumpTo(j.dataset.jump); return; }
  const btn = e.target.closest('#form [data-act]');
  if (!btn || !editable()) return;
  const fld = btn.closest('[data-field]'), fid = fld.dataset.field, act = btn.dataset.act;
  if (act === 'take-theirs') { S.fields[fid] = S.conflicts[fid]; S.dirty.delete(fid); clearConflict(fid); rerenderField(fid); setSaveState(S.dirty.size ? 'dirty' : 'saved'); return; }
  if (act === 'keep-mine') { S.force[fid] = true; clearConflict(fid); S.dirty.add(fid); save(fid); return; }
  if (act === 'rm-media') {
    e.preventDefault();
    const mEl = btn.closest('[data-mid]'), list = targetList(btn.closest('[data-grid]').dataset.grid);
    const i = list.findIndex((x) => x.id === mEl.dataset.mid);
    if (i < 0 || !(await confirmBox('Datei entfernen?', `„${list[i].name}“ wird aus diesem Bereich entfernt.`, 'Entfernen', 'trash'))) return;
    list.splice(i, 1); mEl.remove(); touch(fid, 10); return;
  }
  const list = S.local[fid];
  if (act === 'add-item') {
    const it = F[fid].type === 'offers' ? { id: rid(), media: [], set: '', uvp: '', preis: '' } : { id: rid(), title: '', note: '', media: [] };
    list.push(it);
    const el = rerenderField(fid, list);
    const f = el && $(`[data-iid="${it.id}"] [data-k]`, el); if (f) f.focus();
    touch(fid, 400); return;
  }
  const iEl = btn.closest('[data-iid]'); if (!iEl) return;
  const i = list.findIndex((x) => x.id === iEl.dataset.iid);
  if (act === 'del-item') { if (!(await confirmBox('Eintrag löschen?', 'Dieser Eintrag wird inklusive seiner Medien aus dem Blueprint entfernt.', 'Löschen', 'trash'))) return; list.splice(i, 1); }
  else if (act === 'up' && i > 0) [list[i - 1], list[i]] = [list[i], list[i - 1]];
  else if (act === 'down' && i < list.length - 1) [list[i + 1], list[i]] = [list[i], list[i + 1]];
  else return;
  rerenderField(fid, list); touch(fid, 10);
});
view.addEventListener('change', (e) => {
  if (!e.target.matches('.drop input[type=file]')) return;
  uploadFiles(e.target.closest('[data-drop]').dataset.drop, Array.from(e.target.files));
  e.target.value = '';
});
view.addEventListener('dragover', (e) => { const d = e.target.closest('[data-drop]'); if (d && editable()) { e.preventDefault(); d.classList.add('over'); } });
view.addEventListener('dragleave', (e) => { const d = e.target.closest('[data-drop]'); if (d) d.classList.remove('over'); });
view.addEventListener('drop', (e) => { const d = e.target.closest('[data-drop]'); if (!d || !editable()) return; e.preventDefault(); d.classList.remove('over'); uploadFiles(d.dataset.drop, Array.from(e.dataTransfer.files)); });
async function uploadFiles(target, files) {
  if (!files.length || !editable()) return;
  const fid = target.split('/')[0];
  const box = $(`[data-uploads="${CSS.escape(target)}"]`);
  await Promise.all(files.map(async (file) => {
    const row = document.createElement('div');
    row.className = 'urow';
    row.innerHTML = `<span class="spin-s"></span><span class="t">${esc(file.name)} · 0 %</span>`;
    if (box) box.appendChild(row);
    try {
      const res = await postForm('upload', { id: S.cur, user: me.name, color: me.color, file }, (p) => { $('.t', row).textContent = `${file.name} · ${Math.round(p * 100)} %`; });
      const m = { ...res.media, by: me.name, at: now() };
      targetList(target).push(m);
      const grid = $(`[data-grid="${CSS.escape(target)}"]`);
      if (grid) grid.insertAdjacentHTML('beforeend', miHTML(m, true));
      row.remove();
      touch(fid, 10);
    } catch (err) {
      row.className = 'urow err';
      row.textContent = `${file.name}: ${err.message}`;
      setTimeout(() => row.remove(), 9000);
    }
  }));
}

/* ============ Text-Werkzeugleiste ============ */
const tb = document.createElement('div');
tb.className = 'rt-toolbar'; tb.hidden = true; tb.setAttribute('role', 'toolbar'); tb.setAttribute('aria-label', 'Textformatierung');
tb.innerHTML = `<button type="button" data-cmd="bold" title="Fett">B</button><button type="button" data-cmd="italic" title="Kursiv"><i style="font-family:serif">I</i></button><button type="button" data-cmd="underline" title="Unterstrichen"><u>U</u></button><i></i>
  <button type="button" data-cmd="insertUnorderedList" title="Aufzählung">•</button><button type="button" data-cmd="insertOrderedList" title="Nummerierung">1.</button><button type="button" data-cmd="arrow" title="Pfeil einfügen">→</button><i></i>
  <button type="button" data-cmd="mark" class="mk" title="Textmarker">M</button><button type="button" data-cmd="link" title="Link einfügen">🔗</button><button type="button" data-cmd="removeFormat" title="Formatierung entfernen">${ico('x')}</button>`;
document.body.appendChild(tb);
let tbTarget = null, savedRange = null;
function showToolbar(rt) {
  tbTarget = rt; tb.hidden = false;
  const r = rt.getBoundingClientRect();
  tb.style.top = Math.max(window.scrollY + 76, window.scrollY + r.top - tb.offsetHeight - 6) + 'px';
  tb.style.left = Math.max(8, Math.min(window.scrollX + r.left, window.scrollX + document.documentElement.clientWidth - tb.offsetWidth - 8)) + 'px';
}
function hideToolbar() { tb.hidden = true; tbTarget = null; }
document.addEventListener('focusout', () => setTimeout(() => { const a = document.activeElement; if (!(a && a.classList && a.classList.contains('rt')) && !$('.modal')) hideToolbar(); }, 150));
window.addEventListener('scroll', () => { if (tbTarget) showToolbar(tbTarget); }, { passive: true });
tb.addEventListener('mousedown', (e) => e.preventDefault());
tb.addEventListener('click', (e) => {
  const b = e.target.closest('[data-cmd]'); if (!b || !tbTarget) return;
  const cmd = b.dataset.cmd, target = tbTarget;
  target.focus();
  if (cmd === 'mark') {
    document.execCommand('styleWithCSS', false, true);
    const cur = String(document.queryCommandValue('hiliteColor') || document.queryCommandValue('backColor'));
    document.execCommand('hiliteColor', false, /255,\s*225,\s*77|ffe14d|255,\s*242,\s*0|yellow/i.test(cur) ? 'transparent' : '#FFE14D');
    document.execCommand('styleWithCSS', false, false);
  } else if (cmd === 'link') {
    const sel = window.getSelection(); savedRange = sel.rangeCount ? sel.getRangeAt(0).cloneRange() : null;
    const body = document.createElement('div');
    body.innerHTML = '<div class="field"><label for="lnk">Link-Adresse</label><input type="text" id="lnk" placeholder="https://…"></div>';
    const m = modal({ title: 'Link einfügen', body, actions: [{ label: 'Einfügen', cls: 'primary', onClick: () => {
      const url = $('#lnk', body).value.trim();
      if (!/^(https?:\/\/|mailto:|\\\\)/i.test(url)) { toast('Bitte eine Adresse mit https:// eingeben.', 'err'); return false; }
      target.focus();
      const s2 = window.getSelection(); if (savedRange) { s2.removeAllRanges(); s2.addRange(savedRange); }
      if (s2.isCollapsed) document.execCommand('insertHTML', false, `<a href="${esc(url)}" target="_blank" rel="noopener">${esc(url)}</a>`); else document.execCommand('createLink', false, url);
      target.dispatchEvent(new Event('input', { bubbles: true }));
    } }] });
    body.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') m.submit(); });
    return;
  } else if (cmd === 'arrow') document.execCommand('insertText', false, '→ ');
  else document.execCommand(cmd, false, null);
  target.dispatchEvent(new Event('input', { bubbles: true }));
});
const ALLOWED = new Set(['B', 'STRONG', 'I', 'EM', 'U', 'S', 'BR', 'P', 'DIV', 'UL', 'OL', 'LI', 'A', 'MARK', 'SPAN', 'SUB', 'SUP']);
function cleanHTML(html) {
  const d = new DOMParser().parseFromString(html, 'text/html');
  d.querySelectorAll('script,style,meta,link,title,xml,iframe,object,svg').forEach((n) => n.remove());
  const walk = (node) => {
    for (const c of Array.from(node.childNodes)) {
      if (c.nodeType === 8) { c.remove(); continue; }
      if (c.nodeType !== 1) continue;
      walk(c);
      if (!ALLOWED.has(c.tagName)) { c.replaceWith(...c.childNodes); continue; }
      const href = c.getAttribute('href'); const bg = (c.getAttribute('style') || '').match(/background(?:-color)?\s*:\s*([^;]+)/i);
      for (const a of Array.from(c.attributes)) c.removeAttribute(a.name);
      if (c.tagName === 'A' && href && /^(https?:|mailto:)/i.test(href)) { c.setAttribute('href', href); c.setAttribute('target', '_blank'); c.setAttribute('rel', 'noopener'); }
      if (bg && /yellow|ff0|fff200|ffff00|ffe14d|255,\s*2[2-5]\d,\s*(0|77)/i.test(bg[1])) c.setAttribute('style', 'background-color: #FFE14D');
    }
  };
  walk(d.body);
  return d.body.innerHTML;
}
view.addEventListener('paste', (e) => {
  const rt = e.target.closest && e.target.closest('.rt'); if (!rt) return;
  e.preventDefault();
  const html = e.clipboardData.getData('text/html');
  if (html) document.execCommand('insertHTML', false, cleanHTML(html)); else document.execCommand('insertText', false, e.clipboardData.getData('text/plain'));
});

/* ============ Verlauf ============ */
function paintHistory() {
  const verb = (h) => h.action === 'bearbeitet' ? `hat <b>${esc((F[h.field] || {}).label || h.field)}</b> bearbeitet`
    : h.action === 'angelegt' ? `hat den Blueprint angelegt${h.detail ? ' (' + esc(h.detail) + ')' : ''}`
    : h.action === 'freigegeben' ? `hat <b>freigegeben</b> (${esc(h.detail || '')})`
    : /aufgehoben/.test(h.action) ? `hat die <b>Freigabe aufgehoben</b>: ${esc(h.detail || '')}` : esc(h.action);
  const aps = ((S.bp && S.bp.approvals) || []).slice().reverse();
  $('#history').innerHTML = (aps.length ? '<h3>Freigegebene Versionen</h3>' + aps.map((a) => `<div class="hist"><span class="avatar" style="--c:#16A34A">v${esc(a.version)}</span><div><a class="btn xs" href="${pdfUrl(S.cur, a.pdf, true)}">${ico('filedown')}PDF Version ${esc(a.version)}</a><div class="when">${pname(a.by)} · ${esc(date(a.at, true))}</div></div></div>`).join('') + '<h3>Änderungen</h3>' : '')
    + (S.history.length ? S.history.map((h) => `<div class="hist">${avatar(h.by)}<div><b>${pname(h.by)}</b> ${verb(h)}<div class="when">${esc(date(h.at, true))}</div></div></div>`).join('') : '<p class="help">Noch keine Einträge.</p>');
}
function openHistory() { paintHistory(); const d = $('#drawer'); d.classList.add('open'); d.setAttribute('aria-hidden', 'false'); $('#drawer-close').focus(); }
$('#drawer-close').onclick = () => { const d = $('#drawer'); d.classList.remove('open'); d.setAttribute('aria-hidden', 'true'); };
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && $('#drawer').classList.contains('open') && !$('.modal')) $('#drawer-close').click(); });

/* ============ PDF (Dokument-Layout) ============ */
function pWho(o, marks) { return marks && hasWho(o) ? `<div class="pw"><i style="--c:${personColor(o.by)}"></i>${pname(o.by)} · ${esc(date(o.at, 's'))}</div>` : ''; }
function pMedia(list, cls = '') {
  if (!list || !list.length) return '';
  return `<div class="pg ${cls}">${list.map((m) => `<div class="pm">${isImage(m) ? `<img src="${mediaUrl(m)}" alt="">` : isVideo(m) ? `<div class="thumb"><video src="${mediaUrl(m)}" data-name="${esc(m.name)}"></video></div>` : `<div class="pfile">${esc(m.name)}</div>`}${m.caption ? `<div class="cap">${esc(m.caption)}</div>` : ''}</div>`).join('')}</div>`;
}
function pVal(fid, marks) {
  const d = F[fid], v = value(fid), w = pWho(S.fields[fid], marks);
  switch (d.type) {
    case 'text': return w + `<div class="v">${d.link ? linkify(v) : esc(v)}</div>`;
    case 'richtext': return w + `<div class="v">${v || ''}</div>`;
    case 'check': return w + `<div class="v">${v.checked ? '☑' : '☐'} ${esc(v.text || '')}</div>`;
    case 'media': return w + pMedia(v, fid === 'badges' || fid === 'produktbild' ? 'compact' : '');
    case 'mediaList': return v.map((it, i) => `<div class="pit">${pWho(it, marks)}<div>${i + 1}. <span class="mt">${esc(it.title)}</span></div>${it.note ? `<div class="v">${it.note}</div>` : ''}${pMedia(it.media, 'wide')}</div>`).join('');
  }
  return '';
}
function pRow(fid, marks) { const d = F[fid]; return `<div class="r"><div class="c"><div class="l">${esc(d.label)}${d.help && d.type === 'check' ? `<small>(${esc(d.help)})</small>` : ''}</div></div><div class="c">${pVal(fid, marks)}</div></div>`; }
function docHTML(approval, marks) {
  const o = [];
  o.push(`<div class="t"><div class="r meta"><div class="c">Autor: ${esc(value('autor'))}</div><div class="c">Stand: ${esc(date(S.bp.updatedAt))}</div></div>
    <div class="r meta"><div class="c"><i>Artikel:</i> ${esc(value('artikel'))}</div><div class="c"><i>Art.-Nr.:</i> ${esc(value('artnr'))}</div></div></div>`);
  o.push(`<div class="t"><div class="r"><div class="c">Produktbild:${pVal('produktbild', marks)}</div><div class="c"><div class="l">Artikel Info:</div>${pVal('artikelinfo', marks)}</div></div>`);
  if (!isEmpty('shows', value('shows'))) o.push(pRow('shows', marks));
  value('angebote').forEach((of, i) => o.push(`<div class="r"><div class="c">${i === 0 ? 'Orderscreen-Grafik:' : ''}${pMedia(of.media, 'compact')}</div><div class="c">${pWho(of, marks)}<div class="l">${i + 1}. Angebotsset &amp; Preis:</div><div class="v"><b>Set:</b> ${of.set || ''}</div><div class="price"><span>UVP:</span><span>${esc(of.uvp)}</span><span>Preis:</span><span>${esc(of.preis)}</span><span>Ersparnis:</span><span>${savingOf(of) === null ? '' : fmtEur(savingOf(of))}</span></div></div></div>`));
  o.push('</div>');
  // Balken und erste Zeile bleiben zusammen, damit kein Balken allein am Seitenende steht
  const sec = (bar, rows) => {
    const tmp = document.createElement('div'); tmp.innerHTML = rows;
    const first = tmp.firstElementChild ? tmp.firstElementChild.outerHTML : '';
    if (tmp.firstElementChild) tmp.firstElementChild.remove();
    o.push(`<div class="t gap"><div class="keep"><div class="b">${esc(bar)}</div>${first}</div>${tmp.innerHTML}</div>`);
  };
  sec('Key Question', `<div class="r full"><div class="c">${pVal('keyquestion', marks)}</div></div>`);
  sec('Produktübersicht', pRow('produktmerkmale', marks) + pRow('experte', marks));
  sec('Fragen: Moderator', `<div class="r full"><div class="c">${pVal('fragen', marks)}</div></div>`);
  sec('Einspieler: MAZen, Grafiken', pRow('vorschau', marks) + `<div class="r full"><div class="c"><div class="l">MAZEN:</div>${pVal('mazen', marks)}</div></div><div class="r full"><div class="c"><div class="l">GRAFIKEN:</div>${pVal('grafiken', marks)}</div></div><div class="r full"><div class="c"><div class="l">VORHER/NACHHER-GRAFIKEN:</div>${pVal('vorhernachher', marks)}</div></div>`);
  sec('Studio', ['setaufbau', 'props', 'dresscode_mod', 'dresscode_exp'].map((f) => pRow(f, marks)).join(''));
  sec('EDIT / Nachbearbeitung', ['supers', 'badges', 'logo', 'assets'].map((f) => pRow(f, marks)).join(''));
  if (!isEmpty('notizen', value('notizen'))) sec('Notizen', `<div class="r full"><div class="c">${pVal('notizen', marks)}</div></div>`);
  if (approval) {
    const ids = Object.keys(S.bp.contributors || {});
    sec('Freigabe', `<div class="r"><div class="c"><div class="l">Freigegeben von</div></div><div class="c">${pname(approval.by)}</div></div>
      <div class="r"><div class="c"><div class="l">Datum</div></div><div class="c">${esc(date(approval.at, true))} Uhr · Version ${esc(approval.version)}</div></div>
      ${approval.note ? `<div class="r"><div class="c"><div class="l">Bemerkung</div></div><div class="c">${esc(approval.note)}</div></div>` : ''}
      <div class="r"><div class="c"><div class="l">Beteiligte</div></div><div class="c">${ids.map((n) => `${pname(n)} (zuletzt ${esc(date(S.bp.contributors[n].last))})`).join(', ') || '—'}</div></div>`);
  }
  return o.join('');
}
function videoStill(src) {
  return new Promise((resolve) => {
    const v = document.createElement('video'); v.muted = true; v.preload = 'auto'; v.playsInline = true;
    let done = false;
    const fin = (u) => { if (done) return; done = true; clearTimeout(tm); v.removeAttribute('src'); v.load(); resolve(u); };
    const tm = setTimeout(() => fin(null), 10000);
    v.addEventListener('loadeddata', () => { v.currentTime = Math.min(1, (v.duration || 3) / 3); }, { once: true });
    v.addEventListener('seeked', () => { try { const c = document.createElement('canvas'); c.width = v.videoWidth; c.height = v.videoHeight; c.getContext('2d').drawImage(v, 0, 0); fin(c.toDataURL('image/jpeg', .86)); } catch (e) { fin(null); } }, { once: true });
    v.addEventListener('error', () => fin(null), { once: true });
    v.src = src;
  });
}
function imageData(src) {
  return new Promise((resolve, reject) => {
    const i = new Image();
    i.onload = () => { const c = document.createElement('canvas'); c.width = i.naturalWidth; c.height = i.naturalHeight; c.getContext('2d').drawImage(i, 0, 0); resolve({ url: c.toDataURL('image/png'), w: i.naturalWidth, h: i.naturalHeight }); };
    i.onerror = () => reject(new Error('Logo konnte nicht geladen werden'));
    i.src = src;
  });
}
async function buildPdf({ marks = false, approval = null, preview = false, quality = .9, maxScale = 2 } = {}) {
  if (!window.html2pdf) throw new Error('PDF-Bibliothek ist noch nicht geladen – bitte kurz warten.');
  const title = S.bp.titel || 'Blueprint';
  const stage = document.createElement('div');
  stage.className = 'pdf-stage';
  stage.innerHTML = `<div class="pdf-doc">${docHTML(approval, marks)}</div>`;
  document.body.appendChild(stage);
  try {
    for (const v of $$('video', stage)) {
      const u = await videoStill(v.getAttribute('src'));
      const box = document.createElement('div'); box.className = 'poster';
      box.innerHTML = u ? `<img src="${u}" alt=""><span class="play"></span>` : `<div class="pfile">Video: ${esc(v.dataset.name || '')}</div>`;
      v.closest('.thumb').replaceWith(box);
    }
    const imgs = $$('img', stage);
    await Promise.all(imgs.map((i) => i.complete ? null : new Promise((r) => { i.onload = i.onerror = r; })));
    const logo = await imageData(LOGO_DARK);
    const scale = Math.max(1, Math.min(maxScale, 28000 / Math.max(stage.scrollHeight, 1)));
    const M = { top: 28, bottom: 20, left: 14, right: 14 };
    const sx = window.scrollX, sy = window.scrollY;
    window.scrollTo(0, 0);
    let pdf;
    try {
      pdf = await html2pdf().set({
        margin: [M.top, M.left, M.bottom, M.right], image: { type: 'jpeg', quality },
        html2canvas: { scale, useCORS: true, backgroundColor: '#ffffff', logging: false, scrollX: 0, scrollY: 0 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait', compress: true },
        pagebreak: { mode: ['css'], avoid: ['.keep', '.r', '.pm', '.pit', '.b', 'li', 'p'] },
      }).from(stage.firstElementChild).toPdf().get('pdf');
    } finally { window.scrollTo(sx, sy); }
    const n = pdf.internal.getNumberOfPages(), W = pdf.internal.pageSize.getWidth(), H = pdf.internal.pageSize.getHeight();
    const lh = 11, lw = lh * logo.w / logo.h;
    for (let i = 1; i <= n; i++) {
      pdf.setPage(i);
      pdf.setFont('helvetica', 'bold'); pdf.setFontSize(15); pdf.setTextColor(10, 10, 10);
      pdf.text(title, M.left, 15, { maxWidth: W - M.left - M.right - lw - 8 });
      pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9); pdf.setTextColor(0, 101, 252);
      pdf.text('BLUEPRINT · PRODUKTIONSVORBEREITUNG', M.left, 20.5);
      pdf.addImage(logo.url, 'PNG', W - M.right - lw, 8, lw, lh);
      pdf.setDrawColor(220, 220, 220); pdf.line(M.left, 23.5, W - M.right, 23.5);
      pdf.line(M.left, H - 14, W - M.right, H - 14);
      pdf.setFontSize(8); pdf.setTextColor(110, 110, 110);
      pdf.text('Genius Studios · Im Dachsstück 8 · 65549 Limburg/Lahn · genius-studios.de', M.left, H - 9.5);
      pdf.setTextColor(30, 30, 30); pdf.setFontSize(9);
      pdf.text(`Seite | ${i}`, W - M.right, H - 9.5, { align: 'right' });
      pdf.setFontSize(8);
      if (preview) { pdf.setTextColor(150, 150, 150); pdf.text(`Vorschau – nicht freigegeben · ${date(now(), true)}`, M.left, H - 5.5); }
      else if (approval) { pdf.setTextColor(22, 128, 61); pdf.text(`Freigegeben von ${personName(approval.by)} am ${date(approval.at, true)} Uhr · Version ${approval.version}`, M.left, H - 5.5); }
    }
    pdf.setProperties({ title: title + ' – Blueprint', subject: 'Blueprint – Produktionsvorbereitung', author: 'Genius Studios' });
    return pdf.output('blob');
  } finally { stage.remove(); }
}
async function previewPdf() {
  if (S.bp.status === 'approved') { location.href = pdfUrl(S.cur, S.bp.approval.pdf, true); return; }
  const win = window.open('', '_blank');
  const b = busy('PDF-Vorschau wird erzeugt …');
  try {
    await flushAll();
    const blob = await buildPdf({ marks: S.marks, preview: true });
    const url = URL.createObjectURL(blob);
    if (win) win.location.href = url; else { const a = document.createElement('a'); a.href = url; a.download = 'Blueprint_Vorschau.pdf'; document.body.appendChild(a); a.click(); a.remove(); }
  } catch (e) { if (win) win.close(); toast('PDF konnte nicht erzeugt werden: ' + e.message, 'err'); }
  finally { b.done(); }
}

/* ============ Freigabe ============ */
async function approveDialog() {
  await askUser();
  await flushAll();
  if (Object.keys(S.conflicts).length) { toast('Bitte zuerst die markierten Konflikte auflösen.', 'err'); jumpTo(Object.keys(S.conflicts)[0]); return; }
  const missing = Object.keys(F).filter((f) => !liveFilled(f));
  const req = missing.filter((f) => F[f].required), opt = missing.filter((f) => !F[f].required);
  const body = document.createElement('div');
  body.style.cssText = 'display:flex;flex-direction:column;gap:12px';
  body.innerHTML = `<p>Das PDF wird erzeugt und auf dem Server abgelegt. Danach ist der Blueprint für alle gesperrt; die Freigabe lässt sich mit Begründung wieder aufheben.</p>
    ${req.length ? `<div class="notice warn"><b>Pflichtbereiche noch leer:</b><ul>${req.map((f) => `<li>${esc(F[f].label)}</li>`).join('')}</ul></div>` : '<div class="notice ok">Alle Pflichtbereiche sind befüllt.</div>'}
    ${opt.length ? `<div class="help" style="margin:0">Ebenfalls leer (optional): ${opt.map((f) => esc(F[f].label)).join(', ')}</div>` : ''}
    <div class="field"><span class="lt" style="font-size:14px;font-weight:500">Freigabe durch</span><div style="display:flex;align-items:center;gap:8px">${avatar(me.name)}<b>${esc(me.name)}</b></div></div>
    <div class="field"><label for="ap-note">Bemerkung <span class="help" style="margin:0">optional</span></label><textarea id="ap-note" maxlength="1000" rows="2" placeholder="z. B. Freigabe nach Abstimmung mit Kunde"></textarea></div>
    <label class="chk"><input type="checkbox" class="switch" id="ap-marks">Namens-Markierungen im PDF zeigen</label>
    ${req.length ? '<label class="chk"><input type="checkbox" class="switch" id="ap-force">Trotz leerer Pflichtbereiche freigeben</label>' : ''}`;
  modal({ title: 'Blueprint freigeben', body, actions: [{ label: 'Freigeben & PDF erzeugen', icon: 'send', cls: 'success', onClick: (m) => {
    if (req.length && !$('#ap-force', body).checked) { toast('Bitte Pflichtbereiche befüllen oder „Trotz leerer Pflichtbereiche freigeben“ einschalten.', 'err'); return false; }
    const note = $('#ap-note', body).value.trim(), marks = $('#ap-marks', body).checked;
    m.close(); approve(note, marks); return false;
  } }] });
}
async function approve(note, marks) {
  const b = busy('PDF wird erzeugt …');
  const id = S.cur;
  try {
    await flushAll();
    const approval = { version: (S.bp.approvals || []).length + 1, by: me.name, at: now(), note };
    const blob = await buildPdf({ marks, approval });
    b.set('PDF wird abgelegt …');
    const res = await postForm('approve', { id, user: me.name, color: me.color, note, pdf: new File([blob], 'blueprint.pdf', { type: 'application/pdf' }) });
    applyDoc(res.doc, true);
    b.done();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    toast('Freigegeben – PDF wurde abgelegt.');
    const a = document.createElement('a'); a.href = pdfUrl(id, res.doc.approval.pdf, true); document.body.appendChild(a); a.click(); a.remove();
  } catch (e) { b.done(); toast('Freigabe fehlgeschlagen: ' + e.message, 'err'); if (e.status === 423) poll(id, true); }
}
async function reopenDialog() {
  await askUser();
  const body = document.createElement('div');
  body.style.cssText = 'display:flex;flex-direction:column;gap:12px';
  body.innerHTML = `<p>Der Blueprint wird wieder zur Bearbeitung geöffnet. Das PDF von Version ${esc(S.bp.approval.version)} bleibt erhalten; bei erneuter Freigabe entsteht Version ${esc((S.bp.approvals || []).length + 1)}.</p>
    <div class="field"><label for="ro">Grund</label><input type="text" id="ro" maxlength="300" placeholder="z. B. Preise geändert"></div>
    ${CFG.reopenPin ? '<div class="field"><label for="ro-pin">PIN</label><input type="password" id="ro-pin" autocomplete="off"></div>' : ''}`;
  modal({ title: 'Freigabe aufheben', body, actions: [{ label: 'Freigabe aufheben', icon: 'unlock', cls: 'danger solid', onClick: async () => {
    const reason = $('#ro', body).value.trim();
    if (!reason) { $('#ro', body).focus(); toast('Bitte einen Grund angeben.', 'err'); return false; }
    try {
      const res = await api('reopen', { id: S.cur, user: me.name, color: me.color, reason, pin: CFG.reopenPin ? $('#ro-pin', body).value : '' });
      applyDoc(res.doc, true);
      toast('Freigabe aufgehoben – der Blueprint kann wieder bearbeitet werden.');
    } catch (e) { toast('Nicht möglich: ' + e.message, 'err'); return false; }
  } }] });
}

/* ============ Routing & Start ============ */
function route() {
  const m = location.hash.match(/^#bp-([a-z0-9-]+)$/);
  if (m) { if (S.cur !== m[1]) openBp(m[1]); }
  else {
    if (S.cur) { flushAll(); clearInterval(pollTimer); S.cur = null; S.bp = null; }
    hideToolbar(); renderBar(); renderIndex(); loadList();
  }
}
window.addEventListener('hashchange', route);
window.addEventListener('beforeunload', (e) => { if (S.dirty.size || Object.keys(S.inflight).length) { e.preventDefault(); e.returnValue = ''; } });
setInterval(() => { if (!S.cur && !document.hidden) loadList(); }, 15000);

renderBar();
route();
if (!me) askUser().then(() => { renderBar(); if (S.cur) renderEditor(); });
})();
