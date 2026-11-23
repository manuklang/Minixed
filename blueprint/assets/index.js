/* Blueprint – Übersicht */
(function () {
	'use strict';
	const { esc } = BP;
	BP.setUsers(window.BP_USERS);

	// Beteiligte als farbige Kürzel
	document.querySelectorAll('.avatars[data-names]').forEach((el) => {
		let names = [];
		try { names = JSON.parse(el.dataset.names); } catch (e) { /* */ }
		el.innerHTML = names.slice(0, 6).map((n) => BP.avatar(n)).join('') + (names.length > 6 ? `<span class="muted" style="margin-left:6px;font-size:12px">+${names.length - 6}</span>` : '');
	});

	// Person in der Kopfzeile
	const chip = document.getElementById('user-chip');
	function paintUser() {
		const u = BP.getUser();
		chip.hidden = false;
		chip.innerHTML = u ? `${BP.avatar(u.name)}<span>${esc(u.name)}</span>` : '<span style="padding-left:8px">Name festlegen</span>';
	}
	chip.addEventListener('click', () => BP.askUser(true).then(paintUser));
	paintUser();

	// Suche & Filter
	const q = document.getElementById('q');
	let filter = 'all';
	function applyFilter() {
		const term = (q ? q.value : '').trim().toLowerCase();
		let hits = 0;
		document.querySelectorAll('.index-table tbody tr').forEach((tr) => {
			const show = (filter === 'all' || tr.dataset.status === filter) && (!term || tr.dataset.search.includes(term));
			tr.hidden = !show;
			if (show) hits++;
		});
		const none = document.getElementById('no-hits');
		if (none) none.hidden = hits > 0;
	}
	if (q) q.addEventListener('input', applyFilter);
	document.querySelectorAll('.seg button').forEach((b) => b.addEventListener('click', () => {
		filter = b.dataset.f;
		document.querySelectorAll('.seg button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
		applyFilter();
	}));

	// Neuer Blueprint
	async function createDialog(copyFrom) {
		const user = await BP.askUser();
		const tpl = window.BP_TEMPLATES || [];
		const body = document.createElement('div');
		body.innerHTML = `
			<label class="field-label" for="n-title">Projekttitel</label>
			<input class="in" id="n-title" maxlength="200" placeholder="z. B. IMCosmetics Platinum Lift">
			<label class="field-label" for="n-art">Artikel</label>
			<input class="in" id="n-art" maxlength="200" placeholder="z. B. IMC Platinum Lift Creme + Serum">
			<label class="field-label" for="n-nr">Art.-Nr. <span class="muted" style="font-weight:400">(optional)</span></label>
			<input class="in" id="n-nr" maxlength="60">
			<label class="field-label" for="n-copy">Vorlage</label>
			<select class="in" id="n-copy">
				<option value="">Leerer Blueprint (Master-Template)</option>
				${tpl.map((t) => `<option value="${esc(t.id)}" ${t.id === copyFrom ? 'selected' : ''}>Kopie von: ${esc(t.titel || t.id)}${t.artikel ? ' – ' + esc(t.artikel) : ''}</option>`).join('')}
			</select>
			<p class="hint">Bei einer Kopie werden alle Inhalte und Medien übernommen; die Markierungen laufen dann auf deinen Namen.</p>`;
		const title = body.querySelector('#n-title');
		if (copyFrom) {
			const src = tpl.find((t) => t.id === copyFrom);
			if (src) { title.value = src.titel + ' (Kopie)'; body.querySelector('#n-art').value = src.artikel || ''; }
		}
		const m = BP.modal({
			title: copyFrom ? 'Blueprint duplizieren' : 'Neuer Blueprint',
			body,
			actions: [{
				label: 'Anlegen', primary: true, onClick: async (_, btn) => {
					if (!title.value.trim()) { title.focus(); BP.toast('Bitte einen Projekttitel angeben', 'err'); return false; }
					btn.disabled = true;
					try {
						const res = await BP.api('create', {
							user: user.name, color: user.color,
							titel: title.value, artikel: body.querySelector('#n-art').value, artnr: body.querySelector('#n-nr').value,
							copyFrom: body.querySelector('#n-copy').value,
						});
						location.href = 'edit.php?id=' + encodeURIComponent(res.id);
					} catch (e) {
						BP.toast(e.message, 'err');
						btn.disabled = false;
						return false;
					}
				}
			}]
		});
		body.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.tagName === 'INPUT') m.submit(); });
		setTimeout(() => title.focus(), 30);
	}
	document.getElementById('btn-new').addEventListener('click', () => createDialog(null));
	document.querySelectorAll('[data-copy]').forEach((b) => b.addEventListener('click', () => createDialog(b.dataset.copy)));

	// Löschen (nur Entwürfe, landet im Papierkorb auf dem Server)
	document.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', async () => {
		const user = await BP.askUser();
		BP.modal({
			title: 'Blueprint löschen?',
			body: `<p>„${esc(b.dataset.title)}“ wird aus der Übersicht entfernt. Eine Sicherung bleibt im Ordner <code>data/_papierkorb</code> auf dem Server.</p>`,
			actions: [{
				label: 'Löschen', danger: true, onClick: async () => {
					try {
						await BP.api('delete', { id: b.dataset.del, user: user.name, color: user.color });
						location.reload();
					} catch (e) { BP.toast(e.message, 'err'); }
				}
			}]
		});
	}));
})();
