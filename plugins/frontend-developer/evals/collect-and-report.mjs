// Shared collection and reporting library for provider scripts.
//
// `report` prints a single combined block to stdout that promptfoo asserts
// against. See CONTRIBUTING.md §Add behavioural fixtures for the format.

import { readFileSync, writeFileSync, statSync, readdirSync, existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { relative, join } from 'node:path'

function walk(dir) {
  const out = []
  const visit = (d) => {
    let entries
    try {
      entries = readdirSync(d)
    } catch {
      return
    }
    for (const name of entries) {
      const p = join(d, name)
      let s
      try {
        s = statSync(p)
      } catch {
        continue
      }
      if (s.isDirectory()) {
        visit(p)
      } else if (s.isFile()) {
        out.push(p)
      } else {
        // skip non-files, non-directories
      }
    }
  }
  visit(dir)
  return out
}

function findByExt(dir, ext) {
  return walk(dir)
    .filter((p) => p.endsWith(ext))
    .sort((a, b) => a.localeCompare(b))
}

// Hash every file under src/ into a sorted "<hash> <path>" listing.
export function snapshotFiles(outFile, cwd) {
  const root = join(cwd, 'src')
  const lines = []
  for (const file of walk(root).sort((a, b) => a.localeCompare(b))) {
    let buf
    try {
      buf = readFileSync(file)
    } catch {
      continue
    }
    const hash = createHash('sha256').update(buf).digest('hex')
    lines.push(`${hash} ${relative(cwd, file)}`)
  }
  lines.sort((a, b) => a.localeCompare(b))
  writeFileSync(outFile, lines.join('\n') + (lines.length ? '\n' : ''))
}

// Parse a snapshot listing ("<hash> <path>" per line) into a path->hash map.
function parseSnapshot(text) {
  const map = new Map()
  for (const line of text.split('\n')) {
    if (line) {
      const space = line.indexOf(' ')
      if (space >= 0) {
        map.set(line.slice(space + 1), line.slice(0, space))
      }
    }
  }
  return map
}

// Diff two snapshot listings. New paths are flagged "(new)"; paths in both
// whose hash changed are flagged "(modified)".
export function diffSnapshots(beforeText, afterText) {
  const before = parseSnapshot(beforeText)
  const after = parseSnapshot(afterText)
  const out = []
  for (const [path, hash] of after) {
    if (before.has(path)) {
      if (before.get(path) !== hash) {
        out.push(`${path} (modified)`)
      }
    } else {
      out.push(`${path} (new)`)
    }
  }
  return out
}

// Diff two snapshot files. An absent file is treated as an empty snapshot.
function filesChanged(beforePath, afterPath) {
  const read = (p) => (existsSync(p) ? readFileSync(p, 'utf8') : '')
  return diffSnapshots(read(beforePath), read(afterPath))
}

export function report({ agentLabel, agentOutput, snapBefore, cwd, tmpAfterPath }) {
  snapshotFiles(tmpAfterPath, cwd)
  const changed = filesChanged(snapBefore, tmpAfterPath)

  const njkFiles = findByExt(join(cwd, 'src', 'views'), '.njk')
  const jsFiles = findByExt(join(cwd, 'src', 'routes'), '.js')

  const readBlock = (files) =>
    files.map((f) => `\n--- ${relative(cwd, f)} ---\n${readFileSync(f, 'utf8')}`).join('')

  const lint = spawnSync('npm', ['run', 'lint', '--silent'], { cwd, encoding: 'utf8' })
  const lintExit = lint.status ?? 1
  const lintOutput = `${lint.stdout ?? ''}${lint.stderr ?? ''}`

  const test = spawnSync('npm', ['test', '--silent'], { cwd, encoding: 'utf8' })
  const testExit = test.status ?? 1
  const testOutput = `${test.stdout ?? ''}${test.stderr ?? ''}`

  const out = [
    `=== ${agentLabel} OUTPUT ===`,
    agentOutput,
    '',
    '=== NJK TEMPLATES ===',
    readBlock(njkFiles),
    '',
    '=== JS ROUTES ===',
    readBlock(jsFiles),
    '',
    '=== FILES CHANGED ===',
    changed.join('\n'),
    '',
    '=== LINT ===',
    `exit_code: ${lintExit}`,
    lintOutput,
    '',
    '=== TESTS ===',
    `exit_code: ${testExit}`,
    testOutput
  ]

  process.stdout.write(out.join('\n'))
}
