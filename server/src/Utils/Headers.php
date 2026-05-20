<?php

namespace Steganographix\Utils;

class Headers {
  public function __construct()
  {
    // phpinfo();
    // disable CORS for development
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST');
    header("Access-Control-Allow-Headers: X-Requested-With");
    header("Content-Type: application/json");
  }
}