#!/usr/bin/env bash
#
# Deploys the UZBEK Капибара — capibara.uz.
#
#   UZ_HOST=1.2.3.4 ./scripts/deploy-uz.sh
#
# Targets a server already prepared by scripts/provision-uz.sh: Node,
# PostgreSQL, nginx, the application user and the data directory. Run that
# once first.
#
# NOT a PHP shared-hosting plan. Next.js is a long-lived Node process, not a
# set of scripts a web server calls.
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
#   2. $REMOTE_DIR/.env on the server. provision-uz.sh writes most of it,
#      including a database password and AUTH_SECRET generated there so they
#      never cross the wire. NEXT_PUBLIC_MARKET must be "UZ" and DATABASE_URL
#      must point at a PostgreSQL inside Uzbekistan — not a preference:
#      article 27-1 of ЗРУ-547 requires it, and the published privacy policy
#      states it as fact.
#
#      Upload it once, explicitly:
#
#          ENV_FILE=~/kapibara-uz.env ./scripts/deploy-uz.sh
#
#      Never a path inside the repository: the file holds the database password
#      and the Payme and Click secrets.
#
#   3. nginx in front, terminating TLS for capibara.uz. provision-uz.sh writes
#      the server block; certbot issues the certificate once DNS resolves.
#
set -euo pipefail

UZ_USER="${UZ_USER:-root}"
UZ_HOST="${UZ_HOST:-}"
SSH_KEY="${SSH_KEY:-$HOME/.ssh/kapibara_uz}"

REMOTE_DIR="${REMOTE_DIR:-/srv/capibara-uz}"
BRANCH="${BRANCH:-main}"
REPO="${REPO:-https://github.com/arslan1t/kapibara.git}"
APP_PORT="${APP_PORT:-3100}"
DATA_DIR="${DATA_DIR:-/srv/capibara-uz-data}"
SERVICE="${SERVICE:-capibara-uz}"
APP_USER="${APP_USER:-kapibara}"
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

# ── Preconditions ────────────────────────────────────────────────────────────
say "Checking the server was provisioned"
ssh "${ssh_opts[@]}" "$UZ_USER@$UZ_HOST" "APP_USER='$APP_USER' bash -s" <<'REMOTE'
set -euo pipefail
missing=""
command -v node >/dev/null 2>&1 || missing="$missing node"
command -v psql >/dev/null 2>&1 || missing="$missing postgresql"
command -v nginx >/dev/null 2>&1 || missing="$missing nginx"
id -u "$APP_USER" >/dev/null 2>&1 || missing="$missing user:$APP_USER"
if [ -n "$missing" ]; then
  echo "Not provisioned — missing:$missing" >&2
  echo "Run scripts/provision-uz.sh against this host first." >&2
  exit 1
fi
echo "node $(node -v), $(psql --version | head -1), nginx present, user $APP_USER exists"
REMOTE

# ── Code ─────────────────────────────────────────────────────────────────────
say "Fetching $BRANCH"
ssh "${ssh_opts[@]}" "$UZ_USER@$UZ_HOST" \
  "REMOTE_DIR='$REMOTE_DIR' REPO='$REPO' BRANCH='$BRANCH' bash -s" <<'REMOTE'
set -euo pipefail
# provision-uz.sh writes .env into this directory before the first deploy ever
# runs, so `git clone` refuses it as non-empty. Initialising the repository in
# place covers all three states the directory can be in — new, holding only
# .env, or already a clone — and `git reset --hard` rewrites tracked files
# without touching an untracked .env.
mkdir -p "$REMOTE_DIR"
# The tree belongs to the unprivileged app user and git runs here as root, so
# git's ownership check would refuse the repository outright. Marking the one
# path safe is narrower than relaxing the check globally, and idempotent.
git config --global --add safe.directory "$REMOTE_DIR" 2>/dev/null || true
[ -d "$REMOTE_DIR/.git" ] || git init -q "$REMOTE_DIR"
cd "$REMOTE_DIR"
# `add` on a fresh repository, `set-url` on one an interrupted run left behind:
# a deploy that dies between `init` and `remote add` leaves .git with no remote
# at all, and the next run has to recover from that rather than fail on it.
git remote add origin "$REPO" 2>/dev/null || git remote set-url origin "$REPO"
# Never let git stop for a credential prompt: a private repository or a bad
# URL would otherwise hang the deploy indefinitely instead of failing.
export GIT_TERMINAL_PROMPT=0
git fetch --depth 1 origin "$BRANCH"
git reset --hard FETCH_HEAD
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
# package-lock.json is written by the npm that ships with the Node used for
# development, which runs ahead of the npm bundled with Node 22 here. The
# older npm resolves the `overrides` block differently, concludes the lockfile
# is out of sync and refuses to install. Raising npm on the server is the
# honest fix: regenerating the lockfile here would mean deploying a dependency
# tree nobody has tested.
LOCKFILE_NPM_MAJOR=11
if [ "$(npm -v | cut -d. -f1)" -lt "$LOCKFILE_NPM_MAJOR" ]; then
  npm i -g "npm@${LOCKFILE_NPM_MAJOR}" >/dev/null
