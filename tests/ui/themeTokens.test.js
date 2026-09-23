import { readFileSync } from 'node:fs'

import { describe, it, expect } from 'vitest'

const ROOT = new URL('../../', import.meta.url)

// 플랫폼마다 색 변수 이름이 다르다. 그 이름을 아는 파일은 플랫폼당 하나뿐이어야 한다.
const TOKENS_PATHS = ['src/ui/styles/tokens.youtube.css', 'src/ui/styles/tokens.chzzk.css']

// 유튜브 --yt-, 치지직 --sem- · --color-. 우리 이름(--timeline-skip-)과 겹치지 않는다.
const PLATFORM_VARIABLE = /var\(\s*--(yt|sem|ref|color)-/

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

function findDefinedNames(path) {
  return findAll(readText(path), /(--timeline-skip-color-[a-z-]+)\s*:/g)
}

// 유튜브는 색 변수 이름을 바꾼 적이 있다. 이름이 한 파일에만 있어야 다음에 바뀌어도 그 파일만 고친다.
describe('테마 색 변수', () => {
  it('토큰 파일 말고는 스타일 파일에 플랫폼 색 변수가 나오지 않는다', () => {
    const others = readManifestStylesheets().filter((path) => !TOKENS_PATHS.includes(path))

    const leaking = others.filter((path) => PLATFORM_VARIABLE.test(readText(path)))

    expect(others.length).toBeGreaterThan(0)
    expect(leaking).toEqual([])
  })

  it('스타일 파일이 쓰는 --timeline-skip-color- 변수는 모두 토큰 파일에 정의돼 있다', () => {
    const defined = new Set(TOKENS_PATHS.flatMap(findDefinedNames))

    const used = readManifestStylesheets().flatMap((path) =>
      findAll(readText(path), /var\(\s*(--timeline-skip-color-[a-z-]+)/g)
    )

    expect(used.length).toBeGreaterThan(0)
    expect([...new Set(used)].filter((name) => !defined.has(name))).toEqual([])
  })

  // 한쪽에만 있는 이름은 다른 플랫폼에서 빈 값이 된다. 그 플랫폼에서만 색이 빠져 보인다.
  it('두 플랫폼의 토큰 파일이 같은 이름의 변수를 정의한다', () => {
    const [youtubeNames, chzzkNames] = TOKENS_PATHS.map((path) => findDefinedNames(path).sort())

    expect(chzzkNames).toEqual(youtubeNames)
  })

  it('토큰 파일은 모두 manifest에 등록돼 있다', () => {
    const registered = readManifestStylesheets()

    expect(TOKENS_PATHS.filter((path) => !registered.includes(path))).toEqual([])
  })
})
