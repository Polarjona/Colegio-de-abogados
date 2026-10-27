# Marco Legal — prototipo Flutter

Prototipo móvil del Día 1: bienvenida, acceso, registro, inicio, novedades,
detalle, filtros, historial, perfil y preferencias de notificaciones. Los datos
son de demostración; no hay conexión al BOE, autenticación ni almacenamiento.

## Abrir y ejecutar

1. Instala Flutter desde [flutter.dev](https://flutter.dev), añade Flutter al
   `PATH` de Windows y reinicia VS Code.
2. Abre esta carpeta (`frontend`) en Visual Studio Code e instala las
   extensiones **Flutter** y **Dart**.
3. En Terminal > Nueva terminal, comprueba la instalación:

   ```powershell
   flutter doctor
   ```

4. Instala las dependencias y ejecuta la app:

   ```powershell
   flutter pub get
   flutter run
   ```

5. Para elegir un móvil virtual, abre la paleta de comandos con `Ctrl+Shift+P`,
   busca **Flutter: Select Device** y selecciona un emulador. Si todavía no
   tienes uno, crea un dispositivo virtual Android desde Android Studio > Device
   Manager.

## Recorrido de la demo

- La app abre directamente Iniciar sesión. Completa el correo y una contraseña
  de al menos seis caracteres y pulsa **Entrar** para abrir Inicio.
- Desde Perfil puedes cerrar sesión y volver a Bienvenida; **Comenzar** abre
  Iniciar sesión.
- En Inicio, abre **Ver todas**, toca una tarjeta para ver su detalle o usa el
  icono de controles para abrir las áreas jurídicas.
- La barra inferior abre Inicio, Historial, Avisos y Perfil.
- Desde Perfil puedes entrar a preferencias y áreas jurídicas, o cerrar sesión.
- Para probar el registro, vuelve a Bienvenida y pulsa **Registrarme**.

El acceso y el registro validan campos localmente y entran con cualquier dato
válido: son interacciones de prototipo, no cuentas reales.

## Estructura

```text
lib/
├── data/       # Publicaciones de ejemplo
├── models/     # Modelo LegalUpdate
├── screens/    # Pantallas de la app
├── utils/      # Tema y paleta
├── widgets/    # Componentes reutilizables
└── main.dart   # Inicio y rutas
```

## Llevar el diseño a Figma

La app está preparada para visualizarse en un emulador Android. Para recrearla
en Figma: crea un archivo, pulsa `F` y elige un frame Android de unos 360 ×
800 px; crea un frame por pantalla con los mismos nombres que las pantallas de
`lib/screens/`; reproduce la paleta azul marino, dorado y fondo marfil. En la
pestaña **Prototype**, conecta los botones siguiendo el recorrido anterior.
Este repositorio no crea ni modifica archivos dentro de tu cuenta de Figma.
