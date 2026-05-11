#!/usr/bin/env bash
# Provider script for promptfoo: runs a prompt through Claude Code CLI
# against a clean copy of the eval fixture, captures output + file diffs.
#
# Usage: ./run-claude.sh "<prompt>"
# Returns: combined plain-text output for promptfoo assertions
#
# Prerequisites:
#   - Claude Code CLI installed (`npm install -g @anthropic-ai/claude-code`)
#   - ANTHROPIC_API_KEY set in the environment (or another supported auth method)
#   - The frontend-developer plugin installed:
#       claude plugin marketplace add DEFRA/defra-ai-plugins
#       claude plugin install frontend-developer@defra-ai-plugins
#   - Eval-fixture dependencies installed (`make frontend-fixture-install`)
#
# Pin the model to keep results comparable across runs.
# Override with CLAUDE_MODEL=<id> for local experimentation.
#
# For iterating on plugin files without `claude plugin install` each time:
#   export CLAUDE_PLUGIN_DIR=/abs/path/to/plugins/frontend-developer
# When set, this script passes `--plugin-dir $CLAUDE_PLUGIN_DIR` to claude,
# which loads the plugin from the local checkout for this session only and
# overrides any installed copy. Leave the env var unset for CI / baseline
# runs against the published / installed plugin.

set -euo pipefail

PROMPT="$1"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PLUGIN_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
FIXTURE_SOURCE="$PLUGIN_DIR/eval-fixture"

CLAUDE_MODEL="${CLAUDE_MODEL:-claude-sonnet-4-6}"

CLAUDE_EXTRA_ARGS=()
if [[ -n "${CLAUDE_PLUGIN_DIR:-}" ]]; then
  CLAUDE_EXTRA_ARGS+=(--plugin-dir "$CLAUDE_PLUGIN_DIR")
fi

# Create an isolated working copy
WORK_DIR=$(mktemp -d)
SNAP_BEFORE=$(mktemp)
trap 'rm -rf "$WORK_DIR" "$SNAP_BEFORE"' EXIT

cp -R "$FIXTURE_SOURCE"/ "$WORK_DIR"/
cd "$WORK_DIR"

# shellcheck source=./collect-and-report.sh
source "$SCRIPT_DIR/collect-and-report.sh"

snapshot_files "$SNAP_BEFORE"

# Run Claude Code in non-interactive mode.
#   -p : print mode (single-shot, prints final response and exits)
#   --permission-mode bypassPermissions : allow file edits without prompting
#   --model : pin the model so runs are comparable
# The frontend-developer skill is loaded automatically because this directory
# is inside Claude Code's plugin search path once the plugin is installed.
AGENT_OUTPUT=$(claude -p "$PROMPT" \
  --model "$CLAUDE_MODEL" \
  --permission-mode bypassPermissions \
  --output-format text \
  ${CLAUDE_EXTRA_ARGS[@]+"${CLAUDE_EXTRA_ARGS[@]}"} \
  2>&1) || true

report "CLAUDE" "$AGENT_OUTPUT" "$SNAP_BEFORE"
