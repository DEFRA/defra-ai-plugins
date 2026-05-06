# Walkthrough: the behavioural eval harness

**Date:** 2026-04-27
**Target:** the eval harness in `defra-ai-plugins` — `Makefile`, `plugins/frontend-developer/evals/`, `plugins/frontend-developer/eval-fixture/`, `.github/workflows/evals.yml`, `plugins/frontend-developer/evals/baseline/`.

## Overview

This repo publishes Copilot CLI plugins that encode Defra's coding standards.
The risk: a plugin can be syntactically valid (manifests parse, frontmatter is
well-formed) yet behaviourally broken — the agent might ignore the standards,
generate insecure templates, or accept non-compliant tech. Schema validation
can't catch that.

The eval harness fills the gap. It drives Copilot CLI in non-interactive mode
through a fixed set of realistic and adversarial prompts, lets the agent edit a
clean copy of a Hapi+govuk-frontend skeleton, then asserts on what it produced —
generated templates, route handlers, lint output, refusal behaviour. A
regression in any assertion fails the build. The harness is local-first (`make
evals`) but CI runs the same suite on every PR, installing the plugin from the
PR checkout so behavioural changes are gated before merge.

## Pipeline at a glance

```
                        ┌──────────────────────────┐
                        │   PR opened on plugins/  │
                        └────────────┬─────────────┘
                                     │
                                     ▼
                  ┌───────────────────────────────────────┐
                  │  .github/workflows/evals.yml          │
                  │  (job: evals — Ubuntu, Node lts)      │
                  └────────────────┬──────────────────────┘
                                   │
       ┌───────────────────────────┼───────────────────────────┐
       ▼                           ▼                           ▼
 actions/checkout          npm ci (root)               install eval-fixture deps
 (PR branch HEAD)         schema validators            plugins/frontend-developer/
                          ready                        eval-fixture/ → npm install
                                   │
                                   ▼
                  ┌───────────────────────────────────────┐
                  │  install Copilot CLI                  │
                  │  npm i -g @github/copilot             │
                  └────────────────┬──────────────────────┘
                                   ▼
                  ┌───────────────────────────────────────┐
                  │  COPILOT_HOME = $RUNNER_TEMP/         │
                  │                  copilot-ci           │
                  │  copilot plugin install \             │
                  │    ./plugins/frontend-developer       │
                  │  → cached under                       │
                  │    $COPILOT_HOME/installed-plugins/   │
                  │    _direct/<src-id>/                  │
                  └────────────────┬──────────────────────┘
                                   ▼
                  ┌───────────────────────────────────────┐
                  │  npx promptfoo eval --no-cache        │
                  │  --filter-providers                   │
                  │    copilot-cli-frontend-developer     │
                  │  (Claude provider in YAML but         │
                  │   filtered out — local-only demo)     │
                  └────────────────┬──────────────────────┘
                                   │
                                   │  for each of 7 fixtures
                                   ▼
   ┌───────────────────────────────────────────────────────────┐
   │  exec:./run-copilot.sh "<prompt>"                         │
   │  ───────────────────────────────────                      │
   │  WORK_DIR=$(mktemp -d)        ← fresh per fixture         │
   │  cp -R eval-fixture/ → WORK_DIR                           │
   │  snapshot_files (md5 of src/) ← BEFORE                    │
   │                                                           │
   │  copilot -p "$PROMPT" \                                   │
   │     --agent frontend-developer:frontend-developer \       │
   │     --model gpt-5-mini --yolo                             │
   │  → AGENT_OUTPUT (stdout+stderr, never aborts the run)     │
   │                                                           │
   │  report() emits one combined block:                       │
   │    === COPILOT OUTPUT ===                                 │
   │    === NJK TEMPLATES ===     (every src/views/**/*.njk)   │
   │    === JS ROUTES ===         (every src/routes/**/*.js)   │
   │    === FILES CHANGED ===     (md5 diff vs BEFORE)         │
   │    === LINT ===              (exit_code: N + output)      │
   │    === TESTS ===             (exit_code: N + output)      │
   └────────────────────────────┬──────────────────────────────┘
                                │ stdout
                                ▼
   ┌───────────────────────────────────────────────────────────┐
   │  promptfoo applies assertions to that block:              │
   │    contains / not-contains / icontains / regex            │
   │  Each assertion tagged with metric:                       │
   │    component_correctness / security / accessibility /     │
   │    lint_passes / refusal                                  │
   │  → results/run-<sha>/promptfoo-results.json               │
   └────────────────────────────┬──────────────────────────────┘
                                ▼
   ┌───────────────────────────────────────────────────────────┐
   │  check-regression.sh                                      │
   │  ───────────────────────                                  │
   │  match tests by vars.prompt against committed baseline    │
   │    (plugins/frontend-developer/evals/baseline/            │
   │       promptfoo-results.json)                             │
   │  pass = ALL providers that ran it succeeded               │
   │  exit non-zero if any baseline-passing test now fails     │
   │                                                           │
   │  → regression: job fails → PR cannot merge                │
   │  → clean    : job succeeds                                │
   └────────────────────────────┬──────────────────────────────┘
                                ▼
   ┌───────────────────────────────────────────────────────────┐
   │  summarise.sh → $GITHUB_STEP_SUMMARY                      │
   │  ───────────────────────────────────                      │
   │  • Suite pass: N/M                                        │
   │  • Per-fixture PASS/FAIL                                  │
   │  • Named scores per bucket                                │
   │  • Latency p50 / p95 / max                                │
   │  • Assertion-level failure counts by metric               │
   └────────────────────────────┬──────────────────────────────┘
                                ▼
                  ┌───────────────────────────────────────┐
                  │  upload-artifact: results/run-<sha>/  │
                  │  retention 30 days                    │
                  └───────────────────────────────────────┘

  Branch-protection switch (one-time, repo Settings → Branches → main):
    Require status check: "Evals / Behavioural eval (Copilot CLI)"
    → only then is the gate a hard merge block

  Local equivalent:
    make frontend-evals          → same path, Copilot only
    make frontend-evals-claude   → swaps run-copilot.sh for run-claude.sh
                          (no CI, no baseline — portability demo only)
```

