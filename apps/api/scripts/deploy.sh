#!/bin/bash
set -e

APP_DIR="/home/ubuntu/infiniteyatra/apps/api"
ECOSYSTEM_FILE="ecosystem.config.js"

echo "=========================================="
echo "Starting Zero-Downtime Deployment"
echo "Date: $(date)"
echo "=========================================="

# 1. Pull latest changes
echo "[1/5] Pulling from Git..."
cd /home/ubuntu/infiniteyatra
git pull origin main

# 2. Install dependencies (if any change)
echo "[2/5] Installing Dependencies..."
cd $APP_DIR
npm ci

# 3. Build the application
echo "[3/5] Building NestJS App..."
npm run build

# 4. Run Migrations (Safe check)
echo "[4/5] Checking/Running Database Migrations..."
# Ensure DATABASE_URL is set in .env
if [ -f .env ]; then
if [ -d "prisma/migrations" ]; then
    echo "Running migrate deploy..."
    npx prisma migrate deploy
  else
    echo "WARNING: No migrations found. Running db push (Acceptable for first deploy)..."
    npx prisma db push
  fi
else
  echo "WARNING: .env not found, skipping migration."
fi

# 5. Reload PM2 (Zero Downtime)
echo "[5/5] Reloading Application..."
pm2 reload $ECOSYSTEM_FILE --env production

echo "=========================================="
echo "Deployment Successful!"
echo "=========================================="
