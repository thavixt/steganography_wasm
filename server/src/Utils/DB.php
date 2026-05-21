<?php

namespace Steganographix\Utils;

class DB
{
  private $connection;

  public function __construct()
  {
    $db_host = getenv('DB_HOST') ?: 'wasm-postgres';
    $db_name = getenv('DB_NAME') ?: 'stego_wasm';
    $db_user = getenv('DB_USER') ?: 'admin';
    $db_pass = getenv('DB_PASS') ?: 'admin';

    $conn_string = "host=$db_host dbname=$db_name user=$db_user password=$db_pass";
    $this->connection = @pg_connect($conn_string);

    if (!$this->connection) {
      Reply::error("Database connection failed.", 500);
      exit;
    }
  }

  /**
   * Execute a query with optional parameters
   * @param string $query
   * @param array $params
   * @return array|bool
   */
  public function query($query, $params = [])
  {
    $result = pg_query_params($this->connection, $query, $params);

    if (!$result) {
      return false;
    }

    $data = [];
    while ($row = pg_fetch_assoc($result)) {
      $data[] = $row;
    }

    pg_free_result($result);
    return $data;
  }

  /**
   * Execute a non-returning query (INSERT, UPDATE, DELETE)
   * @param string $query
   * @param array $params
   * @return bool
   */
  public function execute($query, $params = [])
  {
    $result = pg_query_params($this->connection, $query, $params);
    if (!$result) {
      return false;
    }
    pg_free_result($result);
    return true;
  }

  public function __destruct()
  {
    if ($this->connection) {
      pg_close($this->connection);
    }
  }
}
