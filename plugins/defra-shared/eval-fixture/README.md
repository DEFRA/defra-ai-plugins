# defra-shared eval-fixture

A minimal git repository used by the eval suite to exercise every hook in
`../hooks/hooks.json` end-to-end. Each hook is invoked with the synthetic
JSON input the Claude Code / Copilot CLI hook runtime would deliver, and
its exit code and stderr output are asserted.

## Layout

```
eval-fixture/
├── README.md                    # this file
├── package.json                 # marks the fixture as a tiny Node project (for npm-test smoke)
├── fixtures/                    # planted artefacts that hooks should react to
│   ├── secret-planted.js        #   contains a hard-coded AWS access key
│   ├── pii-planted.md           #   contains a UK NI number
│   └── lowcov-test-output.txt   #   simulated test output reporting <80% coverage
└── scripts/
    ├── init-git.mjs             # stages a fixture clone into a tmp git repo on HEAD=main
    └── run-hook.mjs             # spawns a single hook with synthetic input on stdin
```

Hook scripts themselves live in `../hooks/scripts/*.mjs` and are invoked
directly from `run-hook.mjs` (the legacy `extract-hooks.sh` indirection has
been removed — hook bodies are now real `.mjs` files, not bash strings
embedded in `hooks.json`).

## How to use

`node scripts/run-hook.mjs <hook-id> [project-dir] < <input.json>` runs the
named hook with the given input and prints its stderr + exit code. The eval
suite calls this once per acceptance criterion in AC6:

| AC6 case | Expected |
|---|---|
| `branch-guard` with HEAD on `main` and a `git commit` command | exit 2, stderr names `branch-guard` |
| `secret-scan` with `Write` containing the planted AWS key | exit 2, stderr names `secret-scan` |
| `pii-scan` after `Write` to `fixtures/pii-planted.md` | exit 0 (async), stderr warns about UK-NI-number |
| `commit-message-format` with `git commit -m "WIP"` | exit 2, stderr names `commit-message-format` |
| `coverage-floor` with simulated test output reporting 42% | exit 0 (async), stderr warns below threshold |

The fixture is itself a git repo so `branch-guard` has a real `HEAD` to read.
`scripts/init-git.mjs` creates one on first run.

## Why only fixtures, no real source

This plugin ships **no agent**. The fixture exists only to drive the hooks;
there is no service for an agent to edit. The role plugins
(`frontend-developer`, `nodejs-backend-developer`, …) carry stack-specific
fixtures with real source.
