# Backend Firebase

## Requisitos

- Node.js 20 o superior.
- Proyecto Firebase con Authentication (correo/contraseña), Firestore y
  Cloud Messaging habilitados.

## Ejecución

```text
cp .env.example .env
npm install
npm start
```

La API queda disponible en `http://localhost:8080` por defecto. Consulta
[`../.env.example`](.env.example) para las variables necesarias.

## Endpoints de prueba

- `GET /` devuelve `Marco Legal API funcionando`.
- `GET /health` comprueba la conexión con PostgreSQL y devuelve el estado del
  backend.

El backend también se puede iniciar junto con PostgreSQL desde la raíz con
`docker compose up --build`.
