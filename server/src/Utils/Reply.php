<?php

namespace Steganographix\Utils;

class Reply
{
  static function error($message = "Invalid/missing arguments", $code = 400)
  {
    http_response_code($code);
    echo json_encode(["error" => $message]);
    exit;
  }
  static function success($response = "", $code = 200)
  {
    http_response_code($code);
    echo json_encode(["response" => $response]);
    exit;
  }
}
