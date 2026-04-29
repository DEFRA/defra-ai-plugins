---
name: task-ticket
description: Create developer-focused JIRA task tickets for technical implementation, infrastructure setup, or any work that does not follow a user story format. Use when the primary audience is the development team rather than an end user.
---

# Task Ticket

## When to Use

Use this skill for **technical implementation work**, infrastructure, backend services, or developer-focused activities. Skip the user story format and focus on technical requirements and delivery criteria.

Examples: API development, database schema design, build system setup, CI/CD pipeline configuration, performance improvements, security hardening, developer tooling.

## Core Guidelines

### Background Section

- **Keep it concise**: 1–2 sentences maximum
- **Explain the technical need**: Why is this work required?
- **Focus on the current state**: The existing problem or technical gap
- **Don't assume the system exists**: Frame it as a current challenge or limitation

### Acceptance Criteria

- Start each with **AC[number]** in bold (`AC1`, `AC2`, etc.)
- Make each criterion specific and testable
- Focus on technical outcomes: interfaces, integration points, behaviours, or measurable thresholds
- Use clear, action-oriented language

### Technical Notes (Optional)

- Implementation patterns or architectural references
- Links to related systems or dependencies
- Performance, security, or compliance considerations
- Deployment or rollout guidance

## Template

Use the [task template](./assets/template.md) as your starting structure.

If the user has provided a custom template for this session, use that instead.

## Clarification Questions

Before writing, confirm:

1. **Technical problem** — what gap or limitation does this address?
2. **Scope** — which systems or components are involved?
3. **Dependencies** — are there related tasks or systems that must be in place first?
4. **Technical approach** — any specific patterns, frameworks, or architectural constraints?

If still unclear, ask about:

- The current technical state and pain points
- Whether this builds new capability or enhances existing infrastructure
- Integration points with other parts of the system
- Performance, scalability, or security constraints
- Deployment or rollout considerations

## Example

Given: "Set up automated database backups"

**Title**: Implement Automated Database Backup and Restore Pipeline

**Background**: The production database currently has no automated backup process. A manual backup procedure exists but is unreliable and has caused data loss risk during incidents.

**Acceptance Criteria**:

- **AC1** - Automated daily backups run at a configurable scheduled time
- **AC2** - Backups are stored in an off-site location with a minimum 30-day retention period
- **AC3** - Backup success and failure events are logged and trigger alerts on failure
- **AC4** - A documented restore procedure is validated against a test environment
- **AC5** - Backup age and storage usage are visible in the monitoring dashboard

**Technical Notes**:

- Use the existing cloud storage bucket for off-site retention
- Encrypt backups at rest using the team's standard KMS key
- Integrate backup alerts with the current on-call notification system
