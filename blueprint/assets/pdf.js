/* Blueprint – PDF-Erzeugung im Browser (html2pdf.js)
   Erzeugt ein A4-PDF im Layout des Master-Templates: Projekttitel + Genius-Logo
   im Kopf jeder Seite, „Seite | n“ im Fuß. Videos werden als Standbild mit
   Play-Symbol abgebildet. */
(function () {
	'use strict';

	const MM = { top: 27, bottom: 17, left: 14, right: 14 };
	let logo = null;

	function loadImg(src) {
		return new Promise((resolve, reject) => {
			const i = new Image();
			i.onload = () => resolve(i);
			i.onerror = () => reject(new Error('Bild konnte nicht geladen werden: ' + src));
			i.src = src;
		});
	}

	async function loadLogo() {
		if (logo) return logo;
		const img = await loadImg('assets/genius-logo.png');
		const c = document.createElement('canvas');
		c.width = img.naturalWidth;
		c.height = img.naturalHeight;
		c.getContext('2d').drawImage(img, 0, 0);
		logo = { url: c.toDataURL('image/png'), w: img.naturalWidth, h: img.naturalHeight };
		return logo;
	}

	function videoStill(src) {
		return new Promise((resolve) => {
			const v = document.createElement('video');
			v.muted = true;
			v.preload = 'auto';
			v.playsInline = true;
			let finished = false;
			const done = (url) => {
				if (finished) return;
				finished = true;
				clearTimeout(timer);
				v.removeAttribute('src');
				v.load();
				resolve(url);
			};
			const timer = setTimeout(() => done(null), 10000);
			v.addEventListener('loadeddata', () => { v.currentTime = Math.min(1, (v.duration || 3) / 3); }, { once: true });
			v.addEventListener('seeked', () => {
				try {
					const c = document.createElement('canvas');
					c.width = v.videoWidth;
					c.height = v.videoHeight;
					c.getContext('2d').drawImage(v, 0, 0);
					done(c.toDataURL('image/jpeg', 0.86));
				} catch (e) { done(null); }
			}, { once: true });
			v.addEventListener('error', () => done(null), { once: true });
			v.src = src;
		});
	}

	BP.buildPdf = async function ({ marks = false, approval = null, preview = false } = {}) {
		if (!window.html2pdf) throw new Error('PDF-Bibliothek ist noch nicht geladen – bitte kurz warten und erneut versuchen.');
		const doc = BPView.doc();
		const title = (doc.fields.titel && doc.fields.titel.value) || 'Blueprint';

		const stage = document.createElement('div');
		stage.className = 'pdf-stage';
		stage.innerHTML = `<div class="sheet pdf-doc${marks ? ' marks' : ''}">${BPView.sheetHTML('view', { approval })}</div>`;
		document.body.appendChild(stage);
		try {
			// Videos als Standbild mit Play-Symbol (wie im Word-Dokument)
			for (const v of Array.from(stage.querySelectorAll('video'))) {
				const url = await videoStill(v.getAttribute('src').split('#')[0]);
				const box = document.createElement('div');
				box.className = 'poster';
				box.innerHTML = url
					? `<img src="${url}" alt=""><span class="play"></span>`
					: `<div class="file"><span class="ext">Video</span><span>${BP.esc(v.dataset.name || '')}</span></div>`;
				v.closest('.thumb').replaceWith(box);
			}
			const imgs = Array.from(stage.querySelectorAll('img'));
			imgs.forEach((i) => { i.loading = 'eager'; });
			await Promise.all(imgs.map((i) => (i.complete ? null : new Promise((r) => { i.onload = i.onerror = r; }))));
			const lg = await loadLogo();

			// Sehr lange Dokumente mit etwas geringerer Auflösung rendern (Canvas-Grenzen der Browser)
			const height = stage.scrollHeight;
			const scale = Math.max(1, Math.min(2, 28000 / Math.max(height, 1)));

			const opt = {
				margin: [MM.top, MM.left, MM.bottom, MM.right],
				filename: 'blueprint.pdf',
				image: { type: 'jpeg', quality: 0.92 },
				html2canvas: { scale, useCORS: true, backgroundColor: '#ffffff', logging: false, scrollX: 0, scrollY: 0 },
				jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait', compress: true },
				pagebreak: { mode: ['css'], avoid: ['.avoid-break', '.row', '.offer', '.media-item', '.ml-title', '.bar', 'li', 'p'] },
			};
			// html2canvas rechnet mit der Scroll-Position – für die Aufnahme kurz nach oben scrollen
			const sx = window.scrollX, sy = window.scrollY;
			window.scrollTo(0, 0);
			let pdf;
			try {
				pdf = await html2pdf().set(opt).from(stage.firstElementChild).toPdf().get('pdf');
			} finally {
				window.scrollTo(sx, sy);
			}

			const n = pdf.internal.getNumberOfPages();
			const W = pdf.internal.pageSize.getWidth();
			const H = pdf.internal.pageSize.getHeight();
			const lh = 8.5;
			const lw = lh * lg.w / lg.h;
			for (let i = 1; i <= n; i++) {
				pdf.setPage(i);
				pdf.setFont('helvetica', 'normal');
				pdf.setFontSize(15);
				pdf.setTextColor(43, 92, 145);
				pdf.text(title, MM.left, 17, { maxWidth: W - MM.left - MM.right - lw - 8 });
				pdf.addImage(lg.url, 'PNG', W - MM.right - lw, 10, lw, lh);
				pdf.setFontSize(10);
				pdf.setTextColor(30, 30, 30);
				pdf.text(`Seite | ${i}`, W - MM.right, H - 8, { align: 'right' });
				pdf.setFontSize(8.5);
				if (preview) {
					pdf.setTextColor(160, 160, 160);
					pdf.text(`Vorschau – nicht freigegeben · Stand ${BP.date(new Date().toISOString(), true)}`, MM.left, H - 8);
				} else if (approval) {
					pdf.setTextColor(30, 122, 70);
					pdf.text(`Freigegeben von ${approval.by} am ${BP.date(approval.at, true)} Uhr · Version ${approval.version}`, MM.left, H - 8);
				}
			}
			pdf.setProperties({ title: title + ' – Blueprint', subject: 'Blueprint – Produktionsvorbereitung', creator: 'Blueprint' });
			return pdf.output('blob');
		} finally {
			stage.remove();
		}
	};
})();
