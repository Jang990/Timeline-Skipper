// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { FIXTURE_VIDEO_SECONDS } from '../fixtures/media/fixtureVideo.js'
import { startWithFakes } from '../fixtures/fakes/startWithFakes.js'
import { clickButton, find, findRow, loadTimeline, toggleTrack } from '../fixtures/fakes/panelHelpers.js'

// 트랙 시작은 0, 300, 600초이고, 마지막 트랙은 영상 끝에서 끝난다.
const TIMELINE_COMMENT = ['00:00 첫 곡', '05:00 둘째 곡', '10:00 셋째 곡'].join('\n')

const SKIP_LABEL = '체크 해제하고 넘기기'
const SKIP_BUTTON = `button[aria-label="${SKIP_LABEL}"]`
const FLOATING = '#timeline-skip-floating'

describe('재생 중인 트랙 체크 해제하고 넘기기', () => {
  it('넘기기 버튼을 누르면 재생 중인 트랙의 체크가 해제된다', async () => {
    const extension = await startWithTimeline()
    extension.player.playTo(400)

    clickButton(extension, SKIP_LABEL)

    expect(readChecked(extension)).toEqual([true, false, true])
  })

  it('넘기기 버튼을 누르면 다음 체크된 트랙의 시작으로 옮긴다', async () => {
    const extension = await startWithTimeline()
    extension.player.playTo(100)

    clickButton(extension, SKIP_LABEL)

    expect(extension.player.getCurrentTimeSeconds()).toBe(300)
  })

  it('반복이 켜져 있으면 마지막 트랙에서 눌렀을 때 첫 체크된 트랙으로 돌아간다', async () => {
    const extension = await startWithTimeline()
    clickButton(extension, '반복 켜기')
    extension.player.playTo(700)

    clickButton(extension, SKIP_LABEL)

    expect(extension.player.getCurrentTimeSeconds()).toBe(0)
  })

  it('뒤에 체크된 트랙이 없으면 영상 끝으로 옮긴다', async () => {
    const extension = await startWithTimeline()
    extension.player.playTo(700)

    clickButton(extension, SKIP_LABEL)

    expect(extension.player.getCurrentTimeSeconds()).toBe(FIXTURE_VIDEO_SECONDS)
  })

  it('체크된 트랙이 이것 하나뿐이면 체크만 해제하고 재생 위치는 그대로다', async () => {
    const extension = await startWithTimeline()
    toggleTrack(extension, 0)
    toggleTrack(extension, 2)
    extension.player.playTo(400)

    clickButton(extension, SKIP_LABEL)

    expect(readChecked(extension)).toEqual([false, false, false])
    expect(extension.player.getCurrentTimeSeconds()).toBe(400)
  })

  // 편집 중에는 패널을 다시 그리지 않는다(renderGate). 체크 해제는 저장분을 다시 읽어 확인한다.
  it('편집 중에 누르면 체크만 해제하고 재생 위치는 그대로다', async () => {
    const extension = await startWithTimeline()
    extension.player.playTo(400)
    clickButton(extension, '자세히 추가')

    clickButton(extension, SKIP_LABEL)

    expect(extension.player.getCurrentTimeSeconds()).toBe(400)
    expect(readChecked(await extension.restart())).toEqual([true, false, true])
  })

  it('첫 트랙 앞 구간에서는 넘기기 버튼이 없다', async () => {
    const extension = await startWithFakes()
    loadTimeline(extension, [['01:00 첫 곡', '05:00 둘째 곡'].join('\n')])
    document.querySelector(`${FLOATING} .timeline-skip-floating-icon`).click()

    extension.player.playTo(30)

    expect(find(extension, SKIP_BUTTON)).toBeNull()
    expect(document.querySelector(`${FLOATING} ${SKIP_BUTTON}`)).toBeNull()
  })

  it('패널 카드, 플로팅 위젯, PiP 창에 넘기기 버튼이 모두 있다', async () => {
    const extension = await startWithTimeline()
    extension.player.playTo(400)
    document.querySelector(`${FLOATING} .timeline-skip-floating-icon`).click()
    const hasFloatingButton = document.querySelector(`${FLOATING} ${SKIP_BUTTON}`) !== null

    document.querySelector(`${FLOATING} button[aria-label="PiP로 띄우기"]`).click()

    expect(find(extension, SKIP_BUTTON)).not.toBeNull()
    expect(hasFloatingButton).toBe(true)
    expect(extension.pictureInPicture.getDocument().querySelector(`${FLOATING} ${SKIP_BUTTON}`)).not.toBeNull()
  })
})

async function startWithTimeline() {
  const extension = await startWithFakes()
  loadTimeline(extension, [TIMELINE_COMMENT])

  return extension
}

function readChecked(extension) {
  return [0, 1, 2].map((trackIndex) => findRow(extension, trackIndex).querySelector('input[type="checkbox"]').checked)
}
