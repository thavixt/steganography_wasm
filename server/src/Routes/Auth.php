<?php

namespace Steganographix\Routes;

use lbuchs\WebAuthn\WebAuthn;
use Steganographix\Utils\Reply;

const RELYING_PARTY_NAME = "WebAuthn Passkey demo";
const RELYING_PARTY_ID = "localhost";
const ALLOWED_FORMATS = ["none"];
const USE_BASE64_URL_ENCODING = true;

class Auth {
  public function __construct()
  {
    $webAuthn = new WebAuthn(
      RELYING_PARTY_NAME,
      RELYING_PARTY_ID,
      ALLOWED_FORMATS,
      USE_BASE64_URL_ENCODING,
    );

    if (isset($_GET["fetchArgs"])) {
      if (!isset($_GET["userId"], $_GET["userName"], $_GET["userDisplayName"])) {
        Reply::error();
      } else {
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
      }
    }

    if (isset($_GET["processArgs"])) {
      if (!isset($_GET["clientDataJSON"], $_GET["attestationObject"], $_GET["challenge"])) {
        Reply::error();
      } else {
        $res = $webAuthn->processCreate(
          $_GET["clientDataJSON"],
          $_GET["attestationObject"],
          $_GET["challenge"],
        );
        Reply::success("todo");
      }
    }
  }
}