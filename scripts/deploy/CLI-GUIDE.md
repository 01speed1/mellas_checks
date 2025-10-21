# Paso a Paso: Crear Aplicaciones en Render

Este documento explica cómo crear servicios en Render para el proyecto mellas_checks.

## ⚠️ Nota Importante

El Render CLI **no soporta creación automática de servicios**. Los servicios deben crearse manualmente a través del dashboard web.

El CLI se usa principalmente para:

- ✅ Ver logs
- ✅ Gestionar deploys
- ✅ Reiniciar servicios
- ✅ Ver información de servicios

## Método Recomendado: Setup Script + Dashboard

### 1. Ejecutar el Script de Setup

```bash
./scripts/deploy/setup.sh
```

El script te guiará a través del proceso:

1. Verifica que el CLI esté instalado y autenticado
2. Te da instrucciones claras para crear los servicios
3. Abre el dashboard de Render automáticamente
4. Te pide los Service IDs después de crearlos
5. Crea `.env.deploy` con los IDs
6. Abre las páginas para configurar environment variables

## Método Manual: Crear Servicios en Dashboard

## Método Manual: Crear Servicios en Dashboard

### Paso 1: Instalar y Autenticar CLI

```bash
# Instalar Render CLI
npm install -g render

# Autenticar
render login
```

### Paso 2: Ir al Dashboard de Render

Ve a: https://dashboard.render.com

### Paso 3: Crear el Backend Service

1. Click en **"New +"** → **"Web Service"**

2. **Conectar Repositorio:**

   - Selecciona tu repositorio: `01speed1/mellas_checks`
   - Si no aparece, conecta tu cuenta de GitHub primero

3. **Configuración del Servicio:**

   ```
   Name:          mellas-checks-backend
   Environment:   Node
   Branch:        master
   Root Directory: (dejar vacío)
   Build Command: cd apps/server && pnpm install && pnpm build
   Start Command: cd apps/server && node dist/index.js
   Plan:          Free
   ```

4. **Environment Variables (agregar después):**

   - `TURSO_DATABASE_URL` - Tu URL de Turso
   - `TURSO_AUTH_TOKEN` - Tu token de Turso
   - `ALLOWED_ORIGIN` - URL de tu frontend
   - `SCHOOL_TIMEZONE` - `America/Mexico_City`
   - `LOG_LEVEL` - `info`
   - `API_PREFIX` - `/api/v1`

5. Click **"Create Web Service"**

6. **Copiar Service ID:**
   - Una vez creado, ve al servicio
   - El ID está en la URL: `https://dashboard.render.com/web/srv-xxxxx`
   - Guarda este ID: `srv-xxxxx`

### Paso 4: Crear el Frontend Service

1. Click en **"New +"** → **"Static Site"**

2. **Conectar Repositorio:**

   - Selecciona tu repositorio: `01speed1/mellas_checks`

3. **Configuración del Servicio:**

   ```
   Name:              mellas-checks-frontend
   Branch:            master
   Root Directory:    (dejar vacío)
   Build Command:     cd apps/frontend && pnpm install && pnpm build
   Publish Directory: apps/frontend/dist
   ```

4. **Environment Variables (agregar después):**

   - `VITE_API_BASE_URL` - URL de tu backend + `/api/v1`
     - Ejemplo: `https://mellas-checks-backend.onrender.com/api/v1`

5. Click **"Create Static Site"**

6. **Copiar Service ID:**
   - Una vez creado, ve al servicio
   - El ID está en la URL: `https://dashboard.render.com/static/srv-yyyyy`
   - Guarda este ID: `srv-yyyyy`

### Paso 5: Guardar los IDs Localmente

Crea `.env.deploy` en la raíz del proyecto:

```bash
# Render Deployment Configuration

# Backend Web Service ID
RENDER_BACKEND_SERVICE_ID=srv-xxxxx

# Frontend Static Site Service ID
RENDER_FRONTEND_SERVICE_ID=srv-yyyyy
```

O cópialo del ejemplo:

```bash
cp .env.deploy.example .env.deploy
nano .env.deploy  # Editar con tus IDs
```

### Paso 6: Configurar Environment Variables

**Backend:**

