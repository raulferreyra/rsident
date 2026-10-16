# Notas de implementación

- Los productos con variantes descuentan/restauran `variants[].stock`.
- Los productos sin variantes descuentan/restauran `stock` en el documento del producto y envían `variantId` vacío.
- El servicio de pedidos hace todas las lecturas de producto antes de las escrituras de la transacción Firestore.
- Las imágenes de producto se validan por contenido, no por el MIME declarado por el navegador. Se aceptan JPG, PNG y WEBP de hasta 5 MB.
- Al editar un producto se eliminan los archivos locales que dejaron de estar referenciados; al eliminarlo se elimina su carpeta `uploads/products/<id>`.
- El SEO de la ficha actualiza title, description, Open Graph, Twitter y canonical en el cliente. Para que los bots que no ejecutan JavaScript reciban metadatos específicos, hace falta renderizado/prerenderizado en servidor o generación estática; este ZIP no incorpora SSR.
- Los backups requieren que `uploads/` esté en un volumen persistente. El script de backup no sustituye esa configuración.
- No se distribuye `credentials/firebase-service-account.json`; la aplicación debe recibirlo como secreto en tiempo de ejecución.
