<?php
// Blueprint – gemeinsame Funktionen (Speicherung, Validierung, Bereinigung)
declare(strict_types=1);

const BP_ID_RE = '/^[a-z0-9][a-z0-9-]{2,90}$/';
const BP_FILE_RE = '/^[A-Za-z0-9][A-Za-z0-9._-]{0,200}$/';
const BP_ITEM_RE = '/^[A-Za-z0-9_-]{4,40}$/';

class BpError extends RuntimeException {}

function bp_config(): array {
	static $c = null;
	return $c ??= require __DIR__ . '/config.php';
}

date_default_timezone_set(bp_config()['timezone'] ?? 'Europe/Berlin');

function bp_schema(): array {
	static $s = null;
	return $s ??= json_decode((string) file_get_contents(__DIR__ . '/schema.json'), true, 512, JSON_THROW_ON_ERROR);
}

function bp_data_dir(): string {
	$dir = rtrim(bp_config()['dataDir'], '/');
	if (!is_dir($dir) && !@mkdir($dir, 0775, true)) throw new BpError('Datenverzeichnis kann nicht angelegt werden', 500);
	return $dir;
}

function bp_valid_id(string $id): bool {
	return (bool) preg_match(BP_ID_RE, $id);
}

function bp_dir(string $id): string {
	if (!bp_valid_id($id)) throw new BpError('Ungültige Blueprint-ID', 400);
	return bp_data_dir() . '/' . $id;
}

function bp_now(): string {
	return (new DateTimeImmutable('now'))->format(DATE_ATOM);
}

function bp_rand(int $bytes = 5): string {
	return bin2hex(random_bytes($bytes));
}

function bp_slug(string $s): string {
	$s = strtr(mb_strtolower($s, 'UTF-8'), ['ä' => 'ae', 'ö' => 'oe', 'ü' => 'ue', 'ß' => 'ss']);
	$s = (string) iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $s);
	$s = preg_replace('/[^a-z0-9]+/', '-', strtolower($s));
	return trim(substr((string) $s, 0, 50), '-') ?: 'blueprint';
}

function bp_exists(string $id): bool {
	return bp_valid_id($id) && is_file(bp_dir($id) . '/blueprint.json');
}

function bp_load(string $id): array {
	$file = bp_dir($id) . '/blueprint.json';
	if (!is_file($file)) throw new BpError('Blueprint nicht gefunden', 404);
	$doc = json_decode((string) file_get_contents($file), true);
	if (!is_array($doc)) throw new BpError('Blueprint-Datei ist beschädigt', 500);
	return $doc;
}

function bp_write_json(string $file, array $data): void {
	$tmp = $file . '.' . bp_rand(4) . '.tmp';
	$json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
	if (file_put_contents($tmp, $json) === false || !rename($tmp, $file)) {
		@unlink($tmp);
		throw new BpError('Speichern fehlgeschlagen (Schreibrechte prüfen)', 500);
	}
}

/**
 * Lädt den Blueprint exklusiv gesperrt, ruft $fn($doc) auf und speichert,
 * wenn $fn true zurückgibt. Verhindert, dass sich gleichzeitige Änderungen
 * mehrerer Personen gegenseitig überschreiben.
 */
function bp_transaction(string $id, callable $fn) {
	$dir = bp_dir($id);
	if (!is_file($dir . '/blueprint.json')) throw new BpError('Blueprint nicht gefunden', 404);
	$lock = fopen($dir . '/.lock', 'c');
	if (!$lock || !flock($lock, LOCK_EX)) throw new BpError('Sperre konnte nicht gesetzt werden', 500);
	try {
		$doc = bp_load($id);
		$result = $fn($doc);
		if ($result !== false) {
			$doc['rev'] = (int) ($doc['rev'] ?? 0) + 1;
			bp_write_json($dir . '/blueprint.json', $doc);
		}
		return $doc;
	} finally {
		flock($lock, LOCK_UN);
		fclose($lock);
	}
}

function bp_list(): array {
	$out = [];
	foreach (glob(bp_data_dir() . '/*/blueprint.json') ?: [] as $file) {
		$doc = json_decode((string) file_get_contents($file), true);
		if (is_array($doc) && !empty($doc['id'])) $out[] = $doc;
	}
	usort($out, fn($a, $b) => strcmp($b['updatedAt'] ?? '', $a['updatedAt'] ?? ''));
	return $out;
}

/* ---------- Personen ---------- */

function bp_clean_user(array $in): array {
	$name = trim(preg_replace('/\s+/u', ' ', (string) ($in['user'] ?? '')));
	$name = mb_substr($name, 0, 60);
	if ($name === '') throw new BpError('Bitte zuerst deinen Namen angeben', 400);
	$color = (string) ($in['color'] ?? '');
	if (!preg_match('/^#[0-9a-fA-F]{6}$/', $color)) $color = '';
	return ['name' => $name, 'color' => strtolower($color)];
}

