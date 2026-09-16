import { test, expect } from '../fixtures/extensionContext.js'
import { readCommentSnapshot } from '../fixtures/snapshots/commentSnapshot.js'

// 트랙이 8개인 댓글이다.
const { commentTexts } = readCommentSnapshot('3yG8GXdnEFQ')

const PANEL = '#timeline-skip-panel'
const ROW = `${PANEL} .timeline-skip-row`
const HEADER = `${PANEL} .timeline-skip-header`
const MORE_BUTTON = `${HEADER} button[aria-label="더보기"]`
const MENU = `${HEADER} [role="menu"]`
const HIDE_ITEM = `${MENU} [role="menuitem"]:has-text("위젯 숨기기")`
const SHOW_ITEM = `${MENU} [role="menuitem"]:has-text("위젯 보이기")`
const CLEAR_ITEM = `${MENU} [role="menuitem"]:has-text("목록 비우기")`

test.describe('헤더 더보기 메뉴', () => {
  test('헤더에 제목과 켠 트랙 수가 따로 보인다', async ({ openWatchPage }) => {
    const { page } = await openWatchPage({ commentTexts })
    await loadTimeline(page)

    await page.locator(ROW).nth(2).locator('input[type="checkbox"]').click()

    await expect(page.locator(`${HEADER} .timeline-skip-header-title`)).toHaveText('타임라인')
    await expect(page.locator(`${HEADER} .timeline-skip-header-count`)).toHaveText('7 / 8')
  })

  test('더보기 메뉴는 처음에 닫혀 있다', async ({ openWatchPage }) => {
    const { page } = await openWatchPage({ commentTexts })

    await loadTimeline(page)

    await expect(page.locator(MORE_BUTTON)).toBeVisible()
    await expect(page.locator(MENU)).toBeHidden()
  })

  test('더보기 버튼을 누르면 위젯 숨기기와 목록 비우기가 담긴 메뉴가 열린다', async ({ openWatchPage }) => {
    const { page } = await openWatchPage({ commentTexts })
    await loadTimeline(page)

    await page.locator(MORE_BUTTON).click()

    await expect(page.locator(MENU)).toBeVisible()
    await expect(page.locator(HIDE_ITEM)).toBeVisible()
    await expect(page.locator(CLEAR_ITEM)).toBeVisible()
  })

  test('더보기 버튼의 aria-expanded가 메뉴가 열렸는지를 따른다', async ({ openWatchPage }) => {
    const { page } = await openWatchPage({ commentTexts })
    await loadTimeline(page)
    await expect(page.locator(MORE_BUTTON)).toHaveAttribute('aria-expanded', 'false')

    await page.locator(MORE_BUTTON).click()
    await expect(page.locator(MORE_BUTTON)).toHaveAttribute('aria-expanded', 'true')

    await page.locator(MORE_BUTTON).click()
    await expect(page.locator(MORE_BUTTON)).toHaveAttribute('aria-expanded', 'false')
    await expect(page.locator(MENU)).toBeHidden()
  })

  test('메뉴에서 목록 비우기를 누르면 목록이 비고 메뉴가 닫힌다', async ({ openWatchPage }) => {
    const { page } = await openWatchPage({ commentTexts })
    await loadTimeline(page)
    await page.locator(MORE_BUTTON).click()

    await page.locator(CLEAR_ITEM).click()

    await expect(page.locator(ROW)).toHaveCount(0)
    await expect(page.locator(MENU)).toBeHidden()
  })

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

  test('트랙이 없어도 더보기 메뉴에서 위젯 숨기기를 누를 수 있다', async ({ openWatchPage }) => {
    const { page } = await openWatchPage({ commentTexts: [] })
    await page.locator(MORE_BUTTON).click()

    await page.locator(HIDE_ITEM).click()

    await page.locator(MORE_BUTTON).click()
    await expect(page.locator(SHOW_ITEM)).toBeVisible()
  })
})

async function loadTimeline(page) {
  await page.locator('.timeline-skip-load-button').first().click()
  await expect(page.locator(ROW).first()).toBeVisible()
}
