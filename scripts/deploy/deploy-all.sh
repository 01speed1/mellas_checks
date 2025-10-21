#!/bin/bash

set -e

echo "🚀 Deploying mellas_checks to Render..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if ! command -v render &> /dev/null; then
    echo "❌ Error: Render CLI is not installed"
    echo "Install it with: npm install -g render"
    exit 1
fi

if [ -z "$RENDER_FRONTEND_SERVICE_ID" ] || [ -z "$RENDER_BACKEND_SERVICE_ID" ]; then
    echo "⚠️  Warning: Service IDs not set in environment"
    echo ""
    echo "You can either:"
    echo "1. Set environment variables:"
    echo "   export RENDER_FRONTEND_SERVICE_ID=srv-xxxxx"
    echo "   export RENDER_BACKEND_SERVICE_ID=srv-yyyyy"
    echo ""
    echo "2. Or provide them as arguments:"
    echo "   $0 <frontend-service-id> <backend-service-id>"
    echo ""
    
    if [ -z "$1" ] || [ -z "$2" ]; then
        echo "❌ Missing service IDs"
        exit 1
    fi
    
    FRONTEND_ID="$1"
    BACKEND_ID="$2"
else
    FRONTEND_ID="$RENDER_FRONTEND_SERVICE_ID"
    BACKEND_ID="$RENDER_BACKEND_SERVICE_ID"
fi

echo "📋 Deployment Plan:"
echo "   Frontend Service: $FRONTEND_ID"
echo "   Backend Service:  $BACKEND_ID"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Deployment cancelled"
    exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔨 Step 1/2: Deploying Backend"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

bash "$SCRIPT_DIR/deploy-backend.sh" "$BACKEND_ID"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎨 Step 2/2: Deploying Frontend"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

bash "$SCRIPT_DIR/deploy-frontend.sh" "$FRONTEND_ID"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ All services deployed successfully!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 Monitor deployments at:"
echo "   https://dashboard.render.com"
echo ""
echo "🔍 View logs:"
echo "   render logs --service=$BACKEND_ID --follow"
echo "   render logs --service=$FRONTEND_ID --follow"
