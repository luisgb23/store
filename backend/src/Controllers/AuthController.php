<?php

namespace App\Controllers;

use App\Core\Database;
use App\Core\Env;
use App\Core\Jwt;
use App\Core\Request;
use App\Core\Response;
use App\Models\LoginIntento;
use App\Models\RefreshToken;
use App\Models\Usuario;
use App\Validators\AuthValidator;
use PDOException;

class AuthController
{
    /**
     * Hash de relleno: si el email no existe se verifica igualmente contra este hash,
     * para que el tiempo de respuesta no revele qué emails están registrados.
     */
    private const HASH_RELLENO = '$2y$10$.ZqYc70bmlSWouKSQrdTxOmo.w.M5pw503U9954NDadHn.F3iHyOW';

    private Usuario $usuarios;
    private RefreshToken $refreshTokens;
    private LoginIntento $intentos;

    public function __construct()
    {
        $db = Database::connection();
        $this->usuarios = new Usuario($db);
        $this->refreshTokens = new RefreshToken($db);
        $this->intentos = new LoginIntento($db);
    }

    /** POST /auth/register */
    public function register(Request $request, array $params): void
    {
        $input = $request->body();

        $errors = AuthValidator::register($input);
        if (!empty($errors)) {
            Response::error('Datos inválidos.', 422, $errors);
        }

        $data = AuthValidator::cleanRegister($input);

        if ($this->usuarios->findByEmail($data['email']) !== null) {
            Response::error('El email ya está registrado.', 409);
        }

        try {
            $id = $this->usuarios->create([
                'nombre'        => $data['nombre'],
                'email'         => $data['email'],
                'password_hash' => password_hash($data['password'], PASSWORD_DEFAULT),
                'rol'           => 'user', // los administradores se crean con bin/crear-admin.php
            ]);
        } catch (PDOException $e) {
            // Dos registros simultáneos con el mismo email: gana el índice único
            if ($e->getCode() === '23000') {
                Response::error('El email ya está registrado.', 409);
            }
            throw $e;
        }

        $user = $this->usuarios->findById($id);

        Response::success('Usuario registrado correctamente.', [
            'user'   => Usuario::sanitize($user),
            'tokens' => $this->issueTokens($user),
        ], 201);
    }

    /** POST /auth/login */
    public function login(Request $request, array $params): void
    {
        $input = $request->body();

        $errors = AuthValidator::login($input);
        if (!empty($errors)) {
            Response::error('Datos inválidos.', 422, $errors);
        }

        $email = strtolower(trim($input['email']));
        $ip = $_SERVER['REMOTE_ADDR'] ?? 'desconocida';

        if ($this->intentos->demasiados($email, $ip)) {
            header('Retry-After: ' . LoginIntento::VENTANA);
            Response::error('Demasiados intentos fallidos. Probá de nuevo en unos minutos.', 429);
        }

        $user = $this->usuarios->findByEmail($email);
        $passwordOk = password_verify($input['password'], $user['password_hash'] ?? self::HASH_RELLENO);

        if ($user === null || !$passwordOk) {
            $this->intentos->registrar($email, $ip);
            // Mismo mensaje si falla el email o la contraseña
            Response::error('Credenciales inválidas.', 401);
        }

        $this->intentos->limpiar($email, $ip);

        Response::success('Inicio de sesión correcto.', [
            'user'   => Usuario::sanitize($user),
            'tokens' => $this->issueTokens($user),
        ]);
    }

    /** POST /auth/refresh — canjea un refresh token por un par nuevo (rotación). */
    public function refresh(Request $request, array $params): void
    {
        $input = $request->body();

        $errors = AuthValidator::refreshToken($input);
        if (!empty($errors)) {
            Response::error('Datos inválidos.', 422, $errors);
        }

        $row = $this->refreshTokens->findByHash(hash('sha256', $input['refresh_token']));

        if ($row === null) {
            Response::error('Refresh token inválido.', 401);
        }

        // Un token ya usado que vuelve a presentarse puede significar que fue robado:
        // se revocan todas las sesiones de ese usuario por precaución.
        if ((int) $row['revocado'] === 1) {
            $this->refreshTokens->revokeAllForUser((int) $row['usuario_id']);
            Response::error('Refresh token inválido.', 401);
        }

        if (strtotime($row['expira_en'] . ' UTC') <= time()) {
            Response::error('Refresh token expirado. Iniciá sesión nuevamente.', 401);
        }

        $user = $this->usuarios->findById((int) $row['usuario_id']);
        if ($user === null) {
            Response::error('Refresh token inválido.', 401);
        }

        // Un refresh token solo sirve una vez
        if (!$this->refreshTokens->revoke((int) $row['id'])) {
            $this->refreshTokens->revokeAllForUser((int) $row['usuario_id']);
            Response::error('Refresh token inválido.', 401);
        }

        Response::success('Token renovado correctamente.', $this->issueTokens($user));
    }

    /** POST /auth/logout — revoca el refresh token indicado. */
    public function logout(Request $request, array $params): void
    {
        $input = $request->body();

        $errors = AuthValidator::refreshToken($input);
        if (!empty($errors)) {
            Response::error('Datos inválidos.', 422, $errors);
        }

        $row = $this->refreshTokens->findByHash(hash('sha256', $input['refresh_token']));

        if ($row !== null) {
            $this->refreshTokens->revoke((int) $row['id']);
        }

        // Siempre 200: no se revela si el token existía
        Response::success('Sesión cerrada correctamente.');
    }

    /** GET /auth/me (requiere AuthMiddleware) */
    public function me(Request $request, array $params): void
    {
        $user = $this->usuarios->findById($request->user()['id']);

        if ($user === null) {
            Response::error('Usuario no encontrado.', 404);
        }

        Response::success('Usuario autenticado.', Usuario::sanitize($user));
    }

    /**
     * Genera el access token (JWT de vida corta) y un refresh token opaco guardado hasheado.
     */
    private function issueTokens(array $user): array
    {
        $accessTtl = (int) Env::get('JWT_TTL', '3600');
        $refreshTtl = (int) Env::get('REFRESH_TTL', '2592000');

        $accessToken = Jwt::encode([
            'sub'   => (string) $user['id'],
            'email' => $user['email'],
            'rol'   => $user['rol'],
        ], $accessTtl);

        $refreshToken = bin2hex(random_bytes(32));

        $this->refreshTokens->create(
            (int) $user['id'],
            hash('sha256', $refreshToken),
            gmdate('Y-m-d H:i:s', time() + $refreshTtl)
        );

        return [
            'access_token'       => $accessToken,
            'token_type'         => 'Bearer',
            'expires_in'         => $accessTtl,
            'refresh_token'      => $refreshToken,
            'refresh_expires_in' => $refreshTtl,
        ];
    }
}
