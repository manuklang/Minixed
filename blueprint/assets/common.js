/* Blueprint – gemeinsame Helfer (Person, API, Dialoge) */
(function () {
	'use strict';

	const PALETTE = ['#1f6fd1', '#d4462f', '#1e8a4c', '#8b3fc9', '#d27a00', '#0f8a8a', '#c2337a', '#5a6b12', '#6b4a2b', '#3b4cc0'];
	const LS_KEY = 'blueprint.user';

	const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

	function hashColor(name) {
		let h = 0;
		for (const ch of String(name)) h = (h * 31 + ch.codePointAt(0)) >>> 0;
		return PALETTE[h % PALETTE.length];
	}

	function initials(name) {
		const parts = String(name || '?').trim().split(/[\s.\-_]+/).filter(Boolean);
		if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
		return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
	}

	function tint(hex, alpha) {
		const n = parseInt(String(hex).slice(1), 16);
		return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
	}

	const fmt = new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
	const fmtT = new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
	function date(iso, withTime) {
		if (!iso) return '';
		const d = new Date(iso);
		return isNaN(d) ? '' : (withTime ? fmtT : fmt).format(d);
	}

	/* ---------- Person ---------- */
	let usersMap = {};
	function setUsers(map) { usersMap = map || {}; }
	function colorOf(name) {
		const me = getUser();
		if (me && me.name === name) return me.color;
		return (usersMap[name] && usersMap[name].color) || hashColor(name);
	}

	function getUser() {
		try {
			const u = JSON.parse(localStorage.getItem(LS_KEY) || 'null');
			return u && u.name ? u : null;
		} catch (e) { return null; }
	}
	function saveUser(u) {
		try { localStorage.setItem(LS_KEY, JSON.stringify(u)); } catch (e) { /* privat */ }
	}

	function askUser(force) {
		const cur = getUser();
		if (cur && !force) return Promise.resolve(cur);
		return new Promise((resolve) => {
			let color = (cur && cur.color) || null;
			const body = document.createElement('div');
			body.innerHTML = `
				<p class="muted" style="margin:0 0 10px">Damit alle sehen, wer welchen Bereich befüllt hat, werden deine Einträge mit deinem Namen, dem Datum und deiner Farbe markiert.</p>
				<label class="field-label" for="u-name">Dein Name</label>
				<input class="in" id="u-name" autocomplete="name" maxlength="60" placeholder="z. B. Vanessa Krüger" value="${esc(cur ? cur.name : '')}">
				<label class="field-label">Deine Farbe</label>
				<div class="swatches" role="radiogroup" aria-label="Farbe"></div>`;
			const input = body.querySelector('#u-name');
			const sw = body.querySelector('.swatches');
			function paint() {
				const active = color || hashColor(input.value.trim() || '?');
				sw.innerHTML = PALETTE.map((c) => `<button type="button" class="swatch" role="radio" style="--c:${c}" aria-label="Farbe ${c}" aria-checked="${c === active}" data-c="${c}"></button>`).join('');
			}
			sw.addEventListener('click', (e) => { const b = e.target.closest('.swatch'); if (b) { color = b.dataset.c; paint(); } });
			input.addEventListener('input', () => { if (!cur || !cur.color) paint(); });
			paint();
			const m = modal({
				title: cur ? 'Person ändern' : 'Wer arbeitet gerade?',
				body,
				dismissable: !!cur,
				actions: [{
					label: 'Speichern', primary: true, onClick: () => {
						const name = input.value.trim().replace(/\s+/g, ' ');
						if (!name) { input.focus(); return false; }
						const u = { name, color: color || hashColor(name) };
						saveUser(u);
						resolve(u);
					}
				}]
			});
			input.addEventListener('keydown', (e) => { if (e.key === 'Enter') m.submit(); });
			setTimeout(() => input.focus(), 30);
		});
	}

	function avatar(name, cls = '') {
		return `<span class="avatar ${cls}" style="--c:${colorOf(name)}" title="${esc(name)}">${esc(initials(name))}</span>`;
	}

	/* ---------- API ---------- */
	async function api(action, data, opts = {}) {
		const url = 'api.php?action=' + encodeURIComponent(action) + (opts.query ? '&' + new URLSearchParams(opts.query) : '');
		const init = { method: data ? 'POST' : 'GET', headers: {} };
		if (data instanceof FormData) init.body = data;
		else if (data) { init.body = JSON.stringify(data); init.headers['Content-Type'] = 'application/json'; }
		let res, json;
		try {
			res = await fetch(url, init);
			json = await res.json();
		} catch (e) {
			const err = new Error(res ? 'Unerwartete Antwort vom Server (' + res.status + ')' : 'Keine Verbindung zum Server');
			err.status = res ? res.status : 0;
			throw err;
		}
		if (!res.ok || json.ok === false) {
			const err = new Error(json.error || 'Fehler ' + res.status);
			err.status = res.status;
			err.payload = json;
			throw err;
		}
		return json;
	}

	function upload(fields, onProgress) {
		return new Promise((resolve, reject) => {
			const fd = new FormData();
			for (const [k, v] of Object.entries(fields)) fd.append(k, v);
			const xhr = new XMLHttpRequest();
			xhr.open('POST', 'api.php?action=' + (fields.pdf ? 'approve' : 'upload'));
			xhr.upload.onprogress = (e) => { if (e.lengthComputable && onProgress) onProgress(e.loaded / e.total); };
			xhr.onload = () => {
				let json = null;
				try { json = JSON.parse(xhr.responseText); } catch (e) { /* */ }
				if (xhr.status >= 200 && xhr.status < 300 && json && json.ok !== false) resolve(json);
				else {
					const err = new Error((json && json.error) || (xhr.status === 413 ? 'Datei ist zu groß für den Server' : 'Upload fehlgeschlagen (' + xhr.status + ')'));
					err.status = xhr.status;
					reject(err);
				}
			};
			xhr.onerror = () => reject(new Error('Keine Verbindung zum Server'));
			xhr.send(fd);
		});
	}

	/* ---------- Dialoge & Meldungen ---------- */
	function modal({ title, body, actions = [], dismissable = true, onClose }) {
		const back = document.createElement('div');
		back.className = 'modal-back';
		back.innerHTML = `<div class="modal" role="dialog" aria-modal="true" aria-labelledby="m-title"><header><h2 id="m-title">${esc(title)}</h2></header><div class="body"></div><footer></footer></div>`;
		const bodyEl = back.querySelector('.body');
		if (typeof body === 'string') bodyEl.innerHTML = body; else if (body) bodyEl.appendChild(body);
		const foot = back.querySelector('footer');
		const prevFocus = document.activeElement;
		const close = () => {
			back.remove();
			document.removeEventListener('keydown', onKey);
			if (prevFocus && prevFocus.focus) prevFocus.focus();
			if (onClose) onClose();
		};
		const api = { el: back, body: bodyEl, close, submit: null, buttons: [] };
		if (dismissable) actions = [{ label: 'Abbrechen', onClick: () => true }, ...actions];
		for (const a of actions) {
			const b = document.createElement('button');
			b.type = 'button';
			b.className = 'btn ' + (a.primary ? 'primary' : '') + (a.approve ? ' approve' : '') + (a.danger ? ' danger' : '');
			b.textContent = a.label;
			b.addEventListener('click', async () => {
				const r = await a.onClick(api, b);
				if (r !== false) close();
			});
			foot.appendChild(b);
			api.buttons.push(b);
			if (a.primary || a.approve || a.danger) api.submit = () => b.click();
		}
		function onKey(e) { if (e.key === 'Escape' && dismissable) close(); }
		document.addEventListener('keydown', onKey);
		if (dismissable) back.addEventListener('mousedown', (e) => { if (e.target === back) close(); });
		document.body.appendChild(back);
		return api;
	}

	function toast(msg, type) {
		let box = document.querySelector('.toasts');
		if (!box) { box = document.createElement('div'); box.className = 'toasts'; box.setAttribute('role', 'status'); document.body.appendChild(box); }
		const t = document.createElement('div');
		t.className = 'toast ' + (type || '');
		t.textContent = msg;
		box.appendChild(t);
		setTimeout(() => t.remove(), type === 'err' ? 6000 : 3200);
	}

	function busy(text) {
		const el = document.createElement('div');
		el.className = 'busy';
		el.innerHTML = `<div><div class="spin"></div><div class="txt">${esc(text)}</div></div>`;
		document.body.appendChild(el);
		return { set: (t) => { el.querySelector('.txt').textContent = t; }, done: () => el.remove() };
	}

	window.BP = { PALETTE, esc, hashColor, initials, tint, date, getUser, saveUser, askUser, setUsers, colorOf, avatar, api, upload, modal, toast, busy };
})();
