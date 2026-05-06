#!/usr/bin/env bash
# Provider script for promptfoo: runs a prompt through Copilot CLI
# against a clean copy of the eval fixture, captures output + file diffs.
#
# Usage: ./run-copilot.sh "<prompt>"
# Returns: combined plain-text output for promptfoo assertions
#
# Prerequisites:
#   - Copilot CLI installed (`npm install -g @github/copilot`)
#   - The frontend-developer plugin installed:
#       copilot plugin marketplace add DEFRA/defra-ai-plugins
#       copilot plugin install frontend-developer@defra-ai-plugins
#   - Eval-fixture dependencies installed (`make frontend-fixture-install`)
#
# Pin the model to keep results comparable across runs.
# Override with COPILOT_MODEL=<id> for local experimentation.

set -euo pipefail

PROMPT="$1"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PLUGIN_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
FIXTURE_SOURCE="$PLUGIN_DIR/eval-fixture"

COPILOT_MODEL="${COPILOT_MODEL:-gpt-5-mini}"

# Create an isolated working copy
WORK_DIR=$(mktemp -d)
SNAP_BEFORE=$(mktemp)
trap 'rm -rf "$WORK_DIR" "$SNAP_BEFORE"' EXIT

cp -R "$FIXTURE_SOURCE"/ "$WORK_DIR"/
cd "$WORK_DIR"

# Load snapshot/report helpers
# shellcheck source=./collect-and-report.sh
source "$SCRIPT_DIR/collect-and-report.sh"

# Snapshot file state before the agent runs
snapshot_files "$SNAP_BEFORE"

# Run Copilot CLI in non-interactive mode.
# `--agent <plugin>:<agent>` selects an agent from an installed plugin
# (here both names happen to match). `--yolo` skips approval prompts.
AGENT_OUTPUT=$(copilot -p "$PROMPT" \
  --agent frontend-developer:frontend-developer \
  --model "$COPILOT_MODEL" \
  --yolo \
  --output-format text \
  2>&1) || true

# Collect results and emit the combined report on stdout
report "COPILOT" "$AGENT_OUTPUT" "$SNAP_BEFORE"
