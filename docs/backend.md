 # Backend del Colegio de Abogados

Este documento describe el backend implementado actualmente: qué componentes lo
forman, cómo se conectan entre sí, qué datos gestiona, qué endpoints expone y
cómo se ejecuta en local. La referencia principal de la API también está en
[`docs/architecture.md`](docs/architecture.md).

## Resumen

El backend es una API REST para una aplicación móvil de noticias legislativas y
notificaciones:

- **Runtime:** Node.js 20 o superior.
- **Servidor HTTP:** Express.js.
- **Base de datos:** PostgreSQL 16.
- **Persistencia:** cliente `pg` con un `Pool` de conexiones.
- **Autenticación:** JWT firmado por el backend.
- **Contraseñas:** `bcryptjs` con factor de coste 12.
- **Notificaciones push:** Firebase Cloud Messaging mediante `firebase-admin`.
- **Ejecución local:** Docker Compose o Node.js directamente.

El punto de entrada de producción/desarrollo es
[`backend/src/server.js`](backend/src/server.js). El servidor escucha en el
puerto `8080` por defecto.

## Mapa de conexiones

```text
Aplicación móvil / cliente HTTP
              |
              | HTTP JSON
              v
      backend:8080
      (Express: app.js)
        |       |        |
        |       |        +--> Firebase Cloud Messaging
        |       |             (solo /notifications/send)
        |       |
        |       +----------> JWT y bcryptjs
        |                    (auth.js)
        |
        +------------------> PostgreSQL:5432
                             (db.js / pg Pool)
                                   |
                                   +--> users
                                   +--> preferences
                                   +--> news
                                   +--> device_tokens
```

En Docker Compose la conexión interna del backend a PostgreSQL usa el nombre de
servicio `database`, no `localhost`:

```text
backend -> postgres://postgres:postgres@database:5432/colegio
```

Desde el equipo anfitrión, PostgreSQL se publica en `localhost:5432` y la API
en `localhost:8080`.

## Estructura y responsabilidades

### [`backend/src/server.js`](backend/src/server.js)

- Carga la aplicación Express.
- Lee la configuración mediante `getConfig()`.
- Inicia `app.listen()` en el puerto configurado.
- Es el archivo usado por los scripts `start` y `dev`.

### [`backend/src/app.js`](backend/src/app.js)

- Crea la instancia de Express.
- Activa el parser JSON con un límite de `1mb`.
- Declara todos los endpoints HTTP.
- Ejecuta consultas a PostgreSQL a través de `pool`.
- Aplica `requireAuth` a los endpoints protegidos.
- Convierte errores no tratados en una respuesta JSON `500`.

### [`backend/src/config.js`](backend/src/config.js)

- Carga variables desde `.env` con `dotenv`.
- Exige `DATABASE_URL` y `JWT_SECRET`.
- Define `PORT` con valor por defecto `8080`.
- Define `JWT_EXPIRES_IN` con valor por defecto `1d`.
- Lee las tres credenciales opcionales de Firebase.
- Convierte los saltos de línea escapados de `FIREBASE_PRIVATE_KEY` en saltos
  reales, necesarios para la clave privada.

Si falta una variable obligatoria, el proceso falla al arrancar con un error
explícito.

### [`backend/src/db.js`](backend/src/db.js)

- Crea un `Pool` de `pg` usando `DATABASE_URL`.
- Exporta el pool compartido que utilizan las rutas.
- No crea tablas automáticamente; el esquema se aplica mediante Docker Compose
  o mediante una instalación manual de los scripts SQL.

### [`backend/src/auth.js`](backend/src/auth.js)

- `hashPassword(password)`: almacena contraseñas usando bcrypt.
- `comparePassword(password, hash)`: comprueba credenciales durante el login.
- `createToken(user)`: crea un JWT con `sub` igual al identificador de usuario y
  `email` igual a su correo.
- `requireAuth`: exige `Authorization: Bearer <token>`, valida firma y
  expiración, y deja el payload validado en `req.user`.

### [`backend/src/firebase.js`](backend/src/firebase.js)

- Inicializa Firebase Admin de forma diferida, solo cuando se intenta enviar
  una notificación.
- Requiere `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL` y
  `FIREBASE_PRIVATE_KEY`.
- Usa `sendEachForMulticast` para enviar el mismo mensaje a varios tokens.
- Si Firebase no está configurado, la ruta devuelve `503` en vez de simular un
  envío correcto.

## API HTTP

Todas las respuestas son JSON. Las rutas protegidas requieren:

```http
Authorization: Bearer <jwt>
```

### `GET /`

Endpoint de prueba del Día 2. Devuelve:

```json
{ "message": "Marco Legal API funcionando" }
```

