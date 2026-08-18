---
name: defra-service-designer
description: >-
  Service design for Defra. Use when mapping a service end to end, building a service blueprint, making a journey map, laying a target operating model or to-be framework over a current-state map, or running a discovery. Trigger on 'service blueprint', 'map the as-is', 'to-be framework', 'journey map', 'map the end to end journey', 'where could AI help across this service'. Covers the blueprint and journey map house method and how to build and iterate the artefact.
license: OGL-UK-3.0
---

# Defra service designer

Maps how a Defra service actually works, so a team can see the whole thing at once and agree what to change. The main output is a service blueprint or a journey map. Works alongside `defra-doc-style` for writing and visual standards and `defra-interaction-content-designer` for anything that becomes a prototype or frontend.

The artefact is an argument, not a diagram. Its job is to make one uncomfortable finding unavoidable. If you cannot say in a single sentence what the map proves, you have drawn a picture, not designed anything.

## Where this sits

There is no service blueprint page in the [Defra service manual](https://digital.defra.gov.uk/service-manual). This is the house method, developed on real work. Two manual rules still bite on the artefact itself: contrast meets WCAG 2.2 AA, and say "people", not "users", per the [Defra style guide](https://digital.defra.gov.uk/content/defra-style-guide). Process and governance, service assessments, research standards and plans, sustainability, live in the service manual. Follow them there, not from this file.

## Before you start

- The stakeholders' own process documents, in their words.
- Notes or a transcript from the session where the process was described.
- The names of the real systems people use. Naming them is what makes people trust the map.
- Any draft target operating model or to-be framework the organisation has already written. Ask for it explicitly. If you do not, you will build the map and then be told it does not align with a document nobody mentioned.

If one half of the service has no research behind it, say so on the artefact. An honest gap is more useful than an invented journey, and is usually the most valuable thing on the page.

## The blueprint structure

Two halves, side by side, read left to right.

**Supply.** How the thing gets made. Plan, design, draft, review, test, publish, assure, then business as usual and change. Owners exist, the process is documented, people will recognise it.

**Demand.** How people find and use it to do their job. For guidance that is: work arrives, find the guidance, follow it, close the case. This half is usually unresearched, unmeasured and unowned. That is normally the finding.

Give each half a phase band across the top, worded as the person's goal, not the internal function. "Create the guidance" and "Find and use the guidance", not "Production" and "Consumption".

### The rows, in order

Rows are the reading order. Do not reorder them for visual convenience.

1. **Stage headers.** Numbered, coloured by half.
2. **To-be framework.** If the organisation has a target model, it attaches directly beneath each stage header as its own card. Give the stage's intent in the framework's own words, bold, then the key shift it introduces. Where the framework does not reach, put a single amber card spanning the columns it misses, saying plainly what is not covered.
3. A heavy grey rule separating the target model from today.
4. **What happens.** One short line per stage.
5. **Who is involved.** Roles as plain coloured text, not pills or badges.
6. **Systems.** Real product names.
7. **Pain points.** The specific complaint in the words people used, with red dot markers. This row does the persuading.
8. **AI or improvement opportunity.** What could help, marked as now or later.
9. **Key finding.** One amber-ruled strip at the foot carrying the single sentence the blueprint proves.

Do not add a measures row unless there is real data. An empty measures row tells no story. Put any figure you do have inside the relevant pain point.

## The journey map structure

Different artefact, same discipline. Lanes, in order:

1. **Phases**, worded as what the person is trying to do.
2. **Who leads.** Map the user-centred design disciplines onto the phases: user researcher for discovery and synthesis, service designer for journey and service mapping, interaction designer for page and flow design, content designer for writing content into the build, then back to the user researcher for testing. Colour by discipline and note that they overlap.
3. **Tasks.** What the person actually does.
4. **Outcomes.** What they get.
5. **Feeling.** A thin one-word strip, not an emotion curve. Lead with tasks and outcomes, not feelings.
6. **Under the hood.** Systems and handoffs.
7. **Technical assumptions**, flagged in amber, so engineers can read down the artefact and challenge each one.

Make it look like a proper GDS journey map with lanes and a timeline. Never use a row of generic step cards. That looks like every other slide and carries no information the labels do not already give.

## Rules learned the hard way

- **The to-be framework belongs at the top, mapped against the phases.** Appended as a bottom row it reads as an afterthought and stakeholders will say so.
- **Mark what the target model does not cover.** One amber card across the uncovered columns.
- **Show a repeated touchpoint at every point it occurs**, as small markers in the relevant stages. Do not draw a bracket or connector graphic across them. It reads as clutter.
- **Only what is happening now carries colour.** Everything future is quiet grey text. If everything is coloured, nothing is.
- **No status pills or label chips.** A "draft, to be agreed" tag is an AI tell. Put "draft" in the subtitle instead.
- **Roles as plain coloured text, not badges.** Badges make a dense artefact denser. Use only the ink colours that pass AA on white, so dark green `#00703C` rather than Defra green `#00A33B`.
- **No personal names.** Describe people by role, for example "a developer previously working on this service". Artefacts get shared into Mural and beyond the team.
- **Use the stakeholders' own words for pain points.** Quoting them is what makes people believe the map.

## Writing style

GOV.UK content design throughout. The `defra-doc-style` skill carries the full writing rules and is the single source for them. What is specific to blueprints and journey maps: every cell is a phrase, not a sentence, and if a cell runs to 2 lines, cut it. Pain points are the one exception. They keep the stakeholders' own words even when that runs longer, because the quote is the evidence.

## Building it

- Build as a single HTML page sized to the sheet. A3 landscape or wider. One recent blueprint was 3240 by 1324px.
- Use **CSS grid** for the matrix, for example `grid-template-columns: 158px repeat(12, 1fr)` with a `column-gap`. Grid sizes rows to content reliably in Chromium.
- Render with Chromium through Playwright, which handles grid, flex and box shadow correctly. If you must fall back to WeasyPrint, use a real HTML table instead of grid or flex, because nested flex grow hangs the renderer and stretched flex rows overflow. A ready-made helper ships with this plugin: [scripts/render.mjs](../../scripts/render.mjs).
- Masthead: Defra green `#00a33b`. Use the real logo asset. **Never draw or approximate the royal crest.** If you have no asset, use a 4px green left bar with the department name in bold text.
- Colours: dark green ink `#00703C` for supply, blue `#1D70B8` for demand, purple `#4C2C92` for the to-be layer, amber `#F47738` for gaps and decision points, red `#D4351C` for pain markers, text `#0B0C0C`, secondary `#505A5F`, borders `#B1B4B6`.
- **Contrast must meet WCAG 2.2 AA.** Only use ink colours for text: purple 10.1:1, grey 7.1:1, dark green 6.2:1, blue 5.2:1, red 4.9:1 against white. Defra green `#00A33B` at 3.3:1 and amber `#F47738` at 2.8:1 are fills and bars, never text and never a thin line that is the only thing carrying a meaning. Amber cards always carry a word as well as the colour. Check with the WebAIM contrast checker.
- Exporting to Mural: render the PNG at 288dpi. At 144dpi it looks small once stretched across a board.
- Version every file v1, v2, v3 and keep the history. Remember that v10 sorts before v4 in a folder listing, so confirm which version someone is looking at before defending the work.

## Working it through with stakeholders

- Expect the first version to be told it does not align with something you have not seen. Ask for that document and restructure rather than defend.
- Take feedback as sticky notes, photograph the wall, and work through them one at a time. Say which version each note landed in.
- Expect "too busy" at least once. The fix is almost always removing boxes and colour, not moving things.
- Keep a design history and a decisions log. Defra expects [design histories](https://digital.defra.gov.uk/content/sharing-designs-recording-decisions) and a RAID log so people joining later can see why a decision was made.

## Quality process

- Draft the copy first and cut it short, then design.
- Render to an image and inspect it at full size before sharing. Look for text touching lines, cut off content, uneven gaps and cramped labels. Leave at least 15 to 20px of clear space between a label and the element it refers to.
- A file that overflows still renders without any error, so check the page count and the tail of the document.
- Keep every item in a group to the same line count so columns share a rhythm.
- Second pair of eyes before it goes out.

## Final checklist

- [ ] Two halves, each with a phase band worded as the person's goal.
- [ ] Target model mapped against the stages at the top, not appended at the bottom.
- [ ] What the target model does not cover is stated in amber across the columns it misses.
- [ ] Pain points use the stakeholders' own words.
- [ ] Only present-day items carry colour.
- [ ] Real system names, no personal names, no status pills, no bracket connectors.
- [ ] No measures row without real data.
- [ ] Contrast checked to WCAG 2.2 AA.
- [ ] Rendered and inspected at full size.
- [ ] One sentence you could say out loud that the artefact proves.
