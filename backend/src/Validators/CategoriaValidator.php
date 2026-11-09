<?php

namespace App\Validators;

class CategoriaValidator extends Validator
{
    /**
     * @return string[] lista de errores (vacía si los datos son válidos)
     */
    public static function validate(array $data): array
    {
        $errors = [];

        if (!isset($data['nombre']) || !is_string($data['nombre']) || trim($data['nombre']) === '') {
            $errors[] = 'El campo "nombre" es obligatorio y debe ser texto.';
        } elseif (self::length(trim($data['nombre'])) > 100) {
            $errors[] = 'El campo "nombre" no puede superar los 100 caracteres.';
        }

        if (isset($data['descripcion'])) {
            if (!is_string($data['descripcion'])) {
                $errors[] = 'El campo "descripcion" debe ser texto.';
            } elseif (self::length(trim($data['descripcion'])) > 255) {
                $errors[] = 'El campo "descripcion" no puede superar los 255 caracteres.';
            }
        }

        return $errors;
    }

    /** Normaliza los datos ya validados. */
    public static function clean(array $data): array
    {
        $descripcion = isset($data['descripcion']) ? trim($data['descripcion']) : null;

        return [
            'nombre'      => trim($data['nombre']),
            'descripcion' => $descripcion === '' ? null : $descripcion,
        ];
    }
}
