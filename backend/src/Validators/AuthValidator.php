<?php

namespace App\Validators;

class AuthValidator extends Validator
{
    /**
     * @return string[] lista de errores (vacía si los datos son válidos)
     */
    public static function register(array $data): array
    {
        $errors = [];

        if (!isset($data['nombre']) || !is_string($data['nombre']) || trim($data['nombre']) === '') {
            $errors[] = 'El campo "nombre" es obligatorio y debe ser texto.';
        } elseif (self::length(trim($data['nombre'])) > 100) {
            $errors[] = 'El campo "nombre" no puede superar los 100 caracteres.';
        }

        if (!isset($data['email']) || !is_string($data['email']) || !filter_var(trim($data['email']), FILTER_VALIDATE_EMAIL)) {
            $errors[] = 'El campo "email" es obligatorio y debe ser un email válido.';
        } elseif (strlen(trim($data['email'])) > 150) {
            $errors[] = 'El campo "email" no puede superar los 150 caracteres.';
        }

        if (!isset($data['password']) || !is_string($data['password'])) {
            $errors[] = 'El campo "password" es obligatorio y debe ser texto.';
        } elseif (strlen($data['password']) < 8) {
            $errors[] = 'El campo "password" debe tener al menos 8 caracteres.';
        } elseif (strlen($data['password']) > 72) {
            // bcrypt solo considera los primeros 72 bytes
            $errors[] = 'El campo "password" no puede superar los 72 caracteres.';
        }

        return $errors;
    }

    /** Normaliza los datos de registro ya validados. */
    public static function cleanRegister(array $data): array
    {
        return [
            'nombre'   => trim($data['nombre']),
            'email'    => strtolower(trim($data['email'])),
            'password' => $data['password'],
        ];
    }

    /**
     * @return string[]
     */
    public static function login(array $data): array
    {
        $errors = [];

        if (!isset($data['email']) || !is_string($data['email']) || trim($data['email']) === '') {
            $errors[] = 'El campo "email" es obligatorio.';
        }

        if (!isset($data['password']) || !is_string($data['password']) || $data['password'] === '') {
            $errors[] = 'El campo "password" es obligatorio.';
        }

        return $errors;
    }

    /**
     * Valida que venga el refresh token (para /auth/refresh y /auth/logout).
     *
     * @return string[]
     */
    public static function refreshToken(array $data): array
    {
        if (!isset($data['refresh_token']) || !is_string($data['refresh_token']) || $data['refresh_token'] === '') {
            return ['El campo "refresh_token" es obligatorio.'];
        }

        return [];
    }
}
