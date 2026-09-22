import { test, expect, WATCH_URL } from '../fixtures/extensionContext.js'
import { readCommentSnapshot } from '../fixtures/snapshots/commentSnapshot.js'

// 트랙이 8개인 댓글이다.
const { commentTexts } = readCommentSnapshot('3yG8GXdnEFQ')

const PANEL = '#timeline-skip-panel'
const ROW = `${PANEL} .timeline-skip-row`
const MORE_BUTTON = `${PANEL} .timeline-skip-header button[aria-label="더보기"]`
const SHARE_ITEM = `${PANEL} .timeline-skip-header [role="menuitem"]:has-text("트랙 복사")`

test.describe('트랙 복사', () => {
  // 클립보드는 진짜 브라우저에만 있다. 시스템 클립보드를 읽어 들어간 글을 확인한다.
  test('메뉴에서 트랙 복사를 누르면 시스템 클립보드에 꺼 둔 트랙까지 담긴 글이 들어가고 알림이 뜬다', async ({ extensionContext, openWatchPage }) => {
    await extensionContext.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: new URL(WATCH_URL).origin })
    const { page } = await openWatchPage({ commentTexts })
    await page.locator('.timeline-skip-load-button').first().click()
    await expect(page.locator(ROW)).toHaveCount(8)
    await page.locator(`${ROW} input[type="checkbox"]`).nth(2).click()
    await page.locator(MORE_BUTTON).click()

    await page.locator(SHARE_ITEM).click()

    await expect(page.locator('.timeline-skip-toast')).toHaveText('💬 복사했습니다. 댓글에 붙여넣어 다른 사람과 나눠 보세요')
    const trackLines = (await page.evaluate(() => navigator.clipboard.readText())).split('\n').slice(0, 8)
    expect(trackLines.filter((line) => line.includes(' [skip] '))).toHaveLength(1)
    expect(trackLines[2]).toMatch(/^\d{2}:\d{2} \[skip\] /)
  })
})