fi
echo "node $(node -v), npm $(npm -v)"
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
ssh "${ssh_opts[@]}" "$UZ_USER@$UZ_HOST" \
  "REMOTE_DIR='$REMOTE_DIR' APP_USER='$APP_USER' bash -s" <<'REMOTE'
set -euo pipefail
cd "$REMOTE_DIR"
# `output: "standalone"` emits a minimal server, but Next deliberately leaves
# static assets and /public for the deployer to place.
rm -rf .next/standalone/.next/static .next/standalone/public
cp -r .next/static .next/standalone/.next/static
# Written as an if, not `[ -d public ] && cp`: under `set -e` the AND-list
# returns non-zero when the directory is absent and kills the deploy.
if [ -d public ]; then cp -r public .next/standalone/public; fi
cp .env .next/standalone/.env
chmod 600 .next/standalone/.env
# systemd refuses to start a unit whose ReadWritePaths do not exist, so the
# image cache directory is made here rather than left to the first request.
mkdir -p .next/standalone/.next/cache
# The service runs as $APP_USER, so the tree it reads must belong to it.
chown -R "$APP_USER:$APP_USER" "$REMOTE_DIR"
echo "standalone ready: $(du -sh .next/standalone | cut -f1)"
REMOTE

# ── Service ──────────────────────────────────────────────────────────────────
say "Installing the systemd unit and restarting"
ssh "${ssh_opts[@]}" "$UZ_USER@$UZ_HOST" \
  "REMOTE_DIR='$REMOTE_DIR' APP_PORT='$APP_PORT' SERVICE='$SERVICE' \
   APP_USER='$APP_USER' DATA_DIR='$DATA_DIR' bash -s" <<'REMOTE'
set -euo pipefail

cat > "/etc/systemd/system/${SERVICE}.service" <<UNIT
[Unit]
Description=Kapibara (Uzbekistan)
After=network.target

[Service]
Type=simple
# Not root. A flaw in a dependency then reaches the application's own files
# and nothing else on the machine.
User=${APP_USER}
Group=${APP_USER}
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
NoNewPrivileges=true
PrivateTmp=true
# The whole filesystem is read-only to this process except the two paths
# below. Both must exist before the unit starts, or systemd refuses to start
# it at all — they are created in the assembly step above.
ProtectSystem=strict
ProtectHome=true
# Uploads, which live outside the application tree precisely so that a deploy
# cannot replace them.
ReadWritePaths=${DATA_DIR}
# Next's image optimiser writes resized images here. Without it every <Image>
# fails at runtime with a read-only filesystem error, which looks nothing like
# a permissions problem in the logs.
ReadWritePaths=${REMOTE_DIR}/.next/standalone/.next/cache

[Install]
WantedBy=multi-user.target
UNIT

systemctl daemon-reload
systemctl enable "${SERVICE}" >/dev/null 2>&1 || true
systemctl restart "${SERVICE}"
sleep 3
systemctl is-active --quiet "${SERVICE}" && echo "${SERVICE} is running on 127.0.0.1:${APP_PORT}"
REMOTE

say "Checking the public address"
code=$(curl -s -o /tmp/kapibara-uz-health.json -w '%{http_code}' --max-time 20 "$SITE_URL/api/health" || true)
echo "  $SITE_URL/api/health -> HTTP ${code:-no answer}"
[ -s /tmp/kapibara-uz-health.json ] && cat /tmp/kapibara-uz-health.json && echo

say "Done."
