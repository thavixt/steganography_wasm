<?php

require 'vendor/autoload.php';

use Steganographix\Routes\Greet;
use Steganographix\Routes\Auth;
use Steganographix\Utils\Headers;

// setup
new Headers();

// routes
new Greet();
new Auth();
