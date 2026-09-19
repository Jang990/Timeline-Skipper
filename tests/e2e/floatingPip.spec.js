import { test, expect } from '../fixtures/extensionContext.js'

const TIMELINE_COMMENT = ['00:00 첫 곡', '05:00 둘째 곡', '10:00 셋째 곡'].join('\n')

const FLOATING = '#timeline-skip-floating'
const CARD = `${FLOATING} .timeline-skip-floating-card`
const TITLE = `${FLOATING} .timeline-skip-floating-title`

// 창이 낮을 때 숨기는 것들. 순번, 진행 바 양옆 시간, 반복이다.
const COMPACT_HIDDEN = [
  '.timeline-skip-floating-meta',
  '.timeline-skip-now-playing-elapsed',
  '.timeline-skip-now-playing-length',
  '.timeline-skip-control.is-loop'
]

// 같은 기능의 여러 경우는 floatingPip.test.js가 본다. 여기서는 jsdom이 흉내 내지 못하는 것,
// 크롬이 창을 정말 띄우는지, 그 창에 확장의 스타일이 입혀지는지, 백그라운드가 탭을 정말 올리는지,
// 창 크기에 따라 모양이 바뀌는지만 본다.
test.describe('PiP로 띄운 플로팅 위젯', () => {
  // 고정 viewport를 두면 PiP 창도 그 크기로 늘어난다. 창의 진짜 크기로 봐야 간소화 모양이 나온다.
  test.use({ viewport: null })

  test('PiP 창은 300×64로 열리고 제목과 재생 버튼을 한 줄에, 진행 바를 그 아래 줄에 놓는다', async ({ openWatchPage }) => {
    const { page } = await openWatchPage({ commentTexts: [TIMELINE_COMMENT] })

    await openPictureInPicture(page)

    await expect.poll(() => readLayoutInWindow(page)).toEqual({
      windowSize: [300, 64],
      titleBesidePlayButton: true,
      progressBelowTitle: true,
      visibleExtras: []
    })
  })

  test('PiP 창을 키우면 순번·시간·반복이 있는 세 줄 모양으로 돌아간다', async ({ openWatchPage }) => {
    const { page } = await openWatchPage({ commentTexts: [TIMELINE_COMMENT] })
    await openPictureInPicture(page)

    await resizeWindow(page, 400, 300)

    const layout = await readLayoutInWindow(page)
    expect(layout.titleBesidePlayButton).toBe(false)
    expect(layout.progressBelowTitle).toBe(true)
    expect(layout.visibleExtras).toEqual(COMPACT_HIDDEN)
  })

  test('PiP로 띄우기를 누르면 확장의 스타일이 입혀진 위젯이 진짜 PiP 창에 뜬다', async ({ openWatchPage }) => {
    const { page, readConsoleErrors } = await openWatchPage({ commentTexts: [TIMELINE_COMMENT] })

    await openPictureInPicture(page)

    await expect(page.locator(FLOATING)).not.toBeAttached()
    await expect.poll(() => readCardInWindow(page)).toEqual({ display: 'flex', justifyContent: 'center' })
    expect(readConsoleErrors()).toEqual([])
  })

  test('PiP 창에서 제목을 누르면 다른 탭에 가려져 있던 영상 탭이 앞으로 온다', async ({ openWatchPage, extensionContext }) => {
    const { page } = await openWatchPage({ commentTexts: [TIMELINE_COMMENT] })
    await openPictureInPicture(page)
    const watchTabId = await readActiveTabId(extensionContext)
    const otherPage = await extensionContext.newPage()
    await otherPage.bringToFront()
    await expect.poll(() => readActiveTabId(extensionContext)).not.toBe(watchTabId)

    await page.evaluate((titleSelector) => {
      window.documentPictureInPicture.window.document.querySelector(titleSelector).click()
    }, TITLE)

    await expect.poll(() => readActiveTabId(extensionContext)).toBe(watchTabId)
    await expect(page.locator('#timeline-skip-panel')).toHaveClass(/is-revealed/)
  })
})

async function openPictureInPicture(page) {
  await page.locator('.timeline-skip-load-button').first().click()
  await page.locator(`${FLOATING} .timeline-skip-floating-icon`).click()
  await page.locator(`${FLOATING} button[aria-label="PiP로 띄우기"]`).click()
  await expect.poll(() => readCardInWindow(page)).not.toBeNull()
}

// PiP 창은 Playwright의 page로 잡히지 않는다. 탭 문서에서 창을 거쳐 들여다본다.
// display는 floating.css가, 가운데 정렬은 floatingPip.css가 입힌 값이다.
function readCardInWindow(page) {
  return page.evaluate((cardSelector) => {
    const card = window.documentPictureInPicture.window?.document.querySelector(cardSelector)

    if (card == null) {
      return null
    }

    const { display, justifyContent } = getComputedStyle(card)

    return { display, justifyContent }
  }, CARD)
}

// 같은 줄인지는 제목의 세로 가운데가 재생 버튼의 위아래 사이에 드는지로 가린다.
function readLayoutInWindow(page) {
  return page.evaluate(({ floatingSelector, extraSelectors }) => {
    const pictureInPictureWindow = window.documentPictureInPicture.window
    const root = pictureInPictureWindow.document.querySelector(floatingSelector)
    const title = root.querySelector('.timeline-skip-floating-title').getBoundingClientRect()
    const playButton = root.querySelector('.timeline-skip-control.is-primary').getBoundingClientRect()
    const progressBar = root.querySelector('.timeline-skip-now-playing-bar').getBoundingClientRect()
    const titleMiddle = title.top + title.height / 2

    return {
      windowSize: [pictureInPictureWindow.innerWidth, pictureInPictureWindow.innerHeight],
      titleBesidePlayButton: playButton.top <= titleMiddle && titleMiddle <= playButton.bottom,
      progressBelowTitle: progressBar.top >= title.bottom,
      visibleExtras: extraSelectors.filter((selector) => root.querySelector(selector).checkVisibility())
    }
  }, { floatingSelector: FLOATING, extraSelectors: COMPACT_HIDDEN })
}

// 크롬은 사람의 손길 안에서만 PiP 창의 크기를 바꿔 준다. Playwright는 PiP 창을 누를 수 없어서
// 탭에 버튼을 붙여 누른다.
async function resizeWindow(page, outerWidth, outerHeight) {
  await page.evaluate(([width, height]) => {
    const button = document.createElement('button')
    button.id = 'resize-picture-in-picture'
    button.style.cssText = 'position: fixed; top: 0; left: 0; z-index: 99999'
    button.textContent = '창 키우기'
    button.addEventListener('click', () => window.documentPictureInPicture.window.resizeTo(width, height))
    document.body.append(button)
  }, [outerWidth, outerHeight])

  await page.locator('#resize-picture-in-picture').click()
  await expect.poll(() => page.evaluate(() => window.documentPictureInPicture.window.innerHeight)).toBeGreaterThan(100)
}

// 어느 탭이 앞에 있는지는 탭 안에서 알 수 없다. headless에서는 가려진 탭도 visible이라고 답한다.
// 그래서 확장의 백그라운드에 묻는다. tabs 권한이 없어 주소는 못 읽으므로 탭 id로 가린다.
async function readActiveTabId(extensionContext) {
  const [serviceWorker] = extensionContext.serviceWorkers()
  const worker = serviceWorker ?? (await extensionContext.waitForEvent('serviceworker'))

  return worker.evaluate(async () => {
    const [activeTab] = await chrome.tabs.query({ active: true, windowType: 'normal' })

    return activeTab?.id ?? null
  })
}
