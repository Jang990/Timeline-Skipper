import { test, expect } from '../fixtures/extensionContext.js'
import { readCommentSnapshot } from '../fixtures/snapshots/commentSnapshot.js'

// 트랙 시작은 1, 269, 556, 810, 1026, 1253, 1508, 1795초다. 아래 숫자는 전부 이 목록에서 나온다.
const { commentTexts } = readCommentSnapshot('3yG8GXdnEFQ')

// 같은 버튼이 플로팅 위젯에도 있다. 위젯 쪽은 floating.spec.js가 다루므로 여기서는 패널로 좁힌다.
const PANEL = '#timeline-skip-panel'
const ROW = `${PANEL} .timeline-skip-row`
const PLAY_BUTTON = `${PANEL} [aria-label="재생"]`
const PAUSE_BUTTON = `${PANEL} [aria-label="일시정지"]`

test.describe('패널 재생 조작', () => {
  test('재생 버튼을 누르면 재생되고 버튼이 일시정지 아이콘으로 바뀐다', async ({ openWatchPage }) => {
    const { page } = await openWatchPage({ commentTexts })
    await loadTimeline(page)

    await page.locator(PLAY_BUTTON).click()

    await expect(page.locator(`${PAUSE_BUTTON} svg[data-icon="pause"]`)).toHaveCount(1)
    expect(await isPaused(page)).toBe(false)
  })
})

// 탐색은 영상 길이를 안 뒤에만 먹힌다. 불러오기 전에 그것부터 기다린다.
async function loadTimeline(page) {
  await expect
    .poll(() => page.evaluate(() => document.querySelector('video').readyState))
    .toBeGreaterThanOrEqual(1)

  await page.locator('.timeline-skip-load-button').first().click()
  await expect(page.locator(ROW).first()).toBeVisible()
}

function isPaused(page) {
  return page.evaluate(() => document.querySelector('video').paused)
}