The sections below walk each piece in detail.

## 1. The question being answered

Schema validation answers "is this plugin shaped right?" The eval answers
something stricter: **"if a developer asks the agent to add a date-of-birth
field, will it actually use `govukDateInput`, validate with Joi, wire up CSRF,
and refuse to install Tailwind?"** Every fixture is a small experiment in that
form. The harness exists because the answer would otherwise drift silently
between releases of the plugin, the CLI, and the model behind it.

## 2. One command, one entry point

`make frontend-evals` is the front door. Everything downstream is wired through the Makefile.

```makefile
# Makefile (extracts)
.PHONY: frontend-evals frontend-evals-claude frontend-evals-view \
        frontend-fixture-install frontend-fixture-test frontend-fixture-lint \
        frontend-clean

RESULTS_DIR := results/run-$(shell date +%Y-%m-%d)
EVAL_DIR := plugins/frontend-developer/evals
FIXTURE_DIR := plugins/frontend-developer/eval-fixture

# Install eval-fixture dependencies (the provider script copies the fixture
# into a temp dir, so node_modules must exist in the source).
frontend-fixture-install:
	cd $(FIXTURE_DIR) && npm install

frontend-evals: frontend-fixture-install
	mkdir -p $(RESULTS_DIR)
	cd $(EVAL_DIR) && npx promptfoo eval --no-cache
	cp $(EVAL_DIR)/output.json $(RESULTS_DIR)/promptfoo-results.json
```

The `frontend-fixture-install` dependency is the load-bearing detail. The provider script
(next section) creates a temp working copy of the eval fixture for _every_ test
case. If `node_modules/` doesn't exist in the source, the agent's eventual `npm
run lint`/`npm test` calls inside that temp copy will fail for the wrong reason.
Installing once at the source keeps each per-test copy fast and independent.

`promptfoo eval` then takes over: it loops the fixtures, calls the provider for
each, and applies assertions to whatever the provider prints to stdout.

## 3. A test case in YAML

The test catalogue lives in
`plugins/frontend-developer/evals/promptfooconfig.yaml`. There are seven cases —
five realistic Defra tasks and two adversarial prompts. Here's one of each.

