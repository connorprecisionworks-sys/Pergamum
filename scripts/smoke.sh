#!/usr/bin/env bash
# Smoke test: hit key routes and confirm all return HTTP 200.
# Usage: bash scripts/smoke.sh http://localhost:3000
set -e

URL="${1:-http://localhost:3000}"
PATHS=("/" "/prompts" "/tools" "/robots.txt" "/sitemap.xml")
FAILED=0

echo "Smoke testing ${URL}"
echo "---"

for path in "${PATHS[@]}"; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${URL}${path}")
  if [ "$STATUS" = "200" ]; then
    echo "  ✓  ${path}  (${STATUS})"
  else
    echo "  ✗  ${path}  (${STATUS})"
    FAILED=$((FAILED + 1))
  fi
done

echo "---"
if [ "$FAILED" -gt 0 ]; then
  echo "${FAILED} route(s) failed."
  exit 1
else
  echo "All routes OK."
fi
