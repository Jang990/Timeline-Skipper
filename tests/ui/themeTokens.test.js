import { readFileSync } from 'node:fs'

import { describe, it, expect } from 'vitest'

const ROOT = new URL('../../', import.meta.url)
const TOKENS_PATH = 'src/ui/styles/tokens.css'

function readManifestStylesheets() {
  const manifest = JSON.parse(readFileSync(new URL('manifest.json', ROOT), 'utf8'))

  return manifest.content_scripts.flatMap((script) => script.css ?? [])
}

function readText(path) {
  return readFileSync(new URL(path, ROOT), 'utf8')
}

function findAll(text, pattern) {
  return [...text.matchAll(pattern)].map((match) => match[1])
}

// 유튜브는 색 변수 이름을 바꾼 적이 있다. 이름이 한 파일에만 있어야 다음에 바뀌어도 그 파일만 고친다.
describe('테마 색 변수', () => {
  it('tokens.css 말고는 스타일 파일에 유튜브 변수(--yt-)가 나오지 않는다', () => {
    const others = readManifestStylesheets().filter((path) => path !== TOKENS_PATH)

    const leaking = others.filter((path) => readText(path).includes('--yt-'))

    expect(others.length).toBeGreaterThan(0)
    expect(leaking).toEqual([])
  })

  it('스타일 파일이 쓰는 --timeline-skip-color- 변수는 모두 tokens.css에 정의돼 있다', () => {
    const defined = new Set(findAll(readText(TOKENS_PATH), /(--timeline-skip-color-[a-z-]+)\s*:/g))

    const used = readManifestStylesheets().flatMap((path) =>
      findAll(readText(path), /var\(\s*(--timeline-skip-color-[a-z-]+)/g)
    )

    expect(used.length).toBeGreaterThan(0)
    expect([...new Set(used)].filter((name) => !defined.has(name))).toEqual([])
  })
})