No requiere autenticación.

### `GET /health`

Comprueba que la API puede ejecutar `SELECT 1` contra PostgreSQL.

Respuesta correcta:

```json
{
  "status": "OK",
  "message": "Backend funcionando correctamente"
}
```

No requiere autenticación. Si la base de datos no responde, se devuelve `500`.

### `POST /register`

Crea un usuario, crea sus preferencias iniciales dentro de la misma transacción
y devuelve un JWT.

Solicitud:

```json
{
  "email": "persona@example.com",
  "password": "una-clave-de-8-o-mas",
  "name": "Nombre opcional"
}
```

Reglas actuales:

- `email` y `password` deben ser textos no vacíos.
- La contraseña debe tener al menos 8 caracteres.
- El correo se recorta y se normaliza a minúsculas.
- `name` es opcional.
- Un correo duplicado devuelve `409`.
- Un error durante el alta hace `ROLLBACK`.

Devuelve `201` con `{ user, token }`. La respuesta de usuario no contiene el
hash de contraseña.

### `POST /login`

Autentica un usuario por correo y contraseña.

Solicitud:

```json
{
  "email": "persona@example.com",
  "password": "una-clave-de-8-o-mas"
}
```

El correo se normaliza igual que en el registro. Devuelve `{ user, token }`.
Las credenciales ausentes devuelven `400` y las incorrectas `401`.

### `GET /news`

No requiere autenticación. Devuelve como máximo las 50 noticias publicadas más
recientes, filtradas con `published_at <= NOW()` y ordenadas de más nueva a más
antigua.

Respuesta:

```json
{
  "news": [
    {
      "id": 1,
      "title": "Título",
      "summary": "Resumen",
      "content": "Contenido",
      "source_url": "https://example.com",
      "published_at": "2026-01-01T00:00:00.000Z"
    }
  ]
}
```

### `GET /preferences`

Requiere JWT. Busca las preferencias del usuario identificado por `req.user.sub`.

Respuesta:

```json
{
  "preferences": {
    "email_notifications": true,
    "push_notifications": true,
    "categories": ["legislación"]
  }
}
```

Si no existe el registro, devuelve `404`.

### `PUT /preferences`

Requiere JWT y reemplaza las preferencias del usuario.

Solicitud:

```json
{
  "emailNotifications": true,
  "pushNotifications": true,
  "categories": ["legislación", "boletines"]
}
```

Los dos campos de notificaciones deben ser booleanos y `categories` debe ser un
array cuyos elementos sean textos. La operación usa un
`INSERT ... ON CONFLICT (user_id) DO UPDATE`, por lo que también puede reparar
un registro de preferencias ausente.

### `POST /notifications/send`

Requiere JWT. Valida `title` y `body`, busca todos los registros activos de
`device_tokens` y envía el mensaje a Firebase Cloud Messaging.

Solicitud:

```json
{
  "title": "Nueva noticia",
  "body": "Se ha publicado una actualización legislativa",
  "data": {
    "newsId": "123"
  }
}
```

Respuestas:

- Si no hay tokens activos: `{ "sent": 0, "failed": 0 }`.
- Si Firebase está configurado: informa los contadores `sent` y `failed`
  devueltos por Firebase.
- Si faltan credenciales de Firebase: `503`.
- `title` o `body` ausentes o vacíos: `400`.

## Modelo de datos

El modelo está definido en [`database/schema.sql`](database/schema.sql) y se
inicializa con [`database/seed.sql`](database/seed.sql).

### `users`

| Campo | Función |
|---|---|
| `id` | Identificador `BIGSERIAL`, clave primaria |
| `email` | Correo único y obligatorio |
| `name` | Nombre opcional |
| `password_hash` | Hash bcrypt, nunca debe exponerse |
| `created_at` | Fecha de alta |

### `preferences`

| Campo | Función |
|---|---|
| `user_id` | Clave primaria y referencia a `users` |
| `email_notifications` | Activa/desactiva avisos por correo |
| `push_notifications` | Activa/desactiva avisos push |
| `categories` | Array PostgreSQL de categorías |
| `updated_at` | Última actualización |

La relación con `users` usa `ON DELETE CASCADE`.

### `news`

Contiene las noticias que consume `GET /news`. Tiene índices sobre
`published_at` para acelerar el listado ordenado.

### `device_tokens`

Guarda tokens FCM únicos, opcionalmente asociados a un usuario, y un indicador
`active`. La ruta de envío solo selecciona filas con `active = TRUE`.

**Estado actual:** el esquema ya soporta el registro de dispositivos, pero la
API implementada no expone todavía una ruta para crear, desactivar o actualizar
estos tokens. Para que `/notifications/send` envíe notificaciones en un entorno
real, los tokens deben cargarse por otro proceso o debe añadirse esa API.

