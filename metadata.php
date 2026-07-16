<?php
$path = 'https://app.comeleya.com/api/establishment/';
$uri = explode('/', $_SERVER['REQUEST_URI']);
$company = $uri[1];
$data = json_decode(file_get_contents($path . $company), true);
$title = !empty($data['logo']) ? $data['name'] : 'ComeleYa';
$logo = !empty($data['logo']) ? $data['logo'] : 'https://v2.comeleya.com/logo.png';


echo '
<meta property="og:title" content="' . $title . '" />
<meta
  property="og:description"
  content="Menú Digital, Carta Digital, QR, Plataforma para restaurantes, Restaurantes, Platillos en línea, Carta en línea"
/>
<meta property="og:image" content="' . $logo . '" />
<meta property="og:image:width" content="500" />
<meta property="og:image:height" content="500" />
<meta property="og:url" content="https://v2.comeleya.com/' . $company . '" />
<meta property="og:type" content="website" />
';

//print_r($data);


