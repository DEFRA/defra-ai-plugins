#!/usr/bin/env bash
# Provider script for promptfoo: runs a prompt through Claude Code CLI
# against a clean copy of the eval fixture, captures the produced review.
#
# Usage: ./run-claude.sh "<prompt>"
# Returns: combined plain-text output for promptfoo assertions
#
# Prerequisites:
#   - Claude Code CLI installed (`npm install -g @anthropic-ai/claude-code`)
#   - ANTHROPIC_API_KEY set in the environment
#   - The code-reviewer plugin installed:
#       claude plugin marketplace add DEFRA/defra-ai-plugins
#       claude plugin install code-reviewer@defra-ai-plugins
#
# Pin the model to keep results comparable across runs.
# Override with CLAUDE_MODEL=<id> for local experimentation.

set -euo pipefail

PROMPT="$1"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PLUGIN_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
FIXTURE_SOURCE="$PLUGIN_DIR/eval-fixture"

CLAUDE_MODEL="${CLAUDE_MODEL:-claude-sonnet-4-6}"

WORK_DIR=$(mktemp -d)
SNAP_BEFORE=$(mktemp)
trap 'rm -rf "$WORK_DIR" "$SNAP_BEFORE"' EXIT

cp -R "$FIXTURE_SOURCE"/ "$WORK_DIR"/
cd "$WORK_DIR"
./bin/seed-git.sh >/dev/null

# shellcheck source=./collect-and-report.sh
source "$SCRIPT_DIR/collect-and-report.sh"

snapshot_files "$SNAP_BEFORE"

AGENT_OUTPUT=$(claude -p "$PROMPT" \
  --model "$CLAUDE_MODEL" \
  --permission-mode bypassPermissions \
  --output-format text \
  2>&1) || true

report "CLAUDE" "$AGENT_OUTPUT" "$SNAP_BEFORE"
