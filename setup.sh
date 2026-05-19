#!/usr/bin/env bash
# One-shot setup script for the Smart Parking system.
# Run from the repo root: bash setup.sh
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ── Colours ──────────────────────────────────────────────────────────────────
GREEN="\033[0;32m"; YELLOW="\033[1;33m"; NC="\033[0m"
info() { echo -e "${GREEN}[setup]${NC} $*"; }
warn() { echo -e "${YELLOW}[warn]${NC}  $*"; }

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Smart Parking — Demo Setup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# ── 1. Detect this machine's LAN IP ─────────────────────────────────────────
if command -v ipconfig &>/dev/null; then
    SERVER_IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "")
else
    SERVER_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || echo "")
fi
[[ -z "$SERVER_IP" ]] && { warn "Could not detect LAN IP — set BACKEND_URL manually in rpi/.env"; SERVER_IP="<flask-server-ip>"; }
info "Server IP: $SERVER_IP"

# ── 2. Backend .env — create & generate JWT secret ───────────────────────────
BACKEND_ENV="$REPO_ROOT/backend/.env"
[[ ! -f "$BACKEND_ENV" ]] && cp "$REPO_ROOT/backend/.env.example" "$BACKEND_ENV" && info "Created backend/.env from template"

if grep -qE "^JWT_SECRET_KEY=(your_jwt_secret_here|local-dev-secret)?$" "$BACKEND_ENV"; then
    NEW_SECRET=$(python3 -c "import secrets; print(secrets.token_hex(32))")
    sed -i.bak "s|^JWT_SECRET_KEY=.*|JWT_SECRET_KEY=${NEW_SECRET}|" "$BACKEND_ENV" && rm -f "${BACKEND_ENV}.bak"
    info "Generated new JWT_SECRET_KEY"
else
    info "JWT_SECRET_KEY already set — skipping"
fi

if grep -qE "^MQTT_BROKER=$" "$BACKEND_ENV"; then
    sed -i.bak "s|^MQTT_BROKER=$|MQTT_BROKER=localhost|" "$BACKEND_ENV" && rm -f "${BACKEND_ENV}.bak"
    info "Set MQTT_BROKER=localhost in backend/.env"
fi

# ── 3. RPi .env — BACKEND_URL and MQTT_BROKER ────────────────────────────────
RPI_ENV="$REPO_ROOT/rpi/.env"
[[ ! -f "$RPI_ENV" ]] && cp "$REPO_ROOT/rpi/.env.example" "$RPI_ENV" && info "Created rpi/.env from template"

sed -i.bak "s|^BACKEND_URL=.*|BACKEND_URL=http://${SERVER_IP}:5001|" "$RPI_ENV" && rm -f "${RPI_ENV}.bak"
info "Set BACKEND_URL=http://${SERVER_IP}:5001 in rpi/.env"

if grep -qE "^MQTT_BROKER=(<|$)" "$RPI_ENV"; then
    sed -i.bak "s|^MQTT_BROKER=.*|MQTT_BROKER=${SERVER_IP}|" "$RPI_ENV" && rm -f "${RPI_ENV}.bak"
    info "Set MQTT_BROKER=${SERVER_IP} in rpi/.env"
fi

# ── 4. Backend Python venv + dependencies ────────────────────────────────────
VENV="$REPO_ROOT/backend/.venv"
if [[ ! -d "$VENV" ]]; then
    info "Creating Python virtual environment in backend/.venv ..."
    python3 -m venv "$VENV"
fi

info "Installing backend dependencies ..."
"$VENV/bin/pip" install --quiet --upgrade pip
"$VENV/bin/pip" install --quiet -r "$REPO_ROOT/backend/requirements.txt"

# ── 5. Seed Firestore ─────────────────────────────────────────────────────────
CREDS_FILE="$REPO_ROOT/backend/firebase_service_account.json"
if [[ ! -f "$CREDS_FILE" ]]; then
    warn "backend/firebase_service_account.json not found — skipping Firestore seed."
    warn "  1. Firebase Console → Project Settings → Service Accounts → Generate new private key"
    warn "  2. Save as: backend/firebase_service_account.json"
    warn "  3. Then run: cd backend && .venv/bin/python seed.py"
else
    info "Seeding Firestore with 3 parking slots ..."
    (cd "$REPO_ROOT/backend" && "$VENV/bin/python" seed.py)
fi

# ── 6. Summary ────────────────────────────────────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  All done. Next steps:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
info "Start backend:   cd backend && .venv/bin/python app.py"
info "Start frontend:  cd frontend && npm run dev"
info "Start RPi:       scp rpi/.env pi@<rpi-ip>:~/parking/ && ssh pi@<rpi-ip> 'cd ~/parking && python main.py'"
echo ""
