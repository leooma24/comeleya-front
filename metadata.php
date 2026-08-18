<?php
// Metadatos Open Graph para vistas previas (WhatsApp/Facebook, que NO ejecutan JS).
// - Sin ?dish  -> datos del restaurante (logo + nombre).
// - Con ?dish=<id> -> datos del platillo (foto + nombre + precio + descripción),
//   para que al compartir un producto salga la imagen y la info del platillo.

$host = isset($_SERVER['HTTP_HOST']) ? $_SERVER['HTTP_HOST'] : 'comeleya.com';
$path = 'https://app.comeleya.com/api/establishment/';

$uri = explode('/', $_SERVER['REQUEST_URI']);
$company = isset($uri[1]) ? explode('?', $uri[1])[0] : '';

// Rutas propias de ComeleYa: no son slugs de negocio, asi que no hay a quien
// consultar. Antes se pedia el API con slug vacio (una peticion tirada por cada
// visita a la landing) y la vista previa quedaba con el logo generico.
$ownRoutes = [
    '', 'privacidad', 'terminos', 'eliminar-datos', 'guia-facebook',
    'nuevo-establecimiento', 'recuperar-contrasena', 'restablecer-contrasena',
    'suscripcion', 'admin',
];
$isLanding = in_array($company, $ownRoutes, true);

// Interesa el CODIGO de la respuesta, no solo el contenido: no es lo mismo que el
// negocio no exista -404, la pagina esta mal y hay que decirlo- a que el API este
// caido -y entonces el menu si existe y no hay que desindexarlo-.
$statusApi = 0;
$data = null;
if (!$isLanding) {
    $crudo = @file_get_contents($path . rawurlencode($company));
    // file_get_contents deja aqui las cabeceras de la respuesta.
    if (isset($http_response_header[0]) && preg_match('#\s(\d{3})\s#', $http_response_header[0], $m)) {
        $statusApi = (int) $m[1];
    }
    if ($crudo !== false) {
        $data = json_decode($crudo, true);
    }
}

// Un slug que no existe respondia 200 con la cascara de la aplicacion. Google lo
// llama soft 404: la trata como pagina de mala calidad y de paso la deja indexada,
// compitiendo con las que si existen. El visitante igual ve el mensaje correcto
// -"No encontramos este restaurante"-, esto es para el buscador.
//
// Solo cuando el API dijo 404. Si esta caido o tardo, el menu SI existe y sacarlo del
// indice por una falla nuestra de cinco minutos costaria semanas de recuperar.
$noExiste = !$isLanding && $statusApi === 404;
if ($noExiste) {
    http_response_code(404);
}

$restName = !empty($data['name']) ? $data['name'] : 'ComeleYa';
$logo = !empty($data['logo']) ? $data['logo'] : 'https://comeleya.com/logo.png';

// ¿Se compartió un platillo específico?
$dishId = isset($_GET['dish']) ? $_GET['dish'] : null;
$dish = null;
if ($dishId && !empty($data['dishes']) && is_array($data['dishes'])) {
    foreach ($data['dishes'] as $d) {
        if (isset($d['id']) && (string) $d['id'] === (string) $dishId) {
            $dish = $d;
            break;
        }
    }
}

