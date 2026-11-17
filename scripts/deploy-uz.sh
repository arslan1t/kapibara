#!/usr/bin/env bash
#
# Deploys the UZBEK Капибара — capibara.uz.
#
#   UZ_HOST=1.2.3.4 ./scripts/deploy-uz.sh
#
# Targets a Linux server with root (or sudo) and a systemd init: a PS Cloud
# VPS, a cloud server, or any other. NOT the "Хостинг сайтов" shared plan —
# that one runs PHP through Plesk and ships no Node.js, and Next.js is a
# long-lived Node process, not a set of scripts a web server calls.
#
# Everything is built ON the server. Prisma and sharp ship native binaries, so
# a bundle built on a Mac cannot run on Linux; building here also means the
# artifact is compiled against the Node the server actually has.
#
# Safe to re-run. It touches the database only through `prisma migrate deploy`,
# which applies what is pending and nothing else.
#
# ── What must exist first ────────────────────────────────────────────────────
#
#   1. SSH access as $UZ_USER with sudo, by key.
#   2. $REMOTE_DIR/.env on the server, populated from .env.example, with
#      NEXT_PUBLIC_MARKET="UZ" and a DATABASE_URL pointing at a PostgreSQL
#      inside Uzbekistan. That last part is not a preference: article 27-1 of
#      ЗРУ-547 requires it, and the published privacy policy states it as fact.
#
#      Upload it once, explicitly:
#
#          ENV_FILE=~/kapibara-uz.env ./scripts/deploy-uz.sh
#
#      Never a path inside the repository: the file holds the database password
#      and the Payme and Click secrets.
#
#   3. nginx in front, terminating TLS for capibara.uz and proxying to
#      127.0.0.1:$APP_PORT. The script prints a working server block on first
#      run rather than editing nginx itself, because a deploy script that
#      rewrites the web server configuration of a host it does not own is a
#      good way to take down a neighbouring site.
#
set -euo pipefail

UZ_USER="${UZ_USER:-root}"
UZ_HOST="${UZ_HOST:-}"
SSH_KEY="${SSH_KEY:-$HOME/.ssh/kapibara_uz}"

REMOTE_DIR="${REMOTE_DIR:-/srv/capibara-uz}"
BRANCH="${BRANCH:-main}"
REPO="${REPO:-https://github.com/arslan1t/kapibara.git}"
APP_PORT="${APP_PORT:-3100}"
SERVICE="${SERVICE:-capibara-uz}"
SITE_URL="${SITE_URL:-https://capibara.uz}"

say() { printf '\n\033[1m▸ %s\033[0m\n' "$1"; }

if [ -z "$UZ_HOST" ]; then
  echo "UZ_HOST is not set. Example: UZ_HOST=1.2.3.4 ./scripts/deploy-uz.sh" >&2
  exit 1
fi

ssh_opts=(-o StrictHostKeyChecking=accept-new)
[ -f "$SSH_KEY" ] && ssh_opts+=(-i "$SSH_KEY")

if ! ssh "${ssh_opts[@]}" -o BatchMode=yes "$UZ_USER@$UZ_HOST" true 2>/dev/null; then
  echo "Cannot reach $UZ_USER@$UZ_HOST over SSH with $SSH_KEY." >&2
  exit 1
fi

# ── Node ─────────────────────────────────────────────────────────────────────
say "Making sure Node is present"
ssh "${ssh_opts[@]}" "$UZ_USER@$UZ_HOST" "REMOTE_DIR='$REMOTE_DIR' bash -s" <<'REMOTE'
set -euo pipefail
if command -v node >/dev/null 2>&1 && [ "$(node -v | cut -d. -f1 | tr -d v)" -ge 20 ]; then
  echo "node $(node -v) already installed"
else
  # NodeSource rather than the distribution package: Debian and AlmaLinux both
  # ship a Node too old for Next 15, and discovering that during a build is a
  # worse failure than installing a known-good one here.
  if command -v apt-get >/dev/null 2>&1; then
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
    apt-get install -y nodejs
  else
    curl -fsSL https://rpm.nodesource.com/setup_22.x | bash -
    dnf install -y nodejs
  fi
  echo "installed node $(node -v)"
