#!/usr/bin/env node
/**
 * Render an HTML artefact to PNG (and optionally PDF) with Playwright Chromium.
 *
 * The user-centred-designer skills build artefacts as fixed-size HTML pages (a
 * slide is 1280 by 720, a blueprint is A3 landscape or wider). This script
 * turns that HTML into an image you can inspect, share, or paste into Mural:
 * the "render it and look at it" step of the artefact loop.
 *
 * One-time setup in your working folder:
 *   npm install playwright
 *   npx playwright install chromium
 *
 * Usage:
 *   node render.mjs <input.html> [--png out.png] [--pdf out.pdf] [--scale N]
 *
 *   --png    output PNG path (default: input name with .png)
 *   --pdf    also write a PDF, honouring any @page size in the CSS
 *   --scale  pixel density multiplier (default 2 ≈ 192dpi;
 *            use 3 ≈ 288dpi for images going into Mural)
 *
 * Renders are always offline. Artefacts are self-contained single files by
 * house style, so every request that is not a local file is blocked and
 * logged. If a render ever genuinely needs remote resources, that decision
 * belongs to the agent harness and its approval controls, not to this script.
 *
 * A file that overflows its page still renders without an error, so always
 * open the output at full size and check the edges before sharing.
 *
 * If the Chromium download is blocked (corporate proxy), point CHROMIUM_PATH
 * at any installed Chromium-based browser instead. On a Defra Windows
 * machine, Microsoft Edge works:
 *   PowerShell:  $env:CHROMIUM_PATH = 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
 *   cmd:         set CHROMIUM_PATH=C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe
 */
import { existsSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'
import { parseArgs as parseNodeArgs } from 'node:util'
import { chromium } from 'playwright'

const USAGE = 'Usage: node render.mjs <input.html> [--png out.png] [--pdf out.pdf] [--scale N]'

/**
 * Parses and validates CLI args in one pass. node:util's parseArgs owns flag
 * syntax (missing values, --flag=value, unknown flags); everything below it
 * is domain-specific validation that a generic parser can't know. Throws a
 * descriptive Error on any failure.
 */
function parseArgs(argv) {
  const { values, positionals } = parseNodeArgs({
    args: argv,
    options: {
      png: { type: 'string' },
      pdf: { type: 'string' },
      scale: { type: 'string', default: '2' }
    },
    allowPositionals: true
  })

  const scale = Number(values.scale)
  if (!Number.isFinite(scale) || scale <= 0) {
    throw new Error(`Invalid --scale value "${values.scale}"; expected a positive number`)
  }

  const input = positionals[0] ?? null
  if (!input) {
    throw new Error(`No input file given.\n${USAGE}`)
  }
  if (!existsSync(input)) {
    throw new Error(`Input file not found: ${input}\n${USAGE}`)
  }

  return {
    scale,
    png: values.png ?? null,
    pdf: values.pdf ?? null,
    input
  }
}

/** Resolves Playwright launch options, honouring CHROMIUM_PATH if set. */
function resolveLaunchOptions() {
  const chromiumPath = process.env.CHROMIUM_PATH
  if (!chromiumPath) {
    return {}
  }
  if (!existsSync(chromiumPath)) {
    throw new Error(`CHROMIUM_PATH is set but no file exists at: ${chromiumPath}`)
  }
  return { executablePath: chromiumPath }
}

/** Blocks every request that isn't a local file:// load. */
async function blockRemoteRequests(page) {
  await page.route('**/*', (route) => {
    const url = route.request().url()
    if (url.startsWith('file://')) {
      return route.continue()
    }
    console.warn(`Blocked non-local request during render: ${url}`)
    return route.abort()
  })
}

/**
 * Reads the document's actual laid-out size in CSS pixels. CSS pixels are
 * unaffected by deviceScaleFactor, so this is independent of --scale.
 */
async function measureDocumentSize(page) {
  return page.evaluate(() => ({
    width: Math.ceil(Math.max(document.documentElement.scrollWidth, document.body.scrollWidth)),
    height: Math.ceil(Math.max(document.documentElement.scrollHeight, document.body.scrollHeight))
  }))
}

async function render(args) {
  const input = resolve(args.input)
  const pngPath = args.png ?? input.replace(/\.html?$/i, '.png')

  const browser = await chromium.launch(resolveLaunchOptions())
  try {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      deviceScaleFactor: args.scale
    })
    const page = await context.newPage()
    await blockRemoteRequests(page)
    await page.goto(pathToFileURL(input).href, { waitUntil: 'networkidle' })

    // Size the viewport to the document's real laid-out size before capturing.
    const size = await measureDocumentSize(page)
    await page.setViewportSize(size)
    await page.screenshot({ path: pngPath, fullPage: true })
    console.log(`PNG  ${pngPath}  (${size.width}x${size.height} css px at ${args.scale}x)`)

    if (args.pdf) {
      await page.pdf({
        path: args.pdf,
        preferCSSPageSize: true,
        printBackground: true,
        margin: { top: '0', bottom: '0', left: '0', right: '0' }
      })
      console.log(`PDF  ${args.pdf}`)
    }
  } finally {
    await browser.close()
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  await render(args)
}

try {
  await main()
} catch (err) {
  console.error(err.message ?? err)
  process.exit(1)
}
