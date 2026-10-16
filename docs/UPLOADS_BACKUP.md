# Backup y restauración de `backend/uploads/`

`uploads/` contiene imágenes de productos y comprobantes de pago; debe residir en almacenamiento persistente y no debe depender del ciclo de vida del contenedor.

## Backup

En un host Linux con `bash`, `tar` y `sha256sum`:

```bash
./backend/scripts/backup-uploads.sh
```

Por defecto crea archivos comprimidos y SHA-256 en `backend/backups/uploads/`, y elimina respaldos de más de 30 días. Para ajustar rutas o retención:

```bash
UPLOADS_DIR=/srv/rsident/uploads BACKUP_DIR=/srv/backups/rsident RETENTION_DAYS=60 ./backend/scripts/backup-uploads.sh
```

Configura el programador del host (cron/systemd timer) para ejecutar el script diariamente. Copia periódicamente los respaldos a otro disco o ubicación independiente; un backup en el mismo disco no protege ante la pérdida de ese disco.

## Restauración

1. Detén el backend o evita escrituras durante la restauración.
2. Verifica el archivo con `sha256sum -c uploads-<timestamp>.tar.gz.sha256`.
3. Extrae en el directorio padre de la carpeta `uploads/` con `tar -xzf uploads-<timestamp>.tar.gz -C <directorio-padre>`.
4. Comprueba que existan `uploads/products/` y `uploads/payment-proofs/`, y reinicia el backend.

No guardes respaldos, comprobantes ni credenciales dentro del frontend público ni los incluyas en el repositorio.
