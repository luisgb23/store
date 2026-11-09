<?php

namespace App\Models;

use PDO;

/**
 * Acceso a datos de la tabla "categorias".
 */
class Categoria
{
    public function __construct(private PDO $db)
    {
    }

    public function all(): array
    {
        $stmt = $this->db->query(
            'SELECT id, nombre, descripcion, creado_en FROM categorias ORDER BY id DESC'
        );

        return $stmt->fetchAll();
    }

    public function find(int $id): ?array
    {
        $stmt = $this->db->prepare(
            'SELECT id, nombre, descripcion, creado_en FROM categorias WHERE id = :id'
        );
        $stmt->execute([':id' => $id]);

        $row = $stmt->fetch();

        return $row ?: null;
    }

    public function exists(int $id): bool
    {
        $stmt = $this->db->prepare('SELECT 1 FROM categorias WHERE id = :id');
        $stmt->execute([':id' => $id]);

        return (bool) $stmt->fetchColumn();
    }

    public function create(array $data): int
    {
        $stmt = $this->db->prepare(
            'INSERT INTO categorias (nombre, descripcion) VALUES (:nombre, :descripcion)'
        );
        $stmt->execute([
            ':nombre'      => $data['nombre'],
            ':descripcion' => $data['descripcion'],
        ]);

        return (int) $this->db->lastInsertId();
    }

    public function update(int $id, array $data): void
    {
        $stmt = $this->db->prepare(
            'UPDATE categorias SET nombre = :nombre, descripcion = :descripcion WHERE id = :id'
        );
        $stmt->execute([
            ':nombre'      => $data['nombre'],
            ':descripcion' => $data['descripcion'],
            ':id'          => $id,
        ]);
    }

    public function delete(int $id): void
    {
        $stmt = $this->db->prepare('DELETE FROM categorias WHERE id = :id');
        $stmt->execute([':id' => $id]);
    }
}
