#!/usr/bin/env bash
# Provider script for promptfoo: drives the defra-shared hook suite against
# the eval-fixture and emits a single combined report on stdout for the
# promptfoo assertions to match against.
#
# Usage: ./run-copilot.sh "<prompt>"
#
# defra-shared ships **no agent** — there is nothing for Copilot CLI to
# drive in the usual sense. Instead, the "Copilot" provider exercises the
# same hooks the host CLI would execute on tool use, with synthetic
# Copilot-shaped hook inputs. The output format mirrors the Claude Code
# provider so promptfoo assertions are agnostic to which provider ran.
#
# Prerequisites:
#   - jq on PATH (for synthesising hook inputs)
#   - bash, git on PATH

set -euo pipefail

PROMPT="${1:-defra-shared}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PLUGIN_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
FIXTURE_DIR="$PLUGIN_DIR/eval-fixture"

# shellcheck source=./collect-and-report.sh
source "$SCRIPT_DIR/collect-and-report.sh"

report "COPILOT" "$PROMPT" "$FIXTURE_DIR"
