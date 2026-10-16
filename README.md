# RSIDENT

E-commerce de ropa desarrollado con React, TypeScript y Go.

RSIDENT incluye una tienda web, un API para catálogo y pedidos, gestión administrativa de productos e inventario, carga local de imágenes y un flujo de compra con comprobante de pago.

## Contenido

- [Tecnologías](#tecnologías)
- [Estructura del repositorio](#estructura-del-repositorio)
- [Arquitectura general](#arquitectura-general)
- [Requisitos previos](#requisitos-previos)
- [Configuración del backend](#configuración-del-backend)
- [Configuración del frontend](#configuración-del-frontend)
- [Ejecución en desarrollo](#ejecución-en-desarrollo)
- [Funcionalidades principales](#funcionalidades-principales)
- [Productos e inventario](#productos-e-inventario)
- [Imágenes y archivos subidos](#imágenes-y-archivos-subidos)
- [Pedidos y pagos](#pedidos-y-pagos)
- [Correo electrónico](#correo-electrónico)
- [SEO](#seo)
- [Backup y recuperación](#backup-y-recuperación)
- [Pruebas y estado de validación](#pruebas-y-estado-de-validación)
- [Seguridad y despliegue](#seguridad-y-despliegue)
- [Solución de problemas](#solución-de-problemas)

## Tecnologías

### Frontend

- React.
- TypeScript.
- Vite.
- React Router.
- Cliente HTTP para consumir la API.
- `localStorage` para conservar el carrito en el navegador.

### Backend

- Go.
- Gin para las rutas HTTP.
- Firebase Authentication para autenticación administrativa.
- Cloud Firestore para persistencia.
- SMTP para notificaciones por correo.
- Almacenamiento local para imágenes de productos y comprobantes.
- Directorio `uploads/` publicado por la API mediante `/uploads`.

### Infraestructura y documentación

- Docker y configuración de entorno, según los archivos disponibles en el repositorio.
- Scripts y documentación en `database/`, `infrastructure/` y `docs/`.

Las versiones exactas de las dependencias se definen en los archivos de configuración del proyecto. Revisar `backend/go.mod` y los archivos de paquetes del frontend para conocer las versiones requeridas por la copia que se está utilizando.

## Estructura del repositorio

```text
rsident/
├── frontend/        # Aplicación web React + TypeScript + Vite
├── backend/         # API Go + Gin y lógica de negocio
│   ├── internal/
│   │   ├── handlers/   # Controladores HTTP
│   │   ├── middleware/ # Middleware de autenticación y seguridad
│   │   ├── models/     # Modelos de dominio y DTO
│   │   ├── routes/     # Definición de rutas
│   │   ├── services/   # Lógica de negocio
│   │   └── logging/    # Registro de eventos y errores
│   ├── uploads/        # Archivos subidos; requiere almacenamiento persistente
│   └── scripts/        # Scripts auxiliares, si están incluidos
├── database/        # Scripts y documentación de base de datos
├── infrastructure/  # Configuración de infraestructura
└── docs/             # Documentación funcional y técnica
```

La estructura puede variar entre ramas o versiones. No eliminar directorios que contengan datos locales o archivos necesarios para la ejecución.

## Arquitectura general

1. El navegador ejecuta la aplicación React.
2. El frontend consulta el API Go mediante las rutas configuradas en el cliente HTTP.
3. El backend valida las solicitudes y ejecuta la lógica de negocio.
4. Los datos del catálogo y los pedidos se almacenan en Cloud Firestore.
5. Los archivos subidos se guardan en el sistema de archivos del servidor, dentro de `backend/uploads/`, y se sirven mediante la ruta `/uploads`.
6. Los correos de pedido se envían por SMTP cuando la configuración está completa.

El navegador no debe considerarse una autoridad para precios, stock, permisos ni estados de pago. El backend debe volver a validar esos datos antes de registrar una operación.

## Requisitos previos

Instalar las herramientas que correspondan a la versión del proyecto:

- Git.
- Go, en la versión requerida por `backend/go.mod`.
- Node.js y npm, en versiones compatibles con el archivo de bloqueo del frontend.
- Acceso a un proyecto de Firebase con Cloud Firestore y Firebase Authentication configurados.
- Credenciales de Firebase proporcionadas de forma segura al backend.
- Acceso a un servidor SMTP si se necesitan notificaciones por correo.

Para verificar las versiones locales:

```bash
go version
node --version
npm --version
```

## Configuración del backend

### Variables de entorno

El backend utiliza configuración por variables de entorno. Los nombres que aparecen en la configuración del proyecto incluyen:

| Variable | Propósito |
| --- | --- |
| `PORT` | Puerto HTTP del backend. |
| `GOOGLE_APPLICATION_CREDENTIALS` | Ruta local a las credenciales de servicio de Google, si se usa autenticación por archivo. |
| `FIREBASE_PROJECT_ID` | Identificador del proyecto Firebase. |
| `SMTP_HOST` | Host del servidor SMTP. |
| `SMTP_PORT` | Puerto SMTP; si no se indica, el mailer puede usar `587`. |
| `SMTP_USER` | Usuario SMTP. |
| `SMTP_PASSWORD` | Contraseña o credencial SMTP. |
| `SMTP_FROM` | Remitente de los mensajes. |
| `ORDER_NOTIFICATION_EMAIL` | Dirección que recibe las notificaciones de nuevos pedidos. |

La configuración exacta puede depender de la versión del backend. Comprobar el código de inicialización y `NewMailerFromEnv()` antes de eliminar o renombrar variables.

### Credenciales de Firebase

1. Crea o selecciona el proyecto de Firebase.
2. Habilita Cloud Firestore y configura Firebase Authentication según el flujo administrativo de la aplicación.
3. Proporciona las credenciales al entorno del backend.
4. Configura `GOOGLE_APPLICATION_CREDENTIALS` con la ruta local al archivo de credenciales cuando ese mecanismo esté habilitado.
5. Comprueba que la identidad de servicio tenga únicamente los permisos necesarios.

**No incluir archivos de credenciales en Git, en imágenes Docker públicas ni en ZIP distribuidos.** Si una credencial real ya fue expuesta, revócala o rótala. No pegues secretos en incidencias, documentación ni registros.

### Ejemplo de entorno local

Crea un archivo `.env` solo si la implementación de tu entorno carga archivos `.env`; Go no los carga automáticamente por sí solo.

```dotenv
PORT=8080
FIREBASE_PROJECT_ID=tu-proyecto-firebase
GOOGLE_APPLICATION_CREDENTIALS=/ruta/segura/service-account.json

SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=usuario@example.com
SMTP_PASSWORD=CAMBIAR_POR_UN_SECRETO
SMTP_FROM=tienda@example.com
ORDER_NOTIFICATION_EMAIL=pedidos@example.com
```

Sustituye todos los valores de ejemplo. No subas este archivo al repositorio.

## Configuración del frontend

1. Entra en `frontend/`.
2. Instala las dependencias utilizando el archivo de bloqueo presente.
3. Configura la URL de la API según el mecanismo de configuración que implemente `src/api/client.ts`.
4. Inicia Vite para desarrollo o ejecuta el proceso de compilación para generar los archivos de distribución.

Comandos habituales:

```bash
cd frontend
npm ci
npm run dev
```

Para generar la compilación de producción:

```bash
npm run build
```

Los nombres y requisitos de los scripts dependen de `frontend/package.json`. Si alguno de estos comandos no existe en esa copia, consulta los scripts declarados en dicho archivo. No sustituyas el archivo de bloqueo sin una razón documentada.

## Ejecución en desarrollo

### Backend en desarrollo

Desde `backend/`:

```bash
go mod download
go run .
```

Estos comandos son orientativos y presuponen que el módulo tiene su punto de entrada en el directorio raíz. Si el ejecutable está en otro paquete, utiliza la ruta indicada por la estructura real del backend.

El backend requiere configuración válida de Firebase para las operaciones que acceden a Firestore. Configurar primero las variables de entorno y las credenciales.

### Frontend en desarrollo

En otra terminal:

```bash
cd frontend
npm ci
npm run dev
```

Abrir la URL local que indique Vite en la consola. Asegúrate de que la URL de la API configurada en el frontend corresponda al puerto en el que escucha el backend.

## Funcionalidades principales

La implementación contempla los siguientes componentes; el estado de cada función debe verificarse con las pruebas de la versión que se despliega:

- Catálogo público de productos, categorías y colecciones.
- Ficha de producto.
- Gestión administrativa protegida por autenticación.
- Carrito conservado en el navegador.
- Checkout y registro de pedidos.
- Carga de comprobantes de pago.
- Consulta de pedidos y gestión de estados.
- Actualización del inventario.
- Notificaciones de pedido por correo electrónico.
- Imágenes almacenadas en el servidor.
- Metadatos SEO en la ficha de producto.

## Productos e inventario

### Productos con variantes

Los productos con variantes gestionan el inventario por variante. Una variante puede identificar opciones como color y talla, además de SKU y stock. El backend debe comprobar que la variante seleccionada pertenece al producto y que existe stock suficiente antes de aceptar el pedido.

### Productos sin variantes

Los productos simples gestionan su stock en el propio producto, sin exigir un identificador de variante. En este caso:

- El stock se valida y descuenta del producto al crear el pedido.
- La cancelación o el rechazo deben restaurar el stock correspondiente una sola vez.
- El carrito y el checkout deben poder representar un producto simple sin fabricar un identificador de variante.
- Los productos con variantes siguen usando el stock de cada variante.

Si se cambia la estructura de inventario, revisa también los formularios de administración, el carrito, el checkout, los pedidos históricos y los procesos de cancelación y rechazo. La migración de documentos existentes debe ser explícita y respaldada.

## Imágenes y archivos subidos

Las imágenes y los comprobantes se guardan localmente en `backend/uploads/`; no se presupone Firebase Storage.

### Recomendaciones operativas

- Mantén `uploads/` en un volumen o disco persistente.
- Valida tamaño, extensión permitida y tipo real del contenido en el backend.
- Genera nombres de archivo en el servidor; no confíes en rutas o nombres proporcionados por el cliente.
- Evita permitir la subida de ejecutables o formatos no requeridos.
- Limita el acceso a comprobantes de pago: no deberían ser públicos de la misma forma que las imágenes del catálogo.
- Al editar o eliminar productos, elimina únicamente archivos que ya no estén referenciados y que pertenezcan al directorio administrado por la aplicación.
- No elimines archivos compartidos por otros productos.
- Registra los errores de lectura, escritura y eliminación sin incluir datos sensibles.

### Comprobantes de pago

Un comprobante contiene información vinculada a una compra. Antes de desplegar, verifica que su URL no permita acceso público no autorizado. Si el sistema utiliza una ruta pública común para todos los archivos, separa los comprobantes del contenido público y exige autorización para consultarlos.

## Pedidos y pagos

El flujo de pedidos debe mantener consistencia entre el pedido, el pago y el inventario.

Estados y transiciones válidos deben derivarse de las constantes y reglas definidas en el backend, no de valores inventados por el frontend.

Antes de producción, prueba como mínimo:

1. Pedido con stock suficiente.
2. Rechazo por stock insuficiente.
3. Dos pedidos concurrentes que compiten por la última unidad.
4. Aprobación del pago.
5. Rechazo del pago y restauración del stock.
6. Cancelación del pedido y restauración del stock.
7. Reintento de cancelación o rechazo sin duplicar la restauración.
8. Error al guardar el pedido o el comprobante.
9. Fallo de envío de uno de los correos sin marcarlo como enviado.
10. Consulta de un pedido con número y correo que no coinciden.

El comprobante enviado por el cliente no debe hacer que el pago se considere aprobado automáticamente. La aprobación debe depender de la revisión autorizada definida por el negocio.

## Correo electrónico

La configuración SMTP permite enviar una confirmación al cliente y una notificación a la empresa. Verifica:

- Que `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` y `SMTP_FROM` sean correctos.
- Que `ORDER_NOTIFICATION_EMAIL` sea la dirección de recepción esperada.
- Que los estados `customerEmailSent` y `companyEmailSent` reflejen el resultado real del envío.
- Que el fallo de correo no convierta un pedido ya persistido en una operación aparentemente fallida que el cliente repita sin necesidad.

Nunca registrar contraseñas SMTP ni credenciales en los logs.

## SEO

Los metadatos dinámicos del producto pueden incluir título, descripción, URL canónica e información para compartir en redes sociales.

La actualización de metadatos en el navegador no garantiza que todos los rastreadores indexen el contenido. Para SEO más robusto, evalúa prerenderizado o renderizado del lado del servidor, sitemap, robots.txt, URLs canónicas consistentes y datos estructurados de producto. No declares que esas funciones existen si no están implementadas en el repositorio.

## Backup y recuperación

`backend/uploads/` contiene archivos que no están almacenados en Firestore. Una copia de seguridad de Firestore, por sí sola, no conserva esas imágenes ni los comprobantes.

### Política mínima recomendada

- Copiar `uploads/` a un destino separado del servidor de aplicación.
- Programar backups automáticos mediante el mecanismo disponible en el servidor.
- Conservar varias generaciones de copias y definir una retención adecuada.
- Restringir el acceso al destino de backup.
- Cifrar las copias cuando el entorno lo permita, especialmente porque pueden contener comprobantes.
- Probar periódicamente la restauración.
- Coordinar la copia de archivos con la copia de los documentos de Firestore para reducir inconsistencias.

Si el repositorio incluye `backend/scripts/backup-uploads.sh`, revisa el script antes de ejecutarlo y configura explícitamente el destino y la retención. La presencia de un script no significa que exista un backup automático: debe programarse en el servidor y comprobarse su resultado.

### Ejemplo manual de copia

En un entorno Unix que disponga de `tar`, puede utilizarse un archivo fechado como respaldo manual:

```bash
tar -czf "uploads-$(date +%Y%m%d-%H%M%S).tar.gz" backend/uploads/
```

Guarda el resultado fuera del directorio de la aplicación y verifica que pueda abrirse y restaurarse. Este ejemplo no configura retención, cifrado ni ejecución automática.

## Pruebas y estado de validación

No considerar la aplicación lista para producción únicamente porque compile. Ejecuta las pruebas en un entorno que disponga de las versiones de Go y Node requeridas, acceso a las dependencias y configuración de Firebase adecuada.

### Backend en Test

Desde `backend/`:

```bash
go test ./...
go vet ./...
```

### Frontend en Test

Desde `frontend/`:

```bash
npm ci
npm run build
```

Ejecutar también las pruebas frontend que estén definidas en `frontend/package.json`.

### Escenarios de integración

- Autenticación y autorización de rutas administrativas.
- Catálogo público y producto no encontrado.
- Subida de imágenes válidas e inválidas.
- Rechazo de archivos demasiado grandes o con contenido que no corresponda al tipo declarado.
- Productos simples y productos con variantes.
- Descuento y restauración de inventario bajo concurrencia.
- Checkout con datos válidos e inválidos.
- Acceso autorizado a comprobantes.
- Errores de Firestore y SMTP.
- SEO de productos y navegación directa a una ficha.
- Backup y restauración de `uploads/`.

Registrar el resultado, el entorno, las versiones y cualquier limitación. No marques una prueba como aprobada si no se ejecutó.

## Seguridad y despliegue

Antes de desplegar:

- Usa HTTPS en producción.
- Configura CORS con los orígenes explícitamente autorizados.
- Protege las rutas administrativas con autenticación y autorización en el backend.
- No confíes en precios, stock, permisos ni estados de pago enviados por el navegador.
- Mantén credenciales fuera del repositorio.
- Separa los comprobantes privados de las imágenes públicas.
- Usa almacenamiento persistente para `uploads/`.
- Configura backups y prueba su restauración.
- Revisa los límites de subida, las rutas de archivos y los permisos del sistema.
- No expongas archivos de configuración, logs, respaldos ni credenciales mediante el servidor estático.
- Comprueba que el contenedor tenga permisos mínimos y que los datos sobrevivan a un reemplazo del contenedor.
- Revisa los logs para evitar registrar contraseñas, tokens o información de pago sensible.

### Credenciales de Firebase y conexión

No distribuir un archivo `firebase-service-account.json` con el proyecto. Utiliza un mecanismo seguro de secretos o credenciales del entorno de ejecución. Si una clave ya se publicó o compartió fuera de los destinatarios autorizados, rótala y revisa su uso.

## Solución de problemas

### El backend no puede conectarse a Firestore

- Confirmar `FIREBASE_PROJECT_ID`.
- Confirmar que la identidad de servicio esté disponible y tenga permisos suficientes.
- Comprueba que `GOOGLE_APPLICATION_CREDENTIALS`, cuando se use, apunte a un archivo existente y válido.
- Verifica conectividad y configuración del proyecto Firebase.

### La subida de archivos falla

- Confirmar que `backend/uploads/` exista y tenga permisos de escritura.
- Comprobar el límite de tamaño y los tipos permitidos por el backend.
- Verificar que el volumen persista entre reinicios o despliegues.
- Revisar los logs sin compartir información sensible.

### Los correos no llegan

- Verificar las variables SMTP.
- Comprobar el puerto, TLS y las credenciales con el proveedor SMTP.
- Revisar las carpetas de spam y los registros del proveedor.
- Comprobar los indicadores de envío guardados en el pedido.

### El frontend no llega al backend

- Comprobar la URL de API configurada en `src/api/client.ts`.
- Verificar el puerto del backend.
- Revisar CORS y la consola de red del navegador.
- Confirmar que frontend y backend estén ejecutándose en los entornos esperados.

### El inventario no coincide

- Revisar el historial de pedidos y sus estados.
- Verificar si se ha ejecutado más de una vez una operación de cancelación o rechazo.
- Comprobar si hay pedidos antiguos creados antes del modelo de stock de productos simples.
- No correjir cantidades manualmente sin registrar la causa y comprobar los pedidos relacionados.

## Mantenimiento

Para cambios futuros:

1. Revisa el modelo afectado y todos sus consumidores antes de modificar campos.
2. Mantén alineados frontend, API, modelos, persistencia y documentación.
3. Añade pruebas para el caso nuevo y para las regresiones posibles.
4. Ejecuta compilación y pruebas antes de integrar el cambio.
5. Documenta cambios incompatibles y procedimientos de migración.
6. Realiza un backup antes de modificar datos de producción.
