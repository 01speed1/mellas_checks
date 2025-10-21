#!/bin/bash

set -e

echo "🔧 Render Setup Helper for mellas_checks"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if ! command -v render &> /dev/null; then
    echo "❌ Render CLI is not installed"
    echo ""
    echo "Install it with:"
    echo "   npm install -g render"
    echo ""
    exit 1
fi

echo "✅ Render CLI is installed"
echo ""

if ! render whoami &> /dev/null; then
    echo "❌ Not authenticated with Render"
    echo ""
    echo "Please run:"
    echo "   render login"
    echo ""
    exit 1
fi

echo "✅ Authenticated with Render"
echo ""

CURRENT_USER=$(render whoami 2>&1 | grep -o 'Logged in as.*' || echo "Unknown")
echo "👤 $CURRENT_USER"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "� Create Services on Render"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ -f ".env.deploy" ]; then
    echo "⚠️  Services may already be created (.env.deploy exists)"
    echo ""
    read -p "Do you want to create new services anyway? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Skipping service creation..."
        exit 0
    fi
fi

echo "This will create two Render services from render.yaml:"
echo "  1. Backend Web Service (Node.js)"
echo "  2. Frontend Static Site (React)"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Setup cancelled"
    exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📦 Creating services on Render..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ ! -f "render.yaml" ]; then
    echo "❌ render.yaml not found!"
    echo "Make sure you're running this from the project root."
    exit 1
fi

echo "⚠️  Note: Render CLI doesn't support automated service creation."
echo "You need to create services manually via the dashboard."
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 Step-by-Step Instructions"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Go to Render Dashboard:"
echo "   https://dashboard.render.com"
echo ""
echo "2. Create Backend Service:"
echo "   → Click 'New +' → 'Web Service'"
echo "   → Connect your GitHub repository: 01speed1/mellas_checks"
echo "   → Configure:"
echo "     Name:          mellas-checks-backend"
echo "     Environment:   Node"
echo "     Branch:        master"
echo "     Root Directory: (leave empty)"
echo "     Build Command: cd apps/server && pnpm install && pnpm build"
echo "     Start Command: cd apps/server && node dist/index.js"
echo "     Plan:          Free"
echo ""
echo "3. Create Frontend Service:"
echo "   → Click 'New +' → 'Static Site'"
echo "   → Connect your GitHub repository: 01speed1/mellas_checks"
echo "   → Configure:"
echo "     Name:              mellas-checks-frontend"
echo "     Branch:            master"
echo "     Root Directory:    (leave empty)"
echo "     Build Command:     cd apps/frontend && pnpm install && pnpm build"
echo "     Publish Directory: apps/frontend/dist"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

read -p "Press Enter to open Render Dashboard..." 
if command -v xdg-open &> /dev/null; then
    xdg-open "https://dashboard.render.com/select-repo?type=web" &
elif command -v open &> /dev/null; then
    open "https://dashboard.render.com/select-repo?type=web" &
fi

echo ""
echo "After creating both services, you'll need their Service IDs."
echo ""

read -p "Have you created both services? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Please create the services first, then run this script again."
    exit 0
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 Get Service IDs"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "To find your Service IDs:"
echo "1. Go to https://dashboard.render.com"
echo "2. Click on each service"
echo "3. The Service ID is in the URL: srv-xxxxxxxxxxxxx"
echo "   Example: https://dashboard.render.com/web/srv-abcd1234"
echo ""

read -p "Enter Backend Service ID (srv-xxxxx): " BACKEND_ID
read -p "Enter Frontend Service ID (srv-xxxxx): " FRONTEND_ID

if [ -z "$BACKEND_ID" ] || [ -z "$FRONTEND_ID" ]; then
    echo ""
    echo "❌ Both Service IDs are required"
    exit 1
fi

echo ""
echo "✅ Backend Service ID:  $BACKEND_ID"
echo "✅ Frontend Service ID: $FRONTEND_ID"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 Creating .env.deploy..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

cat > .env.deploy << EOF
# Render Deployment Configuration
# Auto-generated by setup.sh on $(date)

# Backend Web Service ID
RENDER_BACKEND_SERVICE_ID=$BACKEND_ID

# Frontend Static Site Service ID
RENDER_FRONTEND_SERVICE_ID=$FRONTEND_ID
EOF

echo "✅ Created .env.deploy with service IDs"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "⚙️  Configure Environment Variables"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "You need to set environment variables in Render Dashboard:"
echo ""
echo "Backend ($BACKEND_ID):"
echo "  Required:"
echo "    - TURSO_DATABASE_URL      (from Turso dashboard)"
echo "    - TURSO_AUTH_TOKEN        (from Turso dashboard)"
echo "    - ALLOWED_ORIGIN          (frontend URL, e.g., https://mellas-checks.onrender.com)"
echo "  Optional (have defaults):"
echo "    - SCHOOL_TIMEZONE         (default: America/Mexico_City)"
echo "    - LOG_LEVEL               (default: info)"
echo "    - API_PREFIX              (default: /api/v1)"
echo ""
echo "Frontend ($FRONTEND_ID):"
echo "  Required:"
echo "    - VITE_API_BASE_URL       (backend URL + /api/v1, e.g., https://mellas-api.onrender.com/api/v1)"
echo ""
echo "Set these at:"
echo "  Backend:  https://dashboard.render.com/web/$BACKEND_ID/env-vars"
echo "  Frontend: https://dashboard.render.com/static/$FRONTEND_ID/env-vars"
echo ""

read -p "Press Enter to open Backend environment variables in browser..." 
if command -v xdg-open &> /dev/null; then
    xdg-open "https://dashboard.render.com/web/$BACKEND_ID/env-vars" &
elif command -v open &> /dev/null; then
    open "https://dashboard.render.com/web/$BACKEND_ID/env-vars" &
fi

read -p "Press Enter to open Frontend environment variables in browser..." 
if command -v xdg-open &> /dev/null; then
    xdg-open "https://dashboard.render.com/static/$FRONTEND_ID/env-vars" &
elif command -v open &> /dev/null; then
    open "https://dashboard.render.com/static/$FRONTEND_ID/env-vars" &
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Setup Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Next steps:"
echo ""
echo "1. ✅ Services created on Render"
echo "2. ⚙️  Configure environment variables (see links above)"
echo "3. 🚀 Deploy with:"
echo "     source .env.deploy"
echo "     ./scripts/deploy/deploy-all.sh"
echo ""
echo "4. 📊 Monitor deployments:"
echo "     ./scripts/deploy/status.sh"
echo ""
echo "📚 For more help:"
echo "   - Deployment docs: .github/instructions/deployment.instructions.md"
echo "   - Scripts docs:    scripts/deploy/README.md"
echo ""
