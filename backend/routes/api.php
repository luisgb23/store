<?php

use App\Controllers\AuthController;
use App\Controllers\CategoriaController;
use App\Controllers\ProductoController;
use App\Core\Response;
use App\Middleware\AuthMiddleware;
use App\Middleware\RoleMiddleware;

/** @var \App\Core\Router $router */

// Atajos de middleware
$auth = [AuthMiddleware::class];                                    // cualquier usuario autenticado
$admin = [AuthMiddleware::class, [RoleMiddleware::class, 'admin']]; // solo administradores

// Raíz: documentación rápida de la API
$router->get('/', function () {
    Response::success('API de Productos y Categorías (PHP puro + MySQL + JWT)', [
        'auth' => [
            'POST /auth/register',
            'POST /auth/login',
            'POST /auth/refresh',
            'POST /auth/logout',
            'GET /auth/me (requiere token)',
        ],
        'categorias' => [
            'GET /categorias',
            'GET /categorias/{id}',
            'POST /categorias (requiere token)',
            'PUT /categorias/{id} (requiere token)',
            'DELETE /categorias/{id} (solo admin)',
        ],
        'productos' => [
            'GET /productos?page=1&per_page=10&categoria_id=1&search=texto',
            'GET /productos/{id}',
            'POST /productos (requiere token)',
            'PUT /productos/{id} (requiere token)',
            'DELETE /productos/{id} (solo admin)',
        ],
    ]);
});

// Autenticación
$router->post('/auth/register', [AuthController::class, 'register']);
$router->post('/auth/login', [AuthController::class, 'login']);
$router->post('/auth/refresh', [AuthController::class, 'refresh']);
$router->post('/auth/logout', [AuthController::class, 'logout']);
$router->get('/auth/me', [AuthController::class, 'me'], $auth);

// Categorías: lectura pública, escritura con token, borrado solo admin
$router->get('/categorias', [CategoriaController::class, 'index']);
$router->get('/categorias/{id}', [CategoriaController::class, 'show']);
$router->post('/categorias', [CategoriaController::class, 'store'], $auth);
$router->put('/categorias/{id}', [CategoriaController::class, 'update'], $auth);
$router->delete('/categorias/{id}', [CategoriaController::class, 'destroy'], $admin);

// Productos: lectura pública, escritura con token, borrado solo admin
$router->get('/productos', [ProductoController::class, 'index']);
$router->get('/productos/{id}', [ProductoController::class, 'show']);
$router->post('/productos', [ProductoController::class, 'store'], $auth);
$router->put('/productos/{id}', [ProductoController::class, 'update'], $auth);
$router->delete('/productos/{id}', [ProductoController::class, 'destroy'], $admin);
