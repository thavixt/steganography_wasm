<?php

require 'vendor/autoload.php';

use Steganographix\Routes;
use Steganographix\Utils\Headers;

// setup
new Headers();

// routes
new Routes\Greet();
new Routes\Auth();
