import { readFileSync } from 'node:fs'

import { describe, it, expect } from 'vitest'

const ROOT = new URL('../../', import.meta.url)

// 모서리와 빈자리는 CSS 규칙 하나로 정해진다. 픽셀을 재는 대신 규칙을 글자로 읽는다.
function readRule(path, selector) {
  const text = readFileSync(new URL(path, ROOT), 'utf8')
  const start = text.indexOf(`${selector} {`)

  return start === -1 ? null : text.slice(start, text.indexOf('}', start))
}

describe('편집 시트의 모양', () => {
  it('편집 시트는 네 모서리가 모두 둥글다', () => {
    const rule = readRule('src/ui/styles/editSheet.css', '.timeline-skip-edit-sheet')

    expect(rule).toMatch(/border-radius:\s*16px;/)
  })

  it('시트가 열리면 추가 칸은 자리를 남기지 않고 빠진다', () => {
    const rule = readRule('src/ui/styles/trackList.css', '.timeline-skip-list-area.is-editing .timeline-skip-add-row')

    expect(rule).toMatch(/display:\s*none;/)
  })

  it('시트가 열리면 목록은 빠진 추가 칸의 높이만큼 늘어난다', () => {
    const rule = readRule('src/ui/styles/trackList.css', '.timeline-skip-list-area.is-editing .timeline-skip-list')

    expect(rule).toMatch(/max-height:\s*calc\(480px \+ var\(--timeline-skip-add-row-height/)
  })
})
