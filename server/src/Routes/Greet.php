<?php

namespace Steganographix\Routes;

use Steganographix\Utils\Reply as Reply;

class Greet {
  public function __construct()
  {
    if (!isset($_GET["greet"])) {
      return;
    }

    $name = $_GET["name"] ?? "world";

    $db_host = getenv('DB_HOST') ?: 'wasm-postgres';
    $db_name = getenv('DB_NAME') ?: 'stego_wasm';
    $db_user = getenv('DB_USER') ?: 'admin';
    $db_pass = getenv('DB_PASS') ?: 'admin';

    $dbconn = @pg_connect("host=$db_host dbname=$db_name user=$db_user password=$db_pass");
    if (!$dbconn) {
      Reply::error("Database connection failed.");
      return;
    }

    // Performing SQL query
    $query = 'SELECT * FROM users';
    $result = pg_query($dbconn, $query);
    if (!$result) {
      Reply::error("Query failed.");
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

    Reply::success([
      "message" => "Welcome, $name!",
      "user_data" => array_column($users, "data")
    ]);
  }
}
