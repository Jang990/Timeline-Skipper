import { describe, it, expect } from 'vitest'

import { nudgeStartSeconds } from '../../../src/core/editing/nudgeTime.js'

// 트랙이 00:00 · 05:00 · 10:00에 있고 영상은 1800초라고 보았을 때의 범위들이다.
const FIRST_RANGE = { startMinSeconds: 0, toSeconds: 300 }
const MIDDLE_RANGE = { startMinSeconds: 1, toSeconds: 600 }
const LAST_RANGE = { startMinSeconds: 601, toSeconds: 1800 }
const UNBOUNDED_RANGE = { startMinSeconds: 601, toSeconds: null }

describe('nudgeStartSeconds', () => {
  it('시작에 변화량을 더한 초를 돌려준다', () => {
    const result = nudgeStartSeconds(300, 10, MIDDLE_RANGE)

    expect(result).toBe(310)
  })

  it('음수 변화량이면 그만큼 당긴다', () => {
    const result = nudgeStartSeconds(300, -60, MIDDLE_RANGE)

    expect(result).toBe(240)
  })

  it('앞 트랙 시작 1초 뒤에서 멈춘다', () => {
    const result = nudgeStartSeconds(30, -60, MIDDLE_RANGE)

    expect(result).toBe(1)
  })

  it('첫 트랙은 0초에서 멈춘다', () => {
    const result = nudgeStartSeconds(5, -10, FIRST_RANGE)

    expect(result).toBe(0)
  })

  it('다음 트랙 시작 1초 전에서 멈춘다', () => {
    const result = nudgeStartSeconds(590, 60, MIDDLE_RANGE)

    expect(result).toBe(599)
  })

  it('영상 길이를 넘은 시작은 영상 끝 1초 전으로 돌아온다', () => {
    const result = nudgeStartSeconds(2000, 0, LAST_RANGE)

    expect(result).toBe(1799)
  })

  it('범위 끝을 모르면 뒤로는 막지 않는다', () => {
    const result = nudgeStartSeconds(700, 600, UNBOUNDED_RANGE)

    expect(result).toBe(1300)
  })

  it('소수점이 섞인 초는 내림한다', () => {
    const result = nudgeStartSeconds(400.7, 0, MIDDLE_RANGE)

    expect(result).toBe(400)
  })

  it('변화량이 0이면 주어진 값을 범위 안으로 맞추기만 한다', () => {
    const result = nudgeStartSeconds(700, 0, MIDDLE_RANGE)

    expect(result).toBe(599)
  })
})
