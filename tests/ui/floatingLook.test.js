// @vitest-environment jsdom
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { startWithFakes } from '../fixtures/fakes/startWithFakes.js'
import { clickButton, fillInput, find, loadTimeline } from '../fixtures/fakes/panelHelpers.js'

// 첫 곡이 01:00에 시작해서 0초는 어느 트랙에도 속하지 않는다.
const TIMELINE_COMMENT = ['01:00 첫 곡', '05:00 둘째 곡', '10:00 셋째 곡'].join('\n')

// 줄이 어디에 놓이는지는 e2e가 맡는다. 여기서는 무엇이 그려지고 무엇이 적히는지만 본다.
const FLOATING = '#timeline-skip-floating'
const ICON = `${FLOATING} .timeline-skip-floating-icon`
const CARD = `${FLOATING} .timeline-skip-floating-card`
const TITLE = `${FLOATING} .timeline-skip-floating-title`
const META = `${FLOATING} .timeline-skip-floating-meta`
const COLLAPSE = `${FLOATING} .timeline-skip-floating-collapse`
const JUMP = `${FLOATING} .timeline-skip-floating-jump`
const EQUALIZER = '.timeline-skip-equalizer'

// jsdom 환경의 전역 URL은 jsdom의 것이라 node의 파일 도구와 섞이지 않는다. 파일 경로로만 계산한다.
const FLOATING_STYLES = resolve(dirname(fileURLToPath(import.meta.url)), '../../src/ui/styles/floating.css')

describe('떠 있는 위젯의 모양', () => {
  it('접힌 아이콘은 글자 대신 막대 그림을 그리고, 그 그림은 화면 낭독기에 읽히지 않는다', async () => {
    await startWithTimeline()

    const icon = query(ICON)

    expect(icon.textContent).toBe('')
    expect(icon.querySelector(EQUALIZER).getAttribute('aria-hidden')).toBe('true')
    expect(icon.getAttribute('aria-label')).toBe('플레이어 펼치기')
  })

  it('펼친 위젯의 제목 앞에 막대 그림이 있고, 화면 낭독기에 읽히지 않는다', async () => {
    const extension = await startWithTimeline()
    extension.player.playTo(400)

    query(ICON).click()

    const equalizer = query(`${CARD} ${EQUALIZER}`)
    expect(equalizer.getAttribute('aria-hidden')).toBe('true')
    expect(equalizer.compareDocumentPosition(query(TITLE)) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('제목 아래에 "순번 / 트랙 수 · 시작 – 끝"이 적혀 있다', async () => {
    const extension = await startWithTimeline()
    extension.player.playTo(400)

    query(ICON).click()

    expect(query(TITLE).textContent).toBe('둘째 곡')
    expect(query(META).textContent).toBe('2 / 3 · 05:00 – 10:00')
  })

  it('영상 길이를 모르면 마지막 트랙의 순번 줄에는 시작 시각만 적힌다', async () => {
    const extension = await startWithTimeline({ durationSeconds: Number.NaN })
    extension.player.playTo(700)

    query(ICON).click()

    expect(query(META).textContent).toBe('3 / 3 · 10:00')
  })

  it('첫 트랙 앞에서는 순번 줄이 없다', async () => {
    await startWithTimeline()

    query(ICON).click()

    expect(query(TITLE).textContent).toBe('트랙 밖 구간')
    expect(query(META)).toBeNull()
  })

  it('트랙을 추가하면 순번 줄의 트랙 수가 따라 바뀐다', async () => {
    const extension = await startWithTimeline()
    extension.player.playTo(400)
    query(ICON).click()

    find(extension, '.timeline-skip-add').click()
    fillInput(extension, '.timeline-skip-title-input', '끼운 곡')
    clickButton(extension, '저장')

    expect(query(TITLE).textContent).toBe('끼운 곡')
    expect(query(META).textContent).toBe('3 / 4 · 06:40 – 10:00')
  })

  it('접기 버튼은 글자 대신 아래 화살표 아이콘을 그린다', async () => {
    await startWithTimeline()

    query(ICON).click()

    const collapse = query(COLLAPSE)
    expect(collapse.textContent).toBe('')
    expect(collapse.querySelectorAll('svg[data-icon="chevron-down"]')).toHaveLength(1)
    expect(collapse.getAttribute('aria-label')).toBe('플레이어 접기')
  })

  it('목록 보기 버튼에는 "목록 보기"가 적혀 있고 위 화살표 아이콘이 있다', async () => {
    await startWithTimeline()

    query(ICON).click()

    const jump = query(JUMP)
    expect(jump.textContent).toBe('목록 보기')
    expect(jump.querySelectorAll('svg[data-icon="chevron-up"]')).toHaveLength(1)
    expect(jump.getAttribute('aria-label')).toBe('타임라인 목록으로 이동')
  })

  it('접힌 아이콘의 바탕은 강조색이 아니라 메뉴 바탕색이다', () => {
    const iconRule = readRule('.timeline-skip-floating-icon')

    expect(iconRule).toContain('background: var(--timeline-skip-color-menu-background)')
    expect(iconRule).not.toContain('--timeline-skip-color-accent')
  })
})

async function startWithTimeline(options) {
  const extension = await startWithFakes(options)
  loadTimeline(extension, [TIMELINE_COMMENT])

  return extension
}

function query(selector) {
  return document.querySelector(selector)
}

// 선택자 하나만 적힌 규칙들의 본문을 모두 이어 붙인다. 같은 선택자가 여러 번 나와도 함께 본다.
function readRule(selector) {
  const text = readFileSync(FLOATING_STYLES, 'utf8')
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

  return [...text.matchAll(new RegExp(`(?:^|\\n)${escaped}\\s*\\{([^}]*)\\}`, 'g'))].map((match) => match[1]).join('\n')
}
