// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { FIXTURE_VIDEO_SECONDS } from '../fixtures/media/fixtureVideo.js'
import { readCommentSnapshot } from '../fixtures/snapshots/commentSnapshot.js'
import { createFakePower } from '../fixtures/fakes/fakePlatform.js'
import { startWithFakes } from '../fixtures/fakes/startWithFakes.js'

// 트랙 시작은 1, 269, 556, 810, 1026, 1253, 1508, 1795초다.
const { commentTexts } = readCommentSnapshot('3yG8GXdnEFQ')

// 패널과 댓글 띠는 떼어내지 않고 이 표시 하나로 CSS가 숨긴다. 숨겨지는지는 e2e가 본다.
const TURNED_OFF_CLASS = 'timeline-skip-turned-off'
const FLOATING = '#timeline-skip-floating'
const ROW = '.timeline-skip-row'
const CHECKBOX = 'input[type="checkbox"]'

describe('켜고 끄기', () => {
  it('꺼지면 페이지에 꺼짐 표시가 붙는다', async () => {
    const extension = await startWithTimeline()

    extension.power.setTurnedOff(true)

    expect(document.documentElement.classList.contains(TURNED_OFF_CLASS)).toBe(true)
  })

  it('꺼져 있는 동안은 해제한 트랙을 건너뛰지 않는다', async () => {
    const extension = await startWithTimeline()
    toggleTrack(extension, 1)
    extension.power.setTurnedOff(true)

    extension.player.playTo(300)

    expect(extension.player.getCurrentTimeSeconds()).toBe(300)
  })

  it('꺼지면 플로팅 위젯이 사라진다', async () => {
    const extension = await startWithTimeline()
    expect(document.querySelector(FLOATING)).not.toBeNull()

    extension.power.setTurnedOff(true)

    expect(document.querySelector(FLOATING)).toBeNull()
  })

  it('다시 켜면 목록과 체크 상태가 그대로 돌아온다', async () => {
    const extension = await startWithTimeline()
    toggleTrack(extension, 1)
    extension.power.setTurnedOff(true)

    extension.power.setTurnedOff(false)

    expect(document.documentElement.classList.contains(TURNED_OFF_CLASS)).toBe(false)
    expect(document.querySelector(FLOATING)).not.toBeNull()
    expect(findCheckbox(extension, 1).checked).toBe(false)
    extension.player.playTo(300)
    expect(extension.player.getCurrentTimeSeconds()).toBe(556)
  })

  it('꺼진 채로 시작하면 처음부터 꺼짐 표시가 붙는다', async () => {
    await startWithFakes({ power: createFakePower({ isTurnedOff: true }) })

    expect(document.documentElement.classList.contains(TURNED_OFF_CLASS)).toBe(true)
  })
})

async function startWithTimeline() {
  document.documentElement.classList.remove(TURNED_OFF_CLASS)
  const extension = await startWithFakes({ durationSeconds: FIXTURE_VIDEO_SECONDS })
  extension.comments.loadComment(commentTexts.find((text) => extension.comments.countTimelines(text) > 0))

  return extension
}

function findCheckbox(extension, trackIndex) {
  return extension.findPanel().querySelectorAll(ROW)[trackIndex].querySelector(CHECKBOX)
}

function toggleTrack(extension, trackIndex) {
  findCheckbox(extension, trackIndex).click()
}
