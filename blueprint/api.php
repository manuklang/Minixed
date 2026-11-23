<?php
// Blueprint – JSON-API
declare(strict_types=1);
require __DIR__ . '/lib.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

function bp_out(array $data, int $code = 200): void {
	http_response_code($code);
	echo json_encode($data + ['ok' => $code < 400], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
	exit;
}

function bp_input(): array {
	if (!empty($_POST)) return $_POST;
	$raw = file_get_contents('php://input');
	$data = $raw ? json_decode($raw, true) : [];
	return is_array($data) ? $data : [];
}

function bp_public(array $doc): array {
	$doc['progress'] = bp_progress($doc);
	return $doc;
}

function bp_require_draft(array $doc): void {
	if (($doc['status'] ?? 'draft') === 'approved') throw new BpError('Dieser Blueprint ist freigegeben und gesperrt', 423);
}

try {
	$action = (string) ($_GET['action'] ?? '');
	$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
	if ($method === 'POST' && empty($_POST) && empty($_FILES) && (int) ($_SERVER['CONTENT_LENGTH'] ?? 0) > 0 && stripos($_SERVER['CONTENT_TYPE'] ?? '', 'multipart') !== false) {
		throw new BpError('Upload zu groß für die Server-Einstellungen (post_max_size)', 413);
	}
	$in = $method === 'POST' ? bp_input() : $_GET;

	switch ($action) {

		case 'list':
			$list = array_map(function ($d) {
				return [
					'id' => $d['id'],
					'titel' => $d['fields']['titel']['value'] ?? '',
					'artikel' => $d['fields']['artikel']['value'] ?? '',
					'status' => $d['status'] ?? 'draft',
					'updatedAt' => $d['updatedAt'] ?? null,
				];
			}, bp_list());
			bp_out(['items' => $list]);

		case 'get':
			$doc = bp_load((string) ($in['id'] ?? ''));
			if (isset($in['since']) && (int) $in['since'] === (int) ($doc['rev'] ?? 0)) bp_out(['changed' => false]);
			bp_out(['changed' => true, 'doc' => bp_public($doc), 'users' => bp_users()]);

		case 'create':
			if ($method !== 'POST') throw new BpError('POST erwartet', 405);
			$user = bp_clean_user($in);
			bp_touch_user($user);
			$copy = isset($in['copyFrom']) && $in['copyFrom'] !== '' ? (string) $in['copyFrom'] : null;
			if ($copy !== null && !bp_exists($copy)) throw new BpError('Vorlage nicht gefunden', 404);
			$doc = bp_create($user, [
				'titel' => $in['titel'] ?? '',
				'artikel' => $in['artikel'] ?? '',
				'artnr' => $in['artnr'] ?? '',
			], $copy);
			bp_out(['id' => $doc['id']]);

		case 'save':
			if ($method !== 'POST') throw new BpError('POST erwartet', 405);
			$user = bp_clean_user($in);
			$fid = (string) ($in['field'] ?? '');
			$def = bp_schema()['fields'][$fid] ?? null;
			if (!$def) throw new BpError('Unbekanntes Feld', 400);
			$conflict = null; $changed = false;
			$doc = bp_transaction((string) ($in['id'] ?? ''), function (array &$doc) use ($in, $user, $fid, $def, &$conflict, &$changed) {
				bp_require_draft($doc);
				$cur = $doc['fields'][$fid] ?? null;
				// Konflikt: jemand anderes hat das Feld geändert, seit es geladen wurde
				$base = $in['base'] ?? null;
				if ($cur && empty($in['force']) && ($cur['at'] ?? null) !== $base && ($cur['by'] ?? '') !== $user['name']) {
					$conflict = $cur;
					return false;
				}
				$now = bp_now();
				$value = bp_clean_value($def, $in['value'] ?? null, $cur['value'] ?? null, $user['name'], $now);
				if ($cur && json_encode($cur['value']) === json_encode($value)) return false;
				$doc['fields'][$fid] = ['value' => $value, 'by' => $user['name'], 'at' => $now];
				// Mehrere Änderungen derselben Person am selben Feld innerhalb von 10 Min. zusammenfassen
				$last = end($doc['history']);
				if (!($last && ($last['field'] ?? null) === $fid && $last['by'] === $user['name'] && $last['action'] === 'bearbeitet' && strtotime($now) - strtotime($last['at']) < 600)) {
					bp_history($doc, $user, 'bearbeitet', $fid);
				} else {
					$doc['history'][count($doc['history']) - 1]['at'] = $now;
				}
				bp_contribute($doc, $user, $now);
				$changed = true;
				return true;
			});
			bp_touch_user($user);
			if ($conflict) bp_out(['error' => 'Konflikt', 'field' => $conflict, 'rev' => $doc['rev']], 409);
			bp_out(['field' => $doc['fields'][$fid] ?? null, 'rev' => $doc['rev'], 'updatedAt' => $doc['updatedAt'], 'progress' => bp_progress($doc), 'changed' => $changed]);

		case 'upload':
			if ($method !== 'POST') throw new BpError('POST erwartet', 405);
			$user = bp_clean_user($in);
			$id = (string) ($in['id'] ?? '');
			bp_require_draft(bp_load($id));
			$f = $_FILES['file'] ?? null;
			if (!$f || ($f['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
				$err = $f['error'] ?? UPLOAD_ERR_NO_FILE;
				throw new BpError(in_array($err, [UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE], true) ? 'Datei ist zu groß für die Server-Einstellungen (upload_max_filesize)' : 'Upload fehlgeschlagen', 400);
			}
			$cfg = bp_config();
			if ($f['size'] > $cfg['maxUploadMb'] * 1024 * 1024) throw new BpError('Datei ist größer als ' . $cfg['maxUploadMb'] . ' MB', 413);
			$safe = bp_safe_filename((string) $f['name']);
			$ext = strtolower(pathinfo($safe, PATHINFO_EXTENSION));
			if (in_array($ext, $cfg['blockedExtensions'], true)) throw new BpError('Dieser Dateityp ist nicht erlaubt', 415);
			$file = bp_rand(4) . '-' . $safe;
			$target = bp_dir($id) . '/media/' . $file;
			if (!is_dir(dirname($target))) mkdir(dirname($target), 0775, true);
			if (!move_uploaded_file($f['tmp_name'], $target)) throw new BpError('Datei konnte nicht gespeichert werden', 500);
			$mime = (new finfo(FILEINFO_MIME_TYPE))->file($target) ?: 'application/octet-stream';
			bp_out(['media' => ['id' => bp_rand(5), 'file' => $file, 'name' => bp_str($f['name'], 200), 'mime' => $mime, 'size' => (int) $f['size'], 'caption' => '']]);

		case 'approve':
			if ($method !== 'POST') throw new BpError('POST erwartet', 405);
			$user = bp_clean_user($in);
			$id = (string) ($in['id'] ?? '');
			$pdf = $_FILES['pdf'] ?? null;
			if (!$pdf || $pdf['error'] !== UPLOAD_ERR_OK) throw new BpError('PDF fehlt', 400);
			if (file_get_contents($pdf['tmp_name'], false, null, 0, 5) !== '%PDF-') throw new BpError('Ungültige PDF-Datei', 400);
			$doc = bp_transaction($id, function (array &$doc) use ($user, $pdf, $in, $id) {
				bp_require_draft($doc);
				$now = bp_now();
				$version = count($doc['approvals'] ?? []) + 1;
				$name = 'Blueprint_' . bp_slug($doc['fields']['titel']['value'] ?? $id) . '_v' . $version . '.pdf';
				$dir = bp_dir($id) . '/pdf';
				if (!is_dir($dir)) mkdir($dir, 0775, true);
				if (!move_uploaded_file($pdf['tmp_name'], $dir . '/' . $name)) throw new BpError('PDF konnte nicht gespeichert werden', 500);
				$approval = ['version' => $version, 'by' => $user['name'], 'at' => $now, 'pdf' => $name, 'note' => bp_str($in['note'] ?? '', 1000)];
				$doc['status'] = 'approved';
				$doc['approval'] = $approval;
				$doc['approvals'][] = $approval;
				bp_history($doc, $user, 'freigegeben', null, 'Version ' . $version . ($approval['note'] ? ' – ' . $approval['note'] : ''));
				bp_contribute($doc, $user, $now);
				return true;
			});
			bp_touch_user($user);
			bp_out(['doc' => bp_public($doc)]);

		case 'reopen':
			if ($method !== 'POST') throw new BpError('POST erwartet', 405);
			$user = bp_clean_user($in);
			$pin = (string) bp_config()['reopenPin'];
			if ($pin !== '' && !hash_equals($pin, (string) ($in['pin'] ?? ''))) throw new BpError('PIN ist falsch', 403);
			$reason = bp_str($in['reason'] ?? '', 500);
			if ($reason === '') throw new BpError('Bitte einen Grund angeben', 400);
			$doc = bp_transaction((string) ($in['id'] ?? ''), function (array &$doc) use ($user, $reason) {
				if (($doc['status'] ?? '') !== 'approved') return false;
				$doc['status'] = 'draft';
				$doc['approval'] = null;
				bp_history($doc, $user, 'Freigabe aufgehoben', null, $reason);
				bp_contribute($doc, $user, bp_now());
				return true;
			});
			bp_out(['doc' => bp_public($doc)]);

		case 'delete':
			if ($method !== 'POST') throw new BpError('POST erwartet', 405);
			$user = bp_clean_user($in);
			$id = (string) ($in['id'] ?? '');
			$doc = bp_load($id);
			bp_require_draft($doc);
			// Nicht endgültig löschen, sondern in den Papierkorb verschieben
			$trash = bp_data_dir() . '/_papierkorb';
			if (!is_dir($trash)) mkdir($trash, 0775, true);
			$doc['deletedBy'] = $user['name'];
			$doc['deletedAt'] = bp_now();
			bp_write_json(bp_dir($id) . '/blueprint.json', $doc);
			if (!rename(bp_dir($id), $trash . '/' . $id)) throw new BpError('Löschen fehlgeschlagen', 500);
			bp_out([]);

		case 'cleanup':
			// Hochgeladene, aber nicht (mehr) verwendete Dateien entfernen
			if ($method !== 'POST') throw new BpError('POST erwartet', 405);
			$id = (string) ($in['id'] ?? '');
			$doc = bp_load($id);
			bp_require_draft($doc);
			$used = bp_referenced_files($doc);
			$removed = 0;
			foreach (glob(bp_dir($id) . '/media/*') ?: [] as $f) {
				if (!isset($used[basename($f)]) && filemtime($f) < time() - 3600) { unlink($f); $removed++; }
			}
			bp_out(['removed' => $removed]);

		default:
			throw new BpError('Unbekannte Aktion', 404);
	}
} catch (BpError $e) {
	bp_out(['error' => $e->getMessage()], $e->getCode() ?: 400);
} catch (Throwable $e) {
	error_log('[blueprint] ' . $e);
	bp_out(['error' => 'Serverfehler: ' . $e->getMessage()], 500);
}
