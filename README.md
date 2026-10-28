# Colegio de Abogados

Aplicacion movil para recibir notificaciones sobre novedades legislativas
publicadas en el BOE.

## Estructura

- `frontend/`: aplicacion React Native con Expo (Android, iOS y web).
- `backend/`: API REST con Node.js y Express.
- `database/`: esquema y datos iniciales de Firebase.
- `docs/`: documentacion tecnica y requisitos.

## Ejecutar con Docker

Requisitos: Docker y Docker Compose.

Desde la raiz del repositorio:

```shell
docker compose up --build
```

Esto inicia PostgreSQL, el backend y el frontend. Los servicios quedan
disponibles en:

- Frontend: <http://localhost:3000>
- Backend: <http://localhost:3006>


Para detener los contenedores:

```shell
docker compose down
```

Para detenerlos y borrar los datos persistidos de PostgreSQL:

```shell
docker compose down -v
```

El backend necesita `DATABASE_URL` y `JWT_SECRET`. En Docker Compose se
configuran automaticamente; para ejecutarlo fuera de Docker, copia
[`backend/.env.example`](backend/.env.example) a `backend/.env` y ajusta sus
valores.

Por defecto, Docker Compose usa el modo demo de Firebase para poder arrancar
sin credenciales externas. Para usar Firebase real, configura las variables
del archivo `.env` y establece `DEMO_MODE=false`. Si el puerto elegido está
ocupado, usa `BACKEND_PORT=3007 docker compose up --build`.

## Ejecutar el backend sin Docker

```shell
cd backend
npm install
npm run dev
```

La API se inicia en <http://localhost:8080>. `GET /` devuelve un mensaje de
estado y `GET /health` comprueba la conexion con Firebase.

## Equipo

- Frontend: Akram
- Backend: Dhruva
- DevOps: Pol
- Base de datos: Yazan

## Tecnologias

- React Native y Expo
- Node.js y Express
- Firebase
- Docker
- GitHub Actions
