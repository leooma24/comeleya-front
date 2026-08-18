<?php
/**
 * Redirecciones de las URLs del sitio viejo.
 *
 * Google, Bing y Apple siguen mandando gente a /restaurante.php?r=slug y
 * /platillo.php?r=slug&p=id, que son las direcciones del ComeleYa anterior. Hoy esas
 * peticiones caen al SPA, que toma el primer tramo de la ruta como el slug del
 * negocio -o sea "restaurante.php"-, el API contesta 404 y el visitante ve la
 * pantalla de "No pudimos cargar el menu. Revisa tu conexion".
 *
 * En tres dias de log fueron 134 golpes contra 69 negocios distintos, y 67 de esos
 * negocios EXISTEN. Cada uno era un menu que si podia cargar.
 *
 * 301 y no 302: las direcciones viejas no van a volver, y el permanente es el que
 * traspasa el posicionamiento que esas URLs se ganaron en todos estos años.
 */

function legacy_slug()
{
    $r = isset($_GET['r']) ? (string) $_GET['r'] : '';
    // Los slugs son minusculas, digitos y guiones. Todo lo demas fuera: esta cadena
    // va a parar a una cabecera Location.
    return strtolower(preg_replace('/[^a-zA-Z0-9\-]/', '', $r));
}

function legacy_redirect($conPlatillo = false)
{
    $slug = legacy_slug();

    if ($slug === '') {
        $destino = '/';
    } else {
        $destino = '/' . $slug;
        if ($conPlatillo) {
            $p = isset($_GET['p']) ? (int) $_GET['p'] : 0;
            if ($p > 0) {
                // ?dish=<id> es lo que ya entiende metadata.php para la vista previa
                // del platillo, asi que el link viejo conserva su destino exacto.
                $destino .= '?dish=' . $p;
            }
        }
    }

    header('Location: ' . $destino, true, 301);
    exit;
}
