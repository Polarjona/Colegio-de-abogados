# Requisitos

## Funcionales

- Registro con Firebase Authentication, aceptación expresa del Aviso Legal y
  la Política de Privacidad, número de colegiado opcional y materias jurídicas
  de interés.
- Inicio de sesión con correo y contraseña mediante Firebase Authentication.
- Persistencia de sesión al recargar la web o reabrir Expo, con renovación del
  ID token cuando caduca.
- Recuperación de contraseña mediante un enlace enviado directamente por
  Firebase; la app no solicita códigos ni cambia la contraseña dentro de su
  interfaz.
- Consulta de novedades legislativas del BOE y acceso a su detalle.
- Filtros de áreas jurídicas sincronizados con
  `preferences/{uid}.categories`, incluyendo las materias elegidas durante el
  registro.
- Historial de publicaciones consultadas.
- Notificaciones push según las preferencias y áreas jurídicas del usuario.
- Gestión del perfil y eliminación definitiva de la cuenta. La eliminación
  debe borrar el perfil, preferencias, consentimientos, historial,
  notificaciones, tokens de dispositivo y cuentas Firebase duplicadas del
  mismo correo.

## No funcionales

- Aplicación multiplataforma con React Native y Expo para Android, iOS y web.
- Firebase Authentication, Cloud Firestore y Firebase Cloud Messaging/Expo
  Push.
- Backend API REST con rutas protegidas mediante Bearer ID tokens de Firebase.
- Configuración local mediante variables de entorno; las claves privadas nunca
  se almacenan en el repositorio.