# Security policy

## Reporting a vulnerability

If you find a security vulnerability in this repository — in a plugin, in the validator scripts, in the CI workflow, or anywhere else — please **do not** open a public GitHub issue.

Instead, email the Defra AI dev team at:

> **AICapabilitiesEnablement@defra.gov.uk**

Use a subject line that begins with `[SECURITY] defra-ai-plugins`.

## What to include

Please include as much of the following as you can:

- A description of the issue
- The repository path of the affected file(s) or plugin(s)
- Steps to reproduce the issue
- The potential impact
- Any suggested mitigation
- Whether you intend to disclose the issue publicly later (and on what timeline)

## What happens next

The AI dev team will:

1. Acknowledge receipt within 5 working days
2. Triage and confirm the issue
3. Work on a fix and coordinate disclosure with you
4. Credit you in the fix release notes if you would like to be named

We follow coordinated disclosure: please give us a reasonable window to fix the issue before disclosing it publicly.

## Out of scope

This repository ships text content (agent prompts) for use by Copilot CLI. It does not execute network calls or process user data directly. Vulnerability classes typically out of scope:

- Issues in third-party tools that Copilot CLI calls (raise upstream)
- Issues in Defra services built with the help of these plugins (raise with the relevant service team)
- Theoretical issues with no practical exploitation path

If in doubt, email us anyway — we'd rather see false positives than miss something real.
