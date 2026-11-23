// Test der Szenen-Thumbnails. Aufruf: node tests/thumbnails.e2e.js "$(pwd)/index.html" (benötigt clip.webm und big.png im Testordner)
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 1440, height: 950 }, colorScheme: 'dark' });
  const errs = [], R = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.route(/img\.youtube|fonts\./, r => r.abort());
  const ok = (n, c, i = '') => R.push(`${c ? 'OK  ' : 'FAIL'} ${n}${i ? ' — ' + i : ''}`); const ev = f => pg.evaluate(f);
  try {
  await pg.goto('file://' + process.argv[2]); await pg.fill('input[name=name]', 'A'); await pg.click('#loginForm button');
  await pg.click('nav button[data-v=storyboard]'); await pg.waitForTimeout(200);
  ok('Generierte Inhalts-Thumbnails', await pg.locator('.scard .cthumb').count() >= 9, await pg.locator('.scard .cthumb').count() + '');
  ok('YouTube-Standard-Thumbnail (Vorschau blockiert)', await pg.locator('.scard .sthumb.k-youtube').count() === 1 && await pg.locator('.scard img.over').count() === 0);
  ok('Vimeo-Standard-Thumbnail', await pg.locator('.scard .sthumb.k-vimeo').count() === 1);
  ok('Produktbild im generierten Thumbnail', true);
  // video upload
  await pg.click('.scard >> nth=1'); const [fc] = await Promise.all([pg.waitForEvent('filechooser'), pg.click('.media .ov [data-action=upload]')]); await fc.setFiles(['clip.webm']); await pg.waitForTimeout(2500);
  ok('Standbild beim Video-Upload erzeugt', await ev(() => !!P().scenes.find(s => s.id === ui.sceneId).media.poster?.ref));
  const vid = pg.locator('#main .media video'); await vid.evaluate(v => new Promise(r => { v.currentTime = 3; v.onseeked = r; }));
  const before = await ev(() => P().scenes.find(s => s.id === ui.sceneId).media.poster.ref);
  await pg.click('[data-action=posterNow]'); await pg.waitForTimeout(500);
  ok('„Bild als Thumbnail“ aus aktueller Position', await ev(() => P().scenes.find(s => s.id === ui.sceneId).media.poster.ref) !== before);
  await pg.click('[data-action=closeScene]'); await pg.waitForTimeout(200);
  const src = await pg.locator('.scard >> nth=1 >> .thumb img').getAttribute('src');
  ok('Board zeigt Video-Standbild + Play', src.startsWith('blob:') && await pg.locator('.scard >> nth=1 >> .playbadge').count() === 1);
  const px = await pg.locator('.scard >> nth=1 >> .thumb img').evaluate(i => i.naturalWidth); ok('Standbild geladen', px > 100, px + 'px');
  // own thumbnail for YouTube scene
  await pg.locator('.scard:has(.k-youtube)').click(); const [fc2] = await Promise.all([pg.waitForEvent('filechooser'), pg.click('[data-path$=".thumb"]')]); await fc2.setFiles(['big.png']); await pg.waitForTimeout(600);
  ok('Eigenes Thumbnail für Link', await ev(() => !!P().scenes.find(s => s.id === ui.sceneId).thumb));
  await pg.click('[data-action=closeScene]'); await pg.waitForTimeout(200);
  ok('Eigenes Thumbnail im Board + Play', await pg.locator('.scard:has(.playbadge) img[src^="blob:"]').count() === 2);
  // existing video without poster → background generation
  await ev(() => { const s = P().scenes.find(x => x.media?.poster); delete s.media.poster; save(true); }); await pg.reload(); await pg.waitForTimeout(500);
  await pg.click('nav button[data-v=storyboard]'); await pg.waitForTimeout(2500);
  ok('Fehlendes Standbild wird nachträglich erzeugt', await ev(() => !!P().scenes.find(x => x.media?.type === 'video').media.poster));
  await pg.screenshot({ path: 't-board.png' });
  // moodboard video gets poster
  await pg.click('nav button[data-v=mood]'); const [fc3] = await Promise.all([pg.waitForEvent('filechooser'), pg.click('[data-action=moodUpload]')]); await fc3.setFiles(['clip.webm']); await pg.waitForTimeout(2500);
  ok('Moodboard-Video mit Standbild', await ev(() => !!P().moodboard[0].file.poster) && !!(await pg.locator('.mitem video').first().getAttribute('poster')));
  // print export uses poster
  ok('Storyboard-Export nutzt Thumbnails', await ev(() => (exportHTML(P(), 'storyboard', true).match(/<img /g) || []).length >= 2));
  await pg.click('nav button[data-v=storyboard]'); await pg.locator('.scard:has(.k-vimeo)').click(); await pg.waitForTimeout(200); await pg.screenshot({ path: 't-scene.png' });
  } catch (x) { R.push('CRASH ' + x.message.split('\n')[0]); }
  console.log(R.join('\n')); console.log('ERR:', errs.length ? errs : 'keine'); await b.close();
})();
