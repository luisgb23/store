# API de Productos y Categorías (PHP puro + MySQL + JWT)

API REST sin frameworks, organizada en capas: **Router → Middleware → Controladores → Modelos**, con validadores aparte, un único punto de entrada y autenticación con JWT (access token + refresh token con rotación) y roles.

Requisitos: **PHP 8.0 o superior** con la extensión `pdo_mysql` habilitada (y opcionalmente `mbstring`), y MySQL/MariaDB.

## Estructura

```
tienda-api/
├── public/
│   ├── index.php              # único punto de entrada
│   └── .htaccess              # solo para Apache
├── bootstrap.php              # autoloader (PSR-4) + carga de .env
├── routes/
│   └── api.php                # rutas y middleware de cada una
├── src/
│   ├── Core/                  # Router, Request, Response, Database, Env, Jwt
│   ├── Controllers/           # Auth, Producto, Categoria
│   ├── Models/                # Usuario, RefreshToken, LoginIntento, Producto, Categoria
│   ├── Validators/            # reglas de validación y limpieza de datos
│   └── Middleware/            # Cors, AuthMiddleware, RoleMiddleware
├── bin/
│   └── crear-admin.php        # crea (o promueve) un administrador
├── migrations/
│   └── auth.sql               # solo las tablas de autenticación
├── schema.sql                 # esquema completo
└── .env.example
```

## Instalación

1. **Base de datos.**
   - Instalación nueva: `mysql -u root -p < schema.sql`
   - Si ya tenías `schema.sql` importado antes de la autenticación: `mysql -u root -p < migrations/auth.sql`
2. **Configuración.** Copiá `.env.example` como `.env`:
   ```
   copy .env.example .env
   ```
   Completá `DB_USER` y `DB_PASS`, y generá el secreto JWT:
   ```
   php -r "echo bin2hex(random_bytes(32));"
   ```
   Pegá el resultado en `JWT_SECRET=` (sin ese valor, o con menos de 32 caracteres, las rutas de login y las protegidas devuelven error 500).
3. **Crear un administrador:**
   ```
   php bin/crear-admin.php "Tu Nombre" tu@correo.com
   ```
   Te pide la contraseña por la terminal. Si el email ya está registrado, ese usuario pasa a ser admin.
4. **Levantar el servidor** desde la carpeta del proyecto:
   ```
   php -S localhost:8000 -t public
   ```
5. Probá: http://localhost:8000/productos

No hace falta Composer: el autoloader está en `bootstrap.php`.

## Permisos por ruta

| Acción | Quién puede |
|--------|-------------|
| `GET` de productos y categorías | Público |
| `POST` y `PUT` de productos y categorías | Cualquier usuario autenticado |
| `DELETE` de productos y categorías | Solo `admin` |
| `/auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout` | Público |
| `GET /auth/me` | Usuario autenticado |

Los permisos se definen en `routes/api.php` y se cambian en una línea.

## Endpoints

### Autenticación

| Método | Ruta | Body | Descripción |
|--------|------|------|-------------|
| POST | `/auth/register` | `nombre`, `email`, `password` (8 a 72 caracteres) | Crea un usuario con rol `user` y devuelve los tokens |
| POST | `/auth/login` | `email`, `password` | Devuelve el usuario y los tokens |
| POST | `/auth/refresh` | `refresh_token` | Canjea el refresh token por un par nuevo |
| POST | `/auth/logout` | `refresh_token` | Revoca el refresh token |
| GET | `/auth/me` | - | Datos del usuario autenticado |

Respuesta de `register`, `login` y `refresh` (en `data.tokens`, o en `data` directamente para `refresh`):
```json
{
  "access_token": "eyJhbGciOi...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "9f2c...",
  "refresh_expires_in": 2592000
}
```

