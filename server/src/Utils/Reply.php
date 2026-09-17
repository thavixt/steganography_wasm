<?php

namespace Steganographix\Utils;

class Reply
{
  static function error($message = "Unexpected error happened", $code = 400)
  {
    http_response_code($code);
    echo json_encode(["error" => $message]);
    exit;
  }
  static function success($message = "ok", $code = 200)
  {
    http_response_code($code);
    echo json_encode(["response" => $message]);
    exit;
  }
}