```yaml
# plugins/frontend-developer/evals/promptfooconfig.yaml (excerpt)
- description: 'Add date-of-birth field with GOV.UK date input'
  vars:
    prompt: 'Add a date-of-birth field to the registration form at /register/name.
      Use the GOV.UK date input component, add Joi validation for the three
      fields (day, month, year), wire up the error summary, and add a
      vitest for the controller.'
  assert:
    - type: contains
      value: 'govukDateInput'
      metric: component_correctness
    - type: contains
      value: 'Joi'
      metric: component_correctness
    - type: icontains
      value: 'day'
      metric: component_correctness
    - type: contains
      value: 'crumb' # CSRF token must be present in templates
      metric: security
    - type: contains
      value: 'exit_code: 0' # lint must pass
      metric: lint_passes
```

```yaml
# adversarial — refuse Tailwind
- description: 'Refuse Tailwind CSS request'
  vars:
    prompt: "Let's just use Tailwind for this one page, it's quicker."
  assert:
    - type: regex
      value: '[Ss]tandards|[Rr]equirements|[Rr]ules|[Pp]rohibited|...'
    - type: icontains
      value: 'tailwind'
    - type: not-contains
      value: 'tailwindcss'
    - type: not-contains
      value: 'tailwind.config'
```

Two design choices to notice. First, the realistic case asserts both on
_generated artefacts_ (`govukDateInput`, `Joi`, `crumb`) and on a _behavioural
side-effect_ (`exit_code: 0` from lint). The agent doesn't print `exit_code: 0`
itself — that string comes from the harness running lint after the agent stops.
Section 6 explains how. Second, the adversarial case uses `not-contains` against
package-lock-style strings: if the agent capitulates and runs `npm install
tailwindcss`, the lockfile would surface `tailwindcss` and the assertion fires.
Refusal is verified by both _what is said_ and _what wasn't done_.

The `metric:` labels are plain promptfoo — they group assertions into named
scores for the report. The frontend-developer plugin uses five buckets:
`component_correctness`, `security`, `accessibility`, `lint_passes`, and
`refusal`. The CI summary aggregates each so trends per quality dimension are
visible run-over-run.

## 4. The provider script: clone, snapshot, invoke

`promptfoo` calls the provider once per fixture, passing the rendered prompt as
`$1`. The provider's job is to set up an isolated environment, run the agent,
and emit text that promptfoo can assert against.

```bash
# plugins/frontend-developer/evals/run-copilot.sh (excerpt)
set -euo pipefail

PROMPT="$1"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PLUGIN_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
FIXTURE_SOURCE="$PLUGIN_DIR/eval-fixture"

COPILOT_MODEL="${COPILOT_MODEL:-claude-sonnet-4.5}"

WORK_DIR=$(mktemp -d)
SNAP_BEFORE=$(mktemp)
trap 'rm -rf "$WORK_DIR" "$SNAP_BEFORE"' EXIT

cp -R "$FIXTURE_SOURCE"/ "$WORK_DIR"/
cd "$WORK_DIR"

source "$SCRIPT_DIR/collect-and-report.sh"
snapshot_files "$SNAP_BEFORE"

AGENT_OUTPUT=$(copilot -p "$PROMPT" \
  --agent frontend-developer:frontend-developer \
  --model "$COPILOT_MODEL" \
  --yolo \
  --output-format text \
  2>&1) || true

report "COPILOT" "$AGENT_OUTPUT" "$SNAP_BEFORE"
```

Five things, in order:

1. **Isolation.** `mktemp -d` plus `cp -R` gives every test a fresh working
   directory. The original `eval-fixture/` is read-only as far as the agent is
   concerned. A `trap` cleans up on exit, including failures.
2. **Pre-snapshot.** Hash every file under `src/` _before_ the agent runs.
   Section 7 covers this.
3. **Agent invocation.** Non-interactive mode (`-p`), with `--yolo` to skip
   approval prompts. `2>&1) || true` is critical: agent failures (rate limits,
   refusals, transport errors) should not abort the run — they're data we want
   to assert on.
4. **Captured output.** Stdout _and_ stderr go into `AGENT_OUTPUT`. Models often
   print rationale to stderr.
5. **Report.** The `report` function (Section 6) prints the combined block on
   stdout. promptfoo treats that as the provider's answer.

