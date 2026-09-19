// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { settle, startWithFakes } from '../fixtures/fakes/startWithFakes.js'
import { createFakePictureInPicture } from '../fixtures/fakes/fakePlatform.js'
import { find, findAll, loadTimeline } from '../fixtures/fakes/panelHelpers.js'

const TIMELINE_COMMENT = ['00:00 첫 곡', '05:00 둘째 곡', '10:00 셋째 곡'].join('\n')

const FLOATING = '#timeline-skip-floating'
const ICON = `${FLOATING} .timeline-skip-floating-icon`
const CARD = `${FLOATING} .timeline-skip-floating-card`
const TITLE = `${FLOATING} .timeline-skip-floating-title`
const COLLAPSE = `${FLOATING} .timeline-skip-floating-collapse`
const PICTURE_IN_PICTURE_BUTTON = `${FLOATING} button[aria-label="PiP로 띄우기"]`

// 진짜 창이 뜨는지, 창에 확장의 스타일이 입혀지는지는 floatingPip.spec.js가 맡는다.
describe('PiP로 띄운 플로팅 위젯', () => {
  it('펼친 위젯에 PiP로 띄우기 버튼이 있다', async () => {
    await startExpanded()

    expect(document.querySelector(PICTURE_IN_PICTURE_BUTTON)).not.toBeNull()
  })

  it('PiP를 지원하지 않으면 PiP로 띄우기 버튼이 없다', async () => {
    await startExpanded({ pictureInPicture: createFakePictureInPicture({ isSupported: false }) })

    expect(document.querySelector(CARD)).not.toBeNull()
    expect(document.querySelector(PICTURE_IN_PICTURE_BUTTON)).toBeNull()
  })

  it('PiP로 띄우기를 누르면 위젯이 PiP 창으로 옮겨가고 탭에서는 사라진다', async () => {
    const extension = await startExpanded()

    document.querySelector(PICTURE_IN_PICTURE_BUTTON).click()

    expect(document.querySelector(FLOATING)).toBeNull()
    expect(queryWindow(extension, CARD)).not.toBeNull()
  })

  it('PiP 창의 위젯에는 접기 버튼과 PiP 버튼이 없다', async () => {
    const extension = await startInWindow()

    expect(queryWindow(extension, COLLAPSE)).toBeNull()
    expect(queryWindow(extension, PICTURE_IN_PICTURE_BUTTON)).toBeNull()
  })

  it('PiP 창의 재생 버튼을 누르면 탭의 영상이 재생된다', async () => {
    const extension = await startInWindow()

    queryWindow(extension, `${CARD} [aria-label="재생"]`).click()

    expect(extension.player.isPaused()).toBe(false)
  })

  it('재생 시각이 흐르면 PiP 창의 제목이 재생 중인 트랙을 따라간다', async () => {
    const extension = await startInWindow()

    extension.player.playTo(700)

    expect(queryWindow(extension, TITLE).textContent).toBe('셋째 곡')
  })

  // jsdom에는 scrollIntoView가 없다. 스크롤은 floating.spec.js가 진짜 브라우저에서 본다.
  it('PiP 창에서 제목을 누르면 탭을 앞으로 가져오고 목록을 표시한다', async () => {
    const extension = await startInWindow()
    Element.prototype.scrollIntoView = () => {}

    queryWindow(extension, TITLE).click()
    await settle()

    expect(extension.tabFocus.getFocusCount()).toBe(1)
    expect(extension.findPanel().classList.contains('is-revealed')).toBe(true)
  })

  it('PiP 창을 닫으면 위젯이 탭으로 돌아온다', async () => {
    const extension = await startInWindow()

    extension.pictureInPicture.close()

    expect(document.querySelector(CARD)).not.toBeNull()
  })

  it('전체화면이 되어도 PiP 창의 위젯은 남는다', async () => {
    const extension = await startInWindow()

    extension.fullscreen.setFullscreen(true)

    expect(extension.pictureInPicture.getDocument()).not.toBeNull()
    expect(queryWindow(extension, CARD)).not.toBeNull()
  })

  it('목록을 비우면 PiP 창이 닫힌다', async () => {
    const extension = await startInWindow()

    clearList(extension)

    expect(extension.pictureInPicture.getDocument()).toBeNull()
    expect(document.querySelector(FLOATING)).toBeNull()
  })

  it('위젯 숨기기를 고르면 PiP 창이 닫힌다', async () => {
    const extension = await startInWindow()

    clickMenuItem(extension, '위젯 숨기기')

    expect(extension.pictureInPicture.getDocument()).toBeNull()
    expect(document.querySelector(FLOATING)).toBeNull()
  })
})

async function startExpanded(options) {
  const extension = await startWithFakes(options)
  loadTimeline(extension, [TIMELINE_COMMENT])
  document.querySelector(ICON).click()

  return extension
}

async function startInWindow() {
  const extension = await startExpanded()
  document.querySelector(PICTURE_IN_PICTURE_BUTTON).click()

  return extension
}

function queryWindow(extension, selector) {
  return extension.pictureInPicture.getDocument().querySelector(selector)
}

function clickMenuItem(extension, label) {
  find(extension, 'button[aria-label="더보기"]').click()
  findAll(extension, '[role="menuitem"]').find((item) => item.textContent === label).click()
}

function clearList(extension) {
  clickMenuItem(extension, '목록 비우기')
  findAll(extension, 'button').find((button) => button.textContent === '비우기').click()
}
