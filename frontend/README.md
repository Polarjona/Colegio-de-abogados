# Marco Legal — React Native

Aplicación móvil multiplataforma construida con React Native y Expo. Incluye
acceso y registro mediante la API, inicio, novedades, detalle, filtros,
historial, avisos, perfil y preferencias.

La autenticación, las novedades y las preferencias se consumen desde la API
del backend. El botón de consulta al BOE lo indica explícitamente cuando aún
no hay un enlace oficial asociado.

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

```shell
cloudflared tunnel --url http://localhost:3006
```

Copia la URL `https://...trycloudflare.com` generada y configúrala en
`.env`:

```shell
printf 'EXPO_PUBLIC_API_URL=https://TU-URL.trycloudflare.com\n' > .env
```

Después inicia Expo con su propio túnel:

```shell
npx expo start --tunnel
```

El túnel de Cloudflare y Expo deben permanecer abiertos. La URL temporal de
Cloudflare cambia al crear un túnel nuevo.

## Recorrido de la demo

- La app abre directamente Iniciar sesión. Completa un correo y una contraseña
  de al menos seis caracteres y pulsa **Entrar** para abrir Inicio.
- Desde Perfil puedes cerrar sesión y volver a Iniciar sesión.
- En Inicio, abre **Ver todas**, toca una tarjeta para ver su detalle o usa el
  icono de controles para abrir las áreas jurídicas.
- La barra inferior abre Inicio, Historial, Avisos y Perfil.
- Desde Perfil puedes entrar a preferencias y áreas jurídicas, o cerrar sesión.
- Para probar el registro, vuelve a Bienvenida y pulsa **Registrarme**.

El acceso y el registro validan campos localmente y entran con cualquier dato
válido: son interacciones de prototipo, no cuentas reales.

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
