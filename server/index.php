<?php

require 'vendor/autoload.php';

use Steganographix\Routes\Auth;
use Steganographix\Utils\Headers;
use Steganographix\Utils\Session;

// setup
new Headers();
new Session();

// routes
new Auth();
