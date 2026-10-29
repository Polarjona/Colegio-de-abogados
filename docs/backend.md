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

## Importar noticias del BOE

El BOE publica un sumario XML diario. Para importar las secciones I, III, IV y
Tribunal Constitucional en `news`, ejecuta desde `backend/`:

```shell
npm run import:boe -- 20261028
```

El identificador oficial (`BOE-A-...`) se utiliza como ID del documento, por lo
que volver a importar el mismo día actualiza los documentos sin duplicarlos.
Antes de escribir en Firebase se puede comprobar el número de resultados:

```shell
npm run import:boe -- 20261028 --dry-run
```

Las secciones se pueden cambiar con `BOE_SECTIONS`, por ejemplo:

```shell
BOE_SECTIONS=1,2A,2B,3,4,5A,5B,5C npm run import:boe -- 20261028
```

El importador guarda `title`, `category`, `description`, `summary`,
`publishedAt`, `reference`, `boeUrl` y `sourceUrl`, compatibles con la
colección `news` que consume la aplicación. La importación debe ejecutarse en
un entorno seguro con las credenciales de Firebase Admin configuradas; no se
debe ejecutar desde Expo ni desde el móvil.

## Importación automática y notificaciones

La función `importBoeHourly` de `functions/src/index.js` consulta el BOE cada
hora mediante Cloud Scheduler. Solo considera nuevas las noticias cuyo ID
`BOE-A-...` todavía no existe en `news`, por lo que las reejecuciones no
duplican avisos. Requiere desplegar Functions y tener habilitado el plan de
facturación que incluya Cloud Scheduler:

```shell
cd functions
npm ci
cd ..
firebase deploy --only functions:importBoeHourly
```

La aplicación registra su Expo Push Token en `deviceTokens` al iniciar sesión.
La función envía avisos Expo según `preferences/{uid}.pushNotifications` y
`preferences/{uid}.categories`, y registra el resultado en
`notifications/{uid}_{newsId}`. Los tokens FCM nativos pueden almacenarse en la
misma colección con `provider: "fcm"`; el envío FCM directo requiere completar
la configuración nativa de Firebase, mientras que Expo Go usa Expo Push.

Los documentos de preferencias deben usar el UID como ID (`preferences/{uid}`).
El backend conserva compatibilidad de lectura/escritura con documentos antiguos
que tengan el campo `uid`, pero conviene migrarlos para evitar duplicados.

### Alternativa gratuita con GitHub Actions

En el plan Spark no se pueden desplegar Cloud Functions programadas. El
workflow `.github/workflows/import-boe.yml` ejecuta la sincronización cada hora
sin cambiar el plan de Firebase. También se puede lanzar manualmente desde
GitHub Actions.

En la configuración del repositorio, crea el secreto
`FIREBASE_SERVICE_ACCOUNT` con el contenido completo del JSON descargado en
Firebase Console > Configuración del proyecto > Cuentas de servicio > Generar
nueva clave privada. No lo guardes en el repositorio ni lo pegues en issues.

El workflow ejecuta `backend/src/boe-sync.js`, que:

1. Consulta el sumario XML oficial del día.
2. Escribe solo documentos nuevos o actualizados en `news`.
3. Envía notificaciones Expo según las preferencias y tokens activos.
4. Registra cada resultado en `notifications/{uid}_{newsId}`.

El primer lanzamiento manual puede importar muchas noticias y enviar avisos
pendientes. Para probar sin notificar a todos, desactiva temporalmente
`pushNotifications` en sus preferencias o limita las secciones del workflow.

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
npm ci
npm start
```

O desde la raíz:

```text
docker compose up --build
```

La aplicación cliente usa Expo/React Native. Para probarla desde un teléfono
físico, consulta la sección de túneles del
[README principal](../README.md): el backend se expone con Cloudflare Tunnel y
Expo se inicia con `npx expo start --tunnel`.
