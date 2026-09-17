// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { FIXTURE_VIDEO_SECONDS } from '../fixtures/media/fixtureVideo.js'
import { readCommentSnapshot } from '../fixtures/snapshots/commentSnapshot.js'
import { startWithFakes } from '../fixtures/fakes/startWithFakes.js'
import { findRow, loadTimeline } from '../fixtures/fakes/panelHelpers.js'

// 트랙 시작은 1, 269, 556, 810, 1026, 1253, 1508, 1795초다. 아래 숫자는 전부 이 목록에서 나온다.
const { commentTexts } = readCommentSnapshot('3yG8GXdnEFQ')

describe('시각 클릭 이동', () => {
  it('트랙의 시각을 누르면 그 트랙의 시작으로 옮긴다', async () => {
    const extension = await startWithTimeline()

    clickTrackTime(extension, 2)

    expect(extension.player.getCurrentTimeSeconds()).toBe(556)
  })

  it('뒤쪽에 있다가 앞 트랙의 시각을 누르면 그 트랙 시작으로 되돌아간다', async () => {
    const extension = await startWithTimeline()
    extension.player.playTo(1000)

    clickTrackTime(extension, 1)

    expect(extension.player.getCurrentTimeSeconds()).toBe(269)
  })
})

async function startWithTimeline() {
  const extension = await startWithFakes({ durationSeconds: FIXTURE_VIDEO_SECONDS })
  loadTimeline(extension, commentTexts)

  return extension
}

function clickTrackTime(extension, trackIndex) {
  findRow(extension, trackIndex).querySelector('.timeline-skip-time').click()
}