function bp_users(): array {
	$file = bp_data_dir() . '/users.json';
	$u = is_file($file) ? json_decode((string) file_get_contents($file), true) : [];
	return is_array($u) ? $u : [];
}

function bp_touch_user(array $user): void {
	if ($user['color'] === '') return;
	$file = bp_data_dir() . '/users.json';
	$lock = fopen($file . '.lock', 'c');
	if (!$lock) return;
	flock($lock, LOCK_EX);
	$users = bp_users();
	if (($users[$user['name']]['color'] ?? null) !== $user['color']) {
		$users[$user['name']] = ['color' => $user['color']];
		bp_write_json($file, $users);
	}
	flock($lock, LOCK_UN);
	fclose($lock);
}

function bp_history(array &$doc, array $user, string $action, ?string $field = null, ?string $detail = null): void {
	$entry = ['at' => bp_now(), 'by' => $user['name'], 'action' => $action];
	if ($field !== null) $entry['field'] = $field;
	if ($detail !== null && $detail !== '') $entry['detail'] = mb_substr($detail, 0, 300);
	$doc['history'][] = $entry;
	$limit = (int) bp_config()['historyLimit'];
	if (count($doc['history']) > $limit) $doc['history'] = array_slice($doc['history'], -$limit);
}

function bp_contribute(array &$doc, array $user, string $now): void {
	$c = $doc['contributors'][$user['name']] ?? ['first' => $now, 'edits' => 0];
	$c['last'] = $now;
	$c['edits'] = (int) $c['edits'] + 1;
	$doc['contributors'][$user['name']] = $c;
	$doc['updatedAt'] = $now;
	$doc['updatedBy'] = $user['name'];
}

/* ---------- Neues Dokument ---------- */

function bp_create(array $user, array $init, ?string $copyFrom = null): array {
	$title = trim((string) ($init['titel'] ?? ''));
	if ($title === '') throw new BpError('Bitte einen Projekttitel angeben', 400);
	$id = date('Y-m-d') . '-' . bp_slug($title) . '-' . bp_rand(2);
	$dir = bp_dir($id);
	if (!mkdir($dir . '/media', 0775, true)) throw new BpError('Ordner konnte nicht angelegt werden', 500);
	mkdir($dir . '/pdf', 0775, true);
	$now = bp_now();
	$doc = [
		'id' => $id,
		'rev' => 1,
		'status' => 'draft',
		'createdAt' => $now,
		'createdBy' => $user['name'],
		'updatedAt' => $now,
		'updatedBy' => $user['name'],
		'fields' => [],
		'contributors' => [],
		'approval' => null,
		'approvals' => [],
		'history' => [],
	];
	$schema = bp_schema()['fields'];

	if ($copyFrom !== null) {
		$src = bp_load($copyFrom);
		foreach (glob(bp_dir($copyFrom) . '/media/*') ?: [] as $f) copy($f, $dir . '/media/' . basename($f));
		foreach ($src['fields'] ?? [] as $fid => $f) {
			if (!isset($schema[$fid])) continue;
			$doc['fields'][$fid] = ['value' => bp_restamp($f['value'], $user['name'], $now), 'by' => $user['name'], 'at' => $now];
		}
		bp_history($doc, $user, 'angelegt', null, 'Kopie von „' . bp_plain($src['fields']['titel']['value'] ?? $copyFrom) . '“');
	} else {
		bp_history($doc, $user, 'angelegt');
	}

	$init['autor'] = $init['autor'] ?? $user['name'];
	foreach (['titel', 'artikel', 'artnr', 'autor'] as $fid) {
		if (!isset($init[$fid]) || trim((string) $init[$fid]) === '') continue;
		$doc['fields'][$fid] = ['value' => bp_clean_value($schema[$fid], $init[$fid], null, $user['name'], $now), 'by' => $user['name'], 'at' => $now];
	}
	// Vorgabewerte (z. B. Ablageorte)
	foreach ($schema as $fid => $def) {
		if (isset($doc['fields'][$fid]) || !isset($def['default'])) continue;
		$v = $def['type'] === 'check' ? ['checked' => false, 'text' => $def['default']] : $def['default'];
		$doc['fields'][$fid] = ['value' => bp_clean_value($def, $v, null, $user['name'], $now), 'by' => $user['name'], 'at' => $now];
	}
	bp_contribute($doc, $user, $now);
	bp_write_json($dir . '/blueprint.json', $doc);
	return $doc;
}

