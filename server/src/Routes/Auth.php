<?php

namespace Steganographix\Routes;

use lbuchs\WebAuthn\WebAuthn;
use Steganographix\Utils\DB;
use Steganographix\Utils\Reply;

class Auth
{
  private array|null $body;

  public function __construct()
  {
    $this->body = json_decode(file_get_contents('php://input'), true);
    $this->me();
    $this->register();
    $this->login();
    $this->logout();
  }

  private function me()
  {
    if (!isset($_GET["me"])) {
      return;
    }
    // Only return data if a verified user is in the session
    if (!isset($_SESSION["loginTime"]) || !isset($_SESSION["email"])) {
      Reply::success();
    }

    $db = new DB();
    $users = $db->query('SELECT * FROM users WHERE email=$1', [$_SESSION["email"]]);

    Reply::success([
      "user_data" => $users[0],
    ]);
  }

  private function getWebAuthn()
  {
    return new WebAuthn(
      "WASM Steganograpy by thavixt@github",
      getenv('WEBAUTHN_RP'),
      ['none', 'packed', 'android-key', 'android-safetynet', 'apple', 'fido-u2f', 'tpm'],
      true,
    );
  }

  private function register()
  {
    if (isset($_GET["fetchArgs"], $this->body["name"], $this->body["email"])) {
      $db = new DB();
      $existingUser = $db->query('SELECT id FROM users WHERE email=$1', [$this->body["email"]]);
      if ($existingUser) {
        Reply::error("Registration failed: email address is already in use.", 400);
      }

      $webAuthn = $this->getWebAuthn();
      $createArgs = $webAuthn->getCreateArgs(
        $this->body["email"],
        $this->body["email"],
        $this->body["name"],
      );
      session_regenerate_id(true);
      // Use temporary keys for the verification step to avoid "pre-logging" the user
      $_SESSION['temp_webauthn_challenge'] = $webAuthn->getChallenge();
      $_SESSION['temp_userId'] = $this->body["email"];
      $_SESSION['temp_email'] = $this->body["email"];
      $_SESSION['temp_name'] = $this->body["name"];
      Reply::success($createArgs);
    }

    if (isset(
      $_GET["processArgs"],
      $this->body["clientDataJSON"],
      $this->body["attestationObject"],
    )) {
      try {
        $clientDataJSON = base64_decode($this->body['clientDataJSON']);
        $attestationObject = base64_decode($this->body['attestationObject']);
        $challenge = $_SESSION['temp_webauthn_challenge'];
        $webAuthn = $this->getWebAuthn();
        $data = $webAuthn->processCreate($clientDataJSON, $attestationObject, $challenge);

        $db = new DB();
        // 1. First, create the user if they don't exist
        // (Note: credentials table has a foreign key to users.id)
        $db->query("INSERT INTO users (email, name, data) VALUES ($1, $2, $3) ON CONFLICT (email) DO NOTHING", [
          $_SESSION['temp_email'],
          $_SESSION['temp_name'],
          json_encode([])
        ]);

        // 2. Save the auth details in db
        // retrieve the last inserted user's id
        $user = $db->query(
          "SELECT id FROM users WHERE email = $1",
          [$_SESSION['temp_email']]
        );
        $db->query("INSERT INTO credentials (user_id, credential_id, public_key, attestation_format) VALUES ($1, $2, $3, $4)", [
          $user[0]['id'],
          base64_encode($data->credentialId),
          $data->credentialPublicKey,
          $data->attestationFormat,
        ]);

        // Finalize login: rotate session ID and promote temp data
        session_regenerate_id(true);
        $_SESSION['email'] = $_SESSION['temp_email'];
        $_SESSION['name'] = $_SESSION['temp_name'];
        $_SESSION['loginTime'] = date(DATE_ATOM);

        unset($_SESSION['temp_email'], $_SESSION['temp_name'], $_SESSION['temp_webauthn_challenge']);

        Reply::success("ok");
      } catch (\Exception $ex) {
        session_destroy();
        var_dump($ex);
        Reply::error($ex);
      }
    }
  }

  private function login()
  {
    // Step 1: Request authentication arguments (challenge)
    if (isset($_GET["loginFetchArgs"], $this->body["email"])) {
      $email = $this->body["email"];
      $db = new DB();

      // Lookup user by email
      $user = $db->query('SELECT * FROM users WHERE email=$1', [$email]);
      if (!$user) {
        Reply::error("User not found", 404);
      }

      $userId = $user[0]['id'];
      $name = $user[0]['name'];

      // Fetch all registered credentials for this user
      $credentials = $db->query('SELECT credential_id FROM credentials WHERE user_id=$1', [$userId]);
      $credentialIds = array_map(fn($c) => base64_decode($c['credential_id']), $credentials);

      if (empty($credentialIds)) {
        Reply::error("No credentials registered for this user", 400);
      }

      $webAuthn = $this->getWebAuthn();
      $getArgs = $webAuthn->getGetArgs($credentialIds);

      // Prepare session for verification step
      session_regenerate_id(true);
      $_SESSION['webauthn_challenge'] = $webAuthn->getChallenge();
      $_SESSION['temp_login_email'] = $email;
      $_SESSION['temp_login_name'] = $name;

      Reply::success($getArgs);
    }

    // Step 2: Process the signed challenge from the client
    if (isset($_GET["loginProcessArgs"], $this->body["id"], $this->body["clientDataJSON"], $this->body["authenticatorData"], $this->body["signature"])) {
      try {
        $id = base64_decode($this->body['id']);
        $clientDataJSON = base64_decode($this->body['clientDataJSON']);
        $authenticatorData = base64_decode($this->body['authenticatorData']);
        $signature = base64_decode($this->body['signature']);
        $challenge = $_SESSION['webauthn_challenge'] ?? null;

        if (!$challenge) {
          throw new \Exception("Authentication challenge not found in session");
        }

        $db = new DB();
        $credential = $db->query('SELECT public_key FROM credentials WHERE credential_id=$1', [base64_encode($id)]);
        if (!$credential) {
          throw new \Exception("Credential not recognized");
        }

        $webAuthn = $this->getWebAuthn();
        $webAuthn->processGet($clientDataJSON, $authenticatorData, $signature, $credential[0]['public_key'], $challenge);

        // Finalize login session: rotate ID and promote temp data
        session_regenerate_id(true);
        $_SESSION['name'] = $_SESSION['temp_login_name'];
        $_SESSION['email'] = $_SESSION['temp_login_email'];
        $_SESSION['loginTime'] = date(DATE_ATOM);

        unset($_SESSION['temp_login_name'], $_SESSION['temp_login_email'], $_SESSION['webauthn_challenge']);

        Reply::success("ok");
      } catch (\Exception $ex) {
        Reply::error($ex->getMessage());
      }
    }
  }

  private function logout()
  {
    if (isset($_GET['logout'])) {
      // 1. Unset all session variables
      $_SESSION = [];

      // 2. Delete the session cookie
      if (ini_get("session.use_cookies")) {
        $params = session_get_cookie_params();
        setcookie(
          session_name(),
          '',
          time() - 42000,
          $params["path"],
          $params["domain"],
          $params["secure"],
          $params["httponly"]
        );
      }

      // 3. Finally, destroy the session data on the server
      session_destroy();
      Reply::success();
    }
  }
}
