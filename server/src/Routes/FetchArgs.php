<?php

namespace Steganographix\Routes;

use lbuchs\WebAuthn\WebAuthn;
use Steganographix\Utils\Reply;


class Auth {
  public function __construct()
  {
    $relyingPartyName = "WebAuthn Passkey demo";
    $relyingPartyId = "localhost";
    $allowedFormats = ["none"];
    $useBase64UrlEncoding = true;
    $webAuthn = new WebAuthn(
      $relyingPartyName,
      $relyingPartyId,
      $allowedFormats,
      $useBase64UrlEncoding,
    );

    // fetch args
    if (isset($_GET["fetchArgs"])) {
      if (
        isset($_GET["userId"]) &&
        isset($_GET["userName"]) &&
        isset($_GET["userDisplayName"])
      ) {
        $webAuthn->addRootCertificates("./certs/cacert.pem");
        $args = $webAuthn->getCreateArgs(
          $_GET["userId"],
          $_GET["userName"],
          $_GET["userDisplayName"],
          60,
          true,
          true,
        );
        Reply::success($args);
      } else {
        Reply::error();
      }
    }

    // process args
    if (isset($_GET["processArgs"])) {
      if (
        isset($_GET["clientDataJSON"]) &&
        isset($_GET["attestationObject"]) &&
        isset($_GET["challenge"])
      ) {
        $res = $webAuthn->processCreate(
          $_GET["clientDataJSON"],
          $_GET["attestationObject"],
          $_GET["challenge"],
        );
        Reply::success("todo");
      } else {
        Reply::error();
      }
    }
  }
}

