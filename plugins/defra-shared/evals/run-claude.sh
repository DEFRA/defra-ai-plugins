#!/usr/bin/env bash
# Provider script for promptfoo: drives the defra-shared hook suite against
# the eval-fixture and emits a single combined report on stdout for the
# promptfoo assertions to match against.
#
# Usage: ./run-claude.sh "<prompt>"
#
# defra-shared ships **no agent** — there is nothing for Claude Code to
# drive in the usual sense. Instead, the "Claude" provider exercises the
# same hooks the host CLI would execute on tool use, with synthetic
# Claude-Code-shaped hook inputs. The output format mirrors the Copilot
# provider so promptfoo assertions are agnostic to which provider ran.
#
# Prerequisites:
#   - jq on PATH (for synthesising hook inputs)
#   - bash, git on PATH
#
# The PROMPT argument is the test name promptfoo passes through. We use it
# only as a label in the combined report; the test cases pick which hook
# runs via vars.case.

set -euo pipefail

PROMPT="${1:-defra-shared}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PLUGIN_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
FIXTURE_DIR="$PLUGIN_DIR/eval-fixture"

# shellcheck source=./collect-and-report.sh
source "$SCRIPT_DIR/collect-and-report.sh"

report "CLAUDE" "$PROMPT" "$FIXTURE_DIR"
