#!/usr/bin/env node
// Provider script for promptfoo: runs a prompt through Copilot CLI against a
// clean copy of the eval fixture, captures output + file diffs.
//
// Usage: node run-copilot.mjs "<prompt>"
//
// Prerequisites:
//   - Copilot CLI installed (`npm install -g @github/copilot`)
//   - The frontend-developer plugin installed:
//       copilot plugin marketplace add DEFRA/defra-ai-plugins
//       copilot plugin install frontend-developer@defra-ai-plugins
//   - Eval-fixture dependencies installed (`npm run evals:frontend:fixture:install`)
//
// Pin the model to keep results comparable across runs.
// Override with COPILOT_MODEL=<id> for local experimentation.

import { runAgent } from './run-agent.mjs'

runAgent({
  agentLabel: 'COPILOT',
  binary: 'copilot',
  buildArgs: (prompt) => [
    '-p',
    prompt,
    '--agent',
    'frontend-developer:frontend-developer',
    '--model',
    process.env.COPILOT_MODEL ?? 'gpt-5-mini',
    '--yolo',
    '--output-format',
    'text'
  ]
})