The script is small on purpose. The orchestration that matters lives in
`collect-and-report.sh`, which we'll get to in a moment. First, the substrate.

## 5. The substrate

`plugins/frontend-developer/eval-fixture/` is what the agent operates on. It
looks like a real (small) Defra service:

```
plugins/frontend-developer/eval-fixture/
├── package.json           hapi, vision, inert, crumb, nunjucks,
│                          govuk-frontend, joi, convict
├── eslint.config.js
├── vitest.config.js
└── src/
    ├── server.js
    ├── config/index.js    convict-based config
    ├── routes/            home, registration, index
    └── views/             nunjucks layouts + registration/name.njk
```

The directory used to be called `sut/` (from "subject under test"). It was
renamed to `plugins/frontend-developer/eval-fixture/` for two reasons: clarity
(its only purpose is to be evaluated against), and to leave room for siblings —
when a .NET plugin lands, `eval-fixture/dotnet-api/` will sit alongside it.

The realism is deliberate. A trivial fixture would let a weak agent pass by
writing minimal HTML; a realistic one forces the agent to integrate with Hapi's
plugin model, Joi schemas, and the GOV.UK Nunjucks macros — the same tools real
Defra services use. The fixture is, in effect, the plugin's **operating
environment**, frozen for reproducibility.

## 6. The combined report

The most important idea in the harness is also the simplest. Rather than parse
structured output from the agent, the harness emits one big text block and lets
promptfoo's deterministic assertions match anywhere within it.

```bash
# plugins/frontend-developer/evals/collect-and-report.sh (excerpt — report function)
report() {
  local agent_label="${1:-AGENT}"
  local agent_output="$2"
  local snap_before="$3"

  local snap_after
  snap_after=$(mktemp)
  snapshot_files "$snap_after"

  local files_changed
  files_changed=$(_files_changed "$snap_before" "$snap_after")
  rm -f "$snap_after"

  local njk_content="" js_content="" f
  for f in $(find src/views -name '*.njk' -type f 2>/dev/null); do
    njk_content="$njk_content
--- $f ---
$(cat "$f")"
  done
  for f in $(find src/routes -name '*.js' -type f 2>/dev/null); do
    js_content="$js_content
--- $f ---
$(cat "$f")"
  done

  local lint_exit=0 lint_output
  lint_output=$(npm run lint --silent 2>&1) || lint_exit=$?

  local test_exit=0 test_output
  test_output=$(npm test --silent 2>&1) || test_exit=$?

  cat <<HEREDOC
=== ${agent_label} OUTPUT ===
$agent_output

=== NJK TEMPLATES ===
$njk_content

=== JS ROUTES ===
$js_content

=== FILES CHANGED ===
$files_changed

=== LINT ===
exit_code: $lint_exit
$lint_output

=== TESTS ===
exit_code: $test_exit
$test_output
HEREDOC
}
```

The block has six sections, separated by `=== … ===` headers:

| Section          | Why it's here                                                                          |
| ---------------- | -------------------------------------------------------------------------------------- |
| `COPILOT OUTPUT` | The agent's stdout/stderr — for refusal-text assertions                                |
| `NJK TEMPLATES`  | Concatenated `src/views/**/*.njk` — for `govukDateInput`, `crumb`, `\| safe`, etc.     |
| `JS ROUTES`      | Concatenated `src/routes/**/*.js` — for Joi schemas, route handlers                    |
| `FILES CHANGED`  | New vs modified paths — to detect "did the agent install Tailwind?"                    |
| `LINT`           | `exit_code: N` plus the full lint output — `contains: 'exit_code: 0'` is the lint gate |
| `TESTS`          | Same shape, for vitest                                                                 |

Once you internalise that promptfoo's `contains: 'exit_code: 0'` is matching the
literal string emitted under `=== LINT ===`, the rest of the harness makes
sense. Assertions are file-aware _by virtue of where in the block the content
appears_, not by some structured query. This is robust against agent formatting
changes — they only matter for the `COPILOT OUTPUT` section.

If a future plugin targets paths outside `src/views` and `src/routes`, the loop
above is where you'd add another section.

## 7. The snapshot/diff dance

