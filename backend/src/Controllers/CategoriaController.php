<?php

namespace App\Controllers;

use App\Core\Database;
use App\Core\Request;
use App\Core\Response;
use App\Models\Categoria;
use App\Validators\CategoriaValidator;

class CategoriaController
{
    private Categoria $categorias;

    public function __construct()
    {
        $this->categorias = new Categoria(Database::connection());
    }

    public function index(Request $request, array $params): void
    {
        Response::success('Listado de categorías.', $this->categorias->all());
    }

    public function show(Request $request, array $params): void
    {
        Response::success('Categoría obtenida.', $this->findOrFail((int) $params['id']));
    }

    public function store(Request $request, array $params): void
    {
        $input = $request->body();

        $errors = CategoriaValidator::validate($input);
        if (!empty($errors)) {
            Response::error('Datos inválidos.', 422, $errors);
        }

        $id = $this->categorias->create(CategoriaValidator::clean($input));

        Response::success('Categoría creada correctamente.', $this->categorias->find($id), 201);
    }

    public function update(Request $request, array $params): void
    {
        $id = (int) $params['id'];
        $this->findOrFail($id);

        $input = $request->body();

        $errors = CategoriaValidator::validate($input);
        if (!empty($errors)) {
            Response::error('Datos inválidos.', 422, $errors);
        }

        $this->categorias->update($id, CategoriaValidator::clean($input));

        Response::success('Categoría actualizada correctamente.', $this->categorias->find($id));
    }

    public function destroy(Request $request, array $params): void
    {
        $id = (int) $params['id'];
        $this->findOrFail($id);

        $this->categorias->delete($id);

        Response::success('Categoría eliminada correctamente.');
    }

    private function findOrFail(int $id): array
    {
        $categoria = $this->categorias->find($id);

        if ($categoria === null) {
            Response::error('Categoría no encontrada.', 404);
        }

        return $categoria;
    }
}
