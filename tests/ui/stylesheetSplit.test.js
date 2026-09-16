import { createHash } from 'node:crypto'
import { readdirSync, readFileSync } from 'node:fs'

import { describe, it, expect } from 'vitest'

const ROOT = new URL('../../', import.meta.url)
const STYLES_DIRECTORY = 'src/ui/styles/'
const MAX_LINES = 150

// 분리 전 src/ui/panel.css와 src/ui/floating.css의 규칙으로 계산한 값.
// 파일을 나누는 일은 규칙을 옮기기만 해야 한다. 하나라도 고치거나 빠뜨리면 값이 달라진다.
const RULES_BEFORE_SPLIT = { count: 80, sha256: '39a78eae3e1d0a6aa6d1da7cca97466afa4df4a2c5b79b7231d1186c2123289a' }

function readManifestStylesheets() {
  const manifest = JSON.parse(readFileSync(new URL('manifest.json', ROOT), 'utf8'))

  return manifest.content_scripts.flatMap((script) => script.css ?? [])
}

function readText(path) {
  return readFileSync(new URL(path, ROOT), 'utf8')
}

// @media와 @keyframes는 안쪽까지 한 덩어리로 센다. 옮길 때 통째로 옮겨야 하는 단위라서다.
function splitTopLevelRules(cssText) {
  const withoutComments = cssText.replace(/\/\*[\s\S]*?\*\//g, '')
  const rules = []
  let depth = 0
  let start = 0

  for (let index = 0; index < withoutComments.length; index += 1) {
    const character = withoutComments[index]

    if (character === '{') {
      depth += 1
    } else if (character === '}') {
      depth -= 1

      if (depth === 0) {
        rules.push(withoutComments.slice(start, index + 1).replace(/\s+/g, ' ').trim())
        start = index + 1
      }
    }
  }

  return rules
}

// 순서는 비교하지 않는다. 부분별로 나누면 파일 사이의 순서는 바뀔 수밖에 없다.
function summarizeRules(paths) {
  const rules = paths.flatMap((path) => splitTopLevelRules(readText(path))).sort()

  return { count: rules.length, sha256: createHash('sha256').update(rules.join('\n')).digest('hex') }
}

describe('스타일 파일 분리', () => {
  it('manifest에 등록한 스타일 파일은 모두 src/ui/styles/ 안에 있다', () => {
    const stylesheets = readManifestStylesheets()

    expect(stylesheets.length).toBeGreaterThan(0)
    expect(stylesheets.filter((path) => !path.startsWith(STYLES_DIRECTORY))).toEqual([])
  })

  it('src/ui/styles/의 스타일 파일은 빠짐없이 manifest에 등록돼 있다', () => {
    const files = readdirSync(new URL(STYLES_DIRECTORY, ROOT)).filter((name) => name.endsWith('.css'))

    const registered = readManifestStylesheets()

    expect(files.map((name) => STYLES_DIRECTORY + name).sort()).toEqual([...registered].sort())
  })

  it('나눈 스타일 파일을 모두 합치면 분리 전과 같은 규칙을 같은 개수만큼 가진다', () => {
    const summary = summarizeRules(readManifestStylesheets())

    expect(summary).toEqual(RULES_BEFORE_SPLIT)
  })

  it('스타일 파일은 각각 150줄을 넘지 않는다', () => {
    const stylesheets = readManifestStylesheets()

    const tooLong = stylesheets.filter((path) => readText(path).trimEnd().split('\n').length > MAX_LINES)

    expect(tooLong).toEqual([])
  })
})
