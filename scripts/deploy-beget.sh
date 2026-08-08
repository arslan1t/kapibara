#!/usr/bin/env bash
#
# Deploys Капибара to Beget shared hosting.
#
#   ./scripts/deploy-beget.sh
#
# Everything is built ON the server. That is deliberate: Prisma and sharp both
# ship native binaries, and building on a Mac then copying the result produces a
# bundle that cannot run on Linux. Building here also means the server's own
# Node version is the one the artifact is compiled against.
#
# The script is safe to re-run. It does not touch the database beyond applying
# migrations, and `prisma migrate deploy` only ever applies what is pending.
#
# ── What must exist first ────────────────────────────────────────────────────
#
#   1. SSH access as $BEGET_USER. Either an SSH key added in
#      cp.beget.com → "SSH-доступ", or an agent holding the account password.
#   2. $REMOTE_DIR/.env on the server, populated from .env.example.
#
#      Create it once by hand, or pass a local file explicitly:
#
#          ENV_FILE=~/kapibara-production.env ./scripts/deploy-beget.sh
#
#      Opt-in rather than automatic, and never a path inside the repository:
#      the file holds the database password and the Supabase service-role key,
#      so uploading it should be a decision, not a side effect of deploying.
#      Without ENV_FILE the script leaves whatever is already on the server
#      alone, which is what you want on every deploy after the first.
#   3. Node.js enabled for the account in the Beget panel.
#
set -euo pipefail

BEGET_USER="${BEGET_USER:-sshipuf9}"
BEGET_HOST="${BEGET_HOST:-sshipuf9.beget.tech}"
SSH_KEY="${SSH_KEY:-$HOME/.ssh/kapibara_beget}"
REMOTE_DIR="${REMOTE_DIR:-/home/$BEGET_USER/kapibara}"
BRANCH="${BRANCH:-main}"
REPO="${REPO:-https://github.com/arslan1t/kapibara.git}"
APP_PORT="${APP_PORT:-3000}"

ssh_opts=(-o StrictHostKeyChecking=accept-new -o ConnectTimeout=20)
[ -f "$SSH_KEY" ] && ssh_opts+=(-i "$SSH_KEY")

say() { printf '\n\033[1m▸ %s\033[0m\n' "$1"; }

say "Checking SSH access to $BEGET_USER@$BEGET_HOST"
if ! ssh "${ssh_opts[@]}" -o BatchMode=yes "$BEGET_USER@$BEGET_HOST" true 2>/dev/null; then
  cat >&2 <<MSG

Cannot log in to $BEGET_USER@$BEGET_HOST without a password.

Add this machine's public key in cp.beget.com → "SSH-доступ" → "Добавить ключ":

$(cat "${SSH_KEY}.pub" 2>/dev/null || echo "  (no key at ${SSH_KEY}.pub — run: ssh-keygen -t ed25519 -f $SSH_KEY -N '')")

Then run this script again.
MSG
  exit 1
fi

say "Checking the server has a usable Node.js"
ssh "${ssh_opts[@]}" "$BEGET_USER@$BEGET_HOST" 'bash -s' <<'REMOTE'
set -euo pipefail
if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is not on PATH for this account." >&2
  echo "Enable it in cp.beget.com → 'Сайты' → your site → Node.js, then re-run." >&2
  exit 1
fi
node -v
major=$(node -v | sed 's/^v\([0-9]*\).*/\1/')
if [ "$major" -lt 20 ]; then
  echo "Node $major is too old; the application needs >= 20.9." >&2
  exit 1
fi
REMOTE

say "Fetching source on the server"
ssh "${ssh_opts[@]}" "$BEGET_USER@$BEGET_HOST" \
  "REMOTE_DIR='$REMOTE_DIR' REPO='$REPO' BRANCH='$BRANCH' bash -s" <<'REMOTE'
set -euo pipefail
if [ -d "$REMOTE_DIR/.git" ]; then
  cd "$REMOTE_DIR"
  git fetch --depth 1 origin "$BRANCH"
  git reset --hard "origin/$BRANCH"
else
  git clone --depth 1 --branch "$BRANCH" "$REPO" "$REMOTE_DIR"
  cd "$REMOTE_DIR"
fi
git --no-pager log --oneline -1
REMOTE

if [ -n "${ENV_FILE:-}" ]; then
  say "Uploading $ENV_FILE to $REMOTE_DIR/.env"
  [ -f "$ENV_FILE" ] || { echo "No such file: $ENV_FILE" >&2; exit 1; }
  # Refuse a path inside the repository: that is how a secret ends up committed.
  case "$(cd "$(dirname "$ENV_FILE")" && pwd)" in
    "$(git rev-parse --show-toplevel 2>/dev/null)"*)
      echo "Refusing to upload an env file from inside the repository." >&2
      echo "Move it somewhere outside the working tree first." >&2
      exit 1 ;;
  esac
  scp "${ssh_opts[@]}" "$ENV_FILE" "$BEGET_USER@$BEGET_HOST:$REMOTE_DIR/.env"
  ssh "${ssh_opts[@]}" "$BEGET_USER@$BEGET_HOST" "chmod 600 '$REMOTE_DIR/.env'"
