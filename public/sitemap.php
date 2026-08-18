<?php
/**
 * Sitemap de comeleya.com.
 *
 * Hasta ahora /sitemap.xml respondia 200 con el HTML del SPA -o sea, un sitemap que
 * no era un sitemap- y robots.txt no declaraba ninguno. Son ~300 menus, cada uno ya
 * con su titulo y su descripcion propios servidos desde metadata.php, y ninguna
 * ayuda para que Google los encuentre.
 *
 * Se arma leyendo el API y se guarda una copia en disco: sin cache, cada visita de
 * un crawler dispararia una consulta al backend, y son varios crawlers pasando todo
 * el dia.
 */

const CACHE = __DIR__ . '/sitemap-cache.xml';
const HORAS = 6;
const API = 'https://app.comeleya.com/api/sitemap';

header('Content-Type: application/xml; charset=UTF-8');

// Copia reciente: se sirve tal cual.
if (file_exists(CACHE) && (time() - filemtime(CACHE)) < HORAS * 3600) {
    readfile(CACHE);
    exit;
}

$ctx = stream_context_create(['http' => ['timeout' => 15]]);
$datos = @json_decode(@file_get_contents(API, false, $ctx), true);
$negocios = isset($datos['establishments']) && is_array($datos['establishments'])
    ? $datos['establishments']
    : [];

// Si el API no contesta y hay una copia vieja, MAS VALE la vieja que un sitemap
// vacio: un sitemap sin URLs le dice a Google que el sitio se quedo sin paginas.
if (!$negocios) {
    if (file_exists(CACHE)) {
        readfile(CACHE);
        exit;
    }
    http_response_code(503);
    exit;
}

$host = 'https://comeleya.com';
$hoy = date('c');

// Las paginas propias primero. La portada con prioridad 1; las legales existen para
// que se puedan consultar, no para competir en busquedas.
$fijas = [
    ['/', '1.0', 'daily'],
    ['/nuevo-establecimiento', '0.8', 'monthly'],
    ['/terminos', '0.3', 'yearly'],
    ['/privacidad', '0.3', 'yearly'],
    ['/eliminar-datos', '0.3', 'yearly'],
    ['/guia-facebook', '0.4', 'yearly'],
];

$xml = new XMLWriter();
$xml->openMemory();
$xml->startDocument('1.0', 'UTF-8');
$xml->startElement('urlset');
$xml->writeAttribute('xmlns', 'http://www.sitemaps.org/schemas/sitemap/0.9');

foreach ($fijas as [$ruta, $prioridad, $frecuencia]) {
    $xml->startElement('url');
    $xml->writeElement('loc', $host . $ruta);
    $xml->writeElement('lastmod', $hoy);
    $xml->writeElement('changefreq', $frecuencia);
    $xml->writeElement('priority', $prioridad);
    $xml->endElement();
}

foreach ($negocios as $n) {
    if (empty($n['slug'])) {
        continue;
    }
    $xml->startElement('url');
    $xml->writeElement('loc', $host . '/' . rawurlencode($n['slug']));
    // La fecha del negocio, no la de hoy: decirle a Google que 300 menus cambiaron
    // esta manana, todas las mananas, es la forma de que deje de mirar el lastmod.
    if (!empty($n['updated_at'])) {
        $xml->writeElement('lastmod', $n['updated_at']);
    }
    $xml->writeElement('changefreq', 'weekly');
    $xml->writeElement('priority', '0.9');
    $xml->endElement();
}

$xml->endElement();
$xml->endDocument();

$salida = $xml->outputMemory();
@file_put_contents(CACHE, $salida);
echo $salida;
