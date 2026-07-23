<?php
// Metadatos Open Graph para vistas previas (WhatsApp/Facebook, que NO ejecutan JS).
// - Sin ?dish  -> datos del restaurante (logo + nombre).
// - Con ?dish=<id> -> datos del platillo (foto + nombre + precio + descripción),
//   para que al compartir un producto salga la imagen y la info del platillo.

$host = isset($_SERVER['HTTP_HOST']) ? $_SERVER['HTTP_HOST'] : 'comeleya.com';
$path = 'https://app.comeleya.com/api/establishment/';

$uri = explode('/', $_SERVER['REQUEST_URI']);
$company = isset($uri[1]) ? explode('?', $uri[1])[0] : '';

$data = @json_decode(@file_get_contents($path . rawurlencode($company)), true);

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

if ($dish) {
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
if ($dish) {
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
