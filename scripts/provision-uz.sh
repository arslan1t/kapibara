#!/usr/bin/env bash
#
# Prepares a bare VPS to host the Uzbek Капибара — capibara.uz.
#
#   UZ_HOST=1.2.3.4 ./scripts/provision-uz.sh
#
# Run once on a fresh server. Idempotent: running it again changes nothing it
# has already done, and in particular never regenerates a password or a secret
# that is already in place.
#
# Tested against the shapes Eskiz and PS Cloud offer: Ubuntu 22.04/24.04 and
# AlmaLinux 9, KVM, root access.
#
# ── What it installs ─────────────────────────────────────────────────────────
#
#   Node 22, PostgreSQL, nginx, certbot, a swap file when memory is tight,
#   a system user to run the application, a data directory that survives
#   deploys, and a firewall that leaves only SSH, HTTP and HTTPS open.
#
# ── Secrets ──────────────────────────────────────────────────────────────────
#
# The database password and AUTH_SECRET are generated ON THE SERVER and written
# straight into its .env. They are never printed, never travel over this SSH
# session as plaintext you could scroll back to, and never reach the machine
# you are running this from. If you need the database password later, read it
# out of /srv/capibara-uz/.env as root.
#
# ── What it deliberately does not do ─────────────────────────────────────────
#
# Deploy. That is scripts/deploy-uz.sh, which can then be re-run as often as
# you like without touching any of the above.
#
set -euo pipefail

UZ_USER="${UZ_USER:-root}"
UZ_HOST="${UZ_HOST:-}"
SSH_KEY="${SSH_KEY:-$HOME/.ssh/kapibara_uz}"

APP_USER="${APP_USER:-kapibara}"
APP_DIR="${APP_DIR:-/srv/capibara-uz}"
DATA_DIR="${DATA_DIR:-/srv/capibara-uz-data}"
APP_PORT="${APP_PORT:-3100}"
DOMAIN="${DOMAIN:-capibara.uz}"
PG_DATABASE="${PG_DATABASE:-capibara}"
PG_USER="${PG_USER:-capibara}"
NODE_MAJOR="${NODE_MAJOR:-22}"

say() { printf '\n\033[1m▸ %s\033[0m\n' "$1"; }

if [ -z "$UZ_HOST" ]; then
  echo "UZ_HOST is not set. Example: UZ_HOST=1.2.3.4 ./scripts/provision-uz.sh" >&2
  exit 1
fi

ssh_opts=(-o StrictHostKeyChecking=accept-new)
[ -f "$SSH_KEY" ] && ssh_opts+=(-i "$SSH_KEY")

if ! ssh "${ssh_opts[@]}" -o BatchMode=yes "$UZ_USER@$UZ_HOST" true 2>/dev/null; then
  echo "Cannot reach $UZ_USER@$UZ_HOST over SSH with $SSH_KEY." >&2
  echo "Add your public key to the server, or pass SSH_KEY=/path/to/key." >&2
  exit 1
fi

say "Provisioning $UZ_HOST"

ssh "${ssh_opts[@]}" "$UZ_USER@$UZ_HOST" \
  "APP_USER='$APP_USER' APP_DIR='$APP_DIR' DATA_DIR='$DATA_DIR' \
   APP_PORT='$APP_PORT' DOMAIN='$DOMAIN' PG_DATABASE='$PG_DATABASE' \
   PG_USER='$PG_USER' NODE_MAJOR='$NODE_MAJOR' bash -s" <<'REMOTE'
set -euo pipefail

# ── Distribution ─────────────────────────────────────────────────────────────
if command -v apt-get >/dev/null 2>&1; then
  FAMILY=debian
elif command -v dnf >/dev/null 2>&1; then
  FAMILY=rhel
else
  echo "Unsupported distribution: no apt-get and no dnf." >&2
  exit 1
fi
echo "distribution family: $FAMILY"

# ── Swap ─────────────────────────────────────────────────────────────────────
#
# The Next build is the memory peak of the whole system: it runs with a 4 GB
# heap ceiling and legitimately uses a large part of it. A 1 or 2 GB VPS has
# no chance without swap, and the failure mode without it is the OOM killer
# taking out PostgreSQL mid-build, which looks like a database fault rather
# than a memory one.
total_mb=$(awk '/MemTotal/ {printf "%d", $2/1024}' /proc/meminfo)
echo "memory: ${total_mb} MB"
if [ "$total_mb" -lt 4096 ] && [ ! -f /swapfile ]; then
  echo "creating a 4 GB swap file"
  fallocate -l 4G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=4096
  chmod 600 /swapfile
  mkswap /swapfile >/dev/null
  swapon /swapfile
  grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
  # Swap is an insurance policy against the build, not somewhere to live.
  sysctl -w vm.swappiness=10 >/dev/null
  grep -q '^vm.swappiness' /etc/sysctl.conf || echo 'vm.swappiness=10' >> /etc/sysctl.conf
else
  echo "swap: nothing to do"
fi

