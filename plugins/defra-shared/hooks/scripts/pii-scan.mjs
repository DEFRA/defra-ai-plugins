#!/usr/bin/env node
// Warn (async, non-blocking) when a written file contains UK PII patterns.
// NHS-number candidates are validated with the Mod-11 check digit so generic
// 10-digit numbers (phone numbers, order ids) don't false-positive.

import { readFileSync, existsSync } from 'node:fs'
import { basename } from 'node:path'
import { fileURLToPath } from 'node:url'
import { runHook } from './hook-runner.mjs'

const SKIP_PATTERNS = [/\.lock$/, /lock\.json$/, /\.snap$/, /\/eval-fixture\/fixtures\//]

function isValidNhs(digits) {
  if (digits.length !== 10) {
    return false
  }
  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += Number(digits[i]) * (10 - i)
  }
  let check = 11 - (sum % 11)
  if (check === 11) {
    check = 0
  }
  if (check === 10) {
    return false
  }
  return check === Number(digits[9])
}

/**
 * Warn (non-blocking) when a written file contains UK PII patterns.
 * Skips lock files, snapshots, and eval-fixture fixture paths.
 *
 * @param {string} file - Absolute or relative path to the file to scan.
 * @param {(path: string) => string} [readFile] - Override for reading file contents (default: fs.readFileSync).
 * @param {(path: string) => boolean} [fileExists] - Override for existence check (default: fs.existsSync).
 * @returns {{ exitCode: number, stderr?: string }}
 */
export function scan(file, readFile = (f) => readFileSync(f, 'utf8'), fileExists = existsSync) {
  if (!file || !fileExists(file)) {
    return { exitCode: 0 }
  }
  if (SKIP_PATTERNS.some((re) => re.test(file))) {
    return { exitCode: 0 }
  }

  const content = readFile(file)
  const hits = []

  if (/\b[A-CEGHJ-PR-TW-Z]{2}[0-9]{6}[A-D]\b/.test(content)) {
    hits.push('UK-NI-number')
  }

  const nhsCandidates = content.match(/\b[0-9]{3}[ -]?[0-9]{3}[ -]?[0-9]{4}\b/g) || []
  const nhsHit = nhsCandidates.map((c) => c.replace(/[ -]/g, '')).some((d) => isValidNhs(d))
  if (nhsHit) {
    hits.push('NHS-number')
  }

  if (/\b[A-Z]{1,2}[0-9R][0-9A-Z]?[ ]?[0-9][ABD-HJLNP-UW-Z]{2}\b/.test(content)) {
    hits.push('UK-postcode')
  }

  if (/\b(0[1-9]|[12][0-9]|3[01])[/-](0[1-9]|1[0-2])[/-](19|20)[0-9]{2}\b/.test(content)) {
    hits.push('DoB')
  }

  if (hits.length === 0) {
    return { exitCode: 0 }
  }

  return {
    exitCode: 0,
    stderr: `pii-scan: possible PII in ${basename(file)}: ${hits.join(' ')}. Review and redact before logging or persisting. See skill defra-security-pii.\n`
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runHook((input) => scan(input.tool_input?.file_path ?? ''))
}
