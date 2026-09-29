#!/bin/bash
set -e

APP_DIR="/var/www/ai.beegoo.app"
DOMAIN="ai.beegoo.app"
WEB_PORT=3002
ORCH_PORT=3003
DB_NAME="mojadoo"
DB_USER="mojadoo_user"
DB_PASS="MojadooDb@2024"

echo ">>> Creating app directory..."
mkdir -p $APP_DIR

echo ">>> Setting up PostgreSQL database..."
sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='$DB_USER'" | grep -q 1 || \
  sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';"
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" | grep -q 1 || \
  sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"

echo ">>> Writing .env files..."

cat > $APP_DIR/apps/web/.env.local << 'EOF'
DATABASE_URL="postgresql://mojadoo_user:MojadooDb@2024@localhost:5432/mojadoo"
BETTER_AUTH_SECRET="mj-auth-secret-beegoo-app-2024-xK9pL2mN"
BETTER_AUTH_URL="https://ai.beegoo.app"
NEXT_PUBLIC_APP_URL="https://ai.beegoo.app"
ORCHESTRATOR_URL="http://localhost:3003"
ORCHESTRATOR_SECRET="orchestrator-internal-secret"
XENDIT_SECRET_KEY="xnd_development_your-key-here"
XENDIT_WEBHOOK_TOKEN="your-xendit-webhook-token"
HITPAY_API_KEY="your-hitpay-api-key"
HITPAY_SALT="your-hitpay-salt"
HITPAY_ENV="sandbox"
GITHUB_CLIENT_ID="your-github-oauth-app-client-id"
GITHUB_CLIENT_SECRET="your-github-oauth-app-client-secret"
COOLIFY_URL="https://your-coolify-instance.com"
COOLIFY_TOKEN="your-coolify-api-token"
COOLIFY_SERVER_UUID="your-coolify-server-uuid"
EOF

cat > $APP_DIR/apps/orchestrator/.env << 'EOF'
DATABASE_URL="postgresql://mojadoo_user:MojadooDb@2024@localhost:5432/mojadoo"
OPENAI_API_KEY="sk-your-openai-key-here"
ORCHESTRATOR_PORT=3003
WORKSPACES_PATH="/var/www/ai.beegoo.app/workspaces"
ORCHESTRATOR_SECRET="orchestrator-internal-secret"
EOF

cat > $APP_DIR/packages/database/.env << 'EOF'
DATABASE_URL="postgresql://mojadoo_user:MojadooDb@2024@localhost:5432/mojadoo"
EOF

echo ">>> Installing dependencies..."
cd $APP_DIR
pnpm install --frozen-lockfile

echo ">>> Generating Prisma client..."
cd $APP_DIR
pnpm db:generate

echo ">>> Running DB migrations..."
cd $APP_DIR/packages/database
npx prisma migrate deploy || npx prisma db push

echo ">>> Building apps..."
cd $APP_DIR
pnpm build

echo ">>> Setting up PM2 processes..."
pm2 delete mojadoo-web 2>/dev/null || true
pm2 delete mojadoo-orchestrator 2>/dev/null || true

pm2 start "pnpm start --port $WEB_PORT" \
  --name mojadoo-web \
  --cwd $APP_DIR/apps/web \
  --interpreter none

pm2 start "node dist/index.js" \
  --name mojadoo-orchestrator \
  --cwd $APP_DIR/apps/orchestrator \
  --interpreter none

pm2 save

echo ">>> Configuring Nginx..."
cat > /etc/nginx/sites-available/$DOMAIN << NGINX
server {
    listen 80;
    server_name $DOMAIN;

    location / {
        proxy_pass http://localhost:$WEB_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
NGINX

ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/$DOMAIN
nginx -t && systemctl reload nginx

echo ">>> Installing Certbot and getting SSL cert..."
apt-get install -y certbot python3-certbot-nginx -q
certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email admin@beegoo.app --redirect

echo ">>> Creating workspaces directory..."
mkdir -p $APP_DIR/workspaces

echo ""
echo "✅ DONE! mojadoo-builder is live at https://$DOMAIN"
echo "   Web (Next.js) → port $WEB_PORT"
echo "   Orchestrator  → port $ORCH_PORT"
