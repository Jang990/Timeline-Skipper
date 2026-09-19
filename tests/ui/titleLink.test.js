// @vitest-environment jsdom
import { afterEach, describe, it, expect, vi } from 'vitest'
import { settle, startWithFakes } from '../fixtures/fakes/startWithFakes.js'
import { find, loadTimeline } from '../fixtures/fakes/panelHelpers.js'

const TIMELINE_COMMENT = ['00:00 첫 곡', '05:00 둘째 곡', '10:00 셋째 곡'].join('\n')

// 첫 곡이 01:00에 시작해서 0초는 어느 트랙에도 속하지 않는다.
const LATE_START_COMMENT = ['01:00 첫 곡', '05:00 둘째 곡'].join('\n')

const CARD_TITLE = '.timeline-skip-now-playing .timeline-skip-now-playing-title'
const PLAYING_ROW = '.timeline-skip-row.is-playing'
const ARRIVED_CLASS = 'is-arrived'
const FLOATING = '#timeline-skip-floating'
const ICON = `${FLOATING} .timeline-skip-floating-icon`
const WIDGET_TITLE = `${FLOATING} .timeline-skip-floating-title`
const LINK_HINT = ' · 눌러서 목록에서 보기'

// 목록이 어디까지 흐르는지, 페이지가 그대로인지는 jsdom이 계산하지 못한다. nowPlayingCard.spec.js가 본다.
// 여기서는 누를 수 있는지, 무엇이 적히는지, 도착 표시가 붙고 떨어지는지만 본다.
describe('재생 중인 트랙의 제목을 눌러 목록의 그 트랙으로 가기', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('카드의 재생 중 제목을 누르면 목록의 재생 중인 행에 도착 표시가 붙는다', async () => {
    const extension = await startWithTimeline(TIMELINE_COMMENT, 400)

    find(extension, CARD_TITLE).click()

    expect(find(extension, PLAYING_ROW).classList.contains(ARRIVED_CLASS)).toBe(true)
  })

  it('첫 트랙 앞에서는 카드 제목이 누를 수 있는 버튼이 아니다', async () => {
    const extension = await startWithTimeline(LATE_START_COMMENT, 0)

    expect(find(extension, CARD_TITLE).tagName).not.toBe('BUTTON')
  })

  it('카드 제목의 툴팁은 제목 뒤에 "눌러서 목록에서 보기"를 붙인다', async () => {
    const extension = await startWithTimeline(TIMELINE_COMMENT, 400)

    expect(find(extension, CARD_TITLE).title).toBe(`둘째 곡${LINK_HINT}`)
  })

  it('위젯 제목을 누르면 패널을 강조하고 재생 중인 행에 도착 표시가 붙는다', async () => {
    const extension = await startWithWidget(TIMELINE_COMMENT, 400)

    document.querySelector(WIDGET_TITLE).click()
    await settle()

    expect(extension.tabFocus.getFocusCount()).toBe(1)
    expect(extension.findPanel().classList.contains('is-revealed')).toBe(true)
    expect(find(extension, PLAYING_ROW).classList.contains(ARRIVED_CLASS)).toBe(true)
  })

  it('첫 트랙 앞에서는 위젯 제목이 누를 수 있는 버튼이 아니다', async () => {
    await startWithWidget(LATE_START_COMMENT, 0)

    expect(document.querySelector(WIDGET_TITLE).tagName).not.toBe('BUTTON')
  })

  it('위젯 제목의 툴팁은 제목 뒤에 "눌러서 목록에서 보기"를 붙인다', async () => {
    await startWithWidget(TIMELINE_COMMENT, 400)

    expect(document.querySelector(WIDGET_TITLE).title).toBe(`둘째 곡${LINK_HINT}`)
  })

  it('위젯에는 목록 보기 버튼이 없다', async () => {
    await startWithWidget(TIMELINE_COMMENT, 400)

    const buttonTexts = [...document.querySelectorAll(`${FLOATING} button`)].map((button) => button.textContent)

    expect(buttonTexts).not.toContain('목록 보기')
  })

  it('도착 표시는 잠시 뒤 사라진다', async () => {
    const extension = await startWithTimeline(TIMELINE_COMMENT, 400)
    vi.useFakeTimers()

    find(extension, CARD_TITLE).click()
    vi.advanceTimersByTime(2000)

    expect(find(extension, PLAYING_ROW).classList.contains(ARRIVED_CLASS)).toBe(false)
  })

  it('연달아 누르면 도착 표시는 마지막으로 누른 때부터 다시 센다', async () => {
    const extension = await startWithTimeline(TIMELINE_COMMENT, 400)
    vi.useFakeTimers()
    find(extension, CARD_TITLE).click()
    vi.advanceTimersByTime(1000)

    find(extension, CARD_TITLE).click()
    vi.advanceTimersByTime(1000)

    expect(find(extension, PLAYING_ROW).classList.contains(ARRIVED_CLASS)).toBe(true)
  })
})

async function startWithTimeline(commentText, currentTimeSeconds) {
  const extension = await startWithFakes()
  loadTimeline(extension, [commentText])
  extension.player.playTo(currentTimeSeconds)

  return extension
}

// jsdom에는 scrollIntoView가 없다. 위젯 제목은 패널까지 페이지를 옮기므로 빈 함수로 채운다.
async function startWithWidget(commentText, currentTimeSeconds) {
  const extension = await startWithTimeline(commentText, currentTimeSeconds)
  Element.prototype.scrollIntoView = () => {}
  document.querySelector(ICON).click()

  return extension
}
