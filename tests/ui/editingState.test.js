import { describe, it, expect } from 'vitest'

import { createEditingState } from '../../src/ui/editingState.js'

describe('createEditingState', () => {
  it('아무것도 열지 않았으면 편집 중이 아니다', () => {
    const editing = createEditingState()

    expect(editing.isEditing()).toBe(false)
    expect(editing.getEditingStartSeconds()).toBe(null)
    expect(editing.getAddingDraftSeconds()).toBe(null)
  })

  it('트랙 수정을 시작하면 그 트랙의 시작 시각이 편집 대상이 된다', () => {
    const editing = createEditingState()

    editing.startEditing(269)

    expect(editing.isEditing()).toBe(true)
    expect(editing.getEditingStartSeconds()).toBe(269)
  })

  it('추가를 시작하면 지금 재생 위치를 초 단위로 내림해 기본값으로 잡는다', () => {
    const editing = createEditingState()

    editing.startAdding(92.7)

    expect(editing.isEditing()).toBe(true)
    expect(editing.getAddingDraftSeconds()).toBe(92)
  })

  it('재생 위치를 알 수 없으면 0초를 기본값으로 잡는다', () => {
    const editing = createEditingState()

    editing.startAdding(Number.NaN)

    expect(editing.getAddingDraftSeconds()).toBe(0)
  })

  it('수정 중에 추가를 시작하면 열려 있던 수정이 닫힌다', () => {
    const editing = createEditingState()

    editing.startEditing(100)
    editing.startAdding(50)

    expect(editing.getEditingStartSeconds()).toBe(null)
    expect(editing.getAddingDraftSeconds()).toBe(50)
  })

  it('추가 중에 수정을 시작하면 열려 있던 추가가 닫힌다', () => {
    const editing = createEditingState()

    editing.startAdding(50)
    editing.startEditing(100)

    expect(editing.getAddingDraftSeconds()).toBe(null)
    expect(editing.getEditingStartSeconds()).toBe(100)
  })

  it('취소하면 수정과 추가가 모두 닫힌다', () => {
    const editing = createEditingState()

    editing.startEditing(100)
    editing.cancel()

    expect(editing.isEditing()).toBe(false)
    expect(editing.getEditingStartSeconds()).toBe(null)
    expect(editing.getAddingDraftSeconds()).toBe(null)
  })

  it('수정을 확정하면 수정만 닫히고 추가 상태는 건드리지 않는다', () => {
    const editing = createEditingState()

    editing.startAdding(30)
    editing.finishEdit()

    expect(editing.getEditingStartSeconds()).toBe(null)
    expect(editing.getAddingDraftSeconds()).toBe(30)
  })

  it('추가를 확정하면 추가만 닫힌다', () => {
    const editing = createEditingState()

    editing.startEditing(100)
    editing.finishAdd()

    expect(editing.getAddingDraftSeconds()).toBe(null)
    expect(editing.getEditingStartSeconds()).toBe(100)
  })

  it('reset은 열려 있던 수정과 추가를 모두 닫는다', () => {
    const editing = createEditingState()

    editing.startAdding(30)
    editing.reset()

    expect(editing.isEditing()).toBe(false)
    expect(editing.getAddingDraftSeconds()).toBe(null)
  })

  it('편집 키는 수정 대상이 바뀌면 함께 바뀐다', () => {
    const editing = createEditingState()

    editing.startEditing(10)
    const firstKey = editing.toKey()
    editing.startEditing(20)

    expect(editing.toKey()).not.toBe(firstKey)
  })

  it('같은 시각을 수정 중일 때와 추가 중일 때의 편집 키는 서로 다르다', () => {
    const whileEditing = createEditingState()
    const whileAdding = createEditingState()

    whileEditing.startEditing(30)
    whileAdding.startAdding(30)

    expect(whileEditing.toKey()).not.toBe(whileAdding.toKey())
  })
})
