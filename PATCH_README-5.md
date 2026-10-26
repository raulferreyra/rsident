# RSIDENT: pagos y datos de envío

Este parche se aplica sobre la raíz del proyecto RSIDENT. Copia los archivos del ZIP respetando las rutas.

## Incluido

- Yape manual: mantiene el QR y el comprobante, guardado de forma privada y validación por el administrador.
- Mercado Pago Checkout Pro: crea una preferencia desde el backend, redirige al `init_point` y valida las notificaciones mediante `x-signature` y una consulta server-to-server al pago. El retorno del navegador no confirma el pago.
- Guarda método de pago, identificadores de preferencia/pago, departamento, provincia, distrito, dirección, referencia y coordenadas opcionales.
- Conserva nombre y DNI del destinatario para el despacho manual en Shalom Pro.
- Añade los datos de destino y el método de pago a la vista de administración y correos.
- No integra la API de Shalom.

## Variables de entorno del backend

Configura en el entorno del backend (no publiques estos valores ni los pongas en el frontend):

```env
FRONTEND_URL=https://tu-dominio-de-la-tienda
BACKEND_PUBLIC_URL=https://tu-dominio-del-backend
MERCADOPAGO_ACCESS_TOKEN=APP_USR-...
MERCADOPAGO_WEBHOOK_SECRET=...
```

`BACKEND_PUBLIC_URL` debe ser accesible desde Internet para que Mercado Pago alcance `/api/payments/mercadopago/webhook`. Obtén el token de acceso y el secreto de firma desde la configuración de la aplicación/webhooks de Mercado Pago. No uses el token de prueba en producción.

## Importante

- El archivo `backend/.env.example` se actualizó; el `.env` real y las credenciales de Firebase no forman parte del parche.
- El selector de departamento está disponible; provincia y distrito se ingresan como texto en esta versión, no son listas UBIGEO dependientes. No se inventó una lista parcial de distritos. Las coordenadas se solicitan opcionalmente con la geolocalización del navegador; no hay mapa embebido.
- El costo de envío sigue siendo el cálculo interno existente por zona, sin consultar Shalom.
- La creación de pedidos mantiene la reserva de stock existente. Si no se logra crear/guardar la preferencia de Mercado Pago, el backend intenta cancelar el pedido y restaurar el stock.
- Debe probarse en un entorno de Mercado Pago de prueba antes de producción, incluyendo notificaciones aprobadas, rechazadas y repetidas.

## Verificación de este parche

Se ejecutó `gofmt` sobre los archivos Go modificados. No fue posible ejecutar `go test` porque el proyecto requiere Go 1.25.1 y el entorno disponible solo tiene Go 1.23.2; la descarga automática del toolchain falló por falta de acceso de red. Tampoco se ejecutó el build de frontend porque el ZIP no contiene `node_modules` y no fue posible instalar dependencias en este entorno.
