#!/usr/bin/env bash
# Provider script for promptfoo: runs a prompt through Copilot CLI
# against a clean copy of the eval fixture, captures the produced review.
#
# Usage: ./run-copilot.sh "<prompt>"
# Returns: combined plain-text output for promptfoo assertions
#
# Prerequisites:
#   - Copilot CLI installed (`npm install -g @github/copilot`)
#   - The code-reviewer plugin installed:
#       copilot plugin marketplace add DEFRA/defra-ai-plugins
#       copilot plugin install code-reviewer@defra-ai-plugins
#
# Pin the model to keep results comparable across runs.
# Override with COPILOT_MODEL=<id> for local experimentation.

set -euo pipefail

PROMPT="$1"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PLUGIN_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
FIXTURE_SOURCE="$PLUGIN_DIR/eval-fixture"

COPILOT_MODEL="${COPILOT_MODEL:-gpt-5-mini}"

# Create an isolated working copy with a real git history so the agent
# can run `git diff origin/main...HEAD`.
WORK_DIR=$(mktemp -d)
SNAP_BEFORE=$(mktemp)
trap 'rm -rf "$WORK_DIR" "$SNAP_BEFORE"' EXIT

cp -R "$FIXTURE_SOURCE"/ "$WORK_DIR"/
cd "$WORK_DIR"
./bin/seed-git.sh >/dev/null

# shellcheck source=./collect-and-report.sh
source "$SCRIPT_DIR/collect-and-report.sh"

snapshot_files "$SNAP_BEFORE"

AGENT_OUTPUT=$(copilot -p "$PROMPT" \
  --agent code-reviewer:code-reviewer \
  --model "$COPILOT_MODEL" \
  --yolo \
  --output-format text \
  2>&1) || true

report "COPILOT" "$AGENT_OUTPUT" "$SNAP_BEFORE"
