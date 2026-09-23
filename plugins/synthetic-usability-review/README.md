# synthetic-usability-review

Check a working service for usability problems before you test it with real people.

The skill pretends to be the people who use your service and tries real jobs with it. It checks every screen against three sets of rules:

- [Nielsen's 10 usability heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/)
- [Microsoft's Guidelines for Human-AI Interaction](https://www.microsoft.com/en-us/haxtoolkit/ai-guidelines/), for services that use AI
- the [GOV.UK Design System](https://design-system.service.gov.uk/)

It sorts what it finds by when it needs fixing, and writes a plain English report.

It finds problems that almost anyone would hit, so real research can go deeper. **It is not a replacement for research with real people**, and every report says so.

No agent: one skill. It loads when a request matches its description, and can be invoked by name.

## Skills

| Skill                        | Use it for                                                                                                                                          |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `synthetic-usability-review` | A heuristic review or expert review of a working journey, synthetic or simulated usability testing, or a usability check before testing with users. |

## Install

GitHub Copilot CLI:

```sh
copilot plugin marketplace add DEFRA/defra-ai-plugins
copilot plugin install synthetic-usability-review@defra-ai-plugins
```

Claude Code, inside a session:

```
/plugin marketplace add DEFRA/defra-ai-plugins
/plugin install synthetic-usability-review@defra-ai-plugins
```

Other CLIs that read `SKILL.md` files can use the skill as it is.

## What it needs

**A browser tool.** The skill works best when your AI assistant can use a real browser, such as Claude in Chrome, GitHub Copilot's browser tools in VS Code, or the browser in the ChatGPT and Codex desktop app. These change often, so check what yours has.

The skill never installs anything. If there is no browser, it tells you what it cannot do, and offers to review screenshots and page text that you send it.

**A test environment.** Point it at a practice copy or a test environment, not a live service, unless the service owner agrees. It uses made-up details, and never finishes anything that does something real.

## What it asks you

Every service has different people and different jobs, so the skill asks before it starts:

1. Who uses the service. Describe them, or share a document that does.
2. What they are trying to do, as situations rather than instructions.
3. Where the service is running.
4. Which screens exist, including errors and waiting.

## Evaluating

The automated tests in [`evals/promptfooconfig.yaml`](evals/promptfooconfig.yaml) check how the skill behaves without a browser, whether it asks before guessing, and what it refuses:

```sh
cd plugins/synthetic-usability-review/evals
npx promptfoo eval
```

They do not test whether it finds real problems, because that needs a browser. The best check is your own: run it on a service where you already know the problems, and see what it finds and what it misses.

## Recommended companions

Install [`defra-pii-redaction`](../defra-pii-redaction) alongside this plugin. The skill tells the agent never to type real personal details, and the redaction hook backs that up.

## Contact

AICapabilityAndEnablement@defra.gov.uk, or #ask-ace on Defra Slack.

## Licence

Open Government Licence v3.0. See [LICENSE](../../LICENSE).
