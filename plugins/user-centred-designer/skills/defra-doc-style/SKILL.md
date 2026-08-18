---
name: defra-doc-style
description: >-
  Defra document and presentation design. Use when creating any document, slide deck, PowerPoint, HTML page, one-pager or written deliverable for Defra: GOV.UK style documents, GDS-aligned deliverables, decks for government audiences, personas, stakeholder updates, reports, or any request to write, design or review a professional document. Covers GOV.UK content design rules, the Defra style guide, visual standards, layout, and how to build and quality check slides, decks and pages.
license: OGL-UK-3.0
---

# Defra document and presentation design

The quality bar and content standards for AICE and Defra deliverables. These were built through iterative feedback on real documents. Consult this before producing anything. This is the single source for writing and visual rules. Two companion skills build on it: `defra-service-designer` for blueprints and journey maps, and `defra-interaction-content-designer` for prototypes and frontends on the Core Delivery Platform.

Think like a government designer. Every document should be able to sit alongside GOV.UK service pages and GDS design system documentation without looking out of place. Clarity over cleverness, structure over decoration, and a purpose behind every element.

The bar is high. Do not settle for good enough. Challenge your own output before presenting it.

## Writing style: GOV.UK content design

Non-negotiable. The canonical sources are the [GOV.UK content and publishing guidance](https://guidance.publishing.service.gov.uk/) and its [A to Z style guide](https://guidance.publishing.service.gov.uk/writing-to-gov-uk-standards/style-guides/a-to-z-style-guide/). The older `gov.uk/guidance/style-guide` pages are deprecated. Defra terminology sits in the [Defra style guide](https://digital.defra.gov.uk/content/defra-style-guide).

**Plain English is mandatory.** Short sentences. Active voice. Front-load the important information. Paragraphs of no more than 5 sentences. Split sentences over 25 words. Write for people who are intelligent but not specialists.

**No em dashes.** Never use em dashes or double hyphens. Restructure the sentence, or use a comma, colon or full stop. This is a consistent correction and it matters.

**Sentence case everywhere.** Headings, labels, button text, slide titles. Not Title Case, not block capitals except for short eyebrow labels and established acronyms.

**Acronyms.** Expand on first use, then use the acronym. House exception, not a published rule: DDAP is always just DDAP, never expanded. Use "digital professions" for informal description. Others to expand: Human in the Loop (HITL), Digital, Data and Technology Services (DDTS), Data Protection Impact Assessment (DPIA), User-Centred Design (UCD), Governance, Risk and Compliance (GRC), Core Delivery Platform (CDP).

**Be concise.** Government audiences are busy. Every word must earn its place. If you have written 3 lines, ask whether 2 would do. A bullet running to 3 sentences is too long.

**Defra terminology.** Say "people" wherever possible, avoid "users". Write Environment Agency, Forestry Commission and Natural England in full, never abbreviated. Do not capitalise "government", "minister", or "Defra" beyond its normal capital. Avoid mathematical symbols in sentences: "less than", not "<".

**Numbers and dates.** Numerals for everything except "one", unless a numeral makes more sense. Commas over 999. `%` for percentages. Use "to" in ranges, never hyphens or dashes: "500 to 900", "10am to 11am", "2011 to 2012". No comma between month and year: 4 June 2017.

**Contractions.** Positive contractions are fine (we've, there's, it's). Keep negatives expanded: "cannot", not "can't"; "have not", not "haven't".

**Links.** Front-load with relevant terms, make the purpose clear from the link text alone. Never "click here" or "more". Include format and size for documents: "Application form (PDF, 19.5KB)".

### Removing AI tells

Write like a content designer, not like a model.

- Ban the vocabulary: no "AI-shaped", "clean shape", "a natural fit", "genuinely mixed", "leverage", "robust", "seamless", "streamline", "underscore", "delve", "landscape", "holistic". Say what the thing actually does: sort, match, summarise, find patterns, spot duplicates.
- Break the parallelism. Do not run the same sentence template down every row or bullet. Vary the opening and the structure.
- No hedged both-sides padding unless it carries real meaning. Make the point and stop.
- Concrete over abstract. Name the real thing, not a generic description of it.
- Avoid editorialising adjectives in titles. "Milestones", not "Honestly held milestones".

## Visual design principles

**Room to breathe.** White space is a design tool. Dense text switches people off. Generous margins. Never fill available space just because it exists.

**Short, punchy text.** Card body text: 2 to 3 lines maximum, and every card in a group gets the same number of lines. Bullets: 1 to 2 sentences. If content spills, edit it shorter rather than making the container bigger.

**No cognitive overload.** One clear idea per slide or section. If a reader needs 30 seconds to understand it, it has too much on it.

**Content hierarchy.** The eye should flow top to bottom, left to right. Ask where the eye goes first, second, third. If the answer does not follow a natural path, redesign. A large element at the bottom that pulls attention before the middle content is a failure.

**Visual distinction between sections.** Different content types deserve different treatments. If the overview, the needs slide and the journey slide all use the same card layout, the audience loses their sense of where they are.

### Avoiding dead white space

Whitespace works around a content-sized element, never trapped inside a border.

- **Size boxes to content.** Never give a card a minimum height or a flex height-fill just to line up a row. Let it hug its text. To align a row, vertically centre the row as a block so the even space lands above and below the group, not inside each card.
- **For uneven lists, drop the boxes.** Use unboxed columns: a 4px coloured top rule, a heading, then stacked items. Uneven column lengths read as natural without borders.
- **Balance horizontally, not with a side rectangle.** An "in and out of scope" split as a left grid plus a tall right dashed box is always lopsided. Put the primary set as full-width columns across the top and the secondary set as a full-width tinted strip along the bottom. Two horizontal bands balance far better than two unequal columns.
- **Align to one grid.** Labels share a left edge, column tops align, consistent side margins. Misalignment by a few pixels reads as sloppy.

### Ruthless concision on one-pagers

- Header is an eyebrow label, a title, and at most one short subhead line. No provenance paragraph, no preamble.
- Cut "at a glance" cards that restate the table. The table is the summary.
- Drop per-row descriptions when the row label already says it.
- Justifications are short phrases of about 5 to 8 words, kept parallel in length.
- Put a red, amber or green verdict inline: coloured dot, word, phrase, on one line, so each column scans vertically.
- Target one page. Default to the lean version unless depth is asked for.

## Brand and colour

**On GOV.UK**, follow the GOV.UK Design System for headers, footers, fonts and logos.

**Off GOV.UK**, per [Defra branding](https://digital.defra.gov.uk/design/branding), you must not use the New Transport font, the GOV.UK header or Crown logo, or the GOV.UK footer. Use Helvetica or Arial font stacks, and the Defra or agency header, logo and footer. Logos in SVG where possible. Crest images must be ignored by screen readers.

**Never draw, trace or approximate the royal crest or any official logo.** An approximation reads as fake and damages credibility more than having no logo at all. If you do not have the real asset, use a 4px Defra green left bar with the department name in bold text, and ask for the image file.

**Palette.** Defra branding publishes exactly one colour, Defra green `#00A33B`, and says to keep colours "consistent with the GOV.UK frontend palette" and use Defra colours sparingly, for example in headers or navigation borders. Everything below except Defra green comes from the GOV.UK Design System palette. The tints are house values, so treat them as team convention rather than a Defra standard.

- Defra green `#00A33B`, tint `#E9F8EF`, dark green ink `#00703C`
- Blue `#1D70B8`, tint `#E8F1FB`
- Teal `#28A197`, tint `#E5F5F4`
- Purple `#4C2C92`, tint `#F1ECF8`
- Amber `#F47738`, tint `#FCF0E5`, reserved for decision points, gates and warnings
- Red `#D4351C`
- Text `#0B0C0C`, secondary `#505A5F`, borders `#B1B4B6`, light grey fill `#F3F2F1`

Assign one colour per category and use it everywhere that category appears: header fill, dots, tints, arrows. Consistency builds recognition.

### Contrast, tested

Defra branding is explicit: "You must make sure that the contrast ratio of text and interactive elements meets WCAG 2.2 level AA." Level AA needs 4.5:1 for normal text, 3:1 for large text (24px, or 18.66px bold) and 3:1 for non-text elements that carry meaning. Measured against white:

- **Safe as body text:** purple `#4C2C92` at 10.1:1, secondary grey `#505A5F` at 7.1:1, dark green `#00703C` at 6.2:1, blue `#1D70B8` at 5.2:1, red `#D4351C` at 4.9:1.
- **Not text colours:** Defra green `#00A33B` at 3.3:1, teal `#28A197` at 3.2:1, amber `#F47738` at 2.8:1. Use them as fills, bars and markers.
- **White on Defra green is 3.3:1**, so it passes only as large text. In the green masthead, keep white text at 18.66px bold or 24px regular and above. For any bar carrying small white text, use dark green `#00703C` at 6.2:1 instead.
- **Amber is a fill, not a line.** `#F47738` on white is 2.8:1, which fails the 3:1 non-text rule, so never let a thin amber rule or small amber dot be the only thing carrying a meaning. Use `#0B0C0C` text on an amber fill at 7.0:1 and always pair amber with a word.
- **Border grey `#B1B4B6` is decorative only** at 2.1:1. Never make it the sole boundary of a control, or the only marker distinguishing a category.

Check with the WebAIM contrast checker. Check colour blindness with Coblis. Never use colour as the only way to distinguish something.

## Slide format

16:9, 1280 by 720.

- **Header:** full-width Defra green bar, 92px tall. Logo left. Right-aligned context in white, team name bold on line one, project on line two. White on Defra green is 3.3:1, so that text must be large: 18.66px bold or 24px regular and above. If it needs to be smaller, make the bar dark green `#00703C`.
- **Title row:** small uppercase eyebrow label in dark green with letter spacing, then a 32px bold title, then a one-line grey subtitle.
- **Footer:** full-width light grey strip, 50px, with a 3px green top border. One takeaway on the left, "As at [date]" on the right. Keep footers date-only rather than adding a descriptive sentence.
- **Content area:** generous 48px side margins.
- **Bullet markers:** 8px coloured dots for delivery items, coloured arrows for asks. Never default bullet characters.
- **No status pillboxes or label chips as decoration.** If a state matters, say it in words. Pills read as an AI tell.

### Layout by content type

- **Methodology or approach.** Cards with a clear label, short heading and body text on 2 lines. Four across works well.
- **Overview or profile.** Context on the left, structured facts on the right, an accent band at the top carrying the title and one-liner, a compact summary statement at the bottom.
- **Needs or analysis.** Three columns such as goals, pain points, opportunities. Coloured dots as markers. 1 to 2 lines per item.
- **Journey or process.** Never a generic row of step cards. Use a GDS-style journey map with lanes and a timeline, or a segmented progress track: a row of bars showing complete, in progress and next, with unboxed columns beneath. Stage titles often carry the whole meaning without body text.
- **Timeline.** A Gantt with a fixed label column, bars as a percentage of the track, a dashed amber line and a rounded tag for a decision gate, solid bars for committed work and outlined bars for indicative. Keep the legend clear of the last lane and stop legend items wrapping. Gridlines belong in an overlay positioned over the track area, not calculated from the full width.
- **Options or menu.** A row-table with columns for the option, what you get, what it asks of the reader, and complexity or risk. Show escalation with small block meters filling one to four down the rows.
- **Summary.** Equal-sized cards with a badge, title and one-liner. Scannable, for orientation not depth.

## Building and quality checking

### Web pages and images

- Build the artefact as a single HTML file at the exact pixel size you need, with `@page { size: <w>px <h>px; margin: 0 }`.
- Render with Chromium through Playwright. It handles flex, CSS grid, box shadow and pagination correctly. Set the viewport to the design width and use a device scale factor of 2 for PNG. A ready-made helper ships with this plugin: [scripts/render.mjs](../../scripts/render.mjs).
- WeasyPrint is the fallback only. Its known traps: nested flex grow hangs the renderer, stretched flex rows overflow, gradients often render as nothing, empty divs do not paint so use a border for bottom bars, and bordered inline spans double-paint unless set to inline-block. For any multi-row data table use a real HTML table. Render at 192dpi so 1px borders land on whole pixels.
- Never mix shell file writes and editor changes on the same file in quick succession. It truncates the file, and a truncated file still renders without any warning.

### PowerPoint

- The house pattern is a **native editable file with real text boxes**, built with pptxgenjs, with the logo placed as an image. Never a screenshot of a slide pasted onto a slide.
- Quality check by converting to PDF with LibreOffice and then to images, and looking at every page.
- Deliver what was asked for. If someone asks for images, send images. The HTML is the source, not the deliverable.

### The check before you share

Render the result and inspect it at full size. Look for:

- text overflow, and content cut off at the bottom of a page
- elements nearly touching, and labels closer than 15 to 20 pixels to the line or dot they refer to
- lines or connectors passing through label text
- uneven gaps, misaligned rows, trapped white space
- low contrast
- uneven line counts within a group

A file that overflows renders successfully with no error, so always check the page count and the tail.

## Document structure and files

Three locations in a project folder:

- `Final or shared` for signed-off artefacts that have been sent out
- `Work in progress` for active working files, all versions
- `Input` for material received from stakeholders

Save new work to `Work in progress` first. Only move to `Final or shared` when it is explicitly confirmed as done.

Version files v1, v2, v3 and keep the history. Note that v10 sorts before v4 alphabetically, so the newest file is often not at the bottom of a listing. If someone says a change was not made, check which version they are looking at first.

## Data, personal information and names

- **Strip personal names from anything shareable.** Describe people by role, for example "a developer previously working on this service". Do not name the person the artefact is going to either. Attribute provenance to the team, not an individual. Names are fine in private working notes.
- **Remove all personal data before it goes into any AI tool.** Defra's [AI digital toolkit](https://digital.defra.gov.uk/ai-toolkit) calls this non-negotiable. See [using data with AI](https://digital.defra.gov.uk/ai-toolkit/guidance/using-data-with-ai) and [keeping data safe](https://digital.defra.gov.uk/ai-toolkit/guidance/keeping-data-safe). Use AI tools on OFFICIAL material by default. Research transcripts, screenshots, log files and production test data are named as off limits until redacted.
- **Check outputs too**, including generated HTML mockups and anything committed to a repository.
- **Every figure needs a source.** Numbers about a partner organisation come from their data, never from an estimate.

## Spreadsheets

Follow the [accessible spreadsheets guidance](https://digital.defra.gov.uk/content/accessible-spreadsheets) and the Government Analysis Function checklist it points to.

Separately, [Defra's data visualisation rules](https://digital.defra.gov.uk/design/data-visualisation) require that all essential data is available in a non-visual format such as text or a table, and that charts and maps are visual enhancements for people who choose to use them.

## How to challenge and improve

Challenge anything that does not make sense. If content is contradictory, unclear or could be better structured, say so. Do not just execute.

When presenting work, give the file and keep commentary short. The reader can read it themselves.

When receiving feedback, look for the underlying principle, not just the surface fix. "This is too wordy" is not about that paragraph, it is about your calibration for text density everywhere. Adjust your defaults, not just the current output.

## Final checklist

- [ ] No em dashes, sentence case throughout, acronyms expanded on first use
- [ ] Plain English, active voice, nothing over 25 words that could be split
- [ ] No AI tells, no repeated sentence templates
- [ ] Card text at the same line count across each group
- [ ] One idea per page, eye path checked
- [ ] No trapped white space, boxes sized to content
- [ ] One colour per category, used consistently, contrast checked to WCAG 2.2 AA
- [ ] Real logo asset or a text masthead, never an approximated crest
- [ ] No personal names, no personal data, every number sourced
- [ ] Rendered and inspected at full size
- [ ] Versioned, saved in the right folder, delivered in the format asked for
- [ ] Second pair of eyes before it goes out
