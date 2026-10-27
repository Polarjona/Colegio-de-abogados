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

La API no requiere PostgreSQL ni otro servidor de base de datos. Las variables
de `backend/.env.example` se obtienen desde Firebase Console.

El endpoint `/login` usa `FIREBASE_WEB_API_KEY` para la API de Identity
Toolkit. Esta clave no es una credencial privada; las credenciales Admin sí lo
son y deben mantenerse fuera del control de versiones.
