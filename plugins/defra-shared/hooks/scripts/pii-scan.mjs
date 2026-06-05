#!/usr/bin/env node
// Warn (async, non-blocking) when a written file contains UK PII patterns.
// NHS-number candidates are validated with the Mod-11 check digit so generic
// 10-digit numbers (phone numbers, order ids) don't false-positive.

import { readFileSync, existsSync } from 'node:fs'
import { basename } from 'node:path'
import { fileURLToPath } from 'node:url'
import { runHook } from './hook-runner.mjs'

const SKIP_PATTERNS = [/\.lock$/, /lock\.json$/, /\.snap$/, /\/eval-fixture\/fixtures\//]

const NHS_LOOP_LIMIT = 9
const NHS_MODULUS = 11

function isValidNhs(digits) {
  if (digits.length !== 10) {
    return false
  }
  let sum = 0
  for (let i = 0; i < NHS_LOOP_LIMIT; i++) {
    sum += Number(digits[i]) * (10 - i)
  }
  let check = NHS_MODULUS - (sum % NHS_MODULUS)
  if (check === NHS_MODULUS) {
    check = 0
  }
  if (check === 10) {
    return false
  }
  return check === Number(digits[NHS_LOOP_LIMIT])
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

  if (/\b[A-CEGHJ-PR-TW-Z]{2}\d{6}[A-D]\b/.test(content)) {
    hits.push('UK-NI-number')
  }

  const nhsCandidates = content.match(/\b\d{3}[ -]?\d{3}[ -]?\d{4}\b/g) || []
  const nhsHit = nhsCandidates.map((c) => c.replace(/[ -]/g, '')).some((d) => isValidNhs(d))
  if (nhsHit) {
    hits.push('NHS-number')
  }

  if (/\b[A-Z]{1,2}[\dR][\dA-Z]? ?\d[ABD-HJLNP-UW-Z]{2}\b/.test(content)) {
    hits.push('UK-postcode')
  }

  if (/\b(0[1-9]|[12]\d|3[01])[/-](0[1-9]|1[0-2])[/-](19|20)\d{2}\b/.test(content)) {
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
