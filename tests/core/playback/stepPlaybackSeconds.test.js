import { describe, it, expect } from 'vitest'

import { stepPlaybackSeconds } from '../../../src/core/playback/stepPlaybackSeconds.js'

describe('stepPlaybackSeconds', () => {
  it('지금 재생 위치에서 변화량만큼 옮긴 시각을 돌려준다', () => {
    const targetSeconds = stepPlaybackSeconds(400, 10, 1800)

    expect(targetSeconds).toBe(410)
  })

  it('소수인 재생 위치는 초 단위로 내린 뒤 옮긴다', () => {
    const targetSeconds = stepPlaybackSeconds(400.7, -1, 1800)

    expect(targetSeconds).toBe(399)
  })

  it('0초보다 앞으로는 옮기지 않는다', () => {
    const targetSeconds = stepPlaybackSeconds(3, -10, 1800)

    expect(targetSeconds).toBe(0)
  })

  it('영상 길이보다 뒤로는 옮기지 않는다', () => {
    const targetSeconds = stepPlaybackSeconds(1795, 10, 1800)

    expect(targetSeconds).toBe(1800)
  })

  it('영상 길이를 모르면 뒤로는 막지 않는다', () => {
    const targetSeconds = stepPlaybackSeconds(1795, 10, Number.NaN)

    expect(targetSeconds).toBe(1805)
  })

  it('재생 위치를 모르면 null을 돌려준다', () => {
    const targetSeconds = stepPlaybackSeconds(Number.NaN, 10, 1800)

    expect(targetSeconds).toBe(null)
  })
})
