<?php

namespace App\Validators;

/**
 * Base común para los validadores.
 */
abstract class Validator
{
    /** Longitud en caracteres (usa mbstring si está habilitada). */
    protected static function length(string $value): int
    {
        return function_exists('mb_strlen') ? mb_strlen($value) : strlen($value);
    }
}
