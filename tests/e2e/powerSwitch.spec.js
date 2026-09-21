import { test, expect } from '../fixtures/extensionContext.js'

const TIMELINE_COMMENT = ['00:01 첫 곡', '05:00 둘째 곡'].join('\n')
const PANEL = '#timeline-skip-panel'
const LOAD_BANNER = '.timeline-skip-load-banner'
const POWER_SWITCH = '#power-switch'

// 팝업은 툴바 아이콘을 눌러야 뜨는데 Playwright는 툴바를 누를 수 없다. 같은 주소를 탭으로 연다.
// 여기서 보는 것은 팝업이 쓴 값이 진짜 chrome.storage를 거쳐 열린 탭에 닿는지다.
test.describe('켜고 끄기', () => {
  test('팝업에서 끄면 열린 시청 페이지의 패널과 불러오기 띠가 사라지고, 켜면 돌아온다', async ({ extensionContext, openWatchPage }) => {
    const { page } = await openWatchPage({ commentTexts: [TIMELINE_COMMENT] })
    await expect(page.locator(PANEL)).toBeVisible()
    await expect(page.locator(LOAD_BANNER)).toBeVisible()
    const popup = await openPopup(extensionContext)

    await popup.locator(POWER_SWITCH).click()

    await expect(page.locator(PANEL)).toBeHidden()
    await expect(page.locator(LOAD_BANNER)).toBeHidden()

    await popup.locator(POWER_SWITCH).click()

    await expect(page.locator(PANEL)).toBeVisible()
    await expect(page.locator(LOAD_BANNER)).toBeVisible()
  })
})

async function openPopup(extensionContext) {
  const [serviceWorker] = extensionContext.serviceWorkers()
  const worker = serviceWorker ?? (await extensionContext.waitForEvent('serviceworker'))
  const extensionId = new URL(worker.url()).host
  const popup = await extensionContext.newPage()
  await popup.goto(`chrome-extension://${extensionId}/src/popup/popup.html`)

  return popup
}
