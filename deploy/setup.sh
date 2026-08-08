#!/usr/bin/env bash
#
# One-shot VPS deploy for Infinite Yatra (Ubuntu 22.04+).
# Installs Node/PM2/Nginx, starts the API, builds the frontend, and wires Nginx.
# Run it ON THE VPS from the repo root, as a sudo-capable user:
#
#     cd /var/www/infiniteyatra
#     cp server/.env.example server/.env      # then fill in MONGODB_URI + JWT_SECRET
#     bash deploy/setup.sh
#
# Safe to re-run (idempotent). It does NOT touch DNS or run certbot — it prints
# the certbot command for you to run at the end.

set -euo pipefail

# ─── Config (override via env, e.g. DOMAIN=foo.com bash deploy/setup.sh) ───
DOMAIN="${DOMAIN:-infiniteyatra.com}"
WWW_DOMAIN="${WWW_DOMAIN:-www.${DOMAIN}}"
REPO_DIR="${REPO_DIR:-$(cd "$(dirname "$0")/.." && pwd)}"
WEB_ROOT="${WEB_ROOT:-/var/www/infiniteyatra-web}"
API_PORT="${API_PORT:-8080}"

say() { printf '\n\033[1;36m▶ %s\033[0m\n' "$1"; }

# ─── Preflight ───
if [[ ! -f "$REPO_DIR/server/.env" ]]; then
    echo "✘ $REPO_DIR/server/.env is missing. Copy server/.env.example to server/.env and fill it in first." >&2
    exit 1
fi
if ! grep -q '^MONGODB_URI=.\+' "$REPO_DIR/server/.env" || ! grep -q '^JWT_SECRET=.\+' "$REPO_DIR/server/.env"; then
    echo "✘ server/.env must set MONGODB_URI and JWT_SECRET (non-empty)." >&2
    echo "  Generate a secret with: node -e \"console.log(require('crypto').randomBytes(48).toString('hex'))\"" >&2
    exit 1
fi

# ─── System packages ───
say "Installing Node 20, Nginx, PM2 (if missing)"
if ! command -v node >/dev/null 2>&1 || [[ "$(node -v | cut -c2-3)" -lt 20 ]]; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi
command -v nginx >/dev/null 2>&1 || sudo apt-get install -y nginx
command -v pm2   >/dev/null 2>&1 || sudo npm install -g pm2

# ─── API (PM2) ───
say "Starting the API under PM2"
cd "$REPO_DIR/server"
npm ci --omit=dev 2>/dev/null || npm install --omit=dev
pm2 start ecosystem.config.cjs 2>/dev/null || pm2 reload infiniteyatra-api
pm2 save
sudo env PATH="$PATH" pm2 startup systemd -u "$USER" --hp "$HOME" >/dev/null 2>&1 || true

sleep 2
if curl -fsS "http://127.0.0.1:${API_PORT}/api/health" >/dev/null; then
    echo "  ✔ API healthy on :${API_PORT}"
else
    echo "  ✘ API not responding — check: pm2 logs infiniteyatra-api" >&2
    exit 1
fi

# ─── Frontend build ───
say "Building the frontend"
cd "$REPO_DIR"
[[ -f .env.production ]] || cp .env.production.example .env.production
npm ci 2>/dev/null || npm install
npm run build
sudo mkdir -p "$WEB_ROOT"
sudo rsync -a --delete dist/ "$WEB_ROOT/"
echo "  ✔ Published to $WEB_ROOT"

# ─── Nginx ───
say "Configuring Nginx"
sudo tee /etc/nginx/sites-available/infiniteyatra >/dev/null <<NGINX
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN} ${WWW_DOMAIN};
    root ${WEB_ROOT};
    index index.html;

    gzip on;
    gzip_types text/plain text/css application/javascript application/json image/svg+xml;
    gzip_min_length 1024;

    location /api/ {
        proxy_pass http://127.0.0.1:${API_PORT};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location / {
        try_files \$uri \$uri/ /index.html;
    }
}
NGINX
sudo ln -sf /etc/nginx/sites-available/infiniteyatra /etc/nginx/sites-enabled/infiniteyatra
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
echo "  ✔ Nginx serving ${DOMAIN}"

# ─── Done ───
say "Base deploy complete"
cat <<DONE
Next steps (manual — they need your input):

  1. TLS certificate (interactive, asks for email):
       sudo apt-get install -y certbot python3-certbot-nginx
       sudo certbot --nginx -d ${DOMAIN} -d ${WWW_DOMAIN}

  2. Point ${DOMAIN} DNS (A record) at this VPS IP in Hostinger.

  3. Verify:
       curl -s https://${DOMAIN}/api/health

Redeploy later with:  git pull && bash deploy/setup.sh
DONE
