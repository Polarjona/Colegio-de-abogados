# Backend Firebase

## Requisitos

- Node.js 20 o superior.
- Proyecto Firebase con Authentication (correo/contraseña), Firestore y
  Cloud Messaging habilitados.

Docker Compose carga automáticamente `backend/.env`. Si no hay credenciales
Firebase completas, el backend arranca en modo demo para
poder probar la aplicación localmente. Este modo
expone noticias y autenticación de prueba en memoria; no debe usarse en
producción.

## Ejecución

```text
cp .env.example .env
npm ci
npm start
```

La API queda disponible en `http://localhost:8080` al ejecutar el backend
directamente. En Docker Compose se publica en `http://localhost:3006` por
defecto. Consulta
[`../.env.example`](.env.example) para las variables necesarias.

## Endpoints de prueba

- `GET /` devuelve `Marco Legal API funcionando`.
- `GET /health` comprueba la conexión con Firebase y devuelve el estado del
  backend.

El backend también se puede iniciar junto con el frontend desde la raíz con
`docker compose up --build`.