### Categorías y productos

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/categorias` | Listar categorías |
| GET | `/categorias/{id}` | Obtener una categoría |
| POST | `/categorias` | Crear categoría |
| PUT | `/categorias/{id}` | Actualizar categoría |
| DELETE | `/categorias/{id}` | Eliminar categoría |
| GET | `/productos` | Listar productos (paginado) |
| GET | `/productos/{id}` | Obtener un producto |
| POST | `/productos` | Crear producto |
| PUT | `/productos/{id}` | Actualizar producto |
| DELETE | `/productos/{id}` | Eliminar producto |

Parámetros de `GET /productos`: `page` (default 1), `per_page` (default 10, máx. 100), `categoria_id` y `search` (busca en nombre y descripción).

Body de producto:
```json
{ "nombre": "Teclado mecánico", "descripcion": "Switches azules", "precio": 45.99, "stock": 20, "categoria_id": 1 }
```
Body de categoría:
```json
{ "nombre": "Deportes", "descripcion": "Artículos deportivos" }
```

## Cómo funciona la autenticación

1. El cliente hace login y recibe un **access token** (JWT, dura 1 hora por defecto) y un **refresh token** (opaco, dura 30 días).
2. En cada petición protegida envía `Authorization: Bearer <access_token>`.
3. Cuando el access token vence (la API responde 401), el cliente llama a `/auth/refresh` con el refresh token y recibe un par nuevo. **Cada refresh token sirve una sola vez** (rotación).
4. Si alguien presenta un refresh token que ya se usó, la API lo trata como posible robo y **revoca todas las sesiones de ese usuario**.
5. `/auth/logout` revoca el refresh token. El access token sigue siendo válido hasta que venza, por eso conviene que dure poco.

Otras medidas incluidas:

- Contraseñas con `password_hash()` (bcrypt); nunca se guardan ni se devuelven en claro.
- Los refresh tokens se guardan **hasheados** (SHA-256) en la base de datos.
- El JWT se firma con HS256 y se rechazan otros algoritmos (incluido `none`).
- Login con el mismo mensaje y tiempo de respuesta parecido si falla el email o la contraseña.
- Máximo de **5 intentos fallidos por email + IP cada 15 minutos** (responde 429).
- El rol viaja dentro del access token: si cambiás el rol de un usuario, el cambio se aplica cuando renueve su token.

## Pruebas rápidas con curl (CMD de Windows)

```
curl -X POST http://localhost:8000/auth/login -H "Content-Type: application/json" -d "{\"email\":\"tu@correo.com\",\"password\":\"tu-clave\"}"
```
Copiá el `access_token` de la respuesta y usalo así:
```
curl -X POST http://localhost:8000/productos -H "Content-Type: application/json" -H "Authorization: Bearer EL_ACCESS_TOKEN" -d "{\"nombre\":\"Balón\",\"precio\":19.99,\"stock\":40,\"categoria_id\":1}"

curl http://localhost:8000/auth/me -H "Authorization: Bearer EL_ACCESS_TOKEN"

curl -X POST http://localhost:8000/auth/refresh -H "Content-Type: application/json" -d "{\"refresh_token\":\"EL_REFRESH_TOKEN\"}"

curl -X DELETE http://localhost:8000/productos/1 -H "Authorization: Bearer TOKEN_DE_ADMIN"
```
También podés usar Postman, Insomnia o Thunder Client (VS Code): en la pestaña *Auth* elegí *Bearer Token*.

## Formato de respuestas

Éxito: `{ "success": true, "message": "...", "data": {}, "meta": {} }`
Error: `{ "success": false, "message": "...", "errors": ["..."] }`

Códigos usados: 200, 201, 400 (JSON inválido), 401 (sin token, token inválido o credenciales incorrectas), 403 (sin permisos), 404, 405, 409 (email repetido), 422 (validación), 429 (demasiados intentos), 500.

## Producción

- Usá **HTTPS**: los tokens viajan en cada petición.
- `APP_DEBUG=false` y `CORS_ALLOWED_ORIGIN` con tu dominio real.
- Guardá `JWT_SECRET` solo en `.env` (ya está en `.gitignore`). Si se filtra, hay que cambiarlo: eso invalida todos los access tokens emitidos.
- En Apache, apuntá el DocumentRoot a `public/`; el `.htaccess` incluido redirige todo a `index.php` y pasa la cabecera `Authorization`.
- Con Nginx, usá `try_files $uri /index.php?$query_string;` y `fastcgi_param HTTP_AUTHORIZATION $http_authorization;`.
- Podés borrar periódicamente los refresh tokens vencidos o revocados de la tabla `refresh_tokens`.

## Cómo agregar un nuevo recurso

1. Modelo en `src/Models/`, validador en `src/Validators/` y controlador en `src/Controllers/`.
2. Rutas en `routes/api.php`, con `$auth` o `$admin` según corresponda.
