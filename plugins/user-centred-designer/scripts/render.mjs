#!/usr/bin/env node
/**
 * Render an HTML artefact to PNG (and optionally PDF) with Playwright Chromium.
 *
 * The user-centred-designer skills build artefacts as fixed-size HTML pages (a slide is
 * 1280 by 720, a blueprint is A3 landscape or wider). This script turns that
 * HTML into an image you can inspect, share, or paste into Mural: the
 * "render it and look at it" step of the artefact loop.
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
 *   --allow-network  permit the page to fetch remote resources while
 *            rendering. Off by default: house-style artefacts are
 *            self-contained single files, so nothing should leave the
 *            machine during a render.
 *
 * A file that overflows its page still renders without an error, so always open
 * the output at full size and check the edges before sharing.
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
import { chromium } from 'playwright'

function parseArgs(argv) {
  const parsed = { scale: 2, png: null, pdf: null, input: null, allowNetwork: false }
  let i = 0
  while (i < argv.length) {
    const arg = argv[i]
    i += 1
    if (arg === '--allow-network') {
      parsed.allowNetwork = true
    } else if (arg === '--png') {
      parsed.png = argv[i]
      i += 1
    } else if (arg === '--pdf') {
      parsed.pdf = argv[i]
      i += 1
    } else if (arg === '--scale') {
      parsed.scale = Number(argv[i])
      i += 1
    } else if (!arg.startsWith('--') && !parsed.input) {
      parsed.input = arg
    } else {
      // Ignore anything unrecognised; the input check below reports usage errors.
    }
  }
  return parsed
}

const args = parseArgs(process.argv.slice(2))
if (!args.input || !existsSync(args.input)) {
  console.error('Usage: node render.mjs <input.html> [--png out.png] [--pdf out.pdf] [--scale N]')
  process.exit(1)
}
if (!Number.isFinite(args.scale) || args.scale <= 0) {
  console.error(`Invalid --scale value; expected a positive number`)
  process.exit(1)
}
const input = resolve(args.input)
const pngPath = args.png ?? input.replace(/\.html?$/i, '.png')

const launchOptions = {}
if (process.env.CHROMIUM_PATH) {
  if (!existsSync(process.env.CHROMIUM_PATH)) {
    console.error(`CHROMIUM_PATH is set but no file exists at: ${process.env.CHROMIUM_PATH}`)
    process.exit(1)
  }
  launchOptions.executablePath = process.env.CHROMIUM_PATH
}
const browser = await chromium.launch(launchOptions)
try {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: args.scale
  })
  const page = await context.newPage()
  if (!args.allowNetwork) {
    // Block everything that is not a local file. Artefacts are self-contained
    // by house style; a render should never reach the network.
    await page.route('**/*', (route) => {
      const url = route.request().url()
      if (url.startsWith('file://')) {
        return route.continue()
      }
      console.warn(`Blocked non-local request during render: ${url}`)
      return route.abort()
    })
  }
  await page.goto(pathToFileURL(input).href, { waitUntil: 'networkidle' })

  // Size the viewport to the document's real laid-out size (CSS pixels are
  // unaffected by deviceScaleFactor), then capture the full page.
  const size = await page.evaluate(() => ({
    width: Math.ceil(Math.max(document.documentElement.scrollWidth, document.body.scrollWidth)),
    height: Math.ceil(Math.max(document.documentElement.scrollHeight, document.body.scrollHeight))
  }))
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
