#!/bin/bash

set -e

echo "📊 Render Deployment Status"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if ! command -v render &> /dev/null; then
    echo "❌ Error: Render CLI is not installed"
    echo "Install it with: npm install -g render"
    exit 1
fi

if [ -z "$RENDER_FRONTEND_SERVICE_ID" ] || [ -z "$RENDER_BACKEND_SERVICE_ID" ]; then
    echo "⚠️  Warning: Service IDs not set"
    echo "Please set RENDER_FRONTEND_SERVICE_ID and RENDER_BACKEND_SERVICE_ID"
    echo ""
    
    if [ -z "$1" ] || [ -z "$2" ]; then
        echo "Or provide them as arguments:"
        echo "  $0 <frontend-service-id> <backend-service-id>"
        echo ""
        exit 1
    fi
    
    FRONTEND_ID="$1"
    BACKEND_ID="$2"
else
    FRONTEND_ID="$RENDER_FRONTEND_SERVICE_ID"
    BACKEND_ID="$RENDER_BACKEND_SERVICE_ID"
fi

echo "🔍 Checking services..."
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎨 Frontend Service: $FRONTEND_ID"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
render services list --service="$FRONTEND_ID" 2>/dev/null || echo "⚠️  Could not fetch service info"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔨 Backend Service: $BACKEND_ID"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
render services list --service="$BACKEND_ID" 2>/dev/null || echo "⚠️  Could not fetch service info"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 Recent Deployments"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "View detailed deployment history at:"
echo "  Frontend: https://dashboard.render.com/web/$FRONTEND_ID"
echo "  Backend:  https://dashboard.render.com/web/$BACKEND_ID"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 View Logs"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Frontend logs:"
echo "  render logs --service=$FRONTEND_ID --follow"
echo ""
echo "Backend logs:"
echo "  render logs --service=$BACKEND_ID --follow"
echo ""
