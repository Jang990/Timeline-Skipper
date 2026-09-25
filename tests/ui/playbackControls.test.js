// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { readCommentSnapshot } from '../fixtures/snapshots/commentSnapshot.js'
import { startWithFakes } from '../fixtures/fakes/startWithFakes.js'
import { clickButton, findAll, loadTimeline, toggleTrack } from '../fixtures/fakes/panelHelpers.js'

// 트랙 시작은 1, 269, 556, 810, 1026, 1253, 1508, 1795초다. 아래 숫자는 전부 이 목록에서 나온다.
const { commentTexts } = readCommentSnapshot('3yG8GXdnEFQ')

// 같은 버튼이 플로팅 위젯에도 있다. 패널 안에서만 찾는다.
describe('패널 재생 조작', () => {
  it('재생 버튼을 누르면 재생되고 버튼이 일시정지 아이콘으로 바뀐다', async () => {
    const extension = await startWithTimeline()

    clickButton(extension, '재생')

    expect(findAll(extension, 'button[aria-label="일시정지"] svg[data-icon="pause"]')).toHaveLength(1)
    expect(extension.player.isPaused()).toBe(false)
  })

  it('일시정지 버튼을 누르면 멈추고 버튼이 재생 아이콘으로 돌아온다', async () => {
    const extension = await startWithTimeline()
    clickButton(extension, '재생')

    clickButton(extension, '일시정지')

    expect(findAll(extension, 'button[aria-label="재생"] svg[data-icon="play"]')).toHaveLength(1)
    expect(extension.player.isPaused()).toBe(true)
  })

  it('⏭은 다음 트랙 시작으로 옮긴다', async () => {
    const extension = await startWithTimeline()
    extension.player.playTo(100)

    clickButton(extension, '다음 트랙')

    expect(extension.player.getCurrentTimeSeconds()).toBe(269)
  })

  it('⏭은 체크를 해제한 트랙을 건너뛰고 그다음 체크된 트랙으로 옮긴다', async () => {
    const extension = await startWithTimeline()
    toggleTrack(extension, 1)
    extension.player.playTo(100)

    clickButton(extension, '다음 트랙')

    expect(extension.player.getCurrentTimeSeconds()).toBe(556)
  })

  it('⏮은 곡 중간에서 누르면 그 곡의 시작으로 옮긴다', async () => {
    const extension = await startWithTimeline()
    extension.player.playTo(300)

    clickButton(extension, '이전 트랙')

    expect(extension.player.getCurrentTimeSeconds()).toBe(269)
  })

  it('⏮은 곡 시작 3초 안에서 누르면 이전 트랙 시작으로 옮긴다', async () => {
    const extension = await startWithTimeline()
    extension.player.playTo(270)

    clickButton(extension, '이전 트랙')

    expect(extension.player.getCurrentTimeSeconds()).toBe(1)
  })

  it('첫 트랙 시작 3초 안에서 ⏮을 누르면 첫 트랙의 처음으로 되감는다', async () => {
    const extension = await startWithTimeline()
    extension.player.playTo(3)

    clickButton(extension, '이전 트랙')

    expect(extension.player.getCurrentTimeSeconds()).toBe(1)
  })

  it('반복이 켜져 있으면 첫 트랙 시작 3초 안에서 ⏮을 누르면 마지막 트랙으로 가서 계속 재생한다', async () => {
    const extension = await startWithTimeline()
    clickButton(extension, '반복 켜기')
    clickButton(extension, '재생')
    extension.player.playTo(3)

    clickButton(extension, '이전 트랙')

    expect(extension.player.getCurrentTimeSeconds()).toBe(1795)
    expect(extension.player.isPaused()).toBe(false)
  })

  it('마지막 트랙에서 ⏭을 누르면 첫 트랙으로 가고 멈춘다', async () => {
    const extension = await startWithTimeline()
    clickButton(extension, '재생')
    extension.player.playTo(1797)

    clickButton(extension, '다음 트랙')

    expect(extension.player.getCurrentTimeSeconds()).toBe(1)
    expect(extension.player.isPaused()).toBe(true)
    expect(findAll(extension, 'button[aria-label="재생"] svg[data-icon="play"]')).toHaveLength(1)
  })

  it('반복이 켜져 있으면 마지막 트랙에서 ⏭을 눌러도 첫 트랙으로 가서 계속 재생한다', async () => {
    const extension = await startWithTimeline()
    clickButton(extension, '반복 켜기')
    clickButton(extension, '재생')
    extension.player.playTo(1797)

    clickButton(extension, '다음 트랙')

    expect(extension.player.getCurrentTimeSeconds()).toBe(1)
    expect(extension.player.isPaused()).toBe(false)
  })
})

async function startWithTimeline() {
  const extension = await startWithFakes()
  loadTimeline(extension, commentTexts)

  return extension
}
