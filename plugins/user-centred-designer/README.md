# user-centred-designer

User-centred design (UCD) skills for Defra. Three instruction documents that
encode how the AI Capability and Enablement (AICE) team produces service design,
content design and interaction design work, refined through real delivery with
the Rural Payments Agency and checked against the
[Defra service manual](https://digital.defra.gov.uk/service-manual) and the
[GOV.UK Design System](https://design-system.service.gov.uk/).

No agent: skills only, like `defra-shared`. The skills load automatically when
a request matches their description, and can be invoked by name.

## Skills

| Skill                                | Use it for                                                                                                                               |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `defra-doc-style`                    | Any document, deck or page for a Defra audience: GOV.UK content design rules, visual standards, tested colour contrast, quality process. |
| `defra-service-designer`             | Service blueprints and journey maps: the two-halves method, to-be framework overlay, and how to build and iterate the artefact.          |
| `defra-interaction-content-designer` | Prototypes, interface copy, Design System patterns, accessibility duties, and the GitHub to Core Delivery Platform (CDP) deploy loop.    |

`defra-doc-style` is the single source for writing and visual rules; the other
two build on it. Install all three together (they ship as one plugin).

## Install

```sh
copilot plugin marketplace add DEFRA/defra-ai-plugins
copilot plugin install user-centred-designer@defra-ai-plugins
```

The skills also work unchanged in Claude Code and other CLIs that read
`SKILL.md` files.

## Who this is for

Content designers, interaction designers, service designers and user
researchers using an AI CLI on Defra work, including teams with no coding
background who maintain content in CDP-hosted services.

## Producing artefacts (blueprint images, PowerPoint)

The skills describe artefacts as fixed-size HTML pages rendered to images, and
decks as native PowerPoint built with pptxgenjs. Copilot's agent can run both,
it just needs the toolchain installed once in your working folder:

```sh
npm install playwright pptxgenjs
npx playwright install chromium
```

If the Chromium download is blocked by a corporate proxy, skip
`npx playwright install` and point the render script at an installed
Chromium-based browser instead. On a Defra Windows machine, Microsoft Edge
works:

```powershell
$env:CHROMIUM_PATH = 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
```

(Or `set CHROMIUM_PATH=...` in cmd.)

A ready-made render helper ships with this plugin at
[scripts/render.mjs](scripts/render.mjs):

```sh
node scripts/render.mjs blueprint.html --scale 3        # PNG at ~288dpi for Mural
node scripts/render.mjs one-pager.html --pdf out.pdf    # PNG plus PDF
```

Example asks:

- "Using the defra-service-designer skill, build a service blueprint of how X
  gets made and used as an A3 landscape HTML page, then render it to PNG with
  scripts/render.mjs at scale 3."
- "Using the defra-doc-style skill, build this as a 6 slide deck with
  pptxgenjs and run the script to produce the .pptx."

One step does not transfer from the skills automatically: inspection. The
agent renders, but you are the eyes. Open the PNG at full size and check for
overlaps, cut-off text and uneven gaps before sharing. A broken file still
renders without an error. In VS Code you can also attach the rendered PNG back
into chat for a vision-capable model to critique.

## Recommended companions

Install [`defra-shared`](../defra-shared) and
[`defra-pii-redaction`](../defra-pii-redaction) alongside this plugin. They
ship the guardrail hooks that scan for secrets and redact UK personal data in
prompts and tool traffic, which enforces the
[AI digital toolkit](https://digital.defra.gov.uk/ai-toolkit) data rules while
the agent works.

## Contact

AICapabilitiesEnablement@defra.gov.uk, or #ask-ace on Defra Slack.
