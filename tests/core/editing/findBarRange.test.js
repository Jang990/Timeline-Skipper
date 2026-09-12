import { describe, expect, it } from 'vitest'

import { findBarRange } from '../../../src/core/editing/findBarRange.js'

const DURATION_SECONDS = 1800

// 앞뒤에 트랙이 있어야 이웃 사이를 잡는 것이 보인다. 끝은 모두 다음 트랙까지 이어져 있다.
const TRACKS = [
  { startSeconds: 0, endSeconds: 300, trimmedEndSeconds: null, title: '첫 곡' },
  { startSeconds: 300, endSeconds: 600, trimmedEndSeconds: null, title: '둘째 곡' },
  { startSeconds: 600, endSeconds: 1800, trimmedEndSeconds: null, title: '셋째 곡' }
]

describe('findBarRange', () => {
  it('이전 트랙이 끝나는 시각부터 다음 트랙이 시작하는 시각까지를 범위로 잡는다', () => {
    const tracks = [{ ...TRACKS[0], endSeconds: 200, trimmedEndSeconds: 200 }, TRACKS[1], TRACKS[2]]

    const range = findBarRange(tracks, 300, 300, DURATION_SECONDS)

    expect(range).toEqual({ fromSeconds: 160, toSeconds: 640 })
  })

  it('범위의 양쪽에 여유를 두어 트랙이 바의 가장자리에 붙지 않게 한다', () => {
    const range = findBarRange(TRACKS, 300, 300, DURATION_SECONDS)

    expect(range).toEqual({ fromSeconds: 270, toSeconds: 630 })
  })

  it('이전 트랙이 끝까지 이어져 있으면 이 트랙이 시작하는 곳이 곧 이웃 사이의 왼쪽이 된다', () => {
    const range = findBarRange(TRACKS, 300, 300, DURATION_SECONDS)

    expect(range.fromSeconds).toBeLessThan(300)
  })

  it('이전 트랙이 없으면 여유를 붙여도 0초에서 시작한다', () => {
    const range = findBarRange(TRACKS, 0, 0, DURATION_SECONDS)

    expect(range).toEqual({ fromSeconds: 0, toSeconds: 330 })
  })

  it('다음 트랙이 없으면 여유를 붙여도 영상이 끝나는 시각에서 멈춘다', () => {
    const range = findBarRange(TRACKS, 600, 600, DURATION_SECONDS)

    expect(range).toEqual({ fromSeconds: 480, toSeconds: 1800 })
  })

  it('고치는 중인 트랙 자신은 이웃으로 세지 않는다', () => {
    const range = findBarRange(TRACKS, 300, 300, DURATION_SECONDS)

    expect(range.fromSeconds).toBe(270)
  })

  it('시작 시각이 같은 트랙은 이웃으로 세지 않는다', () => {
    const range = findBarRange(TRACKS, null, 300, DURATION_SECONDS)

    expect(range).toEqual({ fromSeconds: 270, toSeconds: 630 })
  })

  it('이전 트랙이 아직 끝나지 않은 자리에 추가하면 그 자리에서 범위가 시작한다', () => {
    const range = findBarRange(TRACKS, null, 100, DURATION_SECONDS)

    expect(range).toEqual({ fromSeconds: 80, toSeconds: 320 })
  })

  it('트랙이 하나도 없으면 0초부터 영상이 끝날 때까지를 범위로 잡는다', () => {
    const range = findBarRange([], null, 100, DURATION_SECONDS)

    expect(range).toEqual({ fromSeconds: 0, toSeconds: 1800 })
  })

  it('영상 길이를 모르면 범위가 없다고 알린다', () => {
    const range = findBarRange(TRACKS, 300, 300, Number.NaN)

    expect(range).toBeNull()
  })

  it('영상 길이가 0이면 범위가 없다고 알린다', () => {
    const range = findBarRange(TRACKS, 300, 300, 0)

    expect(range).toBeNull()
  })
})
