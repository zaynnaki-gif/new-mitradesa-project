#!/bin/bash
# MITRADESA API - Deployment Script
# =========================================

set -e

echo "🚀 MITRADESA API Deployment"
echo "========================"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Run this script from apps/api directory"
    exit 1
fi

echo -e "${YELLOW}Step 1: Installing dependencies...${NC}"
npm install

echo -e "${YELLOW}Step 2: Generating Prisma Client...${NC}"
npx prisma generate

echo -e "${YELLOW}Step 3: Building TypeScript...${NC}"
npm run build

echo -e "${GREEN}✅ Build complete!${NC}"
echo ""
echo -e "${YELLOW}Step 4: Files ready for deployment${NC}"
echo ""
echo "To deploy to Hostinger:"
echo "1. Copy these files to your server:"
echo "   - dist/"
echo "   - prisma/"
echo "   - node_modules/"
echo "   - .env.deploy (rename to .env)"
echo ""
echo "2. On server, run:"
echo "   npm install --production"
echo "   npm run start"
echo ""
echo -e "${GREEN}🎉 Deployment package ready!${NC}"
