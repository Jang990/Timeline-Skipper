import { describe, it, expect } from 'vitest'

import { findPlaybackTarget } from '../../../src/core/playback/findPlaybackTarget.js'

const tracks = [
  { startSeconds: 0, endSeconds: 100, trimmedEndSeconds: null, title: '첫 곡' },
  { startSeconds: 100, endSeconds: 200, trimmedEndSeconds: null, title: '둘째 곡' },
  { startSeconds: 200, endSeconds: 300, trimmedEndSeconds: null, title: '셋째 곡' }
]

// 첫 곡의 끝을 80초로 당겨 두어 80~100초가 빈 구간이다.
const tracksWithGap = [
  { startSeconds: 0, endSeconds: 80, trimmedEndSeconds: 80, title: '첫 곡' },
  { startSeconds: 100, endSeconds: 200, trimmedEndSeconds: null, title: '둘째 곡' }
]

// 마지막 곡의 끝을 150초로 당겨 두어, 그 뒤는 해제된 트랙도 빈 구간도 아니다. 반복만 끼어든다.
const tracksEndingEarly = [
  { startSeconds: 0, endSeconds: 100, trimmedEndSeconds: null, title: '첫 곡' },
  { startSeconds: 100, endSeconds: 150, trimmedEndSeconds: 150, title: '둘째 곡' }
]

function playbackOf(overrides) {
  return { tracks, disabledStartSeconds: new Set(), loopEnabled: false, isEditing: false, ...overrides }
}

describe('findPlaybackTarget', () => {
  it('편집 중이 아니면 해제된 트랙 안에서 다음 켜진 트랙으로 옮긴다', () => {
    const playback = playbackOf({ disabledStartSeconds: new Set([100]) })

    const result = findPlaybackTarget(playback, 150)

    expect(result).toBe(200)
  })

  it('편집 중이 아니면 트랙 사이 빈 구간을 건너뛴다', () => {
    const playback = playbackOf({ tracks: tracksWithGap })

    const result = findPlaybackTarget(playback, 90)

    expect(result).toBe(100)
  })

  it('반복이 켜져 있으면 마지막 트랙이 끝났을 때 첫 트랙으로 되감는다', () => {
    const playback = playbackOf({ tracks: tracksEndingEarly, loopEnabled: true })

    const result = findPlaybackTarget(playback, 160)

    expect(result).toBe(0)
  })

  it('반복이 꺼져 있으면 마지막 트랙이 끝나도 되감지 않는다', () => {
    const playback = playbackOf({ tracks: tracksEndingEarly })

    const result = findPlaybackTarget(playback, 160)

    expect(result).toBe(null)
  })

  it('반복과 건너뛰기가 겹치면 되감기가 먼저다', () => {
    const playback = playbackOf({ disabledStartSeconds: new Set([200]), loopEnabled: true })

    const result = findPlaybackTarget(playback, 250)

    expect(result).toBe(0)
  })

  it('편집 중이면 해제된 트랙 안이어도 옮기지 않는다', () => {
    const playback = playbackOf({ disabledStartSeconds: new Set([100]), isEditing: true })

    const result = findPlaybackTarget(playback, 150)

    expect(result).toBe(null)
  })

  it('편집 중이면 빈 구간이어도 옮기지 않는다', () => {
    const playback = playbackOf({ tracks: tracksWithGap, isEditing: true })

    const result = findPlaybackTarget(playback, 90)

    expect(result).toBe(null)
  })

  it('편집 중이면 반복이 켜져 있어도 되감지 않는다', () => {
    const playback = playbackOf({ tracks: tracksEndingEarly, loopEnabled: true, isEditing: true })

    const result = findPlaybackTarget(playback, 160)

    expect(result).toBe(null)
  })

  it('켜진 트랙 안이면 옮기지 않는다', () => {
    const playback = playbackOf({})

    const result = findPlaybackTarget(playback, 50)

    expect(result).toBe(null)
  })

  it('트랙이 하나도 없으면 null을 반환한다', () => {
    const playback = playbackOf({ tracks: [], loopEnabled: true })

    const result = findPlaybackTarget(playback, 50)

    expect(result).toBe(null)
  })
})
