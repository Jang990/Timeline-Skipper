// @vitest-environment jsdom
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { startWithFakes } from '../fixtures/fakes/startWithFakes.js'
import { loadTimeline } from '../fixtures/fakes/panelHelpers.js'

const TIMELINE_COMMENT = ['00:00 첫 곡', '05:00 둘째 곡', '10:00 셋째 곡'].join('\n')

const FLOATING = '#timeline-skip-floating'
const ICON = `${FLOATING} .timeline-skip-floating-icon`
const HANDLE = `${FLOATING} .timeline-skip-floating-handle`
const HANDLE_CLASS = '.timeline-skip-floating-handle'

// jsdom 환경의 전역 URL은 jsdom의 것이라 node의 파일 도구와 섞이지 않는다. 파일 경로로만 계산한다.
const STYLES_DIRECTORY = resolve(dirname(fileURLToPath(import.meta.url)), '../../src/ui/styles')

// 끌어서 옮겨지는지는 floatingDrag.test.js가 본다. 여기서는 손잡이가 무엇을 담고 어떻게 보이는지만 본다.
describe('떠 있는 위젯의 손잡이', () => {
  it('손잡이에는 "끌어서 옮기기" 툴팁이 있고, 막대 그림과 잡는 점을 함께 담는다', async () => {
    await startExpanded()

    const handle = document.querySelector(HANDLE)

    expect(handle.title).toBe('끌어서 옮기기')
    expect(handle.querySelector('.timeline-skip-equalizer')).not.toBeNull()
    expect(handle.querySelectorAll('svg[data-icon="grip"]')).toHaveLength(1)
  })

  it('잡는 점은 평소 숨어 있다가 손잡이에 마우스를 올리면 막대 그림 대신 보인다', () => {
    const styles = readStyles('floatingHandle.css')

    expect(readRule(styles, `${HANDLE_CLASS} .timeline-skip-icon`)).toContain('display: none')
    expect(readRule(styles, `${HANDLE_CLASS}:hover .timeline-skip-equalizer`)).toContain('display: none')
    expect(readRule(styles, `${HANDLE_CLASS}:hover .timeline-skip-icon`)).toContain('display: block')
  })

  it('잡는 커서는 손잡이에만 걸리고 카드 전체에는 걸리지 않는다', () => {
    const handleStyles = readStyles('floatingHandle.css')
    const floatingStyles = readStyles('floating.css')

    expect(readRule(handleStyles, HANDLE_CLASS)).toContain('cursor: grab')
    expect(floatingStyles).not.toContain('cursor: grab')
  })
})

async function startExpanded() {
  const extension = await startWithFakes()
  loadTimeline(extension, [TIMELINE_COMMENT])
  extension.player.playTo(120)
  document.querySelector(ICON).click()

  return extension
}

function readStyles(fileName) {
  return readFileSync(resolve(STYLES_DIRECTORY, fileName), 'utf8')
}

// 선택자 목록 어디에든 그 선택자가 끝으로 들어 있는 규칙의 본문을 모두 이어 붙인다.
// PiP를 가르는 앞머리(#timeline-skip-floating:not(...))는 보지 않는다.
function readRule(styles, selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const pattern = new RegExp(`(?:^|[\\s,])${escaped}\\s*(?:,[^{]*)?\\{([^}]*)\\}`, 'g')

  return [...styles.matchAll(pattern)].map((match) => match[1]).join('\n')
}