function bp_restamp($value, string $by, string $now) {
	if (!is_array($value)) return $value;
	foreach ($value as $k => $v) {
		if (is_array($v)) $value[$k] = bp_restamp($v, $by, $now);
	}
	if (isset($value['id']) && array_key_exists('by', $value)) { $value['by'] = $by; $value['at'] = $now; }
	return $value;
}

/* ---------- Werte bereinigen ---------- */

function bp_plain(string $html): string {
	return trim(html_entity_decode(strip_tags(str_replace(['<br>', '</p>', '</div>', '</li>'], ' ', $html)), ENT_QUOTES | ENT_HTML5, 'UTF-8'));
}

function bp_str($v, int $max = 2000): string {
	$s = is_scalar($v) ? (string) $v : '';
	$s = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F]/u', '', $s) ?? '';
	return mb_substr(trim($s), 0, $max);
}

/** Erlaubt nur einfache Formatierungen aus dem Editor (fett, kursiv, Listen, Markierung, Links). */
function bp_sanitize_html($html): string {
	$html = is_string($html) ? $html : '';
	if (strlen($html) > 400000) throw new BpError('Text ist zu lang', 413);
	if (trim(strip_tags($html, '<img>')) === '' ) return '';
	$allowed = ['b', 'strong', 'i', 'em', 'u', 's', 'br', 'p', 'div', 'ul', 'ol', 'li', 'a', 'mark', 'span', 'sub', 'sup', 'h3', 'h4'];
	$dom = new DOMDocument('1.0', 'UTF-8');
	libxml_use_internal_errors(true);
	$dom->loadHTML('<?xml encoding="UTF-8"><div id="bp-root">' . $html . '</div>', LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD | LIBXML_NONET);
	libxml_clear_errors();
	$root = $dom->getElementById('bp-root');
	if (!$root) return '';
	$walk = function (DOMNode $node) use (&$walk, $allowed, $dom) {
		foreach (iterator_to_array($node->childNodes) as $child) {
			if ($child instanceof DOMElement) {
				$tag = strtolower($child->tagName);
				if (in_array($tag, ['script', 'style', 'iframe', 'object', 'embed', 'template', 'svg', 'math', 'form', 'input', 'textarea', 'button', 'select'], true)) {
					$node->removeChild($child);
					continue;
				}
				$walk($child);
				if (!in_array($tag, $allowed, true)) {
					while ($child->firstChild) $node->insertBefore($child->firstChild, $child);
					$node->removeChild($child);
					continue;
				}
				$keep = [];
				if ($tag === 'a') {
					$href = trim($child->getAttribute('href'));
					if (preg_match('#^(https?://|mailto:|\\\\\\\\|file:)#i', $href)) $keep['href'] = $href;
				}
				if ($tag === 'span' || $tag === 'mark') {
					if (preg_match('/background(?:-color)?\s*:\s*([#a-z0-9(),.\s]+)/i', $child->getAttribute('style'), $m)) {
						$keep['style'] = 'background-color: ' . trim($m[1]);
					}
				}
				foreach (iterator_to_array($child->attributes) as $attr) $child->removeAttribute($attr->name);
				foreach ($keep as $k => $v) $child->setAttribute($k, $v);
				if ($tag === 'a') { $child->setAttribute('target', '_blank'); $child->setAttribute('rel', 'noopener'); }
			} elseif ($child instanceof DOMComment) {
				$node->removeChild($child);
			}
		}
	};
	$walk($root);
	$out = '';
	foreach ($root->childNodes as $c) $out .= $dom->saveHTML($c);
	return trim($out);
}

function bp_clean_media($list, ?array $old, string $id = ''): array {
	$out = [];
	if (!is_array($list)) return $out;
	foreach (array_slice($list, 0, 300) as $m) {
		if (!is_array($m)) continue;
		$file = (string) ($m['file'] ?? '');
		if (!preg_match(BP_FILE_RE, $file)) continue;
		$out[] = [
			'id' => preg_match(BP_ITEM_RE, (string) ($m['id'] ?? '')) ? $m['id'] : bp_rand(5),
			'file' => $file,
			'name' => bp_str($m['name'] ?? $file, 200),
			'mime' => bp_str($m['mime'] ?? '', 100),
			'size' => (int) ($m['size'] ?? 0),
			'caption' => bp_str($m['caption'] ?? '', 500),
		];
	}
	return $out;
}

