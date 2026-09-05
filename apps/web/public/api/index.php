<?php
// Mitradesa API Reverse Proxy Gateway
// Proxies incoming requests to the Node.js Express backend on Hostinger

$backendHost = 'indigo-barracuda-105731.hostingersite.com';
$backendBase = 'https://' . $backendHost;

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
// Only rewrite if NOT already using the full /documents/public/verify/ path
if (strpos($path, '/documents/public/verify/') === false) {
    if (strpos($path, '/public/verify/') !== false) {
        $path = str_replace('/public/verify/', '/documents/public/verify/', $path);
    }
    if (strpos($path, '/public/verifikasi/') !== false) {
        $path = str_replace('/public/verifikasi/', '/documents/public/verify/', $path);
    }
}

$targetUrl = $backendBase . $path . $query;

$ch = curl_init($targetUrl);

curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);

$input = file_get_contents('php://input');
if (!empty($input) || in_array($method, ['POST', 'PUT', 'PATCH'])) {
    curl_setopt($ch, CURLOPT_POSTFIELDS, $input);
}

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

curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HEADER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, false);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
curl_setopt($ch, CURLOPT_TIMEOUT, 60);

// Prevent "getaddrinfo() thread failed to start" on LiteSpeed/CloudLinux thread limits
$resolveList = [];
$dynamicIps = @gethostbynamel($backendHost);
if (!empty($dynamicIps)) {
    foreach ($dynamicIps as $dip) {
        $resolveList[] = "$backendHost:443:$dip";
        $resolveList[] = "$backendHost:80:$dip";
    }
}
$resolveList[] = "$backendHost:443:185.124.137.126";
$resolveList[] = "$backendHost:443:91.108.119.30";
$resolveList[] = "$backendHost:80:185.124.137.126";
$resolveList[] = "$backendHost:80:91.108.119.30";

curl_setopt($ch, CURLOPT_RESOLVE, array_unique($resolveList));
curl_setopt($ch, CURLOPT_IPRESOLVE, CURL_IPRESOLVE_V4);
curl_setopt($ch, CURLOPT_NOSIGNAL, 1);

$response = curl_exec($ch);

if ($response === false) {
    // Fallback: native PHP stream context without cURL threads
    $streamHeaders = [];
    foreach ($headers as $h) {
        $streamHeaders[] = $h;
    }
    $contextOptions = [
        'http' => [
            'method' => $method,
            'header' => implode("\r\n", $streamHeaders),
            'content' => $input,
            'ignore_errors' => true,
            'timeout' => 60,
        ],
        'ssl' => [
            'verify_peer' => false,
            'verify_peer_name' => false,
        ]
    ];
    $ctx = stream_context_create($contextOptions);
    $streamRes = @file_get_contents($targetUrl, false, $ctx);
    if ($streamRes !== false) {
        $httpCode = 200;
        if (isset($http_response_header)) {
            foreach ($http_response_header as $line) {
                if (preg_match('#HTTP/\d\.\d\s+(\d+)#', $line, $matches)) {
                    $httpCode = (int)$matches[1];
                } elseif (!empty($line) && stripos($line, 'Transfer-Encoding:') !== 0) {
                    header($line, false);
                }
            }
        }
        http_response_code($httpCode);
        header("Access-Control-Allow-Origin: $origin", false);
        header("Access-Control-Allow-Credentials: true", false);
        echo $streamRes;
        curl_close($ch);
        exit;
    }

    http_response_code(502);
    header('Content-Type: application/json');
    echo json_encode([
        'success' => false,
        'message' => 'API Gateway Proxy Error: ' . curl_error($ch)
    ]);
    curl_close($ch);
    exit;
}

$headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

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
