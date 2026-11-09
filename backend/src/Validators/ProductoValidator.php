<?php

namespace App\Validators;

class ProductoValidator extends Validator
{
    /**
     * @return string[] lista de errores (vacía si los datos son válidos)
     */
    public static function validate(array $data): array
    {
        $errors = [];

        if (!isset($data['nombre']) || !is_string($data['nombre']) || trim($data['nombre']) === '') {
            $errors[] = 'El campo "nombre" es obligatorio y debe ser texto.';
        } elseif (self::length(trim($data['nombre'])) > 150) {
            $errors[] = 'El campo "nombre" no puede superar los 150 caracteres.';
        }

        if (isset($data['descripcion']) && !is_string($data['descripcion'])) {
            $errors[] = 'El campo "descripcion" debe ser texto.';
        }

        if (!isset($data['precio']) || !is_numeric($data['precio']) || (float) $data['precio'] < 0) {
            $errors[] = 'El campo "precio" es obligatorio y debe ser un número mayor o igual a 0.';
        }

        if (!isset($data['stock']) || filter_var($data['stock'], FILTER_VALIDATE_INT) === false || (int) $data['stock'] < 0) {
            $errors[] = 'El campo "stock" es obligatorio y debe ser un entero mayor o igual a 0.';
        }

        if (isset($data['categoria_id']) && $data['categoria_id'] !== null && $data['categoria_id'] !== '') {
            if (filter_var($data['categoria_id'], FILTER_VALIDATE_INT) === false || (int) $data['categoria_id'] < 1) {
                $errors[] = 'El campo "categoria_id" debe ser un entero positivo o null.';
            }
        }

        return $errors;
    }

    /** Normaliza los datos ya validados. */
    public static function clean(array $data): array
    {
        $descripcion = isset($data['descripcion']) ? trim($data['descripcion']) : null;
        $tieneCategoria = isset($data['categoria_id']) && $data['categoria_id'] !== '';

        return [
            'nombre'       => trim($data['nombre']),
            'descripcion'  => $descripcion === '' ? null : $descripcion,
            'precio'       => round((float) $data['precio'], 2),
            'stock'        => (int) $data['stock'],
            'categoria_id' => $tieneCategoria ? (int) $data['categoria_id'] : null,
        ];
    }
}
