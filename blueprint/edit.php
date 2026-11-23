<?php
// Alte Editor-Adresse: leitet auf die App weiter (index.php#bp-<id>)
$id = preg_replace('/[^a-z0-9-]/', '', (string) ($_GET['id'] ?? ''));
header('Location: ./' . ($id !== '' ? '#bp-' . $id : ''), true, 302);
