---
name: story-ticket
description: Create user-facing JIRA story tickets using the standard user story format (As a / I want to / so that). Use when the work delivers business value to an end user, stakeholder, or other consumer of the system.
---

# Story Ticket

## When to Use

Use this skill for **user-facing features** that deliver measurable business value. Always include the user story format.

Examples: New UI features, user-visible workflows, agent capabilities visible to end users, self-service functionality.

## Core Guidelines

### Background Section

- **Keep it concise**: 1–2 sentences maximum
- **Describe the current state**: Focus on the problem or gap, not the solution
- **Don't assume the system exists**: Frame it as a current challenge or limitation
- **Connect to the broader context**: Reference the epic or initiative when relevant

**Good example**: "Teams frequently raise last-minute work items without enough context for estimation, leading to sprint planning delays and rework."

### Story Format

- **As a** [user role] — who performs the action?
- **I want to** [capability or feature] — what specific capability?
- **so that** [business value or outcome] — what problem does this solve?

Keep it focused on one main capability. The "so that" clause must express business value, not a technical outcome.

### Acceptance Criteria

- Start each with **AC[number]** in bold (`AC1`, `AC2`, etc.)
- Make each criterion specific and testable
- Cover all key operations mentioned in the requirements (create, read, update, delete where applicable)
- Use clear, action-oriented language

## Template

Use the [story template](./assets/template.md) as your starting structure.

If the user has provided a custom template for this session, use that instead.

## Clarification Questions

Before writing, confirm:

1. **User role** — who is performing the action?
2. **Core capability** — what specific feature or functionality is needed?
3. **Business context** — what problem or pain point does this solve?
4. **Broader initiative** — what epic or project does this belong to?

If still unclear, ask about:
- The current "as is" process or pain point
- Whether this is new functionality or an enhancement to something existing
- Any regulatory, compliance, or policy considerations
- Specific business value or urgency drivers

## Example

Given: "Users need to be able to manage their notification preferences"

**Title**: Manage Notification Preferences

**Background**: Users currently receive all system notifications with no ability to control frequency or type, leading to notification fatigue and missed critical alerts.

**Story**:
- **As a** registered user
- **I want to** control which notifications I receive and how often
- **so that** I only see alerts relevant to me and can avoid missing important updates

**Acceptance Criteria**:
- **AC1** - Users can view all available notification types on a preferences page
- **AC2** - Users can enable or disable each notification type independently
- **AC3** - Users can set frequency preferences (immediate, daily digest, weekly summary)
- **AC4** - Preference changes take effect within the current session
- **AC5** - A confirmation message is shown after saving preferences
