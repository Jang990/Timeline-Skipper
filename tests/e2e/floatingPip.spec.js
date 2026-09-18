import { test, expect } from '../fixtures/extensionContext.js'

const TIMELINE_COMMENT = ['00:00 첫 곡', '05:00 둘째 곡', '10:00 셋째 곡'].join('\n')

const FLOATING = '#timeline-skip-floating'
const CARD = `${FLOATING} .timeline-skip-floating-card`
const JUMP = `${FLOATING} .timeline-skip-floating-jump`

// 같은 기능의 여러 경우는 floatingPip.test.js가 본다. 여기서는 jsdom이 흉내 내지 못하는 것,
// 크롬이 창을 정말 띄우는지, 그 창에 확장의 스타일이 입혀지는지, 백그라운드가 탭을 정말 올리는지만 본다.
test.describe('PiP로 띄운 플로팅 위젯', () => {
  test('PiP로 띄우기를 누르면 확장의 스타일이 입혀진 위젯이 진짜 PiP 창에 뜬다', async ({ openWatchPage }) => {
    const { page, readConsoleErrors } = await openWatchPage({ commentTexts: [TIMELINE_COMMENT] })

    await openPictureInPicture(page)

    await expect(page.locator(FLOATING)).not.toBeAttached()
    await expect.poll(() => readCardInWindow(page)).toEqual({ display: 'flex', justifyContent: 'center' })
    expect(readConsoleErrors()).toEqual([])
  })

  test('PiP 창에서 목록 보기를 누르면 다른 탭에 가려져 있던 영상 탭이 앞으로 온다', async ({ openWatchPage, extensionContext }) => {
    const { page } = await openWatchPage({ commentTexts: [TIMELINE_COMMENT] })
    await openPictureInPicture(page)
    const watchTabId = await readActiveTabId(extensionContext)
    const otherPage = await extensionContext.newPage()
    await otherPage.bringToFront()
    await expect.poll(() => readActiveTabId(extensionContext)).not.toBe(watchTabId)

    await page.evaluate((jumpSelector) => {
      window.documentPictureInPicture.window.document.querySelector(jumpSelector).click()
    }, JUMP)

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