fi

say "Verifying .env exists on the server"
ssh "${ssh_opts[@]}" "$BEGET_USER@$BEGET_HOST" "REMOTE_DIR='$REMOTE_DIR' bash -s" <<'REMOTE'
set -euo pipefail
if [ ! -f "$REMOTE_DIR/.env" ]; then
  echo "Missing $REMOTE_DIR/.env" >&2
  echo "Create it from .env.example and fill in real values. It is intentionally" >&2
  echo "not uploaded by the deploy script." >&2
  exit 1
fi
chmod 600 "$REMOTE_DIR/.env"
# Report which required keys are absent, by name only — never a value.
missing=""
for key in DATABASE_URL DIRECT_URL AUTH_SECRET NEXT_PUBLIC_SITE_URL \
           STORAGE_DRIVER SUPABASE_URL SUPABASE_SERVICE_ROLE_KEY \
           SUPABASE_PRIVATE_BUCKET SUPABASE_PUBLIC_BUCKET; do
  grep -qE "^${key}=.+" "$REMOTE_DIR/.env" || missing="$missing $key"
done
if [ -n "$missing" ]; then
  echo "These required variables are empty or absent in .env:$missing" >&2
  exit 1
fi
echo "all required variables present"
REMOTE

say "Installing dependencies and building (this generates the Linux Prisma engine)"
ssh "${ssh_opts[@]}" "$BEGET_USER@$BEGET_HOST" "REMOTE_DIR='$REMOTE_DIR' bash -s" <<'REMOTE'
set -euo pipefail
cd "$REMOTE_DIR"
npm ci --omit=dev --ignore-scripts
# postinstall was skipped by --ignore-scripts; run the parts we actually want.
npx prisma generate
# The build needs devDependencies (next, typescript, tailwind).
npm ci
npm run build
REMOTE

say "Applying database migrations"
ssh "${ssh_opts[@]}" "$BEGET_USER@$BEGET_HOST" "REMOTE_DIR='$REMOTE_DIR' bash -s" <<'REMOTE'
set -euo pipefail
cd "$REMOTE_DIR"
set -a; . ./.env; set +a
npx prisma migrate deploy
REMOTE

say "Assembling the standalone runtime"
ssh "${ssh_opts[@]}" "$BEGET_USER@$BEGET_HOST" "REMOTE_DIR='$REMOTE_DIR' bash -s" <<'REMOTE'
set -euo pipefail
cd "$REMOTE_DIR"
# `output: "standalone"` emits a minimal server, but Next deliberately leaves
# static assets and /public for the deployer to place.
cp -r .next/static .next/standalone/.next/static
[ -d public ] && cp -r public .next/standalone/public
cp .env .next/standalone/.env
chmod 600 .next/standalone/.env
echo "standalone ready: $(du -sh .next/standalone | cut -f1)"
REMOTE

say "Restarting the application"
ssh "${ssh_opts[@]}" "$BEGET_USER@$BEGET_HOST" \
  "REMOTE_DIR='$REMOTE_DIR' APP_PORT='$APP_PORT' bash -s" <<'REMOTE'
set -euo pipefail
cd "$REMOTE_DIR"

# Beget shared hosting has no systemd for user accounts. A pid file plus a cron
# watchdog is what actually survives here; if this account has a Node.js app
# configured in the panel, prefer restarting it there instead.
if [ -f app.pid ] && kill -0 "$(cat app.pid)" 2>/dev/null; then
  kill "$(cat app.pid)"
  sleep 2
fi

set -a; . ./.env; set +a
export NODE_ENV=production PORT="$APP_PORT" HOSTNAME=127.0.0.1
nohup node .next/standalone/server.js > app.log 2>&1 &
echo $! > app.pid
sleep 5

if ! kill -0 "$(cat app.pid)" 2>/dev/null; then
  echo "Application exited immediately. Last lines of app.log:" >&2
  tail -30 app.log >&2
  exit 1
fi
echo "running as pid $(cat app.pid) on port $APP_PORT"
REMOTE

say "Checking health through the running process"
ssh "${ssh_opts[@]}" "$BEGET_USER@$BEGET_HOST" \
  "curl -s -m 20 http://127.0.0.1:$APP_PORT/api/health" | head -c 600
echo

say "Done. Verify the public address:  curl -I https://capibara.su"
