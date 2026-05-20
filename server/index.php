<?php
// phpinfo();
require 'vendor/autoload.php';
use lbuchs\WebAuthn\WebAuthn;

// disable CORS for development
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
header("Access-Control-Allow-Headers: X-Requested-With");
header("Content-Type: application/json");

function replyError($message = "Invalid/missing arguments")
{
  echo json_encode(["error" => $message]);
}
function replySuccess($response)
{
  echo json_encode(["response" => $response]);
}

// greetings
if (isset($_GET["welcome"])) {
  $name = $_GET["name"] ?? "world";

  $db_host = getenv('DB_HOST') ?: 'wasm-postgres';
  $db_name = getenv('DB_NAME') ?: 'stego_wasm';
  $db_user = getenv('DB_USER') ?: 'admin';
  $db_pass = getenv('DB_PASS') ?: 'admin';

  $dbconn = @pg_connect("host=$db_host dbname=$db_name user=$db_user password=$db_pass");
  if (!$dbconn) {
    replyError("Database connection failed.");
    return;
  }

  // Performing SQL query
  $query = 'SELECT * FROM users';
  $result = pg_query($dbconn, $query);
  if (!$result) {
    replyError("Query failed.");
    return;
  }

  $users = [];
  while ($line = pg_fetch_array($result, null, PGSQL_ASSOC)) {
    $users[] = $line;
  }

  // Free resultset
  pg_free_result($result);
  // Closing connection
  pg_close($dbconn);

  replySuccess([
    "message" => "Welcome, $name!",
    "user_data" => array_column($users, "data")
  ]);
}

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
    replySuccess($args);
  } else {
    replyError();
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
    replySuccess("todo");
  } else {
    replyError();
  }
}
