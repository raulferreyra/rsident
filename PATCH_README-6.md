RSIDENT - correcciones solicitadas

1. La sección Instagram queda temporalmente fuera de la página pública. No se elimina el componente ni la integración de Meta del backend.
2. Se agrega frontend/src/data/instagram.json con cuatro registros image/url para completar cuando el cliente facilite acceso a las publicaciones.
3. El checkout de esta versión NO tiene un catálogo UBIGEO: departamento es un selector estático y provincia/distrito siguen siendo texto. No se presenta como corregido.
4. El checkout captura coordenadas mediante geolocalización del navegador, pero NO incluye mapa interactivo para seleccionar punto.
5. Los campos de dirección y coordenadas sí están presentes en el modelo de pedido del backend; falta completar UBIGEO y el mapa del Front.

No requiere credenciales de Meta ni Mercado Pago para aplicar estos cambios. No se han ejecutado pruebas de integración con servicios externos.
