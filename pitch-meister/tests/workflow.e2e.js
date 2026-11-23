// Test der Workflow-Funktionen (Bausteine, Hooks, Cutdowns, Shots on Goal, Claims, Zielgruppen). Aufruf: node tests/workflow.e2e.js "$(pwd)/index.html"
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 1440, height: 950 }, colorScheme: 'dark', acceptDownloads: true });
  const errs = [], R = [], dls = []; pg.on('pageerror', e => errs.push(e.message)); pg.on('console', m => m.type() === 'error' && !/net::|ERR_/.test(m.text()) && errs.push(m.text()));
  pg.on('download', d => dls.push(d.suggestedFilename()));
  const ok = (n, c, i = '') => R.push(`${c ? 'OK  ' : 'FAIL'} ${n}${i ? ' — ' + i : ''}`); const ev = f => pg.evaluate(f);
  const nav = async v => { await pg.click(`nav button[data-v=${v}]`); await pg.waitForTimeout(80); };
  try {
  await pg.goto('file://' + process.argv[2]); await pg.fill('input[name=name]', 'Anna'); await pg.click('#loginForm button');
  // 6 personas
  await nav('details'); ok('Personas im Demo', await pg.locator('[data-bind^="personas."][data-bind$=".name"]').count() === 3);
  await pg.click('[data-action=add][data-list=personas]'); await pg.locator('[data-bind^="personas."][data-bind$=".name"]').last().fill('Singles'); await pg.locator('[data-bind^="personas."][data-bind$=".name"]').last().press('Tab');
  ok('Persona anlegen', await ev(() => P().personas.some(x => x.name === 'Singles')));
  // 5 claims
  await nav('sp'); ok('Claim-Warnung sichtbar', await pg.locator('.warnbox').count() === 1);
  const sel0 = pg.locator('select[data-bind$=".claim"]').first(); await sel0.selectOption('ok'); await pg.waitForTimeout(50);
  ok('Claim-Status setzen', await ev(() => P().salesPoints[0].claim) === 'ok');
  await pg.locator('.pchip:has-text("Singles")').first().click(); ok('Persona an Sales-Point', await ev(() => P().salesPoints[0].personaIds.length) === 2);
  // 1 block + 4 hooks + 2 cutdowns
  await nav('storyboard'); ok('Dramaturgie-Check zeigt fehlenden Close', (await pg.locator('.warnbox').first().innerText()).includes('Close'));
  ok('Baustein-Chips auf Karten', await pg.locator('.scard .blk').count() >= 12);
  await pg.click('.scard >> nth=11'); await pg.selectOption('select[data-bind$=".block"]', 'close'); await pg.waitForTimeout(50);
  ok('Baustein setzen', await ev(() => P().scenes.find(s => s.id === ui.sceneId).block) === 'close');
  await pg.click('[data-action=tab][data-v=hooks]'); await pg.click('[data-action=add][data-kind=hooks]');
  await pg.locator('textarea[data-bind*=".hooks."]').last().fill('Nur heute: 2 zum Preis von 1'); await pg.locator('select[data-bind*=".hooks."][data-bind$=".type"]').last().selectOption('Dringlichkeit');
  ok('Hook-Variante anlegen', await ev(() => { const s = P().scenes.find(s => s.id === ui.sceneId); return s.hooks.length === 1 && s.hooks[0].type === 'Dringlichkeit' && s.hooks[0].text.includes('Preis'); }));
  await pg.click('[data-action=add][data-kind=cutdowns]'); await pg.locator('select[data-bind*=".cutdowns."][data-bind$=".ratio"]').last().selectOption('9:16');
  ok('Cutdown anlegen', await ev(() => P().scenes.find(s => s.id === ui.sceneId).cutdowns.length === 1));
  // cutdowns view
  await nav('cuts'); const n = await pg.locator('tbody tr').count(); ok('Cutdown-Übersicht', n === 7, n + ' Zeilen');
  await pg.click('[data-action=cutFilter][data-v="9:16"]'); ok('Filter 9:16', await pg.locator('tbody tr').count() === 4);
  await pg.locator('tbody select').first().selectOption('cut'); ok('Status in Übersicht ändern', await ev(() => allCuts(P()).some(c => c.status === 'cut')));
  await pg.click('[data-action=csvCuts]'); await pg.waitForTimeout(300); ok('Cutdown-CSV', dls.some(x => x.endsWith('-cutdowns.csv')));
  // 3 dispo shots on goal
  await nav('dispo'); const shots = await pg.locator('.shots li').allInnerTexts(); ok('Shots on Goal aus Storyboard', shots.some(t => /Hook-Variante/.test(t)) && shots.some(t => /Hochformat/.test(t)), shots.length + ' Hinweise');
  const c0 = await ev(() => sortedDays(P().dispo)[0].checklist.length); await pg.locator('[data-action=shotsStd]').first().click();
  ok('Standard-Varianten übernehmen', await ev(() => sortedDays(P().dispo)[0].checklist.length) === c0 + 7);
  await pg.click('.pagehead [data-action=mailDispo]'); ok('Shots im Briefing-Text', /Shots on Goal/.test(await pg.inputValue('#mBody'))); await pg.click('.modal [data-close]');
  // analysis
  await nav('analysis'); const h2 = await pg.locator('.card h2').allInnerTexts();
  ok('Analyse-Karten', ['Dramaturgie – Zeit pro Baustein', 'Hook-Varianten nach Typ', 'Claim-Freigabe', 'Zielgruppen-Abdeckung'].every(t => h2.includes(t)));
  ok('Persona „Singles“ abgedeckt', (await pg.locator('tr:has-text("Singles")').innerText()).includes('1'));
  // export
  await nav('export'); for (const l of ['cutdowns', 'claims', 'storyboard']) { await pg.check(`input[value=${l}]`); await pg.waitForTimeout(50); ok('Export ' + l, (await pg.locator('.preview-print').innerText()).length > 200); }
  ok('Storyboard-Export mit Baustein/Hooks', /Hook-Varianten/i.test(await pg.locator('.preview-print').innerText()));
  await pg.screenshot({ path: 'n-export.png' });
  await nav('storyboard'); await pg.screenshot({ path: 'n-sb.png' }); await pg.click('.scard >> nth=0'); await pg.click('[data-action=tab][data-v=hooks]'); await pg.evaluate(() => document.querySelector('#sceneLower').scrollIntoView()); await pg.screenshot({ path: 'n-scene.png' });
  await nav('sp'); await pg.screenshot({ path: 'n-sp.png' }); await nav('cuts'); await pg.screenshot({ path: 'n-cuts.png' });
  await nav('analysis'); await pg.evaluate(() => document.querySelectorAll('.grid.g2')[1].scrollIntoView()); await pg.screenshot({ path: 'n-an.png' });
  await pg.setViewportSize({ width: 390, height: 844 }); await nav('cuts'); ok('Mobil kein Überlauf', !(await ev(() => document.documentElement.scrollWidth > innerWidth)));
  } catch (x) { R.push('CRASH ' + x.message.split('\n')[0]); }
  console.log(R.join('\n')); console.log('ERR:', errs.length ? errs : 'keine'); await b.close();
})();
