<?php

namespace App\Models;

use PDO;

/**
 * Acceso a datos de la tabla "usuarios".
 */
class Usuario
{
    public function __construct(private PDO $db)
    {
    }

    public function findById(int $id): ?array
    {
        $stmt = $this->db->prepare('SELECT * FROM usuarios WHERE id = :id');
        $stmt->execute([':id' => $id]);

        $row = $stmt->fetch();

        return $row ?: null;
    }

    public function findByEmail(string $email): ?array
    {
        $stmt = $this->db->prepare('SELECT * FROM usuarios WHERE email = :email');
        $stmt->execute([':email' => $email]);

        $row = $stmt->fetch();

        return $row ?: null;
    }

    public function create(array $data): int
    {
        $stmt = $this->db->prepare(
            'INSERT INTO usuarios (nombre, email, password_hash, rol)
             VALUES (:nombre, :email, :password_hash, :rol)'
        );
        $stmt->execute([
            ':nombre'        => $data['nombre'],
            ':email'         => $data['email'],
            ':password_hash' => $data['password_hash'],
            ':rol'           => $data['rol'],
        ]);

        return (int) $this->db->lastInsertId();
    }

    public function setRol(int $id, string $rol): void
    {
        $stmt = $this->db->prepare('UPDATE usuarios SET rol = :rol WHERE id = :id');
        $stmt->execute([':rol' => $rol, ':id' => $id]);
    }

    /** Datos del usuario aptos para devolver en la API (sin el hash de la contraseña). */
    public static function sanitize(array $row): array
    {
        return [
            'id'        => (int) $row['id'],
            'nombre'    => $row['nombre'],
            'email'     => $row['email'],
            'rol'       => $row['rol'],
            'creado_en' => $row['creado_en'],
        ];
    }
}
