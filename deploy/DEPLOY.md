# Deploying Infinite Yatra to a Hostinger VPS

Single-VPS setup: **Nginx** serves the built React app and reverse-proxies
`/api` to the **Node API** (managed by **PM2**). MongoDB is your existing
managed database (e.g. Atlas). This gets the migrated forms (newsletter,
enquiry, contact) running off Firebase.

Assumes Ubuntu 22.04+ on the VPS with sudo, and DNS for `infiniteyatra.com`
pointing at the VPS IP. Run the numbered commands over SSH on the VPS unless
noted “(local machine)”.

---

## Fast path (one script)

Once the code is on the VPS and `server/.env` is filled in, the whole base
deploy is a single command:

```bash
cd /var/www/infiniteyatra
cp server/.env.example server/.env        # then edit: MONGODB_URI + JWT_SECRET
bash deploy/setup.sh                       # installs Node/PM2/Nginx, builds, wires Nginx
```

It prints the `certbot` (TLS) and DNS steps at the end — those still need your
input. The sections below explain each step the script performs, for when you
want to do it by hand or debug.

---

## 1. Install runtime (once)

```bash
# Node 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs nginx
sudo npm install -g pm2

# Firewall
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable
```

## 2. Get the code onto the VPS

```bash
sudo mkdir -p /var/www && cd /var/www
sudo chown -R $USER:$USER /var/www
git clone https://github.com/thisisparthchauhan/infiniteyatra.git
cd infiniteyatra
```

## 3. Start the API (PM2)

```bash
cd /var/www/infiniteyatra/server
cp .env.example .env
# Edit .env and set MONGODB_URI, JWT_SECRET (generate below), ADMIN_EMAILS.
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"   # JWT_SECRET
nano .env

npm install --omit=dev
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup            # run the command it prints, to survive reboots

# Verify the API is up locally:
curl -s http://127.0.0.1:8080/api/health      # -> {"ok":true,...}
```

`.env` for the server needs at minimum:

```
PORT=8080
MONGODB_URI=<your mongodb connection string>
JWT_SECRET=<the 96-char hex you generated>
ADMIN_EMAILS=chauhanparth165@gmail.com
CORS_ORIGINS=https://infiniteyatra.com,https://www.infiniteyatra.com
```

## 4. Build the frontend

Build on the VPS (or locally and copy `dist/` up — see §7).

```bash
cd /var/www/infiniteyatra
cp .env.production.example .env.production   # VITE_USE_API=true, VITE_API_URL empty
npm install
npm run build                                # outputs dist/

# Publish to the web root Nginx serves:
sudo mkdir -p /var/www/infiniteyatra-web
sudo rsync -a --delete dist/ /var/www/infiniteyatra-web/
```

> Note: the Nginx config's `root` is `/var/www/infiniteyatra`. Either point it
> at `/var/www/infiniteyatra-web` (recommended, keeps source and served files
> separate) or rsync `dist/` into the repo root. Pick one and keep the Nginx
> `root` matching it.

## 5. Nginx + HTTPS

```bash
sudo cp /var/www/infiniteyatra/deploy/nginx-infiniteyatra.conf \
        /etc/nginx/sites-available/infiniteyatra
# Make sure `root` in that file points at your served dir from §4.
sudo ln -s /etc/nginx/sites-available/infiniteyatra /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

# TLS certificate (Let's Encrypt):
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d infiniteyatra.com -d www.infiniteyatra.com
```

## 6. Verify end-to-end

```bash
curl -s https://infiniteyatra.com/api/health          # {"ok":true,...}
```

Then open the site and submit the **footer newsletter** and **enquiry popup** —
they should now write to MongoDB (not Firestore). Confirm as admin:

```bash
# Register the admin account once (email must be in ADMIN_EMAILS):
curl -s -X POST https://infiniteyatra.com/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"chauhanparth165@gmail.com","password":"<pick-a-strong-one>"}'
# Use the returned token to read leads:
curl -s https://infiniteyatra.com/api/leads -H "Authorization: Bearer <token>"
```

## 7. Redeploys (after pushing new code)

```bash
cd /var/www/infiniteyatra
git pull
# backend changed:
cd server && npm install --omit=dev && pm2 reload infiniteyatra-api
# frontend changed:
cd /var/www/infiniteyatra && npm install && npm run build \
  && sudo rsync -a --delete dist/ /var/www/infiniteyatra-web/
```

---

### DNS note
Point the `A` record for `infiniteyatra.com` (and `www`) at the VPS IP in
Hostinger's DNS. If the domain currently resolves to Firebase Hosting, this
switch is what actually moves traffic to the VPS.

### Rollback
The Firebase deploy still exists. If anything goes wrong, repoint DNS back to
Firebase (or set `VITE_USE_API=false`, rebuild) while you debug.
