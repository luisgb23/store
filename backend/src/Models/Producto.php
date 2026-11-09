<?php

namespace App\Models;

use PDO;

/**
 * Acceso a datos de la tabla "productos".
 */
class Producto
{
    private const SELECT = 'SELECT p.id, p.nombre, p.descripcion, p.precio, p.stock,
                                   p.categoria_id, c.nombre AS categoria_nombre,
                                   p.creado_en, p.actualizado_en
                            FROM productos p
                            LEFT JOIN categorias c ON c.id = p.categoria_id';

    public function __construct(private PDO $db)
    {
    }

    /**
     * Listado paginado con filtros opcionales.
     *
     * @return array{items: array, total: int}
     */
    public function paginate(int $page, int $perPage, ?int $categoriaId = null, ?string $search = null): array
    {
        $where = [];
        $params = [];

        if ($categoriaId !== null) {
            $where[] = 'p.categoria_id = :categoria_id';
            $params[':categoria_id'] = $categoriaId;
        }

        if ($search !== null && $search !== '') {
            // Con prepares nativos no se puede repetir un mismo marcador nombrado.
            $where[] = '(p.nombre LIKE :search_nombre OR p.descripcion LIKE :search_desc)';
            $params[':search_nombre'] = '%' . $search . '%';
            $params[':search_desc'] = '%' . $search . '%';
        }

        $whereSql = $where ? ' WHERE ' . implode(' AND ', $where) : '';

        $count = $this->db->prepare('SELECT COUNT(*) FROM productos p' . $whereSql);
        $count->execute($params);
        $total = (int) $count->fetchColumn();

        $limit = max(1, $perPage);
        $offset = max(0, ($page - 1) * $limit);

        // $limit y $offset ya son enteros validados, es seguro concatenarlos.
        $stmt = $this->db->prepare(
            self::SELECT . $whereSql . " ORDER BY p.id DESC LIMIT {$limit} OFFSET {$offset}"
        );
        $stmt->execute($params);

        return [
            'items' => array_map([$this, 'format'], $stmt->fetchAll()),
            'total' => $total,
        ];
    }

    public function find(int $id): ?array
    {
        $stmt = $this->db->prepare(self::SELECT . ' WHERE p.id = :id');
        $stmt->execute([':id' => $id]);

        $row = $stmt->fetch();

        return $row ? $this->format($row) : null;
    }

    public function create(array $data): int
    {
        $stmt = $this->db->prepare(
            'INSERT INTO productos (nombre, descripcion, precio, stock, categoria_id)
             VALUES (:nombre, :descripcion, :precio, :stock, :categoria_id)'
        );
        $stmt->execute($this->bindings($data));

        return (int) $this->db->lastInsertId();
    }

    public function update(int $id, array $data): void
    {
        $stmt = $this->db->prepare(
            'UPDATE productos
             SET nombre = :nombre, descripcion = :descripcion, precio = :precio,
                 stock = :stock, categoria_id = :categoria_id
             WHERE id = :id'
        );
        $stmt->execute($this->bindings($data) + [':id' => $id]);
    }

    public function delete(int $id): void
    {
        $stmt = $this->db->prepare('DELETE FROM productos WHERE id = :id');
        $stmt->execute([':id' => $id]);
    }

    private function bindings(array $data): array
    {
        return [
            ':nombre'       => $data['nombre'],
            ':descripcion'  => $data['descripcion'],
            ':precio'       => $data['precio'],
            ':stock'        => $data['stock'],
            ':categoria_id' => $data['categoria_id'],
        ];
    }

    /** Convierte los tipos para que el JSON devuelva números y no strings. */
    private function format(array $row): array
    {
        $row['id'] = (int) $row['id'];
        $row['precio'] = (float) $row['precio'];
        $row['stock'] = (int) $row['stock'];
        $row['categoria_id'] = $row['categoria_id'] !== null ? (int) $row['categoria_id'] : null;

        return $row;
    }
}
