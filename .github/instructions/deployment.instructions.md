---
applyTo: '**'
---

# Deployment Instructions for mellas_checks

## Hosting Platform: Render

This project uses **Render** (https://render.com) as the hosting platform for both frontend and backend services.

### Architecture Overview

The application is deployed as two separate Render services:

1. **Frontend (Static Site)**: Serves the built React application
2. **Backend (Web Service)**: Runs the Fastify API server

### Prerequisites

1. Render account created at https://render.com
2. Render CLI installed globally: `pnpm install -g render`
3. Render CLI authenticated: `render login`
4. Repository connected to Render dashboard (first-time setup)

### Environment Variables

#### Frontend Static Site

- `VITE_API_BASE_URL`: Backend API base URL (e.g., `https://mellas-api.onrender.com/api/v1`)

#### Backend Web Service

- `TURSO_DATABASE_URL`: Turso database connection URL
- `TURSO_AUTH_TOKEN`: Turso authentication token
- `SCHOOL_TIMEZONE`: IANA timezone (e.g., `America/Mexico_City`)
- `ALLOWED_ORIGIN`: Frontend origin for CORS (e.g., `https://mellas-checks.onrender.com`)
- `API_KEY`: Optional internal API key for service-to-service communication
- `LOG_LEVEL`: Fastify log level (default: `info`)
- `PORT`: Auto-provided by Render at runtime

### Deployment Methods

#### 1. Automatic Deployment (Recommended)

Render automatically deploys when changes are pushed to the `master` branch:

```bash
git add .
git commit -m "Your commit message"
git push origin master
```

Render will:

- Detect changes in the repository
- Build frontend: `cd apps/frontend && pnpm install && pnpm build`
- Build backend: `cd apps/server && pnpm install && pnpm build`
- Deploy to their respective services

#### 2. Manual Deployment via Dashboard

1. Go to https://dashboard.render.com
2. Select the service (frontend or backend)
3. Click "Manual Deploy" → "Deploy latest commit"

#### 3. Manual Deployment via CLI

Use the deployment script (see below) or individual commands:

```bash
# Deploy frontend
render deploy --service=<frontend-service-id>

# Deploy backend
render deploy --service=<backend-service-id>
```

### Deployment Scripts

The repository includes automated deployment scripts in `scripts/deploy/`:

- `deploy-all.sh`: Deploy both frontend and backend
- `deploy-frontend.sh`: Deploy only frontend static site
- `deploy-backend.sh`: Deploy only backend web service

Configuration is managed in `render.yaml` (Blueprint specification).

### Service Configuration

#### Frontend (Static Site)

```yaml
services:
  - type: web
    name: mellas-checks-frontend
    env: static
    buildCommand: cd apps/frontend && pnpm install && pnpm build
    staticPublishPath: apps/frontend/dist
    envVars:
      - key: VITE_API_BASE_URL
        value: https://mellas-api.onrender.com/api/v1
```

#### Backend (Web Service)

```yaml
services:
  - type: web
    name: mellas-checks-backend
    env: node
    buildCommand: cd apps/server && pnpm install && pnpm build
    startCommand: cd apps/server && node dist/index.js
    envVars:
      - key: TURSO_DATABASE_URL
        sync: false
      - key: TURSO_AUTH_TOKEN
        sync: false
      - key: SCHOOL_TIMEZONE
        value: America/Mexico_City
      - key: ALLOWED_ORIGIN
        value: https://mellas-checks.onrender.com
      - key: LOG_LEVEL
        value: info
```

### Database Migrations

Migrations are automatically applied on backend startup. The server runs pending migrations before accepting connections.

To manually run migrations:

```bash
cd apps/server
pnpm db:migrate
```

### Health Checks

Both services expose health check endpoints:

- Frontend: Served by Render's static hosting (returns 200 for any valid path)
- Backend: `GET /api/v1/health` returns `{ status: 'ok', timestamp: '...' }`

### Monitoring and Logs

View logs via:

1. **Render Dashboard**: https://dashboard.render.com → Select service → Logs tab
2. **Render CLI**: `render logs --service=<service-id> --follow`

### Rollback Procedure

If a deployment fails or introduces issues:

1. Via Dashboard: Go to service → Deploys tab → Click "Rollback" on a previous successful deploy
2. Via Git: Revert the commit and push:
   ```bash
   git revert HEAD
   git push origin master
   ```

### Troubleshooting

**Build failures:**

- Check that `pnpm-lock.yaml` is committed
- Verify all dependencies are declared in `package.json`
- Review build logs in Render dashboard

**Runtime errors:**

- Check environment variables are correctly set
- Review service logs for error messages
- Verify database connection (Turso credentials)

**CORS issues:**

- Ensure `ALLOWED_ORIGIN` matches exact frontend URL (including protocol)
- Check that frontend `VITE_API_BASE_URL` points to correct backend URL

### Cost Optimization

- Frontend (Static Site): Free tier available
- Backend (Web Service): Free tier available with limitations (spins down after inactivity)
- Database (Turso): Free tier includes sufficient quota for this project

### Security Notes

- Never commit `.env` files with production credentials
- Use Render's environment variable encryption for sensitive values
- Rotate `TURSO_AUTH_TOKEN` periodically
- Keep `API_KEY` secret and rotate if exposed

### CI/CD Integration

For advanced workflows, consider:

- GitHub Actions integration with Render Deploy Hooks
- Automated tests before deployment
- Staging environment for testing before production

### Support and Documentation

- Render Documentation: https://render.com/docs
- Render CLI Reference: https://render.com/docs/cli
- Render Community: https://community.render.com
