import { test, expect } from '../fixtures/extensionContext.js'
import { readCommentSnapshot } from '../fixtures/snapshots/commentSnapshot.js'

// 트랙이 8개인 댓글이다.
const { commentTexts } = readCommentSnapshot('3yG8GXdnEFQ')

const PANEL = '#timeline-skip-panel'
const ROW = `${PANEL} .timeline-skip-row`
const HEADER = `${PANEL} .timeline-skip-header`
const MORE_BUTTON = `${HEADER} button[aria-label="더보기"]`
const MENU = `${HEADER} [role="menu"]`
test.describe('헤더 더보기 메뉴', () => {
  // 누른 항목이 숨겨지며 초점이 빠진다. 진짜 초점 이동에도 경고가 닫히지 않아야 비우기에 닿는다.
  test('Esc를 누르면 메뉴가 닫히고 초점이 더보기 버튼으로 돌아간다', async ({ openWatchPage }) => {
    const { page } = await openWatchPage({ commentTexts })
    await loadTimeline(page)
    await page.locator(MORE_BUTTON).click()
    await expect(page.locator(MENU)).toBeVisible()

    await page.keyboard.press('Escape')

    await expect(page.locator(MENU)).toBeHidden()
    await expect(page.locator(MORE_BUTTON)).toBeFocused()
  })

  test('메뉴 밖을 누르면 메뉴가 닫힌다', async ({ openWatchPage }) => {
    const { page } = await openWatchPage({ commentTexts })
    await loadTimeline(page)
    await page.locator(MORE_BUTTON).click()
    await expect(page.locator(MENU)).toBeVisible()

    await page.locator(`${HEADER} .timeline-skip-header-title`).click()

    await expect(page.locator(MENU)).toBeHidden()
  })
})

async function loadTimeline(page) {
  await page.locator('.timeline-skip-load-button').first().click()
  await expect(page.locator(ROW).first()).toBeVisible()
}
