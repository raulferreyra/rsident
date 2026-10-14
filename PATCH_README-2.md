# Parche RSIDENT — revisión del 9 de octubre de 2026

Este paquete contiene únicamente los archivos modificados para corregir los hallazgos de la revisión. No contiene el proyecto completo, archivos `.env` ni credenciales.

## Aplicación

1. Haz una copia de seguridad de tu proyecto actual.
2. Descomprime este ZIP en la raíz de tu proyecto RSIDENT, conservando las carpetas `backend/` y `frontend/`. Acepta reemplazar únicamente los archivos incluidos en el parche.
3. No reemplaces tu `.env` ni tu archivo de cuenta de servicio de Firebase.
4. Reinicia/reconstruye el backend y el frontend.

## Cambios incluidos

- Los comprobantes nuevos se guardan en `backend/private/payment-proofs/`, fuera de la ruta pública `/uploads`.
- La ruta pública de archivos bloquea `/uploads/payment-proofs/` para proteger comprobantes antiguos que aún estén en esa carpeta.
- Se agrega `GET /api/admin/orders/:id/payment-proof`, protegido por la autenticación del grupo `/admin`, y el panel solicita el comprobante con el token de Firebase.
- La consulta pública de pedidos devuelve solo los campos usados para seguimiento; ya no devuelve dirección, DNI, correo ni URL del comprobante.
- Se evita restaurar el inventario una segunda vez cuando se rechaza el pago de un pedido ya cancelado o rechazado.
- Se impide cancelar pedidos enviados o entregados, y no se permite reactivar pedidos cancelados/rechazados ni aprobar el pago de uno de ellos.
- La validación de JPG/PNG decodifica el archivo completo. WEBP comprueba firma RIFF, longitud, estructura de chunks y cabeceras de frame; la biblioteca estándar de Go no permite decodificar completamente WEBP.
- Se agregan pruebas para imágenes truncadas y reglas de restauración/cancelación de inventario.
- `private/` queda excluido de Git y del contexto Docker.

## Validación ejecutada

- `gofmt` se ejecutó sobre los archivos Go modificados.
- Las pruebas de `image_validation.go` y `image_validation_test.go` se ejecutaron en aislamiento con Go 1.23.2: pasaron.
- No se pudo ejecutar `go test ./...` ni compilar el proyecto completo: el proyecto declara Go 1.25.1 y el entorno de revisión solo dispone de Go 1.23.2 sin acceso a Internet para descargar el toolchain.
- No se pudo ejecutar el build de React: el ZIP no incluye `node_modules` y no había acceso a Internet para instalar dependencias.

## Nota sobre comprobantes anteriores

Los archivos antiguos que existan en `backend/uploads/payment-proofs/` seguirán en el disco para que el panel pueda leerlos mediante la ruta autenticada. La URL pública antigua queda bloqueada. No borres esa carpeta hasta verificar que los pedidos antiguos abren sus comprobantes correctamente desde el panel.
