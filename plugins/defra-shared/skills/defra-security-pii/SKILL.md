---
name: defra-security-pii
description: Defra security and PII handling — never hard-code secrets, never log PII, refuse unsafe template patterns, and redact known UK PII (NI numbers, NHS numbers, postcodes, DoB combinations) before any output leaves the service. Use when the agent is editing code that handles user data, writing log lines, configuring templates, or wiring credentials.
license: OGL-UK-3.0
---

# Defra security and PII handling

Defra services handle data from members of the public. The agent treats every string that may have come from a user as untrusted, every credential as something that must never reach a repository, and every log line as something a third party may eventually read.

## The standard

### Secrets

- **Never hard-code secrets** in source. That includes API keys, database connection strings with embedded passwords, JWT signing keys, OAuth client secrets, AWS access keys, private TLS keys, SSH keys, basic-auth headers, and bearer tokens.
- Secrets come from environment variables, the platform secret manager (CDP, AWS Secrets Manager, Azure Key Vault), or a sealed `.env` file that is git-ignored.
- The companion hook `secret-scan` runs on every `Write` / `Edit` and blocks the change when a known secret pattern matches. The provisional scanner is `gitleaks`.

### PII

The agent treats the following as **PII** that must never appear in logs, error messages, telemetry, analytics events, or any artefact that leaves the service boundary:

- UK National Insurance numbers (e.g. `AB123456C`).
- NHS numbers (10-digit, often spaced as `nnn nnn nnnn`).
- UK postcodes when combined with another identifier (a postcode alone is borderline; a postcode plus a name or DoB is PII).
- Dates of birth.
- Email addresses, phone numbers, full names, full street addresses.
- IP addresses linked to a user account.

Log structured fields by **identifier** (e.g. `userId`, `caseRef`), not by the underlying PII. Use a redactor in the logging library (`pino` redact paths, Serilog `Destructurer`, `structlog` processor) to belt-and-brace any field that ends up in a log line.

The companion hook `pii-scan` runs on every `Write` / `Edit` and warns when a PII pattern is detected in a changed file. It is async (warning only) so it does not block legitimate fixture data.

### Unsafe template patterns

For Nunjucks (frontend), Razor (.NET), and Jinja2 (Python):

- `autoescape: false` is forbidden in production templates.
- The `| safe` filter (Nunjucks / Jinja2) and `Html.Raw` (.NET) are permitted only on **server-rendered, pre-sanitised** content. Never on user-supplied data.
- No inline `<script>` or `<style>` blocks; no `style=` attributes; no `javascript:` URLs.
- Forms render with a CSRF token (`crumb` in Hapi; antiforgery in ASP.NET Core; `csrf_token()` in FastAPI / Jinja2).

The `frontend-developer` plugin has a stack-specific `nunjucks-security` hook that blocks inline scripts/styles. Backend plugins ship the equivalent for their template engine.

### Other unsafe patterns

- No outbound network calls in default hooks (link-check is the only exception, async warning only).
- No use of `eval`, `Function(string)`, `dynamic` C#, or `exec` on user-supplied strings.
- No untrusted deserialisation (`pickle.loads` on user data, `BinaryFormatter`, `JSON.parse` of untrusted input without a schema).
- TLS/cert validation is never disabled (`rejectUnauthorized: false`, `ServicePointManager.ServerCertificateValidationCallback = (_, _, _, _) => true`, `verify=False`).

## Anti-patterns the agent must refuse

- Adding a literal API key, password, or token to a source file.
- Logging a request body, a user object, an email address, or a phone number directly.
- Setting `autoescape: false` or rendering user input through `| safe` / `Html.Raw`.
- Disabling TLS verification "for testing" in code that is shared between dev and prod.
- Catching an exception, logging the full exception object (which may contain PII in the message), and rethrowing.
- Sending PII to analytics / telemetry providers.
- Storing PII in URLs (path or query string).
- Suggesting `chmod 777` on a secrets file.

If the user asks for any of the above, the agent refuses, names which standard is violated, and offers a compliant alternative.

## Worked example

User: "Just log the whole request body so I can debug — make a quick log line."

Agent response:

> I can't log the full request body — Defra security and PII handling forbids logging raw user input because the body can contain names, emails, NI numbers, or other PII. Here is a compliant alternative that logs the diagnostic shape without the data:
>
> ```js
> import { logger } from '../config/logger.js'
>
> // pino is configured with redact paths in config/logger.js:
> //   redact: ['req.body.email', 'req.body.dateOfBirth', 'req.headers.authorization']
> // so even if a field slips through, it never reaches the log sink in plain text.
>
> request.logger.info(
>   {
>     route: request.path,
>     method: request.method,
>     fields: Object.keys(request.payload ?? {}), // shape only, not values
>     userId: request.auth?.credentials?.userId   // identifier, not PII
>   },
>   'registration form submitted'
> )
> ```
>
> If you need the actual values to debug a specific issue, capture them in a one-off scratch script that never runs in production, never gets committed, and is deleted when the bug is fixed.

The agent volunteers the redaction and identifier-only pattern without being asked.

## TODO — open project-owner questions

- The exact PII pattern set (UK NI numbers / NHS numbers / postcodes / DoB combos) is **provisional**. The project owner has not yet signed off the canonical list. See the open-questions list in `docs/spec/PLAN.md` "Decisions still required" in the upstream planning repo.
- The secret-scan tool is **provisionally `gitleaks`**; if the project owner picks a different scanner, the `secret-scan` hook updates here.
- Full GDPR-compliance tooling (data protection impact assessments, retention auditing) is explicitly **out of scope for v1** — see `docs/requirements/non_goals.md` "No GDPR-specific tooling beyond PII handling".
