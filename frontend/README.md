# Marco Legal — prototipo Flutter

Prototipo móvil del Día 1: bienvenida, acceso, registro, inicio, novedades,
detalle, filtros, historial, perfil y preferencias de notificaciones. Los datos
son de demostración; no hay conexión al BOE, autenticación ni almacenamiento.

## Abrir y ejecutar

1. Instala Flutter desde [flutter.dev](https://flutter.dev) y añade Flutter al
   `PATH` de Windows.
2. Abre esta carpeta (`frontend`) en Visual Studio Code.
3. Instala las extensiones **Flutter** y **Dart** cuando VS Code lo sugiera.
4. Abre Terminal > Nueva terminal y ejecuta:

   ```powershell
   flutter pub get
   flutter run
   ```

5. Para elegir un móvil virtual, abre la paleta de comandos con `Ctrl+Shift+P`,
   busca **Flutter: Select Device** y selecciona un emulador. Si todavía no
   tienes uno, crea un dispositivo virtual Android desde Android Studio > Device
   Manager.

## Recorrido de la demo

- Bienvenida > **Comenzar** > Iniciar sesión > **Entrar** > Inicio.
- En Inicio, abre **Ver todas**, toca una tarjeta para ver su detalle o usa el
  icono de controles para abrir las áreas jurídicas.
- La barra inferior abre Inicio, Historial, Avisos y Perfil.
- Desde Perfil puedes entrar a preferencias y áreas jurídicas, o cerrar sesión.
- Para probar el registro, vuelve a la bienvenida y pulsa **Registrarme**.

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
