import { describe, it, expect } from 'vitest'

import { toValidSettings } from '../../src/ui/floatingState.js'

const CORNER = { rightPixels: 120, bottomPixels: 80 }

describe('toValidSettings', () => {
  it('저장된 값이 없으면 보이는 접힘 상태로 시작한다', () => {
    expect(toValidSettings(undefined)).toEqual({ floatingHidden: false, floatingExpanded: false, floatingPosition: null })
    expect(toValidSettings(null)).toEqual({ floatingHidden: false, floatingExpanded: false, floatingPosition: null })
    expect(toValidSettings({})).toEqual({ floatingHidden: false, floatingExpanded: false, floatingPosition: null })
  })

  it('저장된 값이 참이면 그대로 쓴다', () => {
    expect(toValidSettings({ floatingHidden: true, floatingExpanded: true }))
      .toEqual({ floatingHidden: true, floatingExpanded: true, floatingPosition: null })
  })

  it('보임과 크기는 서로를 건드리지 않는다', () => {
    expect(toValidSettings({ floatingExpanded: true }))
      .toEqual({ floatingHidden: false, floatingExpanded: true, floatingPosition: null })

    expect(toValidSettings({ floatingHidden: true }))
      .toEqual({ floatingHidden: true, floatingExpanded: false, floatingPosition: null })
  })

  it('참이 아닌 값은 거짓으로 본다', () => {
    expect(toValidSettings({ floatingHidden: 'true', floatingExpanded: 1 }))
      .toEqual({ floatingHidden: false, floatingExpanded: false, floatingPosition: null })
  })

  it('저장된 자리는 그대로 쓴다', () => {
    expect(toValidSettings({ floatingPosition: CORNER }).floatingPosition).toEqual(CORNER)
  })

  it('자리의 두 숫자 중 하나라도 없으면 기본 자리로 돌린다', () => {
    expect(toValidSettings({ floatingPosition: { rightPixels: 120 } }).floatingPosition).toBeNull()
    expect(toValidSettings({ floatingPosition: { bottomPixels: 80 } }).floatingPosition).toBeNull()
  })

  it('자리가 숫자가 아니면 기본 자리로 돌린다', () => {
    expect(toValidSettings({ floatingPosition: { rightPixels: '120', bottomPixels: 80 } }).floatingPosition).toBeNull()
    expect(toValidSettings({ floatingPosition: { rightPixels: Number.NaN, bottomPixels: 80 } }).floatingPosition).toBeNull()
  })
})
