<?php

namespace App\Controllers;

use App\Core\Database;
use App\Core\Request;
use App\Core\Response;
use App\Models\Categoria;
use App\Models\Producto;
use App\Validators\ProductoValidator;

class ProductoController
{
    private Producto $productos;
    private Categoria $categorias;

    public function __construct()
    {
        $db = Database::connection();
        $this->productos = new Producto($db);
        $this->categorias = new Categoria($db);
    }

    /**
     * GET /productos?page=1&per_page=10&categoria_id=1&search=texto
     */
    public function index(Request $request, array $params): void
    {
        $page = max(1, (int) $request->query('page', 1));
        $perPage = min(100, max(1, (int) $request->query('per_page', 10)));

        $categoriaId = $request->query('categoria_id');
        $categoriaId = ($categoriaId !== null && $categoriaId !== '') ? (int) $categoriaId : null;

        $search = $request->query('search');
        $search = is_string($search) ? trim($search) : null;

        $result = $this->productos->paginate($page, $perPage, $categoriaId, $search);

        Response::success('Listado de productos.', $result['items'], 200, [
            'pagination' => [
                'page'        => $page,
                'per_page'    => $perPage,
                'total'       => $result['total'],
                'total_pages' => (int) ceil($result['total'] / $perPage),
            ],
        ]);
    }

    public function show(Request $request, array $params): void
    {
        Response::success('Producto obtenido.', $this->findOrFail((int) $params['id']));
    }

    public function store(Request $request, array $params): void
    {
        $data = $this->validated($request);

        $id = $this->productos->create($data);

        Response::success('Producto creado correctamente.', $this->productos->find($id), 201);
    }

    public function update(Request $request, array $params): void
    {
        $id = (int) $params['id'];
        $this->findOrFail($id);

        $data = $this->validated($request);

        $this->productos->update($id, $data);

        Response::success('Producto actualizado correctamente.', $this->productos->find($id));
    }

    public function destroy(Request $request, array $params): void
    {
        $id = (int) $params['id'];
        $this->findOrFail($id);

        $this->productos->delete($id);

        Response::success('Producto eliminado correctamente.');
    }

    /** Valida el cuerpo, comprueba que la categoría exista y devuelve los datos limpios. */
    private function validated(Request $request): array
    {
        $input = $request->body();

        $errors = ProductoValidator::validate($input);
        if (!empty($errors)) {
            Response::error('Datos inválidos.', 422, $errors);
        }

        $data = ProductoValidator::clean($input);

        if ($data['categoria_id'] !== null && !$this->categorias->exists($data['categoria_id'])) {
            Response::error('Datos inválidos.', 422, ['La "categoria_id" indicada no existe.']);
        }

        return $data;
    }

    private function findOrFail(int $id): array
    {
        $producto = $this->productos->find($id);

        if ($producto === null) {
            Response::error('Producto no encontrado.', 404);
        }

        return $producto;
    }
}
