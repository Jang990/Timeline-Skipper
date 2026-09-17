// @vitest-environment jsdom
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { startWithFakes } from '../fixtures/fakes/startWithFakes.js'
import { find, findAll, loadTimeline, openEditRow, readText } from '../fixtures/fakes/panelHelpers.js'

const TIMELINE_COMMENT = ['00:00 첫 곡', '05:00 둘째 곡', '10:00 셋째 곡'].join('\n')

// 카드가 나란히 서는지, 시각이 바 아래에 놓이는지는 e2e가 맡는다. 여기서는 무엇이 어디에 담기는지만 본다.
const TIME_FIELDS = '.timeline-skip-time-fields'
const STEP_ROW = '.timeline-skip-step-row'
const STEP_LABEL = '.timeline-skip-step-label'
const START_INPUT = '.timeline-skip-time-input'
const END_INPUT = '.timeline-skip-end-input'
const END_HINT = '.timeline-skip-end-hint'
const PLAYBACK_CAPTION = '.timeline-skip-playback-caption'
const PLAYBACK_POSITION = '.timeline-skip-playback-position'
const END_HINT_TEXT = '끝을 비우면 다음 트랙이 시작할 때까지 재생합니다'
const PLAYHEAD_COLOR = 'var(--timeline-skip-color-playhead)'
const PRIMARY_TEXT_COLOR = 'var(--timeline-skip-color-text-primary)'

// jsdom 환경의 전역 URL은 jsdom의 것이라 node의 파일 도구와 섞이지 않는다. 파일 경로로만 계산한다.
const STYLES_DIRECTORY = resolve(dirname(fileURLToPath(import.meta.url)), '../../src/ui/styles')

describe('편집 시트의 시간 영역', () => {
  it('시작 칸과 끝 칸은 두 칸짜리 묶음 안에 함께 들어 있다', async () => {
    const extension = await startWithTimeline()

    openEditRow(extension, '둘째 곡')

    const fields = find(extension, TIME_FIELDS)
    expect(fields.querySelectorAll(STEP_ROW)).toHaveLength(2)
    expect(fields.querySelector(START_INPUT)).not.toBeNull()
    expect(fields.querySelector(END_INPUT)).not.toBeNull()
  })

  it('이름표와 시각 칸은 한 카드 안에 함께 들어 있다', async () => {
    const extension = await startWithTimeline()

    openEditRow(extension, '둘째 곡')

    const cards = findAll(extension, STEP_ROW)
    expect(cards.map((card) => card.querySelector(STEP_LABEL)?.textContent)).toEqual(['시작', '끝'])
    expect(cards[0].querySelector(START_INPUT)).not.toBeNull()
    expect(cards[1].querySelector(END_INPUT)).not.toBeNull()
  })

  it('시작·끝 칸 옆 버튼에는 "지금"이 적혀 있다', async () => {
    const extension = await startWithTimeline()

    openEditRow(extension, '둘째 곡')

    for (const field of ['시작', '끝']) {
      expect(find(extension, `button[aria-label="${field}을 지금 위치로"]`).textContent).toBe('지금')
    }
  })

  it('끝을 비우면 다음 트랙까지 재생한다는 안내가 시작·끝 칸 아래에 글자로 보인다', async () => {
    const extension = await startWithTimeline()

    openEditRow(extension, '둘째 곡')

    const hint = find(extension, END_HINT)
    expect(hint.textContent).toBe(END_HINT_TEXT)
    expect(find(extension, TIME_FIELDS).compareDocumentPosition(hint) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('가운데 재생 위치 아래에 "재생 위치" 이름표가 있다', async () => {
    const extension = await startWithTimeline()
    extension.player.playTo(400)

    openEditRow(extension, '둘째 곡')

    expect(readText(extension, PLAYBACK_CAPTION)).toBe('재생 위치')
    expect(readText(extension, PLAYBACK_POSITION)).toBe('06:40')
  })

  it('추가 시트에도 안내 글씨와 재생 위치 이름표가 보인다', async () => {
    const extension = await startWithTimeline()

    find(extension, '.timeline-skip-add').click()

    expect(readText(extension, END_HINT)).toBe(END_HINT_TEXT)
    expect(readText(extension, PLAYBACK_CAPTION)).toBe('재생 위치')
  })

  it('바 위의 재생 위치 선은 재생 위치 색 변수를 쓴다', () => {
    const playheadRule = readRule('rangeBar.css', '.timeline-skip-range-playhead')

    expect(playheadRule).toContain(`background: ${PLAYHEAD_COLOR}`)
  })

  it('가운데 재생 위치 글자는 재생 위치 색 대신 기본 글자색을 굵게 쓴다', () => {
    const positionRule = readRule('timeFields.css', '.timeline-skip-playback-position')

    expect(positionRule).toContain(`color: ${PRIMARY_TEXT_COLOR}`)
    expect(positionRule).toContain('font-weight: 700')
    expect(positionRule).not.toContain(PLAYHEAD_COLOR)
  })
})

async function startWithTimeline() {
  const extension = await startWithFakes()
  loadTimeline(extension, [TIMELINE_COMMENT])

  return extension
}

// 선택자 하나만 적힌 규칙들의 본문을 모두 이어 붙인다. 같은 선택자가 여러 번 나와도 함께 본다.
function readRule(fileName, selector) {
  const text = readFileSync(resolve(STYLES_DIRECTORY, fileName), 'utf8')
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

  return [...text.matchAll(new RegExp(`(?:^|\\n)${escaped}\\s*\\{([^}]*)\\}`, 'g'))].map((match) => match[1]).join('\n')
}
