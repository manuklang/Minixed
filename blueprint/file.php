<?php
// Blueprint – liefert hochgeladene Medien und freigegebene PDFs aus
declare(strict_types=1);
require __DIR__ . '/lib.php';

try {
	$id = (string) ($_GET['id'] ?? '');
	$isPdf = isset($_GET['pdf']);
	$name = (string) ($isPdf ? $_GET['pdf'] : ($_GET['f'] ?? ''));
	if (!preg_match(BP_FILE_RE, $name)) throw new BpError('Ungültiger Dateiname', 400);
	$path = bp_dir($id) . ($isPdf ? '/pdf/' : '/media/') . $name;
	if (!is_file($path)) throw new BpError('Datei nicht gefunden', 404);
} catch (BpError $e) {
	http_response_code($e->getCode() ?: 400);
	header('Content-Type: text/plain; charset=utf-8');
	echo $e->getMessage();
	exit;
}

$mime = (new finfo(FILEINFO_MIME_TYPE))->file($path) ?: 'application/octet-stream';
$inlineTypes = '#^(image/(png|jpe?g|gif|webp|avif|bmp)|video/|audio/|application/pdf$|text/plain$)#';
$inline = preg_match($inlineTypes, $mime) && !isset($_GET['download']);
$display = $_GET['name'] ?? ($isPdf ? $name : preg_replace('/^[a-f0-9]{8}-/', '', $name));
$display = str_replace(['"', "\r", "\n"], '', (string) $display);

$size = filesize($path);
$start = 0;
$end = $size - 1;

header('X-Content-Type-Options: nosniff');
if ($mime !== 'application/pdf') header("Content-Security-Policy: default-src 'none'; img-src 'self'; media-src 'self'; style-src 'unsafe-inline'; sandbox");
header('Content-Type: ' . ($inline ? $mime : 'application/octet-stream'));
header('Content-Disposition: ' . ($inline ? 'inline' : 'attachment') . '; filename="' . $display . '"; filename*=UTF-8\'\'' . rawurlencode($display));
header('Accept-Ranges: bytes');
header('Cache-Control: private, max-age=86400');

// Range-Anfragen (wichtig zum Spulen in Videos)
if (isset($_SERVER['HTTP_RANGE']) && preg_match('/bytes=(\d*)-(\d*)/', $_SERVER['HTTP_RANGE'], $m)) {
	if ($m[1] === '' && $m[2] !== '') { $start = max(0, $size - (int) $m[2]); }
	else { $start = (int) $m[1]; if ($m[2] !== '') $end = min((int) $m[2], $size - 1); }
	if ($start > $end || $start >= $size) {
		http_response_code(416);
		header("Content-Range: bytes */$size");
		exit;
	}
	http_response_code(206);
	header("Content-Range: bytes $start-$end/$size");
}
header('Content-Length: ' . ($end - $start + 1));

$fp = fopen($path, 'rb');
fseek($fp, $start);
$left = $end - $start + 1;
while ($left > 0 && !feof($fp)) {
	$chunk = fread($fp, (int) min(1024 * 256, $left));
	if ($chunk === false) break;
	echo $chunk;
	$left -= strlen($chunk);
	flush();
}
fclose($fp);
