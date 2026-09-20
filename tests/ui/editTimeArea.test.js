// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { startWithFakes } from '../fixtures/fakes/startWithFakes.js'
import { clickButton, find, findAll, loadTimeline, openEditRow, readTexts } from '../fixtures/fakes/panelHelpers.js'

const TIMELINE_COMMENT = ['00:00 첫 곡', '05:00 둘째 곡', '10:00 셋째 곡'].join('\n')

// 카드가 어디에 놓이는지는 e2e가 맡는다. 여기서는 무엇이 담기고 무엇이 없는지만 본다.
const TIME_FIELDS = '.timeline-skip-time-fields'
const STEP_ROW = '.timeline-skip-step-row'
const STEP_LABEL = '.timeline-skip-step-label'
const START_INPUT = '.timeline-skip-time-input'
const STEP_BUTTON = '.timeline-skip-step'
const SEEK_PAIR = '.timeline-skip-seek-pair'

describe('편집 시트의 시간 영역', () => {
  it('시각 칸은 하나뿐이고 이름표와 한 카드 안에 들어 있다', async () => {
    const extension = await startWithTimeline()

    openEditRow(extension, '둘째 곡')

    const cards = findAll(extension, STEP_ROW)
    expect(cards).toHaveLength(1)
    expect(cards[0].querySelector(STEP_LABEL).textContent).toBe('시작')
    expect(cards[0].querySelector(START_INPUT)).not.toBeNull()
  })

  it('시각 칸 옆에는 지금·시작으로·끝으로 버튼이 있다', async () => {
    const extension = await startWithTimeline()

    openEditRow(extension, '둘째 곡')

    expect(readTexts(extension, STEP_BUTTON)).toEqual(['지금', '▶ 시작', '▶ 끝'])
  })

  // 값을 바꾸는 [지금]과 영상만 옮기는 둘은 누른 결과의 종류가 다르다.
  it('영상을 옮기는 두 버튼은 한 덩어리로 묶여 [지금]과 칸막이로 갈린다', async () => {
    const extension = await startWithTimeline()

    openEditRow(extension, '둘째 곡')

    const card = find(extension, STEP_ROW)
    expect(readTexts(extension, `${SEEK_PAIR} ${STEP_BUTTON}`)).toEqual(['▶ 시작', '▶ 끝'])
    expect([...card.children].map((child) => child.className)).toEqual([
      'timeline-skip-step-field',
      'timeline-skip-step',
      'timeline-skip-step-divider',
      'timeline-skip-seek-pair'
    ])
  })

  it('버튼이 읽어주는 이름은 어느 시각을 다루는지까지 말한다', async () => {
    const extension = await startWithTimeline()

    openEditRow(extension, '둘째 곡')

    for (const name of ['시작을 지금 위치로', '시작 시각으로 이동', '끝 시각으로 이동']) {
      expect(find(extension, `button[aria-label="${name}"]`)).not.toBeNull()
    }
  })

  it('끝 칸과 끝 안내 글씨가 없다', async () => {
    const extension = await startWithTimeline()

    openEditRow(extension, '둘째 곡')

    expect(find(extension, '.timeline-skip-end-input')).toBeNull()
    expect(find(extension, '.timeline-skip-end-hint')).toBeNull()
  })

  it('시간 바와 재생 위치 줄이 없다', async () => {
    const extension = await startWithTimeline()

    openEditRow(extension, '둘째 곡')

    expect(find(extension, '.timeline-skip-range')).toBeNull()
    expect(find(extension, '.timeline-skip-playback-row')).toBeNull()
  })

  it('추가 시트도 같은 구성이다', async () => {
    const extension = await startWithTimeline()

    clickButton(extension, '자세히 추가')

    expect(findAll(extension, STEP_ROW)).toHaveLength(1)
    expect(readTexts(extension, STEP_BUTTON)).toEqual(['지금', '▶ 시작', '▶ 끝'])
    expect(find(extension, TIME_FIELDS).querySelector(START_INPUT)).not.toBeNull()
  })
})

async function startWithTimeline() {
  const extension = await startWithFakes()
  loadTimeline(extension, [TIMELINE_COMMENT])

  return extension
}