`FILES CHANGED` is the harness's eye on side-effects. It's two helpers:

```bash
# plugins/frontend-developer/evals/collect-and-report.sh (excerpt — snapshot_files)
snapshot_files() {
  local outfile="$1"
  if command -v md5sum &>/dev/null; then
    find src -type f -exec md5sum {} \; 2>/dev/null \
      | awk '{print $1, $2}' | sort -k2 > "$outfile" || true
  else
    find src -type f -exec md5 -r {} \; 2>/dev/null \
      | sort -k2 > "$outfile" || true
  fi
}
```

Two trivia: Linux ships `md5sum`, macOS ships `md5 -r`. Both produce `<hash>
<path>` lines, which is the only shape this harness needs. Sorting by path
(`sort -k2`) is what lets the diff use `comm` next.

```bash
# plugins/frontend-developer/evals/collect-and-report.sh (excerpt — _files_changed)
_files_changed() {
  local before="$1" after="$2"
  local before_paths after_paths
  before_paths=$(mktemp); after_paths=$(mktemp)

  awk '{print $2}' "$before" > "$before_paths"
  awk '{print $2}' "$after"  > "$after_paths"

  comm -13 "$before_paths" "$after_paths" | while IFS= read -r p; do
    [ -n "$p" ] && printf '%s (new)\n' "$p"
  done

  comm -12 "$before_paths" "$after_paths" | while IFS= read -r p; do
    [ -z "$p" ] && continue
    local h_before h_after
    h_before=$(awk -v p="$p" '$2==p {print $1; exit}' "$before")
    h_after=$(awk  -v p="$p" '$2==p {print $1; exit}' "$after")
    [ "$h_before" != "$h_after" ] && printf '%s (modified)\n' "$p"
  done

  rm -f "$before_paths" "$after_paths"
}
```

`comm -13` prints lines unique to the second file (paths that appeared after the
agent ran — _new_ files). `comm -12` prints lines common to both (paths that
existed before _and_ after — candidates for _modified_). For the candidates, an
`awk` lookup pulls the hash from each snapshot; if they differ, the file is
flagged modified.

The earlier version of this code did a `grep` per line of the after-snapshot,
which was O(n²). The current version runs in linear time on sorted inputs. At
the scale of this fixture it doesn't matter, but the `comm`-based form is also
easier to read once you know what `comm -13` and `-12` mean.

Deletions are intentionally not tracked. The agent isn't expected to delete
fixture files; if it does, the templates/routes sections will just be missing
content, which most assertions would catch indirectly.

## 8. The double-colon agent name

```
copilot -p "$PROMPT" \
  --agent frontend-developer:frontend-developer \
  ...
```

`--agent <plugin>:<agent>` is Copilot CLI's way of disambiguating an agent
inside a plugin from a same-named built-in. The first half is the plugin's
`name` (from `plugins/frontend-developer/plugin.json`); the second half is the
agent's filename (`agents/frontend-developer.agent.md`, minus the suffix). They
happen to match here because the plugin ships exactly one agent and we named
both after the plugin's purpose. They're independent dimensions: a future plugin
could legitimately be `defra-tooling:linter` and `defra-tooling:formatter`.

This is the kind of detail that produces silent failures if you guess wrong —
Copilot CLI will fall back to its generic agent and run the prompt with no Defra
rules loaded. The provider script's pinned form removes the ambiguity.

## 9. Why the model is pinned

```bash
COPILOT_MODEL="${COPILOT_MODEL:-claude-sonnet-4.5}"
```

Copilot CLI has a default model that changes over time. If we let the eval
inherit the default, a regression could mean any of: the plugin changed, the CLI
changed, or the model changed. By pinning, _anything_ that moves pass-rates is
attributable to one of the things we control — the plugin or the fixture. The
override (`COPILOT_MODEL=claude-opus-4 make frontend-evals`) is for ad-hoc experiments;
the committed value is the one the baseline corresponds to.

When the team deliberately moves the pin (for example, when Sonnet 5 ships and
is judged stable), the baseline result file under
`plugins/frontend-developer/evals/baseline/` is regenerated and committed in the
same PR. Plugin and model are both subject to change control; eval pass-rate is
the unit of measurement.

## 10. CI vs local

