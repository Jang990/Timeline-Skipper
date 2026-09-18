// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { readCommentSnapshot } from '../fixtures/snapshots/commentSnapshot.js'
import { startWithFakes } from '../fixtures/fakes/startWithFakes.js'
import { find, findRow, loadTimeline, readText } from '../fixtures/fakes/panelHelpers.js'

// 트랙 시작은 1, 269, 556, 810, 1026, 1253, 1508, 1795초다.
// 다섯 번째 트랙은 1026초(17:06)부터 1253초(20:53)까지 227초다. 0.5초는 첫 트랙 앞이다.
// 여섯 번째 트랙은 1253초부터 1508초까지 255초다.
const { commentTexts } = readCommentSnapshot('3yG8GXdnEFQ')

const PROGRESS = '.timeline-skip-now-playing .timeline-skip-now-playing-progress'
const FILL = `${PROGRESS} .timeline-skip-now-playing-bar .timeline-skip-now-playing-fill`
const ELAPSED = `${PROGRESS} .timeline-skip-now-playing-elapsed`
const LENGTH = `${PROGRESS} .timeline-skip-now-playing-length`
const TRACK_START_SECONDS = 1026
const TRACK_LENGTH_SECONDS = 227
const NEXT_TRACK_START_SECONDS = 1253

describe('지금 재생 중 진행 바', () => {
  it('진행 바 왼쪽에 트랙 시작부터 흐른 시간이, 오른쪽에 트랙 길이가 보인다', async () => {
    const extension = await startWithTimeline()

    extension.player.playTo(1100)

    expect(readText(extension, ELAPSED)).toBe('01:14')
    expect(readText(extension, LENGTH)).toBe('03:47')
  })

  it('재생 위치가 초 단위 사이에 있으면 흐른 시간은 초 아래를 버린다', async () => {
    const extension = await startWithTimeline()

    extension.player.playTo(1100.9)

    expect(readText(extension, ELAPSED)).toBe('01:14')
  })

  it('트랙 시작 지점에서는 흐른 시간이 00:00이다', async () => {
    const extension = await startWithTimeline()

    extension.player.playTo(TRACK_START_SECONDS)

    expect(readText(extension, ELAPSED)).toBe('00:00')
  })

  it('같은 트랙 안에서 재생 위치가 옮겨지면 흐른 시간도 따라 바뀐다', async () => {
    const extension = await startWithTimeline()
    extension.player.playTo(1100)

    extension.player.playTo(1200)

    expect(readText(extension, ELAPSED)).toBe('02:54')
  })

  it('다음 트랙으로 넘어가면 흐른 시간을 그 트랙의 시작부터 다시 센다', async () => {
    const extension = await startWithTimeline()
    extension.player.playTo(1100)

    extension.player.playTo(NEXT_TRACK_START_SECONDS + 10)

    expect(readText(extension, ELAPSED)).toBe('00:10')
    expect(readText(extension, LENGTH)).toBe('04:15')
  })

  it('진행 바는 트랙 안에서 흐른 비율만큼 채워진다', async () => {
    const extension = await startWithTimeline()

    extension.player.playTo(secondsAtRatio(0.5))

    expect(readFillRatio(extension)).toBeCloseTo(0.5, 3)
  })

  it('같은 트랙 안에서 재생 위치가 옮겨지면 진행 바도 따라 움직인다', async () => {
    const extension = await startWithTimeline()
    extension.player.playTo(secondsAtRatio(0.25))
    expect(readFillRatio(extension)).toBeCloseTo(0.25, 3)

    extension.player.playTo(secondsAtRatio(0.75))

    expect(readFillRatio(extension)).toBeCloseTo(0.75, 3)
  })

  it('편집 중에도 진행 바가 재생 위치를 따라간다', async () => {
    const extension = await startWithTimeline()
    extension.player.playTo(secondsAtRatio(0.25))
    findRow(extension, 4).querySelector('button[aria-label$=" 수정"]').click()
    expect(find(extension, '.timeline-skip-edit-sheet')).not.toBeNull()

    extension.player.playTo(secondsAtRatio(0.75))

    expect(readFillRatio(extension)).toBeCloseTo(0.75, 3)
  })

  it('첫 트랙 앞에서는 진행 바가 없다', async () => {
    const extension = await startWithTimeline()

    extension.player.playTo(0.5)

    expect(readText(extension, '.timeline-skip-now-playing-title')).toBe('트랙 밖 구간')
    expect(find(extension, PROGRESS)).toBeNull()
  })

  it('트랙이 없으면 진행 바가 없다', async () => {
    const extension = await startWithFakes()

    expect(find(extension, '.timeline-skip-now-playing')).not.toBeNull()
    expect(find(extension, PROGRESS)).toBeNull()
  })
})

async function startWithTimeline() {
  const extension = await startWithFakes()
  loadTimeline(extension, commentTexts)

  return extension
}

function secondsAtRatio(ratio) {
  return TRACK_START_SECONDS + TRACK_LENGTH_SECONDS * ratio
}

// jsdom은 폭을 그리지 않는다. 채울 비율로 적어 둔 값을 읽는다. 실제로 그 폭으로 그려지는지는 e2e가 맡는다.
function readFillRatio(extension) {
  return Number.parseFloat(find(extension, FILL).style.width) / 100
}
