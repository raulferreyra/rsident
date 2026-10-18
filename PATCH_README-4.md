# Parche RSIDENT: administración del Home y correcciones solicitadas

## Archivos
Este parche contiene solo los archivos modificados o añadidos. No contiene `.env`, credenciales Firebase ni datos locales.

## Aplicación
1. Detén Docker Compose.
2. Haz una copia de seguridad del proyecto.
3. Descomprime el contenido del ZIP sobre la raíz del proyecto, manteniendo las rutas.
4. Reconstruye ambos servicios con `docker compose build --no-cache` y levántalos.
5. Prueba el Home público y las rutas administrativas.

## Home
Se agrega `settings/home` en Firestore para almacenar hasta tres banners, el mensaje y hasta ocho productos seleccionados. En `/admin/home` se pueden subir imágenes JPG/PNG/WEBP y vídeos MP4/WEBM de hasta 50 MB o indicar una URL pública. El botón del banner puede dirigirse a un producto, un filtro o una página. Los archivos subidos se guardan en `backend/uploads/home/`; asegúrate de que `uploads/` esté en un volumen persistente y se incluya en copias de seguridad.

## Cambios adicionales
- /admin/login valida una sesión existente contra el endpoint de administrador antes de redirigir.
- Las etiquetas de catálogo se exponen públicamente y se muestran en las tarjetas; se añade `keywords` al SEO del producto.
- El estado `Nuevo` se muestra aunque el producto también tenga descuento.
- Se limita la cantidad de cada línea del carrito a cinco unidades.
- Se puede marcar un color predeterminado en el formulario del producto.
- Categorías, colecciones y etiquetas permiten editar el estado activo/inactivo.
- Se corrigen las rutas de las fuentes Inter y se importa la hoja de fuentes desde `main.tsx`.
- Se agrega el acceso flotante de WhatsApp con el número temporal +51999999999.

## Validación
El backend se formateó con `gofmt`. No se pudo ejecutar `go test ./...` porque el entorno no pudo descargar la versión de Go 1.25.1 que requiere `go.mod`. La instalación de dependencias de Node también expiró; por tanto, no se certifica la compilación TypeScript/Vite desde este entorno. Ejecuta `go test ./...` en `backend/` y `npm ci && npm run build` en `frontend/` antes de integrar el parche.
