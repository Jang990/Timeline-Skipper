import { describe, it, expect, afterEach } from 'vitest'
import { openTimeline, playTo, click, readStyle, nextFrame } from './helpers.js'

const PANEL = '#timeline-skip-panel'
const CARD = `${PANEL} .timeline-skip-now-playing`
const CARD_TITLE = `${CARD} .timeline-skip-now-playing-title`
const LONG_COMMENT = Array.from({ length: 29 }, (_, index) => `${String(index).padStart(2, '0')}:00 트랙 ${index + 1}`).join('\n')
const SHORT_COMMENT = ['00:01 첫 곡', '04:29 둘째 곡'].join('\n')
const CALL_TO_ACTION = 'rgb(4, 5, 6)'

describe('지금 재생 중 카드', () => {
  afterEach(() => document.documentElement.removeAttribute('style'))

  it('반복을 켜면 반복 버튼이 강조색으로 그려진다', async () => {
    await openTimeline([SHORT_COMMENT])
    document.documentElement.style.setProperty('--yt-sys-color-baseline--call-to-action', CALL_TO_ACTION)

    await click(`${CARD} button[aria-label="반복 켜기"]`)
    await nextFrame()

    expect(readStyle(`${CARD} button[aria-label="반복 끄기"]`, 'color')).toBe(CALL_TO_ACTION)
  })

  it('카드 제목을 누르면 목록이 재생 중인 행을 가운데에 두도록 흐르고 페이지는 움직이지 않는다', async () => {
    const extension = await openTimeline([LONG_COMMENT])
    await playTo(extension, 1210)
    document.querySelector(CARD_TITLE).scrollIntoView({ block: 'nearest' })
    const pageScrollY = window.scrollY

    await click(CARD_TITLE)

    expect(readStyle(`${PANEL} .timeline-skip-list`, 'scrollBehavior')).toBe('smooth')
    await expect.poll(readPlayingRowOffset).toBeLessThanOrEqual(1)
    expect(window.scrollY).toBe(pageScrollY)
  })
})

function readPlayingRowOffset() {
  const list = document.querySelector(`${PANEL} .timeline-skip-list`)
  const listBox = list.getBoundingClientRect()
  const rowBox = list.querySelector('.timeline-skip-row.is-playing').getBoundingClientRect()

  return Math.abs(rowBox.top + rowBox.height / 2 - (listBox.top + listBox.height / 2))
}
