# Tienda: frontend en React

Panel para gestionar productos y categorías de la API `tienda-api` (PHP + MySQL + JWT). Hecho con React, React Router y Vite, sin librerías de estilos ni de estado: son pocas dependencias y fáciles de seguir.

## Puesta en marcha

Necesitás Node 18 o superior (mejor 20+) y la API corriendo.

1. **API.** En la carpeta del backend:
   ```
   php -S localhost:8080 -t public
   ```
2. **Frontend.** En esta carpeta:
   ```
   npm install
   npm run dev
   ```
   Abrí http://localhost:5173.

Si tu API corre en otra dirección o puerto, copiá `.env.example` como `.env` y cambiá `VITE_API_URL` (por ejemplo `http://localhost:8000`). Después reiniciá `npm run dev`.

Para probarlo, creá un administrador con `php bin/crear-admin.php "Tu Nombre" tu@correo.com` en el backend, o usá **Crear cuenta** en la pantalla (esas cuentas son `user`).

## Qué puede hacer cada persona

| | Sin cuenta | Usuario | Administrador |
|---|---|---|---|
| Ver productos y categorías | Sí | Sí | Sí |
| Crear y editar | No | Sí | Sí |
| Eliminar | No | No | Sí |

Es el mismo reparto que aplica la API. La interfaz solo oculta lo que no corresponde: la seguridad real la pone la API, que valida el token y el rol en cada petición.

## Cómo funciona el login

El backend entrega **dos tokens** al iniciar sesión (`POST /auth/login`):

| Token | Dura | Dónde se guarda en el frontend |
|---|---|---|
| `access_token` (JWT) | 1 hora | Solo en memoria (una variable en `src/api/client.js`) |
| `refresh_token` | 30 días, de un solo uso | `localStorage` |

**Cada petición protegida** lleva `Authorization: Bearer <access_token>`. Esto lo hace `request()` en `src/api/client.js`, así que ninguna pantalla maneja tokens directamente.

**Cuando el access token vence**, la API responde 401. `request()` lo detecta, canjea el refresh token en `POST /auth/refresh` (recibe un par nuevo) y repite la petición original. La persona no nota nada.

**Al recargar la página** la memoria se vacía, pero el refresh token sigue en `localStorage`. `AuthProvider` lo canjea al arrancar y pide `GET /auth/me` para recuperar el usuario. Mientras tanto `loading` vale `true`, y las rutas protegidas esperan en lugar de mandar al login por error.

**Rutas protegidas.** `ProtectedRoute` manda a `/login` a quien no tiene sesión y recuerda a dónde quería ir. Después de ingresar, `GuestRoute` lo devuelve a esa pantalla.

**Cerrar sesión** borra los tokens locales y revoca el refresh token en el servidor (`POST /auth/logout`). Si hay otras pestañas abiertas, también se cierran.

### Un detalle importante: los refresh tokens se usan una sola vez

La API rota el refresh token en cada renovación, y si alguien presenta uno ya usado revoca todas las sesiones de ese usuario (así detecta robos). Por eso el cliente **nunca debe lanzar dos renovaciones a la vez con el mismo token**, o se cerraría la sesión sola. `refreshSession()` lo evita:

- Las llamadas simultáneas (por ejemplo, cinco pantallas pidiendo datos con el token vencido, o React StrictMode ejecutando un efecto dos veces en desarrollo) comparten **una sola** petición `/auth/refresh`.
- Entre pestañas del mismo navegador se serializa con Web Locks (`navigator.locks`), y el token se lee de `localStorage` justo antes de usarlo.

### Dónde se guarda el refresh token, y por qué

`localStorage` es la opción más simple cuando la API devuelve el token en el cuerpo de la respuesta, pero cualquier script de la página puede leerlo si hubiera una vulnerabilidad XSS. React escapa por defecto todo lo que se muestra, y esta app no inyecta HTML, lo que reduce el riesgo; aun así, es una decisión a tener en cuenta.

La alternativa más segura es que el backend envíe el refresh token en una **cookie `HttpOnly`** (JavaScript no puede leerla). Eso exige cambios en la API (cookie, `SameSite`, CORS con credenciales). Si más adelante querés dar ese paso, el único archivo del frontend que habría que tocar es `src/api/client.js`.

## Estructura

```
src/
├── main.jsx                  # arranque: Router + AuthProvider
├── App.jsx                   # tabla de rutas (públicas y protegidas)
├── index.css                 # estilos
├── api/
│   ├── client.js             # fetch, tokens, renovación automática, ApiError
│   ├── auth.js               # login, registro, logout, restoreSession
│   ├── productos.js          # llamadas de productos
│   └── categorias.js         # llamadas de categorías
├── context/
│   ├── AuthProvider.jsx      # estado de sesión
│   └── authContext.js        # contexto y hook useAuth()
├── components/
│   ├── Layout.jsx            # cabecera y navegación
│   ├── ProtectedRoute.jsx    # exige sesión (y opcionalmente rol)
│   ├── GuestRoute.jsx        # para login y registro
│   ├── Alert.jsx
│   └── Pagination.jsx
├── pages/                    # Login, Register, Productos, ProductoForm,
│                             # Categorias, CategoriaForm, NotFound
└── lib/
    ├── format.js             # formato de precios y símbolo de moneda
    └── useFlash.js           # mensajes como "Producto guardado."
```

`src/api/` no depende de React: se puede reutilizar o probar por separado.

## Personalizar

- **Moneda:** cambiá `CURRENCY_SYMBOL` en `src/lib/format.js`.
- **Colores y tipografía:** están como variables al comienzo de `src/index.css`. La fuente (Schibsted Grotesk) se carga desde Google Fonts en `index.html`; si no está disponible, se usa la fuente del sistema.
- **Quién puede qué:** `ProtectedRoute` acepta `roles`, por ejemplo `<ProtectedRoute roles={['admin']}>` para una pantalla solo de administradores. Las acciones de cada fila se muestran según `isAuthenticated` e `isAdmin` de `useAuth()`.
- **Nueva pantalla:** creá la página en `src/pages/`, sus llamadas en `src/api/` y registrá la ruta en `App.jsx`.

## Producción

```
npm run build
```
Genera la carpeta `dist/`. Subila a cualquier servidor de archivos estáticos configurado para devolver `index.html` en las rutas que no existen como archivo (por ejemplo `/productos/5/editar`); sin eso, recargar esas páginas daría 404.

Antes de publicar:

- Poné `VITE_API_URL` con la URL real de la API (con HTTPS) antes de ejecutar `build`.
- En el `.env` del backend, cambiá `CORS_ALLOWED_ORIGIN` por el dominio del frontend en lugar de `*`.
- Servilo todo por HTTPS: los tokens viajan en cada petición.
