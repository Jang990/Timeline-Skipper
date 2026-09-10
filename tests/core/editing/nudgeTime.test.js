import { describe, it, expect } from 'vitest'

import { nudgeStartSeconds, nudgeEndSeconds } from '../../../src/core/editing/nudgeTime.js'

// 트랙이 00:00 · 05:00 · 10:00에 있고 영상은 1800초라고 보았을 때의 범위들이다.
const FIRST_RANGE = { startMinSeconds: 0, toSeconds: 300 }
const MIDDLE_RANGE = { startMinSeconds: 1, toSeconds: 600 }
const LAST_RANGE = { startMinSeconds: 601, toSeconds: 1800 }
const UNBOUNDED_RANGE = { startMinSeconds: 601, toSeconds: null }

describe('nudgeStartSeconds', () => {
  it('시작에 변화량을 더한 초를 돌려준다', () => {
    const result = nudgeStartSeconds(300, 10, MIDDLE_RANGE, null)

    expect(result).toBe(310)
  })

  it('음수 변화량이면 그만큼 당긴다', () => {
    const result = nudgeStartSeconds(300, -60, MIDDLE_RANGE, null)

    expect(result).toBe(240)
  })

  it('앞 트랙 시작 1초 뒤에서 멈춘다', () => {
    const result = nudgeStartSeconds(30, -60, MIDDLE_RANGE, null)

    expect(result).toBe(1)
  })

  it('첫 트랙은 0초에서 멈춘다', () => {
    const result = nudgeStartSeconds(5, -10, FIRST_RANGE, null)

    expect(result).toBe(0)
  })

  it('끝이 비어 있으면 다음 트랙 시작 1초 전에서 멈춘다', () => {
    const result = nudgeStartSeconds(590, 60, MIDDLE_RANGE, null)

    expect(result).toBe(599)
  })

  it('끝이 정해져 있으면 끝 1초 전에서 멈춘다', () => {
    const result = nudgeStartSeconds(300, 600, MIDDLE_RANGE, 400)

    expect(result).toBe(399)
  })

  it('영상 길이를 넘은 시작은 영상 끝 1초 전으로 돌아온다', () => {
    const result = nudgeStartSeconds(2000, 0, LAST_RANGE, null)

    expect(result).toBe(1799)
  })

  it('범위 끝을 모르면 뒤로는 막지 않는다', () => {
    const result = nudgeStartSeconds(700, 600, UNBOUNDED_RANGE, null)

    expect(result).toBe(1300)
  })

  it('소수점이 섞인 초는 내림한다', () => {
    const result = nudgeStartSeconds(400.7, 0, MIDDLE_RANGE, null)

    expect(result).toBe(400)
  })

  it('변화량이 0이면 주어진 값을 범위 안으로 맞추기만 한다', () => {
    const result = nudgeStartSeconds(700, 0, MIDDLE_RANGE, null)

    expect(result).toBe(599)
  })
})

describe('nudgeEndSeconds', () => {
  it('끝에 변화량을 더한 초를 돌려준다', () => {
    const result = nudgeEndSeconds(400, 10, MIDDLE_RANGE, 300)

    expect(result).toBe(410)
  })

  it('끝이 비어 있으면 다음 트랙 시작을 기준으로 조정한다', () => {
    const result = nudgeEndSeconds(null, -10, MIDDLE_RANGE, 300)

    expect(result).toBe(590)
  })

  it('다음 트랙 시작에 닿으면 null(다음 트랙까지)이 된다', () => {
    const result = nudgeEndSeconds(590, 10, MIDDLE_RANGE, 300)

    expect(result).toBe(null)
  })

  it('끝이 비어 있을 때 늘리면 그대로 null이다', () => {
    const result = nudgeEndSeconds(null, 10, MIDDLE_RANGE, 300)

    expect(result).toBe(null)
  })

  it('마지막 트랙은 영상 길이에 닿으면 null이 된다', () => {
    const result = nudgeEndSeconds(1790, 10, LAST_RANGE, 700)

    expect(result).toBe(null)
  })

  it('시작 1초 뒤보다 앞으로는 당겨지지 않는다', () => {
    const result = nudgeEndSeconds(310, -60, MIDDLE_RANGE, 300)

    expect(result).toBe(301)
  })

  it('끝을 모르는 마지막 트랙은 시작 시각을 기준으로 삼는다', () => {
    const result = nudgeEndSeconds(null, 10, UNBOUNDED_RANGE, 700)

    expect(result).toBe(710)
  })

  it('범위 끝을 모르면 뒤로는 막지 않는다', () => {
    const result = nudgeEndSeconds(800, 600, UNBOUNDED_RANGE, 700)

    expect(result).toBe(1400)
  })

  it('소수점이 섞인 초는 내림한다', () => {
    const result = nudgeEndSeconds(400.7, 0, MIDDLE_RANGE, 300)

    expect(result).toBe(400)
  })
})
