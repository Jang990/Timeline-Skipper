// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { FIXTURE_VIDEO_SECONDS } from '../fixtures/media/fixtureVideo.js'
import { readCommentSnapshot } from '../fixtures/snapshots/commentSnapshot.js'
import { settle, startWithFakes } from '../fixtures/fakes/startWithFakes.js'

// 트랙 시작은 1, 269, 556, 810, 1026, 1253, 1508, 1795초이고, 마지막 트랙은 영상 끝에서 끝난다.
const { commentTexts } = readCommentSnapshot('3yG8GXdnEFQ')

// 같은 버튼이 플로팅 위젯에도 있다. findPanel 안에서만 찾아 패널로 좁힌다.
const ROW = '.timeline-skip-row'
const LOOP_ON_BUTTON = '[aria-label="반복 켜기"]'
const LOOP_OFF_BUTTON = '[aria-label="반복 끄기"]'

describe('반복 재생', () => {
  it('🔁를 누르면 반복이 켜지고 버튼이 켜진 모양으로 바뀐다', async () => {
    const extension = await startWithTimeline()

    find(extension, LOOP_ON_BUTTON).click()

    expect(find(extension, LOOP_OFF_BUTTON).classList.contains('is-active')).toBe(true)
  })

  it('반복을 켜면 영상 끝으로 옮긴 재생 위치가 첫 트랙 시작으로 돌아간다', async () => {
    const extension = await startWithTimeline()
    find(extension, LOOP_ON_BUTTON).click()

    extension.player.playTo(FIXTURE_VIDEO_SECONDS)

    expect(extension.player.getCurrentTimeSeconds()).toBe(1)
  })

  // 유튜브는 끝 너머로 옮기면 재생 시각이 끝에 닿지 않은 채 영상을 끝낸다. 시각이 아니라 종료 알림으로 되감는다.
  it('반복을 켜고 플레이어가 영상 종료를 알리면 첫 트랙 시작으로 옮기고 재생한다', async () => {
    const extension = await startWithTimeline()
    find(extension, LOOP_ON_BUTTON).click()

    extension.player.endVideo()

    expect(extension.player.getCurrentTimeSeconds()).toBe(1)
    expect(extension.player.isPaused()).toBe(false)
  })

  // 반복이 없으면 같은 자리에서 영상 끝으로 간다(autoSkip.test.js). 반복이 스킵보다 먼저라는 것을
  // 이 차이가 보여준다.
  it('마지막 트랙을 해제하고 반복을 켜면 그 앞 트랙이 끝날 때 첫 트랙 시작으로 돌아간다', async () => {
    const extension = await startWithTimeline()
    toggleTrack(extension, 7)
    find(extension, LOOP_ON_BUTTON).click()

    extension.player.playTo(1796)

    expect(extension.player.getCurrentTimeSeconds()).toBe(1)
  })

  it('첫 트랙을 해제하고 반복을 켜면 둘째 트랙 시작으로 돌아간다', async () => {
    const extension = await startWithTimeline()
    toggleTrack(extension, 0)
    find(extension, LOOP_ON_BUTTON).click()

    extension.player.playTo(FIXTURE_VIDEO_SECONDS)

    expect(extension.player.getCurrentTimeSeconds()).toBe(269)
  })

  it('반복을 끄면 영상 끝으로 옮긴 재생 위치가 그대로다', async () => {
    const extension = await startWithTimeline()
    find(extension, LOOP_ON_BUTTON).click()
    find(extension, LOOP_OFF_BUTTON).click()

    extension.player.playTo(FIXTURE_VIDEO_SECONDS)

    expect(extension.player.getCurrentTimeSeconds()).toBe(FIXTURE_VIDEO_SECONDS)
    expect(extension.player.seekHistory).toEqual([])
  })

  // 진짜 저장소를 거치는 새로고침은 loop.spec.js가 맡는다. 여기서는 저장분으로 되살리는 쪽만 본다.
  it('반복 상태는 같은 저장소로 다시 시작한 뒤에도 유지된다', async () => {
    const extension = await startWithTimeline()
    find(extension, LOOP_ON_BUTTON).click()
    await settle()

    const restarted = await extension.restart()

    expect(find(restarted, LOOP_OFF_BUTTON).classList.contains('is-active')).toBe(true)
  })
})

async function startWithTimeline() {
  const extension = await startWithFakes({ durationSeconds: FIXTURE_VIDEO_SECONDS })
  extension.comments.loadComment(commentTexts.find((text) => extension.comments.countTimelines(text) > 0))

  return extension
}

// 패널은 다시 그릴 때마다 통째로 바뀐다. 요소를 붙들지 말고 매번 새로 찾는다.
function find(extension, selector) {
  return extension.findPanel().querySelector(selector)
}

function toggleTrack(extension, trackIndex) {
  extension.findPanel().querySelectorAll(ROW)[trackIndex].querySelector('input[type="checkbox"]').click()
}
