#!/usr/bin/env bash
# Seed a fresh git history in the eval-fixture working copy so the agent
# can run `git diff origin/main...HEAD` against a real branch.
#
# Layout when this script completes:
#   main          — base state (this file + everything outside ./bin/patches/)
#   feature-x     — the branch the agent reviews (planted issues applied)
#   origin/main   — local alias pointing at main, so origin/main resolves
#
# Idempotent within a fresh temp dir; not intended to run in the source
# tree.

set -euo pipefail

cd "$(dirname "$0")/.."

# Write a .gitignore inside the working copy so the planted-patch material
# is excluded from both the base commit and the feature-branch diff.
# This lives only in the temp working copy — committing it to the source
# tree would also hide bin/patches/ from the outer defra-ai-plugins repo.
echo 'bin/patches/' > .gitignore

git init -q -b main
git config user.email 'eval@example.com'
git config user.name  'Eval Harness'

# Anything inside ./bin/patches/ is the *planted* feature-branch diff —
# .gitignore keeps it out of both the base commit and the feature-branch
# diff (otherwise the patch files themselves show up in the review).
git add .
git commit -q -m 'Initial base state'

# Wire origin/main → local main so the agent's `origin/main` reference
# resolves without a remote.
git remote add origin .
git fetch -q origin

git checkout -q -b feature-x

# Apply the planted feature-branch changes.
for patch in bin/patches/*.patch; do
  [ -f "$patch" ] || continue
  git apply --whitespace=nowarn "$patch"
done

# Also drop in any "new file" content the planted diff introduces.
if [ -d bin/patches/new-files ]; then
  cp -R bin/patches/new-files/. .
fi

git add -A
git commit -q -m 'feat: add registration POST endpoint'

# Refresh origin so origin/main matches main.
git fetch -q origin
