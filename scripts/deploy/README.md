# Deployment Scripts for Render

This directory contains shell scripts to automate deployment of the mellas_checks application to Render.

## Quick Start

**First time setup:**

```bash
./scripts/deploy/setup.sh
```

This will:

- Create both services on Render automatically
- Extract and save Service IDs
- Open browser to configure environment variables

**Deploy after setup:**

```bash
source .env.deploy
./scripts/deploy/deploy-all.sh
```

## Prerequisites

1. **Render CLI** installed globally:

   ```bash
   npm install -g render
   ```

2. **Authenticated with Render**:

   ```bash
   render login
   ```

3. **GitHub repository** connected to Render (done automatically by setup script)

## Detailed Setup Guide

For step-by-step instructions on creating services via CLI, see:

- **[CLI-GUIDE.md](./CLI-GUIDE.md)** - Complete guide to Render CLI and Blueprint

## Usage

### Deploy Everything

Deploy both frontend and backend services:

```bash
./scripts/deploy/deploy-all.sh
```

Or with explicit service IDs:

```bash
./scripts/deploy/deploy-all.sh srv-frontend-id srv-backend-id
```

### Deploy Frontend Only

```bash
./scripts/deploy/deploy-frontend.sh
```

Or with explicit service ID:

```bash
./scripts/deploy/deploy-frontend.sh srv-frontend-id
```

### Deploy Backend Only

```bash
./scripts/deploy/deploy-backend.sh
```

Or with explicit service ID:

```bash
./scripts/deploy/deploy-backend.sh srv-backend-id
```

## What the Scripts Do

1. **Pre-flight checks**:

   - Verify Render CLI is installed
   - Check service IDs are provided

2. **Local build** (optional verification):

   - Install dependencies with `pnpm install`
   - Build the project with `pnpm build`

3. **Trigger Render deployment**:

   - Use `render deploy` command
   - Render will:
     - Pull latest code from repository
     - Run build commands defined in `render.yaml`
     - Deploy the built application

4. **Confirmation**:
   - Display deployment status
   - Provide dashboard links

## Deployment Flow

```
┌─────────────────────────────────────────────┐
│  Local Machine                              │
│  ├─ Run deployment script                   │
│  ├─ Build locally (verification)            │
│  └─ Trigger Render via CLI                  │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│  Render Platform                            │
│  ├─ Pull latest code from GitHub            │
│  ├─ Install dependencies (pnpm install)     │
│  ├─ Run build command                       │
│  │  • Frontend: pnpm build → dist/          │
│  │  • Backend: pnpm build → dist/           │
│  ├─ Deploy static files (frontend)          │
│  └─ Start Node.js server (backend)          │
└─────────────────────────────────────────────┘
```

## Configuration

Deployment configuration is defined in `/render.yaml`:

- Build commands
- Start commands
- Environment variables
- Health check paths

## Monitoring Deployments

### Via Dashboard

Visit https://dashboard.render.com and select your service to see:

- Build logs
- Runtime logs
- Deployment history
- Service metrics

### Via CLI

Follow live logs:

```bash
# Backend logs
render logs --service=$RENDER_BACKEND_SERVICE_ID --follow

# Frontend logs (static sites have minimal logs)
render logs --service=$RENDER_FRONTEND_SERVICE_ID --follow
```

## Troubleshooting

### "Render CLI not found"

Install it:

```bash
npm install -g render
```

### "Service ID not found"

Make sure you've set the environment variables or passed them as arguments.

### "Authentication failed"

Run:

```bash
render login
```

### "Build failed"

Check the Render dashboard for detailed build logs. Common issues:

- Missing dependencies in `package.json`
- `pnpm-lock.yaml` not committed
- Environment variables not set in Render dashboard

### "Deployment succeeded but app not working"

1. Check environment variables are set in Render dashboard
2. Verify `VITE_API_BASE_URL` points to correct backend URL
3. Verify `ALLOWED_ORIGIN` matches exact frontend URL
4. Check backend logs for runtime errors

## Rollback

If a deployment causes issues:

1. **Via Dashboard**:

   - Go to service → Deploys tab
   - Click "Rollback" on a previous successful deploy

2. **Via Git**:
   - Revert the problematic commit
   - Push to trigger auto-deploy
   ```bash
   git revert HEAD
   git push origin master
   ```

## Automated Deployments

Render automatically deploys when you push to the `master` branch:

```bash
git add .
git commit -m "Your changes"
git push origin master
```

Use these scripts for:

- Manual deployments outside of normal git flow
- Triggering deployments without committing
- Deploying specific services independently
- Testing deployment process

## Security Notes

- Never commit service IDs to public repositories
- Keep `.env.deploy` in `.gitignore`
- Rotate sensitive credentials periodically
- Use Render's environment variable encryption for secrets