if ($isLanding) {
    // Default de la marca: lo que se ve al compartir comeleya.com en WhatsApp o
    // Facebook, y lo que lee Google sin ejecutar JS.
    $title = 'ComeleYa | Menú digital con pedidos por WhatsApp, sin comisiones';
    $desc = 'Menú QR con pedidos por WhatsApp, pagos en línea, seguimiento del pedido, '
        . 'lealtad y analíticas para tu restaurante. Mensualidad fija y 0% de comisión. '
        . '15 días gratis, sin tarjeta.';
    $image = 'https://' . $host . '/og-comeleya.png';
    $ogUrl = 'https://' . $host . '/';
    $ogType = 'website';
    $restName = 'ComeleYa';
} elseif ($dish) {
    $p = (float) ($dish['price'] ?? 0);
    $priceStr = $p == floor($p) ? number_format($p, 0) : number_format($p, 2);
    // Formato: "Negocio - Platillo · $precio"
    $title = $restName . ' - ' . $dish['name'] . ($priceStr !== '' ? ' · $' . $priceStr : '');
    $desc = !empty($dish['description']) ? $dish['description'] : ('Pídelo en ' . $restName);
    $image = !empty($dish['photo']) ? $dish['photo'] : $logo;
    $ogUrl = 'https://' . $host . '/' . rawurlencode($company) . '?dish=' . rawurlencode($dishId);
    $ogType = 'product';
} elseif ($noExiste) {
    $title = 'Este menú no está disponible - ComeleYa';
    $desc = 'No encontramos este restaurante. Puede que haya cambiado de dirección o '
        . 'que ya no esté publicado en ComeleYa.';
    $image = 'https://' . $host . '/og-comeleya.png';
    $ogUrl = 'https://' . $host . '/' . rawurlencode($company);
    $ogType = 'website';
    $restName = 'ComeleYa';
} else {
    // Lo que el dueño escribió en la pestaña SEO de su panel manda. Es la funcion
    // que le cobramos: si la lleno, tiene que salir. Mismos textos de respaldo que
    // usa IndexPage del lado del cliente, para que el HTML del servidor y lo que
    // pinta el SPA digan lo mismo.
    $seo = isset($data['seo']) && is_array($data['seo']) ? $data['seo'] : [];

    $title = !empty($seo['meta_title'])
        ? $seo['meta_title']
        : $restName . ' - Menú Digital';

    $desc = !empty($seo['meta_description'])
        ? $seo['meta_description']
        : 'Ordena en línea en ' . $restName . '. Menú digital, pedidos rápidos y entrega a domicilio.';

    $image = !empty($seo['og_image']) ? $seo['og_image'] : $logo;
    $ogUrl = 'https://' . $host . '/' . rawurlencode($company);
    $ogType = 'website';
}

$e = function ($s) {
    return htmlspecialchars($s === null ? '' : $s, ENT_QUOTES, 'UTF-8');
};

// El <title> sale de aqui y de ningun otro lado: deploy.ps1 borra el estatico del
// build al inyectar este archivo. Antes ese estatico decia "ComeleYa" en las 375
// paginas de menu, asi que un crawler que no ejecuta JavaScript -y varios no lo
// hacen- nunca veia el nombre del restaurante. Justo lo contrario de lo que le
// prometemos al negocio.
// El principio del documento lo emite ESTE archivo, no el build.
//
// Antes el orden era al reves -el build abria <head> y despues incluia esto-, y con
// eso la respuesta ya iba en camino cuando llegabamos aqui: http_response_code() no
// podia cambiar nada y un negocio inexistente seguia respondiendo 200. Emitiendo la
// cabecera desde aqui, el codigo se decide antes de que salga el primer byte.
//
// deploy.ps1 quita el <!DOCTYPE html><html><head> del build al inyectar este include.
// El charset va PEGADO a <head>, antes que nada.
//
// La norma pide que se declare dentro de los primeros 1024 bytes, y este archivo
// escribe titulo, description, OG y JSON-LD: en la portada eso son 4 KB, asi que el
// <meta charset> del build quedaba en el byte 4455. Hoy no se nota porque el
// servidor manda charset en la cabecera HTTP y esa gana, pero es una red que no
// controlamos: basta un cambio de configuracion, o que alguien guarde la pagina, para
// que los acentos se conviertan en simbolos.
echo '<!DOCTYPE html><html><head><meta charset="utf-8" />';

if ($noExiste) {
    // Que no se quede en el indice mientras Google vuelve a pasar.
    echo '<meta name="robots" content="noindex, follow" />' . "
";
}

echo '<title>' . $e($title) . '</title>
<meta name="description" content="' . $e($desc) . '" />
<meta property="og:title" content="' . $e($title) . '" />
<meta property="og:description" content="' . $e($desc) . '" />
<meta property="og:image" content="' . $e($image) . '" />
<meta property="og:url" content="' . $e($ogUrl) . '" />
<meta property="og:type" content="' . $e($ogType) . '" />
<meta property="og:site_name" content="' . $e($restName) . '" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="' . $e($title) . '" />
<meta name="twitter:description" content="' . $e($desc) . '" />
<meta name="twitter:image" content="' . $e($image) . '" />
';

