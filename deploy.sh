#!/usr/bin/env bash
#
# deploy.sh — Build and deploy the Property Insurance Calculator frontend
# to Cloudflare Pages (project: propcalc → https://propcalc-dy7.pages.dev/).
#
# This project uses a Cloudflare Pages "Direct Upload" project (NO Git
# integration), so a `git push` does NOT deploy anything. Deployment is
# manual: build locally, then upload dist/ with Wrangler. This script does
# both steps.
#
# Usage:
#   ./deploy.sh                 # build + deploy
#   ./deploy.sh --skip-build    # deploy the existing dist/ without rebuilding
#
# Auth: Wrangler needs credentials. Either run `npx wrangler login` once
# (interactive, cached), or export CLOUDFLARE_API_TOKEN before running.

set -euo pipefail

PROJECT_NAME="propcalc"
BUILD_DIR="dist"
SKIP_BUILD="false"

# --- parse args ---------------------------------------------------------
for arg in "$@"; do
  case "$arg" in
    --skip-build) SKIP_BUILD="true" ;;
    -h|--help)
      cat <<'EOF'
deploy.sh — Build and deploy the frontend to Cloudflare Pages (project: propcalc).

Usage:
  ./deploy.sh                 build + deploy
  ./deploy.sh --skip-build    deploy the existing dist/ without rebuilding
  ./deploy.sh --help          show this help

Auth: run `npx wrangler login` once, or export CLOUDFLARE_API_TOKEN.
See DEPLOYMENT.md for full details.
EOF
      exit 0
      ;;
    *)
      echo "Unknown argument: $arg" >&2
      echo "Usage: ./deploy.sh [--skip-build]" >&2
      exit 1
      ;;
  esac
done

# Run from the script's own directory so relative paths are stable.
cd "$(dirname "$0")"

# --- pre-flight: confirm the production API URL is active ---------------
# The API base URL is hardcoded in src/services/api.js (no .env). The build
# bakes it into the bundle, so guard against shipping the local dev URL.
if ! grep -qE "^const API_URL = 'https://propcalc\.zastrahovaite\.com/'" src/services/api.js; then
  echo "⚠️  WARNING: production API_URL is not the active line in src/services/api.js." >&2
  echo "    The deployed site may point at the wrong backend (e.g. localhost)." >&2
  read -r -p "    Continue anyway? [y/N] " reply
  [[ "$reply" =~ ^[Yy]$ ]] || { echo "Aborted."; exit 1; }
fi

# --- build --------------------------------------------------------------
if [[ "$SKIP_BUILD" == "true" ]]; then
  echo "⏭  Skipping build (--skip-build). Deploying existing $BUILD_DIR/."
  [[ -d "$BUILD_DIR" ]] || { echo "✘ $BUILD_DIR/ not found — run without --skip-build." >&2; exit 1; }
else
  echo "🏗  Building production bundle..."
  npm run build
fi

# --- deploy -------------------------------------------------------------
# Wrangler auto-detects local git metadata (branch, commit hash, message)
# and attaches it to the deployment — that's why deployments show the real
# commit message in the dashboard even without Git integration.
echo "🚀 Deploying $BUILD_DIR/ to Cloudflare Pages project '$PROJECT_NAME'..."
npx wrangler pages deploy "$BUILD_DIR" --project-name="$PROJECT_NAME"

echo "✅ Done. Live at https://propcalc-dy7.pages.dev/"