# ── Packages ─────────────────────────────────────────────────────────────────
if [ "$FAMILY" = debian ]; then
  export DEBIAN_FRONTEND=noninteractive
  apt-get update -qq
  apt-get install -y -qq curl git ca-certificates gnupg ufw nginx \
    postgresql postgresql-contrib certbot python3-certbot-nginx >/dev/null
else
  dnf install -y -q curl git nginx postgresql-server postgresql-contrib \
    certbot python3-certbot-nginx firewalld >/dev/null
  [ -d /var/lib/pgsql/data/base ] || postgresql-setup --initdb >/dev/null
  systemctl enable --now postgresql >/dev/null
  systemctl enable --now firewalld >/dev/null
fi

# ── Node ─────────────────────────────────────────────────────────────────────
#
# NodeSource rather than the distribution package: Debian and AlmaLinux both
# ship a Node too old for Next 15, and finding that out during a build is a
# worse failure than installing a known-good one now.
if command -v node >/dev/null 2>&1 && \
   [ "$(node -v | cut -d. -f1 | tr -d v)" -ge 20 ]; then
  echo "node $(node -v) already installed"
else
  if [ "$FAMILY" = debian ]; then
    curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | bash - >/dev/null
    apt-get install -y -qq nodejs >/dev/null
  else
    curl -fsSL "https://rpm.nodesource.com/setup_${NODE_MAJOR}.x" | bash - >/dev/null
    dnf install -y -q nodejs >/dev/null
  fi
  echo "installed node $(node -v)"
fi

systemctl enable --now postgresql >/dev/null 2>&1 || true
systemctl enable --now nginx >/dev/null 2>&1 || true

# ── Application user and directories ─────────────────────────────────────────
#
# The application runs as its own user with no login shell: a flaw in a
# dependency then reaches the application's files and nothing else on the box.
id -u "$APP_USER" >/dev/null 2>&1 || useradd --system --create-home \
  --home-dir "/home/$APP_USER" --shell /usr/sbin/nologin "$APP_USER" 2>/dev/null || \
  useradd --system --create-home --home-dir "/home/$APP_USER" \
  --shell /sbin/nologin "$APP_USER"

mkdir -p "$APP_DIR" "$DATA_DIR/uploads" "$DATA_DIR/public"
chown -R "$APP_USER:$APP_USER" "$APP_DIR" "$DATA_DIR"
# Uploaded photographs of children. Readable by the application and root, and
# by nobody else who happens to have an account on this machine.
chmod 750 "$DATA_DIR" "$DATA_DIR/uploads"
chmod 755 "$DATA_DIR/public"
echo "app user and directories ready"

# ── PostgreSQL ───────────────────────────────────────────────────────────────
#
# Local only. The database listens on the loopback interface and the firewall
# below never opens 5432, so the only way in is from this machine.
PGBIN=$(command -v psql)
run_sql() { su - postgres -c "psql -tAc \"$1\"" 2>/dev/null; }

if [ "$(run_sql "SELECT 1 FROM pg_roles WHERE rolname='$PG_USER'")" = "1" ]; then
  echo "postgres role $PG_USER already exists; leaving its password alone"
  PG_PASSWORD=""
else
  # Generated here and used below. Never echoed.
  PG_PASSWORD=$(head -c 32 /dev/urandom | base64 | tr -d '/+=' | head -c 32)
  su - postgres -c "psql -c \"CREATE ROLE \\\"$PG_USER\\\" LOGIN PASSWORD '$PG_PASSWORD'\"" >/dev/null
  echo "created postgres role $PG_USER"
fi

if [ "$(run_sql "SELECT 1 FROM pg_database WHERE datname='$PG_DATABASE'")" != "1" ]; then
  su - postgres -c "createdb -O \"$PG_USER\" \"$PG_DATABASE\"" >/dev/null
  echo "created database $PG_DATABASE"
else
  echo "database $PG_DATABASE already exists"
fi
[ -n "$PGBIN" ] && echo "postgres: $($PGBIN --version | head -1)"

# ── .env ─────────────────────────────────────────────────────────────────────
#
# Written here so the generated secrets never leave the machine. Existing keys
# are kept: re-running this must not rotate a password the application is
# already using, nor overwrite the Payme and Click keys you added by hand.
touch "$APP_DIR/.env"
chmod 600 "$APP_DIR/.env"
chown "$APP_USER:$APP_USER" "$APP_DIR/.env"

set_key() {
  local key="$1" value="$2"
  if grep -qE "^${key}=.+" "$APP_DIR/.env"; then
    return 0
  fi
  # Remove an empty placeholder, then append.
  sed -i "/^${key}=\s*$/d" "$APP_DIR/.env"
  printf '%s=%s\n' "$key" "$value" >> "$APP_DIR/.env"
}

if [ -n "$PG_PASSWORD" ]; then
  url="postgresql://$PG_USER:$PG_PASSWORD@127.0.0.1:5432/$PG_DATABASE"
  set_key DATABASE_URL "\"$url\""
  set_key DIRECT_URL "\"$url\""
