# Backend

API REST del proyecto Colegio de Abogados.

## Ejecutar

Desde esta carpeta:

```shell
npm install
npm run dev
```

La API queda disponible en `http://localhost:8080` por defecto. Consulta
[`./.env.example`](.env.example) para las variables necesarias.

## Endpoints de prueba

- `GET /` devuelve `Marco Legal API funcionando`.
- `GET /health` comprueba la conexión con PostgreSQL y devuelve el estado del
  backend.

El backend también se puede iniciar junto con PostgreSQL desde la raíz con
`docker compose up --build`.
