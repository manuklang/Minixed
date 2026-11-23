/* Blueprint – Editor
   Rendert das Master-Template als bearbeitbares Blatt. Jeder Bereich wird beim
   Speichern mit Name, Datum und Farbe der bearbeitenden Person markiert. */
(function () {
	'use strict';

	const S = window.BP_SCHEMA;
	const F = S.fields;
	const { esc } = BP;
	const COMPOSITE = { media: 1, offers: 1, mediaList: 1 };
	const $ = (sel, root = document) => root.querySelector(sel);
	const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

	let doc = window.BP_DOC;
	BP.setUsers(window.BP_USERS);
	let me = BP.getUser();

	const sheet = $('#sheet');
	const st = {
		dirty: new Set(),     // lokal geändert, noch nicht gespeichert
		timers: {},
		inflight: {},
		again: {},
		force: {},
		ver: {},              // Änderungszähler je Feld
		local: {},            // Arbeitskopie für Listen-Felder
		conflicts: {},
	};

	const editable = () => doc.status !== 'approved';
	const clone = (x) => JSON.parse(JSON.stringify(x));
	const rid = () => Math.random().toString(36).slice(2, 12);

	function defaultValue(id) {
		const t = F[id].type;
		if (t in COMPOSITE) return [];
		if (t === 'check') return { checked: false, text: '' };
		return '';
	}
	const meta = (id) => doc.fields[id] || null;
	const value = (id) => (doc.fields[id] ? doc.fields[id].value : defaultValue(id));

	/* =========================================================
	   Autoren-Markierung
	   ========================================================= */
	function whoStyle(by) {
		if (!by) return '';
		const c = BP.colorOf(by);
		return ` style="--who:${c};--who-bg:${BP.tint(c, 0.07)}"`;
	}
	function whoTag(by, at) {
		if (!by) return '';
		return `<div class="who-tag" title="Zuletzt bearbeitet von ${esc(by)} am ${esc(BP.date(at, true))}">${esc(by)} <span>· ${esc(BP.date(at, true))}</span></div>`;
	}
	function applyWho(el, by, at) {
		if (!el) return;
		let tag = Array.from(el.children).find((c) => c.classList.contains('who-tag'));
		if (!by) { el.classList.remove('has-who'); if (tag) tag.remove(); return; }
		const c = BP.colorOf(by);
		el.classList.add('has-who');
		el.style.setProperty('--who', c);
		el.style.setProperty('--who-bg', BP.tint(c, 0.07));
		const html = whoTag(by, at);
		if (tag) tag.outerHTML = html; else el.insertAdjacentHTML('afterbegin', html);
	}

	/* =========================================================
	   Rendering
	   ========================================================= */
	const fileUrl = (m, download) => `file.php?id=${encodeURIComponent(doc.id)}&f=${encodeURIComponent(m.file)}${download ? '&download=1' : ''}`;
	const isImage = (m) => /^image\/(png|jpe?g|gif|webp|avif|bmp)$/i.test(m.mime || '');
	const isVideo = (m) => /^video\//i.test(m.mime || '');

	function linkify(text) {
		return esc(text).replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
	}

	function mediaItemHTML(m, mode) {
		let inner;
		if (isImage(m)) inner = `<a class="thumb" href="${fileUrl(m)}" target="_blank" rel="noopener"><img src="${fileUrl(m)}" alt="${esc(m.caption || m.name)}" loading="lazy"></a>`;
		else if (isVideo(m)) inner = `<div class="thumb"><video src="${fileUrl(m)}#t=0.5" controls preload="metadata" data-name="${esc(m.name)}"></video></div>`;
		else {
			const ext = (m.name.split('.').pop() || 'Datei').slice(0, 5);
			inner = `<a class="file" href="${fileUrl(m, true)}"><span class="ext">${esc(ext)}</span><span>${esc(m.name)}</span></a>`;
		}
		const cap = mode === 'edit'
			? `<input class="in cap" data-k="caption" value="${esc(m.caption || '')}" placeholder="Bildunterschrift / Hinweis (optional)">`
			: (m.caption ? `<div class="cap">${esc(m.caption)}</div>` : '');
		const rm = mode === 'edit' ? `<button type="button" class="rm" data-act="rm-media" aria-label="${esc(m.name)} entfernen" title="Entfernen">×</button>` : '';
		return `<div class="media-item${m.by ? ' has-who' : ''}" data-mid="${esc(m.id)}"${whoStyle(m.by)}>${whoTag(m.by, m.at)}${rm}${inner}${cap}</div>`;
	}

	function mediaBlockHTML(list, mode, target, opts = {}) {
		const grid = `<div class="media-grid${opts.compact ? ' compact' : ''}" data-grid="${esc(target)}">${list.map((m) => mediaItemHTML(m, mode)).join('')}</div>`;
		if (mode !== 'edit') return list.length ? grid : (opts.emptyView ?? '<div class="val"></div>');
		return grid + `
			<label class="drop" data-drop="${esc(target)}">
				<input type="file" multiple ${opts.accept ? `accept="${esc(opts.accept)}"` : ''}>
				<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 11V3m0 0L5 6m3-3 3 3M3 13h10" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
				<span>${esc(opts.dropText || 'Dateien hierher ziehen oder klicken')}</span>
			</label>
			<div class="uploads" data-uploads="${esc(target)}"></div>`;
	}

	function rtHTML(html, mode, key, placeholder) {
		if (mode === 'edit') return `<div class="rt" contenteditable="true" data-k="${key}" data-placeholder="${esc(placeholder || '')}" role="textbox" aria-multiline="true">${html || ''}</div>`;
		return `<div class="val">${html || ''}</div>`;
	}

	function innerHTML(id, mode) {
		const def = F[id];
		const v = value(id);
		switch (def.type) {
			case 'text':
			case 'date':
				if (mode === 'edit') return `<input class="in" data-k="v" type="${def.type === 'date' ? 'date' : 'text'}" value="${esc(v)}" placeholder="${esc(def.placeholder || '')}" aria-label="${esc(def.label)}">`;
				return `<div class="val">${def.link ? linkify(v) : esc(v)}</div>`;
			case 'richtext':
				return rtHTML(v, mode, 'v', def.placeholder);
			case 'check':
				if (mode === 'edit') return `<label class="check-field"><input type="checkbox" data-k="checked" ${v.checked ? 'checked' : ''} aria-label="${esc(def.label)} erledigt"><input class="in" data-k="text" value="${esc(v.text || '')}" placeholder="${esc(def.placeholder || '')}"></label>`;
				return `<div class="check-field"><span class="box">${v.checked ? '☑' : '☐'}</span><span class="val">${esc(v.text || '')}</span></div>`;
			case 'media':
				return mediaBlockHTML(v, mode, id, { accept: def.accept, compact: def.compact });
			case 'mediaList':
				return mediaListHTML(id, v, mode);
		}
		return '';
	}

	function fieldHTML(id, mode, extraClass = '') {
		const m = meta(id);
		const by = m && m.by;
		return `<div class="fld ${extraClass}${by ? ' has-who' : ''}" data-field="${id}"${whoStyle(by)}>${whoTag(by, m && m.at)}${innerHTML(id, mode)}</div>`;
	}

	function mediaListHTML(id, list, mode) {
		const def = F[id];
		const items = list.map((it, i) => `
			<div class="item ml-item${it.by ? ' has-who' : ''}" data-iid="${esc(it.id)}"${whoStyle(it.by)}>
				${whoTag(it.by, it.at)}
				${mode === 'edit' ? itemTools(i, list.length) : ''}
				<div class="ml-title"><span class="no">${i + 1}.</span>${mode === 'edit'
					? `<input class="in" data-k="title" value="${esc(it.title)}" placeholder="${esc(def.itemPlaceholder || 'Titel')}">`
					: `<span class="val">${esc(it.title)}</span>`}</div>
				${mode === 'edit' || (it.note && it.note.trim()) ? rtHTML(it.note, mode, 'note', 'Notiz (optional) – Länge, Einsatz, Hinweise …') : ''}
				${mediaBlockHTML(it.media || [], mode, id + '/' + it.id, { accept: 'image/*,video/*,application/pdf', emptyView: '' })}
			</div>`).join('');
		const add = mode === 'edit' ? `<button type="button" class="btn small" data-act="add-item">+ ${esc(def.itemLabel)} hinzufügen</button>` : '';
		return (items || (mode === 'edit' ? '' : '<div class="val"></div>')) + (add ? `<div style="margin-top:6px">${add}</div>` : '');
	}

	function itemTools(i, n) {
		return `<div class="item-tools">
			<button type="button" data-act="up" title="Nach oben" aria-label="Nach oben" ${i === 0 ? 'disabled' : ''}>↑</button>
			<button type="button" data-act="down" title="Nach unten" aria-label="Nach unten" ${i === n - 1 ? 'disabled' : ''}>↓</button>
			<button type="button" class="del" data-act="del-item" title="Eintrag löschen" aria-label="Eintrag löschen">✕</button>
		</div>`;
	}

	/* Preise */
	function parsePrice(s) {
		if (!s) return NaN;
		let t = String(s).replace(/[^\d,.-]/g, '');
		if (t.includes(',')) t = t.replace(/\./g, '').replace(',', '.');
		return parseFloat(t);
	}
	function fmtPrice(n) {
		return new Intl.NumberFormat('de-DE', { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 }).format(n) + ' €';
	}
	function savingText(o) {
		const a = parsePrice(o.uvp), b = parsePrice(o.preis);
		if (isNaN(a) || isNaN(b)) return '';
		return fmtPrice(Math.round((a - b) * 100) / 100);
	}

	function offersHTML(id, mode) {
		const def = F[id];
		const list = value(id);
		const m = meta(id);
		const rows = list.map((o, i) => `
			<div class="offer item${o.by ? ' has-who' : ''}" data-iid="${esc(o.id)}"${whoStyle(o.by)}>
				<div class="cell">
					${i === 0 ? `<div class="lab plain lab-first">${esc(def.label)}:</div>` : ''}
					${mediaBlockHTML(o.media || [], mode, id + '/' + o.id, { accept: 'image/*', compact: true, dropText: 'Orderscreen hochladen', emptyView: '' })}
				</div>
				<div class="cell">
					${whoTag(o.by, o.at)}
					${mode === 'edit' ? itemTools(i, list.length) : ''}
					<div class="num-title">${i + 1}.&nbsp;&nbsp;${esc(def.itemLabel)}:</div>
					<div style="display:flex;gap:4px;align-items:flex-start"><b style="padding-top:3px">Set:</b><div style="flex:1">${rtHTML(o.set, mode, 'set', 'z. B. 1 x Platinum Lift Gesichtscreme 50ml')}</div></div>
					<div class="price-grid">
						<span>UVP:</span>${mode === 'edit' ? `<input class="in" data-k="uvp" value="${esc(o.uvp)}" placeholder="129,95 €" inputmode="decimal">` : `<span>${esc(o.uvp)}</span>`}
						<span>Preis:</span>${mode === 'edit' ? `<input class="in" data-k="preis" value="${esc(o.preis)}" placeholder="69,95 €" inputmode="decimal">` : `<span>${esc(o.preis)}</span>`}
						<span>Ersparnis:</span><span class="save" data-saving>${esc(savingText(o))}</span>
					</div>
				</div>
			</div>`).join('');
		const empty = !list.length ? `<div class="row"><div class="cell"><div class="lab plain">${esc(def.label)}:</div></div><div class="cell">${mode === 'edit' ? '<span class="muted">Noch keine Angebote angelegt.</span>' : '<div class="val"></div>'}</div></div>` : '';
		const add = mode === 'edit' ? `<div class="add-row"><button type="button" class="btn small" data-act="add-item">+ Angebot hinzufügen</button></div>` : '';
		return `<div class="fld fld-offers${m && m.by ? '' : ''}" data-field="${id}">${empty}${rows}${add}</div>`;
	}

	function labelHTML(id, cls = '') {
		const def = F[id];
		return `<div class="lab ${cls}">${esc(def.label)}${cls.includes('colon') ? ':' : ''}${def.hint ? `<small>${esc(def.hint)}</small>` : ''}</div>`;
	}

	function rowHTML(r, mode) {
		switch (r.type) {
			case 'pair':
				return `<div class="row"><div class="cell">${labelHTML(r.left, 'plain colon')}${fieldHTML(r.left, mode)}</div><div class="cell">${labelHTML(r.right, 'colon')}${fieldHTML(r.right, mode)}</div></div>`;
			case 'split':
				return `<div class="row"><div class="cell">${labelHTML(r.field)}</div><div class="cell">${fieldHTML(r.field, mode)}</div></div>`;
			case 'full':
				return `<div class="row full"><div class="cell">${fieldHTML(r.field, mode)}</div></div>`;
			case 'block':
				return `<div class="row full"><div class="cell"><div class="block-head">${esc(F[r.field].label.toUpperCase())}:</div>${fieldHTML(r.field, mode)}</div></div>`;
			case 'offers':
				return `<div class="row full" style="display:block"><div>${offersHTML(r.field, mode)}</div></div>`;
		}
		return '';
	}

	function signoffHTML(approval) {
		const people = Object.entries(doc.contributors || {});
		return `
			<div class="tbl gap signoff avoid-break">
				<div class="bar">Freigabe</div>
				<div class="row"><div class="cell"><div class="lab">Freigegeben von</div></div><div class="cell">${esc(approval.by)}</div></div>
				<div class="row"><div class="cell"><div class="lab">Datum</div></div><div class="cell">${esc(BP.date(approval.at, true))} Uhr · Version ${esc(approval.version)}</div></div>
				${approval.note ? `<div class="row"><div class="cell"><div class="lab">Bemerkung</div></div><div class="cell">${esc(approval.note)}</div></div>` : ''}
				<div class="row"><div class="cell"><div class="lab">Beteiligte</div></div><div class="cell">${people.map(([n, c]) =>
					`<div style="display:flex;align-items:center;gap:6px"><span style="width:9px;height:9px;border-radius:50%;background:${BP.colorOf(n)};display:inline-block"></span>${esc(n)} <span class="muted">– zuletzt ${esc(BP.date(c.last))}</span></div>`).join('')}</div></div>
			</div>`;
	}

	/** Komplettes Blatt. mode: 'edit' | 'view'. Wird auch für die PDF genutzt. */
	function sheetHTML(mode, opts = {}) {
		const out = [];
		out.push(`<div class="sheet-head"><div class="title">${fieldHTML('titel', mode)}</div><img src="assets/genius-logo.png" alt="Genius"></div>`);
		out.push(`<div class="tbl">
			<div class="row meta wide">
				<div class="cell inline-label"><span>Autor:</span>${fieldHTML('autor', mode)}</div>
				<div class="cell inline-label"><span>Stand:</span><span class="val" data-stand>${esc(BP.date(doc.updatedAt))}</span></div>
			</div>
			<div class="row meta">
				<div class="cell inline-label meta"><span><i>Artikel:</i></span>${fieldHTML('artikel', mode)}</div>
				<div class="cell inline-label meta"><span><i>Art.-Nr.:</i></span>${fieldHTML('artnr', mode)}</div>
			</div>
		</div>`);
		let open = false;
		for (const sec of S.sections) {
			if (sec.bar || !open) {
				if (open) out.push('</div>');
				out.push(`<div class="tbl${sec.bar ? ' gap' : ''}" data-section="${sec.id}">`);
				if (sec.bar) out.push(`<div class="bar">${esc(sec.bar)}</div>`);
				open = true;
			}
			for (const r of sec.rows) out.push(rowHTML(r, mode));
		}
		if (open) out.push('</div>');
		const approval = opts.approval || (doc.status === 'approved' ? doc.approval : null);
		if (approval) out.push(signoffHTML(approval));
		return out.join('');
	}
	window.BPView = { sheetHTML, isVideo, fileUrl, doc: () => doc };

	/* =========================================================
	   Kopfzeile, Legende, Banner
	   ========================================================= */
	function paintUser() {
		const chip = $('#user-chip');
		chip.innerHTML = me ? `${BP.avatar(me.name)}<span>${esc(me.name)}</span>` : '<span style="padding-left:8px">Name festlegen</span>';
	}

	function paintHeader() {
		const t = value('titel') || 'Blueprint';
		$('#doc-title').textContent = t;
		document.title = t + ' · Blueprint';
		$('#status-pill').innerHTML = doc.status === 'approved'
			? `<span class="pill approved">Freigegeben v${esc(doc.approval.version)}</span>`
			: '<span class="pill draft">In Bearbeitung</span>';
		const stand = $('[data-stand]', sheet);
		if (stand) stand.textContent = BP.date(doc.updatedAt);
		$('#btn-approve').hidden = !editable();
		$('#btn-preview').textContent = editable() ? 'PDF-Vorschau' : 'PDF öffnen';
	}

	function paintLegend() {
		const people = Object.entries(doc.contributors || {}).sort((a, b) => (b[1].last || '').localeCompare(a[1].last || ''));
		$('#legend').innerHTML = people.length
			? '<span>Beteiligt:</span>' + people.map(([n, c]) => `<span class="who-chip" style="--c:${BP.colorOf(n)}" title="${esc(c.edits)} Änderungen, zuletzt ${esc(BP.date(c.last, true))}"><i></i>${esc(n)}</span>`).join('')
			: '';
	}

	function paintBanner() {
		const b = $('#banner');
		if (doc.status === 'approved') {
			const a = doc.approval;
			b.innerHTML = `<div class="banner" role="status">
				<div class="grow">✓ <b>Freigegeben</b> von <b>${esc(a.by)}</b> am ${esc(BP.date(a.at, true))} Uhr (Version ${esc(a.version)}). Eingaben sind gesperrt.${a.note ? `<br><span>Bemerkung: ${esc(a.note)}</span>` : ''}</div>
				<a class="btn small" href="file.php?id=${encodeURIComponent(doc.id)}&pdf=${encodeURIComponent(a.pdf)}" target="_blank" rel="noopener">PDF öffnen</a>
				<a class="btn small" href="file.php?id=${encodeURIComponent(doc.id)}&pdf=${encodeURIComponent(a.pdf)}&download=1">Herunterladen</a>
				<button type="button" class="btn small danger" id="btn-reopen">Freigabe aufheben</button>
			</div>`;
			$('#btn-reopen').addEventListener('click', reopenDialog);
		} else b.innerHTML = '';
	}

	function renderAll() {
		const mode = editable() ? 'edit' : 'view';
		hideToolbar();
		st.local = {};
		for (const id in F) if (F[id].type in COMPOSITE) st.local[id] = clone(value(id));
		sheet.innerHTML = sheetHTML(mode);
		sheet.classList.toggle('locked', mode === 'view');
		paintHeader();
		paintLegend();
		paintBanner();
	}

	function rerenderField(id) {
		const el = $(`.fld[data-field="${id}"]`, sheet);
		if (!el) return;
		const mode = editable() ? 'edit' : 'view';
		if (F[id].type in COMPOSITE) st.local[id] = clone(value(id));
		const html = F[id].type === 'offers' ? offersHTML(id, mode) : fieldHTML(id, mode);
		const tmp = document.createElement('div');
		tmp.innerHTML = html;
		const fresh = tmp.firstElementChild;
		el.replaceWith(fresh);
		return fresh;
	}

	/* Markierungen nach dem Speichern aktualisieren, ohne den Fokus zu verlieren */
	function refreshTags(id) {
		const el = $(`.fld[data-field="${id}"]`, sheet);
		if (!el) return;
		const m = meta(id);
		if (F[id].type !== 'offers') applyWho(el, m && m.by, m && m.at);
		if (!(F[id].type in COMPOSITE)) return;
		const server = value(id);
		const stampMedia = (list, root) => list.forEach((md) => {
			const mel = $(`[data-mid="${md.id}"]`, root);
			if (mel) applyWho(mel, md.by, md.at);
		});
		if (F[id].type === 'media') stampMedia(server, el);
		else server.forEach((it) => {
			const iel = $(`[data-iid="${it.id}"]`, el);
			if (!iel) return;
			applyWho(F[id].type === 'offers' ? iel.children[1] : iel, it.by, it.at);
			if (F[id].type === 'offers') { iel.classList.toggle('has-who', !!it.by); iel.style.setProperty('--who', BP.colorOf(it.by)); iel.style.setProperty('--who-bg', BP.tint(BP.colorOf(it.by), 0.07)); }
			stampMedia(it.media || [], iel);
		});
	}

	/* =========================================================
	   Speichern
	   ========================================================= */
	function setSaveState(kind, msg) {
		const el = $('#save-state');
		el.classList.toggle('err', kind === 'error' || kind === 'conflict');
		el.textContent = {
			saving: 'Speichert …',
			saved: 'Gespeichert ✓',
			error: 'Nicht gespeichert',
			conflict: 'Konflikt – bitte prüfen',
			dirty: 'Ungespeicherte Änderungen',
		}[kind] || '';
		if (msg) el.title = msg;
	}

	async function ensureMe() {
		if (me) return me;
		me = await BP.askUser();
		paintUser();
		return me;
	}

	function readValue(id) {
		const t = F[id].type;
		if (t in COMPOSITE) return st.local[id];
		const el = $(`.fld[data-field="${id}"]`, sheet);
		if (!el) return value(id);
		if (t === 'richtext') return $('.rt[data-k="v"]', el).innerHTML;
		if (t === 'check') return { checked: $('[data-k="checked"]', el).checked, text: $('[data-k="text"]', el).value };
		return $('[data-k="v"]', el).value;
	}

	function touch(id, delay = 900) {
		st.dirty.add(id);
		st.ver[id] = (st.ver[id] || 0) + 1;
		setSaveState('dirty');
		clearTimeout(st.timers[id]);
		st.timers[id] = setTimeout(() => save(id), delay);
		if (id === 'titel') { $('#doc-title').textContent = readValue('titel') || 'Blueprint'; }
	}

	function save(id) {
		clearTimeout(st.timers[id]);
		if (st.inflight[id]) { st.again[id] = true; return st.inflight[id]; }
		if (!st.dirty.has(id) || !editable()) return Promise.resolve();
		const run = (async () => {
			const user = await ensureMe();
			const val = readValue(id);
			const ver = st.ver[id];
			setSaveState('saving');
			try {
				const res = await BP.api('save', {
					id: doc.id, field: id, value: val,
					base: meta(id) ? meta(id).at : null,
					user: user.name, color: user.color, force: !!st.force[id],
				});
				delete st.force[id];
				if (res.field) doc.fields[id] = res.field;
				if (res.changed) {
					doc.updatedAt = res.updatedAt;
					doc.updatedBy = user.name;
					const c = doc.contributors[user.name] || { first: res.updatedAt, edits: 0 };
					c.last = res.updatedAt; c.edits++;
					doc.contributors[user.name] = c;
				}
				if (res.progress) doc.progress = res.progress;
				if (st.ver[id] === ver) st.dirty.delete(id);
				// Stempel der Server-Antwort in die lokale Arbeitskopie übernehmen
				if (F[id].type in COMPOSITE && res.field) mergeStamps(st.local[id], res.field.value);
				refreshTags(id);
				clearConflict(id);
				paintHeader();
				paintLegend();
				setSaveState(st.dirty.size ? 'dirty' : 'saved');
			} catch (err) {
				if (err.status === 409 && err.payload && err.payload.field) {
					showConflict(id, err.payload.field);
					setSaveState('conflict');
				} else if (err.status === 423) {
					BP.toast('Dieser Blueprint wurde inzwischen freigegeben – Eingaben sind gesperrt.', 'err');
					st.dirty.clear();
					await poll(true);
				} else {
					setSaveState('error', err.message);
					BP.toast('Speichern fehlgeschlagen: ' + err.message, 'err');
				}
			} finally {
				delete st.inflight[id];
				if (st.again[id]) { delete st.again[id]; st.timers[id] = setTimeout(() => save(id), 50); }
			}
		})();
		st.inflight[id] = run;
		return run;
	}

	function mergeStamps(local, server) {
		if (!Array.isArray(local) || !Array.isArray(server)) return;
		const byId = Object.fromEntries(server.map((x) => [x.id, x]));
		for (const it of local) {
			const s = byId[it.id];
			if (!s) continue;
			it.by = s.by; it.at = s.at;
			if (Array.isArray(it.media) && Array.isArray(s.media)) mergeStamps(it.media, s.media);
		}
	}

	async function flushAll() {
		const ids = Array.from(new Set([...st.dirty, ...Object.keys(st.inflight)]));
		await Promise.all(ids.map((id) => save(id)));
		await Promise.all(Object.values(st.inflight));
		if (st.dirty.size) await Promise.all(Array.from(st.dirty).map((id) => save(id)));
	}

	/* Konflikte: jemand anderes hat denselben Bereich gleichzeitig geändert */
	function showConflict(id, remote) {
		st.conflicts[id] = remote;
		const el = $(`.fld[data-field="${id}"]`, sheet);
		if (!el) return;
		let box = $(':scope > .conflict', el);
		if (!box) { box = document.createElement('div'); box.className = 'conflict'; el.prepend(box); }
		box.innerHTML = `<span class="grow">⚠ <b>${esc(remote.by)}</b> hat diesen Bereich um ${esc(BP.date(remote.at, true))} geändert.</span>
			<button type="button" class="btn small" data-act="take-theirs">Version von ${esc(remote.by)} laden</button>
			<button type="button" class="btn small" data-act="keep-mine">Meine Version speichern</button>`;
	}
	function clearConflict(id) {
		delete st.conflicts[id];
		const el = $(`.fld[data-field="${id}"] > .conflict`, sheet);
		if (el) el.remove();
	}

	/* =========================================================
	   Abgleich mit anderen Personen (alle 8 Sekunden)
	   ========================================================= */
	let polling = false;
	async function poll(forceAll) {
		if (polling || (document.hidden && !forceAll)) return;
		polling = true;
		try {
			const res = await BP.api('get', null, { query: { id: doc.id, since: forceAll ? -1 : doc.rev } });
			if (!res.changed) return;
			BP.setUsers(res.users);
			const nd = res.doc;
			const statusChanged = nd.status !== doc.status;
			const changed = Object.keys(F).filter((id) => JSON.stringify(nd.fields[id] || null) !== JSON.stringify(doc.fields[id] || null));
			const busy = (id) => {
				const el = $(`.fld[data-field="${id}"]`, sheet);
				return st.dirty.has(id) || st.inflight[id] || (el && el.contains(document.activeElement));
			};
			const busyChanged = statusChanged ? [] : changed.filter(busy);
			for (const id of busyChanged) {
				const remote = nd.fields[id];
				nd.fields[id] = doc.fields[id];
				if (remote && remote.by !== (me && me.name)) showConflict(id, remote);
			}
			doc = nd;
			if (statusChanged) {
				st.dirty.clear();
				renderAll();
				BP.toast(doc.status === 'approved' ? `${doc.approval.by} hat den Blueprint freigegeben.` : 'Die Freigabe wurde aufgehoben – Bearbeitung wieder möglich.');
				return;
			}
			for (const id of changed) {
				if (busyChanged.includes(id)) continue;
				const el = rerenderField(id);
				if (el) { el.animate([{ backgroundColor: 'rgba(255, 230, 0, .35)' }, { backgroundColor: 'transparent' }], { duration: 1600 }); }
			}
			paintHeader();
			paintLegend();
			if ($('#drawer').classList.contains('open')) paintHistory();
		} catch (e) {
			/* Netzwerkfehler beim Abgleich still ignorieren */
		} finally {
			polling = false;
		}
	}
	setInterval(poll, 8000);
	document.addEventListener('visibilitychange', () => { if (!document.hidden) poll(); });

	/* =========================================================
	   Eingaben
	   ========================================================= */
	const findItem = (list, iid) => list.find((x) => x.id === iid);

	function targetList(target) {
		const [fid, iid] = target.split('/');
		if (!iid) return { fid, list: st.local[fid] };
		const it = findItem(st.local[fid], iid);
		if (!it.media) it.media = [];
		return { fid, list: it.media, item: it };
	}

	sheet.addEventListener('input', (e) => {
		if (!editable()) return;
		const fld = e.target.closest('.fld');
		if (!fld) return;
		const id = fld.dataset.field;
		const t = F[id].type;
		if (t in COMPOSITE) {
			const k = e.target.dataset.k;
			const v = e.target.isContentEditable ? e.target.innerHTML : e.target.value;
			const mEl = e.target.closest('[data-mid]');
			const iEl = e.target.closest('[data-iid]');
			if (mEl && k === 'caption') {
				const grid = mEl.closest('[data-grid]');
				const m = findItem(targetList(grid.dataset.grid).list, mEl.dataset.mid);
				if (m) m.caption = v;
			} else if (iEl && k) {
				const it = findItem(st.local[id], iEl.dataset.iid);
				if (!it) return;
				it[k] = v;
				if (k === 'uvp' || k === 'preis') $('[data-saving]', iEl).textContent = savingText(it);
			} else return;
		}
		touch(id);
	});

	sheet.addEventListener('change', (e) => {
		const fld = e.target.closest('.fld');
		if (!fld || !editable()) return;
		if (e.target.matches('input[type=file]')) return;
		const id = fld.dataset.field;
		if (e.target.type === 'checkbox' || e.target.type === 'date') { touch(id, 50); return; }
	});

	sheet.addEventListener('focusout', (e) => {
		const fld = e.target.closest('.fld');
		if (!fld) return;
		const id = fld.dataset.field;
		if (st.dirty.has(id)) setTimeout(() => { if (!fld.contains(document.activeElement)) save(id); }, 0);
	});

	sheet.addEventListener('focusin', (e) => {
		if (!me && editable() && e.target.closest('.fld')) ensureMe();
		if (e.target.classList && e.target.classList.contains('rt')) showToolbar(e.target);
	});

	sheet.addEventListener('click', async (e) => {
		const btn = e.target.closest('[data-act]');
		if (!btn || !editable()) return;
		const fld = btn.closest('.fld');
		const id = fld.dataset.field;
		const act = btn.dataset.act;
		if (act === 'take-theirs') {
			doc.fields[id] = st.conflicts[id];
			st.dirty.delete(id);
			clearConflict(id);
			rerenderField(id);
			setSaveState(st.dirty.size ? 'dirty' : 'saved');
			return;
		}
		if (act === 'keep-mine') {
			st.force[id] = true;
			if (st.conflicts[id]) doc.fields[id] = st.conflicts[id];
			clearConflict(id);
			st.dirty.add(id);
			save(id);
			return;
		}
		if (act === 'rm-media') {
			e.preventDefault();
			const mEl = btn.closest('[data-mid]');
			const grid = btn.closest('[data-grid]');
			const { list } = targetList(grid.dataset.grid);
			const i = list.findIndex((x) => x.id === mEl.dataset.mid);
			if (i < 0 || !confirm(`„${list[i].name}“ entfernen?`)) return;
			list.splice(i, 1);
			mEl.remove();
			touch(id, 10);
			return;
		}
		const list = st.local[id];
		if (act === 'add-item') {
			const it = F[id].type === 'offers'
				? { id: rid(), media: [], set: '', uvp: '', preis: '' }
				: { id: rid(), title: '', note: '', media: [] };
			list.push(it);
			const el = rerenderLocal(id);
			const focusEl = $(`[data-iid="${it.id}"] [data-k]`, el);
			if (focusEl) focusEl.focus();
			touch(id, 400);
			return;
		}
		const iEl = btn.closest('[data-iid]');
		if (!iEl) return;
		const i = list.findIndex((x) => x.id === iEl.dataset.iid);
		if (act === 'del-item') {
			if (!confirm('Diesen Eintrag inkl. Medien löschen?')) return;
			list.splice(i, 1);
		} else if (act === 'up' && i > 0) {
			[list[i - 1], list[i]] = [list[i], list[i - 1]];
		} else if (act === 'down' && i < list.length - 1) {
			[list[i + 1], list[i]] = [list[i], list[i + 1]];
		} else return;
		rerenderLocal(id);
		touch(id, 10);
	});

	/** Feld aus der lokalen Arbeitskopie neu zeichnen (nach Strukturänderungen) */
	function rerenderLocal(id) {
		const saved = doc.fields[id];
		doc.fields[id] = { ...(saved || {}), value: st.local[id] };
		const keep = st.local[id];
		const el = rerenderField(id);
		st.local[id] = keep;
		doc.fields[id] = saved;
		return el;
	}

	/* ---------- Upload ---------- */
	sheet.addEventListener('change', (e) => {
		if (!e.target.matches('.drop input[type=file]')) return;
		const drop = e.target.closest('[data-drop]');
		uploadFiles(drop.dataset.drop, Array.from(e.target.files));
		e.target.value = '';
	});
	sheet.addEventListener('dragover', (e) => {
		const drop = e.target.closest('[data-drop]');
		if (!drop || !editable()) return;
		e.preventDefault();
		drop.classList.add('over');
	});
	sheet.addEventListener('dragleave', (e) => {
		const drop = e.target.closest('[data-drop]');
		if (drop) drop.classList.remove('over');
	});
	sheet.addEventListener('drop', (e) => {
		const drop = e.target.closest('[data-drop]');
		if (!drop || !editable()) return;
		e.preventDefault();
		drop.classList.remove('over');
		uploadFiles(drop.dataset.drop, Array.from(e.dataTransfer.files));
	});

	async function uploadFiles(target, files) {
		if (!files.length) return;
		const user = await ensureMe();
		const fid = target.split('/')[0];
		const box = $(`[data-uploads="${CSS.escape(target)}"]`, sheet);
		await Promise.all(files.map(async (file) => {
			const row = document.createElement('div');
			row.className = 'upload-row';
			row.innerHTML = `<span>${esc(file.name)}</span><div class="track"><div class="fill"></div></div>`;
			if (box) box.appendChild(row);
			try {
				const res = await BP.upload({ id: doc.id, user: user.name, color: user.color, file }, (p) => { $('.fill', row).style.width = Math.round(p * 100) + '%'; });
				const { list } = targetList(target);
				const m = { ...res.media, by: user.name, at: new Date().toISOString() };
				list.push(m);
				const grid = $(`[data-grid="${CSS.escape(target)}"]`, sheet);
				if (grid) grid.insertAdjacentHTML('beforeend', mediaItemHTML(m, 'edit'));
				row.remove();
				touch(fid, 10);
			} catch (err) {
				row.innerHTML = `<span style="color:var(--danger)">${esc(file.name)}: ${esc(err.message)}</span>`;
				setTimeout(() => row.remove(), 8000);
			}
		}));
	}

	/* =========================================================
	   Text-Werkzeugleiste (fett, Listen, Textmarker …)
	   ========================================================= */
	const tb = document.createElement('div');
	tb.className = 'rt-toolbar';
	tb.hidden = true;
	tb.innerHTML = `
		<button type="button" data-cmd="bold" title="Fett (Strg+B)"><b>B</b></button>
		<button type="button" data-cmd="italic" title="Kursiv (Strg+I)"><i>I</i></button>
		<button type="button" data-cmd="underline" title="Unterstrichen (Strg+U)"><u>U</u></button>
		<i class="div"></i>
		<button type="button" data-cmd="insertUnorderedList" title="Aufzählung">•</button>
		<button type="button" data-cmd="insertOrderedList" title="Nummerierung">1.</button>
		<button type="button" data-cmd="arrow" title="Pfeil einfügen">→</button>
		<i class="div"></i>
		<button type="button" data-cmd="mark" class="mk" title="Textmarker">M</button>
		<button type="button" data-cmd="link" title="Link einfügen">🔗</button>
		<button type="button" data-cmd="removeFormat" title="Formatierung entfernen">⌫</button>`;
	document.body.appendChild(tb);
	let tbTarget = null;
	function showToolbar(rt) {
		tbTarget = rt;
		tb.hidden = false;
		const r = rt.getBoundingClientRect();
		const top = window.scrollY + r.top - tb.offsetHeight - 6;
		tb.style.top = Math.max(window.scrollY + 64, top) + 'px';
		tb.style.left = Math.max(8, Math.min(window.scrollX + r.left, window.scrollX + document.documentElement.clientWidth - tb.offsetWidth - 8)) + 'px';
	}
	function hideToolbar() { tb.hidden = true; tbTarget = null; }
	document.addEventListener('focusout', () => setTimeout(() => {
		if (!document.activeElement || !document.activeElement.classList || !document.activeElement.classList.contains('rt')) hideToolbar();
	}, 120));
	window.addEventListener('resize', () => { if (tbTarget) showToolbar(tbTarget); });
	tb.addEventListener('mousedown', (e) => e.preventDefault());
	tb.addEventListener('click', (e) => {
		const b = e.target.closest('[data-cmd]');
		if (!b || !tbTarget) return;
		const cmd = b.dataset.cmd;
		tbTarget.focus();
		if (cmd === 'mark') {
			document.execCommand('styleWithCSS', false, true);
			const cur = String(document.queryCommandValue('hiliteColor') || document.queryCommandValue('backColor'));
			const on = /255,\s*242,\s*0|fff200|yellow/i.test(cur);
			document.execCommand('hiliteColor', false, on ? 'transparent' : '#fff200');
			document.execCommand('styleWithCSS', false, false);
		} else if (cmd === 'link') {
			const url = prompt('Link-Adresse (https://…):', 'https://');
			if (url && /^(https?:\/\/|mailto:|\\\\)/i.test(url)) document.execCommand('createLink', false, url);
		} else if (cmd === 'arrow') {
			document.execCommand('insertText', false, '→ ');
		} else {
			document.execCommand(cmd, false, null);
		}
		tbTarget.dispatchEvent(new Event('input', { bubbles: true }));
	});

	// Einfügen: Formatierung aus Word & Co. auf das Erlaubte reduzieren
	const ALLOWED = new Set(['B', 'STRONG', 'I', 'EM', 'U', 'S', 'BR', 'P', 'DIV', 'UL', 'OL', 'LI', 'A', 'MARK', 'SPAN', 'SUB', 'SUP']);
	function cleanPaste(html) {
		const d = new DOMParser().parseFromString(html, 'text/html');
		d.querySelectorAll('script,style,meta,link,title,xml,o\\:p').forEach((n) => n.remove());
		const walk = (node) => {
			for (const c of Array.from(node.childNodes)) {
				if (c.nodeType === 8) { c.remove(); continue; }
				if (c.nodeType !== 1) continue;
				walk(c);
				if (!ALLOWED.has(c.tagName)) { c.replaceWith(...c.childNodes); continue; }
				const href = c.getAttribute('href');
				const bg = (c.getAttribute('style') || '').match(/background(?:-color)?\s*:\s*([^;]+)/i);
				for (const a of Array.from(c.attributes)) c.removeAttribute(a.name);
				if (c.tagName === 'A' && href && /^(https?:|mailto:)/i.test(href)) c.setAttribute('href', href);
				if (bg && /yellow|ff0|fff200|ffff00/i.test(bg[1])) c.setAttribute('style', 'background-color: #fff200');
			}
		};
		walk(d.body);
		return d.body.innerHTML;
	}
	sheet.addEventListener('paste', (e) => {
		const rt = e.target.closest && e.target.closest('.rt');
		if (!rt) return;
		e.preventDefault();
		const html = e.clipboardData.getData('text/html');
		if (html) document.execCommand('insertHTML', false, cleanPaste(html));
		else document.execCommand('insertText', false, e.clipboardData.getData('text/plain'));
	});

	/* =========================================================
	   Verlauf
	   ========================================================= */
	function paintHistory() {
		const list = (doc.history || []).slice().reverse();
		const approvals = (doc.approvals || []).slice().reverse();
		const verb = (h) => {
			if (h.action === 'bearbeitet') return `hat <b>${esc((F[h.field] || {}).label || h.field)}</b> bearbeitet`;
			if (h.action === 'angelegt') return `hat den Blueprint angelegt${h.detail ? ` (${esc(h.detail)})` : ''}`;
			if (h.action === 'freigegeben') return `hat <b>freigegeben</b> (${esc(h.detail || '')})`;
			if (h.action === 'Freigabe aufgehoben') return `hat die <b>Freigabe aufgehoben</b>: ${esc(h.detail || '')}`;
			return esc(h.action);
		};
		$('#history').innerHTML =
			(approvals.length ? `<h3 style="font-size:14px;margin:12px 0 4px">Freigegebene Versionen</h3>` + approvals.map((a) =>
				`<div class="hist"><span class="avatar" style="--c:var(--ok)">v${esc(a.version)}</span><div><a href="file.php?id=${encodeURIComponent(doc.id)}&pdf=${encodeURIComponent(a.pdf)}" target="_blank" rel="noopener">${esc(a.pdf)}</a><div class="when">${esc(a.by)} · ${esc(BP.date(a.at, true))}</div></div></div>`).join('') + `<h3 style="font-size:14px;margin:16px 0 4px">Änderungen</h3>` : '') +
			(list.length ? list.map((h) => `<div class="hist">${BP.avatar(h.by)}<div><b>${esc(h.by)}</b> ${verb(h)}<div class="when">${esc(BP.date(h.at, true))}</div></div></div>`).join('') : '<p class="muted">Noch keine Einträge.</p>');
	}
	const drawer = $('#drawer');
	$('#btn-history').addEventListener('click', () => { paintHistory(); drawer.classList.add('open'); drawer.setAttribute('aria-hidden', 'false'); $('#drawer-close').focus(); });
	$('#drawer-close').addEventListener('click', () => { drawer.classList.remove('open'); drawer.setAttribute('aria-hidden', 'true'); });
	document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && drawer.classList.contains('open')) $('#drawer-close').click(); });

	/* =========================================================
	   Freigabe & PDF
	   ========================================================= */
	function missingRequired() {
		const missing = [];
		for (const id in F) {
			const v = readValue(id);
			const empty = F[id].type === 'richtext' ? !String(v).replace(/<[^>]*>|&nbsp;/g, '').trim()
				: F[id].type === 'check' ? !v.checked
				: Array.isArray(v) ? v.length === 0 : !String(v || '').trim();
			if (empty) missing.push({ id, label: F[id].label, required: !!F[id].required });
		}
		return missing;
	}

	$('#btn-preview').addEventListener('click', async () => {
		if (!editable()) {
			window.open(`file.php?id=${encodeURIComponent(doc.id)}&pdf=${encodeURIComponent(doc.approval.pdf)}`, '_blank', 'noopener');
			return;
		}
		const win = window.open('', '_blank');
		const b = BP.busy('PDF-Vorschau wird erzeugt …');
		try {
			await flushAll();
			const blob = await BP.buildPdf({ marks: sheet.classList.contains('marks'), preview: true });
			const url = URL.createObjectURL(blob);
			if (win) win.location.href = url; else window.open(url, '_blank');
		} catch (e) {
			if (win) win.close();
			BP.toast('PDF konnte nicht erzeugt werden: ' + e.message, 'err');
		} finally { b.done(); }
	});

	$('#btn-approve').addEventListener('click', async () => {
		const user = await ensureMe();
		await flushAll();
		if (Object.keys(st.conflicts).length) { BP.toast('Bitte zuerst die markierten Konflikte auflösen.', 'err'); return; }
		const missing = missingRequired();
		const req = missing.filter((m) => m.required);
		const opt = missing.filter((m) => !m.required);
		const body = document.createElement('div');
		body.innerHTML = `
			<p style="margin-top:0">Mit der Freigabe wird ein PDF erzeugt und abgelegt. Danach ist der Blueprint für <b>alle</b> gesperrt.</p>
			${req.length ? `<div class="notice warn"><b>Pflichtbereiche noch leer:</b><ul>${req.map((m) => `<li>${esc(m.label)}</li>`).join('')}</ul></div>` : '<div class="notice ok">Alle Pflichtbereiche sind befüllt.</div>'}
			${opt.length ? `<p class="hint">Ebenfalls leer (optional): ${opt.map((m) => esc(m.label)).join(', ')}</p>` : ''}
			<label class="field-label">Freigabe durch</label>
			<div style="display:flex;align-items:center;gap:8px">${BP.avatar(user.name)} <b>${esc(user.name)}</b></div>
			<label class="field-label" for="ap-note">Bemerkung <span class="muted" style="font-weight:400">(optional)</span></label>
			<textarea class="in" id="ap-note" maxlength="1000" rows="2" placeholder="z. B. Freigabe nach Abstimmung mit Kunde"></textarea>
			<label class="check-line"><input type="checkbox" id="ap-marks"> Namens-Markierungen im PDF anzeigen</label>
			${req.length ? '<label class="check-line"><input type="checkbox" id="ap-force"> Trotz leerer Pflichtbereiche freigeben</label>' : ''}`;
		BP.modal({
			title: 'Blueprint freigeben',
			body,
			actions: [{
				label: 'Freigeben & PDF erzeugen', approve: true, onClick: async (m, btn) => {
					if (req.length && !$('#ap-force', body).checked) { BP.toast('Bitte Pflichtbereiche befüllen oder „Trotzdem freigeben“ bestätigen.', 'err'); return false; }
					btn.disabled = true;
					const note = $('#ap-note', body).value.trim();
					const marks = $('#ap-marks', body).checked;
					m.close();
					await approve(user, note, marks);
				}
			}]
		});
	});

	async function approve(user, note, marks) {
		const b = BP.busy('PDF wird erzeugt …');
		try {
			await flushAll();
			const approval = { by: user.name, at: new Date().toISOString(), version: (doc.approvals || []).length + 1, note };
			const blob = await BP.buildPdf({ marks, approval });
			b.set('PDF wird abgelegt …');
			const res = await BP.upload({ id: doc.id, user: user.name, color: user.color, note, pdf: new File([blob], 'blueprint.pdf', { type: 'application/pdf' }) });
			doc = res.doc;
			renderAll();
			window.scrollTo({ top: 0, behavior: 'smooth' });
			BP.toast('Freigegeben – PDF wurde abgelegt.');
			const a = document.createElement('a');
			a.href = `file.php?id=${encodeURIComponent(doc.id)}&pdf=${encodeURIComponent(doc.approval.pdf)}&download=1`;
			document.body.appendChild(a); a.click(); a.remove();
		} catch (e) {
			BP.toast('Freigabe fehlgeschlagen: ' + e.message, 'err');
			if (e.status === 423) poll(true);
		} finally { b.done(); }
	}

	function reopenDialog() {
		ensureMe().then((user) => {
			const body = document.createElement('div');
			body.innerHTML = `
				<p style="margin-top:0">Der Blueprint wird wieder zur Bearbeitung geöffnet. Das bisherige PDF (Version ${esc(doc.approval.version)}) bleibt erhalten; bei erneuter Freigabe entsteht Version ${esc((doc.approvals || []).length + 1)}.</p>
				<label class="field-label" for="ro-reason">Grund</label>
				<input class="in" id="ro-reason" maxlength="500" placeholder="z. B. Preise geändert">
				${window.BP_PIN ? '<label class="field-label" for="ro-pin">PIN</label><input class="in" id="ro-pin" type="password" autocomplete="off">' : ''}`;
			BP.modal({
				title: 'Freigabe aufheben',
				body,
				actions: [{
					label: 'Freigabe aufheben', danger: true, onClick: async () => {
						const reason = $('#ro-reason', body).value.trim();
						if (!reason) { $('#ro-reason', body).focus(); return false; }
						try {
							const res = await BP.api('reopen', { id: doc.id, user: user.name, color: user.color, reason, pin: window.BP_PIN ? $('#ro-pin', body).value : '' });
							doc = res.doc;
							renderAll();
							BP.toast('Freigabe aufgehoben – der Blueprint kann wieder bearbeitet werden.');
						} catch (e) { BP.toast(e.message, 'err'); return false; }
					}
				}]
			});
			setTimeout(() => $('#ro-reason', body).focus(), 30);
		});
	}

	/* =========================================================
	   Start
	   ========================================================= */
	$('#user-chip').addEventListener('click', () => BP.askUser(true).then((u) => {
		me = u; paintUser();
		for (const id in F) refreshTags(id);
		paintLegend();
	}));
	const marksToggle = $('#toggle-marks');
	try { marksToggle.checked = localStorage.getItem('blueprint.marks') !== '0'; } catch (e) { /* */ }
	sheet.classList.toggle('marks', marksToggle.checked);
	marksToggle.addEventListener('change', () => {
		sheet.classList.toggle('marks', marksToggle.checked);
		try { localStorage.setItem('blueprint.marks', marksToggle.checked ? '1' : '0'); } catch (e) { /* */ }
	});
	window.addEventListener('beforeunload', (e) => {
		if (st.dirty.size || Object.keys(st.inflight).length) { e.preventDefault(); e.returnValue = ''; }
	});

	paintUser();
	renderAll();
	if (!me && editable()) ensureMe();
})();
