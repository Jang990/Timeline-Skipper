// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { loadTimeline, toggleTrack, findRow } from '../fixtures/fakes/panelHelpers.js'
import { startWithFakes } from '../fixtures/fakes/startWithFakes.js'

const COMMENT_TEXTS = [['00:01 첫 곡', '02:00 둘째 곡', '05:00 셋째 곡'].join('\n')]
const PANEL_ID = 'timeline-skip-panel'
const BELOW_VIDEO_CLASS = 'is-below-video'

// 유튜브는 창이 좁아지면 두 줄 표시(is-two-columns_)를 떼고 자기 부품을 영상 아래 칸(#below)으로 옮긴다.
// 픽스처 페이지에는 추천 영상 칸만 있어서, 배치를 흉내 낼 요소는 여기서 세운다.
function showLayout({ isTwoColumns }) {
  document.querySelector('ytd-watch-flexy')?.remove()

  const watchFlexy = document.createElement('ytd-watch-flexy')
  watchFlexy.toggleAttribute('is-two-columns_', isTwoColumns)
  watchFlexy.innerHTML = '<div id="below"><div id="description"></div></div>'
  document.body.prepend(watchFlexy)
}

// 진짜는 유튜브가 부품을 옮길 때 DOM 감시가 알려준다. 가짜 페이지로 같은 알림을 보낸다.
function notifyPageChanged(extension) {
  return extension.page.navigateTo(extension.page.readVideoId())
}

function findBelow() {
  return document.getElementById('below')
}

function findSecondaryInner() {
  return document.getElementById('secondary-inner')
}

describe('창 너비에 따른 패널 자리', () => {
  it('좁은 배치로 바뀌면 패널이 영상 아래 칸 맨 위로 옮겨진다', async () => {
    const extension = await startWithFakes()
    showLayout({ isTwoColumns: false })

    await notifyPageChanged(extension)

    expect(findBelow().firstElementChild).toBe(extension.findPanel())
  })

  it('좁은 배치에서 넓은 배치로 돌아오면 패널이 추천 영상 칸으로 돌아온다', async () => {
    const extension = await startWithFakes()
    showLayout({ isTwoColumns: false })
    await notifyPageChanged(extension)

    showLayout({ isTwoColumns: true })
    await notifyPageChanged(extension)

    expect(extension.findPanel().parentElement).toBe(findSecondaryInner())
  })

  it('좁은 배치에서 패널을 새로 그리면 영상 아래 칸 맨 위에 그린다', async () => {
    const extension = await startWithFakes()
    showLayout({ isTwoColumns: false })
    extension.findPanel().remove()

    await notifyPageChanged(extension)

    expect(findBelow().firstElementChild).toBe(extension.findPanel())
  })

  it('칸을 옮겨도 패널은 하나만 있다', async () => {
    const extension = await startWithFakes()
    showLayout({ isTwoColumns: false })

    await notifyPageChanged(extension)

    expect(document.querySelectorAll(`#${PANEL_ID}`)).toHaveLength(1)
  })

  it('영상 아래 칸에 있는 패널에는 영상 아래 표시가 붙는다', async () => {
    const extension = await startWithFakes()
    showLayout({ isTwoColumns: false })

    await notifyPageChanged(extension)

    expect(extension.findPanel().classList.contains(BELOW_VIDEO_CLASS)).toBe(true)
  })

  it('좁은 배치에서 새로 그린 패널에도 영상 아래 표시가 붙는다', async () => {
    const extension = await startWithFakes()
    showLayout({ isTwoColumns: false })
    extension.findPanel().remove()

    await notifyPageChanged(extension)

    expect(extension.findPanel().classList.contains(BELOW_VIDEO_CLASS)).toBe(true)
  })

  it('추천 영상 칸으로 돌아오면 영상 아래 표시가 떨어진다', async () => {
    const extension = await startWithFakes()
    showLayout({ isTwoColumns: false })
    await notifyPageChanged(extension)

    showLayout({ isTwoColumns: true })
    await notifyPageChanged(extension)

    expect(extension.findPanel().classList.contains(BELOW_VIDEO_CLASS)).toBe(false)
  })

  it('칸을 옮겨도 체크 해제한 트랙은 해제된 채로 남는다', async () => {
    const extension = await startWithFakes()
    loadTimeline(extension, COMMENT_TEXTS)
    toggleTrack(extension, 1)
    showLayout({ isTwoColumns: false })

    await notifyPageChanged(extension)

    expect(findRow(extension, 1).querySelector('input[type="checkbox"]').checked).toBe(false)
  })
})
