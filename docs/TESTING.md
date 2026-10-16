# Plan de pruebas RSIDENT

## Pruebas automatizadas incluidas

- Validación del pedido simple sin variante.
- Rechazo de cantidades no positivas.
- Normalización de líneas repetidas del carrito.
- Rechazo de contenido que no es imagen.
- Rechazo de archivos por encima de 5 MB.
- Aceptación de un PNG de prueba.

## Pruebas de integración pendientes

Estas pruebas necesitan un entorno con Go 1.25.1 o superior y un proyecto/emulador de Firestore configurado. No se deben ejecutar contra producción.

1. Compra simultánea de las últimas unidades de una variante: solo una compra debe poder consumir el stock disponible.
2. Compra de producto simple y descuento de `stock`.
3. Rechazo de pago restaura stock exactamente una vez para productos simples y variantes.
4. Cancelación restaura stock exactamente una vez y no vuelve a restaurar un pedido rechazado/cancelado.
5. Fallo al guardar el pedido elimina el comprobante temporal.
6. Upload con MIME falso, extensión falsa, archivo truncado, archivo mayor de 5 MB y WebP inválido.
7. Edición/eliminación de producto limpia solo los archivos de su propia carpeta y conserva las imágenes aún referenciadas.
8. Restauración de backup en un directorio aislado y verificación del checksum.
9. Recorrido navegador: producto con variantes, producto simple, carrito, checkout, comprobante, consulta del pedido y administración.

## Limitación de validación de esta entrega

En el entorno de construcción no fue posible descargar Go 1.25.1 ni instalar las dependencias npm por falta de acceso de red. Por ello no se afirma que `go test ./...` ni `npm run build` hayan pasado. Ejecutar ambos en un entorno con dependencias disponibles antes de desplegar.
