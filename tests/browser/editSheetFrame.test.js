import { describe, it, expect } from 'vitest'
import { userEvent } from '@vitest/browser/context'
import { openTimeline, click, readBox, readStyle, isVisible, nextFrame } from './helpers.js'

const TIMELINE_COMMENT = ['00:00 첫 곡', '05:00 둘째 곡', '10:00 셋째 곡'].join('\n')
const PANEL = '#timeline-skip-panel'
const SHEET = `${PANEL} .timeline-skip-edit-sheet`
const TITLE_INPUT = `${SHEET} .timeline-skip-title-input`
const START_INPUT = `${SHEET} .timeline-skip-time-input`
const ERROR = `${SHEET} .timeline-skip-error`
const RAISED_VARIABLE = '--yt-sys-color-baseline--raised-background'

const button = (label) => `${SHEET} button[aria-label="${label}"]`

describe('편집 시트의 틀', () => {
  it('저장·취소 버튼은 시각 칸보다 아래에 있다', async () => {
    await openTimeline([TIMELINE_COMMENT])

    await openEditSheet('둘째 곡')

    const startBottom = readBox(START_INPUT).bottom
    expect(readBox(button('저장')).top).toBeGreaterThan(startBottom)
    expect(readBox(button('취소')).top).toBeGreaterThan(startBottom)
  })

  it('저장 버튼은 취소 버튼과 배경색이 다르다', async () => {
    await openTimeline([TIMELINE_COMMENT])

    await openEditSheet('둘째 곡')

    expect(readStyle(button('저장'), 'backgroundColor')).not.toBe(readStyle(button('취소'), 'backgroundColor'))
  })

  it('저장되지 않은 이유는 저장 버튼보다 위에 보인다', async () => {
    await openTimeline([TIMELINE_COMMENT])
    await openEditSheet('둘째 곡')
    await userEvent.fill(document.querySelector(START_INPUT), '어제')

    await click(button('저장'))

    expect(isVisible(ERROR)).toBe(true)
    expect(readBox(ERROR).bottom).toBeLessThanOrEqual(readBox(button('저장')).top)
  })

  it('시트는 위쪽 모서리가 둥글고 그림자가 있다', async () => {
    await openTimeline([TIMELINE_COMMENT])

    await openEditSheet('둘째 곡')

    expect(parseFloat(readStyle(SHEET, 'borderTopLeftRadius'))).toBeGreaterThan(0)
    expect(parseFloat(readStyle(SHEET, 'borderTopRightRadius'))).toBeGreaterThan(0)
    expect(readStyle(SHEET, 'boxShadow')).not.toBe('none')
  })

  it('시트 바탕은 유튜브의 떠 있는 판 색을 따른다', async () => {
    await openTimeline([TIMELINE_COMMENT])
    document.documentElement.style.setProperty(RAISED_VARIABLE, 'rgb(33, 33, 33)')

    await openEditSheet('둘째 곡')

    expect(readStyle(SHEET, 'backgroundColor')).toBe('rgb(33, 33, 33)')
    document.documentElement.style.removeProperty(RAISED_VARIABLE)
  })
})

async function openEditSheet(title) {
  await click(`${PANEL} button[aria-label="${title} 수정"]`)
  await nextFrame()
  expect(document.querySelector(TITLE_INPUT).value).toBe(title)
}