fi
REMOTE

# ── Code ─────────────────────────────────────────────────────────────────────
say "Fetching $BRANCH"
ssh "${ssh_opts[@]}" "$UZ_USER@$UZ_HOST" \
  "REMOTE_DIR='$REMOTE_DIR' REPO='$REPO' BRANCH='$BRANCH' bash -s" <<'REMOTE'
set -euo pipefail
if [ -d "$REMOTE_DIR/.git" ]; then
  cd "$REMOTE_DIR"
  git fetch --depth 1 origin "$BRANCH"
  git reset --hard "origin/$BRANCH"
else
  mkdir -p "$(dirname "$REMOTE_DIR")"
  git clone --depth 1 --branch "$BRANCH" "$REPO" "$REMOTE_DIR"
  cd "$REMOTE_DIR"
fi
echo "at $(git rev-parse --short HEAD)"
REMOTE

# ── Environment ──────────────────────────────────────────────────────────────
if [ -n "${ENV_FILE:-}" ]; then
  case "$(cd "$(dirname "$ENV_FILE")" && pwd)" in
    "$(cd "$(dirname "$0")/.." && pwd)"*)
      echo "Refusing to upload an env file from inside the repository." >&2
      exit 1
      ;;
  esac
  say "Uploading $ENV_FILE"
  scp "${ssh_opts[@]}" "$ENV_FILE" "$UZ_USER@$UZ_HOST:$REMOTE_DIR/.env"
  ssh "${ssh_opts[@]}" "$UZ_USER@$UZ_HOST" "chmod 600 '$REMOTE_DIR/.env'"
fi

say "Checking the environment"
ssh "${ssh_opts[@]}" "$UZ_USER@$UZ_HOST" "REMOTE_DIR='$REMOTE_DIR' bash -s" <<'REMOTE'
set -euo pipefail
if [ ! -f "$REMOTE_DIR/.env" ]; then
  echo "No .env on the server. Create it, or pass ENV_FILE=..." >&2
  exit 1
fi

missing=""
for key in DATABASE_URL DIRECT_URL AUTH_SECRET NEXT_PUBLIC_SITE_URL \
           NEXT_PUBLIC_MARKET STORAGE_DRIVER; do
  grep -qE "^${key}=.+" "$REMOTE_DIR/.env" || missing="$missing $key"
done
if [ -n "$missing" ]; then
  echo "These required variables are empty or absent in .env:$missing" >&2
  exit 1
fi

# Checked, not assumed. The build inlines the market, so the wrong value here
# would put rouble prices and a Russian seller on capibara.uz.
market=$(grep -E '^NEXT_PUBLIC_MARKET=' "$REMOTE_DIR/.env" | head -1 | cut -d= -f2- | tr -d '"'"'"' ')
if [ "$market" != "UZ" ]; then
  echo "This script deploys the Uzbek site, but .env declares NEXT_PUBLIC_MARKET=$market." >&2
  exit 1
fi

# A warning, not a refusal: the host of a managed database is not always a
# reliable signal of where it physically sits, and only the owner knows.
db_host=$(grep -E '^DATABASE_URL=' "$REMOTE_DIR/.env" | head -1 | sed -E 's|.*@([^:/]+).*|\1|')
case "$db_host" in
  *.uz|127.0.0.1|localhost) ;;
  *)
    echo "NOTE: DATABASE_URL points at '$db_host', which does not look like it is"
    echo "      inside Uzbekistan. Article 27-1 of ЗРУ-547 requires the personal"
    echo "      data of Uzbek citizens to be processed on databases located in"
    echo "      the country, and the published privacy policy states that it is."
    ;;
esac
echo "environment ok; market=UZ"
REMOTE

# ── Build ────────────────────────────────────────────────────────────────────
say "Installing dependencies and building"
ssh "${ssh_opts[@]}" "$UZ_USER@$UZ_HOST" "REMOTE_DIR='$REMOTE_DIR' bash -s" <<'REMOTE'
set -euo pipefail
cd "$REMOTE_DIR"
npm ci
set -a; . ./.env; set +a
export NODE_ENV=production
npm run build
REMOTE

