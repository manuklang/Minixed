<?php
// Blueprint – Editor / Ansicht eines Blueprints
declare(strict_types=1);
require __DIR__ . '/lib.php';

$id = (string) ($_GET['id'] ?? '');
try {
	$doc = bp_load($id);
} catch (BpError $e) {
	http_response_code($e->getCode() ?: 404);
	echo '<!doctype html><meta charset="utf-8"><title>Blueprint nicht gefunden</title><p style="font-family:sans-serif;padding:40px">' . bp_h($e->getMessage()) . ' – <a href="./">zur Übersicht</a></p>';
	exit;
}
$doc['progress'] = bp_progress($doc);
$title = (string) ($doc['fields']['titel']['value'] ?? 'Blueprint');
$asset = fn($p) => 'assets/' . $p . '?v=' . @filemtime(__DIR__ . '/assets/' . $p);
$json = fn($x) => json_encode($x, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS);
?>
<!doctype html>
<html lang="de">
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<meta name="robots" content="noindex, nofollow">
	<title><?= bp_h($title) ?> · Blueprint</title>
	<link rel="stylesheet" href="<?= $asset('app.css') ?>">
	<link rel="icon" href="assets/genius-logo.png">
</head>
<body>
	<header class="appbar">
		<div class="crumb">
			<a class="back" href="./" title="Zur Übersicht">← Übersicht</a>
			<span class="sep" aria-hidden="true"></span>
			<span class="doc-title" id="doc-title"><?= bp_h($title) ?></span>
			<span id="status-pill"></span>
		</div>
		<div class="tools">
			<span class="save-state" id="save-state" aria-live="polite"></span>
			<label class="btn ghost small" title="Farbige Namens-Markierungen ein-/ausblenden">
				<input type="checkbox" id="toggle-marks" checked style="margin:0"> Markierungen
			</label>
			<button type="button" class="btn small" id="btn-history">Verlauf</button>
			<button type="button" class="btn small" id="btn-preview">PDF-Vorschau</button>
			<button type="button" class="btn approve" id="btn-approve">Freigeben</button>
			<button type="button" class="chip-user" id="user-chip"></button>
		</div>
	</header>

	<div class="desk">
		<div id="banner"></div>
		<div class="legend" id="legend"></div>
		<article class="sheet marks" id="sheet" aria-label="Blueprint"></article>
	</div>

	<aside class="drawer" id="drawer" aria-label="Verlauf" aria-hidden="true">
		<header><h2>Verlauf</h2><button type="button" class="btn small ghost" id="drawer-close">Schließen</button></header>
		<div class="list" id="history"></div>
	</aside>

	<script>
		window.BP_SCHEMA = <?= $json(bp_schema()) ?>;
		window.BP_DOC = <?= $json($doc) ?>;
		window.BP_USERS = <?= $json((object) bp_users()) ?>;
		window.BP_PIN = <?= $json(bp_config()['reopenPin'] !== '') ?>;
	</script>
	<script src="<?= $asset('vendor/html2pdf.bundle.min.js') ?>" defer></script>
	<script src="<?= $asset('common.js') ?>"></script>
	<script src="<?= $asset('pdf.js') ?>"></script>
	<script src="<?= $asset('editor.js') ?>"></script>
</body>
</html>
