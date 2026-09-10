import { test, expect } from '../fixtures/extensionContext.js'
import { readCommentSnapshot } from '../fixtures/snapshots/commentSnapshot.js'

// 다른 spec의 댓글은 파서가 좋아하는 모양으로 손으로 쓴 것이다. 이 spec만 실제 댓글 원문 위에서
// 돈다 — 번호가 붙은 제목, 점과 말줄임표, 타임라인이 아닌 잡댓글 여덟 개가 섞인 목록.
const { commentTexts } = readCommentSnapshot('3yG8GXdnEFQ')

const ROW = '.timeline-skip-row'
const TIME = '.timeline-skip-time'
const TITLE = '.timeline-skip-title'

test.describe('실제 댓글 스냅샷', () => {
  test('스냅샷 댓글을 불러오면 트랙 8개가 목록에 뜬다', async ({ openWatchPage }) => {
    const { page } = await openWatchPage({ commentTexts })

    await loadTimeline(page)

    await expect(page.locator(ROW)).toHaveCount(8)
  })

  test('첫 트랙은 00:01 01.Ballerino, 마지막 트랙은 29:55 08. 나란 놈은 답은 너다로 뜬다', async ({ openWatchPage }) => {
    const { page } = await openWatchPage({ commentTexts })

    await loadTimeline(page)

    const firstRow = page.locator(ROW).first()
    const lastRow = page.locator(ROW).last()

    await expect(firstRow.locator(TIME)).toHaveText('00:01')
    await expect(firstRow.locator(TITLE)).toHaveText('01.Ballerino')
    await expect(lastRow.locator(TIME)).toHaveText('29:55')
    await expect(lastRow.locator(TITLE)).toHaveText('08. 나란 놈은 답은 너다')
  })
})

async function loadTimeline(page) {
  await page.locator('.timeline-skip-load-button').first().click()
  await expect(page.locator(ROW).first()).toBeVisible()
}
