<?php
// Blueprint – Übersicht aller Blueprints
declare(strict_types=1);
require __DIR__ . '/lib.php';

$cfg = bp_config();
$error = null;
try {
	$docs = bp_list();
	$users = bp_users();
} catch (Throwable $e) {
	$docs = []; $users = [];
	$error = $e->getMessage();
}
$counts = ['all' => count($docs), 'draft' => 0, 'approved' => 0];
foreach ($docs as $d) $counts[($d['status'] ?? 'draft') === 'approved' ? 'approved' : 'draft']++;
$v = fn($d, $k) => (string) ($d['fields'][$k]['value'] ?? '');
$asset = fn($p) => 'assets/' . $p . '?v=' . @filemtime(__DIR__ . '/assets/' . $p);
?>
<!doctype html>
<html lang="de">
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<meta name="robots" content="noindex, nofollow">
	<title>Blueprints · Übersicht</title>
	<link rel="stylesheet" href="<?= $asset('app.css') ?>">
	<link rel="icon" href="assets/genius-logo.png">
</head>
<body>
	<header class="appbar">
		<div class="crumb">
			<img class="logo" src="assets/genius-logo.png" alt="Genius">
			<span class="sep" aria-hidden="true"></span>
			<span class="doc-title">Blueprint · Produktionsvorbereitung</span>
		</div>
		<div class="tools">
			<button type="button" class="chip-user" id="user-chip" hidden></button>
		</div>
	</header>

	<main class="page">
		<div class="page-head">
			<div class="grow">
				<h1>Blueprints</h1>
				<p>Alle Produktions-Blueprints im Überblick – gemeinsam befüllen, freigeben, als PDF ablegen.</p>
			</div>
			<button type="button" class="btn primary" id="btn-new">
				<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 3v10M3 8h10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
				Neuer Blueprint
			</button>
		</div>

		<?php if ($error): ?>
			<div class="notice warn">Die Blueprints konnten nicht geladen werden: <?= bp_h($error) ?></div>
		<?php endif; ?>

		<?php if ($docs): ?>
		<div class="stats">
			<div class="stat"><b><?= $counts['all'] ?></b><span>Blueprints gesamt</span></div>
			<div class="stat"><b><?= $counts['draft'] ?></b><span>in Bearbeitung</span></div>
			<div class="stat"><b><?= $counts['approved'] ?></b><span>freigegeben</span></div>
		</div>

		<div class="filters">
			<input class="in" type="search" id="q" placeholder="Suchen nach Titel, Artikel, Art.-Nr., Person …" aria-label="Blueprints durchsuchen">
			<div class="seg" role="group" aria-label="Status filtern">
				<button type="button" data-f="all" aria-pressed="true">Alle</button>
				<button type="button" data-f="draft" aria-pressed="false">In Bearbeitung</button>
				<button type="button" data-f="approved" aria-pressed="false">Freigegeben</button>
			</div>
		</div>

		<table class="index-table">
			<thead>
				<tr>
					<th>Projekt / Artikel</th>
					<th>Art.-Nr.</th>
					<th>Status</th>
					<th>Beteiligte</th>
					<th>Fortschritt</th>
					<th>Stand</th>
					<th><span class="sr-only">Aktionen</span></th>
				</tr>
			</thead>
			<tbody>
			<?php foreach ($docs as $d):
				$p = bp_progress($d);
				$approved = ($d['status'] ?? '') === 'approved';
				$names = array_keys($d['contributors'] ?? []);
				$search = mb_strtolower(implode(' ', [$v($d, 'titel'), $v($d, 'artikel'), $v($d, 'artnr'), $v($d, 'autor'), implode(' ', $names)]));
			?>
				<tr data-status="<?= $approved ? 'approved' : 'draft' ?>" data-search="<?= bp_h($search) ?>">
					<td class="t-title">
						<a href="edit.php?id=<?= bp_h($d['id']) ?>"><?= bp_h($v($d, 'titel') ?: 'Ohne Titel') ?></a>
						<small><?= bp_h($v($d, 'artikel') ?: '—') ?></small>
					</td>
					<td class="nowrap"><?= bp_h($v($d, 'artnr') ?: '—') ?></td>
					<td>
						<?php if ($approved): ?>
							<span class="pill approved" title="Freigegeben von <?= bp_h($d['approval']['by'] ?? '') ?>">Freigegeben v<?= (int) ($d['approval']['version'] ?? 1) ?></span>
							<div class="muted" style="font-size:12px;margin-top:3px"><?= bp_h(bp_date($d['approval']['at'] ?? null)) ?> · <?= bp_h($d['approval']['by'] ?? '') ?></div>
						<?php else: ?>
							<span class="pill draft">In Bearbeitung</span>
						<?php endif; ?>
					</td>
					<td><span class="avatars" data-names="<?= bp_h(json_encode($names, JSON_UNESCAPED_UNICODE)) ?>"></span></td>
					<td>
						<div class="progress" title="<?= $p['filled'] ?> von <?= $p['total'] ?> Bereichen befüllt">
							<div class="track"><div class="fill" style="width:<?= $p['percent'] ?>%"></div></div>
							<span class="num"><?= $p['percent'] ?>%</span>
						</div>
					</td>
					<td class="nowrap">
						<?= bp_h(bp_date($d['updatedAt'] ?? null)) ?>
						<div class="muted" style="font-size:12px"><?= bp_h($d['updatedBy'] ?? '') ?></div>
					</td>
					<td class="t-actions">
						<?php if ($approved && !empty($d['approval']['pdf'])): ?>
							<a class="btn small" href="file.php?id=<?= bp_h($d['id']) ?>&amp;pdf=<?= bp_h(rawurlencode($d['approval']['pdf'])) ?>" target="_blank" rel="noopener">PDF</a>
						<?php endif; ?>
						<button type="button" class="btn small ghost" data-copy="<?= bp_h($d['id']) ?>" data-title="<?= bp_h($v($d, 'titel')) ?>" title="Als Vorlage für einen neuen Blueprint verwenden">Duplizieren</button>
						<?php if (!$approved): ?>
							<button type="button" class="btn small ghost danger" data-del="<?= bp_h($d['id']) ?>" data-title="<?= bp_h($v($d, 'titel')) ?>">Löschen</button>
						<?php endif; ?>
					</td>
				</tr>
			<?php endforeach; ?>
			</tbody>
		</table>
		<p class="empty" id="no-hits" hidden>Keine Blueprints gefunden.</p>
		<?php else: ?>
			<div class="empty">
				<h2>Noch keine Blueprints</h2>
				<p>Leg den ersten Blueprint an – danach können alle Beteiligten ihre Bereiche befüllen.</p>
				<button type="button" class="btn primary" onclick="document.getElementById('btn-new').click()">Ersten Blueprint anlegen</button>
			</div>
		<?php endif; ?>
	</main>

	<script>
		window.BP_TEMPLATES = <?= json_encode(array_map(fn($d) => ['id' => $d['id'], 'titel' => $v($d, 'titel'), 'artikel' => $v($d, 'artikel')], $docs), JSON_UNESCAPED_UNICODE | JSON_HEX_TAG | JSON_HEX_AMP) ?>;
		window.BP_USERS = <?= json_encode((object) $users, JSON_UNESCAPED_UNICODE | JSON_HEX_TAG | JSON_HEX_AMP) ?>;
	</script>
	<script src="<?= $asset('common.js') ?>"></script>
	<script src="<?= $asset('index.js') ?>"></script>
</body>
</html>
