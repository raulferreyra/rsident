# Parche de conectividad Docker para RSIDENT (desarrollo local)

## Qué corrige

- Fija Vite en `0.0.0.0:5173` para aceptar conexiones desde el host Docker.
- Fuerza la regeneración de dependencias optimizadas de Vite al iniciar, evitando reutilizar una caché posiblemente obsoleta en el volumen `frontend_node_modules`.
- Configura proxy de `/api` y `/uploads` hacia el servicio `backend:8080` dentro de la red de Docker.
- Cambia las URL de frontend a rutas relativas, sin sobrescribir las demás variables del `.env.local` ni de `frontend/.env`.
- Activa polling para la detección de cambios en archivos montados desde Windows.

## Aplicación

1. Haz copia de seguridad del proyecto.
2. Desde la raíz de RSIDENT, copia `frontend/vite.config.ts` y `frontend/Dockerfile` de este parche sobre los existentes.
3. Abre PowerShell en la raíz del proyecto y ejecuta:

   ```powershell
   Set-ExecutionPolicy -Scope Process Bypass
   .\apply-fix.ps1
   ```

   Ejecuta el script desde la carpeta donde descomprimiste el parche. Si la carpeta del parche no es la raíz de RSIDENT, copia primero `apply-fix.ps1` a la raíz del proyecto y ejecútalo allí. El script solo modifica `VITE_API_URL` y `VITE_BACKEND_URL`; preserva el resto de variables.

4. Recrea el contenedor y elimina únicamente el volumen de dependencias de desarrollo, que puede contener una caché antigua:

   ```powershell
   docker compose -f docker-compose.local.yml down
   docker compose -f docker-compose.local.yml down -v
   docker compose -f docker-compose.local.yml build --no-cache frontend
   docker compose -f docker-compose.local.yml up --build
   ```

   `down -v` elimina los volúmenes nombrados del compose. En el compose incluido, `frontend_node_modules` es un volumen nombrado; `backend/uploads` y `backend/logs` son carpetas montadas desde el host y no se eliminan con ese comando.

5. Abre `http://localhost:5173/` en una ventana privada o fuerza una recarga con `Ctrl+F5`.
6. Comprueba en el navegador `http://localhost:5173/api/health`. Debe responder JSON con `{"status":"ok"}` si el backend arrancó y se inicializó correctamente.

## Si continúa fallando

- Revisa los logs de ambos servicios, no solo el de frontend:

  ```powershell
  docker compose -f docker-compose.local.yml logs --tail=200 backend frontend
  ```

- Si el backend termina al inicializar Firebase, confirma que `backend/credentials/firebase-service-account.json` existe y que `GOOGLE_APPLICATION_CREDENTIALS` dentro del contenedor apunta a `/app/credentials/firebase-service-account.json`. No compartas ni pegues el contenido de esa credencial.
- Si `http://localhost:5173/` carga pero `/api/health` falla, el problema restante está en la disponibilidad del backend, sus credenciales o su arranque; no en el renderizado inicial de React.

Este parche corrige la configuración de desarrollo observada en el ZIP. No afirma que se haya validado en tu Docker Desktop, porque no puedo ejecutar tus contenedores desde este entorno.
