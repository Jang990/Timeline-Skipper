import { describe, expect, it } from 'vitest'

import { findPlaybackTarget } from '../../../src/core/playback/findPlaybackTarget.js'

// 트랙의 끝은 언제나 다음 트랙의 시작이다. 마지막 트랙은 영상 끝(300초)에서 끝난다.
const TRACKS = [
  { startSeconds: 0, endSeconds: 100, title: '첫 곡' },
  { startSeconds: 100, endSeconds: 200, title: '둘째 곡' },
  { startSeconds: 200, endSeconds: 300, title: '셋째 곡' }
]

function createPlayback(overrides = {}) {
  return { tracks: TRACKS, disabledStartSeconds: new Set(), loopEnabled: false, isEditing: false, ...overrides }
}

describe('findPlaybackTarget', () => {
  it('체크 해제된 트랙 안이면 다음 체크된 트랙의 시작을 돌려준다', () => {
    const playback = createPlayback({ disabledStartSeconds: new Set([100]) })

    expect(findPlaybackTarget(playback, 120)).toBe(200)
  })

  it('반복이 켜져 있고 마지막 트랙이 끝났으면 첫 트랙의 시작을 돌려준다', () => {
    const playback = createPlayback({ loopEnabled: true })

    expect(findPlaybackTarget(playback, 300)).toBe(0)
  })

  it('반복이 꺼져 있으면 마지막 트랙이 끝나도 되감지 않는다', () => {
    const playback = createPlayback()

    expect(findPlaybackTarget(playback, 300)).toBeNull()
  })

  it('반복과 건너뛰기가 함께 걸리면 반복이 먼저다', () => {
    const playback = createPlayback({ loopEnabled: true, disabledStartSeconds: new Set([200]) })

    expect(findPlaybackTarget(playback, 250)).toBe(0)
  })

  it('옮길 곳이 없으면 null을 돌려준다', () => {
    const playback = createPlayback({ loopEnabled: true })

    expect(findPlaybackTarget(playback, 50)).toBeNull()
  })

  it('편집 중에는 체크 해제된 트랙 안이어도 null을 돌려준다', () => {
    const playback = createPlayback({ disabledStartSeconds: new Set([100]), isEditing: true })

    expect(findPlaybackTarget(playback, 120)).toBeNull()
  })

  it('편집 중에는 반복이 켜져 있어도 되감지 않는다', () => {
    const playback = createPlayback({ loopEnabled: true, isEditing: true })

    expect(findPlaybackTarget(playback, 300)).toBeNull()
  })

  it('꺼져 있으면 해제한 트랙 위에서도 옮기지 않는다', () => {
    const playback = createPlayback({ disabledStartSeconds: new Set([100]), isTurnedOff: true })

    expect(findPlaybackTarget(playback, 120)).toBeNull()
  })

  it('꺼져 있으면 반복이 켜져 있어도 되감지 않는다', () => {
    const playback = createPlayback({ loopEnabled: true, isTurnedOff: true })

    expect(findPlaybackTarget(playback, 300)).toBeNull()
  })

  it('트랙이 하나도 없으면 null을 돌려준다', () => {
    const playback = createPlayback({ tracks: [], loopEnabled: true })

    expect(findPlaybackTarget(playback, 100)).toBeNull()
  })
})