fi

grep -qE '^AUTH_SECRET=.+' "$APP_DIR/.env" || \
  printf 'AUTH_SECRET="%s"\n' "$(head -c 32 /dev/urandom | base64)" >> "$APP_DIR/.env"

set_key NEXT_PUBLIC_MARKET '"UZ"'
set_key NEXT_PUBLIC_SITE_URL "\"https://$DOMAIN\""
set_key NEXT_PUBLIC_SITE_URL_RU '"https://capibara.su"'
set_key NEXT_PUBLIC_SITE_URL_UZ "\"https://$DOMAIN\""
set_key AUTH_URL "\"https://$DOMAIN\""
# Local disk, outside the application tree so the standalone build cannot take
# it with it on the next deploy — and inside Uzbekistan, which is the point.
set_key STORAGE_DRIVER '"local"'
set_key UPLOAD_DIR "\"$DATA_DIR/uploads\""
set_key PRODUCT_IMAGE_DIR "\"$DATA_DIR/public\""
set_key LOG_LEVEL '"info"'
echo ".env prepared (existing values untouched)"

# ── Firewall ─────────────────────────────────────────────────────────────────
if command -v ufw >/dev/null 2>&1; then
  ufw allow OpenSSH >/dev/null 2>&1 || ufw allow 22/tcp >/dev/null
  ufw allow 80/tcp >/dev/null
  ufw allow 443/tcp >/dev/null
  ufw --force enable >/dev/null
  echo "ufw: 22, 80, 443 open; everything else closed"
elif command -v firewall-cmd >/dev/null 2>&1; then
  firewall-cmd --permanent --add-service=ssh >/dev/null
  firewall-cmd --permanent --add-service=http >/dev/null
  firewall-cmd --permanent --add-service=https >/dev/null
  firewall-cmd --reload >/dev/null
  echo "firewalld: ssh, http, https open; everything else closed"
fi

# ── nginx ────────────────────────────────────────────────────────────────────
#
# Written only if absent, so a certificate certbot has already wired in is not
# clobbered by a later run of this script.
conf_dir=/etc/nginx/conf.d
[ -d /etc/nginx/sites-available ] && conf_dir=/etc/nginx/sites-available
conf="$conf_dir/capibara-uz.conf"

if [ ! -f "$conf" ]; then
  cat > "$conf" <<NGINX
server {
    listen 80;
    server_name ${DOMAIN} www.${DOMAIN};

    # Next streams responses; buffering them delays the first byte for no gain.
    proxy_buffering off;
    client_max_body_size 12m;

    location / {
        proxy_pass http://127.0.0.1:${APP_PORT};
        proxy_http_version 1.1;
        proxy_set_header Host              \$host;
        proxy_set_header X-Real-IP         \$remote_addr;
        proxy_set_header X-Forwarded-For   \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Upgrade           \$http_upgrade;
        proxy_set_header Connection        "upgrade";

        # Next builds the origin of a redirect from the address its own
        # process is bound to, not from the Host header, so every redirect
        # leaves the app pointing at http://localhost:${APP_PORT} — which, in
        # a browser, is the visitor's own machine. nginx rewrites those to a
        # bare path, which the browser resolves against the address it asked
        # for. Both spellings appear: the bound address and the name Next
        # prints for it.
        proxy_redirect http://localhost:${APP_PORT}/ /;
        proxy_redirect http://127.0.0.1:${APP_PORT}/ /;
    }
}
NGINX
  if [ -d /etc/nginx/sites-enabled ]; then
    ln -sf "$conf" /etc/nginx/sites-enabled/capibara-uz.conf
    rm -f /etc/nginx/sites-enabled/default
  fi
  nginx -t >/dev/null && systemctl reload nginx
  echo "nginx site written and reloaded"
else
  echo "nginx site already present; left alone"
fi

echo
echo "PROVISIONED."
REMOTE

say "Next"
cat <<NEXT
  1. Point DNS for $DOMAIN and www.$DOMAIN at $UZ_HOST, and wait for it to
     resolve. Certbot cannot issue a certificate before that.

  2. Issue the certificate:

         ssh $UZ_USER@$UZ_HOST \\
           "certbot --nginx -d $DOMAIN -d www.$DOMAIN --agree-tos -m you@example.com --redirect"

  3. Fill in the rest of $APP_DIR/.env on the server — the keys this script
     cannot know:

         PAYME_MERCHANT_ID, PAYME_KEY
         CLICK_SERVICE_ID, CLICK_MERCHANT_ID, CLICK_SECRET_KEY
         RESEND_API_KEY, MAIL_FROM
         NANO_BANANA_API_KEY

     Without them the shop still runs: payment falls back to agreement after
     confirmation, mail is refused rather than silently dropped, and the
     preview says illustrations are prepared by hand. Each says so on the page.

  4. Deploy:

         UZ_HOST=$UZ_HOST ./scripts/deploy-uz.sh
NEXT
