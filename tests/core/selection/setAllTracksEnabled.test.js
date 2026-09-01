import { describe, it, expect } from 'vitest'

import { setAllTracksEnabled } from '../../../src/core/selection/setAllTracksEnabled.js'

describe('setAllTracksEnabled', () => {
  it('전체 해제하면 모든 트랙의 시작 시각을 담은 Set을 반환한다', () => {
    const tracks = [
      { startSeconds: 0, endSeconds: 90, title: '첫 곡' },
      { startSeconds: 90, endSeconds: 200, title: '둘째 곡' }
    ]

    const result = setAllTracksEnabled(tracks, false)

    expect(result).toEqual(new Set([0, 90]))
  })

  it('전체 선택하면 빈 Set을 반환한다', () => {
    const tracks = [
      { startSeconds: 0, endSeconds: 90, title: '첫 곡' },
      { startSeconds: 90, endSeconds: 200, title: '둘째 곡' }
    ]

    const result = setAllTracksEnabled(tracks, true)

    expect(result).toEqual(new Set())
  })

  it('트랙이 없으면 전체 해제해도 빈 Set을 반환한다', () => {
    const result = setAllTracksEnabled([], false)

    expect(result).toEqual(new Set())
  })

  it('마지막 트랙처럼 끝 시각이 없어도 시작 시각을 담는다', () => {
    const tracks = [{ startSeconds: 300, endSeconds: null, title: '마지막 곡' }]

    const result = setAllTracksEnabled(tracks, false)

    expect(result).toEqual(new Set([300]))
  })

  it('입력한 트랙 배열을 변경하지 않는다', () => {
    const tracks = [{ startSeconds: 0, endSeconds: 90, title: '첫 곡' }]

    setAllTracksEnabled(tracks, false)

    expect(tracks).toEqual([{ startSeconds: 0, endSeconds: 90, title: '첫 곡' }])
  })
})
