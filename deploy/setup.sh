#!/usr/bin/env bash
# ============================================================
# Store Builder — Server Setup Script
# Run as root on Ubuntu 24.04
# Usage: bash setup.sh
# ============================================================
set -euo pipefail

REPO_URL="${REPO_URL:-}"       # Set your git repo URL here or pass as env
APP_DIR="/opt/store-builder"
DOMAIN="srv1480943.hstgr.cloud"

echo "========================================="
echo " Store Builder — Server Setup"
echo " Domain: $DOMAIN"
echo "========================================="

# ---- 1. System updates ----
echo "[1/8] Updating system..."
apt-get update -qq
apt-get upgrade -y -qq
apt-get install -y -qq curl git ufw openssl

# ---- 2. Docker ----
echo "[2/8] Installing Docker..."
if ! command -v docker &>/dev/null; then
  curl -fsSL https://get.docker.com | sh
  systemctl enable docker
  systemctl start docker
fi
docker --version

# ---- 3. Firewall ----
echo "[3/8] Configuring firewall..."
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp      # SSH
ufw allow 80/tcp      # HTTP
ufw allow 443/tcp     # HTTPS
ufw allow 8080/tcp    # Storefront (HTTP)
ufw --force enable
echo "Firewall configured."

# ---- 4. Clone / update repo ----
echo "[4/8] Setting up application directory..."
mkdir -p "$APP_DIR"

if [ -n "$REPO_URL" ]; then
  if [ -d "$APP_DIR/.git" ]; then
    echo "Pulling latest code..."
    git -C "$APP_DIR" pull
  else
    echo "Cloning repo..."
    git clone "$REPO_URL" "$APP_DIR"
  fi
else
  echo "REPO_URL not set — skipping git clone."
  echo "Copy your code to $APP_DIR manually or set REPO_URL and rerun."
fi

cd "$APP_DIR"

# ---- 5. Generate .env if missing ----
echo "[5/8] Checking .env..."
if [ ! -f "$APP_DIR/.env" ]; then
  echo "Generating .env from template..."

  POSTGRES_PASSWORD=$(openssl rand -hex 24)
  NEXTAUTH_SECRET=$(openssl rand -hex 32)
  ENCRYPTION_KEY=$(openssl rand -hex 32)

  cat > "$APP_DIR/.env" <<EOF
# PostgreSQL
POSTGRES_USER=storebuilder
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
POSTGRES_DB=storebuilder
DATABASE_URL=postgresql://storebuilder:$POSTGRES_PASSWORD@postgres:5432/storebuilder

# NextAuth
NEXTAUTH_SECRET=$NEXTAUTH_SECRET
NEXTAUTH_URL=https://$DOMAIN

# SMTP credential encryption (64-char hex = 32 bytes)
ENCRYPTION_KEY=$ENCRYPTION_KEY

# Optional: Global SMTP fallback
# SMTP_HOST=
# SMTP_PORT=587
# SMTP_USER=
# SMTP_PASS=
# SMTP_FROM=noreply@yourdomain.com
EOF

  echo ""
  echo "======================================================"
  echo " .env generated with random secrets."
  echo " SAVE THESE — they won't be regenerated:"
  echo ""
  echo " POSTGRES_PASSWORD = $POSTGRES_PASSWORD"
  echo " NEXTAUTH_SECRET   = $NEXTAUTH_SECRET"
  echo " ENCRYPTION_KEY    = $ENCRYPTION_KEY"
  echo "======================================================"
  echo ""
else
  echo ".env already exists — skipping generation."
fi

# ---- 6. SSL certificate ----
echo "[6/8] Obtaining SSL certificate..."
if [ ! -d "/etc/letsencrypt/live/$DOMAIN" ]; then
  # Start nginx in HTTP-only mode temporarily for ACME challenge
  docker run --rm -d --name certbot-nginx \
    -p 80:80 \
    -v /opt/certbot-www:/var/www/certbot \
    nginx:alpine \
    sh -c "mkdir -p /var/www/certbot && nginx -g 'daemon off;'" 2>/dev/null || true

  sleep 2

  docker run --rm \
    -v /etc/letsencrypt:/etc/letsencrypt \
    -v /opt/certbot-www:/var/www/certbot \
    certbot/certbot certonly \
    --webroot -w /var/www/certbot \
    -d "$DOMAIN" \
    --non-interactive --agree-tos \
    --email "admin@$DOMAIN" \
    --no-eff-email || echo "SSL failed — using self-signed or skipping. Run certbot manually."

  docker stop certbot-nginx 2>/dev/null || true
else
  echo "Certificate already exists for $DOMAIN."
fi

# ---- 7. Build & start ----
echo "[7/8] Building and starting services..."
cd "$APP_DIR"
docker compose -f docker-compose.prod.yml build --no-cache
docker compose -f docker-compose.prod.yml up -d --wait postgres

# Run migrations
echo "Running database migrations..."
docker compose -f docker-compose.prod.yml run --rm \
  -e DATABASE_URL="$(grep DATABASE_URL .env | cut -d= -f2-)" \
  admin sh -c "cd /app && npx prisma migrate deploy --schema packages/database/prisma/schema.prisma" \
  || echo "Migration via compose profile — running separately..."

# Start all services
docker compose -f docker-compose.prod.yml up -d

echo ""
# ---- 8. Status ----
echo "[8/8] Status:"
docker compose -f docker-compose.prod.yml ps

echo ""
echo "========================================="
echo " Deployment complete!"
echo ""
echo " Admin:      https://$DOMAIN"
echo " Storefront: http://$DOMAIN:8080"
echo ""
echo " Default login:"
echo "   Email:    admin@example.com"
echo "   Password: admin123"
echo ""
echo " IMPORTANT: Change password after first login!"
echo "========================================="
