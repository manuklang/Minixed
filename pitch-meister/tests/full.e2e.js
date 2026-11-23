// End-to-End-Test aller Funktionen (Playwright). Aufruf: node tests/full.e2e.js "$(pwd)/index.html"
// Benötigt im Testordner: big.png, a.wav, imp.json und html2pdf.js (npm i html2pdf.js@0.10.1).
const { chromium } = require('playwright');
const fs = require('fs');
const H2P = require.resolve('html2pdf.js/dist/html2pdf.bundle.min.js');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1440, height: 950 }, acceptDownloads: true }); const pg = await ctx.newPage();
  const errs = [], results = [], downloads = [];
  pg.on('pageerror', e => errs.push('PAGEERR ' + e.message)); pg.on('console', m => { if (m.type() === 'error' && !/net::|ERR_/.test(m.text())) errs.push('CONSOLE ' + m.text()); });
  pg.on('download', async d => { const pth = __dirname + '/dl_' + d.suggestedFilename(); await d.saveAs(pth); downloads.push(d.suggestedFilename()); });
  await pg.route(/fonts\.(googleapis|gstatic)|img\.youtube/, r => r.abort());
  await pg.route(/html2pdf/, r => r.fulfill({ path: H2P, contentType: 'application/javascript' }));
  const ok = (name, cond, info = '') => results.push(`${cond ? 'OK  ' : 'FAIL'} ${name}${info ? ' — ' + info : ''}`);
  const ev = f => pg.evaluate(f);
  const confirm = async () => { await pg.click('.modal [data-m="1"]'); await pg.waitForTimeout(60); };
  const nav = async v => { await pg.click(`nav button[data-v=${v}]`); await pg.waitForTimeout(60); };
  const choose = async (sel, files) => { const [fc] = await Promise.all([pg.waitForEvent('filechooser'), pg.click(sel)]); await fc.setFiles(files); await pg.waitForTimeout(500); };
  try {
  await pg.goto('file://' + process.argv[2]);
  // login
  await pg.fill('input[name=name]', 'Anna Schmidt'); await pg.selectOption('select[name=role]', 'Produktion'); await pg.click('#loginForm button');
  ok('Login', await ev(() => !!me() && me().role === 'Produktion'));
  // projects
  await nav('projects'); const n0 = await ev(() => S.projects.length);
  await pg.click('[data-action=addProject]'); ok('Projekt anlegen', await ev(() => S.projects.length) === n0 + 1 && await ev(() => ui.view) === 'details');
  await pg.fill('[data-bind=title]', 'Testprojekt'); await pg.press('[data-bind=title]', 'Tab'); ok('Titel ändern', await ev(() => P().title) === 'Testprojekt');
  await nav('projects'); await pg.click('.pcard:has-text("Testprojekt") [data-action=dupProject]'); ok('Projekt duplizieren', await ev(() => S.projects.some(p => p.title === 'Testprojekt (Kopie)')));
  await pg.click('.pcard:has-text("Testprojekt (Kopie)") [data-action=delProject]'); await confirm(); ok('Projekt löschen', !(await ev(() => S.projects.some(p => p.title === 'Testprojekt (Kopie)'))));
  await choose('[data-action=importJSON]', ['imp.json']); ok('JSON importieren', await ev(() => S.projects.some(p => p.title === 'Import-Test')));
  await nav('projects'); await pg.click('[data-action=loadDemo]'); ok('Demo neu laden', await ev(() => P().dispo.days.length === 3 && P().scenes.length === 12));
  // details
  await nav('details'); await pg.click('[data-action=add][data-list=hosts]'); await pg.locator('[data-bind^="hosts."][data-bind$=".name"]').last().fill('Host X'); await pg.locator('[data-bind^="hosts."][data-bind$=".name"]').last().press('Tab');
  ok('Host hinzufügen', await ev(() => P().hosts.some(h => h.name === 'Host X')));
  await pg.fill('[data-addcat=categories]', 'interview'); await pg.press('[data-addcat=categories]', 'Enter'); ok('Kategorie hinzufügen', await ev(() => P().categories.includes('INTERVIEW')));
  await pg.click('[data-action=delCat][data-v=INTERVIEW]'); await confirm(); ok('Kategorie entfernen', !(await ev(() => P().categories.includes('INTERVIEW'))));
  const dur = pg.locator('[data-bind=duration]'); await dur.fill('30:00'); await dur.press('Enter'); await pg.waitForTimeout(50); ok('Showdauer m:ss', await ev(() => P().duration) === 1800);
  ok('History protokolliert', await ev(() => P().history.length > 2), await ev(() => P().history[0].msg));
  // set design
  await nav('set'); await choose('[data-path="setDesign.images"]', ['big.png']); ok('Set-Bild Upload', await ev(() => P().setDesign.images.length) >= 1);
  await pg.click('[data-action=add][data-list="setDesign.colors"]'); ok('Farbe hinzufügen', await ev(() => P().setDesign.colors.length) === 4);
  // offer
  await nav('offer'); await pg.click('[data-action=add][data-list="offer.items"]'); ok('Produkt hinzufügen', await ev(() => P().offer.items.length) === 7);
  await choose('.item-img >> nth=6', ['big.png']); ok('Produktbild', await ev(() => !!P().offer.items[6].image));
  await pg.click('[data-action=delItem] >> nth=6'); await confirm(); ok('Produkt löschen', await ev(() => P().offer.items.length) === 6);
  // sales points
  await nav('sp'); await pg.click('[data-action=add][data-list=salesPoints] >> nth=0'); await pg.locator('[data-bind^="salesPoints."][data-bind$=".text"]').last().fill('Neuer SP');
  ok('Sales-Point anlegen', await ev(() => P().salesPoints.some(s => s.text === 'Neuer SP')));
  // storyboard
  await nav('storyboard'); await pg.click('[data-action=addSegment]'); ok('Segment anlegen', await ev(() => P().segments.length) === 4);
  await pg.click('[data-action=moveSeg][data-d="-1"] >> nth=3'); ok('Segment verschieben', await ev(() => P().segments[2].name.startsWith('Segment')));
  await pg.click('[data-action=delSegment] >> nth=2'); await confirm(); ok('Segment löschen', await ev(() => P().segments.length) === 3);
  await pg.click('.addscene >> nth=0'); ok('Szene anlegen + öffnen', await ev(() => !!ui.sceneId));
  await pg.locator('[data-bind$=".name"]').first().fill('Testszene'); const sd = pg.locator('[data-type=dur]').first(); await sd.fill('1:15'); await sd.press('Enter');
  await pg.click('.checklist label >> nth=0'); await pg.click('.scene-grid .checklist >> nth=1 >> label >> nth=0');
  await pg.click('.toggle input[data-bind$=".recipeOn"]'); await pg.selectOption('select[data-bind$=".recipeCategory"]', 'DESSERT');
  await pg.click('[data-action=tab][data-v=ingr]'); await pg.fill('textarea[data-bind$=".ingredients"]', 'Zucker\nMehl');
  await pg.click('[data-action=tab][data-v=sp]'); await pg.locator('#sceneLower .checklist label').first().click();
  await pg.fill('#commentDraft', 'Kommentar 1'); await pg.click('[data-action=addComment]');
  const sc = await ev(() => P().scenes.find(s => s.name === 'Testszene'));
  console.log('SC', JSON.stringify(await ev(() => P().scenes.slice(-3).map(s=>s.name)))); ok('Szene bearbeiten', sc && sc.duration === 75 && sc.itemIds.length === 1 && sc.categories.length === 1 && sc.recipeOn && sc.recipeCategory === 'DESSERT' && sc.ingredients.includes('Mehl') && sc.salesPointIds.length === 1 && sc.comments.length === 1, JSON.stringify({ d: sc?.duration, i: sc?.itemIds.length, c: sc?.categories, sp: sc?.salesPointIds.length }));
  await choose('.media [data-action=upload]', ['big.png']); ok('Szenenbild', await ev(() => !!P().scenes.find(s => s.name === 'Testszene').media));
  await pg.click('[data-action=dupScene]'); ok('Szene duplizieren', await ev(() => P().scenes.some(s => s.name === 'Testszene (Kopie)')));
  await pg.click('[data-action=delScene]'); await confirm(); ok('Szene löschen', !(await ev(() => P().scenes.some(s => s.name === 'Testszene (Kopie)'))));
  await pg.click('.scard >> nth=0'); await pg.click('[data-action=openScene] >> text=Nächste'); ok('Szenen-Navigation', await ev(() => !!ui.sceneId));
  await pg.click('[data-action=closeScene]');
  const before = await ev(() => P().scenes.filter(s => s.segmentId === P().segments[0].id).length);
  await pg.dragAndDrop('.col >> nth=2 >> .scard >> nth=0', '.col >> nth=0 >> .scard >> nth=0');
  ok('Drag & Drop Szene', await ev(() => P().scenes.filter(s => s.segmentId === P().segments[0].id).length) === before + 1);
  // dispo
  await nav('dispo'); await pg.click('[data-action=add][data-kind="dispo.days"]'); ok('Dispo-Tag anlegen', await ev(() => P().dispo.days.length) === 4);
  await pg.click('[data-action=add][data-group=intern]'); const row = pg.locator('.teamtbl tbody tr').filter({ has: pg.locator('input[data-bind$=".name"][value=""]') }).first();
  await row.locator('input[data-bind$=".name"]').fill('Max Muster'); await row.locator('input[data-bind$=".position"]').fill('Kamera 3');
  await row.locator('input[data-bind$=".phone"]').fill('0170 1234567'); await row.locator('input[data-bind$=".email"]').fill('max@example.com'); await row.locator('input[data-bind$=".email"]').press('Tab');
  ok('Crew mit Telefon + E-Mail', await ev(() => P().dispo.team.some(m => m.name === 'Max Muster' && m.phone && m.email === 'max@example.com')));
  await ev(() => { P().dispo.team.filter(m => m.name).forEach((m, i) => m.email ||= `crew${i}@example.com`); save(true); render(); });
  const mr = pg.locator('.teamtbl tr:has(input[value="Max Muster"])'); await mr.locator('.daychip >> nth=0').click(); ok('Einsatztag umschalten', await ev(() => P().dispo.team.find(m => m.name === 'Max Muster').dayIds.length) === 3);
  await pg.locator('[data-action=add][data-kind=entries]').first().click(); const e = pg.locator('.entry').filter({ has: pg.locator('input[data-bind$=".time"][value=""]') }).first();
  await e.locator('input[data-bind$=".time"]').fill('07:15'); await e.locator('input[data-bind$=".time"]').press('Tab'); await e.locator('select').selectOption({ index: 3 });
  ok('Ablauf-Eintrag + Szene verknüpfen', await ev(() => P().dispo.days.some(d => d.entries.some(x => x.time === '07:15' && x.sceneId && x.todo.startsWith('Szene')))));
  await pg.locator('[data-action=sortDay]').first().click(); ok('Ablauf sortieren', await ev(() => sortedDays(P().dispo)[0].entries[0].time) === '07:15');
  await pg.locator('[data-action=add][data-kind=checklist]').first().click(); ok('Checkliste', await ev(() => sortedDays(P().dispo)[0].checklist.length) === 9);
  // mail sheet (team)
  await pg.click('.pagehead [data-action=mailDispo]'); await pg.waitForTimeout(100);
  const href = await pg.getAttribute('#mLink', 'href'); const body = await pg.inputValue('#mBody');
  ok('Mail an Team: mailto mit BCC', href.startsWith('mailto:?bcc=') && decodeURIComponent(href).includes('max@example.com'), href.slice(0, 90));
  ok('Mail-Text enthält Termine/Team/Ablauf', /TERMINE/.test(body) && /Max Muster/.test(body) && /ABLAUF/.test(body) && /0170 1234567/.test(body));
  await pg.uncheck('#mBcc'); ok('Mail ohne BCC', (await pg.getAttribute('#mLink', 'href')).startsWith('mailto:max%40') || (await pg.getAttribute('#mLink', 'href')).includes('mailto:') && !(await pg.getAttribute('#mLink', 'href')).includes('bcc='));
  await pg.click('.modal [data-m=pdf]'); await pg.waitForTimeout(6000); ok('PDF (Team) herunterladen', downloads.some(x => /^Dispo_.*\.pdf$/.test(x) && !/max/.test(x)), downloads.join(','));
  await pg.click('.modal [data-m=ics]'); await pg.waitForTimeout(300); ok('ICS aus Mail-Dialog', downloads.some(x => x.endsWith('.ics')));
  await pg.click('.modal [data-close]');
  // personal mail
  await mr.locator('[data-action=mailDispo]').click(); await pg.waitForTimeout(100);
  const ph = await pg.getAttribute('#mLink', 'href'); const pb = await pg.inputValue('#mBody');
  ok('Persönliches Briefing', ph.startsWith('mailto:max@example.com?') && /Hallo Max Muster/.test(pb) && /Deine Einsatztage/.test(pb), ph.slice(0, 60));
  await pg.click('.modal [data-m=pdf]'); await pg.waitForTimeout(6000); ok('PDF persönlich', downloads.some(x => /max-muster\.pdf$/.test(x)), downloads.join(','));
  await pg.click('.modal [data-close]');
  // calendar
  await pg.click('.pagehead [data-action=calDispo]'); await pg.waitForTimeout(100);
  const gl = await pg.locator('.calrow a:has-text("Google")').first().getAttribute('href'); const ol = await pg.locator('.calrow a:has-text("Outlook")').first().getAttribute('href');
  ok('Google-Kalender-Link', /calendar\.google\.com.*dates=2027021[5-9]T\d{6}%2F/.test(gl) && gl.includes('ctz=Europe%2FBerlin'), gl.slice(0, 120));
  ok('Outlook-Link', /outlook\.office\.com.*startdt=2027-02-1\dT\d\d%3A\d\d%3A00%2B01%3A00/.test(ol), ol.slice(0, 140));
  await pg.click('.modal [data-ics=all]'); await pg.waitForTimeout(300);
  const icsF = downloads.filter(x => x.endsWith('.ics')).pop(); const ics = fs.readFileSync(__dirname + '/dl_' + icsF, 'utf8');
  ok('ICS alle Tage', (ics.match(/BEGIN:VEVENT/g) || []).length === 4 && /DTSTART;TZID=Europe\/Berlin:20270215T/.test(ics) && ics.split('\r\n').every(l => Buffer.byteLength(l) <= 75), `${(ics.match(/BEGIN:VEVENT/g) || []).length} Events`);
  await pg.click('.modal [data-close]');
  await pg.click('.pagehead [data-action=pdfDispo]'); await pg.waitForTimeout(6000); ok('PDF-Button Kopfzeile', downloads.filter(x => x.endsWith('.pdf')).length >= 3);
  const pdfF = downloads.filter(x => x.endsWith('.pdf'))[0]; const pdfSize = fs.statSync(__dirname + '/dl_' + pdfF).size; ok('PDF gültig', fs.readFileSync(__dirname + '/dl_' + pdfF).slice(0, 5).toString() === '%PDF-' && pdfSize > 20000, pdfSize + ' Bytes');
  await choose('[data-path="dispo.parkingImage"]', ['big.png']); ok('Lageplan-Bild', await ev(() => !!P().dispo.parkingImage));
  await pg.locator('[data-action=delDay]').last().click(); await confirm(); ok('Dispo-Tag löschen', await ev(() => P().dispo.days.length) === 3);
  // moodboard
  await nav('mood'); await choose('[data-action=moodUpload]', ['big.png', 'a.wav']); ok('Moodboard Upload', await ev(() => P().moodboard.filter(x => x.source === 'upload' && x.file?.ref).length) === 2);
  await pg.fill('#moodUrl', 'https://youtu.be/dQw4w9WgXcQ'); await pg.press('#moodUrl', 'Enter'); ok('Moodboard Link', await ev(() => P().moodboard[0].provider === 'YouTube'));
  await choose('.mitem >> nth=0 >> [data-action=upload]', ['big.png']); ok('Eigenes Vorschaubild', await ev(() => !!P().moodboard[0].thumb));
  await pg.click('.filters button[data-v=audio]'); ok('Moodboard-Filter', await pg.locator('.mitem').count() === 1); await pg.click('.filters button[data-v=all]');
  await pg.locator('.mitem input[data-bind$=".tag"]').first().fill('Musik'); await pg.locator('.mitem input[data-bind$=".tag"]').first().press('Tab'); await pg.waitForTimeout(50);
  await pg.selectOption('select[data-action-change=moodTag]', 'Musik'); ok('Gruppen-Filter', await pg.locator('.mitem').count() === 1); await pg.selectOption('select[data-action-change=moodTag]', '');
  // other lists
  for (const [v, list] of [['anim', 'animations'], ['broll', 'brolls'], ['post', 'post'], ['notes', 'notes']]) { await nav(v); const c = await pg.evaluate(l => P()[l].length, list); await pg.click(`[data-action=add][data-list=${list}]`); ok(`${v}: hinzufügen`, await pg.evaluate(l => P()[l].length, list) === c + 1); }
  await nav('broll'); await pg.locator('input[type=checkbox][data-bind$=".done"]').first().check(); ok('B-Roll erledigt', await ev(() => P().brolls[0].done));
  // analysis
  await nav('analysis'); await pg.selectOption('select[data-action-change=segFilter]', { index: 1 }); ok('Analyse Segmentfilter', await ev(() => ui.segFilter !== 'all') && await pg.locator('.kpi').count() === 4);
  // export
  await nav('export');
  for (const l of ['dispo', 'storyboard', 'kitchen', 'stage', 'shopping', 'sp', 'lists', 'analysis']) { await pg.check(`input[value=${l}]`); await pg.waitForTimeout(40); const t = await pg.locator('.preview-print').innerText(); ok(`Export-Layout ${l}`, t.length > 100); }
  await pg.click('[data-action=csv]'); await pg.click('[data-action=exportJSON]'); await pg.click('[data-action=backupAll]'); await pg.waitForTimeout(800);
  ok('CSV/JSON/Backup Downloads', downloads.some(x => x.endsWith('.csv')) && downloads.filter(x => x.endsWith('.json')).length >= 2, downloads.filter(x => /csv|json/.test(x)).join(','));
  const bk = JSON.parse(fs.readFileSync(__dirname + '/dl_' + downloads.find(x => x.startsWith('pitchmeister-backup')), 'utf8')); ok('Backup enthält Medien', JSON.stringify(bk).includes('data:image/png;base64') && !JSON.stringify(bk).includes('"ref":'));
  // theme, persistence, logout
  const th0 = await ev(() => getComputedStyle(document.body).backgroundColor); await pg.click('[data-action=theme]'); await pg.waitForTimeout(100); ok('Theme umschalten', await ev(() => document.documentElement.dataset.theme) === 'dark' && await ev(() => getComputedStyle(document.body).backgroundColor) !== th0);
  await pg.reload(); await pg.waitForTimeout(500); ok('Nach Reload gespeichert', await ev(() => P().dispo.team.some(m => m.name === 'Max Muster')) && await ev(() => MEDIA.size) > 0);
  await pg.click('[data-action=logout]'); await confirm(); ok('Abmelden', await pg.locator('#loginForm').count() === 1);
  await pg.click('.userlist button'); ok('Wieder anmelden', await ev(() => !!me()));
  } catch (x) { results.push('CRASH ' + x.message.split('\n')[0]); }
  console.log(results.join('\n')); console.log('FAILS:', results.filter(r => r.startsWith('FAIL')).length, '\nERRORS:', errs.length ? errs.join('\n') : 'keine');
  await b.close();
})();
