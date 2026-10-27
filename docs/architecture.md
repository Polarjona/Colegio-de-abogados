# Backend architecture

## Technology choice

- **Node.js 20 + Express.js**: small REST API with a simple deployment path.
- **PostgreSQL 16**: relational persistence for users, preferences, news, and device
  registration tokens.
- **JWT**: stateless access tokens for the mobile client.
- **Firebase Cloud Messaging**: push delivery to registered mobile device tokens.
- **Docker Compose**: reproducible local PostgreSQL and API environments.

## API contract

The API listens on port `8080`. Protected endpoints use
`Authorization: Bearer <JWT>`.

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/` | No | Endpoint de prueba de disponibilidad de la API |
| POST | `/register` | No | Create an account and return a JWT |
| POST | `/login` | No | Authenticate and return a JWT |
| GET | `/news` | No | Return the 50 newest published news items |
| GET | `/preferences` | JWT | Return the current user's notification preferences |
| PUT | `/preferences` | JWT | Replace the current user's preferences |
| POST | `/notifications/send` | JWT | Send a notification through FCM |
| GET | `/health` | No | Check API and database availability |

## Local startup

```text
docker compose up --build
```

Copy `backend/.env.example` to `backend/.env` for running the API outside Docker.
Firebase credentials are only required for `/notifications/send`; the rest of the
API can be developed without them.