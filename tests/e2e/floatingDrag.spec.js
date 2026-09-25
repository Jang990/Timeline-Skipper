import { test, expect } from '../fixtures/extensionContext.js'
import { readCommentSnapshot } from '../fixtures/snapshots/commentSnapshot.js'

const { commentTexts } = readCommentSnapshot('3yG8GXdnEFQ')

const FLOATING = '#timeline-skip-floating'
const ICON = `${FLOATING} .timeline-skip-floating-icon`
const CARD = `${FLOATING} .timeline-skip-floating-card`
const HANDLE = `${FLOATING} .timeline-skip-floating-handle`

const MOVED_LEFT_PIXELS = 240
const MOVED_UP_PIXELS = 160
const ALLOWED_GAP_PIXELS = 1

// 끌어 옮기기의 여러 경우는 floatingDrag.test.js가 다룬다. 여기서는 진짜 포인터로 잡았을 때
// 위젯이 실제로 그 자리에 놓이는지만 본다. 자리 계산은 브라우저만 답할 수 있다.
test('제목 옆 손잡이를 잡아 끌면 위젯이 그 자리에 놓인다', async ({ openWatchPage }) => {
  const { page } = await openWatchPage({ commentTexts })
  await page.locator('.timeline-skip-load-button').first().click()
  await page.locator(ICON).click()

  const card = page.locator(CARD)
  await expect(card).toBeVisible()
  const before = await card.boundingBox()
  const handle = await page.locator(HANDLE).boundingBox()

  const grabXPixels = handle.x + handle.width / 2
  const grabYPixels = handle.y + handle.height / 2

  await page.mouse.move(grabXPixels, grabYPixels)
  await page.mouse.down()
  await page.mouse.move(grabXPixels - MOVED_LEFT_PIXELS, grabYPixels - MOVED_UP_PIXELS, { steps: 12 })
  await page.mouse.up()

  const after = await card.boundingBox()
  expect(Math.abs(after.x - (before.x - MOVED_LEFT_PIXELS))).toBeLessThanOrEqual(ALLOWED_GAP_PIXELS)
  expect(Math.abs(after.y - (before.y - MOVED_UP_PIXELS))).toBeLessThanOrEqual(ALLOWED_GAP_PIXELS)
})