say "Applying database migrations"
ssh "${ssh_opts[@]}" "$UZ_USER@$UZ_HOST" "REMOTE_DIR='$REMOTE_DIR' bash -s" <<'REMOTE'
set -euo pipefail
cd "$REMOTE_DIR"
set -a; . ./.env; set +a
npx prisma migrate deploy
REMOTE

say "Assembling the standalone runtime"
ssh "${ssh_opts[@]}" "$UZ_USER@$UZ_HOST" "REMOTE_DIR='$REMOTE_DIR' bash -s" <<'REMOTE'
set -euo pipefail
cd "$REMOTE_DIR"
# `output: "standalone"` emits a minimal server, but Next deliberately leaves
# static assets and /public for the deployer to place.
rm -rf .next/standalone/.next/static .next/standalone/public
cp -r .next/static .next/standalone/.next/static
[ -d public ] && cp -r public .next/standalone/public
cp .env .next/standalone/.env
chmod 600 .next/standalone/.env
echo "standalone ready: $(du -sh .next/standalone | cut -f1)"
REMOTE

# ── Service ──────────────────────────────────────────────────────────────────
say "Installing the systemd unit and restarting"
ssh "${ssh_opts[@]}" "$UZ_USER@$UZ_HOST" \
  "REMOTE_DIR='$REMOTE_DIR' APP_PORT='$APP_PORT' SERVICE='$SERVICE' bash -s" <<'REMOTE'
set -euo pipefail

cat > "/etc/systemd/system/${SERVICE}.service" <<UNIT
[Unit]
Description=Kapibara (Uzbekistan)
After=network.target

[Service]
Type=simple
WorkingDirectory=${REMOTE_DIR}/.next/standalone
# The env file is read by systemd rather than sourced by a shell, so a value
# containing a space or a quote arrives intact.
EnvironmentFile=${REMOTE_DIR}/.env
Environment=NODE_ENV=production
Environment=PORT=${APP_PORT}
Environment=HOSTNAME=127.0.0.1
ExecStart=$(command -v node) server.js
Restart=always
RestartSec=3
# The process only ever needs to read its own tree and write nothing outside
# it; uploads go to object storage.
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=full

[Install]
WantedBy=multi-user.target
UNIT

systemctl daemon-reload
systemctl enable "${SERVICE}" >/dev/null 2>&1 || true
systemctl restart "${SERVICE}"
sleep 3
systemctl is-active --quiet "${SERVICE}" && echo "${SERVICE} is running on 127.0.0.1:${APP_PORT}"
REMOTE

# ── nginx, printed rather than written ───────────────────────────────────────
say "nginx server block (install it yourself if it is not there yet)"
cat <<NGINX
server {
    server_name capibara.uz www.capibara.uz;

    # Next streams responses; buffering them delays the first byte for no gain.
    proxy_buffering off;

    location / {
        proxy_pass http://127.0.0.1:${APP_PORT};
        proxy_http_version 1.1;
        proxy_set_header Host              \$host;
        proxy_set_header X-Real-IP         \$remote_addr;
        proxy_set_header X-Forwarded-For   \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Upgrade           \$http_upgrade;
        proxy_set_header Connection        "upgrade";
    }

    # Payme and Click POST here. Their bodies are small, but a redirect would
    # lose them, so this must never be rewritten.
    location /api/payments/ {
        proxy_pass http://127.0.0.1:${APP_PORT};
        proxy_http_version 1.1;
        proxy_set_header Host            \$host;
        proxy_set_header X-Real-IP       \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    }

    listen 443 ssl;
    # certbot --nginx -d capibara.uz -d www.capibara.uz
}
NGINX

say "Checking the public address"
code=$(curl -s -o /tmp/kapibara-uz-health.json -w '%{http_code}' --max-time 20 "$SITE_URL/api/health" || true)
echo "  $SITE_URL/api/health -> HTTP ${code:-no answer}"
[ -s /tmp/kapibara-uz-health.json ] && cat /tmp/kapibara-uz-health.json && echo

say "Done."
