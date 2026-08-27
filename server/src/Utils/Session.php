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
    // If your site is on HTTPS, uncomment the following line:
    // ini_set('session.cookie_secure', 1);

    // 7 day cookie persistence
    ini_set('session.cookie_lifetime', 60 * 60 * 24 * 7);
    session_start();
  }
}
