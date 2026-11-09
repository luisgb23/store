<?php

use App\Core\Env;

/**
 * Inicialización común: constante BASE_DIR, autoloader PSR-4 y variables de entorno.
 * Lo usan tanto public/index.php como los scripts de la carpeta bin/.
 */

define('BASE_DIR', __DIR__);

// App\Core\Router => src/Core/Router.php
spl_autoload_register(function (string $class): void {
    $prefix = 'App\\';

    if (strncmp($class, $prefix, strlen($prefix)) !== 0) {
        return;
    }

    $relative = substr($class, strlen($prefix));
    $file = BASE_DIR . '/src/' . str_replace('\\', '/', $relative) . '.php';

    if (is_file($file)) {
        require $file;
    }
});

Env::load(BASE_DIR . '/.env');
