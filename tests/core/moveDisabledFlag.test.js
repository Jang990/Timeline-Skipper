import { describe, it, expect } from 'vitest'

import { moveDisabledFlag } from '../../src/core/moveDisabledFlag.js'

describe('moveDisabledFlag', () => {
  it('비활성이던 시각을 옮기면 새 시각이 비활성이 된다', () => {
    const disabled = new Set([90])

    const result = moveDisabledFlag(disabled, 90, 120)

    expect(result).toEqual(new Set([120]))
  })

  it('활성이던 시각을 옮기면 새 시각도 활성으로 남는다', () => {
    const disabled = new Set([200])

    const result = moveDisabledFlag(disabled, 90, 120)

    expect(result).toEqual(new Set([200]))
  })

  it('새 시각이 null이면 옛 시각의 비활성 표시만 사라진다', () => {
    const disabled = new Set([90, 200])

    const result = moveDisabledFlag(disabled, 90, null)

    expect(result).toEqual(new Set([200]))
  })

  it('관계없는 시각의 비활성 표시는 건드리지 않는다', () => {
    const disabled = new Set([0, 90, 200])

    const result = moveDisabledFlag(disabled, 90, 120)

    expect(result).toEqual(new Set([0, 120, 200]))
  })

  it('이전 시각이 null이면(추가) 어떤 표시도 옮기지 않는다', () => {
    const disabled = new Set([90])

    const result = moveDisabledFlag(disabled, null, 120)

    expect(result).toEqual(new Set([90]))
  })

  it('입력 Set을 변경하지 않는다', () => {
    const disabled = new Set([90])

    moveDisabledFlag(disabled, 90, 120)

    expect(disabled).toEqual(new Set([90]))
  })
})
