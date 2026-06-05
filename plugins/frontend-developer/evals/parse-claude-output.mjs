// Turn `claude -p --output-format json` into the agent-output string the report
// asserts on.
//
// The wrinkle this solves: headless claude runs the plugin's UserPromptSubmit
// hooks, but when one BLOCKS a prompt (forbidden-tech-block exits 2) the CLI
// does not echo the hook's stderr banner. It just reports the deterministic
// block as `num_turns: 0` with an empty `result` — so the refusal text the
// adversarial fixtures assert on is lost.
//
// On that turn-0 path we recover the refusal by re-running the SAME hook the CLI
// ran (`check` from forbidden-tech-block.mjs). This is the genuine governance
// artifact claude swallowed, not a synthesised stand-in. We only do it when
// claude actually blocked (num_turns === 0): if the hook ever stops firing, the
// model runs, num_turns climbs, the model writes the forbidden code, and the
// fixture's `not-contains` assertions fail loudly instead of being masked.

import { check } from '../hooks/scripts/forbidden-tech-block.mjs'

export function parseClaudeOutput({ result, prompt }) {
  const stdout = result?.stdout ?? ''
  let json
  try {
    json = JSON.parse(stdout)
  } catch {
    json = null
  }

  // Not JSON (older CLI, crash, etc.) — fall back to raw capture.
  if (!json) {
    return `${stdout}${result?.stderr ?? ''}`
  }

  // Deterministic no-op turn: either a hook blocked the prompt, or nothing ran.
  // Recover the hook's real refusal banner; if no hook matched, surface whatever
  // result the CLI gave (empty) so a genuine no-op still reads as no refusal.
  if (json.num_turns === 0 && !json.is_error) {
    const { exitCode, stderr } = check({ prompt })
    return exitCode === 0 ? (json.result ?? '') : stderr
  }

  return json.result ?? ''
}
