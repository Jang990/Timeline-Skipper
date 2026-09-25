import { describe, it, expect } from 'vitest'
import { userEvent } from '@vitest/browser/context'
import { openTimeline, playTo, click, readBox, isVisible } from './helpers.js'

const LONG_TITLE = '아주 길어서 위젯의 폭을 훌쩍 넘어가고도 한참 남는 제목을 가진 두 번째 곡'
const TIMELINE_COMMENT = ['00:00 첫 곡', `05:00 ${LONG_TITLE}`, '10:00 셋째 곡'].join('\n')
const FLOATING = '#timeline-skip-floating'
const ICON = `${FLOATING} .timeline-skip-floating-icon`
const CARD = `${FLOATING} .timeline-skip-floating-card`
const TITLE = `${FLOATING} .timeline-skip-floating-title`
const CONTROLS = `${FLOATING} .timeline-skip-controls`

describe('플로팅 위젯', () => {
  it('마우스를 올리기만 해서는 펼쳐지지 않는다', async () => {
    await openTimeline([TIMELINE_COMMENT])

    await userEvent.hover(document.querySelector(ICON))

    expect(isVisible(ICON)).toBe(true)
    expect(document.querySelector(CARD)).toBeNull()
  })

  it('펼치면 곡 제목과 조작 버튼이 서로 다른 줄에 놓인다', async () => {
    await openTimeline([TIMELINE_COMMENT])
    await click(ICON)

    const title = readBox(TITLE)
    const controls = readBox(CONTROLS)

    expect(title.y + title.height).toBeLessThanOrEqual(controls.y)
  })

  it('제목이 폭을 넘으면 흐르고, 넘지 않으면 흐르지 않는다', async () => {
    const extension = await openTimeline([TIMELINE_COMMENT])
    await click(ICON)

    expect(document.querySelector(TITLE).classList.contains('is-scrolling')).toBe(false)

    await playTo(extension, 400)

    await expect.poll(() => document.querySelector(TITLE).textContent).toBe(LONG_TITLE)
    await expect.poll(() => document.querySelector(TITLE).classList.contains('is-scrolling')).toBe(true)
  })
})
