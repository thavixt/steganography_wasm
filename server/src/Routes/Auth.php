<?php

namespace Steganographix\Routes;

use lbuchs\WebAuthn\WebAuthn;
use Steganographix\Utils\DB;
use Steganographix\Utils\Reply;

const RELYING_PARTY_NAME = "WASM Steganograpy by thavixt@github";
const RELYING_PARTY_ID = "localhost";
// const RELYING_PARTY_ID = "wasm-steganography.komlosidev.net";
const ALLOWED_FORMATS = ['none', 'packed', 'android-key', 'android-safetynet', 'apple', 'fido-u2f', 'tpm'];
const USE_BASE64_URL_ENCODING = true;

class Auth
{
  private array $body;

  public function __construct()
  {
    $this->body = json_decode(file_get_contents('php://input'), true);
    $this->fetchArgs();
    $this->processArgs();
    $this->logout();
  }

  private function getWebAuthn()
  {
    return new WebAuthn(
      RELYING_PARTY_NAME,
      RELYING_PARTY_ID,
      ALLOWED_FORMATS,
      USE_BASE64_URL_ENCODING,
    );
  }

  private function fetchArgs()
  {
    if (!isset($_GET["fetchArgs"], $this->body["userName"], $this->body["userDisplayName"])) {
      return;
    } else {
      session_start();
      $webAuthn = $this->getWebAuthn();
      $userId = preg_replace("/\s/", "", $this->body["userDisplayName"]);
      $createArgs = $webAuthn->getCreateArgs(
        $userId,
        $this->body["userName"],
        $this->body["userDisplayName"],
        // 60,
        // true,
        // true,
      );
      // save the challenge in the session for verification later
      $_SESSION['webauthn_challenge'] = $webAuthn->getChallenge();
      // save details for the processArgs step
      $_SESSION['userId'] = $userId;
      $_SESSION['userName'] = $this->body["userName"];
      $_SESSION['userDisplayName'] = $this->body["userDisplayName"];
      Reply::success($createArgs);
    }
  }

  private function processArgs()
  {
    if (!isset(
      $_GET["processArgs"],
      $this->body["clientDataJSON"],
      $this->body["attestationObject"],
    )) {
      return;
    } else {
      try {
        $clientDataJSON = base64_decode($this->body['clientDataJSON']);
        $attestationObject = base64_decode($this->body['attestationObject']);
        $challenge = $_SESSION['webauthn_challenge'];
        $webAuthn = $this->getWebAuthn();
        $data = $webAuthn->processCreate($clientDataJSON, $attestationObject, $challenge);

        $db = new DB();
        // 1. First, create the user if they don't exist
        // (Note: credentials table has a foreign key to users.id)
        $db->query("INSERT INTO users (username, name, data) VALUES ($1, $2, $3) ON CONFLICT (username) DO NOTHING", [
          $_SESSION['userDisplayName'],
          $_SESSION['userName'],
          json_encode([])
        ]);

        // 2. Save the auth details in db
        // retrieve the last inserted user's id
        $user = $db->query(
          "SELECT id FROM users WHERE username = $1",
          [$_SESSION['userDisplayName']]
        );
        $db->query("INSERT INTO credentials (user_id, credential_id, public_key, attestation_format) VALUES ($1, $2, $3, $4)", [
          $user[0]['id'],
          base64_encode($data->credentialId),
          $data->credentialPublicKey,
          $data->attestationFormat,
        ]);

        Reply::success("ok");
      } catch (\Exception $ex) {
        session_destroy();
        var_dump($ex);
        Reply::error($ex);
      }
    }
  }

  private function logout()
  {
    if (isset($_GET['logout'])) {
      session_destroy();
      Reply::success();
    }
  }
}
