import { describe, it, expect } from 'vitest'

import { toValidSettings } from '../../src/ui/floatingState.js'

describe('toValidSettings', () => {
  it('저장된 값이 없으면 보이는 접힘 상태로 시작한다', () => {
    expect(toValidSettings(undefined)).toEqual({ floatingHidden: false, floatingExpanded: false })
    expect(toValidSettings(null)).toEqual({ floatingHidden: false, floatingExpanded: false })
    expect(toValidSettings({})).toEqual({ floatingHidden: false, floatingExpanded: false })
  })

  it('저장된 값이 참이면 그대로 쓴다', () => {
    expect(toValidSettings({ floatingHidden: true, floatingExpanded: true }))
      .toEqual({ floatingHidden: true, floatingExpanded: true })
  })

  it('보임과 크기는 서로를 건드리지 않는다', () => {
    expect(toValidSettings({ floatingExpanded: true }))
      .toEqual({ floatingHidden: false, floatingExpanded: true })

    expect(toValidSettings({ floatingHidden: true }))
      .toEqual({ floatingHidden: true, floatingExpanded: false })
  })

  it('참이 아닌 값은 거짓으로 본다', () => {
    expect(toValidSettings({ floatingHidden: 'true', floatingExpanded: 1 }))
      .toEqual({ floatingHidden: false, floatingExpanded: false })
  })
})
