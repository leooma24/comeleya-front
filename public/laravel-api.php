<?php

/*
 * La API de ComeleYa servida desde comeleya.com/api.
 *
 * La API vive en app.comeleya.com y ahi se sigue sirviendo. Esta puerta existe porque
 * comeleya.com y app.comeleya.com estan en la misma IP, hablan HTTP/2 y el certificado
 * de comeleya.com cubre *.comeleya.com. Con eso Safari reutiliza la conexion que ya
 * abrio para el menu (comeleya.com) para pedirle la API a app.comeleya.com, y Apache
 * la rechaza con "421 Misdirected Request". Ese 421 no trae CORS, asi que el navegador
 * lo ve como error de red y el comensal lee "No pudimos cargar el menu · sin conexion".
 * Chrome reintenta solo ante un 421; Safari no. Pegaba sobre todo en los menus
 * incrustados (sushikazuki.com), donde Safari no usa el service worker y abre primero
 * la conexion a comeleya.com.
 *
 * Pidiendole la API al mismo host del menu no hay conexion que reutilizar mal.
 *
 * Requiere:
 *
 * 1. comeleya.com en PHP 8.1 con PHP-FPM (cPanel > MultiPHP), como app.comeleya.com.
 *    Laravel pide 8.1. Forzarlo solo para este archivo con SetHandler no sirve: corre
 *    por CGI con otro usuario, no puede escribir en storage/ y todo responde 500.
 *
 * 2. Este bloque en public_html/.htaccess, dentro de <IfModule mod_rewrite.c> y ANTES
 *    del catch-all del SPA (no esta en el repo: ese archivo trae partes que genera
 *    cPanel y se edita sobre la copia de produccion):
 *
 *     RewriteCond %{HTTP:Authorization} .
 *     RewriteRule ^api/ - [E=HTTP_AUTHORIZATION:%{HTTP:Authorization}]
 *     RewriteRule ^api/ laravel-api.php [L]
 *
 * El nombre no es api/index.php a proposito: con el script dentro de /api, Laravel
 * tomaria /api como la base y buscaria /establishment/... en vez de /api/establishment/...
 */

$laravel = __DIR__ . '/../app.comeleya.com/public/index.php';

// Que Laravel vea la peticion como si hubiera entrado por su propio index.php: asi la
// ruta que calcula es la de la URL completa, /api/..., que es como estan sus rutas.
$_SERVER['SCRIPT_FILENAME'] = $laravel;
$_SERVER['SCRIPT_NAME'] = '/index.php';
$_SERVER['PHP_SELF'] = '/index.php';

require $laravel;
