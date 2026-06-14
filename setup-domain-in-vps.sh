#!/usr/bin/env bash
set -euo pipefail

DOMAIN="${DOMAIN:-jwt.tsunstudio.pw}"
EMAIL="${EMAIL:-admin@tsunstudio.pw}"
APP_PORT="${APP_PORT:-8077}"
PROJECT_DIR="${PROJECT_DIR:-$(pwd)}"
CONTAINER_NAME="${CONTAINER_NAME:-tsun-ff-jwt-api}"
IMAGE_NAME="${IMAGE_NAME:-tsun-ff-jwt-api}"

# Load local .env file if it exists
if [ -f "${PROJECT_DIR}/.env" ]; then
  echo "✔ Found .env file, loading configuration..."
  # Export variables while ignoring comments
  export $(grep -v '^#' "${PROJECT_DIR}/.env" | xargs)
fi

# Validate environment variables
MISSING_VARS=()
if [ -z "${VALID_API_KEY:-}" ]; then MISSING_VARS+=("VALID_API_KEY"); fi
if [ -z "${ADMIN_KEY:-}" ]; then MISSING_VARS+=("ADMIN_KEY"); fi
if [ -z "${DATABASE_URL:-}" ]; then MISSING_VARS+=("DATABASE_URL"); fi

if [ ${#MISSING_VARS[@]} -ne 0 ]; then
  echo "ERROR: Missing required environment variable(s): ${MISSING_VARS[*]}"
  echo "Please set them in your environment or define them in a .env file."
  echo "For purchase api key contact with @saeedxdie on Telegram or instagram"
  exit 1
fi

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║   TSun FF JWT API — VPS Setup                   ║"
echo "║   Domain : ${DOMAIN}"
echo "║   Port   : ${APP_PORT}"
echo "╚══════════════════════════════════════════════════╝"
echo ""

if [ ! -f "${PROJECT_DIR}/app.py" ] || [ ! -f "${PROJECT_DIR}/Dockerfile" ]; then
  echo "ERROR: PROJECT_DIR must point to the project root."; exit 1
fi

echo "=== [1/7] Installing system packages ==="
sudo apt update && sudo apt install -y nginx certbot python3-certbot-nginx

echo "=== [2/7] Ensuring Docker is installed ==="
if ! command -v docker >/dev/null 2>&1; then
  if apt-cache policy docker-ce 2>/dev/null | grep -q "Candidate:"; then
    sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
  else
    sudo apt install -y docker.io
  fi
fi
docker compose version >/dev/null 2>&1 || sudo apt install -y docker-compose-plugin 2>/dev/null || true
sudo systemctl enable --now docker nginx

cd "${PROJECT_DIR}"
echo "=== [3/7] Building Docker image ==="
sudo docker build -t "${IMAGE_NAME}:latest" .

echo "=== [4/7] Starting container ==="
sudo docker rm -f "${CONTAINER_NAME}" >/dev/null 2>&1 || true
if [ -f docker-compose.yml ] && docker compose version >/dev/null 2>&1; then
  sudo docker compose up -d --build
else
  sudo docker run -d --name "${CONTAINER_NAME}" --restart always \
    -p "127.0.0.1:${APP_PORT}:${APP_PORT}" \
    -e PYTHONUNBUFFERED=1 \
    -e VALID_API_KEY="${VALID_API_KEY}" \
    -e ADMIN_KEY="${ADMIN_KEY}" \
    -e DATABASE_URL="${DATABASE_URL}" \
    "${IMAGE_NAME}:latest"
fi

echo "=== [5/7] Configuring Nginx ==="
sudo tee "/etc/nginx/sites-available/${DOMAIN}" >/dev/null <<EOF
server {
    listen 80;
    server_name ${DOMAIN};
    client_max_body_size 10m;
    location / {
        proxy_pass http://127.0.0.1:${APP_PORT};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Connection "";
        proxy_read_timeout 120s;
        proxy_send_timeout 120s;
        proxy_connect_timeout 10s;
        proxy_buffering off;
    }
}
EOF
sudo ln -sf "/etc/nginx/sites-available/${DOMAIN}" "/etc/nginx/sites-enabled/${DOMAIN}"
sudo rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true
sudo nginx -t && sudo systemctl reload nginx

echo "=== [6/7] Requesting SSL certificate ==="
sudo certbot --nginx -d "${DOMAIN}" --redirect -m "${EMAIL}" --agree-tos -n

echo ""
echo "=== [7/7] Verification ==="
sudo docker ps --filter "name=${CONTAINER_NAME}" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo "✔ Setup complete! https://${DOMAIN}"
