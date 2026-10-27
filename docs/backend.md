# Backend del Colegio de Abogados

El backend usa exclusivamente Firebase:

- Firebase Authentication: usuarios y contraseñas.
- Cloud Firestore: usuarios, preferencias, noticias y tokens FCM.
- Firebase Cloud Messaging: notificaciones push.
- Firebase Admin SDK: acceso seguro desde Express.

No se usa PostgreSQL, JWT propio, bcrypt ni archivos SQL.

## Configuración

Copiar [`backend/.env.example`](../backend/.env.example) a `backend/.env` y
completar las credenciales de Firebase Console:

```env
PORT=8080
FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_WEB_API_KEY=...
```

La clave privada de la cuenta de servicio no debe subirse al repositorio.

## Colecciones de Firestore

- `users/{uid}`: `uid`, `email`, `name`, `createdAt`.
- `preferences/{uid}`: `emailNotifications`, `pushNotifications`,
  `categories`, `updatedAt`.
- `news/{id}`: `title`, `summary`, `content`, `sourceUrl`, `publishedAt`.
- `deviceTokens/{fcmToken}`: `token`, `userId`, `active`, `updatedAt`.

Las noticias se pueden crear desde Firebase Console o desde una futura ruta
administrativa. `GET /news` devuelve las 50 más recientes.

## API

Las rutas protegidas requieren `Authorization: Bearer <Firebase ID token>`.

- `GET /health`: comprueba el acceso a Firestore.
- `POST /register`: crea un usuario Firebase y sus preferencias iniciales.
- `POST /login`: inicia sesión mediante Firebase Identity Toolkit.
- `GET /news`: lista noticias publicadas.
- `GET /preferences` y `PUT /preferences`: gestiona preferencias.
- `POST /devices/token` y `DELETE /devices/token`: registra y desactiva
  tokens de dispositivos.
- `POST /notifications/send`: envía FCM a tokens activos y desactiva los
  tokens inválidos.

## Arranque

```text
cd backend
npm install
npm start
```

O desde la raíz:

```text
docker compose up --build
```

Para Flutter, ejecutar `flutterfire configure` y habilitar Email/Password en
Firebase Authentication. Esto generará la configuración nativa necesaria para
Android/iOS; no se deben inventar ni compartir esos archivos con secretos.