// --- JSON-LD (datos estructurados para Google) ---
// Sin precios ni calificaciones inventadas: solo lo que se puede sostener. Las
// FAQ deben coincidir palabra por palabra con las visibles en MainPage.vue, si no
// Google las ignora (o peor, las marca como spam).
if ($isLanding) {
    $site = 'https://' . $host;
    $faqs = [
        [
            '¿Cuánto tiempo toma configurar mi menú digital?',
            'En menos de 15 minutos. Al registrarte, un asistente paso a paso te guía para subir tu logo, horario, categorías y platillos. Incluso te sugerimos platillos según tu tipo de negocio para que empieces más rápido.',
        ],
        [
            '¿ComeleYa cobra comisión por pedido?',
            'No. ComeleYa no cobra comisiones por pedido. Pagas una mensualidad fija y todos tus ingresos son 100% tuyos. Sin letra chiquita. Compara: UberEats cobra hasta 30% por pedido.',
        ],
        [
            '¿Cómo recibo los pedidos de mis clientes?',
            'Los pedidos llegan directo a tu WhatsApp y a tu panel de administración con todos los detalles: productos, extras, dirección de entrega y método de pago. También puedes recibir notificaciones por email.',
        ],
        [
            '¿Mi cliente puede ver en qué va su pedido?',
            'Sí. Cada pedido genera un link de seguimiento con su código. Tu cliente ve si está confirmado, en preparación, en camino o entregado, y al final puede dejarte una reseña. Tú sólo cambias el estado desde tu panel y, si dejó su correo, le llega el aviso por email.',
        ],
        [
            '¿Cómo cobro el envío a domicilio?',
            'Como te convenga: una tarifa fija o cobro por distancia. Defines una tarifa base con kilómetros incluidos, cuánto cobras por km extra, un radio máximo de entrega y desde qué monto el envío es gratis. El sistema ubica la dirección del cliente y calcula el costo solo.',
        ],
        [
            '¿Puedo aceptar pagos en línea?',
            'Sí, puedes activar pagos con MercadoPago. Tus clientes pagan directo desde el menú y tú recibes el dinero en tu cuenta. También puedes ofrecer pago en efectivo, transferencia o terminal.',
        ],
    ];

    $jsonLd = [
        '@context' => 'https://schema.org',
        '@graph' => [
            [
                '@type' => 'Organization',
                '@id' => $site . '/#organization',
                'name' => 'ComeleYa',
                'url' => $site . '/',
                'logo' => $site . '/logo.png',
                'contactPoint' => [
                    '@type' => 'ContactPoint',
                    'telephone' => '+52 668 818 0202',
                    'email' => 'info@comeleya.com',
                    'contactType' => 'sales',
                    'areaServed' => 'MX',
                    'availableLanguage' => 'es',
                ],
            ],
            [
                '@type' => 'WebSite',
                '@id' => $site . '/#website',
                'name' => 'ComeleYa',
                'url' => $site . '/',
                'publisher' => ['@id' => $site . '/#organization'],
                'inLanguage' => 'es-MX',
            ],
            [
                '@type' => 'SoftwareApplication',
                'name' => 'ComeleYa',
                'applicationCategory' => 'BusinessApplication',
                'operatingSystem' => 'Web',
                'url' => $site . '/',
                'description' => $desc,
                'publisher' => ['@id' => $site . '/#organization'],
            ],
            [
                '@type' => 'FAQPage',
                'mainEntity' => array_map(function ($faq) {
                    return [
                        '@type' => 'Question',
                        'name' => $faq[0],
                        'acceptedAnswer' => ['@type' => 'Answer', 'text' => $faq[1]],
                    ];
                }, $faqs),
            ],
        ],
    ];
} elseif ($dish) {
    $jsonLd = [
        '@context' => 'https://schema.org/',
        '@type' => 'Product',
        'name' => $dish['name'],
        'image' => $image,
        'description' => $desc,
        'brand' => ['@type' => 'Brand', 'name' => $restName],
        'offers' => [
            '@type' => 'Offer',
            'price' => number_format((float) ($dish['price'] ?? 0), 2, '.', ''),
            'priceCurrency' => 'MXN',
            'availability' => empty($dish['is_sold_out'])
                ? 'https://schema.org/InStock'
                : 'https://schema.org/OutOfStock',
            'url' => $ogUrl,
        ],
    ];
} else {
    $jsonLd = [
        '@context' => 'https://schema.org/',
        '@type' => 'Restaurant',
        'name' => $restName,
        'image' => $image,
        'url' => $ogUrl,
    ];
    if (!empty($data['phone'])) {
        $jsonLd['telephone'] = $data['phone'];
    }
}

echo '<script type="application/ld+json">'
    . json_encode($jsonLd, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)
    . '</script>';
