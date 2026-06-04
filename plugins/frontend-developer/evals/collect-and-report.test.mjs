import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { diffSnapshots, snapshotFiles } from './collect-and-report.mjs'

test('diffSnapshots flags newly-added paths', () => {
  const before = 'aaa src/a.js\n'
  const after = 'aaa src/a.js\nbbb src/b.js\n'
  assert.deepEqual(diffSnapshots(before, after), ['src/b.js (new)'])
})

test('diffSnapshots flags paths whose hash changed', () => {
  const before = 'aaa src/a.js\n'
  const after = 'zzz src/a.js\n'
  assert.deepEqual(diffSnapshots(before, after), ['src/a.js (modified)'])
})

test('diffSnapshots ignores unchanged and removed paths', () => {
  const before = 'aaa src/a.js\nbbb src/gone.js\n'
  const after = 'aaa src/a.js\n'
  assert.deepEqual(diffSnapshots(before, after), [])
})

test('diffSnapshots treats an empty before-snapshot as all-new', () => {
  assert.deepEqual(diffSnapshots('', 'aaa src/a.js\n'), ['src/a.js (new)'])
})

test('diffSnapshots tolerates blank and malformed lines', () => {
  const after = '\naaa src/a.js\nnospacehere\n'
  assert.deepEqual(diffSnapshots('', after), ['src/a.js (new)'])
})

test('snapshotFiles writes a sorted hash+path listing for files under src/', () => {
  const dir = mkdtempSync(join(tmpdir(), 'snap-'))
  try {
    mkdirSync(join(dir, 'src', 'views'), { recursive: true })
    writeFileSync(join(dir, 'src', 'b.js'), 'b')
    writeFileSync(join(dir, 'src', 'views', 'a.njk'), 'a')
    const out = join(dir, 'snap.txt')
    snapshotFiles(out, dir)
    const lines = readFileSync(out, 'utf8').trimEnd().split('\n')
    // One "<sha256> <relpath>" entry per file under src/ (line order is by hash).
    assert.equal(lines.length, 2)
    for (const line of lines) {
      assert.match(line, /^[a-f0-9]{64} src\/.+$/)
    }
    const paths = lines.map((l) => l.slice(l.indexOf(' ') + 1)).sort()
    assert.deepEqual(paths, ['src/b.js', 'src/views/a.njk'])
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('snapshotFiles round-trips through diffSnapshots to detect a real edit', () => {
  const dir = mkdtempSync(join(tmpdir(), 'snap-'))
  try {
    mkdirSync(join(dir, 'src'), { recursive: true })
    writeFileSync(join(dir, 'src', 'a.js'), 'original')
    const before = join(dir, 'before.txt')
    snapshotFiles(before, dir)

    writeFileSync(join(dir, 'src', 'a.js'), 'changed')
    const after = join(dir, 'after.txt')
    snapshotFiles(after, dir)

    const changed = diffSnapshots(readFileSync(before, 'utf8'), readFileSync(after, 'utf8'))
    assert.deepEqual(changed, ['src/a.js (modified)'])
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})