1. Ve a: `https://dashboard.render.com/web/srv-xxxxx`
2. Click en **"Environment"** en el menú lateral
3. Añade las variables:
   - `TURSO_DATABASE_URL` - De tu Turso dashboard
   - `TURSO_AUTH_TOKEN` - De tu Turso dashboard
   - `ALLOWED_ORIGIN` - URL de tu frontend (ej: `https://mellas-checks-frontend.onrender.com`)
   - `SCHOOL_TIMEZONE` - `America/Mexico_City`
   - `LOG_LEVEL` - `info`
   - `API_PREFIX` - `/api/v1`

**Frontend:**

1. Ve a: `https://dashboard.render.com/static/srv-yyyyy`
2. Click en **"Environment"** en el menú lateral
3. Añade:
   - `VITE_API_BASE_URL` - URL de backend + `/api/v1`
     - Ejemplo: `https://mellas-checks-backend.onrender.com/api/v1`

### Paso 7: Trigger Manual Deploy (si es necesario)

Si quieres hacer el primer deploy manualmente:

```bash
# Cargar las variables
source .env.deploy

# Ver servicios
render services

# Desplegar backend
render deploys create --service=$RENDER_BACKEND_SERVICE_ID

# Desplegar frontend
render deploys create --service=$RENDER_FRONTEND_SERVICE_ID
```

O simplemente espera - Render hará el primer deploy automáticamente al crear el servicio.

### Paso 8: Monitorear el Deploy

```bash
# Ver logs del backend en tiempo real
render logs --service=$RENDER_BACKEND_SERVICE_ID --follow

# Ver logs del frontend
render logs --service=$RENDER_FRONTEND_SERVICE_ID --follow

# Ver lista de deploys
render deploys --service=$RENDER_BACKEND_SERVICE_ID
```

### Paso 9: Usar los Scripts de Deploy

Ahora puedes usar los scripts de deploy:

```bash
source .env.deploy
./scripts/deploy/deploy-all.sh
```

### 3. Crear servicios desde Blueprint

Desde la raíz del proyecto:

```bash
render blueprint launch
```

Este comando:

- Lee `render.yaml`
- Crea los servicios en tu cuenta de Render
- Conecta el repositorio de GitHub
- Configura las build commands y environment variables base
- Devuelve los Service IDs

**Salida esperada:**

```
Creating services from blueprint...
✓ Created web service: mellas-checks-backend (srv-xxxxx)
✓ Created web service: mellas-checks-frontend (srv-yyyyy)

Services created successfully!
View them at: https://dashboard.render.com
```

### 4. Capturar los Service IDs

Los Service IDs tienen el formato `srv-xxxxxxxxxxxxx`.

**Opción A:** Desde la salida del comando anterior

**Opción B:** Desde el dashboard

1. Ve a https://dashboard.render.com
2. Haz clic en cada servicio
3. El ID está en la URL: `https://dashboard.render.com/web/srv-xxxxx`

### 5. Guardar los IDs localmente

Crea `.env.deploy`:

```bash
cp .env.deploy.example .env.deploy
nano .env.deploy
```

Añade los IDs:

```bash
RENDER_BACKEND_SERVICE_ID=srv-xxxxxxxxxxxxx
RENDER_FRONTEND_SERVICE_ID=srv-yyyyyyyyyyyyy
```

### 6. Configurar Variables de Entorno

Las variables en `render.yaml` marcadas con `sync: false` deben configurarse manualmente en el dashboard.

**Backend:**

```bash
# URL del dashboard
https://dashboard.render.com/web/srv-xxxxx/env-vars

# Variables requeridas:
TURSO_DATABASE_URL=libsql://your-database.turso.io
TURSO_AUTH_TOKEN=eyJhbGc...
ALLOWED_ORIGIN=https://your-frontend.onrender.com

# Variables opcionales (tienen defaults):
SCHOOL_TIMEZONE=America/Mexico_City
LOG_LEVEL=info
API_PREFIX=/api/v1
```

**Frontend:**

```bash
# URL del dashboard
https://dashboard.render.com/static/srv-yyyyy/env-vars

# Variables requeridas:
VITE_API_BASE_URL=https://your-backend.onrender.com/api/v1
```

### 7. Primer Despliegue

Render automáticamente hace el primer deploy al crear los servicios. Puedes monitorearlo:

```bash
# Ver logs en tiempo real
render logs --service=srv-xxxxx --follow
render logs --service=srv-yyyyy --follow

# O en el dashboard
https://dashboard.render.com/web/srv-xxxxx
https://dashboard.render.com/static/srv-yyyyy
```

### 8. Despliegues Posteriores

