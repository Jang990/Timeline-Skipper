import { describe, it, expect } from 'vitest'

import { createEditingState } from '../../src/ui/editingState.js'

// 알림을 받은 재생 위치를 차례로 모은다.
function createListener() {
  const heardSeconds = []

  return { heardSeconds, listen: (currentTimeSeconds) => heardSeconds.push(currentTimeSeconds) }
}

describe('createEditingState 재생 위치 알림', () => {
  it('편집이 열려 있으면 재생 위치를 지켜보는 곳에 알린다', () => {
    const editing = createEditingState()
    const listener = createListener()
    editing.startEditing(269)
    editing.watchPlayback(listener.listen)

    editing.notifyPlayback(300.5)

    expect(listener.heardSeconds).toEqual([300.5])
  })

  it('추가 행이 열려 있어도 재생 위치를 알린다', () => {
    const editing = createEditingState()
    const listener = createListener()
    editing.startAdding(100)
    editing.watchPlayback(listener.listen)

    editing.notifyPlayback(120)

    expect(listener.heardSeconds).toEqual([120])
  })

  it('편집을 취소하면 더 이상 알리지 않는다', () => {
    const editing = createEditingState()
    const listener = createListener()
    editing.startEditing(269)
    editing.watchPlayback(listener.listen)

    editing.cancel()
    editing.notifyPlayback(300)

    expect(listener.heardSeconds).toEqual([])
  })

  it('편집을 확정하면 더 이상 알리지 않는다', () => {
    const editing = createEditingState()
    const listener = createListener()
    editing.startEditing(269)
    editing.watchPlayback(listener.listen)

    editing.finishEdit()
    editing.notifyPlayback(300)

    expect(listener.heardSeconds).toEqual([])
  })

  it('다른 행을 열면 이전에 지켜보던 곳에는 알리지 않는다', () => {
    const editing = createEditingState()
    const previousListener = createListener()
    const nextListener = createListener()
    editing.startEditing(269)
    editing.watchPlayback(previousListener.listen)

    editing.startEditing(556)
    editing.watchPlayback(nextListener.listen)
    editing.notifyPlayback(600)

    expect(previousListener.heardSeconds).toEqual([])
    expect(nextListener.heardSeconds).toEqual([600])
  })

  it('영상이 바뀌어 편집이 초기화되면 더 이상 알리지 않는다', () => {
    const editing = createEditingState()
    const listener = createListener()
    editing.startEditing(269)
    editing.watchPlayback(listener.listen)

    editing.reset()
    editing.notifyPlayback(300)

    expect(listener.heardSeconds).toEqual([])
  })

  it('편집이 열려 있지 않으면 지켜보기를 받지 않는다', () => {
    const editing = createEditingState()
    const listener = createListener()
    editing.watchPlayback(listener.listen)

    editing.startEditing(269)
    editing.notifyPlayback(300)

    expect(listener.heardSeconds).toEqual([])
  })

  it('지켜보는 곳이 없으면 알려도 아무 일도 일어나지 않는다', () => {
    const editing = createEditingState()
    editing.startEditing(269)

    expect(() => editing.notifyPlayback(300)).not.toThrow()
  })
})