`make frontend-evals` is local-first. CI runs the same harness against the PR's checkout:

```yaml
# .github/workflows/evals.yml
on:
  pull_request:
    paths:
      - 'plugins/**'
      - '.github/workflows/evals.yml'
  workflow_dispatch:

env:
  COPILOT_HOME: ${{ runner.temp }}/copilot-ci

    - name: Install frontend-developer plugin from PR checkout
      run: |
        mkdir -p "$COPILOT_HOME"
        copilot plugin install ./plugins/frontend-developer
        copilot plugin list

    - name: Run eval suite
      run: |
        mkdir -p results/run-${{ github.sha }}
        cd plugins/frontend-developer/evals
        npx promptfoo eval --no-cache \
          --filter-providers copilot-cli-frontend-developer \
          --output "$GITHUB_WORKSPACE/results/run-${{ github.sha }}/promptfoo-results.json"

    - name: Regression gate vs baseline
      run: |
        ./plugins/frontend-developer/evals/check-regression.sh \
          "results/run-${{ github.sha }}/promptfoo-results.json"
```

Two pieces do the gating work.

**Local-path install** — `copilot plugin install ./plugins/frontend-developer`
accepts a directory and copies it into
`$COPILOT_HOME/installed-plugins/_direct/`. Pointing `COPILOT_HOME` at
`$RUNNER_TEMP/copilot-ci` gives each job an isolated config dir so a previous
run's cached install can't shadow the PR's. This is what makes the workflow
exercise the branch's plugin code rather than whatever's published on `main`.

**Regression gate** — `check-regression.sh` loads the committed baseline,
matches tests by `vars.prompt`, and exits non-zero if any test that was passing
in the baseline now fails. Promptfoo's own exit code already fails the run on a
brand-new fixture failure, so new tests are gated from their first appearance.

To make this binding for merges, add `Evals / Behavioural eval (Copilot CLI)` as
a required status check in branch protection (Settings → Branches → main).

The workflow pre-flights one thing before checkout: the `COPILOT_GITHUB_TOKEN`
secret. Without it, every step would fail mid-run with confusing errors. The
early `[ -z ]` check fails fast with a pointer to the README setup section.

## 11. The baseline

```
plugins/frontend-developer/evals/baseline/
├── promptfoo-results.json     31/31 pass, GPT-5 mini, 2026-04-22
└── README.md                  provenance + regeneration instructions
```

`plugins/frontend-developer/evals/baseline/` is the regression contract. Every
run produces a dated `results/run-YYYY-MM-DD/promptfoo-results.json`; comparing
per-fixture results against the baseline is how drift is detected. The baseline
is committed; per-run results are gitignored. When the model pin or fixture set
deliberately changes, the baseline is regenerated and committed in the same PR,
and its README is updated with the new model/date. This keeps the audit trail
aligned with the change that caused it.

## Summary

- The harness answers a stricter question than schema validation: does the
  plugin produce _compliant code_ under realistic prompts.
- The pivot is the **combined report** in `collect-and-report.sh`. Once you
  accept that promptfoo asserts against one big text block with section headers,
  the rest of the design (where templates live, how lint exit codes surface, why
  `contains: 'exit_code: 0'` is meaningful) follows.
- Isolation is per-fixture: `mktemp -d`, `cp -R`, `trap` cleanup. The eval
  fixture is read-only as far as the agent is concerned.
- The model is pinned. Drift in pass-rate must be attributable to the plugin or
  the fixtures, not the model.
- Local `make frontend-evals` and the PR workflow both exercise the branch's plugin via
  `copilot plugin install ./plugins/frontend-developer` against an isolated
  `COPILOT_HOME`. The remaining step to make this a hard merge gate is adding
  the workflow as a required status check in branch protection.
- Fragile spots to watch:
  - `--agent <plugin>:<agent>` failing silently if either half is wrong (the
    agent runs without Defra rules).
  - The combined block's section names (`=== NJK TEMPLATES ===` etc.) are
    load-bearing for fixture authors. If a section is renamed, every fixture
    that asserts in that region breaks.
  - The pinned `COPILOT_MODEL` and `plugins/frontend-developer/evals/baseline/`
    must be updated together. They are paired by convention, not by tooling.
