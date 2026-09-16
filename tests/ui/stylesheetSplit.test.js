import { readdirSync, readFileSync } from 'node:fs'

import { describe, it, expect } from 'vitest'

const ROOT = new URL('../../', import.meta.url)
const STYLES_DIRECTORY = 'src/ui/styles/'
const MAX_LINES = 150

function readManifestStylesheets() {
  const manifest = JSON.parse(readFileSync(new URL('manifest.json', ROOT), 'utf8'))

  return manifest.content_scripts.flatMap((script) => script.css ?? [])
}

function readText(path) {
  return readFileSync(new URL(path, ROOT), 'utf8')
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

  it('스타일 파일은 각각 150줄을 넘지 않는다', () => {
    const stylesheets = readManifestStylesheets()

    const tooLong = stylesheets.filter((path) => readText(path).trimEnd().split('\n').length > MAX_LINES)

    expect(tooLong).toEqual([])
  })
})
