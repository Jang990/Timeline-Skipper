// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { FIXTURE_VIDEO_SECONDS } from '../fixtures/media/fixtureVideo.js'
import { readCommentSnapshot } from '../fixtures/snapshots/commentSnapshot.js'
import { startWithFakes } from '../fixtures/fakes/startWithFakes.js'

// 트랙 시작은 1, 269, 556, 810, 1026, 1253, 1508, 1795초다. 아래 숫자는 전부 이 목록에서 나온다.
const { commentTexts } = readCommentSnapshot('3yG8GXdnEFQ')

const ROW = '.timeline-skip-row'
const CHECKBOX = 'input[type="checkbox"]'

describe('자동 스킵', () => {
  it('체크를 해제한 트랙 안으로 재생 위치를 옮기면 다음 체크된 트랙 시작으로 넘어간다', async () => {
    const extension = await startWithTimeline()
    toggleTrack(extension, 1)

    extension.player.playTo(300)

    expect(extension.player.getCurrentTimeSeconds()).toBe(556)
  })

  // 556초를 거쳐 가면 이동 기록이 둘이 된다. 기록이 하나뿐이라는 것이 "한 번에"다.
  it('연달아 해제한 트랙 둘은 한 번에 건너뛰어 그다음 체크된 트랙으로 간다', async () => {
    const extension = await startWithTimeline()
    toggleTrack(extension, 1)
    toggleTrack(extension, 2)

    extension.player.playTo(300)

    expect(extension.player.seekHistory).toEqual([810])
  })

  it('마지막 트랙을 해제하면 그 안으로 옮긴 재생 위치가 영상 끝으로 간다', async () => {
    const extension = await startWithTimeline()
    toggleTrack(extension, 7)

    extension.player.playTo(1797)

    expect(extension.player.getCurrentTimeSeconds()).toBe(FIXTURE_VIDEO_SECONDS)
  })

  it('해제했던 트랙을 다시 체크하면 그 안으로 옮겨도 머문다', async () => {
    const extension = await startWithTimeline()
    toggleTrack(extension, 1)
    toggleTrack(extension, 1)

    extension.player.playTo(300)

    expect(extension.player.getCurrentTimeSeconds()).toBe(300)
    expect(extension.player.seekHistory).toEqual([])
  })
})

async function startWithTimeline() {
  const extension = await startWithFakes({ durationSeconds: FIXTURE_VIDEO_SECONDS })
  extension.comments.loadComment(commentTexts.find((text) => extension.comments.countTimelines(text) > 0))

  return extension
}

// 패널은 다시 그릴 때마다 통째로 바뀐다. 행을 붙들지 말고 매번 새로 찾는다.
function toggleTrack(extension, trackIndex) {
  extension.findPanel().querySelectorAll(ROW)[trackIndex].querySelector(CHECKBOX).click()
}
