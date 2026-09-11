import { describe, it, expect } from 'vitest'

import { createEditingState } from '../../src/ui/editingState.js'

// 둘째 곡(300초)을 고치는 중에 따라가기를 켜 두고, 처리기가 받은 것을 모은다.
function startFollowingWhileEditing() {
  const editing = createEditingState()
  const received = []

  editing.startEditing(300)
  editing.startFollowing((update) => received.push(update))

  return { editing, received }
}

describe('createEditingState의 따라가기', () => {
  it('편집 중이 아니면 따라가기를 켤 수 없다', () => {
    const editing = createEditingState()

    editing.startFollowing(() => {})

    expect(editing.isFollowing()).toBe(false)
  })

  it('따라가는 동안 재생 위치를 넘겨 받은 처리기에 전한다', () => {
    const { editing, received } = startFollowingWhileEditing()

    editing.followPlayback({ currentTimeSeconds: 410, isPaused: false })

    expect(received).toEqual([{ currentTimeSeconds: 410, isFollowing: true }])
  })

  it('재생 중이던 영상이 멈추면 따라가기가 꺼진다', () => {
    const { editing } = startFollowingWhileEditing()

    editing.followPlayback({ currentTimeSeconds: 410, isPaused: false })
    editing.followPlayback({ currentTimeSeconds: 412, isPaused: true })

    expect(editing.isFollowing()).toBe(false)
  })

  it('따라가기가 꺼지는 순간에도 멈춘 위치를 처리기에 전한다', () => {
    const { editing, received } = startFollowingWhileEditing()

    editing.followPlayback({ currentTimeSeconds: 410, isPaused: false })
    editing.followPlayback({ currentTimeSeconds: 412, isPaused: true })

    expect(received.at(-1)).toEqual({ currentTimeSeconds: 412, isFollowing: false })
  })

  it('멈춘 채로 켠 따라가기는 재생되었다가 멈출 때 꺼진다', () => {
    const { editing } = startFollowingWhileEditing()

    editing.followPlayback({ currentTimeSeconds: 400, isPaused: true })
    const isFollowingBeforePlay = editing.isFollowing()
    editing.followPlayback({ currentTimeSeconds: 401, isPaused: false })
    editing.followPlayback({ currentTimeSeconds: 405, isPaused: true })

    expect(isFollowingBeforePlay).toBe(true)
    expect(editing.isFollowing()).toBe(false)
  })

  it('따라가기를 끄면 더는 재생 위치를 전하지 않는다', () => {
    const { editing, received } = startFollowingWhileEditing()

    editing.stopFollowing()
    editing.followPlayback({ currentTimeSeconds: 410, isPaused: false })

    expect(editing.isFollowing()).toBe(false)
    expect(received).toEqual([])
  })

  it('편집을 취소하면 따라가기도 꺼진다', () => {
    const { editing } = startFollowingWhileEditing()

    editing.cancel()

    expect(editing.isFollowing()).toBe(false)
  })

  it('수정을 확정하면 따라가기도 꺼진다', () => {
    const { editing } = startFollowingWhileEditing()

    editing.finishEdit()

    expect(editing.isFollowing()).toBe(false)
  })

  it('추가를 확정하면 따라가기도 꺼진다', () => {
    const editing = createEditingState()
    editing.startAdding(120)
    editing.startFollowing(() => {})

    editing.finishAdd()

    expect(editing.isFollowing()).toBe(false)
  })

  it('다른 행을 열면 따라가기가 꺼진다', () => {
    const { editing } = startFollowingWhileEditing()

    editing.startEditing(600)

    expect(editing.isFollowing()).toBe(false)
  })

  it('영상이 바뀌어 reset되면 따라가기가 꺼진다', () => {
    const { editing } = startFollowingWhileEditing()

    editing.reset()

    expect(editing.isFollowing()).toBe(false)
  })
})
