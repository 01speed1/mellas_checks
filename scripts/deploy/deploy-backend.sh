#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "🚀 Deploying Backend to Render..."
echo ""

if ! command -v render &> /dev/null; then
    echo "❌ Error: Render CLI is not installed"
    echo "Install it with: npm install -g render"
    exit 1
fi

if [ -f "$PROJECT_ROOT/.env.deploy" ]; then
    source "$PROJECT_ROOT/.env.deploy"
fi

if [ -z "$RENDER_BACKEND_SERVICE_ID" ]; then
    echo "⚠️  Warning: RENDER_BACKEND_SERVICE_ID not set"
    echo "Please set it in your environment or provide it as argument"
    echo ""
    echo "Usage: $0 [service-id]"
    echo ""
    
    if [ -z "$1" ]; then
        echo "❌ No service ID provided"
        exit 1
    fi
    
    SERVICE_ID="$1"
else
    SERVICE_ID="$RENDER_BACKEND_SERVICE_ID"
fi

echo "📦 Building backend locally..."
cd apps/server
pnpm install
pnpm build
cd ../..

echo ""
echo "🌐 Deploying to Render service: $SERVICE_ID"
render deploy --service="$SERVICE_ID"

echo ""
echo "✅ Backend deployment initiated!"
echo "Check status at: https://dashboard.render.com"
