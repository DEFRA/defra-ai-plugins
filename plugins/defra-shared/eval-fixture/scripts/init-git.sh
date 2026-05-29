#!/usr/bin/env bash
# Stage a copy of the eval-fixture in a fresh tmp directory and make it a git
# repo with HEAD on `main`. Echoes the absolute path of the staging dir on
# stdout so callers can `cd` into it (or set CLAUDE_PROJECT_DIR to it).
#
# Why a tmp dir rather than `git init` inside eval-fixture/: the fixture lives
# inside the defra-ai-plugins git repo. A nested `.git` confuses the parent
# repo's tooling. Staging gives us an independent working tree.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
FIXTURE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

STAGE=$(mktemp -d -t defra-shared-fixture-XXXXXX)
cp -R "$FIXTURE_DIR"/. "$STAGE"/
# Drop any prior staging artefacts (defensive — mktemp dirs are empty).
rm -rf "$STAGE/.git"

cd "$STAGE"
git init -q -b main
git config user.email "eval-fixture@defra-ai-plugins.local"
git config user.name  "Defra eval fixture"
git add .
git commit -q -m "chore: bootstrap defra-shared eval-fixture"

echo "$STAGE"
