<?php
// Mitradesa API Reverse Proxy Gateway
// Proxies incoming requests to the Node.js Express backend on Hostinger

$backendHost = 'indigo-barracuda-105731.hostingersite.com';

$requestUri = $_SERVER['REQUEST_URI'];
$method = $_SERVER['REQUEST_METHOD'];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '*';

// Handle CORS preflight
if ($method === 'OPTIONS') {
    header("Access-Control-Allow-Origin: $origin");
    header("Access-Control-Allow-Credentials: true");
    header("Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS");
    header("Access-Control-Allow-Headers: Authorization, Content-Type, X-Requested-With, X-CSRF-Token, X-Request-ID, Accept, Origin");
    header("Access-Control-Max-Age: 86400");
    http_response_code(204);
    exit;
}

// Parse path and query
$parsedUrl = parse_url($requestUri);
$path = $parsedUrl['path'] ?? '/';
$query = isset($parsedUrl['query']) ? '?' . $parsedUrl['query'] : '';

// Ensure path has /api prefix for Express backend routes
if (strpos($path, '/api') !== 0) {
    $path = '/api' . (strpos($path, '/') === 0 ? $path : '/' . $path);
}

// Route aliases for document verification
if (strpos($path, '/documents/public/verify/') === false) {
    if (strpos($path, '/public/verify/') !== false) {
        $path = str_replace('/public/verify/', '/documents/public/verify/', $path);
    }
    if (strpos($path, '/public/verifikasi/') !== false) {
        $path = str_replace('/public/verifikasi/', '/documents/public/verify/', $path);
    }
}

$input = file_get_contents('php://input');

// Build forwarded headers
$headers = [];
$incomingHeaders = function_exists('getallheaders') ? getallheaders() : [];
foreach ($incomingHeaders as $name => $value) {
    $lower = strtolower($name);
    if (in_array($lower, ['host', 'content-length'])) {
        continue;
    }
    $headers[] = "$name: $value";
}
$headers[] = "Host: $backendHost";
$headers[] = 'X-Forwarded-Host: ' . ($_SERVER['HTTP_HOST'] ?? 'api.serunimumbul.com');
$headers[] = 'X-Forwarded-Proto: ' . ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? 'https');
$headers[] = 'X-Forwarded-For: ' . ($_SERVER['REMOTE_ADDR'] ?? '');

// Connect directly to IP literals to completely avoid getaddrinfo() thread creation
$candidateBases = [
    'https://185.124.137.126',
    'https://91.108.119.30',
    'https://127.0.0.1',
    'http://127.0.0.1:3001'
];

$response = false;
$httpCode = 502;
$headerSize = 0;
$lastError = '';

foreach ($candidateBases as $base) {
    $targetUrl = $base . $path . $query;
    $ch = curl_init($targetUrl);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
    if (!empty($input) || in_array($method, ['POST', 'PUT', 'PATCH'])) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, $input);
    }
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HEADER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, false);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 5);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    curl_setopt($ch, CURLOPT_NOSIGNAL, 1);

    $res = curl_exec($ch);
    if ($res !== false) {
        $headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        $response = $res;
        break;
    } else {
        $lastError = curl_error($ch);
        curl_close($ch);
    }
}
if ($response === false) {
    http_response_code(502);
    header('Content-Type: application/json');
    echo json_encode([
        'success' => false,
        'message' => 'API Gateway Proxy Error: ' . $lastError
    ]);
    exit;
}

$rawHeaders = substr($response, 0, $headerSize);
$body = substr($response, $headerSize);

http_response_code($httpCode);

// Forward response headers
$lines = explode("\r\n", $rawHeaders);
foreach ($lines as $line) {
    if (empty($line) || stripos($line, 'HTTP/') === 0 || stripos($line, 'Transfer-Encoding:') === 0) {
        continue;
    }
    header($line, false);
}

// Ensure CORS header on actual response
header("Access-Control-Allow-Origin: $origin", false);
header("Access-Control-Allow-Credentials: true", false);

echo $body;
