#!/bin/bash
set -euo pipefail

# Only run in remote Claude Code environments
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

echo "Setting up theluckystrike-website environment..."

# Verify Python 3 is available (used for local preview: python3 -m http.server 8000)
if ! command -v python3 &>/dev/null; then
  echo "WARNING: python3 not found. Local preview via 'python3 -m http.server' will not work."
else
  echo "✓ python3 $(python3 --version)"
fi

# Verify Node.js is available (used for Vercel serverless functions in api/)
if ! command -v node &>/dev/null; then
  echo "WARNING: node not found. Vercel serverless functions may not work."
else
  echo "✓ node $(node --version)"
fi

echo "Environment ready."