Ahora puedes usar los scripts:

```bash
# Cargar las variables
source .env.deploy

# Desplegar todo
./scripts/deploy/deploy-all.sh

# O servicios individuales
./scripts/deploy/deploy-backend.sh
./scripts/deploy/deploy-frontend.sh
```

## Comandos Útiles del Render CLI

### Ver servicios

```bash
# Listar todos los servicios
render services

# Ver info detallada de un servicio
render services get --service=srv-xxxxx --output=yaml
```

### Gestionar deploys

```bash
# Ver lista de deploys
render deploys --service=srv-xxxxx

# Crear un nuevo deploy
render deploys create --service=srv-xxxxx

# Ver detalles de un deploy específico
render deploys get --service=srv-xxxxx --deploy=dep-xxxxx

# Rollback a un deploy anterior
render deploys rollback --service=srv-xxxxx --deploy=dep-xxxxx
```

### Ver logs

```bash
# Logs en tiempo real
render logs --service=srv-xxxxx --follow

# Últimas 100 líneas
render logs --service=srv-xxxxx --tail=100

# Logs de un deploy específico
render logs --service=srv-xxxxx --deploy=dep-xxxxx

# Output en formato JSON
render logs --service=srv-xxxxx --output=json
```

### Reiniciar servicio

```bash
render restart --service=srv-xxxxx
```

### Gestionar trabajos (jobs)

```bash
# Listar jobs
render jobs --service=srv-xxxxx

# Ver detalles de un job
render jobs get --service=srv-xxxxx --job=job-xxxxx
```

### Ver información del usuario

```bash
# Ver usuario actual
render whoami

# Ver workspace activo
render workspace
```

## Troubleshooting

### Error: "Blueprint validation failed"

Verifica que `render.yaml` tenga sintaxis correcta:

```bash
# Validar el archivo
render blueprints validate
```

### Error: "Repository not connected"

Asegúrate que tu repositorio esté en GitHub y conectado a Render:

1. Ve a https://dashboard.render.com/select-repo
2. Conecta tu cuenta de GitHub
3. Autoriza el repositorio

### Error: "Service already exists"

Si ya creaste los servicios y quieres recrearlos:

```bash
# Opción 1: Eliminar desde dashboard
https://dashboard.render.com → Select service → Settings → Delete

# Opción 2: Renombrar en render.yaml
# Cambia 'name' en cada servicio antes de run blueprint launch
```

### No puedo extraer los Service IDs

Cópialos manualmente del dashboard:

1. https://dashboard.render.com
2. Click en cada servicio
3. El ID está en la URL

Luego edita `.env.deploy` manualmente.

## Estructura del render.yaml

### Servicio Web (Backend)

```yaml
- type: web # Tipo de servicio
  name: service-name # Nombre único
  env: node # Runtime (node, python, ruby, etc.)
  plan: free # Plan (free, starter, standard, pro)
  buildCommand: '...' # Comando para build
  startCommand: '...' # Comando para iniciar
  healthCheckPath: /health # Endpoint de health check
  envVars: # Variables de entorno
    - key: VAR_NAME
      value: 'value' # Valor directo
    - key: SECRET
      sync: false # Configurar manualmente
```

### Servicio Estático (Frontend)

```yaml
- type: web
  name: frontend-name
  env: static # Tipo static para sitios estáticos
  buildCommand: '...' # Build del frontend
  staticPublishPath: dist # Carpeta con archivos built
  envVars:
    - key: VITE_API_URL
      sync: false
```

## Alternativa: Crear Servicios Manualmente

Si prefieres no usar Blueprint, puedes crear cada servicio individualmente:

### Backend

```bash
render services create web \
  --name mellas-checks-backend \
  --env node \
  --build-command "cd apps/server && pnpm install && pnpm build" \
  --start-command "cd apps/server && node dist/index.js" \
  --repo https://github.com/01speed1/mellas_checks \
  --branch master
```

### Frontend

```bash
render services create static \
  --name mellas-checks-frontend \
  --build-command "cd apps/frontend && pnpm install && pnpm build" \
  --publish-path apps/frontend/dist \
  --repo https://github.com/01speed1/mellas_checks \
  --branch master
```

## Referencias

- [Render CLI Documentation](https://render.com/docs/cli)
- [Render Blueprint Spec](https://render.com/docs/blueprint-spec)
- [Infrastructure as Code](https://render.com/docs/infrastructure-as-code)
