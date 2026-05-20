<?php

namespace Steganographix\Utils;

class Reply {
  static function error($message = "Invalid/missing arguments")
  {
    echo json_encode(["error" => $message]);
  }
  static function success($response)
  {
    echo json_encode(["response" => $response]);
  }
}