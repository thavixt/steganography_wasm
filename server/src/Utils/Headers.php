<?php

namespace Steganographix\Utils;

class Headers
{
  public function __construct()
  {
    // phpinfo();
    // Specific origin is required when sending credentials/cookies
    header("Access-Control-Allow-Origin: http://localhost:4123");
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
}
