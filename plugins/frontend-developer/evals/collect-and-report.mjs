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
      }
    }
  }
  visit(dir)
  return out
}

function findByExt(dir, ext) {
  return walk(dir)
    .filter((p) => p.endsWith(ext))
    .sort()
}

// Hash every file under src/ into a sorted "<hash> <path>" listing.
export function snapshotFiles(outFile, cwd) {
  const root = join(cwd, 'src')
  const lines = []
  for (const file of walk(root).sort()) {
    let buf
    try {
      buf = readFileSync(file)
    } catch {
      continue
    }
    const hash = createHash('md5').update(buf).digest('hex')
    lines.push(`${hash} ${relative(cwd, file)}`)
  }
  writeFileSync(outFile, lines.sort().join('\n') + (lines.length ? '\n' : ''))
}

// Parse a snapshot listing ("<hash> <path>" per line) into a path->hash map.
function parseSnapshot(text) {
  const map = new Map()
  for (const line of text.split('\n')) {
    if (!line) {
      continue
    }
    const space = line.indexOf(' ')
    if (space < 0) {
      continue
    }
    map.set(line.slice(space + 1), line.slice(0, space))
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
    if (!before.has(path)) {
      out.push(`${path} (new)`)
    } else if (before.get(path) !== hash) {
      out.push(`${path} (modified)`)
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

  const out = []
  out.push(`=== ${agentLabel} OUTPUT ===`)
  out.push(agentOutput)
  out.push('')
  out.push('=== NJK TEMPLATES ===')
  out.push(readBlock(njkFiles))
  out.push('')
  out.push('=== JS ROUTES ===')
  out.push(readBlock(jsFiles))
  out.push('')
  out.push('=== FILES CHANGED ===')
  out.push(changed.join('\n'))
  out.push('')
  out.push('=== LINT ===')
  out.push(`exit_code: ${lintExit}`)
  out.push(lintOutput)
  out.push('')
  out.push('=== TESTS ===')
  out.push(`exit_code: ${testExit}`)
  out.push(testOutput)

  process.stdout.write(out.join('\n'))
}
