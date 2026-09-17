<?php

namespace Steganographix\Utils;

class Session
{
  public function __construct()
  {
    // Best Practices for Session Security
    ini_set('session.use_strict_mode', 1);
    ini_set('session.use_only_cookies', 1);
    ini_set('session.cookie_httponly', 1);
    ini_set('session.cookie_samesite', 'Lax');
    // Marking the cookie Secure when the request wasn't actually HTTPS
    // makes browsers silently refuse to store it at all - breaks the direct
    // dev flow (npm run dev:fe hitting the PHP server over plain HTTP)
    // while working fine through Caddy (which sets X-Forwarded-Proto).
    $isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
      || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');
    ini_set('session.cookie_secure', $isHttps ? 1 : 0);

    // 7 day cookie persistence
    ini_set('session.cookie_lifetime', 60 * 60 * 24 * 7);
    session_start();
  }
}