/** Vergleicht Listeneinträge mit dem gespeicherten Stand und stempelt geänderte Einträge mit Name + Datum. */
function bp_stamp_items(array $items, ?array $oldItems, string $by, string $now): array {
	$old = [];
	foreach ($oldItems ?? [] as $o) if (isset($o['id'])) $old[$o['id']] = $o;
	foreach ($items as &$it) {
		$prev = $old[$it['id']] ?? null;
		$strip = fn($x) => json_encode(array_diff_key($x, ['by' => 1, 'at' => 1]));
		if ($prev && $strip($prev) === $strip($it)) {
			$it['by'] = $prev['by'] ?? $by;
			$it['at'] = $prev['at'] ?? $now;
		} else {
			$it['by'] = $by;
			$it['at'] = $now;
		}
	}
	return $items;
}

function bp_clean_value(array $def, $value, $old, string $by, string $now) {
	switch ($def['type']) {
		case 'text':
			return bp_str($value, 2000);
		case 'date':
			$v = bp_str($value, 10);
			return preg_match('/^\d{4}-\d{2}-\d{2}$/', $v) ? $v : '';
		case 'richtext':
			return bp_sanitize_html($value);
		case 'check':
			return ['checked' => !empty($value['checked']), 'text' => bp_str($value['text'] ?? '', 500)];
		case 'media':
			return bp_stamp_items(bp_clean_media($value, null), is_array($old) ? $old : null, $by, $now);
		case 'offers':
			$items = [];
			foreach (is_array($value) ? array_slice($value, 0, 50) : [] as $o) {
				if (!is_array($o)) continue;
				$items[] = [
					'id' => preg_match(BP_ITEM_RE, (string) ($o['id'] ?? '')) ? $o['id'] : bp_rand(5),
					'media' => bp_clean_media($o['media'] ?? [], null),
					'set' => bp_sanitize_html($o['set'] ?? ''),
					'uvp' => bp_str($o['uvp'] ?? '', 30),
					'preis' => bp_str($o['preis'] ?? '', 30),
				];
			}
			return bp_stamp_items($items, is_array($old) ? $old : null, $by, $now);
		case 'mediaList':
			$items = [];
			foreach (is_array($value) ? array_slice($value, 0, 100) : [] as $o) {
				if (!is_array($o)) continue;
				$items[] = [
					'id' => preg_match(BP_ITEM_RE, (string) ($o['id'] ?? '')) ? $o['id'] : bp_rand(5),
					'title' => bp_str($o['title'] ?? '', 300),
					'note' => bp_sanitize_html($o['note'] ?? ''),
					'media' => bp_clean_media($o['media'] ?? [], null),
				];
			}
			return bp_stamp_items($items, is_array($old) ? $old : null, $by, $now);
	}
	throw new BpError('Unbekannter Feldtyp', 500);
}

function bp_is_empty(array $def, $value): bool {
	switch ($def['type']) {
		case 'richtext': return bp_plain((string) $value) === '';
		case 'check': return empty($value['checked']);
		case 'media': case 'offers': case 'mediaList': return !is_array($value) || count($value) === 0;
		default: return trim((string) $value) === '';
	}
}

function bp_progress(array $doc): array {
	$filled = 0; $total = 0; $missing = [];
	foreach (bp_schema()['fields'] as $fid => $def) {
		$total++;
		if (!bp_is_empty($def, $doc['fields'][$fid]['value'] ?? null)) $filled++;
		else $missing[] = $def['label'];
	}
	return ['filled' => $filled, 'total' => $total, 'percent' => $total ? (int) round($filled / $total * 100) : 0, 'missing' => $missing];
}

/** Dateien, die in irgendeinem Feld verwendet werden. */
function bp_referenced_files(array $doc): array {
	$files = [];
	$walk = function ($v) use (&$walk, &$files) {
		if (!is_array($v)) return;
		if (isset($v['file']) && is_string($v['file'])) $files[$v['file']] = true;
		foreach ($v as $x) $walk($x);
	};
	foreach ($doc['fields'] ?? [] as $f) $walk($f['value'] ?? null);
	return $files;
}

function bp_safe_filename(string $name): string {
	$name = basename(str_replace('\\', '/', $name));
	$ext = strtolower(pathinfo($name, PATHINFO_EXTENSION));
	$base = pathinfo($name, PATHINFO_FILENAME);
	$base = preg_replace('/[^A-Za-z0-9._-]+/', '_', (string) iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $base));
	$base = trim(substr((string) $base, 0, 80), '._-') ?: 'datei';
	$ext = preg_replace('/[^a-z0-9]/', '', $ext);
	return $ext !== '' ? $base . '.' . $ext : $base;
}

function bp_h($s): string {
	return htmlspecialchars((string) $s, ENT_QUOTES | ENT_HTML5, 'UTF-8');
}

function bp_date(?string $iso, bool $time = false): string {
	if (!$iso) return '';
	try { $d = new DateTimeImmutable($iso); } catch (Exception $e) { return ''; }
	return $d->format($time ? 'd.m.Y, H:i' : 'd.m.Y');
}
