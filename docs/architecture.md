# Arquitectura Firebase

La aplicación usa Firebase como plataforma única de datos y autenticación:

```text
Expo/React Native -> API Express -> Firebase Authentication
                    -> Cloud Firestore
                    -> Firebase Cloud Messaging
```

## Servicios

- **Authentication:** registro y login con correo y contraseña.
- **Cloud Firestore:** colecciones `users`, `preferences`, `news` y
  `deviceTokens`, `notifications` e `history`.
- **Cloud Messaging:** notificaciones push.
- **Firebase Admin SDK:** acceso seguro del backend a los servicios anteriores.

No se usa PostgreSQL, JWT propio, bcrypt ni una conexión directa desde Expo a
la base de datos.

## API

Las rutas protegidas reciben `Authorization: Bearer <Firebase ID token>`.

| Método | Ruta | Auth | Propósito |
|---|---|---|---|
| GET | `/` | No | Comprobar que la API está disponible |
| GET | `/health` | No | Comprobar acceso a Firestore |
| POST | `/register` | No | Crear usuario Firebase y sus documentos iniciales |
| POST | `/login` | No | Iniciar sesión mediante Firebase Authentication |
| GET | `/news` | No | Obtener las 50 noticias publicadas más recientes |
| GET | `/preferences` | Firebase | Obtener preferencias del usuario |
| PUT | `/preferences` | Firebase | Guardar preferencias del usuario |
| POST | `/devices/token` | Firebase | Registrar token FCM |
| DELETE | `/devices/token` | Firebase | Desactivar token FCM |
| POST | `/notifications/send` | Firebase | Enviar una notificación mediante FCM |
| GET | `/notifications` | Firebase | Listar avisos del usuario |
| PATCH | `/notifications/:id/read` | Firebase | Marcar un aviso como leído |
| GET | `/history` | Firebase | Listar publicaciones consultadas |
| PUT | `/history/:newsId` | Firebase | Registrar una consulta |

## Configuración

Copiar `backend/.env.example` a `backend/.env` y completar las credenciales de
Firebase Console. La clave privada nunca debe subirse al repositorio.

Para desarrollar con Firestore Security Rules, publicar también reglas que
limiten cada documento por `request.auth.uid`. El backend usa Admin SDK y por
eso sus lecturas no están limitadas por esas reglas.

## Desarrollo local y túneles

Docker publica el backend en `http://localhost:3006` y el frontend web en
`http://localhost:3000`. Para probar la aplicación móvil desde un teléfono
físico, se expone el backend con `cloudflared tunnel --url
http://localhost:3006` y se configura la URL resultante en
`frontend/.env` como `EXPO_PUBLIC_API_URL`. Expo se inicia con `npx expo start
--tunnel` para exponer Metro.
