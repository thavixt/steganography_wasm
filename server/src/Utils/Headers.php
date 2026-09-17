<?php

namespace Steganographix\Utils;

class Headers
{
  public function __construct()
  {
    // A credentialed (cookie-carrying) cross-origin request needs the
    // *exact* requesting origin echoed back, not a fixed value - a mismatch
    // makes the browser silently refuse to use the Set-Cookie session
    // response, and CADDY_SITE_ADDRESS alone doesn't cover the direct dev
    // flow (npm run dev:fe hitting this server straight from Vite's own
    // origin, bypassing Caddy).
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    if ($this->isAllowedOrigin($origin)) {
      header("Access-Control-Allow-Origin: $origin");
      header("Vary: Origin");
    }
    header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, X-Requested-With, Authorization");
    header("Access-Control-Allow-Credentials: true");
    header("Content-Type: application/json");

    // Handle preflight requests
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
      http_response_code(204);
      exit;
    }
  }

  private function isAllowedOrigin(string $origin): bool
  {
    if ($origin === '') {
      return false;
    }
    if ($origin === getenv('CADDY_SITE_ADDRESS')) {
      return true;
    }
    // Any localhost origin/port - covers the Vite dev server directly,
    // whichever port it landed on (it bumps up if 4123 is taken).
    return (bool) preg_match('#^https?://localhost(:\d+)?$#', $origin);
  }
}
