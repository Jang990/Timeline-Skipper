import { describe, it, expect } from 'vitest'

import { createRenderGate } from '../../src/ui/renderGate.js'

const NOT_EDITING_KEY = 'null#null'
const EDITING_KEY = '269#null'

// 두 번째 트랙의 한 칸만 바꾼 목록. 다른 칸이 함께 바뀌면 무엇 때문에 다시 그렸는지 알 수 없다.
function createTracks(secondTrackChanges = {}) {
  return [
    { startSeconds: 0, trimmedEndSeconds: null, title: 'Intro' },
    { startSeconds: 269, trimmedEndSeconds: 300, title: 'Ballerino', ...secondTrackChanges }
  ]
}

function createView(overrides = {}) {
  return {
    tracks: createTracks(),
    disabledStartSeconds: new Set(),
    isPaused: false,
    loopEnabled: false,
    playingStartSeconds: 0,
    floatingHidden: false,
    ...overrides
  }
}

function request(overrides = {}) {
  return { hasPanel: true, view: createView(), editKey: NOT_EDITING_KEY, isEditing: false, ...overrides }
}

describe('createRenderGate', () => {
  it('처음 요청은 그리라고 한다', () => {
    const gate = createRenderGate()

    const decision = gate.decide(request())

    expect(decision).toBe('draw')
  })

  it('패널이 없으면 내용이 같아도 그리라고 한다', () => {
    const gate = createRenderGate()
    gate.decide(request())

    const decision = gate.decide(request({ hasPanel: false }))

    expect(decision).toBe('draw')
  })

  it('내용이 같으면 건너뛰라고 한다', () => {
    const gate = createRenderGate()
    gate.decide(request())

    const decision = gate.decide(request())

    expect(decision).toBe('skip')
  })

  it.each([
    ['트랙 시작 시각', { tracks: createTracks({ startSeconds: 270 }) }],
    ['당긴 끝 시각', { tracks: createTracks({ trimmedEndSeconds: 290 }) }],
    ['제목', { tracks: createTracks({ title: 'Outro' }) }],
    ['해제한 트랙', { disabledStartSeconds: new Set([269]) }],
    ['일시정지', { isPaused: true }],
    ['반복', { loopEnabled: true }],
    ['재생 중인 트랙', { playingStartSeconds: 269 }],
    ['플로팅 숨김', { floatingHidden: true }]
  ])('%s이(가) 바뀌면 다시 그리라고 한다', (fieldName, changes) => {
    const gate = createRenderGate()
    gate.decide(request())

    const decision = gate.decide(request({ view: createView(changes) }))

    expect(decision).toBe('draw')
  })

  it('편집 대상이 바뀌면 다시 그리라고 한다', () => {
    const gate = createRenderGate()
    gate.decide(request())

    const decision = gate.decide(request({ editKey: EDITING_KEY, isEditing: true }))

    expect(decision).toBe('draw')
  })

  it('편집 중이고 편집 대상이 그대로면 내용이 바뀌어도 재생 위치만 넘기라고 한다', () => {
    const gate = createRenderGate()
    gate.decide(request({ editKey: EDITING_KEY, isEditing: true }))

    const decision = gate.decide(
      request({ view: createView({ playingStartSeconds: 269 }), editKey: EDITING_KEY, isEditing: true })
    )

    expect(decision).toBe('playback')
  })

  it('편집 중이어도 패널이 없으면 그리라고 한다', () => {
    const gate = createRenderGate()
    gate.decide(request({ editKey: EDITING_KEY, isEditing: true }))

    const decision = gate.decide(request({ hasPanel: false, editKey: EDITING_KEY, isEditing: true }))

    expect(decision).toBe('draw')
  })

  it('편집 기록을 잊으면 편집 대상이 그대로여도 재생 위치만 넘기라고 하지 않는다', () => {
    const gate = createRenderGate()
    gate.decide(request({ editKey: EDITING_KEY, isEditing: true }))
    gate.forgetEditKey()

    const decision = gate.decide(
      request({ view: createView({ playingStartSeconds: 269 }), editKey: EDITING_KEY, isEditing: true })
    )

    expect(decision).toBe('draw')
  })
})