## Arranque y despliegue local

### Docker Compose

Desde la raíz del proyecto:

```text
docker compose up --build
```

Esto levanta:

1. `database`: PostgreSQL 16 Alpine, con volumen persistente
   `postgres-data`.
2. `backend`: imagen construida desde [`backend/Dockerfile`](backend/Dockerfile),
   publicada en el puerto `8080`.
3. `frontend`: contenedor publicado en el puerto `3000`, dependiente del
   backend.

Los scripts `schema.sql` y `seed.sql` se montan como scripts de inicialización
de PostgreSQL. PostgreSQL solo los ejecuta automáticamente cuando se crea el
directorio de datos por primera vez; si el volumen ya existe, los cambios en
esos scripts no se aplican de forma automática.

La configuración del contenedor backend está en
[`docker-compose.yml`](docker-compose.yml). Para producción, el valor de
`JWT_SECRET` debe sustituirse por un secreto largo y aleatorio.

### Ejecución del backend fuera de Docker

1. Instalar Node.js 20 o superior.
2. Instalar dependencias desde [`backend/package.json`](backend/package.json):

   ```text
   cd backend
   npm install
   ```

3. Copiar [`backend/.env.example`](backend/.env.example) a `backend/.env`.
4. Ajustar `DATABASE_URL` para apuntar a PostgreSQL accesible desde el equipo.
5. Aplicar [`database/schema.sql`](database/schema.sql) y, opcionalmente,
   [`database/seed.sql`](database/seed.sql).
6. Arrancar:

   ```text
   npm start
   ```

Durante desarrollo se puede usar `npm run dev`, que ejecuta Node con watch.

## Variables de entorno

| Variable | Obligatoria | Uso |
|---|---:|---|
| `PORT` | No | Puerto HTTP; por defecto `8080` |
| `DATABASE_URL` | Sí | Cadena de conexión PostgreSQL |
| `JWT_SECRET` | Sí | Clave de firma de los JWT |
| `JWT_EXPIRES_IN` | No | Duración del JWT; por defecto `1d` |
| `FIREBASE_PROJECT_ID` | Solo para FCM | Proyecto Firebase |
| `FIREBASE_CLIENT_EMAIL` | Solo para FCM | Cuenta de servicio |
| `FIREBASE_PRIVATE_KEY` | Solo para FCM | Clave privada de la cuenta |

Las variables están ejemplificadas en
[`backend/.env.example`](backend/.env.example). No se deben commitear valores
reales de secretos ni credenciales Firebase.

## Flujo de autenticación

1. El cliente llama a `/register` o `/login`.
2. El backend consulta PostgreSQL y compara la contraseña con bcrypt.
3. El backend firma un JWT con `JWT_SECRET`.
4. El cliente conserva el token y lo envía como Bearer token.
5. `requireAuth` verifica firma y expiración antes de acceder a
   `/preferences` o `/notifications/send`.
6. Las consultas protegidas usan el `sub` del token como `user_id`.

La autenticación es stateless: no hay tabla de sesiones ni revocación de tokens
implementada. La expiración se controla mediante `JWT_EXPIRES_IN`.

## Manejo de errores y validación

- Los cuerpos JSON inválidos o que superan `1mb` son rechazados por Express.
- Las validaciones específicas de cada ruta devuelven `400`.
- Los tokens ausentes, inválidos o caducados devuelven `401`.
- Los conflictos de correo devuelven `409`.
- La falta de configuración de FCM devuelve `503`.
- Los errores no manejados se registran con `console.error` y devuelven un
  mensaje genérico `500`; no se exponen detalles internos al cliente.

## Alcance actual y puntos pendientes

- No hay endpoint CRUD para administrar noticias; actualmente se insertan por
  SQL o por un proceso externo.
- No hay endpoint para registrar o revocar tokens de dispositivos, aunque la
  tabla existe.
- No hay envío de correo implementado; `email_notifications` solo se persiste.
- Firebase Admin se usa para **Cloud Messaging**. Aunque
  [`docker-compose.yml`](docker-compose.yml) contiene comentarios sobre
  Firestore y Firebase Authentication, esas integraciones no están conectadas
  al código actual.
- No se ha implementado paginación de noticias: el límite actual es fijo en 50.
- No existe una migración versionada; el esquema depende de los scripts de
  inicialización de PostgreSQL.

## Pruebas y comandos del paquete

Los scripts definidos en `backend/package.json` son:

| Comando | Propósito |
|---|---|
| `npm start` | Arrancar la API |
| `npm run dev` | Arrancar la API con Nodemon |
| `npm test` | Ejecutar las pruebas de Node.js disponibles |
