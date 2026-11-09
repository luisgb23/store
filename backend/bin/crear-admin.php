<?php

use App\Core\Database;
use App\Models\Usuario;
use App\Validators\AuthValidator;

/**
 * Crea un usuario administrador (o promueve a admin uno existente).
 *
 * Uso:
 *   php bin/crear-admin.php "Nombre Apellido" correo@dominio.com [contraseña]
 *
 * Si no pasás la contraseña, se te pide por la terminal (se verá al escribir).
 */

if (PHP_SAPI !== 'cli') {
    exit('Este script solo se puede ejecutar desde la terminal.');
}

require dirname(__DIR__) . '/bootstrap.php';

[$script, $nombre, $email] = array_pad($argv, 3, null);
$password = $argv[3] ?? null;

if ($nombre === null || $email === null) {
    fwrite(STDERR, "Uso: php bin/crear-admin.php \"admin\" admin@correo.com [admin123]\n");
    exit(1);
}

$usuarios = new Usuario(Database::connection());
$email = strtolower(trim($email));

$existente = $usuarios->findByEmail($email);

if ($existente !== null) {
    $usuarios->setRol((int) $existente['id'], 'admin');
    echo "El usuario {$email} ya existía: ahora es administrador.\n";
    exit(0);
}

if ($password === null) {
    echo 'Contraseña (mínimo 8 caracteres, se verá al escribir): ';
    $password = rtrim((string) fgets(STDIN), "\r\n");
}

$errors = AuthValidator::register(['nombre' => $nombre, 'email' => $email, 'password' => $password]);

if (!empty($errors)) {
    fwrite(STDERR, "Datos inválidos:\n - " . implode("\n - ", $errors) . "\n");
    exit(1);
}

$usuarios->create([
    'nombre'        => trim($nombre),
    'email'         => $email,
    'password_hash' => password_hash($password, PASSWORD_DEFAULT),
    'rol'           => 'admin',
]);

echo "Administrador {$email} creado correctamente.\n";
