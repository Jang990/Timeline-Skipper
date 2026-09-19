// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { FIXTURE_VIDEO_SECONDS } from '../fixtures/media/fixtureVideo.js'
import { readCommentSnapshot } from '../fixtures/snapshots/commentSnapshot.js'
import { startWithFakes } from '../fixtures/fakes/startWithFakes.js'
import { clickButton, fillInput, find, findRow, loadTimeline, toggleTrack } from '../fixtures/fakes/panelHelpers.js'

// 트랙 시작은 1, 269, 556, 810, 1026, 1253, 1508, 1795초이고, 마지막 트랙은 영상 끝에서 끝난다.
const { commentTexts } = readCommentSnapshot('3yG8GXdnEFQ')

const END_INPUT = '.timeline-skip-end-input'

describe('편집 중 건너뛰기와 반복 멈춤', () => {
  it('편집 행이 열려 있으면 체크 해제된 트랙 안으로 옮겨도 그 자리에 머문다', async () => {
    const extension = await startWithTimeline()
    toggleTrack(extension, 1)
    openEditRowAt(extension, 3)

    extension.player.playTo(300)

    expect(extension.player.getCurrentTimeSeconds()).toBe(300)
  })

  it('편집 행이 열려 있으면 트랙 사이 빈 구간으로 옮겨도 그 자리에 머문다', async () => {
    const extension = await startWithTimeline()
    openEditRowAt(extension, 0)
    fillInput(extension, END_INPUT, '03:00')
    clickButton(extension, '저장')
    openEditRowAt(extension, 2)

    // 첫 트랙의 끝을 180초로 당겨 두었으니 180~269초가 빈 구간이다.
    extension.player.playTo(200)

    expect(extension.player.getCurrentTimeSeconds()).toBe(200)
  })

  it('편집 행이 열려 있으면 반복이 켜져 있어도 영상 끝에서 되감지 않는다', async () => {
    const extension = await startWithTimeline()
    clickButton(extension, '반복 켜기')
    openEditRowAt(extension, 2)

    extension.player.playTo(FIXTURE_VIDEO_SECONDS)

    expect(extension.player.getCurrentTimeSeconds()).toBe(FIXTURE_VIDEO_SECONDS)
  })

  it('추가 행이 열려 있어도 체크 해제된 트랙 안에 머문다', async () => {
    const extension = await startWithTimeline()
    toggleTrack(extension, 1)
    clickButton(extension, '자세히 추가')
    expect(find(extension, '.timeline-skip-time-input')).not.toBeNull()

    extension.player.playTo(300)

    expect(extension.player.getCurrentTimeSeconds()).toBe(300)
  })

  it('편집을 취소하면 다시 건너뛴다', async () => {
    const extension = await startWithTimeline()
    toggleTrack(extension, 1)
    openEditRowAt(extension, 3)

    clickButton(extension, '취소')
    extension.player.playTo(300)

    expect(extension.player.getCurrentTimeSeconds()).toBe(556)
  })

  it('편집을 저장하면 다시 건너뛴다', async () => {
    const extension = await startWithTimeline()
    toggleTrack(extension, 1)
    openEditRowAt(extension, 3)

    clickButton(extension, '저장')
    extension.player.playTo(300)

    expect(extension.player.getCurrentTimeSeconds()).toBe(556)
  })
})

async function startWithTimeline() {
  const extension = await startWithFakes({ durationSeconds: FIXTURE_VIDEO_SECONDS })
  loadTimeline(extension, commentTexts)

  return extension
}

// 편집 행이 열리면 행 순서가 흔들린다. 열기 전에만 순번으로 찾는다.
function openEditRowAt(extension, trackIndex) {
  findRow(extension, trackIndex).querySelector('button[aria-label$=" 수정"]').click()
}
