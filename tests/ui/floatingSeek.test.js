// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { readCommentSnapshot } from '../fixtures/snapshots/commentSnapshot.js'
import { startWithFakes } from '../fixtures/fakes/startWithFakes.js'
import { loadTimeline } from '../fixtures/fakes/panelHelpers.js'

// 트랙 시작은 1, 269, 556, 810, 1026, 1253, 1508, 1795초다. 마지막 트랙은 1795초부터다.
// 다섯 번째 트랙은 1026초부터 1253초까지 227초다. 바의 폭을 227px로 정하면 1px이 1초다.
const { commentTexts } = readCommentSnapshot('3yG8GXdnEFQ')

// 진행 바를 누르고 끄는 여러 경우는 nowPlayingSeek.test.js가 다룬다. 여기서는 위젯에 붙었는지만 본다.
const FLOATING = '#timeline-skip-floating'
const ICON = `${FLOATING} .timeline-skip-floating-icon`
const CARD = `${FLOATING} .timeline-skip-floating-card`
const BAR = `${FLOATING} .timeline-skip-now-playing-bar`
const KNOB = `${BAR} .timeline-skip-now-playing-knob`
const TITLE = `${FLOATING} .timeline-skip-floating-title`
const CONTROLS = `${FLOATING} .timeline-skip-controls`
const TRACK_START_SECONDS = 1026
const TRACK_END_SECONDS = 1253
const NEXT_TRACK_END_SECONDS = 1508
const LAST_TRACK_START_SECONDS = 1795
const BAR_WIDTH_PIXELS = TRACK_END_SECONDS - TRACK_START_SECONDS

describe('떠 있는 위젯의 진행 바', () => {
  it('펼친 위젯의 제목 줄과 버튼 줄 사이에 진행 바가 있다', async () => {
    const extension = await startWithTimeline()
    extension.player.playTo(secondsAt(50))

    query(ICON).click()

    const bar = query(BAR)
    expect(bar).not.toBeNull()
    expect(query(TITLE).compareDocumentPosition(bar) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(bar.compareDocumentPosition(query(CONTROLS)) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('위젯 진행 바의 동그라미는 재생 위치를 따라 움직인다', async () => {
    const extension = await startExpandedAt(secondsAt(50))

    extension.player.playTo(secondsAt(150))

    expect(readRatio(query(KNOB).style.left)).toBeCloseTo(150 / BAR_WIDTH_PIXELS, 3)
  })

  it('위젯 진행 바를 끌어 놓으면 놓은 자리의 시각으로 영상이 옮겨진다', async () => {
    const extension = await startExpandedAt(secondsAt(50))
    const bar = findSizedBar()

    pointer(bar, 'pointerdown', 50)
    pointer(bar, 'pointermove', 180)
    pointer(bar, 'pointerup', 180)

    expect(extension.player.seekHistory).toEqual([secondsAt(180)])
  })

  it('다른 트랙으로 넘어가면 위젯 진행 바의 범위가 그 트랙으로 바뀐다', async () => {
    const extension = await startExpandedAt(secondsAt(50))

    extension.player.playTo(TRACK_END_SECONDS + 10)

    expect(query(BAR).getAttribute('aria-valuemin')).toBe(String(TRACK_END_SECONDS))
    expect(query(BAR).getAttribute('aria-valuemax')).toBe(String(NEXT_TRACK_END_SECONDS))
  })

  it('첫 트랙 앞에서는 위젯에 진행 바가 없다', async () => {
    const extension = await startWithTimeline()
    extension.player.playTo(0.5)

    query(ICON).click()

    expect(query(CARD)).not.toBeNull()
    expect(query(BAR)).toBeNull()
  })

  it('영상 길이를 모르면 마지막 트랙에서는 위젯에 진행 바가 없다', async () => {
    const extension = await startWithTimeline({ durationSeconds: Number.NaN })
    extension.player.playTo(LAST_TRACK_START_SECONDS + 10)

    query(ICON).click()

    expect(query(CARD)).not.toBeNull()
    expect(query(BAR)).toBeNull()
  })

  it('접힌 아이콘에는 진행 바가 없다', async () => {
    const extension = await startWithTimeline()

    extension.player.playTo(secondsAt(50))

    expect(query(ICON)).not.toBeNull()
    expect(query(BAR)).toBeNull()
  })
})

async function startWithTimeline(options) {
  const extension = await startWithFakes(options)
  loadTimeline(extension, commentTexts)

  return extension
}

async function startExpandedAt(timestampSeconds) {
  const extension = await startWithTimeline()
  extension.player.playTo(timestampSeconds)
  query(ICON).click()

  return extension
}

function secondsAt(offsetSeconds) {
  return TRACK_START_SECONDS + offsetSeconds
}

function query(selector) {
  return document.querySelector(selector)
}

function readRatio(percentText) {
  return Number.parseFloat(percentText) / 100
}

// jsdom은 자리를 그리지 않는다. 바의 자리를 직접 정해 둔다. 실제로 그 자리에 그려지는지는 e2e가 맡는다.
function findSizedBar() {
  const bar = query(BAR)
  bar.getBoundingClientRect = () => ({ left: 0, top: 0, width: BAR_WIDTH_PIXELS, height: 4, right: BAR_WIDTH_PIXELS, bottom: 4 })

  return bar
}

// jsdom에는 PointerEvent가 없다. 받는 쪽은 이벤트 이름과 좌표만 보므로 MouseEvent로 흉내 낸다.
function pointer(bar, type, offsetPixels) {
  bar.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, button: 0, clientX: offsetPixels }))
}
