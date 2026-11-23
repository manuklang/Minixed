<?php
// Blueprint – Produktionsvorbereitung: Konfiguration
// Alle Werte können hier angepasst werden.

return [
	// Name der Anwendung (Browser-Titel, Übersicht)
	'appName' => 'Blueprint · Produktionsvorbereitung',

	// Zeitzone für Datum/Uhrzeit der Markierungen
	'timezone' => 'Europe/Berlin',

	// Ablageort für Blueprints, Medien und erzeugte PDFs.
	// Muss für den Webserver beschreibbar sein und darf NICHT direkt
	// ausgeliefert werden (data/.htaccess sperrt den Zugriff für Apache).
	'dataDir' => __DIR__ . '/data',

	// Maximale Größe pro Upload in MB. Zusätzlich gelten die PHP-Limits
	// upload_max_filesize und post_max_size (siehe README).
	'maxUploadMb' => 1024,

	// Diese Dateiendungen werden beim Upload abgelehnt.
	'blockedExtensions' => ['php', 'php3', 'php4', 'php5', 'php7', 'php8', 'phtml', 'phar', 'pht', 'cgi', 'pl', 'py', 'sh', 'exe', 'bat', 'cmd', 'htaccess', 'htpasswd'],

	// PIN, um eine Freigabe wieder aufzuheben. Leer = jeder darf aufheben
	// (die Aufhebung wird trotzdem im Verlauf protokolliert).
	'reopenPin' => '',

	// Wie viele Verlaufseinträge pro Blueprint gespeichert werden.
	'historyLimit' => 1000,
];
