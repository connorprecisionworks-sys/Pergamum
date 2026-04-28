#!/usr/bin/env bash
# Pre-commit hook: runs TypeScript type-check before every commit.
# Skip with: git commit --no-verify
set -e

echo "Running type-check…"
pnpm type-check

echo "Type-check passed."
