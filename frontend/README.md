# ICAT Tarragona — React Native

Aplicación móvil multiplataforma construida con React Native y Expo. Incluye
acceso y registro mediante la API, inicio, novedades, detalle, filtros,
historial, avisos, perfil y preferencias.

El login, el registro, el perfil, las preferencias, el historial y los avisos
se consumen desde la API del backend. La recuperación de contraseña envía el
enlace directamente mediante Firebase Identity Toolkit. El botón de consulta
al BOE lo indica explícitamente cuando aún no hay un enlace oficial asociado.

## Abrir y ejecutar

1. Instala Node.js 20 o superior:

   ```shell
   npm ci
   ```

2. Ejecuta la aplicación:

   ```shell
   npm start
   ```

   Usa `a` para Android, `i` para iOS o `w` para web en la terminal de Expo.
   También puedes ejecutar directamente `npm run web`.

La aplicación consume el backend mediante `EXPO_PUBLIC_API_URL`. Para
desarrollo local usa `http://localhost:3006` (o `http://10.0.2.2:3006` en un
emulador Android). En un teléfono físico, crea un túnel para el backend:

Configura también `EXPO_PUBLIC_FIREBASE_WEB_API_KEY` con la Web API Key del
proyecto Firebase en el `.env` local.

```shell
cloudflared tunnel --url http://localhost:3006
```

Copia la URL `https://...trycloudflare.com` generada y configúrala en
`.env`:

```shell
printf 'EXPO_PUBLIC_API_URL=https://TU-URL.trycloudflare.com\n' > .env
# Añade EXPO_PUBLIC_FIREBASE_WEB_API_KEY=<Web API Key de Firebase>.
```

Después inicia Expo con su propio túnel:

```shell
npx expo start --tunnel
```

El túnel de Cloudflare y Expo deben permanecer abiertos. La URL temporal de
Cloudflare cambia al crear un túnel nuevo.

## Recorrido de la demo

- La app abre directamente Iniciar sesión. Completa un correo y una contraseña
  de al menos ocho caracteres y pulsa **Entrar** para abrir Inicio.
- La sesión se guarda localmente y se restaura al recargar la web o reabrir
  Expo; si el token caduca, se renueva con el refresh token.
- Desde Perfil puedes cerrar sesión y volver a Iniciar sesión.
- En Inicio, abre **Ver todas**, toca una tarjeta para ver su detalle o usa el
  icono de controles para abrir las áreas jurídicas.
- La barra inferior abre Inicio, Historial, Avisos y Perfil.
- Desde Perfil puedes entrar a preferencias y áreas jurídicas, o cerrar sesión.
- Desde Perfil puedes consultar el Aviso Legal y la Política de Privacidad, o
  solicitar la eliminación definitiva de la cuenta y sus datos.
- El registro exige aceptar de forma expresa y no premarcada ambos documentos
  legales. También permite indicar, de forma opcional, número de colegiado y
  materias jurídicas de interés. Las materias se guardan en
  `preferences/{uid}.categories` y aparecen seleccionadas en **Áreas
  jurídicas**.
- La recuperación solo solicita el correo. Firebase envía un enlace para
  cambiar la contraseña; la aplicación no solicita códigos ni contraseñas
  nuevas.
- Desde Perfil se puede eliminar la cuenta. El backend elimina los datos
  relacionados en Firestore y las cuentas Firebase duplicadas con el mismo
  correo.
- Para probar el registro, vuelve a Bienvenida y pulsa **Registrarme**.

El acceso y el registro usan Firebase mediante el backend; no son cuentas de
prototipo cuando Firebase está configurado. En modo demo, el backend permite
probar el flujo sin persistencia real.

La identidad legal mostrada en la aplicación se configura mediante
`EXPO_PUBLIC_LEGAL_ENTITY`, `EXPO_PUBLIC_LEGAL_NIF`,
`EXPO_PUBLIC_LEGAL_ADDRESS`, `EXPO_PUBLIC_LEGAL_EMAIL` y
`EXPO_PUBLIC_LEGAL_VERSION`. Deben completarse con los datos verificados de la
entidad antes de publicar la aplicación.

## Estructura

```text
App.js          # Navegación, pantallas y componentes React Native
app.json        # Configuración Expo para Android, iOS y web
babel.config.js # Configuración Metro/Babel
Dockerfile      # Exportación web y servidor estático
```

## Llevar el diseño a Figma

La app usa una paleta azul marino, dorado y fondo marfil, y se adapta a
teléfonos y a la vista web.
