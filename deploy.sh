#!/bin/bash
# Hostinger VPS Deploy Script
# Run this script on the server after SSH login
# Usage: bash deploy.sh

set -e

echo "🚀 Pulling latest code from GitHub..."
git pull origin main

echo "📦 Installing client dependencies..."
cd client
npm ci --production=false

echo "🏗️ Building Next.js app..."
npm run build

echo "♻️ Restarting PM2 app..."
cd ..
pm2 restart ecosystem.config.js --update-env || pm2 start ecosystem.config.js

echo "✅ Deployment complete! App running on port 3000."
pm2 status
