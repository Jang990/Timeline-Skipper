// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { readCommentSnapshot } from '../fixtures/snapshots/commentSnapshot.js'
import { startWithFakes } from '../fixtures/fakes/startWithFakes.js'
import { find, loadTimeline, readText } from '../fixtures/fakes/panelHelpers.js'

// 다섯 번째 트랙은 1026초(17:06)부터 1253초(20:53)까지 227초다.
// 바의 폭을 227px로 정해 두면 바 왼쪽에서 몇 px인지가 곧 트랙 시작에서 몇 초인지다.
const { commentTexts } = readCommentSnapshot('3yG8GXdnEFQ')

const BAR = '.timeline-skip-now-playing .timeline-skip-now-playing-bar'
const FILL = `${BAR} .timeline-skip-now-playing-fill`
const KNOB = `${BAR} .timeline-skip-now-playing-knob`
const ELAPSED = '.timeline-skip-now-playing .timeline-skip-now-playing-elapsed'
const TRACK_START_SECONDS = 1026
const TRACK_END_SECONDS = 1253
const BAR_WIDTH_PIXELS = TRACK_END_SECONDS - TRACK_START_SECONDS
const KEY_STEP_SECONDS = 5

describe('지금 재생 중 진행 바로 옮기기', () => {
  it('진행 바에 현재 재생 위치를 가리키는 동그라미가 있다', async () => {
    const extension = await startWithTimeline()

    extension.player.playTo(secondsAt(50))

    expect(readRatio(find(extension, KNOB).style.left)).toBeCloseTo(readRatio(find(extension, FILL).style.width), 6)
    expect(readRatio(find(extension, KNOB).style.left)).toBeCloseTo(50 / BAR_WIDTH_PIXELS, 3)
  })

  it('동그라미는 재생 위치를 따라 움직인다', async () => {
    const extension = await startWithTimeline()
    extension.player.playTo(secondsAt(50))

    extension.player.playTo(secondsAt(150))

    expect(readRatio(find(extension, KNOB).style.left)).toBeCloseTo(150 / BAR_WIDTH_PIXELS, 3)
  })

  it('진행 바를 누르면 누른 자리의 시각으로 영상이 옮겨진다', async () => {
    const extension = await startWithTimeline()
    extension.player.playTo(secondsAt(50))
    const bar = findSizedBar(extension)

    pointer(bar, 'pointerdown', 100)
    pointer(bar, 'pointerup', 100)

    expect(extension.player.seekHistory).toEqual([secondsAt(100)])
  })

  it('동그라미를 끄는 동안에는 영상을 옮기지 않고, 놓으면 놓은 자리로 옮긴다', async () => {
    const extension = await startWithTimeline()
    extension.player.playTo(secondsAt(50))
    const bar = findSizedBar(extension)

    pointer(bar, 'pointerdown', 50)
    pointer(bar, 'pointermove', 120)
    pointer(bar, 'pointermove', 180)
    expect(extension.player.seekHistory).toEqual([])
    expect(readRatio(find(extension, KNOB).style.left)).toBeCloseTo(180 / BAR_WIDTH_PIXELS, 3)
    pointer(bar, 'pointerup', 180)

    expect(extension.player.seekHistory).toEqual([secondsAt(180)])
  })

  it('진행 바를 끄는 동안에는 흐른 시간이 손이 가리키는 자리의 시간을 보여 준다', async () => {
    const extension = await startWithTimeline()
    extension.player.playTo(secondsAt(50))
    const bar = findSizedBar(extension)

    pointer(bar, 'pointerdown', 50)
    pointer(bar, 'pointermove', 180)
    extension.player.playTo(secondsAt(60))

    expect(readText(extension, ELAPSED)).toBe('03:00')
  })

  it('끄는 동안에는 재생 위치가 바뀌어도 동그라미가 손을 따라간다', async () => {
    const extension = await startWithTimeline()
    extension.player.playTo(secondsAt(50))
    const bar = findSizedBar(extension)
    pointer(bar, 'pointerdown', 50)
    pointer(bar, 'pointermove', 180)

    extension.player.playTo(secondsAt(60))

    expect(readRatio(find(extension, KNOB).style.left)).toBeCloseTo(180 / BAR_WIDTH_PIXELS, 3)
    expect(readRatio(find(extension, FILL).style.width)).toBeCloseTo(180 / BAR_WIDTH_PIXELS, 3)
  })

  it('트랙 밖까지 끌어도 트랙의 시작이나 끝까지만 옮겨진다', async () => {
    const extension = await startWithTimeline()
    extension.player.playTo(secondsAt(50))
    const bar = findSizedBar(extension)

    pointer(bar, 'pointerdown', 50)
    pointer(bar, 'pointermove', BAR_WIDTH_PIXELS + 400)
    pointer(bar, 'pointerup', BAR_WIDTH_PIXELS + 400)
    pointer(bar, 'pointerdown', -400)
    pointer(bar, 'pointerup', -400)

    expect(extension.player.seekHistory).toEqual([TRACK_END_SECONDS, TRACK_START_SECONDS])
  })

  it('끌기가 취소되면 영상을 옮기지 않는다', async () => {
    const extension = await startWithTimeline()
    extension.player.playTo(secondsAt(50))
    const bar = findSizedBar(extension)

    pointer(bar, 'pointerdown', 50)
    pointer(bar, 'pointermove', 180)
    pointer(bar, 'pointercancel', 180)
    pointer(bar, 'pointerup', 180)

    expect(extension.player.seekHistory).toEqual([])
  })

  it('진행 바는 슬라이더로 읽히고 트랙의 시작·끝·현재 시각을 알린다', async () => {
    const extension = await startWithTimeline()

    extension.player.playTo(secondsAt(50) + 0.4)

    const bar = find(extension, BAR)
    expect(bar.getAttribute('role')).toBe('slider')
    expect(bar.getAttribute('tabindex')).toBe('0')
    expect(bar.getAttribute('aria-label')).toBe('재생 위치')
    expect(bar.getAttribute('aria-valuemin')).toBe(String(TRACK_START_SECONDS))
    expect(bar.getAttribute('aria-valuemax')).toBe(String(TRACK_END_SECONDS))
    expect(bar.getAttribute('aria-valuenow')).toBe(String(secondsAt(50)))
    expect(bar.getAttribute('aria-valuetext')).toBe('17:56')
  })

  it('오른쪽 방향키는 5초 뒤로, 왼쪽 방향키는 5초 앞으로 옮긴다', async () => {
    const extension = await startWithTimeline()
    extension.player.playTo(secondsAt(50))

    pressKey(find(extension, BAR), 'ArrowRight')
    pressKey(find(extension, BAR), 'ArrowRight')
    pressKey(find(extension, BAR), 'ArrowLeft')

    expect(extension.player.seekHistory).toEqual([
      secondsAt(50 + KEY_STEP_SECONDS),
      secondsAt(50 + KEY_STEP_SECONDS * 2),
      secondsAt(50 + KEY_STEP_SECONDS)
    ])
  })

  it('방향키로 트랙의 시작이나 끝을 넘겨 옮기지 않는다', async () => {
    const extension = await startWithTimeline()
    extension.player.playTo(TRACK_END_SECONDS - 2)
    pressKey(find(extension, BAR), 'ArrowRight')
    extension.player.playTo(TRACK_START_SECONDS + 2)

    pressKey(find(extension, BAR), 'ArrowLeft')

    expect(extension.player.seekHistory).toEqual([TRACK_END_SECONDS, TRACK_START_SECONDS])
  })
})

async function startWithTimeline() {
  const extension = await startWithFakes()
  loadTimeline(extension, commentTexts)

  return extension
}

function secondsAt(offsetSeconds) {
  return TRACK_START_SECONDS + offsetSeconds
}

function readRatio(percentText) {
  return Number.parseFloat(percentText) / 100
}

// jsdom은 자리를 그리지 않는다. 바의 자리를 직접 정해 둔다. 실제로 그 자리에 그려지는지는 e2e가 맡는다.
function findSizedBar(extension) {
  const bar = find(extension, BAR)
  bar.getBoundingClientRect = () => ({ left: 0, top: 0, width: BAR_WIDTH_PIXELS, height: 4, right: BAR_WIDTH_PIXELS, bottom: 4 })

  return bar
}

// jsdom에는 PointerEvent가 없다. 받는 쪽은 이벤트 이름과 좌표만 보므로 MouseEvent로 흉내 낸다.
function pointer(bar, type, offsetPixels) {
  bar.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, button: 0, clientX: offsetPixels }))
}

function pressKey(element, key) {
  element.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }))
}
