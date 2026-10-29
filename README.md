# Colegio de Abogados

Aplicación móvil para recibir notificaciones sobre novedades legislativas
publicadas en el BOE.

## Estructura

- `frontend/`: aplicacion React Native con Expo (Android, iOS y web).
- `backend/`: API REST con Node.js y Express.
- `functions/`: importación horaria del BOE y envío de notificaciones.
- `docs/`: documentacion tecnica y requisitos.

## Ejecución local recomendada

### Requisitos

- Docker y Docker Compose.
- Node.js 20 o superior.
- `cloudflared` si se va a probar desde un móvil físico.

### Backend y frontend web con Docker

Desde la raíz del repositorio:

```shell
docker compose up --build
```

Esto inicia el backend y el frontend web. Los servicios quedan disponibles en:

- Frontend web: <http://localhost:3000>
- Backend: <http://localhost:3006>

Comprueba el backend con:

```shell
curl http://localhost:3006/health
```

Docker Compose carga automáticamente `backend/.env`. Para usar Firebase real,
completa ese archivo con las variables de [`backend/.env.example`](backend/.env.example).
Si faltan credenciales, el backend puede arrancar en modo demo.


Si el puerto `3006` está ocupado:

```shell
BACKEND_PORT=3007 docker compose up --build
```

En ese caso, cambia también la URL del frontend a `http://localhost:3007`.

Para detener los contenedores:

```shell
docker compose down
```

Para detenerlos y eliminar los datos persistidos de los contenedores:

```shell
docker compose down -v
```

### Probar desde un móvil con túneles

Usa tres terminales y mantén las tres abiertas.

**Terminal 1 — backend y frontend:**

```shell
cd /home/b_pol_arjona/Colegio-de-abogados
docker compose up --build
```

**Terminal 2 — túnel del backend:**

```shell
cloudflared tunnel --url http://localhost:3006
```

Copia la URL `https://...trycloudflare.com` que muestre Cloudflare.

**Terminal 3 — configurar y arrancar Expo:**

```shell
cd /home/b_pol_arjona/Colegio-de-abogados/frontend
printf 'EXPO_PUBLIC_API_URL=https://TU-URL.trycloudflare.com\n' > .env
npm ci
npx expo start --tunnel
```

Sustituye `TU-URL.trycloudflare.com` por la URL real del túnel. La URL cambia
cuando se crea un túnel nuevo. Después, escanea el código QR con Expo Go o usa
`a` para Android, `i` para iOS y `w` para web.

El túnel de Cloudflare expone la API; el parámetro `--tunnel` de Expo expone
Metro para que el móvil pueda cargar la aplicación. No cierres ninguna de las
terminales mientras estés probando.

## Ejecutar el backend sin Docker

```shell
cd backend
npm ci
npm run dev
```

La API se inicia en <http://localhost:8080>. `GET /` devuelve un mensaje de
estado y `GET /health` comprueba la conexion con Firebase.

## Equipo

- Frontend: Akram
- Backend: Dhruva
- DevOps: Pol
- Base de datos: Yazan

## Tecnologías

- React Native y Expo
- Node.js y Express
- Firebase
- Docker
- GitHub Actions

## Importación automática del BOE

Consulta [`docs/backend.md`](docs/backend.md) para configurar el workflow de
GitHub Actions, que revisa el BOE cada hora e informa de las novedades nuevas
según las preferencias de cada usuario sin requerir el plan Blaze.
