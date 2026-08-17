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

$data = $isLanding
    ? null
    : @json_decode(@file_get_contents($path . rawurlencode($company)), true);

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
} else {
    $title = !empty($data['logo']) ? $restName : 'ComeleYa';
    $desc = 'Menú Digital, Carta Digital, QR, Plataforma para restaurantes, Restaurantes, Platillos en línea, Carta en línea';
    $image = $logo;
    $ogUrl = 'https://' . $host . '/' . rawurlencode($company);
    $ogType = 'website';
}

$e = function ($s) {
    return htmlspecialchars($s === null ? '' : $s, ENT_QUOTES, 'UTF-8');
};

echo '
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
