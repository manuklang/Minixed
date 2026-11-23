<?php
// Blueprint · Genius Studios – App-Seite (Übersicht und Editor, Umschaltung über #bp-<id>)
declare(strict_types=1);
require __DIR__ . '/lib.php';

$cfg = bp_config();
$asset = fn($p) => 'assets/' . $p . '?v=' . @filemtime(__DIR__ . '/assets/' . $p);
$client = [
	'maxUploadMb' => (int) $cfg['maxUploadMb'],
	'reopenPin' => $cfg['reopenPin'] !== '',
];
?>
<!doctype html>
<html lang="de">
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
	<meta name="robots" content="noindex, nofollow">
	<title>Blueprint · Genius Studios</title>
	<link rel="icon" href="assets/logo-white.png">
	<link rel="preconnect" href="https://fonts.googleapis.com">
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
	<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@500&display=swap">
	<link rel="stylesheet" href="<?= $asset('app.css') ?>">
</head>
<body>
	<div class="spot" aria-hidden="true"></div><div class="grid-bg" aria-hidden="true"></div>
	<div class="page">
		<header class="bar wrap"><div class="bar-in" id="bar"></div></header>
		<div id="view"></div>
		<div class="wrap">
			<footer class="site">
				<img src="assets/logo-white.png" alt="Genius Studios" width="560" height="247">
				<address>Genius Studios · Im Dachsstück 8 · 65549 Limburg/Lahn<br>Telefon +49 (0) 64 31 – 9 8882222 · <a href="https://genius-studios.de" target="_blank" rel="noopener">genius-studios.de</a></address>
				<span class="claim">Film · Audio · Broadcast</span>
			</footer>
		</div>
	</div>
	<aside class="drawer" id="drawer" aria-label="Verlauf" aria-hidden="true">
		<header><h2>Verlauf</h2><button type="button" class="btn icon" id="drawer-close" aria-label="Verlauf schließen"><i data-icon="x"></i></button></header>
		<div class="list" id="history"></div>
	</aside>
	<noscript><p style="padding:24px">Bitte JavaScript aktivieren.</p></noscript>
	<script>window.BP_CONFIG = <?= json_encode($client) ?>;</script>
	<script src="<?= $asset('vendor/html2pdf.bundle.min.js') ?>" defer></script>
	<script src="<?= $asset('app.js') ?>"></script>
</body>
</html>
